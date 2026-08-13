const { WebSocketServer } = require('ws')
const Y = require('yjs')
const { encoding, decoding } = require('lib0')
const syncProtocol = require('y-protocols/sync')
const awarenessProtocol = require('y-protocols/awareness')
const mongoose = require('mongoose')

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1
const MESSAGE_QUERY_AWARENESS = 3

const Document = require('../models/Document')
const { astToYdoc, ydocToAst } = require('./astAdapter')
const { sanitizeBlocks } = require('../security/sanitize')

const PERSIST_DEBOUNCE_MS = 400
const rooms = new Map()
const persistTimers = new Map()

function roomFor(docId) {
  let room = rooms.get(docId)
  if (!room) {
    room = {
      ydoc: new Y.Doc(),
      awareness: null,
      conns: new Set(),
      loaded: false,
      loadPromise: null
    }
    rooms.set(docId, room)
  }
  return room
}

async function loadRoom(room, docId) {
  if (room.loaded) return
  if (!room.loadPromise) {
    room.loadPromise = (async () => {
      let doc = null
      if (mongoose.Types.ObjectId.isValid(docId)) {
        doc = await Document.findById(docId)
      }
      const loaded = astToYdoc(doc ? { title: doc.title, nodes: doc.nodes } : { title: 'Untitled' })
      const update = Y.encodeStateAsUpdate(loaded)
      Y.applyUpdate(room.ydoc, update)
      loaded.destroy()

      room.ydoc.on('update', (update, origin) => {
        broadcastUpdate(room, update, origin)
        schedulePersist(docId, room.ydoc)
      })

      room.awareness = new awarenessProtocol.Awareness(room.ydoc)
      room.loaded = true
    })()
  }
  return room.loadPromise
}

function broadcastUpdate(room, update, origin) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_SYNC)
  syncProtocol.writeUpdate(encoder, update)
  const message = encoding.toUint8Array(encoder)
  for (const conn of room.conns) {
    if (conn !== origin) {
      try { conn.send(message) } catch (e) { /* dropped */ }
    }
  }
}

function schedulePersist(docId, ydoc) {
  clearTimeout(persistTimers.get(docId))
  persistTimers.set(
    docId,
    setTimeout(() => persistRoom(docId, ydoc), PERSIST_DEBOUNCE_MS)
  )
}

async function persistRoom(docId, ydoc) {
  try {
    const ast = ydocToAst(ydoc)
    ast.nodes = sanitizeBlocks(ast.nodes)
    let doc = null
    if (mongoose.Types.ObjectId.isValid(docId)) {
      doc = await Document.findById(docId)
    }
    if (!doc) return
    doc.title = ast.title || doc.title
    doc.nodes = ast.nodes
    await doc.save()
  } catch (e) {
    console.error(`[sync] persist failed ${docId}: ${e.message}`)
  }
}

function sendAwarenessTo(ws, awareness, keys) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
  encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, keys))
  ws.send(encoding.toUint8Array(encoder))
}

function handleConnection(ws, req) {
  const url = new URL(req.url, 'http://localhost')
  const docId = decodeURIComponent(url.pathname.replace(/^\/ws\/?/, ''))
  if (!docId) {
    ws.close(4000, 'missing document id')
    return
  }

  const room = roomFor(docId)
  const pending = []
  let loaded = false

  const handleMessage = (ws, data) => {
    const encoder = encoding.createEncoder()
    const decoder = decoding.createDecoder(new Uint8Array(data))
    const messageType = decoding.readVarUint(decoder)
    switch (messageType) {
      case MESSAGE_SYNC:
        encoding.writeVarUint(encoder, MESSAGE_SYNC)
        syncProtocol.readSyncMessage(decoder, encoder, room.ydoc, ws)
        if (encoding.length(encoder) > 1) ws.send(encoding.toUint8Array(encoder))
        break
      case MESSAGE_AWARENESS:
        awarenessProtocol.applyAwarenessUpdate(room.awareness, decoding.readVarUint8Array(decoder), ws)
        break
      case MESSAGE_QUERY_AWARENESS:
        sendAwarenessTo(ws, room.awareness, Array.from(room.awareness.getStates().keys()))
        break
      default:
        break
    }
  }

  ws.on('message', (data) => {
    if (loaded) {
      handleMessage(ws, data)
    } else {
      pending.push(data)
    }
  })

  loadRoom(room, docId)
    .then(() => {
      loaded = true
      room.conns.add(ws)
      const { awareness } = room

      const clients = Array.from(awareness.getStates().keys())
      if (clients.length) sendAwarenessTo(ws, awareness, clients)

      const onAwareness = ({ added, updated, removed }, origin) => {
        const changed = added.concat(updated).concat(removed)
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
        encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changed))
        const message = encoding.toUint8Array(encoder)
        for (const conn of room.conns) {
          if (conn !== origin) {
            try { conn.send(message) } catch (e) { /* dropped */ }
          }
        }
      }
      awareness.on('update', onAwareness)

      for (const data of pending.splice(0)) handleMessage(ws, data)

      ws.on('close', () => {
        room.conns.delete(ws)
        awarenessProtocol.removeAwarenessStates(awareness, [ws], null)
        awareness.off('update', onAwareness)
      })
    })
    .catch((e) => {
      console.error(`[sync] load failed ${docId}: ${e.message}`)
      ws.close(1011, 'document load failed')
    })
}

function attachSyncServer(server) {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (req, socket, head) => {
    if (req.url && req.url.startsWith('/ws/')) {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
    } else {
      socket.destroy()
    }
  })

  wss.on('connection', handleConnection)
}

module.exports = { attachSyncServer }

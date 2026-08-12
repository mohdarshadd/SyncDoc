const { WebSocketServer } = require('ws')
const Y = require('yjs')
const { encoding, decoding } = require('lib0')
const syncProtocol = require('y-protocols/sync')
const awarenessProtocol = require('y-protocols/awareness')
const mongoose = require('mongoose')

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
  encoding.writeVarUint(encoder, syncProtocol.messageSync)
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

function handleConnection(ws, req) {
  const url = new URL(req.url, 'http://localhost')
  const docId = decodeURIComponent(url.pathname.replace(/^\/ws\/?/, ''))
  if (!docId) {
    ws.close(4000, 'missing document id')
    return
  }

  const room = roomFor(docId)
  loadRoom(room, docId)
    .then(() => {
      room.conns.add(ws)
      const { ydoc, awareness } = room

      const clients = Array.from(awareness.getStates().keys())
      if (clients.length) {
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, syncProtocol.messageAwareness)
        encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, clients))
        ws.send(encoding.toUint8Array(encoder))
      }

      const onAwareness = ({ added, updated, removed }, origin) => {
        const changed = added.concat(updated).concat(removed)
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, syncProtocol.messageAwareness)
        encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changed))
        const message = encoding.toUint8Array(encoder)
        for (const conn of room.conns) {
          if (conn !== origin) {
            try { conn.send(message) } catch (e) { /* dropped */ }
          }
        }
      }
      awareness.on('update', onAwareness)

      ws.on('message', (data) => {
        const encoder = encoding.createEncoder()
        const decoder = decoding.createDecoder(new Uint8Array(data))
        const messageType = decoding.readVarUint(decoder)
        switch (messageType) {
          case syncProtocol.messageSync:
            encoding.writeVarUint(encoder, syncProtocol.messageSync)
            syncProtocol.readSyncMessage(decoder, encoder, ydoc, ws)
            if (encoding.length(encoder) > 1) ws.send(encoding.toUint8Array(encoder))
            break
          case syncProtocol.messageAwareness:
            awarenessProtocol.applyAwarenessUpdate(awareness, decoding.readVarUint8Array(decoder), ws)
            break
          default:
            break
        }
      })

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

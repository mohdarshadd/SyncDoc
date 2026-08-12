const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const http = require('http')
const express = require('express')
const mongoose = require('mongoose')
const Y = require('yjs')
const { WebSocket } = require('ws')
const { encoding, decoding } = require('lib0')
const syncProtocol = require('y-protocols/sync')
const awarenessProtocol = require('y-protocols/awareness')

const { MongoMemoryServer } = require('mongodb-memory-server')

const documentsRouter = require('../src/routes/documents')
const { attachSyncServer } = require('../src/sync/server')
const Document = require('../src/models/Document')

const runIntegration = process.env.INTEGRATION === '1'

let mongod
let server
let baseUrl
let wsUrl
let docId

before(async () => {
  if (!runIntegration) return
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri('syncdoc'))

  const app = express()
  app.use(express.json())
  app.use('/api', documentsRouter)
  server = http.createServer(app)
  attachSyncServer(server)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`
  wsUrl = `ws://127.0.0.1:${port}`

  const created = await fetch(`${baseUrl}/api/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Stress Spec', author: 'tester' })
  })
  const doc = await created.json()
  docId = doc._id

  const seeded = await Document.findById(docId)
  seeded.nodes = [
    { type: 'heading', text: 'Stress', attrs: { level: 1 } },
    { type: 'paragraph', text: 'seed-1' },
    { type: 'paragraph', text: 'seed-2' }
  ]
  await seeded.save()
})

after(async () => {
  if (!runIntegration) return
  await mongoose.disconnect()
  await new Promise((resolve) => server.close(resolve))
  await mongod.stop()
})

function makeClient() {
  const ydoc = new Y.Doc()
  const awareness = new awarenessProtocol.Awareness(ydoc)
  const ws = new WebSocket(`${wsUrl}/ws/${docId}`)

  const send = (type, write) => {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, type)
    write(encoder)
    ws.send(encoding.toUint8Array(encoder))
  }

  ws.on('open', () => {
    send(syncProtocol.messageSync, (e) => syncProtocol.writeSyncStep1(e, ydoc))
    awareness.setLocalState({ user: { name: 'client', color: '#fff' } })
  })

  ydoc.on('update', (update, origin) => {
    if (origin !== ws) send(syncProtocol.messageSync, (e) => syncProtocol.writeUpdate(e, update))
  })

  awareness.on('update', ({ added, updated, removed }, origin) => {
    if (origin !== ws) {
      const changed = added.concat(updated).concat(removed)
      send(syncProtocol.messageAwareness, (e) =>
        encoding.writeVarUint8Array(e, awarenessProtocol.encodeAwarenessUpdate(awareness, changed))
      )
    }
  })

  ws.on('message', (data) => {
    const decoder = decoding.createDecoder(new Uint8Array(data))
    const type = decoding.readVarUint(decoder)
    if (type === syncProtocol.messageSync) {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, syncProtocol.messageSync)
      syncProtocol.readSyncMessage(decoder, encoder, ydoc, ws)
      if (encoding.length(encoder) > 1) ws.send(encoding.toUint8Array(encoder))
    } else if (type === syncProtocol.messageAwareness) {
      awarenessProtocol.applyAwarenessUpdate(awareness, decoding.readVarUint8Array(decoder), ws)
    }
  })

  return { ydoc, awareness, ws }
}

function blockTexts(ydoc) {
  return ydoc
    .getArray('blocks')
    .toArray()
    .map((m) => m.get('text'))
    .sort()
}

function waitFor(predicate, timeout = 5000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (predicate()) return resolve()
      if (Date.now() - start > timeout) return reject(new Error('timed out waiting for condition'))
      setTimeout(tick, 25)
    }
    tick()
  })
}

test('REST creates documents and imports markdown', { skip: !runIntegration }, async () => {
  const res = await fetch(`${baseUrl}/api/import/markdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Imported', markdown: '# H\n\nBody\n\n```js\nx\n```' })
  })
  assert.equal(res.status, 201)
  const doc = await res.json()
  assert.equal(doc.blocks.length, 3)

  const list = await (await fetch(`${baseUrl}/api/documents`)).json()
  assert.ok(list.some((d) => d._id === docId))
})

test('10 concurrent WS clients converge and every edit persists to Mongo', { skip: !runIntegration }, async () => {
  const N = 10
  const clients = Array.from({ length: N }, makeClient)

  try {
    await waitFor(() => clients.every((c) => blockTexts(c.ydoc).includes('seed-1')))
  } catch (e) {
    throw new Error('clients failed to sync initial document')
  }

  for (let i = 0; i < N; i++) {
    clients[i].ydoc.transact(() => {
      const arr = clients[i].ydoc.getArray('blocks')
      const m = new Y.Map()
      m.set('id', `c-${i}`)
      m.set('type', 'paragraph')
      m.set('text', `concurrent edit ${i}`)
      m.set('parentId', null)
      m.set('order', arr.length)
      arr.insert(arr.length, [m])
    })
  }

  await waitFor(() => clients.every((c) => blockTexts(c.ydoc).length === 3 + N))

  const reference = JSON.stringify(clients[0].ydoc.getArray('blocks').toArray().map((m) => m.get('text')).sort())
  for (const c of clients) {
    const texts = JSON.stringify(blockTexts(c.ydoc))
    assert.equal(texts, reference, 'clients diverged')
  }

  await new Promise((r) => setTimeout(r, 1200))
  const persisted = await Document.findById(docId)
  assert.equal(persisted.title, 'Stress Spec')
  const savedTexts = persisted.nodes.map((n) => n.text).sort()
  assert.equal(savedTexts.length, 3 + N)
  for (let i = 0; i < N; i++) assert.ok(savedTexts.includes(`concurrent edit ${i}`), `missing edit ${i}`)
  assert.ok(savedTexts.includes('seed-1') && savedTexts.includes('seed-2'))
  assert.ok(persisted.revision > 0)

  for (const c of clients) {
    c.awareness.destroy()
    c.ws.close()
  }
})

test('exports produce sanitized HTML, markdown, and PDF', { skip: !runIntegration }, async () => {
  const html = await (await fetch(`${baseUrl}/api/documents/${docId}/export/html`)).text()
  assert.ok(html.includes('Stress'))
  assert.ok(!html.includes('<script'))

  const md = await (await fetch(`${baseUrl}/api/documents/${docId}/export/markdown`)).text()
  assert.ok(md.includes('seed-1'))

  const pdf = await (await fetch(`${baseUrl}/api/documents/${docId}/export/pdf`)).arrayBuffer()
  assert.equal(Buffer.from(pdf).subarray(0, 5).toString(), '%PDF-')
})

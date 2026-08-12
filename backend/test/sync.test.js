const { test } = require('node:test')
const assert = require('node:assert/strict')
const Y = require('yjs')

const { astToYdoc, ydocToAst } = require('../src/sync/astAdapter')

function blocksOf(ydoc) {
  return ydoc
    .getArray('blocks')
    .toArray()
    .map((m) => ({ id: m.get('id'), text: m.get('text') }))
    .sort((a, b) => (a.id < b.id ? -1 : 1))
}

function addBlock(ydoc, id, text) {
  ydoc.transact(() => {
    const arr = ydoc.getArray('blocks')
    const block = new Y.Map()
    block.set('id', id)
    block.set('type', 'paragraph')
    block.set('text', text)
    block.set('parentId', null)
    block.set('order', arr.length)
    arr.insert(arr.length, [block])
  })
}

test('astAdapter round-trips AST tree through Y.Doc', () => {
  const nodes = [
    { type: 'heading', text: 'Title', attrs: { level: 1 }, nid: 'a' },
    { type: 'paragraph', text: 'Body', nid: 'b' },
    { type: 'code', text: 'x', lang: 'js', nid: 'c' }
  ]
  const doc = { title: 'Spec', nodes }
  const ydoc = astToYdoc(doc)
  const out = ydocToAst(ydoc)
  assert.equal(out.title, 'Spec')
  assert.equal(out.nodes.length, 3)
  assert.deepEqual(out.nodes.map((n) => n.text), ['Title', 'Body', 'x'])
  assert.equal(out.nodes[0].attrs.level, 1)
  assert.equal(out.nodes[2].lang, 'js')
})

test('convergence stress: 10 concurrent clients, zero lost edits', () => {
  const N = 10
  const master = astToYdoc({ title: 'Shared', nodes: [
    { type: 'paragraph', text: 'seed-0', nid: 'seed-0' }
  ] })
  const seedUpdate = Y.encodeStateAsUpdate(master)

  const clients = Array.from({ length: N }, (_, i) => {
    const ydoc = new Y.Doc()
    Y.applyUpdate(ydoc, seedUpdate)
    addBlock(ydoc, `client-${i}`, `edit from client ${i}`)
    return ydoc
  })

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i === j) continue
      Y.applyUpdate(clients[i], Y.encodeStateAsUpdate(clients[j]))
    }
  }

  const expected = new Set(['seed-0', ...Array.from({ length: N }, (_, i) => `edit from client ${i}`)])
  for (const c of clients) {
    const texts = blocksOf(c).map((b) => b.text)
    assert.equal(texts.length, N + 1, `client lost blocks: ${JSON.stringify(texts)}`)
    for (const t of expected) assert.ok(texts.includes(t), `missing "${t}"`)
  }

  const first = JSON.stringify(blocksOf(clients[0]))
  for (const c of clients) assert.equal(JSON.stringify(blocksOf(c)), first, 'clients did not converge')
})

test('concurrent text edit on the same block resolves deterministically', () => {
  const master = astToYdoc({ title: 'Shared', nodes: [
    { type: 'paragraph', text: 'original', nid: 'b0' }
  ] })
  const seedUpdate = Y.encodeStateAsUpdate(master)

  const a = new Y.Doc()
  const b = new Y.Doc()
  Y.applyUpdate(a, seedUpdate)
  Y.applyUpdate(b, seedUpdate)

  a.transact(() => {
    a.getArray('blocks').forEach((m) => { if (m.get('id') === 'b0') m.set('text', 'alpha version') })
  })
  b.transact(() => {
    b.getArray('blocks').forEach((m) => { if (m.get('id') === 'b0') m.set('text', 'bravo version') })
  })

  Y.applyUpdate(a, Y.encodeStateAsUpdate(b))
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a))

  const textA = blocksOf(a).find((x) => x.id === 'b0').text
  const textB = blocksOf(b).find((x) => x.id === 'b0').text
  assert.equal(textA, textB, 'same block diverged after conflict')
  assert.ok(['alpha version', 'bravo version'].includes(textA), 'edit was lost entirely')
  assert.deepEqual(blocksOf(a), blocksOf(b))
})

test('concurrent structural insert at same index keeps both blocks', () => {
  const master = astToYdoc({ title: 'Shared', nodes: [] })
  const seedUpdate = Y.encodeStateAsUpdate(master)

  const a = new Y.Doc()
  const b = new Y.Doc()
  Y.applyUpdate(a, seedUpdate)
  Y.applyUpdate(b, seedUpdate)

  addBlock(a, 'a-1', 'paragraph from A')
  addBlock(b, 'b-1', 'code block from B')

  Y.applyUpdate(a, Y.encodeStateAsUpdate(b))
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a))

  assert.deepEqual(blocksOf(a), blocksOf(b))
  const texts = blocksOf(a).map((x) => x.text)
  assert.ok(texts.includes('paragraph from A'))
  assert.ok(texts.includes('code block from B'))
})

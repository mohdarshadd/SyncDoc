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

test('astAdapter round-trips collapsed subtree state', () => {
  const nodes = [
    { type: 'paragraph', text: 'Root', nid: 'root', collapsed: true, children: [
      { type: 'paragraph', text: 'Child', nid: 'child', parentId: 'root' }
    ] }
  ]
  const doc = { title: 'Fold', nodes }
  const ydoc = astToYdoc(doc)
  const out = ydocToAst(ydoc)
  assert.equal(out.nodes[0].collapsed, true)
  assert.equal(out.nodes[0].children[0].text, 'Child')
  assert.equal(out.nodes[0].children[0].collapsed, false)
})

test('collapsed toggles live on the same Y.Map and round-trip', () => {
  const ydoc = astToYdoc({ title: 'T', nodes: [{ type: 'paragraph', text: 'p', nid: 'a' }] })
  ydoc.transact(() => {
    const arr = ydoc.getArray('blocks')
    arr.forEach((m) => { if (m.get('id') === 'a') m.set('collapsed', true) })
  })
  const out = ydocToAst(ydoc)
  assert.equal(out.nodes[0].collapsed, true)
})

test('comments round-trip from document through Y.Doc', () => {
  const comments = [
    { id: 'c1', blockId: 'a', from: 0, to: 2, authorId: 'u1', authorName: 'Arshad', text: '@[Neha](c9) noted this', created: 123, resolved: false },
    { id: 'c2', blockId: 'a', from: 2, to: 5, authorId: 'u2', authorName: 'Neha', text: 'Fixed.', created: 456, resolved: true }
  ]
  const doc = { title: 'T', nodes: [{ type: 'paragraph', text: 'hello', nid: 'a' }], comments }
  const ydoc = astToYdoc(doc)
  const out = ydocToAst(ydoc)
  assert.deepEqual(out.comments, comments)
})

test('comments added to the Y array converge across clients', () => {
  const master = astToYdoc({ title: 'T', nodes: [{ type: 'paragraph', text: 'p', nid: 'a' }], comments: [{ id: 'c0', blockId: 'a', from: 0, to: 1, authorId: 'u', authorName: 'A', text: 'seed', created: 1, resolved: false }] })
  const seed = Y.encodeStateAsUpdate(master)

  const a = new Y.Doc()
  const b = new Y.Doc()
  Y.applyUpdate(a, seed)
  Y.applyUpdate(b, seed)

  a.transact(() => {
    const arr = a.getArray('comments')
    const m = new Y.Map()
    m.set('id', 'ca')
    m.set('blockId', 'a')
    m.set('from', 1)
    m.set('to', 2)
    m.set('authorId', 'u')
    m.set('authorName', 'A')
    m.set('text', 'from A')
    m.set('created', 2)
    m.set('resolved', false)
    arr.insert(arr.length, [m])
  })
  b.transact(() => {
    const arr = b.getArray('comments')
    arr.forEach((m) => { if (m.get('id') === 'c0') m.set('resolved', true) })
  })

  Y.applyUpdate(a, Y.encodeStateAsUpdate(b))
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a))

  const idsA = a.getArray('comments').toArray().map((m) => m.get('id'))
  const idsB = b.getArray('comments').toArray().map((m) => m.get('id'))
  assert.deepEqual(idsA.sort(), idsB.sort())
  assert.ok(idsA.includes('ca'))
  const resolved = b.getArray('comments').toArray().find((m) => m.get('id') === 'c0').get('resolved')
  assert.equal(resolved, true)
})

test('empty doc produces no comments array items', () => {
  const ydoc = astToYdoc({ title: 'T', nodes: [] })
  assert.equal(ydoc.getArray('comments').length, 0)
  assert.deepEqual(ydocToAst(ydoc).comments, [])
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

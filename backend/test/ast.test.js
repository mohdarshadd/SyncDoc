const { test } = require('node:test')
const assert = require('node:assert/strict')

const {
  NODE_TYPES,
  MAX_DEPTH,
  normalizeTree,
  validateAstTree,
  flattenAst,
  buildTree
} = require('../src/validators/ast')

const paragraph = (over = {}) => ({ type: 'paragraph', text: 'x', ...over })

test('valid tree passes validation', () => {
  assert.equal(
    validateAstTree([
      paragraph({ nid: 'a' }),
      { type: 'heading', text: 'H', nid: 'b', attrs: { level: 2 } },
      { type: 'list', text: '', nid: 'c', children: [paragraph({ nid: 'd', parentId: 'c' })] }
    ]),
    true
  )
})

test('rejects invalid node type', () => {
  assert.throws(() => validateAstTree([{ nid: 'a', type: 'widget' }]), /invalid node type/)
})

test('rejects nested depth beyond MAX_DEPTH', () => {
  const deep = { type: 'paragraph', nid: '0' }
  let cursor = deep
  for (let i = 1; i <= MAX_DEPTH + 1; i++) {
    cursor.children = [{ type: 'paragraph', nid: String(i) }]
    cursor = cursor.children[0]
  }
  assert.throws(() => validateAstTree([deep]), /max nesting depth/)
})

test('rejects duplicate node ids', () => {
  assert.throws(
    () => validateAstTree([paragraph({ nid: 'dup' }), paragraph({ nid: 'dup' })]),
    /duplicate node id/
  )
})

test('rejects node that is its own parent', () => {
  assert.throws(() => validateAstTree([paragraph({ nid: 'self', parentId: 'self' })]), /own parent/)
})

test('rejects parentId referencing a missing node', () => {
  assert.throws(
    () => validateAstTree([paragraph({ nid: 'a', parentId: 'ghost' })]),
    /references missing node/
  )
})

test('rejects invalid heading level', () => {
  assert.throws(
    () => validateAstTree([{ type: 'heading', text: 'H', nid: 'a', attrs: { level: 9 } }]),
    /heading level/
  )
})

test('normalizeTree assigns nid, parentId, and order recursively', () => {
  const nodes = [
    paragraph({ text: 'root' }),
    { type: 'code', text: 'code', lang: 'js', children: [paragraph({ text: 'child' })] }
  ]
  normalizeTree(nodes)
  assert.ok(nodes[0].nid)
  assert.equal(nodes[0].parentId, null)
  assert.equal(nodes[0].order, 0)
  assert.equal(nodes[1].order, 1)
  assert.equal(nodes[1].children[0].parentId, nodes[1].nid)
  assert.equal(nodes[1].children[0].order, 0)
})

test('flatten then build round-trips nesting and order', () => {
  const nodes = [
    paragraph({ text: 'a' }),
    { type: 'list', text: '', children: [paragraph({ text: 'b' }), paragraph({ text: 'c' })] },
    paragraph({ text: 'd' })
  ]
  const flat = flattenAst(nodes)
  assert.equal(flat.length, 5)
  assert.equal(flat[0].parentId, null)
  assert.equal(flat[1].parentId, null)
  assert.equal(flat[2].parentId, flat[1].id)
  assert.equal(flat[3].parentId, flat[1].id)
  assert.equal(flat[4].parentId, null)

  const rebuilt = buildTree(flat)
  assert.equal(rebuilt.length, 3)
  assert.equal(rebuilt[0].text, 'a')
  assert.equal(rebuilt[1].type, 'list')
  assert.equal(rebuilt[1].children.length, 2)
  assert.equal(rebuilt[1].children[0].text, 'b')
  assert.equal(rebuilt[2].text, 'd')
})

test('flattened ids stay stable across normalize/round-trip', () => {
  const nodes = [paragraph({ text: 'x' })]
  normalizeTree(nodes)
  const flat = flattenAst(nodes)
  assert.equal(flat[0].id, nodes[0].nid)
})

test('NODE_TYPES exposes the documented block types', () => {
  for (const t of ['heading', 'paragraph', 'code', 'list', 'quote', 'image', 'divider', 'checklist', 'toggle']) {
    assert.ok(NODE_TYPES.includes(t))
  }
})

test('checklist and toggle nodes validate and preserve checked/open', () => {
  const nodes = [
    { type: 'checklist', text: 'soon', checked: false },
    { type: 'toggle', text: 'fold', checked: true, open: false }
  ]
  assert.equal(validateAstTree(nodes), true)
  const flat = flattenAst(nodes)
  assert.equal(flat[0].type, 'checklist')
  assert.equal(flat[0].checked, false)
  assert.equal(flat[1].type, 'toggle')
  assert.equal(flat[1].checked, true)
  assert.equal(flat[1].open, false)
  const tree = buildTree(flat)
  assert.equal(tree[1].checked, true)
  assert.equal(tree[1].open, false)
})

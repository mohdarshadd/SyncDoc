const { test } = require('node:test')
const assert = require('node:assert/strict')

const { diffVersions, charDiff } = require('../src/lib/versionDiff')

const para = (id, text) => ({ id, type: 'paragraph', text, lang: null, checked: false, open: true, collapsed: false, attrs: {}, parentId: null, order: 0, children: [] })
const head = (id, text) => ({ id, type: 'heading', text, lang: null, checked: false, open: true, collapsed: false, attrs: { level: 2 }, parentId: null, order: 0, children: [] })

function kinds(rows) {
  return rows.map((r) => r.kind)
}

test('charDiff returns empty eq for identical strings', () => {
  assert.deepEqual(charDiff('hello', 'hello'), [{ t: 'eq', s: 'hello' }])
})

test('charDiff isolates an inserted word', () => {
  const segs = charDiff('the cat slept', 'the lazy cat slept')
  const addParts = segs.filter((s) => s.t === 'add').map((s) => s.s).join('')
  assert.equal(addParts, 'lazy ')
})

test('charDiff isolates deleted characters', () => {
  const segs = charDiff('hello world', 'hello')
  const del = segs.filter((s) => s.t === 'del').map((s) => s.s).join('')
  assert.equal(del, ' world')
})

test('diffVersions reports identical lists as unchanged', () => {
  const a = [para('1', 'one'), para('2', 'two')]
  const { stats, rows } = diffVersions(a, [...a])
  assert.equal(stats.unchanged, 2)
  assert.deepEqual(kinds(rows), ['unchanged', 'unchanged'])
})

test('diffVersions flags a new block as added', () => {
  const { stats, rows } = diffVersions([para('1', 'one')], [para('1', 'one'), para('2', 'two')])
  assert.equal(stats.added, 1)
  assert.deepEqual(kinds(rows), ['unchanged', 'added'])
  assert.equal(rows[1].block.text, 'two')
})

test('diffVersions flags a deleted block as removed', () => {
  const { stats, rows } = diffVersions([para('1', 'one'), para('2', 'two')], [para('1', 'one')])
  assert.equal(stats.removed, 1)
  assert.deepEqual(kinds(rows), ['unchanged', 'removed'])
  assert.equal(rows[1].block.text, 'two')
})

test('diffVersions marks edited text as modified with inline segments', () => {
  const { stats, rows } = diffVersions([para('1', 'hello world')], [para('1', 'hello brave world')])
  assert.equal(stats.modified, 1)
  assert.equal(rows[0].kind, 'modified')
  assert.ok(rows[0].inline.some((s) => s.t === 'add' && s.s === 'brave '))
})

test('diffVersions surfaces type changes with both blocks', () => {
  const { stats, rows } = diffVersions([para('1', 'title text')], [head('1', 'title text')])
  assert.equal(stats.modified, 1)
  assert.equal(rows[0].typeFrom, 'paragraph')
  assert.equal(rows[0].typeTo, 'heading')
})

test('diffVersions orders an insertion between matched blocks', () => {
  const from = [para('1', 'one'), para('2', 'two')]
  const to = [para('1', 'one'), para('3', 'three'), para('2', 'two')]
  const { stats, rows } = diffVersions(from, to)
  assert.equal(stats.added, 1)
  assert.deepEqual(kinds(rows), ['unchanged', 'added', 'unchanged'])
})

test('diffVersions handles empty inputs', () => {
  const { stats, rows } = diffVersions([], [])
  assert.equal(stats.unchanged, 0)
  assert.deepEqual(rows, [])

  const addAll = diffVersions([], [para('1', 'one')])
  assert.equal(addAll.stats.added, 1)
  assert.equal(addAll.rows[0].kind, 'added')

  const removeAll = diffVersions([para('1', 'one')], [])
  assert.equal(removeAll.stats.removed, 1)
  assert.equal(removeAll.rows[0].kind, 'removed')
})

test('diffVersions treats a moved block id as matched by id', () => {
  const from = [para('1', 'one'), para('2', 'two')]
  const to = [para('2', 'two'), para('1', 'one')]
  const { stats, rows } = diffVersions(from, to)
  assert.equal(stats.removed, 0)
  assert.equal(stats.added, 0)
  assert.equal(stats.modified, 0)
  assert.equal(rows.length, 2)
})
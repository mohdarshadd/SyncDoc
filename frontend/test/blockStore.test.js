import { describe, it, expect } from 'vitest'
import { diffBlocks, mergeDelta, snapshotFromYArray, mapToBlock, commentFromYMap, commentsFromYArray } from '../src/store/blockStore'
import { buildYdoc } from '../src/lib/ydoc'
import * as Y from 'yjs'

const block = (id, text) => ({ id, type: 'paragraph', text, lang: null, attrs: {}, parentId: null, order: 0 })

describe('snapshotFromYArray', () => {
  const makeArray = (items) => {
    const doc = new Y.Doc()
    const arr = doc.getArray('blocks')
    const blocks = items.map(({ id, type, text, lang, order }) => {
      const m = new Y.Map()
      m.set('id', id)
      m.set('type', type)
      m.set('text', text)
      m.set('lang', lang || null)
      m.set('parentId', null)
      m.set('order', order)
      return m
    })
    arr.insert(0, blocks)
    return arr
  }

  it('preserves the Y.Array live order (source of truth) for blocks', () => {
    const arr = makeArray([
      { id: 'b', type: 'paragraph', text: 'second', order: 1 },
      { id: 'a', type: 'paragraph', text: 'first', order: 0 }
    ])
    const snap = snapshotFromYArray(arr)
    expect(snap.map((b) => b.id)).toEqual(['b', 'a'])
    expect(snap[0].text).toBe('second')
  })

  it('mapToBlock converts a Y.Map into a plain block object', () => {
    const arr = makeArray([{ id: 'x', type: 'code', text: 'hi', lang: 'js', order: 0 }])
    const b = mapToBlock(arr.toArray()[0])
    expect(b).toMatchObject({ id: 'x', type: 'code', text: 'hi', lang: 'js' })
  })

  it('mapToBlock reads checked and open state for checklist/toggle blocks', () => {
    const doc = new Y.Doc()
    const arr = doc.getArray('blocks')
    const m = new Y.Map()
    m.set('id', 't')
    m.set('type', 'checklist')
    m.set('text', 'task')
    m.set('checked', true)
    m.set('open', false)
    m.set('parentId', null)
    m.set('order', 0)
    arr.insert(0, [m])

    const checked = mapToBlock(arr.toArray()[0])
    expect(checked.type).toBe('checklist')
    expect(checked.checked).toBe(true)
    expect(checked.open).toBe(false)

    const untouched = new Y.Map()
    untouched.set('id', 'p')
    untouched.set('type', 'toggle')
    untouched.set('text', '')
    untouched.set('parentId', null)
    untouched.set('order', 1)
    const toggled = mapToBlock(untouched)
    expect(toggled.checked).toBe(false)
    expect(toggled.open).toBe(true)
  })

  it('mapToBlock reads collapsed state for collapse folders', () => {
    const doc = new Y.Doc()
    const arr = doc.getArray('blocks')
    const m = new Y.Map()
    m.set('id', 'c')
    m.set('type', 'paragraph')
    m.set('text', 'parent')
    m.set('collapsed', true)
    m.set('parentId', null)
    m.set('order', 0)
    arr.insert(0, [m])

    const collapsed = mapToBlock(arr.toArray()[0])
    expect(collapsed.collapsed).toBe(true)

    const openMap = new Y.Map()
    openMap.set('id', 'o')
    openMap.set('type', 'paragraph')
    openMap.set('text', '')
    openMap.set('parentId', null)
    openMap.set('order', 1)
    const openBlock = mapToBlock(openMap)
    expect(openBlock.collapsed).toBe(false)
  })
})

describe('commentsFromYArray', () => {
  const makeArray = (items) => {
    const doc = new Y.Doc()
    const arr = doc.getArray('comments')
    const maps = items.map((c) => {
      const m = new Y.Map()
      m.set('id', c.id)
      m.set('blockId', c.blockId)
      m.set('from', c.from)
      m.set('to', c.to)
      m.set('authorId', c.authorId)
      m.set('authorName', c.authorName)
      m.set('text', c.text)
      m.set('created', c.created)
      m.set('resolved', !!c.resolved)
      return m
    })
    arr.insert(0, maps)
    return arr
  }

  it('maps comment maps to plain objects with safe defaults', () => {
    const arr = makeArray([{ id: 'c1', blockId: 'b1', from: 0, to: 4, authorId: 'u1', authorName: 'Arshad', text: 'hi', created: 10, resolved: false }])
    expect(commentsFromYArray(arr)).toEqual([
      { id: 'c1', blockId: 'b1', from: 0, to: 4, authorId: 'u1', authorName: 'Arshad', text: 'hi', created: 10, resolved: false }
    ])
  })

  it('sorts by created time (oldest first)', () => {
    const arr = makeArray([
      { id: 'c2', blockId: 'b1', created: 20, authorName: 'A', text: 'second' },
      { id: 'c1', blockId: 'b1', created: 10, authorName: 'A', text: 'first' }
    ])
    expect(commentsFromYArray(arr).map((c) => c.id)).toEqual(['c1', 'c2'])
  })

  it('drops maps missing a block id', () => {
    const arr = makeArray([{ id: 'c1', blockId: 'b1', created: 1, authorName: 'A', text: 'ok' }])
    const bad = new Y.Map()
    bad.set('id', 'c2')
    bad.set('from', 0)
    bad.set('to', 1)
    arr.insert(arr.length, [bad])
    const out = commentsFromYArray(arr)
    expect(out).toHaveLength(1)
    expect(out[0].blockId).toBe('b1')
  })

  it('commentFromYMap falls back to Anonymous and empty text', () => {
    const doc = new Y.Doc()
    const arr = doc.getArray('comments')
    const m = new Y.Map()
    m.set('id', 'c1')
    m.set('blockId', 'b1')
    arr.insert(0, [m])
    const c = commentFromYMap(arr.toArray()[0])
    expect(c).toMatchObject({ id: 'c1', blockId: 'b1', authorName: 'Anonymous', text: '', resolved: false, created: 0 })
  })

  it('populates the comments array from a seeded document', () => {
    const ydoc = buildYdoc({
      title: 'T',
      blocks: [{ id: 'b1', type: 'paragraph', text: 'hi', order: 0 }],
      comments: [{ id: 'c1', blockId: 'b1', from: 0, to: 2, authorId: 'u1', authorName: 'Arshad', text: 'note', created: 50, resolved: false }]
    })
    const out = commentsFromYArray(ydoc.getArray('comments'))
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ id: 'c1', blockId: 'b1', authorName: 'Arshad', text: 'note' })
  })
})

describe('diffBlocks', () => {
  it('emits only changed, added, and deleted blocks', () => {
    const prev = [block('a', 'kept'), block('b', 'old'), block('c', 'gone')]
    const full = [block('a', 'kept'), block('b', 'updated'), block('d', 'new')]
    const delta = diffBlocks(prev, full)
    expect(delta).toHaveLength(3)
    const byId = Object.fromEntries(delta.map((b) => [b.id, b]))
    expect(byId['b'].text).toBe('updated')
    expect(byId['d'].text).toBe('new')
    expect(byId['c'].deleted).toBe(true)
    expect(byId['a']).toBeUndefined()
  })

  it('returns empty delta when nothing changed', () => {
    const prev = [block('a', 'x')]
    expect(diffBlocks(prev, prev)).toEqual([])
  })
})

describe('mergeDelta', () => {
  it('updates overlapping ids, adds new ones, deletes tombstones', () => {
    const snap = [block('a', 'local'), block('b', 'b'), block('c', 'c')]
    const merged = mergeDelta(snap, [
      { ...block('b', 'remote-update') },
      { ...block('d', 'new'), deleted: false },
      { id: 'c', deleted: true }
    ])
    const byId = Object.fromEntries(merged.map((b) => [b.id, b]))
    expect(byId['a'].text).toBe('local')
    expect(byId['b'].text).toBe('remote-update')
    expect(byId['d'].text).toBe('new')
    expect(byId['c']).toBeUndefined()
  })

  it('never touches unrelated blocks (local typing preserved)', () => {
    const snap = [block('a', 'in-flight local text'), block('b', 'b')]
    const merged = mergeDelta(snap, [block('b', 'remote text')])
    expect(merged.find((b) => b.id === 'a').text).toBe('in-flight local text')
    expect(merged.find((b) => b.id === 'b').text).toBe('remote text')
    expect(merged).toHaveLength(2)
  })

  it('does not mutate the input snapshot', () => {
    const snap = [block('a', 'x')]
    mergeDelta(snap, [block('b', 'y')])
    expect(snap).toHaveLength(1)
    expect(snap[0].text).toBe('x')
  })
})

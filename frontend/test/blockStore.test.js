import { describe, it, expect } from 'vitest'
import { diffBlocks, mergeDelta, snapshotFromYArray, mapToBlock } from '../src/store/blockStore'
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

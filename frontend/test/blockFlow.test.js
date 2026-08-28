import { describe, it, expect, beforeEach } from 'vitest'
import * as Y from 'yjs'
import { buildYdoc } from '../src/lib/ydoc'
import { diffBlocks, mergeDelta, snapshotFromYArray } from '../src/store/blockStore'
import { uid } from '../src/lib/uid'

function applyBlocks(blocksArr, setState) {
  const full = snapshotFromYArray(blocksArr)
  setState((prev) => {
    const delta = diffBlocks(prev, full)
    return delta.length ? mergeDelta(prev, delta) : prev
  })
}

function addBlock(ydoc, type = 'paragraph', afterId = null, setId = uid) {
  ydoc.transact(() => {
    const arr = ydoc.getArray('blocks')
    const existing = arr.toArray()
    let idx = existing.length
    if (afterId) {
      const found = existing.findIndex((b) => b.get('id') === afterId)
      if (found >= 0) idx = found + 1
    }
    const insertIndex = Math.min(idx, arr.length)
    const block = new Y.Map()
    block.set('id', setId())
    block.set('type', type)
    block.set('text', '')
    block.set('lang', type === 'code' ? 'text' : null)
    block.set('parentId', null)
    block.set('order', insertIndex)
    existing.forEach((m) => {
      if (m.get('order') >= insertIndex) m.set('order', m.get('order') + 1)
    })
    arr.insert(insertIndex, [block])
  })
}

function updateBlockText(ydoc, id, text) {
  ydoc.transact(() => {
    ydoc.getArray('blocks').forEach((m) => {
      if (m.get('id') === id) m.set('text', text)
    })
  })
}

describe('client block editing flow on an empty document', () => {
  let ydoc
  let blocksArr
  let state

  beforeEach(() => {
    ydoc = buildYdoc({ title: 'New doc', blocks: [] })
    blocksArr = ydoc.getArray('blocks')
    state = []
    blocksArr.observeDeep(() => applyBlocks(blocksArr, (fn) => { state = fn(state) }))
    applyBlocks(blocksArr, (fn) => { state = fn([]) })
  })

  it('uid always returns a usable id', () => {
    const id = uid()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('adds the first paragraph to an empty doc', () => {
    addBlock(ydoc)
    expect(state.length).toBe(1)
    expect(state[0].type).toBe('paragraph')
  })

  it('adding moves from empty to a real block and typing updates it', () => {
    addBlock(ydoc)
    const id = state[0].id
    updateBlockText(ydoc, id, 'hello world')
    expect(state[0].text).toBe('hello world')
  })

  it('adds headings in addition to paragraphs', () => {
    addBlock(ydoc, 'paragraph')
    addBlock(ydoc, 'heading')
    addBlock(ydoc, 'code')
    const types = state.map((b) => b.type)
    expect(types).toContain('paragraph')
    expect(types).toContain('heading')
    expect(types).toContain('code')
    expect(state).toHaveLength(3)
  })

  it('orders blocks by position (order field stays consistent)', () => {
    addBlock(ydoc, 'paragraph')
    addBlock(ydoc, 'heading')
    addBlock(ydoc, 'quote')
    state.forEach((b, i) => expect(b.order).toBe(i))
  })

  it('adds a block below a specific block and shifts subsequent order values', () => {
    addBlock(ydoc, 'paragraph')
    addBlock(ydoc, 'paragraph')
    const firstId = state[0].id
    addBlock(ydoc, 'heading', firstId)
    expect(state).toHaveLength(3)
    expect(state.map((b) => b.type)).toEqual(['paragraph', 'heading', 'paragraph'])
    state.forEach((b, i) => expect(b.order).toBe(i))
  })

  it('adds a block at the end when given an unknown afterId', () => {
    addBlock(ydoc, 'paragraph')
    addBlock(ydoc, 'quote', 'does-not-exist')
    expect(state).toHaveLength(2)
    expect(state[1].type).toBe('quote')
    state.forEach((b, i) => expect(b.order).toBe(i))
  })
})

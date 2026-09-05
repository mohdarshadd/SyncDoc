import { describe, it, expect } from 'vitest'
import { buildBlockTree, depthOfBlock } from '../src/lib/blockTree'

const block = (id, parentId = null, over = {}) => ({
  id, type: 'paragraph', text: id, parentId, collapsed: false, ...over
})

describe('buildBlockTree', () => {
  it('assigns depth based on the parentId chain', () => {
    const tree = buildBlockTree([
      block('a'),
      block('b', 'a'),
      block('c', 'b'),
      block('d')
    ])
    expect(tree.map((b) => [b.id, b.depth])).toEqual([
      ['a', 0], ['b', 1], ['c', 2], ['d', 0]
    ])
    expect(tree.map((b) => b.hidden)).toEqual([false, false, false, false])
  })

  it('hides descendants of a collapsed parent', () => {
    const tree = buildBlockTree([
      block('a', null, { collapsed: true }),
      block('b', 'a'),
      block('c', 'b'),
      block('d')
    ])
    expect(tree.find((b) => b.id === 'a').hidden).toBe(false)
    expect(tree.find((b) => b.id === 'b').hidden).toBe(true)
    expect(tree.find((b) => b.id === 'c').hidden).toBe(true)
    expect(tree.find((b) => b.id === 'd').hidden).toBe(false)
  })

  it('still reports depth for hidden descendants', () => {
    const tree = buildBlockTree([
      block('a', null, { collapsed: true }),
      block('b', 'a'),
      block('c', 'b')
    ])
    expect(tree.find((b) => b.id === 'c').depth).toBe(2)
    expect(tree.find((b) => b.id === 'c').hidden).toBe(true)
  })

  it('marks parents that have children and collapsed roots', () => {
    const tree = buildBlockTree([
      block('a', null, { collapsed: true }),
      block('b', 'a'),
      block('d')
    ])
    expect(tree.find((b) => b.id === 'a').hasChildren).toBe(true)
    expect(tree.find((b) => b.id === 'b').hasChildren).toBe(false)
    expect(tree.find((b) => b.id === 'd').hasChildren).toBe(false)
    expect(tree.find((b) => b.id === 'a').hasHiddenDescendants).toBe(true)
    expect(tree.find((b) => b.id === 'b').hasHiddenDescendants).toBe(false)
  })

  it('leaves a collapsed parent without children unflagged', () => {
    const tree = buildBlockTree([
      block('a', null, { collapsed: true }),
      block('d')
    ])
    expect(tree.find((b) => b.id === 'a').hasChildren).toBe(false)
    expect(tree.find((b) => b.id === 'a').hasHiddenDescendants).toBe(false)
  })

  it('exposes firstChildOfParent and lastOfSubtree for guide lines', () => {
    const tree = buildBlockTree([
      block('a'),
      block('b', 'a'),
      block('c', 'a'),
      block('d')
    ])
    expect(tree.find((b) => b.id === 'b').firstChildOfParent).toBe(true)
    expect(tree.find((b) => b.id === 'c').firstChildOfParent).toBe(false)
    expect(tree.find((b) => b.id === 'c').lastOfSubtree).toBe(true)
    expect(tree.find((b) => b.id === 'd').lastOfSubtree).toBe(false)
  })

  it('does not mutate the input blocks', () => {
    const blocks = [block('a', null, { collapsed: true }), block('b', 'a')]
    const before = JSON.stringify(blocks)
    buildBlockTree(blocks)
    expect(JSON.stringify(blocks)).toBe(before)
  })
})

describe('depthOfBlock', () => {
  it('returns the depth of a given block id', () => {
    const blocks = [block('a'), block('b', 'a'), block('c', 'b')]
    expect(depthOfBlock(blocks, 'a')).toBe(0)
    expect(depthOfBlock(blocks, 'b')).toBe(1)
    expect(depthOfBlock(blocks, 'c')).toBe(2)
    expect(depthOfBlock(blocks, 'missing')).toBe(0)
  })
})

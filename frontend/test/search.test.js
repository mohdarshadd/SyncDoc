import { describe, it, expect } from 'vitest'
import { computeMatches } from '../src/lib/search'

describe('computeMatches', () => {
  const blocks = [
    { id: 'a', text: 'Hello world hello' },
    { id: 'b', text: 'Not here' },
    { id: 'c', text: 'hello again' }
  ]

  it('returns no matches for an empty query', () => {
    expect(computeMatches(blocks, '')).toEqual([])
    expect(computeMatches(blocks, '   ')).toEqual([])
  })

  it('finds matches across blocks case-insensitively', () => {
    const matches = computeMatches(blocks, 'hello')
    expect(matches.length).toBe(3)
    expect(matches[0]).toEqual({ blockId: 'a', index: 0, length: 5 })
    expect(matches[1]).toEqual({ blockId: 'a', index: 12, length: 5 })
    expect(matches[2]).toEqual({ blockId: 'c', index: 0, length: 5 })
  })

  it('finds multiple matches within a single block', () => {
    const matches = computeMatches(blocks, 'hello')
    const blockAMatches = matches.filter((m) => m.blockId === 'a')
    expect(blockAMatches).toHaveLength(2)
  })

  it('returns empty array when there are no matches', () => {
    expect(computeMatches(blocks, 'xyz')).toEqual([])
  })
})

import { describe, it, expect } from 'vitest'
import { toggleMark, clearMarks, marksInRange, normalizeMarks } from '../src/lib/richText'

describe('richText marks', () => {
  it('applies a bold mark to a range', () => {
    const marks = toggleMark(11, [], 0, 5, 'bold')
    expect(marks).toEqual([{ from: 0, to: 5, type: 'bold' }])
  })

  it('toggles bold off when the whole range is already bold', () => {
    let marks = toggleMark(11, [], 0, 5, 'bold')
    marks = toggleMark(11, marks, 0, 5, 'bold')
    expect(marks).toEqual([])
  })

  it('narrows a bold range when applying within it', () => {
    let marks = toggleMark(11, [], 0, 10, 'bold')
    marks = toggleMark(11, marks, 3, 6, 'italic')
    expect(marks).toEqual([
      { from: 0, to: 10, type: 'bold' },
      { from: 3, to: 6, type: 'italic' }
    ])
  })

  it('splits around an inner mismatch', () => {
    let marks = toggleMark(11, [], 3, 8, 'bold')
    marks = toggleMark(11, marks, 0, 11, 'italic')
    expect(marks).toEqual([
      { from: 0, to: 11, type: 'italic' },
      { from: 3, to: 8, type: 'bold' }
    ])
  })

  it('removes only the selected portion of a mark', () => {
    let marks = toggleMark(11, [], 0, 10, 'bold')
    marks = toggleMark(11, marks, 2, 5, 'bold')
    expect(marks).toEqual([
      { from: 0, to: 2, type: 'bold' },
      { from: 5, to: 10, type: 'bold' }
    ])
  })

  it('adds a link with an href', () => {
    const marks = toggleMark(7, [], 0, 7, 'link', 'https://example.com')
    expect(marks).toEqual([{ from: 0, to: 7, type: 'link', href: 'https://example.com' }])
  })

  it('clamps ranges to the text length and drops empty ranges', () => {
    const marks = toggleMark(5, [], 2, 2, 'bold')
    expect(marks).toEqual([])
    expect(toggleMark(5, [], 10, 100, 'bold')).toEqual([])
  })

  it('normalizes and merges adjacent marks', () => {
    const marks = normalizeMarks(10, [
      { from: 0, to: 4, type: 'bold' },
      { from: 4, to: 8, type: 'bold' }
    ])
    expect(marks).toEqual([{ from: 0, to: 8, type: 'bold' }])
  })

  it('clearMarks removes all formatting', () => {
    const marks = clearMarks([{ from: 0, to: 3, type: 'bold' }])
    expect(marks).toEqual([])
  })

  it('marksInRange returns marks overlapping a selection', () => {
    const marks = [{ from: 2, to: 6, type: 'bold' }]
    expect(marksInRange(marks, 3, 5)).toEqual([marks[0]])
    expect(marksInRange(marks, 0, 1)).toEqual([])
  })

  it('unions a same-type mark when the selection is only partially covered', () => {
    let marks = toggleMark(11, [], 0, 4, 'bold')
    marks = toggleMark(11, marks, 2, 8, 'bold')
    expect(marks).toEqual([{ from: 0, to: 8, type: 'bold' }])
  })

  it('keeps other marks when applying a mark over them', () => {
    let marks = toggleMark(11, [], 3, 8, 'bold')
    marks = toggleMark(11, marks, 0, 11, 'italic')
    expect(marks).toEqual([
      { from: 0, to: 11, type: 'italic' },
      { from: 3, to: 8, type: 'bold' }
    ])
  })

  it('clips a partially overlapping mark on toggle-off', () => {
    let marks = toggleMark(11, [], 0, 4, 'bold')
    marks = toggleMark(11, marks, 2, 8, 'bold')
    marks = toggleMark(11, marks, 3, 7, 'bold')
    expect(marks).toEqual([
      { from: 0, to: 3, type: 'bold' },
      { from: 7, to: 8, type: 'bold' }
    ])
  })
})

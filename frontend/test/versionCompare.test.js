import { describe, it, expect } from 'vitest'
import {
  splitInline,
  describeTypeChange,
  statsSummary,
  blockPreviewText,
  revisionLabel,
  previousRevision,
} from '../src/lib/versionCompare'

describe('splitInline', () => {
  it('converts backend segments to react keys', () => {
    const out = splitInline([{ t: 'eq', s: 'hello ' }, { t: 'add', s: 'brave ' }, { t: 'eq', s: 'world' }])
    expect(out.map((s) => s.kind)).toEqual(['eq', 'add', 'eq'])
    expect(out.map((s) => s.text)).toEqual(['hello ', 'brave ', 'world'])
    expect(out[0].key).toBeTruthy()
  })

  it('returns an empty eq segment for empty input', () => {
    const out = splitInline([])
    expect(out).toHaveLength(1)
    expect(out[0].kind).toBe('eq')
    expect(out[0].text).toBe('')
  })
})

describe('describeTypeChange', () => {
  it('describes a real type change', () => {
    expect(describeTypeChange('paragraph', 'heading')).toBe('Changed to heading')
  })

  it('is empty when type is unchanged', () => {
    expect(describeTypeChange('paragraph', 'paragraph')).toBe('')
    expect(describeTypeChange(undefined, 'heading')).toBe('')
  })
})

describe('statsSummary', () => {
  it('summarises only non-zero counters', () => {
    expect(statsSummary({ added: 2, removed: 1, modified: 0, unchanged: 9 })).toBe('+2 added · -1 removed')
  })

  it('reports no differences when only unchanged rows exist', () => {
    expect(statsSummary({ added: 0, removed: 0, modified: 0, unchanged: 4 })).toBe('No differences')
  })

  it('handles missing stats', () => {
    expect(statsSummary(null)).toBe('')
  })
})

describe('blockPreviewText', () => {
  it('returns short text as-is', () => {
    expect(blockPreviewText({ text: 'hi' }, 220)).toBe('hi')
  })

  it('truncates long text with an ellipsis', () => {
    const long = 'x'.repeat(300)
    const out = blockPreviewText({ text: long }, 220)
    expect(out.length).toBeLessThan(260)
    expect(out.endsWith('…')).toBe(true)
  })
})

describe('revisionLabel', () => {
  it('includes revision number and date', () => {
    const v = { revision: 3, createdAt: '2026-09-09T10:00:00.000Z' }
    expect(revisionLabel(v)).toContain('Revision 3')
    expect(revisionLabel(v)).toContain('2026')
  })

  it('returns empty for missing version', () => {
    expect(revisionLabel(null)).toBe('')
  })
})

describe('previousRevision', () => {
  const versions = [
    { revision: 5 },
    { revision: 4 },
    { revision: 3 },
  ]

  it('returns the older revision below the newest', () => {
    expect(previousRevision(versions, 5)).toBe(4)
  })

  it('returns the newer revision for older rows', () => {
    expect(previousRevision(versions, 4)).toBe(5)
    expect(previousRevision(versions, 3)).toBe(4)
  })

  it('returns null when nothing to compare', () => {
    expect(previousRevision([{ revision: 1 }], 1)).toBe(null)
    expect(previousRevision(versions, 99)).toBe(null)
    expect(previousRevision([], 1)).toBe(null)
  })
})
import { describe, it, expect } from 'vitest'
import {
  encodeMention,
  decodeMentions,
  extractMentionIds,
  stripMentions,
  findMentionQuery,
  insertMention,
  buildComment,
  commentMessages
} from '../src/lib/comments'

describe('encodeMention / decodeMentions', () => {
  it('round-trips a mention token', () => {
    const token = encodeMention({ name: 'Arshad', id: 'abc123' })
    expect(token).toBe('@[Arshad](abc123)')
    expect(decodeMentions(token)).toEqual([{ name: 'Arshad', id: 'abc123', from: 0, to: token.length }])
  })

  it('decodes multiple mentions with offsets', () => {
    const text = 'hey @[A](1) and @[B](2) ok'
    const out = decodeMentions(text)
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ name: 'A', id: '1', from: 4 })
    expect(out[1]).toMatchObject({ name: 'B', id: '2' })
    expect(text.slice(out[1].from, out[1].to)).toBe('@[B](2)')
  })

  it('extracts unique mention ids', () => {
    expect(extractMentionIds('hi @[A](1) again @[A](1)')).toEqual(['1'])
  })

  it('strips markup but keeps @name', () => {
    expect(stripMentions('see @[Arshad](9) here')).toBe('see @Arshad here')
  })
})

describe('findMentionQuery / insertMention', () => {
  it('finds a query after @ while typing', () => {
    expect(findMentionQuery('hello @ar', 9)).toEqual({ start: 6, query: 'ar' })
  })

  it('returns null without @', () => {
    expect(findMentionQuery('hello', 5)).toBeNull()
  })

  it('does not match inside an existing token', () => {
    expect(findMentionQuery('@[a](1) @', 10)).toEqual({ start: 8, query: '' })
  })

  it('inserts a mention replacing the typed query', () => {
    const res = insertMention('tell @ar', 8, { name: 'Arshad', id: 'x1' })
    expect(res.text).toBe('tell @[Arshad](x1) ')
    expect(res.cursorPos).toBe(19)
  })

  it('appends a mention when no query is active', () => {
    const res = insertMention('hello', 5, { name: 'Amir', id: 'x2' })
    expect(res.text).toBe('hello@[Amir](x2) ')
  })
})

describe('buildComment', () => {
  it('builds a comment with clamped ranges and metadata', () => {
    const c = buildComment({ blockId: 'b1', from: -2, to: 8, text: 'note', authorId: 'u1', authorName: 'Arshad', now: 1000 })
    expect(c.blockId).toBe('b1')
    expect(c.from).toBe(0)
    expect(c.to).toBe(8)
    expect(c.authorId).toBe('u1')
    expect(c.authorName).toBe('Arshad')
    expect(c.created).toBe(1000)
    expect(c.resolved).toBe(false)
    expect(c.id).toBeTruthy()
  })

  it('keeps a zero-length range collapsed', () => {
    const c = buildComment({ blockId: 'b1', from: 3, to: 3, text: '', authorId: 'u', authorName: 'U' })
    expect(c.from).toBe(3)
    expect(c.to).toBe(3)
  })
})

describe('commentMessages', () => {
  it('splits text and mentions into renderable parts', () => {
    const parts = commentMessages({ text: 'cc @[Arshad](1)' })
    expect(parts).toEqual([
      { kind: 'text', value: 'cc ' },
      { kind: 'mention', name: 'Arshad', id: '1' }
    ])
  })

  it('handles text without mentions', () => {
    expect(commentMessages({ text: 'plain' })).toEqual([{ kind: 'text', value: 'plain' }])
  })
})
import { describe, it, expect } from 'vitest'
import {
  friendlyStatus,
  typers,
  typingSummary,
  viewerCountLabel,
  formatSavedAt,
} from '../src/lib/presence'

describe('friendlyStatus', () => {
  it('maps every realtime status to friendly text', () => {
    expect(friendlyStatus('connected')).toBe('All changes saved')
    expect(friendlyStatus('connecting')).toBe('Connecting…')
    expect(friendlyStatus('disconnected')).toBe('Reconnecting…')
    expect(friendlyStatus('error')).toBe('Connection error')
  })

  it('falls back for unknown or missing status', () => {
    expect(friendlyStatus(undefined)).toBe('Connecting…')
    expect(friendlyStatus('')).toBe('Connecting…')
  })
})

describe('typers', () => {
  const users = [
    { clientId: 1, name: 'Aarav', typing: true },
    { clientId: 2, name: 'Mira', typing: false },
    { clientId: 3, name: 'Kabir', typing: true },
  ]

  it('returns only remote users who are typing', () => {
    expect(typers(users, 1).sort()).toEqual(['Kabir'])
  })

  it('excludes the current client', () => {
    expect(typers(users, 3).sort()).toEqual(['Aarav'])
  })

  it('ignores users without a name', () => {
    const noName = [{ clientId: 4, typing: true }]
    expect(typers(noName, 1)).toEqual([])
  })
})

describe('typingSummary', () => {
  it('is empty for no typers', () => {
    expect(typingSummary([])).toBe('')
  })

  it('describes one typer', () => {
    expect(typingSummary(['Aarav'])).toBe('Aarav is typing…')
  })

  it('describes two typers', () => {
    expect(typingSummary(['Aarav', 'Mira'])).toBe('Aarav and Mira are typing…')
  })

  it('summarizes many typers', () => {
    expect(typingSummary(['Aarav', 'Mira', 'Kabir'])).toBe('Aarav, Mira, and 1 more are typing…')
  })
})

describe('viewerCountLabel', () => {
  it('is empty for zero viewers', () => {
    expect(viewerCountLabel(0)).toBe('')
  })

  it('singularizes one viewer', () => {
    expect(viewerCountLabel(1)).toBe('1 viewing')
  })

  it('pluralizes many viewers', () => {
    expect(viewerCountLabel(4)).toBe('4 viewing')
  })
})

describe('formatSavedAt', () => {
  const now = 1_000_000_000_000

  it('says just now for fresh saves', () => {
    expect(formatSavedAt(now - 1000, now)).toBe('Saved just now')
  })

  it('reports seconds, then minutes', () => {
    expect(formatSavedAt(now - 30_000, now)).toBe('Saved 30s ago')
    expect(formatSavedAt(now - 120_000, now)).toBe('Saved 2m ago')
  })

  it('gives up on very old timestamps', () => {
    expect(formatSavedAt(now - 7200_000, now)).toBe('Saved a while ago')
  })

  it('is empty without a timestamp', () => {
    expect(formatSavedAt(null, now)).toBe('')
  })
})
import { describe, it, expect } from 'vitest'
import { buildEditorNav } from '../src/lib/editorMenu'

function base() {
  return {
    isOwner: false,
    mentionCount: 0,
    onHistory: () => {},
    onCompare: () => {},
    onCopyLink: () => {},
    onSearch: () => {},
    onMentions: () => {},
    onShare: () => {},
    onShortcuts: () => {},
    exportLinks: {
      html: '/api/documents/x/export/html',
      markdown: '/api/documents/x/export/markdown',
      pdf: '/api/documents/x/export/pdf',
    },
  }
}

describe('buildEditorNav', () => {
  it('starts with history and ends with shortcuts', () => {
    const items = buildEditorNav(base())
    expect(items[0].key).toBe('history')
    expect(items[items.length - 1].key).toBe('shortcuts')
  })

  it('only shows Share for the owner', () => {
    const guest = buildEditorNav(base())
    expect(guest.some((i) => i.key === 'share')).toBe(false)

    const owner = buildEditorNav({ ...base(), isOwner: true })
    expect(owner.some((i) => i.key === 'share')).toBe(true)
  })

  it('shows a mentions item only when mentions exist', () => {
    const none = buildEditorNav(base())
    expect(none.some((i) => i.key === 'mentions')).toBe(false)

    const some = buildEditorNav({ ...base(), mentionCount: 3 })
    const item = some.find((i) => i.key === 'mentions')
    expect(item.label).toBe('Mentions (3)')
  })

  it('wires export links as hrefs', () => {
    const items = buildEditorNav(base())
    const md = items.find((i) => i.key === 'markdown')
    expect(md.href).toBe('/api/documents/x/export/markdown')
    expect(md.label).toBe('Export Markdown')
  })

  it('omits missing export links', () => {
    const items = buildEditorNav({ ...base(), exportLinks: {} })
    expect(items.some((i) => i.key === 'html')).toBe(false)
    expect(items.some((i) => i.key === 'markdown')).toBe(false)
    expect(items.some((i) => i.key === 'pdf')).toBe(false)
  })

  it('calls the configured action when clicked', () => {
    let called = null
    const items = buildEditorNav({ ...base(), onSearch: () => { called = 'search' } })
    const search = items.find((i) => i.key === 'search')
    search.onClick()
    expect(called).toBe('search')
  })
})
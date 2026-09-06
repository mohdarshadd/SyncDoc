export const MENTION_RE = /@\[([^\]]*)\]\(([^)]*)\)/g

export function encodeMention({ name, id }) {
  const safeName = String(name || 'Mention').replace(/]/g, '\u2044')
  const safeId = String(id || '').replace(/\)/g, '')
  return `@[${safeName}](${safeId})`
}

export function decodeMentions(text) {
  const out = []
  let m
  MENTION_RE.lastIndex = 0
  while ((m = MENTION_RE.exec(text)) !== null) {
    out.push({ name: m[1], id: m[2], from: m.index, to: m.index + m[0].length })
  }
  return out
}

export function extractMentionIds(text) {
  return Array.from(new Set(decodeMentions(text).map((t) => t.id))).filter(Boolean)
}

export function stripMentions(text) {
  return String(text || '').replace(MENTION_RE, '@$1')
}

export function findMentionQuery(text, cursorPos) {
  const value = String(text || '')
  const pos = Math.max(0, Math.min(cursorPos, value.length))
  const slice = value.slice(0, pos)
  const at = slice.lastIndexOf('@')
  if (at === -1) return null
  const query = slice.slice(at + 1)
  if (query.includes(']') || query.includes(')') || query.includes('(')) return null
  return { start: at, query }
}

export function insertMention(text, cursorPos, mention) {
  const value = String(text || '')
  const pos = Math.max(0, Math.min(cursorPos, value.length))
  const found = findMentionQuery(value, pos)
  const start = found ? found.start : pos
  const token = encodeMention(mention)
  const next = value.slice(0, start) + token + ' ' + value.slice(pos)
  return { text: next, cursorPos: start + token.length + 1 }
}

export function buildComment({ blockId, from, to, text, authorId, authorName, now = Date.now() }) {
  return {
    id: `${authorId}-${now}-${Math.floor(Math.random() * 1e6)}`,
    blockId,
    from: Number.isFinite(from) ? Math.max(0, from) : 0,
    to: Number.isFinite(to) ? Math.max(0, to) : 0,
    authorId: String(authorId || 'anonymous'),
    authorName: String(authorName || 'Anonymous'),
    text: String(text || ''),
    created: now,
    resolved: false
  }
}

export function commentMessages(comment) {
  const mentions = decodeMentions(comment.text)
  const parts = []
  let cursor = 0
  for (const t of mentions) {
    if (t.from > cursor) parts.push({ kind: 'text', value: comment.text.slice(cursor, t.from) })
    parts.push({ kind: 'mention', name: t.name, id: t.id })
    cursor = t.to
  }
  if (cursor < comment.text.length) parts.push({ kind: 'text', value: comment.text.slice(cursor) })
  return parts
}
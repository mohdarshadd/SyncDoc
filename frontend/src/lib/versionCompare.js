let segKey = 1

export function splitInline(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return [{ key: 0, kind: 'eq', text: '' }]
  return segments.map((s) => ({ key: segKey++, kind: s.t === 'eq' ? 'eq' : s.t, text: s.s }))
}

export function describeTypeChange(typeFrom, typeTo) {
  if (!typeFrom || !typeTo || typeFrom === typeTo) return ''
  return `Changed to ${typeTo}`
}

export function statsSummary(stats) {
  if (!stats) return ''
  const parts = []
  if (stats.added) parts.push(`+${stats.added} added`)
  if (stats.removed) parts.push(`-${stats.removed} removed`)
  if (stats.modified) parts.push(`~${stats.modified} changed`)
  if (stats.unchanged && parts.length === 0) parts.push('No differences')
  return parts.join(' · ')
}

export function blockPreviewText(block, max = 220) {
  const text = (block && block.text) || ''
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}…`
}

export function revisionLabel(version) {
  if (!version) return ''
  const date = version.createdAt ? new Date(version.createdAt).toLocaleString() : ''
  return `Revision ${version.revision}${date ? ` · ${date}` : ''}`
}

export function previousRevision(versions, revision) {
  if (!Array.isArray(versions) || versions.length === 0) return null
  const idx = versions.findIndex((v) => v.revision === revision)
  if (versions[0].revision === revision) return versions[1] ? versions[1].revision : null
  return versions[idx - 1] ? versions[idx - 1].revision : null
}
export const MARK_TYPES = ['bold', 'italic', 'underline', 'strike', 'link']

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function normalizeMarks(textLength, marks) {
  const entries = []
  for (const m of marks || []) {
    if (!m || !MARK_TYPES.includes(m.type)) continue
    let from = clamp(Math.floor(m.from), 0, textLength)
    let to = clamp(Math.floor(m.to), 0, textLength)
    if (to < from) [from, to] = [to, from]
    if (to <= from) continue
    entries.push({ from, to, type: m.type, href: m.href || undefined })
  }
  entries.sort((a, b) => a.from - b.from || a.to - b.to || (a.type < b.type ? -1 : 1))
  const merged = []
  for (const m of entries) {
    const prev = merged[merged.length - 1]
    if (prev && prev.type === m.type && prev.href === m.href && prev.to >= m.from) {
      prev.to = Math.max(prev.to, m.to)
    } else {
      merged.push(m)
    }
  }
  return merged
}

function sameMark(a, b) {
  return a.type === b.type && (a.href || undefined) === (b.href || undefined)
}

function clipped(marks, a, b) {
  const out = []
  for (const m of marks) {
    if (m.from >= a && m.to <= b) {
      out.push(m)
    } else if (m.from < b && m.to > a) {
      out.push({ ...m, from: Math.max(m.from, a), to: Math.min(m.to, b) })
    }
  }
  return out
}

function markWithin(marks, a, b, type, href) {
  return clipped(marks, a, b).filter((m) => sameMark(m, { type, href }))
}

export function toggleMark(textLength, marks, from, to, type, href) {
  const a = clamp(Math.floor(from), 0, textLength)
  const b = clamp(Math.floor(to), 0, textLength)
  const s = Math.min(a, b)
  const e = Math.max(a, b)
  const base = normalizeMarks(textLength, marks)
  if (e <= s) return base

  const fullyCovered = markWithin(base, s, e, type, href).reduce(
    (acc, m) => acc + (m.to - m.from),
    0
  ) === e - s

  if (fullyCovered) {
    const result = []
    for (const m of base) {
      if (!sameMark(m, { type, href })) {
        result.push(m)
        continue
      }
      if (m.from < s) result.push({ ...m, to: Math.min(m.to, s) })
      if (m.to > e) result.push({ ...m, from: Math.max(m.from, e) })
    }
    return normalizeMarks(textLength, result)
  }

  return normalizeMarks(textLength, [...base, { from: s, to: e, type, href: href || undefined }])
}

export function clearMarks() {
  return []
}

export function marksInRange(marks, from, to) {
  const s = Math.min(from, to)
  const e = Math.max(from, to)
  return normalizeMarks(Number.MAX_SAFE_INTEGER, marks).filter((m) => m.from < e && m.to > s)
}
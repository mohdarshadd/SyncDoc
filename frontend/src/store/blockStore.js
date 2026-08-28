export function mapToBlock(m) {
  const attrs = m.get('attrs')
  return {
    id: m.get('id'),
    type: m.get('type'),
    text: m.get('text') || '',
    lang: m.get('lang') || null,
    attrs: attrs instanceof Map && attrs.entries ? Object.fromEntries(attrs.entries()) : attrs || {},
    parentId: m.get('parentId') || null,
    order: m.get('order')
  }
}

export function snapshotFromYArray(arr) {
  return arr.toArray().map(mapToBlock)
}

export function diffBlocks(prev, full) {
  const prevById = new Map(prev.map((b) => [b.id, b]))
  const fullById = new Map(full.map((b) => [b.id, b]))
  const delta = []

  for (const b of full) {
    const p = prevById.get(b.id)
    if (!p) {
      delta.push(b)
    } else if (JSON.stringify(p) !== JSON.stringify(b)) {
      delta.push(b)
    }
  }

  for (const id of prevById.keys()) {
    if (!fullById.has(id)) delta.push({ id, deleted: true })
  }

  return delta
}

export function mergeDelta(snapshot, delta) {
  const next = snapshot.map((b) => ({ ...b }))
  const index = new Map(next.map((b, i) => [b.id, i]))

  for (const incoming of delta) {
    if (incoming.deleted) {
      const i = index.get(incoming.id)
      if (i != null) {
        next.splice(i, 1)
        index.delete(incoming.id)
      }
      continue
    }
    const i = index.get(incoming.id)
    if (i != null) {
      next[i] = { ...next[i], ...incoming }
    } else {
      const at = Math.min(incoming.order ?? next.length, next.length)
      next.splice(at, 0, { ...incoming })
      index.set(incoming.id, at)
      for (let k = at; k < next.length; k++) index.set(next[k].id, k)
    }
  }

  return next
}

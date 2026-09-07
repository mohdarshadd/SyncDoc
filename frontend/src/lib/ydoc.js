import * as Y from 'yjs'

function mapFromObject(obj) {
  const m = new Y.Map()
  for (const [key, value] of Object.entries(obj || {})) m.set(key, value)
  return m
}

export function buildYdoc({ title = 'Untitled', blocks = [] } = {}) {
  const ydoc = new Y.Doc()
  ydoc.getMap('meta').set('title', title)

  const items = blocks.map((b) => {
    const attrs = { ...(b.attrs || {}) }
    if (Array.isArray(b.marks) && b.marks.length) attrs.marks = b.marks
    const m = mapFromObject({
      id: b.id,
      type: b.type,
      text: b.text || '',
      lang: b.lang || null,
      parentId: b.parentId || null,
      order: b.order,
      collapsed: !!b.collapsed
    })
    if (Object.keys(attrs).length) m.set('attrs', mapFromObject(attrs))
    return m
  })
  ydoc.getArray('blocks').insert(0, items)
  return ydoc
}

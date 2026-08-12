const Y = require('yjs')
const { flattenAst, buildTree } = require('../validators/ast')

function mapFromObject(obj) {
  const m = new Y.Map()
  for (const [key, value] of Object.entries(obj || {})) m.set(key, value)
  return m
}

function astToYdoc(doc) {
  const ydoc = new Y.Doc()
  ydoc.getMap('meta').set('title', doc.title || 'Untitled')

  const flat = flattenAst(doc.nodes || [])
  const items = flat.map((f) => {
    const m = mapFromObject({
      id: f.id,
      type: f.type,
      text: f.text || '',
      lang: f.lang || null,
      parentId: f.parentId || null,
      order: f.order
    })
    if (f.attrs && Object.keys(f.attrs).length) {
      m.set('attrs', mapFromObject(f.attrs))
    }
    return m
  })
  ydoc.getArray('blocks').insert(0, items)
  return ydoc
}

function ydocToAst(ydoc) {
  const meta = ydoc.getMap('meta')
  const blocksArr = ydoc.getArray('blocks')
  const flat = blocksArr.toArray().map((m) => {
    const attrs = m.get('attrs')
    return {
      id: m.get('id'),
      type: m.get('type'),
      text: m.get('text') || '',
      lang: m.get('lang') || null,
      attrs: attrs instanceof Y.Map ? Object.fromEntries(attrs.entries()) : attrs || {},
      parentId: m.get('parentId') || null,
      order: m.get('order')
    }
  })
  return { title: meta.get('title') || 'Untitled', nodes: buildTree(flat) }
}

module.exports = { astToYdoc, ydocToAst }

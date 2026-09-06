const Y = require('yjs')
const { flattenAst, buildTree } = require('../validators/ast')

function mapFromObject(obj) {
  const m = new Y.Map()
  for (const [key, value] of Object.entries(obj || {})) m.set(key, value)
  return m
}

function commentToYMap(c) {
  const m = new Y.Map()
  m.set('id', c.id)
  m.set('blockId', c.blockId)
  m.set('from', c.from)
  m.set('to', c.to)
  m.set('authorId', c.authorId)
  m.set('authorName', c.authorName)
  m.set('text', c.text)
  m.set('created', c.created)
  m.set('resolved', !!c.resolved)
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
      order: f.order,
      collapsed: !!f.collapsed
    })
    if (f.attrs && Object.keys(f.attrs).length) {
      m.set('attrs', mapFromObject(f.attrs))
    }
    return m
  })
  ydoc.getArray('blocks').insert(0, items)

  const comments = (doc.comments || []).map((c) => commentToYMap(c))
  if (comments.length) ydoc.getArray('comments').insert(0, comments)
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
      order: m.get('order'),
      collapsed: !!m.get('collapsed')
    }
  })
  const comments = ydoc
    .getArray('comments')
    .toArray()
    .map((m) => ({
      id: m.get('id'),
      blockId: m.get('blockId'),
      from: m.get('from'),
      to: m.get('to'),
      authorId: m.get('authorId'),
      authorName: m.get('authorName'),
      text: m.get('text') || '',
      created: m.get('created'),
      resolved: !!m.get('resolved')
    }))
  return { title: meta.get('title') || 'Untitled', nodes: buildTree(flat), comments }
}

module.exports = { astToYdoc, ydocToAst }

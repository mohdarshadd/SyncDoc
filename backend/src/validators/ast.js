const crypto = require('crypto')

const NODE_TYPES = ['heading', 'paragraph', 'code', 'list', 'quote', 'image', 'divider']
const MAX_DEPTH = 20

const genId = () => crypto.randomUUID()

function normalizeTree(nodes, parentNid = null) {
  if (!Array.isArray(nodes)) return
  nodes.forEach((node, i) => {
    if (!node || typeof node !== 'object') return
    node.order = i
    node.nid = node.nid || genId()
    node.parentId = parentNid || null
    if (node.children && node.children.length) normalizeTree(node.children, node.nid)
  })
}

function validateAstTree(nodes) {
  if (!Array.isArray(nodes)) throw new Error('nodes must be an array')
  const seen = new Set()
  const parentRefs = new Set()
  const walk = (list, depth, path) => {
    if (depth > MAX_DEPTH) throw new Error(`max nesting depth ${MAX_DEPTH} exceeded at ${path || 'root'}`)
    for (let i = 0; i < list.length; i++) {
      const node = list[i]
      const p = path ? `${path}[${i}]` : `[${i}]`
      if (!node || typeof node !== 'object') throw new Error(`invalid node at ${p}`)
      if (!NODE_TYPES.includes(node.type)) throw new Error(`invalid node type "${node.type}" at ${p}`)
      if (
        node.type === 'heading' &&
        node.attrs &&
        node.attrs.level != null &&
        (typeof node.attrs.level !== 'number' || node.attrs.level < 1 || node.attrs.level > 6)
      ) {
        throw new Error(`heading level must be 1..6 at ${p}`)
      }
      if (node.nid) {
        if (seen.has(node.nid)) throw new Error(`duplicate node id "${node.nid}" at ${p}`)
        seen.add(node.nid)
      }
      if (node.parentId != null && node.nid && String(node.parentId) === String(node.nid)) {
        throw new Error(`node cannot be its own parent at ${p}`)
      }
      if (node.parentId != null && node.parentId !== '') parentRefs.add(String(node.parentId))
      if (node.children && node.children.length) walk(node.children, depth + 1, p)
    }
  }
  walk(nodes, 0, null)
  for (const ref of parentRefs) {
    if (!seen.has(ref)) throw new Error(`parentId references missing node "${ref}"`)
  }
  return true
}

function flattenAst(nodes, parentId = null, out = []) {
  if (!Array.isArray(nodes)) return out
  nodes.forEach((node, i) => {
    if (!node || typeof node !== 'object') return
    const id = node.nid || genId()
    out.push({
      id,
      type: node.type,
      text: node.text || '',
      lang: node.lang || null,
      attrs: node.attrs && typeof node.attrs === 'object' ? { ...node.attrs } : {},
      parentId: node.parentId ?? parentId,
      order: node.order ?? i,
      children: []
    })
    if (node.children && node.children.length) flattenAst(node.children, id, out)
  })
  return out
}

function buildTree(flat) {
  if (!Array.isArray(flat)) return []
  const byId = new Map()
  flat.forEach((n, idx) => {
    byId.set(n.id, {
      nid: n.id,
      type: n.type,
      text: n.text || '',
      lang: n.lang || null,
      attrs: n.attrs && typeof n.attrs === 'object' ? { ...n.attrs } : {},
      parentId: n.parentId ?? null,
      order: n.order ?? idx,
      children: []
    })
  })
  const roots = []
  for (const n of flat) {
    const node = byId.get(n.id)
    const parent = n.parentId != null ? byId.get(String(n.parentId)) : null
    if (parent && parent !== node) parent.children.push(node)
    else roots.push(node)
  }
  const sortTree = (list) => {
    list.sort((a, b) => a.order - b.order)
    list.forEach((n) => sortTree(n.children))
  }
  sortTree(roots)
  return roots
}

module.exports = { NODE_TYPES, MAX_DEPTH, genId, normalizeTree, validateAstTree, flattenAst, buildTree }

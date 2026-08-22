const express = require('express')

const Document = require('../models/Document')
const Share = require('../models/Share')
const { flattenAst } = require('../validators/ast')
const { astToHtml } = require('../transform/html')
const { astToMarkdown, markdownToAst } = require('../transform/markdown')
const { astToPdf } = require('../transform/pdf')
const { sanitizeBlocks } = require('../security/sanitize')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

function countNodes(nodes) {
  return (nodes || []).reduce((acc, n) => acc + 1 + countNodes(n.children), 0)
}

function toSummary(doc) {
  return {
    _id: doc._id,
    title: doc.title,
    author: doc.author,
    updatedAt: doc.updatedAt,
    revision: doc.revision,
    blockCount: countNodes(doc.nodes)
  }
}

async function getDocumentOr404(id, res) {
  const doc = await Document.findById(id)
  if (!doc) {
    res.status(404).json({ error: 'document not found' })
    return null
  }
  return doc
}

async function getAccess(docId, userId) {
  const doc = await Document.findById(docId)
  if (!doc) return { doc: null, role: null }
  if (doc.owner.toString() === userId) return { doc, role: 'owner' }
  const share = await Share.findOne({ document: docId, user: userId })
  return { doc, role: share ? share.role : null }
}

router.get('/documents', requireAuth, async (req, res, next) => {
  try {
    const docs = await Document.find({ owner: req.userId }).sort({ updatedAt: -1 })
    res.json(docs.map(toSummary))
  } catch (e) {
    next(e)
  }
})

router.post('/documents', requireAuth, async (req, res, next) => {
  try {
    const doc = await Document.create({
      title: req.body.title || 'Untitled',
      author: req.body.author || 'Anonymous',
      owner: req.userId
    })
    res.status(201).json(toSummary(doc))
  } catch (e) {
    next(e)
  }
})

router.get('/documents/:id', requireAuth, async (req, res, next) => {
  try {
    const { doc, role } = await getAccess(req.params.id, req.userId)
    if (!doc) return res.status(404).json({ error: 'document not found' })
    if (!role) return res.status(403).json({ error: 'Access denied' })
    res.json({
      _id: doc._id,
      title: doc.title,
      author: doc.author,
      revision: doc.revision,
      updatedAt: doc.updatedAt,
      nodes: doc.nodes,
      blocks: flattenAst(doc.nodes),
      role
    })
  } catch (e) {
    next(e)
  }
})

router.delete('/documents/:id', requireAuth, async (req, res, next) => {
  try {
    const doc = await getDocumentOr404(req.params.id, res)
    if (!doc) return
    if (doc.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the owner can delete' })
    }
    await Share.deleteMany({ document: doc._id })
    await Document.deleteOne({ _id: doc._id })
    res.status(204).end()
  } catch (e) {
    next(e)
  }
})

router.post('/import/markdown', requireAuth, async (req, res, next) => {
  try {
    const nodes = sanitizeBlocks(markdownToAst(req.body.markdown || ''))
    const doc = await Document.create({
      title: req.body.title || 'Imported',
      author: req.body.author || 'Anonymous',
      owner: req.userId,
      nodes
    })
    res.status(201).json({ _id: doc._id, title: doc.title, blocks: flattenAst(doc.nodes) })
  } catch (e) {
    next(e)
  }
})

router.get('/documents/:id/export/html', requireAuth, async (req, res, next) => {
  try {
    const { doc, role } = await getAccess(req.params.id, req.userId)
    if (!doc) return res.status(404).json({ error: 'document not found' })
    if (!role) return res.status(403).json({ error: 'Access denied' })
    const body = astToHtml(doc.nodes)
    res.type('text/html').send(`<!doctype html><html><head><meta charset="utf-8"><title>${doc.title}</title></head><body>${body}</body></html>`)
  } catch (e) {
    next(e)
  }
})

router.get('/documents/:id/export/markdown', requireAuth, async (req, res, next) => {
  try {
    const { doc, role } = await getAccess(req.params.id, req.userId)
    if (!doc) return res.status(404).json({ error: 'document not found' })
    if (!role) return res.status(403).json({ error: 'Access denied' })
    res.type('text/markdown').send(astToMarkdown(doc.nodes))
  } catch (e) {
    next(e)
  }
})

router.get('/documents/:id/export/pdf', requireAuth, async (req, res, next) => {
  try {
    const { doc, role } = await getAccess(req.params.id, req.userId)
    if (!doc) return res.status(404).json({ error: 'document not found' })
    if (!role) return res.status(403).json({ error: 'Access denied' })
    const buffer = await astToPdf(doc.nodes)
    res.type('application/pdf').send(buffer)
  } catch (e) {
    next(e)
  }
})

module.exports = router

const express = require('express')
const Version = require('../models/Version')
const Document = require('../models/Document')
const { flattenAst } = require('../validators/ast')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/documents/:id/versions', requireAuth, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Document not found' })

    const versions = await Version.find({ document: doc._id })
      .sort({ revision: -1 })
      .populate('createdBy', 'name email color')
      .select('-nodes')

    res.json(versions)
  } catch (e) {
    next(e)
  }
})

router.get('/documents/:id/versions/:revision', requireAuth, async (req, res, next) => {
  try {
    const version = await Version.findOne({
      document: req.params.id,
      revision: Number(req.params.revision),
    }).populate('createdBy', 'name email color')

    if (!version) return res.status(404).json({ error: 'Version not found' })

    res.json({
      _id: version._id,
      document: version.document,
      revision: version.revision,
      title: version.title,
      nodes: version.nodes,
      blocks: flattenAst(version.nodes),
      createdBy: version.createdBy,
      createdAt: version.createdAt,
    })
  } catch (e) {
    next(e)
  }
})

router.post('/documents/:id/versions/:revision/restore', requireAuth, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    if (doc.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the owner can restore versions' })
    }

    const version = await Version.findOne({
      document: doc._id,
      revision: Number(req.params.revision),
    })
    if (!version) return res.status(404).json({ error: 'Version not found' })

    doc.title = version.title
    doc.nodes = version.nodes
    await doc.save()

    res.json({
      _id: doc._id,
      title: doc.title,
      revision: doc.revision,
    })
  } catch (e) {
    next(e)
  }
})

module.exports = router

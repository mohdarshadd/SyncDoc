const express = require('express')
const Share = require('../models/Share')
const User = require('../models/User')
const Document = require('../models/Document')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/documents/:id/shares', requireAuth, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    if (doc.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' })
    }
    const shares = await Share.find({ document: doc._id })
      .populate('user', 'name email color')
      .populate('sharedBy', 'name email')
    res.json(shares)
  } catch (e) {
    next(e)
  }
})

router.post('/documents/:id/shares', requireAuth, async (req, res, next) => {
  try {
    const { email, role } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    if (doc.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the owner can share' })
    }

    const targetUser = await User.findOne({ email: email.toLowerCase() })
    if (!targetUser) return res.status(404).json({ error: 'User not found' })
    if (targetUser._id.toString() === req.userId) {
      return res.status(400).json({ error: 'Cannot share with yourself' })
    }

    const share = await Share.findOneAndUpdate(
      { document: doc._id, user: targetUser._id },
      { role: role || 'viewer', sharedBy: req.userId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('user', 'name email color')

    res.status(201).json(share)
  } catch (e) {
    next(e)
  }
})

router.delete('/documents/:docId/shares/:shareId', requireAuth, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.docId)
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    if (doc.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the owner can remove shares' })
    }

    const share = await Share.findOneAndDelete({
      _id: req.params.shareId,
      document: doc._id,
    })
    if (!share) return res.status(404).json({ error: 'Share not found' })
    res.status(204).end()
  } catch (e) {
    next(e)
  }
})

router.get('/shared-with-me', requireAuth, async (req, res, next) => {
  try {
    const shares = await Share.find({ user: req.userId })
      .populate('document', 'title author updatedAt revision')
      .populate('sharedBy', 'name email')
    const docs = shares
      .filter((s) => s.document)
      .map((s) => ({
        ...s.document.toObject(),
        role: s.role,
        sharedBy: s.sharedBy,
        blockCount: 0,
      }))
    res.json(docs)
  } catch (e) {
    next(e)
  }
})

module.exports = router

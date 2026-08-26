const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const User = require('../models/User')

router.get('/user/profile', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user })
})

router.patch('/user/profile', requireAuth, async (req, res) => {
  const { name, color } = req.body
  const updates = {}
  if (name !== undefined) updates.name = name
  if (color !== undefined) updates.color = color
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' })
  }
  const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true })
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user })
})

router.post('/user/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' })
  }
  const user = await User.findById(req.userId).select('+password')
  if (!user) return res.status(404).json({ error: 'User not found' })
  const valid = await user.comparePassword(currentPassword)
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }
  user.password = newPassword
  await user.save()
  res.json({ ok: true })
})

module.exports = router

const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = require('express').Router()

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'syncdoc-access-secret-dev'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'syncdoc-refresh-secret-dev'
const ACCESS_EXPIRY = '15m'
const REFRESH_EXPIRY = '7d'

function signAccess(user) {
  return jwt.sign({ sub: user._id, email: user.email }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY })
}

function signRefresh(user) {
  return jwt.sign({ sub: user._id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY })
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

router.post('/auth/register', async (req, res) => {
  const { name, email, password, color } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' })
  }
  const existing = await User.findOne({ email })
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' })
  }
  const user = await User.create({ name, email, password, color: color || '#2997ff' })
  const accessToken = signAccess(user)
  const refreshToken = signRefresh(user)
  setRefreshCookie(res, refreshToken)
  res.status(201).json({ user, accessToken })
})

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  const accessToken = signAccess(user)
  const refreshToken = signRefresh(user)
  setRefreshCookie(res, refreshToken)
  res.json({ user, accessToken })
})

router.get('/auth/me', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  try {
    const payload = jwt.verify(auth.slice(7), ACCESS_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ error: 'User not found' })
    res.json({ user })
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
})

router.post('/auth/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) return res.status(401).json({ error: 'No refresh token' })
  try {
    const payload = jwt.verify(token, REFRESH_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ error: 'User not found' })
    const accessToken = signAccess(user)
    res.json({ accessToken })
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
})

router.post('/auth/logout', (_req, res) => {
  res.clearCookie('refreshToken')
  res.json({ ok: true })
})

module.exports = router

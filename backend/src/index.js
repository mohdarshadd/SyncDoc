require('dotenv').config()
const http = require('http')
const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')

const { connectDB, isConnected } = require('./db')
const authRouter = require('./routes/auth')
const documentsRouter = require('./routes/documents')
const sharesRouter = require('./routes/shares')
const versionsRouter = require('./routes/versions')
const profileRouter = require('./routes/profile')
const { attachSyncServer } = require('./sync/server')

const app = express()

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*'
const isProd = process.env.NODE_ENV === 'production'

app.use(helmet())
app.use(cors(corsOrigin()))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

app.get('/api/health', (req, res) => {
  res.json({ service: 'SyncDoc', mongo: isConnected() ? 'connected' : 'disconnected' })
})

app.use('/api', authRouter)
app.use('/api', documentsRouter)
app.use('/api', sharesRouter)
app.use('/api', versionsRouter)
app.use('/api', profileRouter)

if (isProd) {
  const distDir = path.resolve(__dirname, '..', '..', 'frontend', 'dist')
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir))
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/ws/')) {
        return next()
      }
      res.sendFile(path.join(distDir, 'index.html'))
    })
  }
}

function corsOrigin() {
  if (CLIENT_ORIGIN === '*') return '*'
  return (_origin, cb) => cb(null, true)
}

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  const status = err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500
  console.error(`[http] ${req.method} ${req.originalUrl} -> ${err.message}`)
  res.status(status).json({ error: err.message })
})

const server = http.createServer(app)
attachSyncServer(server)

const PORT = process.env.PORT || 4000

async function start() {
  await connectDB()
  server.listen(PORT, () => {
    console.log(`[http] SyncDoc listening on http://localhost:${PORT}`)
    console.log(`[ws]   SyncDoc websocket on ws://localhost:${PORT}/ws/<docId>`)
  })
}

start().catch((e) => {
  console.error('[http] failed to start:', e.message)
  process.exit(1)
})

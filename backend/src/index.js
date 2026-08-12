require('dotenv').config()
const http = require('http')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const { connectDB, isConnected } = require('./db')
const documentsRouter = require('./routes/documents')
const { attachSyncServer } = require('./sync/server')

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (req, res) => {
  res.json({ service: 'SyncDoc', mongo: isConnected() ? 'connected' : 'disconnected' })
})

app.use('/api', documentsRouter)

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

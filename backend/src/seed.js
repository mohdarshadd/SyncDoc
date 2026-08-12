require('dotenv').config()
const mongoose = require('mongoose')
const { connectDB } = require('./db')
const Document = require('./models/Document')

async function seed() {
  await connectDB()

  const nodes = [
    { type: 'heading', text: 'SyncDoc Technical Specification', attrs: { level: 1 } },
    {
      type: 'paragraph',
      text: 'A collaborative document engine using AST-based conflict resolution. Multiple users can edit structural blocks concurrently without destructive overwrites.'
    },
    { type: 'heading', text: 'Architecture', attrs: { level: 2 } },
    {
      type: 'paragraph',
      text: 'The system combines a Mongoose AST database, a Yjs CRDT synchronization layer, and a block-based React editor.'
    },
    { type: 'code', text: 'const doc = new Y.Doc()\ndoc.getArray("blocks").insert(0, [/* ... */])', lang: 'js' },
    { type: 'quote', text: 'Conflict-free Replicated Data Types guarantee convergence.' },
    {
      type: 'list',
      children: [
        { type: 'paragraph', text: 'AST Database (Express & Mongoose)' },
        { type: 'paragraph', text: 'Synchronization Engine (Node.js & Yjs)' },
        { type: 'paragraph', text: 'Custom Editor UI (React)' }
      ]
    }
  ]

  const doc = await Document.create({ title: 'SyncDoc Technical Specification', author: 'Team', nodes })
  console.log(`Seeded document id: ${doc._id}`)
  console.log(`Open in editor:    http://localhost:5173`)
  console.log(`Export HTML:       http://localhost:4000/api/documents/${doc._id}/export/html`)
  console.log(`Export PDF:        http://localhost:4000/api/documents/${doc._id}/export/pdf`)

  await mongoose.disconnect()
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})

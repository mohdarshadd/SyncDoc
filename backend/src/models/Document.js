const mongoose = require('mongoose')
const { astNodeSchema } = require('./AstNode')
const { normalizeTree, validateAstTree } = require('../validators/ast')
const Version = require('./Version')

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, default: 'Untitled' },
    author: { type: String, default: 'Anonymous', trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nodes: { type: [astNodeSchema], default: [] },
    revision: { type: Number, default: 0 },
    lastSavedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

documentSchema.pre('save', function (next) {
  try {
    normalizeTree(this.nodes)
    const plain = this.nodes.map((n) => n.toObject())
    validateAstTree(plain)
    this.revision = (this.revision || 0) + 1
    next()
  } catch (err) {
    next(err)
  }
})

documentSchema.post('save', async function (doc) {
  try {
    await Version.findOneAndUpdate(
      { document: doc._id, revision: doc.revision },
      {
        document: doc._id,
        revision: doc.revision,
        title: doc.title,
        nodes: doc.nodes,
        createdBy: doc.lastSavedBy || doc.owner,
      },
      { upsert: true, new: true }
    )
  } catch (e) {
    console.error(`[version] failed to save version for ${doc._id}: ${e.message}`)
  }
})

module.exports = mongoose.model('Document', documentSchema)

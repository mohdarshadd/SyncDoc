const mongoose = require('mongoose')
const { astNodeSchema } = require('./AstNode')
const { normalizeTree, validateAstTree } = require('../validators/ast')

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, default: 'Untitled' },
    author: { type: String, default: 'Anonymous', trim: true },
    nodes: { type: [astNodeSchema], default: [] },
    revision: { type: Number, default: 0 }
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

module.exports = mongoose.model('Document', documentSchema)

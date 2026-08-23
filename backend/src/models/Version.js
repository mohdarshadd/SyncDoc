const mongoose = require('mongoose')
const { astNodeSchema } = require('./AstNode')

const versionSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    revision: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      default: 'Untitled',
    },
    nodes: {
      type: [astNodeSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

versionSchema.index({ document: 1, revision: 1 }, { unique: true })

const Version = mongoose.model('Version', versionSchema)
module.exports = Version

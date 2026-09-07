const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    blockId: { type: String, required: true },
    from: { type: Number, default: 0 },
    to: { type: Number, default: 0 },
    authorId: { type: String, default: 'anonymous' },
    authorName: { type: String, default: 'Anonymous', trim: true },
    text: { type: String, default: '', trim: true, maxlength: 4000 },
    created: { type: Number, default: 0 },
    resolved: { type: Boolean, default: false }
  },
  { _id: false }
)

const Comment = mongoose.model('Comment', commentSchema)

module.exports = { commentSchema, Comment }
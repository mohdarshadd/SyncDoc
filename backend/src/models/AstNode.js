const { Schema } = require('mongoose')
const { NODE_TYPES } = require('../validators/ast')

const astNodeSchema = new Schema(
  {
    nid: { type: String },
    type: { type: String, enum: NODE_TYPES, required: true },
    text: { type: String, default: '' },
    lang: { type: String, default: null },
    attrs: { type: Schema.Types.Mixed, default: () => ({}) },
    parentId: { type: String, default: null },
    order: { type: Number, default: 0 }
  },
  { _id: true }
)

astNodeSchema.add({ children: { type: [astNodeSchema], default: [] } })

module.exports = { astNodeSchema }

module.exports = { astNodeSchema }

const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/syncdoc'

async function connectDB(uri = MONGO_URI) {
  await mongoose.connect(uri)
  console.log(`[db] connected to ${uri}`)
  return mongoose.connection
}

function isConnected() {
  return mongoose.connection.readyState === 1
}

module.exports = { connectDB, isConnected }

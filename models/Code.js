const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date,
    default: null
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Code', codeSchema); 
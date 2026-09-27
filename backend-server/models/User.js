const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  role: { type: String, enum: ['CONDUCTOR', 'PASSENGER', 'ADMIN'], default: 'PASSENGER' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
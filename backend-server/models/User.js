const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['CONDUCTOR', 'DEPOT_ADMIN'], required: true },
  pin: { type: String, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
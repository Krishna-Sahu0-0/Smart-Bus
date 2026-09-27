const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  stageId: { type: String, required: true, unique: true, trim: true },
  stageName: { type: String, required: true, trim: true },
  routeId: { type: String, required: true, index: true },
  sequence: { type: Number, required: true, min: 1 },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  active: { type: Boolean, default: true },
});

module.exports = mongoose.model('Stage', stageSchema);
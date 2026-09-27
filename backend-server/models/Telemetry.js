const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
  busId: { type: String, required: true, index: true, trim: true },
  routeId: { type: String, required: true, index: true, trim: true },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  speedKmh: { type: Number, required: true, min: 0 },
  timestamp: { type: Date, required: true, index: true },
  receivedAt: { type: Date, default: Date.now },
});

telemetrySchema.index({ busId: 1, timestamp: -1 });

module.exports = mongoose.model('Telemetry', telemetrySchema);
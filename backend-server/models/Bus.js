const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busId: { type: String, required: true, unique: true, trim: true },
  registrationNumber: { type: String, required: true, trim: true },
  routeId: { type: String, required: true, index: true },
  capacity: { type: Number, default: 40, min: 1 },
  status: { type: String, enum: ['OPERATIONAL', 'TRAFFIC_DELAY', 'VEHICLE_DISABLED'], default: 'OPERATIONAL' },
  currentLatitude: Number,
  currentLongitude: Number,
  currentSpeedKmh: { type: Number, default: 0, min: 0 },
  currentStageId: String,
  occupancy: { type: Number, default: 0, min: 0 },
  availableSeats: { type: Number, default: 40, min: 0 },
  lastTelemetryAt: Date,
  trafficDelaySince: Date,
  ewmaSpeedKmh: { type: Number, min: 0 },
});

module.exports = mongoose.model('Bus', busSchema);
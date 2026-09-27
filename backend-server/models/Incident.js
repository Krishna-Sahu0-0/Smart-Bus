const mongoose = require('mongoose');

const incidentCategories = [
  'ENGINE_FAILURE',
  'TYRE_PUNCTURE',
  'ACCIDENT',
  'ELECTRICAL_FAILURE',
  'FUEL_ISSUE',
  'MEDICAL_EMERGENCY',
  'STATIONARY_TIMEOUT',
  'OTHER',
];

const incidentSchema = new mongoose.Schema({
  incidentId: { type: String, required: true, unique: true, trim: true },
  busId: { type: String, required: true, index: true },
  routeId: { type: String, required: true, index: true },
  conductorId: { type: String, trim: true },
  category: { type: String, enum: incidentCategories, required: true },
  description: { type: String, trim: true, maxlength: 1000 },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  reportedAt: { type: Date, required: true, default: Date.now },
  stationarySince: Date,
  resolvedAt: Date,
  status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN', index: true },
  commuterAlerted: { type: Boolean, default: false },
}, { timestamps: true });

incidentSchema.index({ busId: 1, status: 1 });

module.exports = mongoose.model('Incident', incidentSchema);
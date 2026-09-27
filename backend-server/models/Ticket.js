const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, trim: true },
  busId: { type: String, required: true, index: true },
  routeId: { type: String, required: true },
  ticketType: { type: String, enum: ['CASH', 'UPI', 'CARD', 'STUDENT_QR_PASS', 'SENIOR_QR_PASS', 'MONTHLY_PASS', 'QUICK_PASS_COUNT'], required: true },
  passId: String,
  fromStage: { type: String, required: true },
  toStage: { type: String, required: true },
  fromSequence: { type: Number, required: true },
  toSequence: { type: Number, required: true },
  passengerCount: { type: Number, required: true, min: 1 },
  fareCharged: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
  expiredAt: Date,
});

module.exports = mongoose.model('Ticket', ticketSchema);
const mongoose = require('mongoose');

const passSchema = new mongoose.Schema({
  passId: { type: String, required: true, unique: true, trim: true },
  passType: { type: String, enum: ['STUDENT', 'SENIOR_CITIZEN', 'MONTHLY_COMMUTER'], required: true },
  holderName: { type: String, required: true, trim: true },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  permittedStages: [{ type: String }],
  active: { type: Boolean, default: true },
});

module.exports = mongoose.model('Pass', passSchema);
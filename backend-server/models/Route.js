const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeId: { type: String, required: true, unique: true, trim: true },
  routeName: { type: String, required: true, trim: true },
  stageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stage' }],
  active: { type: Boolean, default: true },
});

module.exports = mongoose.model('Route', routeSchema);
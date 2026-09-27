const Telemetry = require('../models/Telemetry');
const { processTelemetry, validateTelemetryInput } = require('../services/telemetryService');

const error = (res, message, status = 400) => res.status(status).json({ success: false, message });

function createTelemetryController(io) {
  return {
    createTelemetry: async (req, res) => {
      const input = {
        busId: req.body.busId,
        routeId: req.body.routeId,
        latitude: Number(req.body.latitude),
        longitude: Number(req.body.longitude),
        speedKmh: Number(req.body.speedKmh),
        timestamp: req.body.timestamp,
      };
      const validation = await validateTelemetryInput(input);
      if (validation.message) return error(res, validation.message, validation.status);
      const result = await processTelemetry({ io, ...input, bus: validation.bus, timestamp: validation.timestamp });
      return res.status(201).json({ success: true, ...result });
    },
    listTelemetry: async (req, res) => {
      const limitValue = Number.parseInt(req.query.limit, 10);
      const limit = Number.isInteger(limitValue) && limitValue > 0 ? Math.min(limitValue, 100) : 50;
      const telemetry = await Telemetry.find({ busId: req.params.busId }).sort({ timestamp: -1 }).limit(limit).lean();
      return res.json({ success: true, telemetry });
    },
  };
}

module.exports = createTelemetryController;
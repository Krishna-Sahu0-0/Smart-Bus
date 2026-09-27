const crypto = require('crypto');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const User = require('../models/User');
const Incident = require('../models/Incident');
const { reportIncident, resolveIncident } = require('../services/breakdownService');

const categories = ['ENGINE_FAILURE', 'TYRE_PUNCTURE', 'ACCIDENT', 'ELECTRICAL_FAILURE', 'FUEL_ISSUE', 'MEDICAL_EMERGENCY', 'STATIONARY_TIMEOUT', 'OTHER'];
const error = (res, message, status = 400) => res.status(status).json({ success: false, message });
const isCoordinate = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;

function createIncidentController(io) {
  return {
    reportSos: async (req, res) => {
      const { busId, routeId, conductorId, category, description } = req.body;
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);
      const bus = await Bus.findOne({ busId });
      if (!bus) return error(res, 'Bus not found', 404);
      const route = await Route.findOne({ routeId });
      if (!route) return error(res, 'Route not found', 404);
      if (bus.routeId !== routeId) return error(res, 'Bus is not assigned to this route');
      const conductor = await User.findOne({ staffId: conductorId, role: 'CONDUCTOR', active: true }).select('staffId name role active').lean();
      if (!conductor) return error(res, 'Active conductor not found', 404);
      if (!categories.includes(category) || category === 'STATIONARY_TIMEOUT') return error(res, 'Invalid incident category');
      if (!isCoordinate(latitude, -90, 90) || !isCoordinate(longitude, -180, 180)) return error(res, 'Valid latitude and longitude are required');
      const result = await reportIncident({ io, bus, routeId, conductorId, category, description, latitude, longitude });
      return res.status(result.duplicate ? 200 : 201).json({ success: true, duplicate: result.duplicate, incident: result.incident });
    },
    resolve: async (req, res) => {
      const incident = await Incident.findOne({ incidentId: req.params.incidentId });
      if (!incident) return error(res, 'Incident not found', 404);
      if (incident.status !== 'OPEN') return error(res, 'Incident is already resolved', 409);
      const result = await resolveIncident({ io, incident });
      return res.json({ success: true, incident: result.incident, busStatus: result.bus ? result.bus.status : null });
    },
    list: async (req, res) => {
      const filter = {};
      ['busId', 'routeId', 'status'].forEach((key) => { if (req.query[key]) filter[key] = req.query[key]; });
      return res.json({ success: true, incidents: await Incident.find(filter).sort({ reportedAt: -1 }).limit(100).lean() });
    },
    get: async (req, res) => {
      const incident = await Incident.findOne({ incidentId: req.params.incidentId }).lean();
      return incident ? res.json({ success: true, incident }) : error(res, 'Incident not found', 404);
    },
  };
}

module.exports = createIncidentController;
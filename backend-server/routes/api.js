const express = require('express');
const createController = require('../controllers/eposController');
const createTelemetryController = require('../controllers/telemetryController');

module.exports = (io) => {
  const router = express.Router();
  const controller = createController(io);
  const telemetryController = createTelemetryController(io);
  const handle = (action) => (req, res, next) => Promise.resolve(action(req, res, next)).catch(next);
  router.get('/buses', handle(controller.listBuses));
  router.get('/buses/:busId', handle(controller.getBus));
  router.get('/routes', handle(controller.listRoutes));
  router.get('/routes/:routeId', handle(controller.getRoute));
  router.get('/stages/:routeId', handle(controller.listStages));
  router.get('/buses/:busId/occupancy', handle(controller.getOccupancy));
  router.post('/tickets', handle(controller.createTicket));
  router.post('/passes/scan', handle(controller.scanPass));
  router.post('/passes/quick-count', handle(controller.quickCount));
  router.post('/telemetry', handle(telemetryController.createTelemetry));
  router.get('/telemetry/:busId', handle(telemetryController.listTelemetry));
  router.use((err, req, res, next) => { console.error(`API error: ${err.message}`); res.status(500).json({ success: false, message: 'Internal server error' }); });
  return router;
};
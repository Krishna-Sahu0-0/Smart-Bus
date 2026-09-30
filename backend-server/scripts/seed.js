require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Stage = require('../models/Stage');
const Ticket = require('../models/Ticket');
const Pass = require('../models/Pass');
const Telemetry = require('../models/Telemetry');
const Incident = require('../models/Incident');

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([User.deleteMany({}), Bus.deleteMany({}), Route.deleteMany({}), Stage.deleteMany({}), Ticket.deleteMany({}), Pass.deleteMany({}), Telemetry.deleteMany({}), Incident.deleteMany({})]);
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'stages.json'), 'utf8'));
  const stages = await Stage.insertMany(data.stages.map((stage) => ({ ...stage, active: true })));
  const route = await Route.create({ routeId: data.routeId, routeName: data.routeName, stageIds: stages.map((stage) => stage._id), active: true });
  await User.create({ staffId: 'EMP-8842', name: 'Demo Conductor', role: 'CONDUCTOR', pin: '4521', active: true });
  await Bus.create({
    busId: data.bus.busId,
    registrationNumber: data.bus.registrationNumber,
    routeId: route.routeId,
    capacity: 50,
    status: 'OPERATIONAL',
    currentStageId: stages[0].stageId,
    currentLatitude: stages[0].latitude,
    currentLongitude: stages[0].longitude,
    currentSpeedKmh: 0,
    occupancy: 0,
    availableSeats: 50,
  });
  const validUntil = new Date('2026-12-31T23:59:59.999Z');
  await Pass.insertMany([
    { passId: 'STU-SKLM-2026-01', passType: 'STUDENT', holderName: 'M. Swapna', validFrom: new Date('2026-01-01T00:00:00.000Z'), validUntil, permittedStages: ['STAGE_01', 'STAGE_02', 'STAGE_03', 'STAGE_04', 'STAGE_05'], active: true },
    { passId: 'STU-SKLM-2026-44', passType: 'STUDENT', holderName: 'A. Krishna', validFrom: new Date('2026-01-01T00:00:00.000Z'), validUntil, permittedStages: ['STAGE_01', 'STAGE_02', 'STAGE_03'], active: true },
    { passId: 'STU-SKLM-2026-92', passType: 'STUDENT', holderName: 'S. Dipesh', validFrom: new Date('2026-01-01T00:00:00.000Z'), validUntil, permittedStages: ['STAGE_03', 'STAGE_04', 'STAGE_05'], active: true },
  ]);
  console.log('SmartBus Srikakulam seed complete: 1 user, 1 bus, 1 route, 5 stages, 3 sample passes.');
}

seed().catch((error) => { console.error(`Seed failed: ${error.message}`); process.exitCode = 1; }).finally(() => mongoose.disconnect());

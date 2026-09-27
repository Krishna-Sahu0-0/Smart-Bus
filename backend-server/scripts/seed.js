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

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([User.deleteMany({}), Bus.deleteMany({}), Route.deleteMany({}), Stage.deleteMany({}), Ticket.deleteMany({}), Pass.deleteMany({})]);
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'stages.json'), 'utf8'));
  const stages = await Stage.insertMany(data.stages.map((stage) => ({ ...stage, active: true })));
  const route = await Route.create({ routeId: data.routeId, routeName: 'Vijayawada to Guntur Demo Route', stageIds: stages.map((stage) => stage._id), active: true });
  await User.create({ staffId: 'COND-001', name: 'Demo Conductor', role: 'CONDUCTOR', pin: '1234', active: true });
  await Bus.create({ busId: 'AP11Z1234', registrationNumber: 'AP11Z1234', routeId: route.routeId, capacity: 40, status: 'OPERATIONAL', currentStageId: stages[0].stageId, occupancy: 0, availableSeats: 40 });
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await Pass.insertMany([
    { passId: 'PASS-STUDENT-001', passType: 'STUDENT', holderName: 'Demo Student', validFrom: new Date(Date.now() - 86400000), validUntil, permittedStages: stages.map((stage) => stage.stageId), active: true },
    { passId: 'PASS-SENIOR-001', passType: 'SENIOR_CITIZEN', holderName: 'Demo Senior', validFrom: new Date(Date.now() - 86400000), validUntil, permittedStages: stages.map((stage) => stage.stageId), active: true },
    { passId: 'PASS-MONTHLY-001', passType: 'MONTHLY_COMMUTER', holderName: 'Demo Commuter', validFrom: new Date(Date.now() - 86400000), validUntil, permittedStages: stages.map((stage) => stage.stageId), active: true },
  ]);
  console.log('SmartBus demo seed complete: 1 user, 1 bus, 1 route, 4 stages, 3 passes.');
}

seed().catch((error) => { console.error(`Seed failed: ${error.message}`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
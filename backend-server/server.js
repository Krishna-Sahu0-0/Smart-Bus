require('dotenv').config();

const fs = require('fs');
const path = require('path');
const cors = require('cors');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const apiRouter = require('./routes/api');

const routeConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'stages.json'), 'utf8'));
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
});

const port = Number(process.env.PORT) || 5000;
let databaseStatus = 'disconnected';

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use('/api', apiRouter(io));

app.get('/api/health', (req, res) => {
  const connected = databaseStatus === 'connected';
  res.status(connected ? 200 : 503).json({
    success: connected,
    service: 'SmartBus Backend',
    database: databaseStatus,
    routeId: routeConfig.routeId,
    routeName: routeConfig.routeName,
    stageCount: routeConfig.stages.length,
  });
});

app.get('/api/route-config', (req, res) => {
  res.json({
    success: true,
    routeId: routeConfig.routeId,
    routeName: routeConfig.routeName,
    routeCode: routeConfig.routeCode,
    serviceType: routeConfig.serviceType,
    farePerStage: routeConfig.farePerStage,
    bus: routeConfig.bus,
    stages: routeConfig.stages,
    routeWaypoints: routeConfig.routeWaypoints || [],
  });
});

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Socket client disconnected: ${socket.id}`));
});

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    console.warn('MongoDB is not configured. Set MONGODB_URI in backend-server/.env.');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    databaseStatus = 'connected';
    console.log('MongoDB connected.');
  } catch (error) {
    databaseStatus = 'error';
    console.error(`MongoDB connection failed: ${error.message}`);
  }
}

async function startServer() {
  await connectDatabase();
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`SmartBus Backend listening on http://localhost:${port}`);
    console.log(`LAN clients can use http://<LAPTOP-LAN-IP>:${port}`);
    console.log(`Route: ${routeConfig.routeName} (${routeConfig.routeId})`);
    console.log(`Stages: ${routeConfig.stages.map((stage) => stage.stageName).join(' -> ')}`);
    console.log(`Health endpoint: http://localhost:${port}/api/health`);
  });
}

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exitCode = 1;
});

module.exports = { app, httpServer, io, routeConfig };

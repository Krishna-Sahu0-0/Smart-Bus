require('dotenv').config();

const cors = require('cors');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});

const port = Number(process.env.PORT) || 5000;
let databaseStatus = 'disconnected';

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  const connected = databaseStatus === 'connected';

  res.status(connected ? 200 : 503).json({
    success: connected,
    service: 'SmartBus Backend',
    database: databaseStatus,
  });
});

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
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

  httpServer.listen(port, () => {
    console.log(`SmartBus Backend listening on http://localhost:${port}`);
    console.log(`Health endpoint: http://localhost:${port}/api/health`);
  });
}

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exitCode = 1;
});

module.exports = { app, httpServer, io };
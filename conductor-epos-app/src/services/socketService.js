import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

const SOCKET_EVENTS = [
  'BUS_TELEMETRY',
  'STAGE_ARRIVAL',
  'OCCUPANCY_UPDATE',
  'TRAFFIC_DELAY',
  'SERVICE_STATUS',
  'ETA_UPDATE',
  'BREAKDOWN_REPORTED',
  'BREAKDOWN_ALERT',
  'BREAKDOWN_RESOLVED',
];

let socket = null;
const subscribers = new Set();

function notifyStatus(status) {
  subscribers.forEach(({ onStatus }) => onStatus(status));
}

function notifyEvent(event, payload) {
  subscribers.forEach(({ onEvent }) => onEvent(event, payload));
}

function createSocket() {
  socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionAttempts: Infinity,
  });
  socket.on('connect', () => notifyStatus('LIVE'));
  socket.on('disconnect', () => notifyStatus('OFFLINE'));
  socket.on('connect_error', () => notifyStatus('OFFLINE'));
  SOCKET_EVENTS.forEach((event) => socket.on(event, (payload) => notifyEvent(event, payload)));
}

export function subscribeToSocket(onEvent, onStatus) {
  const subscriber = { onEvent, onStatus };
  subscribers.add(subscriber);
  if (!socket) createSocket();
  onStatus(socket.connected ? 'LIVE' : 'CONNECTING');

  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0 && socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  };
}

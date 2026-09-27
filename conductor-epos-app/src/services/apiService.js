import { API_BASE_URL } from '../utils/constants';

const REQUEST_TIMEOUT_MS = 8000;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { Accept: 'application/json', ...(options.headers || {}) },
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  } catch (error) {
    if (error.name === 'AbortError' || error.name === 'TypeError') throw new Error('Unable to connect to SmartBus server.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const apiService = {
  get: (path) => request(path),
  post: (path, body) => request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
  getBus: (busId) => request(`/buses/${busId}`),
  getOccupancy: (busId) => request(`/buses/${busId}/occupancy`),
  getStages: (routeId) => request(`/stages/${routeId}`),
  createTicket: (payload) => request('/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  createQuickPassCount: (payload) => request('/passes/quick-count', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
};
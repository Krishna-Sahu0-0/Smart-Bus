import { API_BASE_URL } from '../utils/constants';

const REQUEST_TIMEOUT_MS = 8000;

async function request(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: 'application/json' }, signal: controller.signal });
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
  getBuses: () => request('/buses'),
  getBus: (busId) => request(`/buses/${busId}`),
  getStages: (routeId) => request(`/stages/${routeId}`),
  getOccupancy: (busId) => request(`/buses/${busId}/occupancy`),
  getEta: (busId) => request(`/buses/${busId}/eta`),
};

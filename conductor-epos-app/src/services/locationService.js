import * as Location from 'expo-location';
import { TELEMETRY_INTERVAL_MS } from '../utils/constants';

export async function requestForegroundLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  return {
    granted: permission.granted,
    canAskAgain: permission.canAskAgain,
    status: permission.status,
  };
}

export async function startForegroundTracking(onLocation, onError) {
  try {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: TELEMETRY_INTERVAL_MS,
        distanceInterval: 0,
        mayShowUserSettingsDialog: true,
      },
      onLocation,
    );
    return () => subscription.remove();
  } catch (error) {
    onError(error);
    return () => {};
  }
}

export function toTelemetryPosition(location) {
  const { latitude, longitude, speed } = location.coords;
  const hasDeviceSpeed = Number.isFinite(speed) && speed >= 0;
  return {
    latitude,
    longitude,
    speedKmh: hasDeviceSpeed ? Number((speed * 3.6).toFixed(2)) : 0,
    speedAvailable: hasDeviceSpeed,
    timestamp: new Date(location.timestamp || Date.now()).toISOString(),
  };
}
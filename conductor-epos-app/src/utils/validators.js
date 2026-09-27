export function validateLogin(staffId, pin) {
  if (!staffId.trim()) return 'Enter your staff ID.';
  if (!pin.trim()) return 'Enter your PIN.';
  return null;
}

export function validateJourney(origin, destination, passengerCount, fare) {
  if (!origin || !destination) return 'Select an origin and destination stage.';
  if (origin.stageId === destination.stageId || origin.sequence >= destination.sequence) return 'Destination must be after the origin.';
  if (!Number.isInteger(passengerCount) || passengerCount < 1) return 'Passenger count must be a positive integer.';
  if (!Number.isFinite(fare) || fare < 0) return 'Fare must be zero or greater.';
  return null;
}
# SmartBus Project — GitHub Copilot Instructions

## Project

SmartBus is a bus fleet management and intelligent public transportation prototype.

Repository structure:

- `backend-server/` — Express + MongoDB + Mongoose backend
- `conductor-epos-app/` — Expo React Native conductor E-POS mobile application

The backend is the source of truth for business logic and operational state.

## Architecture

Backend:
- Node.js
- Express
- MongoDB
- Mongoose
- Turf.js
- Socket.io

Mobile:
- React Native
- Expo Managed workflow
- Expo Go for Android testing
- React Navigation
- AsyncStorage where required

Do not introduce a different backend architecture.

Do not introduce SQL/PostgreSQL/Firebase unless explicitly requested.

Do not introduce Redux or another state-management library unless explicitly requested.

## Phase Order

Follow the SmartBus implementation phases strictly.

### Backend

Phase 1 — Foundation
- Express server
- MongoDB connection
- Mongoose models
- health-check endpoint
- Socket.io connection

Phase 2 — Fleet data
- buses
- routes
- stages
- stage configuration

Phase 3 — Ticket engine
- cash tickets
- UPI tickets
- QR passes
- active ticket lifecycle
- occupancy calculation

Phase 4 — GPS/geofence engine
- GPS ingestion
- Turf distance
- 150 m geofence
- stage arrival detection
- automatic ticket expiration

Phase 5 — Telemetry
- speed tracking
- < 5 km/h
- > 5 minutes
- traffic-delay state
- EWMA ETA

Phase 6 — Breakdown
- conductor SOS
- incident categories
- stationary timeout
- vehicle disabled state
- commuter alert

### Mobile

Phase 7 — Mobile integration
- E-POS → backend
- backend → commuter
- real-time Socket.io events

Current mobile milestones:

- 7A — E-POS foundation
- 7A — Ticketing
- 7B — QR pass scanning
- 7C — GPS + telemetry
- 7D — Socket.io integration
- 7E — SOS + offline synchronization
- 7F — commuter application

Do not automatically start the next milestone after completing one.

Stop at the requested milestone.

## Completed Backend State

Backend Phases 1–6 are implemented and pushed.

Important latest backend compliance:
- Traffic delay:
  - speed < 5 km/h
  - outside 150 m stage geofence
  - more than 5 minutes
- Breakdown stationary timeout:
  - speed exactly 0 km/h
  - outside stage geofence
  - more than 15 minutes
- Stage geofence:
  - 150 m
- EWMA:
  - gamma = 0.3
- ETA uses backend-authoritative calculations.
- VEHICLE_DISABLED has priority over traffic state.

Do not change these thresholds unless the specification explicitly requires it.

## Current Mobile State

Completed:
- Expo SDK 57 E-POS application
- Login/session abstraction
- backend connectivity
- fleet/stage display
- ticket creation
- CASH
- UPI
- CARD
- quick pass counter
- backend-authoritative occupancy
- QR pass scanning
- camera permission handling

Latest completed mobile commit:
`d930cada32250ede0bdbe08c9d0b3dc3b83b41bb`

Next milestone:
Phase 7C — GPS + telemetry integration.

## Backend Authority

Do not duplicate backend business rules in React Native.

The backend owns:
- occupancy calculation
- stage ordering
- geofence calculations
- ticket expiration
- traffic detection
- EWMA
- ETA
- vehicle service state
- breakdown state
- incident state

The mobile app should display backend results.

## Testing Rules

Before modifying code:

1. Inspect the existing implementation.
2. Inspect the relevant backend/mobile API contract.
3. Run the relevant baseline tests.
4. Make the smallest change required.
5. Do not rewrite working functionality unnecessarily.

After implementation:

- run `npm test` for backend changes
- run relevant simulation scripts
- run `npx expo export --platform android` for mobile changes
- run `git diff --check`
- inspect diagnostics
- check `git status`
- verify existing phases still work

Never claim physical Android/Expo Go testing unless a physical device was actually tested.

## Expo Rules

Use Expo Managed workflow.

Do not:
- introduce Android Studio
- introduce Gradle/native builds
- eject/prebuild unnecessarily
- upgrade Expo without explicit approval

Install packages using Expo-compatible versions.

For physical Android testing, use the laptop LAN IP instead of `localhost`.

## Network

Backend development server:
- port 5000

Expo development server:
- normally port 8081

Physical Android devices cannot access the laptop backend using `localhost`.

Use:

`EXPO_PUBLIC_API_URL=http://<LAPTOP-LAN-IP>:5000/api`

## Git Rules

Work only on the current branch unless explicitly requested.

Do not force-push.

Do not reset or discard user changes without explicit permission.

Before committing:
- verify intended files only
- run `git diff --check`
- run relevant tests

Use the commit message specified in the implementation prompt.

Push only after validation succeeds.

## Scope Control

Do not add features from a future phase.

For example:

If implementing GPS:
- do not add Socket.io
- do not add SOS
- do not add offline synchronization
- do not add commuter application

If implementing Socket.io:
- do not redesign ticketing
- do not rewrite GPS

Keep each milestone independently testable.

## Important

When a milestone is complete:

1. Report exactly what was implemented.
2. Report tests performed and their results.
3. Report anything not physically tested.
4. Report the commit hash.
5. Stop.

Do not automatically continue to the next phase.
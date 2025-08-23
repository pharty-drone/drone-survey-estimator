# drone-survey-estimator

Basic map demo for estimating roof measurements.

## React HUD scaffold

See [`src/DroneRoofEstimatorHUD.tsx`](src/DroneRoofEstimatorHUD.tsx) for a minimal
React + MapLibre + TerraDraw implementation with a bottom telemetry strip and a
right-side estimate drawer. Install dependencies then drop the component into
your app and plug in your own pricing logic.

## Coverage and time estimates

[`src/coverage.ts`](src/coverage.ts) contains small helpers for computing the
footprint of a camera at altitude and deriving survey lane spacing, trigger
distance and mission time for rectangular areas. These functions can be imported
into your own planner or estimator modules.

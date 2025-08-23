# Drone Mission Planner Prompt for Codex

This repository aims to implement a modular, web-based mission planner for multi‑drone mapping and inspection operations. The following requirements should be treated as a concise specification for the system.

## Core scope
- Draw and edit polygons or polylines on a MapLibre map (AOI or corridor).
- Import/Export GeoJSON.
- Maintain libraries for airframes and payloads with realistic performance limits.
- Generate Nadir grids and Oblique missions (4–8 headings) with adjustable overlaps.
- Estimate coverage, photos, flight time, batteries, and storage.
- Split survey stripes across K drones using LPT to reduce makespan.
- Enforce payload speed limits and basic NFZ/RTH constraints.
- Export missions as MAVLink and DJI Pilot 2‑style files.

## Acceptance checks
1. Drawing a roof or site polygon reports area within ±1 % of a Turf reference.
2. Choosing Mavic 3E vs M300 + P1 updates speed and endurance limits.
3. Focal length changes recompute swath and trigger spacing.
4. Grid/Oblique generators keep footprints inside the AOI and avoid gaps.
5. Photo centers cover ≥ (1 – ε) of the AOI at requested overlaps.
6. Estimator predicts flight time within ±10 % of benchmark missions.
7. Makespan decreases as drone count increases, with no stripe collisions.
8. Planned altitude never exceeds aircraft limits and routes avoid NFZ buffers.
9. Upload to DJI/MAVLink → arm → start → progress → pause/resume is supported.

## Supporting diagrams
The `docs/images` folder contains illustrative diagrams:

1. `grid_example.svg` – sample AOI with grid coverage.
2. `oblique_example.svg` – oblique survey directions.
3. `lpt_split.svg` – stripes split among four drones.
4. `mission_time_breakdown.svg` – example time allocation.
5. `system_architecture.svg` – block diagram of major modules.

Use these visuals as guidance when implementing UI and planner behavior.

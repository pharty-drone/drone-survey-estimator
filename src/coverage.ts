export type Camera = {
  sensorWidthMm: number;
  sensorHeightMm: number;
  imageWidthPx: number;
  imageHeightPx: number;
  focalMm: number; // physical focal length
  trigLatencySec?: number;
};

export type PlanInputs = {
  altitudeM: number;
  frontOverlap: number; // 0.7 = 70%
  sideOverlap: number;
  gsMps: number; // ground speed m/s
  turnTimeSec: number; // per 180° turn
  climbRate: number;
  descendRate: number;
};

export type CoverageResult = {
  fx: number; // footprint width (m)
  fy: number; // footprint height (m)
  gsdX: number; // ground sample distance along width (m/px)
  gsdY: number; // ground sample distance along height (m/px)
  laneSpacing: number; // spacing between survey lanes (m)
  triggerDist: number; // distance between exposures along-track (m)
  exposureGap: number; // time between exposures (s)
};

/**
 * Compute basic coverage/trigger spacing for a camera at a given altitude.
 * Returns the footprint dimensions, lane spacing, trigger distance and GSD.
 */
export function coverageFrom(camera: Camera, p: PlanInputs): CoverageResult {
  const { sensorWidthMm, sensorHeightMm, focalMm, imageWidthPx, imageHeightPx } = camera;
  const fx = (p.altitudeM * sensorWidthMm) / focalMm; // meters
  const fy = (p.altitudeM * sensorHeightMm) / focalMm; // meters
  const gsdX = fx / imageWidthPx; // meters per pixel (width)
  const gsdY = fy / imageHeightPx; // meters per pixel (height)

  const laneSpacing = fy * (1 - p.sideOverlap); // meters between strips
  const triggerDist = fx * (1 - p.frontOverlap); // along-track photo spacing

  const photoRate = p.gsMps / Math.max(0.1, triggerDist); // photos/s
  const exposureGap = 1 / photoRate + (camera.trigLatencySec || 0);

  return { fx, fy, gsdX, gsdY, laneSpacing, triggerDist, exposureGap };
}

export type TimeEstimate = {
  lanes: number;
  laneLen: number;
  photoCount: number;
  surveyTimeSec: number;
  approxMissionTimeSec: number;
};

/**
 * Quick time estimate for a rectangular area of interest.
 * Lm and Wm are the length and width of the rectangle in meters.
 */
export function timeEstimateRect(
  Lm: number,
  Wm: number,
  cam: Camera,
  plan: PlanInputs
): TimeEstimate {
  const { laneSpacing, triggerDist } = coverageFrom(cam, plan);
  const lanes = Math.ceil(Wm / laneSpacing);
  const laneLen = Lm;
  const surveyDist = lanes * laneLen;
  const travelTime = surveyDist / plan.gsMps + (lanes - 1) * plan.turnTimeSec;
  const photoCount = Math.ceil(laneLen / triggerDist) * lanes;

  return {
    lanes,
    laneLen,
    photoCount,
    surveyTimeSec: travelTime,
    approxMissionTimeSec:
      travelTime + plan.altitudeM / plan.climbRate + plan.altitudeM / plan.descendRate,
  };
}

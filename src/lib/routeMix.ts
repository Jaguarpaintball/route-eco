export type RouteMix = {
  motorway: number;
  road: number;
  winding: number;
};

export type RouteMixInput = RouteMix & {
  distanceKm: number;
  motorwaySpeedKmh: number;
  roadSpeedKmh: number;
};

export function normalizeRouteMix(mix: RouteMix): RouteMix {
  const motorway = Math.max(0, mix.motorway);
  const road = Math.max(0, mix.road);
  const winding = Math.max(0, mix.winding);
  const total = motorway + road + winding;

  if (total === 0) {
    return { motorway: 0, road: 1, winding: 0 };
  }

  return {
    motorway: motorway / total,
    road: road / total,
    winding: winding / total,
  };
}

function safeSpeed(speed: number): number {
  return Math.max(10, speed);
}

export function estimateMixedRouteDrivingMinutes(input: RouteMixInput): number {
  const mix = normalizeRouteMix(input);
  const windingSpeedKmh = safeSpeed(input.roadSpeedKmh * 0.65);

  const motorwayMinutes = (input.distanceKm * mix.motorway) / safeSpeed(input.motorwaySpeedKmh) * 60;
  const roadMinutes = (input.distanceKm * mix.road) / safeSpeed(input.roadSpeedKmh) * 60;
  const windingMinutes = (input.distanceKm * mix.winding) / windingSpeedKmh * 60;

  return Math.round(motorwayMinutes + roadMinutes + windingMinutes);
}

export function estimateMixedRouteTollCost(manualTollCost: number, mix: RouteMix): number {
  const normalized = normalizeRouteMix(mix);
  return Math.round(Math.max(0, manualTollCost) * normalized.motorway * 100) / 100;
}

import { describe, expect, it } from 'vitest';
import { estimateMixedRouteDrivingMinutes, estimateMixedRouteTollCost, normalizeRouteMix } from './routeMix';

describe('route mix', () => {
  it('normalizes motorway, road and winding shares', () => {
    expect(normalizeRouteMix({ motorway: 40, road: 40, winding: 20 })).toEqual({ motorway: 0.4, road: 0.4, winding: 0.2 });
  });

  it('makes a winding-heavy route slower than a motorway-heavy route on the same distance', () => {
    const motorwayHeavy = estimateMixedRouteDrivingMinutes({
      distanceKm: 100,
      motorway: 80,
      road: 20,
      winding: 0,
      motorwaySpeedKmh: 120,
      roadSpeedKmh: 80,
    });

    const windingHeavy = estimateMixedRouteDrivingMinutes({
      distanceKm: 100,
      motorway: 0,
      road: 20,
      winding: 80,
      motorwaySpeedKmh: 120,
      roadSpeedKmh: 80,
    });

    expect(windingHeavy).toBeGreaterThan(motorwayHeavy);
  });

  it('scales manual toll cost with the motorway share', () => {
    expect(estimateMixedRouteTollCost(30, { motorway: 50, road: 50, winding: 0 })).toBe(15);
  });
});

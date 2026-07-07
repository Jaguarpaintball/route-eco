import { describe, expect, it } from 'vitest';
import { buildDemoRouteAlternatives } from './routeAlternatives';

describe('Route Éco alternatives', () => {
  it('creates automatic alternatives with cost and score', () => {
    const routes = buildDemoRouteAlternatives({
      baseDistanceKm: 320,
      motorwaySpeedKmh: 120,
      roadSpeedKmh: 80,
      citySpeedKmh: 40,
      consumptionLPer100Km: 6.2,
      fuelPricePerLiter: 1.82,
      pauseCount: 1,
      pauseDurationMinutes: 15,
      manualTollCost: 28,
      customMix: { motorway: 50, road: 40, winding: 10 },
    });

    expect(routes.map((route) => route.name)).toEqual(['Rapide', 'Éco', 'Équilibré', 'Sans péage', 'Mon trajet']);
    expect(routes[0].tollCost).toBe(28);
    expect(routes[3].tollCost).toBe(0);
    expect(routes.find((route) => route.name === 'Mon trajet')?.tollCost).toBe(14);
    expect(routes.every((route) => route.globalScore >= 0 && route.globalScore <= 10)).toBe(true);
  });

  it('makes lower motorway speed increase fast route duration', () => {
    const fast130 = buildDemoRouteAlternatives({ baseDistanceKm: 300, motorwaySpeedKmh: 130, roadSpeedKmh: 80, citySpeedKmh: 40, consumptionLPer100Km: 6, fuelPricePerLiter: 1.8, pauseCount: 0, pauseDurationMinutes: 15, manualTollCost: 30 })[0];
    const fast100 = buildDemoRouteAlternatives({ baseDistanceKm: 300, motorwaySpeedKmh: 100, roadSpeedKmh: 80, citySpeedKmh: 40, consumptionLPer100Km: 6, fuelPricePerLiter: 1.8, pauseCount: 0, pauseDurationMinutes: 15, manualTollCost: 30 })[0];

    expect(fast100.drivingMinutes).toBeGreaterThan(fast130.drivingMinutes);
  });
});

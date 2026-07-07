import { describe, expect, it } from 'vitest';
import { buildScoredRouteOptions } from './realRouteOptions';

describe('real route option builder', () => {
  it('turns real route geometries into scored Route Éco alternatives', () => {
    const options = buildScoredRouteOptions({
      routes: [
        { name: 'Itinéraire principal', distanceKm: 100, drivingMinutes: 70, coordinates: [[45, 4], [46, 5]] },
        { name: 'Itinéraire 2', distanceKm: 110, drivingMinutes: 90, coordinates: [[45, 4], [45.5, 4.4], [46, 5]] },
      ],
      consumptionLPer100Km: 6,
      fuelPricePerLiter: 1.8,
      pauseCount: 1,
      pauseDurationMinutes: 15,
      manualTollCost: 12,
    });

    expect(options).toHaveLength(4);
    expect(options[0].name).toBe('Rapide');
    expect(options[1].name).toBe('Éco');
    expect(options[0].distanceKm).toBe(100);
    expect(options[0].totalMinutes).toBe(85);
    expect(options[0].fuelCost).toBeCloseTo(10.8);
    expect(options[0].tollCost).toBe(12);
    expect(options[1].tollCost).toBe(3);
    expect(options[0].coordinates).toEqual([[45, 4], [46, 5]]);
  });

  it('keeps four strategic alternatives even when OSRM returns only one route', () => {
    const options = buildScoredRouteOptions({
      routes: [
        { name: 'Itinéraire principal', distanceKm: 314, drivingMinutes: 207, coordinates: [[45.76, 4.84], [43.3, 5.37]] },
      ],
      consumptionLPer100Km: 6.2,
      fuelPricePerLiter: 1.82,
      pauseCount: 1,
      pauseDurationMinutes: 15,
      manualTollCost: 28,
    });

    expect(options.map((route) => route.name)).toEqual(['Rapide', 'Éco', 'Équilibré', 'Sans péage']);
    expect(options[0].coordinates).toHaveLength(2);
    expect(options[3].tollCost).toBe(0);
  });
});

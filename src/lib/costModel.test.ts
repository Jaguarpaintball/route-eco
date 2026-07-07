import { describe, expect, it } from 'vitest';
import { calculateFuelCost, calculatePauseMinutes, scoreRoutes, summarizeRoute } from './costModel';

describe('Route Éco cost model', () => {
  it('calculates fuel cost from distance, dashboard consumption and fuel price', () => {
    expect(calculateFuelCost({ distanceKm: 250, consumptionLPer100Km: 6, fuelPricePerLiter: 1.8 })).toBeCloseTo(27);
  });

  it('calculates total pause minutes from pause count and duration', () => {
    expect(calculatePauseMinutes({ pauseCount: 2, pauseDurationMinutes: 30 })).toBe(60);
  });

  it('summarizes a route with driving time, pauses, fuel, tolls and total cost', () => {
    const summary = summarizeRoute({
      name: 'Équilibré',
      distanceKm: 300,
      drivingMinutes: 180,
      tollCost: 18,
      consumptionLPer100Km: 5.5,
      fuelPricePerLiter: 1.8,
      pauseCount: 2,
      pauseDurationMinutes: 15,
      comfortPenalty: 2,
    });

    expect(summary.totalMinutes).toBe(210);
    expect(summary.fuelCost).toBeCloseTo(29.7);
    expect(summary.totalCost).toBeCloseTo(47.7);
  });

  it('scores fastest, cheapest and balanced routes distinctly', () => {
    const scored = scoreRoutes([
      summarizeRoute({ name: 'Rapide', distanceKm: 320, drivingMinutes: 180, tollCost: 40, consumptionLPer100Km: 7, fuelPricePerLiter: 1.8, pauseCount: 0, pauseDurationMinutes: 15, comfortPenalty: 1 }),
      summarizeRoute({ name: 'Éco', distanceKm: 290, drivingMinutes: 250, tollCost: 0, consumptionLPer100Km: 5.5, fuelPricePerLiter: 1.8, pauseCount: 0, pauseDurationMinutes: 15, comfortPenalty: 4 }),
      summarizeRoute({ name: 'Équilibré', distanceKm: 305, drivingMinutes: 210, tollCost: 12, consumptionLPer100Km: 6, fuelPricePerLiter: 1.8, pauseCount: 0, pauseDurationMinutes: 15, comfortPenalty: 2 }),
    ]);

    const rapide = scored.find((r) => r.name === 'Rapide')!;
    const eco = scored.find((r) => r.name === 'Éco')!;
    const equilibre = scored.find((r) => r.name === 'Équilibré')!;

    expect(rapide.timeScore).toBe(10);
    expect(eco.economyScore).toBe(10);
    expect(equilibre.globalScore).toBeGreaterThan(eco.timeScore);
  });
});

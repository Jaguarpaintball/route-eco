import { ScoredRoute, scoreRoutes, summarizeRoute } from './costModel';
import { estimateMixedRouteDrivingMinutes, estimateMixedRouteTollCost, type RouteMix } from './routeMix';

export type DemoAlternativeInput = {
  baseDistanceKm: number;
  motorwaySpeedKmh: number;
  roadSpeedKmh: number;
  citySpeedKmh: number;
  consumptionLPer100Km: number;
  fuelPricePerLiter: number;
  pauseCount: number;
  pauseDurationMinutes: number;
  manualTollCost: number;
  customMix?: RouteMix;
};

type SegmentMix = {
  motorway: number;
  road: number;
  city: number;
};

const routePresets: Array<{
  name: string;
  distanceFactor: number;
  tollFactor: number;
  mix: SegmentMix;
  comfortPenalty: number;
}> = [
  { name: 'Rapide', distanceFactor: 1, tollFactor: 1, mix: { motorway: 0.72, road: 0.2, city: 0.08 }, comfortPenalty: 1 },
  { name: 'Éco', distanceFactor: 0.94, tollFactor: 0.15, mix: { motorway: 0.18, road: 0.7, city: 0.12 }, comfortPenalty: 3 },
  { name: 'Équilibré', distanceFactor: 0.98, tollFactor: 0.45, mix: { motorway: 0.42, road: 0.46, city: 0.12 }, comfortPenalty: 2 },
  { name: 'Sans péage', distanceFactor: 0.96, tollFactor: 0, mix: { motorway: 0.05, road: 0.78, city: 0.17 }, comfortPenalty: 4 },
];

function safeSpeed(speed: number): number {
  return Math.max(10, speed);
}

function estimateDrivingMinutes(distanceKm: number, mix: SegmentMix, input: DemoAlternativeInput): number {
  const motorwayMinutes = (distanceKm * mix.motorway) / safeSpeed(input.motorwaySpeedKmh) * 60;
  const roadMinutes = (distanceKm * mix.road) / safeSpeed(input.roadSpeedKmh) * 60;
  const cityMinutes = (distanceKm * mix.city) / safeSpeed(input.citySpeedKmh) * 60;
  return Math.round(motorwayMinutes + roadMinutes + cityMinutes);
}

export function buildDemoRouteAlternatives(input: DemoAlternativeInput): ScoredRoute[] {
  const summaries = routePresets.map((preset) => {
    const distanceKm = Math.round(input.baseDistanceKm * preset.distanceFactor);

    return summarizeRoute({
      name: preset.name,
      distanceKm,
      drivingMinutes: estimateDrivingMinutes(distanceKm, preset.mix, input),
      tollCost: Math.round(input.manualTollCost * preset.tollFactor * 100) / 100,
      consumptionLPer100Km: input.consumptionLPer100Km,
      fuelPricePerLiter: input.fuelPricePerLiter,
      pauseCount: input.pauseCount,
      pauseDurationMinutes: input.pauseDurationMinutes,
      comfortPenalty: preset.comfortPenalty,
    });
  });

  if (input.customMix) {
    summaries.push(summarizeRoute({
      name: 'Mon trajet',
      distanceKm: Math.round(input.baseDistanceKm),
      drivingMinutes: estimateMixedRouteDrivingMinutes({
        distanceKm: input.baseDistanceKm,
        motorwaySpeedKmh: input.motorwaySpeedKmh,
        roadSpeedKmh: input.roadSpeedKmh,
        ...input.customMix,
      }),
      tollCost: estimateMixedRouteTollCost(input.manualTollCost, input.customMix),
      consumptionLPer100Km: input.consumptionLPer100Km,
      fuelPricePerLiter: input.fuelPricePerLiter,
      pauseCount: input.pauseCount,
      pauseDurationMinutes: input.pauseDurationMinutes,
      comfortPenalty: input.customMix.winding > 35 ? 4 : 2,
    }));
  }

  return scoreRoutes(summaries);
}

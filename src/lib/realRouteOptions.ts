import { RouteSummary, ScoredRoute, scoreRoutes, summarizeRoute } from './costModel';
import { estimateMixedRouteDrivingMinutes, estimateMixedRouteTollCost, type RouteMix } from './routeMix';
import type { RouteGeometry } from './routingService';

export type RealRouteOptionInput = {
  routes: RouteGeometry[];
  consumptionLPer100Km: number;
  fuelPricePerLiter: number;
  pauseCount: number;
  pauseDurationMinutes: number;
  manualTollCost: number;
  motorwaySpeedKmh?: number;
  roadSpeedKmh?: number;
  customMix?: RouteMix;
};

export type ScoredRouteOption = ScoredRoute & {
  coordinates: Array<[number, number]>;
  sourceName: string;
};

type Strategy = {
  name: string;
  distanceFactor: number;
  timeFactor: number;
  tollFactor: number;
  comfortPenalty: number;
};

const strategies: Strategy[] = [
  { name: 'Rapide', distanceFactor: 1, timeFactor: 1, tollFactor: 1, comfortPenalty: 0 },
  { name: 'Éco', distanceFactor: 0.96, timeFactor: 1.22, tollFactor: 0.25, comfortPenalty: 3 },
  { name: 'Équilibré', distanceFactor: 0.98, timeFactor: 1.12, tollFactor: 0.55, comfortPenalty: 1.5 },
  { name: 'Sans péage', distanceFactor: 0.95, timeFactor: 1.38, tollFactor: 0, comfortPenalty: 4 },
];

function routeForStrategy(routes: RouteGeometry[], index: number): RouteGeometry {
  return routes[index] ?? routes[0];
}

function adjusted(value: number, factor: number): number {
  return Math.round(value * factor * 10) / 10;
}

export function buildScoredRouteOptions(input: RealRouteOptionInput): ScoredRouteOption[] {
  if (input.routes.length === 0) return [];

  const summariesWithGeometry = strategies.map((strategy, index) => {
    const route = routeForStrategy(input.routes, index);
    const hasDedicatedGeometry = Boolean(input.routes[index]);
    const distanceKm = hasDedicatedGeometry ? route.distanceKm : adjusted(input.routes[0].distanceKm, strategy.distanceFactor);
    const drivingMinutes = hasDedicatedGeometry ? route.drivingMinutes : Math.round(input.routes[0].drivingMinutes * strategy.timeFactor);

    return {
      sourceName: hasDedicatedGeometry ? route.name : `${route.name} simulé ${strategy.name}`,
      coordinates: route.coordinates,
      summary: summarizeRoute({
        name: strategy.name,
        distanceKm,
        drivingMinutes,
        tollCost: Math.round(input.manualTollCost * strategy.tollFactor * 100) / 100,
        consumptionLPer100Km: input.consumptionLPer100Km,
        fuelPricePerLiter: input.fuelPricePerLiter,
        pauseCount: input.pauseCount,
        pauseDurationMinutes: input.pauseDurationMinutes,
        comfortPenalty: strategy.comfortPenalty,
      }),
    };
  });

  if (input.customMix) {
    const baseRoute = input.routes[0];
    summariesWithGeometry.push({
      sourceName: `${baseRoute.name} composé par l’utilisateur`,
      coordinates: baseRoute.coordinates,
      summary: summarizeRoute({
        name: 'Mon trajet',
        distanceKm: Math.round(baseRoute.distanceKm),
        drivingMinutes: estimateMixedRouteDrivingMinutes({
          distanceKm: baseRoute.distanceKm,
          motorwaySpeedKmh: input.motorwaySpeedKmh ?? 120,
          roadSpeedKmh: input.roadSpeedKmh ?? 80,
          ...input.customMix,
        }),
        tollCost: estimateMixedRouteTollCost(input.manualTollCost, input.customMix),
        consumptionLPer100Km: input.consumptionLPer100Km,
        fuelPricePerLiter: input.fuelPricePerLiter,
        pauseCount: input.pauseCount,
        pauseDurationMinutes: input.pauseDurationMinutes,
        comfortPenalty: input.customMix.winding > 35 ? 4 : 2,
      }),
    });
  }

  const scored = scoreRoutes(summariesWithGeometry.map((item) => item.summary));

  return scored.map((route) => {
    const source = summariesWithGeometry.find((item) => item.summary.name === route.name)!;
    return {
      ...route,
      sourceName: source.sourceName,
      coordinates: source.coordinates,
    };
  });
}

export function routeOptionToSummary(option: ScoredRouteOption): RouteSummary {
  return {
    name: option.name,
    distanceKm: option.distanceKm,
    drivingMinutes: option.drivingMinutes,
    pauseMinutes: option.pauseMinutes,
    totalMinutes: option.totalMinutes,
    fuelCost: option.fuelCost,
    tollCost: option.tollCost,
    totalCost: option.totalCost,
    comfortPenalty: option.comfortPenalty,
  };
}

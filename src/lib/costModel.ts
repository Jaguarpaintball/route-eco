export type FuelCostInput = {
  distanceKm: number;
  consumptionLPer100Km: number;
  fuelPricePerLiter: number;
};

export type PauseInput = {
  pauseCount: number;
  pauseDurationMinutes: number;
};

export type RouteInput = FuelCostInput & PauseInput & {
  name: string;
  distanceKm: number;
  drivingMinutes: number;
  tollCost: number;
  comfortPenalty: number;
};

export type RouteSummary = {
  name: string;
  distanceKm: number;
  drivingMinutes: number;
  pauseMinutes: number;
  totalMinutes: number;
  fuelCost: number;
  tollCost: number;
  totalCost: number;
  comfortPenalty: number;
};

export type ScoredRoute = RouteSummary & {
  timeScore: number;
  economyScore: number;
  comfortScore: number;
  globalScore: number;
};

const clampScore = (value: number) => Math.max(0, Math.min(10, value));
const roundMoney = (value: number) => Math.round(value * 100) / 100;
const roundScore = (value: number) => Math.round(value * 10) / 10;

export function calculateFuelCost(input: FuelCostInput): number {
  const liters = (input.distanceKm * input.consumptionLPer100Km) / 100;
  return roundMoney(liters * input.fuelPricePerLiter);
}

export function calculatePauseMinutes(input: PauseInput): number {
  return Math.max(0, input.pauseCount) * Math.max(0, input.pauseDurationMinutes);
}

export function summarizeRoute(input: RouteInput): RouteSummary {
  const pauseMinutes = calculatePauseMinutes(input);
  const fuelCost = calculateFuelCost(input);
  const tollCost = roundMoney(Math.max(0, input.tollCost));

  return {
    name: input.name,
    distanceKm: input.distanceKm,
    drivingMinutes: input.drivingMinutes,
    pauseMinutes,
    totalMinutes: input.drivingMinutes + pauseMinutes,
    fuelCost,
    tollCost,
    totalCost: roundMoney(fuelCost + tollCost),
    comfortPenalty: Math.max(0, input.comfortPenalty),
  };
}

export function scoreRoutes(routes: RouteSummary[]): ScoredRoute[] {
  if (routes.length === 0) return [];

  const bestTime = Math.min(...routes.map((route) => route.totalMinutes));
  const bestCost = Math.min(...routes.map((route) => route.totalCost));

  return routes.map((route) => {
    const timeOverBestRatio = bestTime === 0 ? 0 : (route.totalMinutes - bestTime) / bestTime;
    const costOverBestRatio = bestCost === 0 ? 0 : (route.totalCost - bestCost) / bestCost;

    const timeScore = clampScore(10 - timeOverBestRatio * 20);
    const economyScore = clampScore(10 - costOverBestRatio * 10);
    const comfortScore = clampScore(10 - route.comfortPenalty);
    const globalScore = timeScore * 0.4 + economyScore * 0.4 + comfortScore * 0.2;

    return {
      ...route,
      timeScore: roundScore(timeScore),
      economyScore: roundScore(economyScore),
      comfortScore: roundScore(comfortScore),
      globalScore: roundScore(globalScore),
    };
  });
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

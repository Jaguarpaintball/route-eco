export type Coordinate = {
  lat: number;
  lon: number;
};

export type GeocodedPlace = Coordinate & {
  label: string;
};

export type RouteGeometry = {
  name: string;
  distanceKm: number;
  drivingMinutes: number;
  coordinates: Array<[number, number]>;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type OsrmRoute = {
  distance: number;
  duration: number;
  geometry: string;
};

type OsrmResponse = {
  routes?: OsrmRoute[];
};

export function buildNominatimUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    addressdetails: '1',
    countrycodes: 'fr',
  });
  return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
}

export function buildOsrmRouteUrl(from: Coordinate, to: Coordinate): string {
  const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  const params = new URLSearchParams({
    overview: 'full',
    geometries: 'polyline6',
    alternatives: 'true',
    steps: 'false',
  });
  return `https://router.project-osrm.org/route/v1/driving/${coords}?${params.toString()}`;
}

export function decodePolyline(encoded: string, precision = 6): Array<[number, number]> {
  const coordinates: Array<[number, number]> = [];
  const factor = Math.pow(10, precision);
  let index = 0;
  let lat = 0;
  let lon = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLon = result & 1 ? ~(result >> 1) : result >> 1;
    lon += deltaLon;

    coordinates.push([lat / factor, lon / factor]);
  }

  return coordinates;
}

export function osrmRouteToRouteGeometry(route: OsrmRoute, index: number): RouteGeometry {
  return {
    name: index === 0 ? 'Itinéraire principal' : `Itinéraire ${index + 1}`,
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
    drivingMinutes: Math.round(route.duration / 60),
    coordinates: decodePolyline(route.geometry, 6),
  };
}

export async function geocodePlace(query: string): Promise<GeocodedPlace> {
  const response = await fetch(buildNominatimUrl(query), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Géocodage impossible (${response.status})`);
  const data = (await response.json()) as NominatimResult[];
  const first = data[0];
  if (!first) throw new Error(`Lieu introuvable : ${query}`);
  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
    label: first.display_name,
  };
}

export async function fetchRouteAlternatives(from: Coordinate, to: Coordinate): Promise<RouteGeometry[]> {
  const response = await fetch(buildOsrmRouteUrl(from, to));
  if (!response.ok) throw new Error(`Calcul d’itinéraire impossible (${response.status})`);
  const data = (await response.json()) as OsrmResponse;
  if (!data.routes?.length) throw new Error('Aucun itinéraire trouvé');
  return data.routes.slice(0, 3).map(osrmRouteToRouteGeometry);
}

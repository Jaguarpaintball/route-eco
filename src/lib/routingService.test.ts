import { describe, expect, it } from 'vitest';
import { buildNominatimUrl, buildOsrmRouteUrl, decodePolyline, osrmRouteToRouteGeometry } from './routingService';

describe('routing service helpers', () => {
  it('builds a Nominatim search URL for France', () => {
    const url = buildNominatimUrl('Lyon');
    expect(url).toContain('https://nominatim.openstreetmap.org/search');
    expect(url).toContain('q=Lyon');
    expect(url).toContain('countrycodes=fr');
    expect(url).toContain('format=json');
  });

  it('builds an OSRM alternatives URL from coordinates', () => {
    const url = buildOsrmRouteUrl({ lat: 45.76, lon: 4.84 }, { lat: 43.3, lon: 5.37 });
    expect(url).toContain('https://router.project-osrm.org/route/v1/driving/');
    expect(url).toContain('4.84,45.76;5.37,43.3');
    expect(url).toContain('alternatives=true');
    expect(url).toContain('geometries=polyline6');
    expect(url).toContain('overview=full');
  });

  it('decodes a polyline6 into latitude longitude pairs', () => {
    const decoded = decodePolyline('_izlhA~rlgdF_{geC~ywl@', 6);
    expect(decoded[0][0]).toBeCloseTo(38.5);
    expect(decoded[0][1]).toBeCloseTo(-120.2);
    expect(decoded[1][0]).toBeCloseTo(40.7);
    expect(decoded[1][1]).toBeCloseTo(-120.95);
  });

  it('converts OSRM route meters/seconds to km/minutes with geometry', () => {
    const result = osrmRouteToRouteGeometry({
      distance: 12345,
      duration: 3600,
      geometry: '_izlhA~rlgdF_{geC~ywl@',
    }, 1);

    expect(result.name).toBe('Itinéraire 2');
    expect(result.distanceKm).toBeCloseTo(12.3);
    expect(result.drivingMinutes).toBe(60);
    expect(result.coordinates).toHaveLength(2);
  });
});

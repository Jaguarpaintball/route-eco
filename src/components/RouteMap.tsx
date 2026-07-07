import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import type { GeocodedPlace, RouteGeometry } from '../lib/routingService';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FitBounds({ route, from, to }: { route?: RouteGeometry; from?: GeocodedPlace; to?: GeocodedPlace }) {
  const map = useMap();

  useEffect(() => {
    const points: Array<[number, number]> = route?.coordinates?.length
      ? route.coordinates
      : [from, to].filter(Boolean).map((point) => [point!.lat, point!.lon] as [number, number]);

    if (points.length >= 2) {
      map.fitBounds(points, { padding: [28, 28] });
    }
  }, [from, map, route, to]);

  return null;
}

export function RouteMap({ routes, selectedRouteName, from, to }: {
  routes: RouteGeometry[];
  selectedRouteName?: string;
  from?: GeocodedPlace;
  to?: GeocodedPlace;
}) {
  const center = useMemo<[number, number]>(() => {
    if (from) return [from.lat, from.lon];
    return [46.603354, 1.888334];
  }, [from]);

  const selectedRoute = routes.find((route) => route.name === selectedRouteName) ?? routes[0];

  return (
    <MapContainer center={center} zoom={6} className="real-map" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {routes.map((route) => (
        <Polyline
          key={route.name}
          positions={route.coordinates}
          pathOptions={{
            color: route.name === selectedRoute?.name ? '#7cff8d' : '#7cc7ff',
            weight: route.name === selectedRoute?.name ? 7 : 4,
            opacity: route.name === selectedRoute?.name ? 0.95 : 0.45,
          }}
        />
      ))}
      {from && <Marker position={[from.lat, from.lon]} icon={icon} />}
      {to && <Marker position={[to.lat, to.lon]} icon={icon} />}
      <FitBounds route={selectedRoute} from={from} to={to} />
    </MapContainer>
  );
}

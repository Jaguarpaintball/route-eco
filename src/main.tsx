import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import { buildDemoRouteAlternatives } from './lib/routeAlternatives';
import { formatMinutes } from './lib/costModel';
import { fetchRouteAlternatives, geocodePlace, type GeocodedPlace, type RouteGeometry } from './lib/routingService';
import { buildScoredRouteOptions, type ScoredRouteOption } from './lib/realRouteOptions';
import { RouteMap } from './components/RouteMap';
import './styles.css';

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

function NumberField({ label, value, suffix, min, max, step, onChange }: {
  label: string;
  value: number;
  suffix?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-row">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step ?? 1}
          onChange={(event) => onChange(clampNumber(Number(event.target.value), min, max))}
        />
        {suffix && <em>{suffix}</em>}
      </div>
    </label>
  );
}

function App() {
  const [departure, setDeparture] = useState('Lyon');
  const [arrival, setArrival] = useState('Marseille');
  const [vehicleType, setVehicleType] = useState('Hybride');
  const [consumption, setConsumption] = useState(6.2);
  const [fuelPrice, setFuelPrice] = useState(1.82);
  const [citySpeed, setCitySpeed] = useState(40);
  const [roadSpeed, setRoadSpeed] = useState(75);
  const [motorwaySpeed, setMotorwaySpeed] = useState(120);
  const [pauseCount, setPauseCount] = useState(1);
  const [pauseDuration, setPauseDuration] = useState(15);
  const [baseDistance, setBaseDistance] = useState(320);
  const [manualToll, setManualToll] = useState(28);
  const [selected, setSelected] = useState('Équilibré');
  const [fromPlace, setFromPlace] = useState<GeocodedPlace | undefined>();
  const [toPlace, setToPlace] = useState<GeocodedPlace | undefined>();
  const [realRoutes, setRealRoutes] = useState<RouteGeometry[]>([]);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | undefined>();

  const demoAlternatives = useMemo(() => buildDemoRouteAlternatives({
    baseDistanceKm: baseDistance,
    motorwaySpeedKmh: motorwaySpeed,
    roadSpeedKmh: roadSpeed,
    citySpeedKmh: citySpeed,
    consumptionLPer100Km: consumption,
    fuelPricePerLiter: fuelPrice,
    pauseCount,
    pauseDurationMinutes: pauseDuration,
    manualTollCost: manualToll,
  }), [baseDistance, motorwaySpeed, roadSpeed, citySpeed, consumption, fuelPrice, pauseCount, pauseDuration, manualToll]);

  const realAlternatives = useMemo(() => buildScoredRouteOptions({
    routes: realRoutes,
    consumptionLPer100Km: consumption,
    fuelPricePerLiter: fuelPrice,
    pauseCount,
    pauseDurationMinutes: pauseDuration,
    manualTollCost: manualToll,
  }), [consumption, fuelPrice, manualToll, pauseCount, pauseDuration, realRoutes]);

  const alternatives = realAlternatives.length ? realAlternatives : demoAlternatives;
  const chosen = alternatives.find((route) => route.name === selected) ?? alternatives[0];
  const selectedMapRoute = realRoutes[alternatives.findIndex((route) => route.name === chosen.name)] ?? realRoutes[0];

  async function calculateRealRoute() {
    setIsRouting(true);
    setRouteError(undefined);
    try {
      const [from, to] = await Promise.all([geocodePlace(departure), geocodePlace(arrival)]);
      const routes = await fetchRouteAlternatives(from, to);
      setFromPlace(from);
      setToPlace(to);
      setRealRoutes(routes);
      setBaseDistance(routes[0]?.distanceKm ?? baseDistance);
      setSelected('Rapide');
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : 'Erreur inconnue pendant le calcul');
    } finally {
      setIsRouting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Prototype testable</p>
          <h1>Route Éco</h1>
          <p>Compare le vrai temps et le vrai coût selon ta voiture, ta vitesse, tes pauses et ton choix de route.</p>
        </div>
        <div className="score-badge">
          <span>Score</span>
          <strong>{chosen.globalScore}/10</strong>
        </div>
      </section>

      <section className="planner-card">
        <h2>Trajet réel</h2>
        <div className="grid two">
          <label className="field">
            <span>Départ</span>
            <input value={departure} onChange={(event) => setDeparture(event.target.value)} />
          </label>
          <label className="field">
            <span>Arrivée</span>
            <input value={arrival} onChange={(event) => setArrival(event.target.value)} />
          </label>
        </div>
        <div className="route-actions">
          <button className="primary-action" onClick={calculateRealRoute} disabled={isRouting}>
            {isRouting ? 'Calcul en cours…' : 'Calculer avec OpenStreetMap'}
          </button>
          <span>{realRoutes.length ? `${realRoutes.length} itinéraire(s) réel(s) trouvé(s)` : 'Mode démo tant qu’aucun calcul réel n’est lancé'}</span>
        </div>
        {routeError && <p className="error-box">{routeError}</p>}
        <RouteMap routes={realRoutes} selectedRouteName={selectedMapRoute?.name} from={fromPlace} to={toPlace} />
      </section>

      <section className="planner-card">
        <h2>Profil du jour</h2>
        <div className="tabs" role="tablist">
          {['Thermique', 'Hybride', 'Électrique'].map((type) => (
            <button key={type} className={vehicleType === type ? 'active' : ''} onClick={() => setVehicleType(type)}>{type}</button>
          ))}
        </div>
        <div className="grid three">
          <NumberField label="Conso tableau de bord" value={consumption} suffix={vehicleType === 'Électrique' ? 'kWh/100' : 'L/100'} min={1} max={35} step={0.1} onChange={setConsumption} />
          <NumberField label={vehicleType === 'Électrique' ? 'Prix énergie' : 'Prix carburant'} value={fuelPrice} suffix={vehicleType === 'Électrique' ? '€/kWh' : '€/L'} min={0.1} max={4} step={0.01} onChange={setFuelPrice} />
          <NumberField label="Distance estimée" value={baseDistance} suffix="km" min={5} max={1500} onChange={setBaseDistance} />
        </div>
      </section>

      <section className="planner-card">
        <h2>Vitesses et pauses</h2>
        <div className="grid three">
          <NumberField label="Ville max" value={citySpeed} suffix="km/h" min={10} max={60} onChange={setCitySpeed} />
          <NumberField label="Route max" value={roadSpeed} suffix="km/h" min={30} max={110} onChange={setRoadSpeed} />
          <NumberField label="Autoroute max" value={motorwaySpeed} suffix="km/h" min={70} max={140} onChange={setMotorwaySpeed} />
        </div>
        <div className="pause-box">
          <div>
            <span>Pauses</span>
            <strong>{pauseCount} × {pauseDuration} min</strong>
          </div>
          <button onClick={() => setPauseCount(Math.max(0, pauseCount - 1))}>- pause</button>
          <button onClick={() => setPauseCount(pauseCount + 1)}>+ pause</button>
          <button onClick={() => setPauseDuration(Math.max(0, pauseDuration - 10))}>-10 min</button>
          <button onClick={() => setPauseDuration(pauseDuration + 10)}>+10 min</button>
          <input aria-label="Durée pause" type="number" value={pauseDuration} onChange={(event) => setPauseDuration(clampNumber(Number(event.target.value), 0, 240))} />
        </div>
      </section>

      <section className="planner-card">
        <div className="section-title">
          <div>
            <h2>Alternatives automatiques</h2>
            <p className="muted">{realRoutes.length ? 'Basées sur OSRM/OpenStreetMap.' : 'Mode démo en attendant le calcul réel.'}</p>
          </div>
          <NumberField label="Péage estimé / manuel" value={manualToll} suffix="€" min={0} max={250} step={0.5} onChange={setManualToll} />
        </div>
        <div className="routes">
          {alternatives.map((route) => (
            <button key={route.name} className={`route-card ${selected === route.name ? 'selected' : ''}`} onClick={() => setSelected(route.name)}>
              <header>
                <strong>{route.name}</strong>
                <span>{route.globalScore}/10</span>
              </header>
              <dl>
                <div><dt>Temps</dt><dd>{formatMinutes(route.totalMinutes)}</dd></div>
                <div><dt>Km</dt><dd>{route.distanceKm}</dd></div>
                <div><dt>{vehicleType === 'Électrique' ? 'Énergie' : 'Carburant'}</dt><dd>{route.fuelCost.toFixed(2)} €</dd></div>
                <div><dt>Péage</dt><dd>{route.tollCost.toFixed(2)} €</dd></div>
                <div><dt>Total</dt><dd>{route.totalCost.toFixed(2)} €</dd></div>
              </dl>
            </button>
          ))}
        </div>
      </section>

      <section className="planner-card conclusion">
        <h2>Choix sélectionné : {chosen.name}</h2>
        <p>
          {departure} → {arrival} : <strong>{formatMinutes(chosen.totalMinutes)}</strong>, <strong>{chosen.distanceKm} km</strong>, coût estimé <strong>{chosen.totalCost.toFixed(2)} €</strong>.
        </p>
        <p className="muted">Péages : manuel pour ce prototype. Prochaine étape : fournisseur OpenTollData/TollGuru.</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import { buildDemoRouteAlternatives } from './lib/routeAlternatives';
import { formatMinutes } from './lib/costModel';
import { fetchRouteAlternatives, geocodePlace, type GeocodedPlace, type RouteGeometry } from './lib/routingService';
import { buildScoredRouteOptions } from './lib/realRouteOptions';
import { RouteMap } from './components/RouteMap';
import { NumberField } from './components/NumberField';
import './styles.css';

function App() {
  const [departure, setDeparture] = useState('Lyon');
  const [arrival, setArrival] = useState('Marseille');
  const [vehicleType, setVehicleType] = useState('Hybride');
  const [consumption, setConsumption] = useState(6.2);
  const [fuelPrice, setFuelPrice] = useState(1.82);
  const [citySpeed, setCitySpeed] = useState(40);
  const [roadSpeed, setRoadSpeed] = useState(75);
  const [motorwaySpeed, setMotorwaySpeed] = useState(120);
  const [restMinutes, setRestMinutes] = useState(30);
  const [baseDistance, setBaseDistance] = useState(320);
  const [manualToll, setManualToll] = useState(28);
  const [motorwayShare, setMotorwayShare] = useState(50);
  const [roadShare, setRoadShare] = useState(40);
  const [windingShare, setWindingShare] = useState(10);
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
    pauseCount: restMinutes > 0 ? 1 : 0,
    pauseDurationMinutes: restMinutes,
    manualTollCost: manualToll,
    customMix: { motorway: motorwayShare, road: roadShare, winding: windingShare },
  }), [baseDistance, motorwaySpeed, roadSpeed, citySpeed, consumption, fuelPrice, restMinutes, manualToll, motorwayShare, roadShare, windingShare]);

  const realAlternatives = useMemo(() => buildScoredRouteOptions({
    routes: realRoutes,
    consumptionLPer100Km: consumption,
    fuelPricePerLiter: fuelPrice,
    pauseCount: restMinutes > 0 ? 1 : 0,
    pauseDurationMinutes: restMinutes,
    manualTollCost: manualToll,
    motorwaySpeedKmh: motorwaySpeed,
    roadSpeedKmh: roadSpeed,
    customMix: { motorway: motorwayShare, road: roadShare, winding: windingShare },
  }), [consumption, fuelPrice, manualToll, restMinutes, realRoutes, motorwaySpeed, roadSpeed, motorwayShare, roadShare, windingShare]);

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
          <p className="eyebrow">Calculateur simple et visuel</p>
          <h1>Route Éco</h1>
          <p>Compare en un coup d’œil le temps, le coût et le confort de ton trajet. Tu règles seulement l’essentiel, Route Éco fait le tri.</p>
          <div className="hero-pills" aria-label="Points forts">
            <span>Carte réelle</span>
            <span>Coût carburant</span>
            <span>Pauses incluses</span>
            <span>Choix économique</span>
          </div>
        </div>
        <div className="score-badge">
          <span>Meilleur score</span>
          <strong>{chosen.globalScore}/10</strong>
          <small>{chosen.name}</small>
        </div>
      </section>

      <div className="planner-layout">
        <div className="control-panel">
          <div className="options-heading">
            <p className="eyebrow compact">Options</p>
            <h2>Affiner le trajet</h2>
            <p>Départ, voiture, vitesse, pauses et style de route restent accessibles juste après le choix d’itinéraire.</p>
          </div>
          <section className="planner-card">
        <div className="card-heading"><span className="step-dot">1</span><h2>Ton trajet</h2></div>
        <p className="card-help">Indique simplement le départ et l’arrivée. La carte sert à vérifier visuellement le parcours.</p>
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
        <div className="card-heading"><span className="step-dot">2</span><h2>Ta voiture</h2></div>
        <p className="card-help">Ces valeurs servent à estimer le vrai coût du trajet, pas seulement les kilomètres.</p>
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
        <div className="card-heading"><span className="step-dot">3</span><h2>Ton rythme</h2></div>
        <p className="card-help">Choisis ta vitesse autoroute et ton temps de repos : le temps total se met à jour.</p>
        <div className="grid three">
          <NumberField label="Ville max" value={citySpeed} suffix="km/h" min={10} max={60} onChange={setCitySpeed} />
          <NumberField label="Route max" value={roadSpeed} suffix="km/h" min={30} max={110} onChange={setRoadSpeed} />
          <div className="speed-field">
            <NumberField label="Autoroute max" value={motorwaySpeed} suffix="km/h" min={70} max={140} onChange={setMotorwaySpeed} />
            <div className="speed-presets" aria-label="Vitesses autoroute rapides">
              {[90, 95, 100, 105, 110, 115, 120, 125, 130].map((speed) => (
                <button key={speed} type="button" onClick={() => setMotorwaySpeed(speed)}>{speed}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="rest-box">
          <NumberField label="Temps de repos total" value={restMinutes} suffix="min" min={0} max={480} onChange={setRestMinutes} />
          <div className="rest-actions">
            <button type="button" onClick={() => setRestMinutes(Math.max(0, restMinutes - 10))}>-10 min</button>
            <button type="button" onClick={() => setRestMinutes(restMinutes + 10)}>+10 min</button>
          </div>
        </div>
      </section>

      <section className="planner-card">
        <div className="card-heading"><span className="step-dot">4</span><h2>Style de route</h2></div>
        <p className="muted">Pour simuler “je prends l’autoroute, puis je sors sur départementale”. Les proportions sont normalisées automatiquement.</p>
        <div className="grid three">
          <NumberField label="Autoroute" value={motorwayShare} suffix="%" min={0} max={100} onChange={setMotorwayShare} />
          <NumberField label="Départementale" value={roadShare} suffix="%" min={0} max={100} onChange={setRoadShare} />
          <NumberField label="Route sinueuse" value={windingShare} suffix="%" min={0} max={100} onChange={setWindingShare} />
        </div>
        <div className="mix-presets">
          <button type="button" onClick={() => { setMotorwayShare(80); setRoadShare(20); setWindingShare(0); }}>Surtout autoroute</button>
          <button type="button" onClick={() => { setMotorwayShare(45); setRoadShare(45); setWindingShare(10); }}>Mixte</button>
          <button type="button" onClick={() => { setMotorwayShare(10); setRoadShare(70); setWindingShare(20); }}>Départementale</button>
          <button type="button" onClick={() => { setMotorwayShare(0); setRoadShare(45); setWindingShare(55); }}>Route sinueuse</button>
        </div>
      </section>
        </div>

        <aside className="results-panel">
          <section className="planner-card results-card">
        <div className="section-title">
          <div>
            <p className="eyebrow compact">Résultat instantané</p>
            <h2>Quelle route choisir ?</h2>
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
        </aside>
        </div>
        </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

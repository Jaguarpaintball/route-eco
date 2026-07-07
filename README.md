# Route Éco

Prototype MVP d’un planificateur d’itinéraire économique personnalisé.

## Fonctions déjà disponibles

- Carte OpenStreetMap via Leaflet.
- Géocodage départ/arrivée avec Nominatim.
- Calcul d’itinéraire réel via OSRM.
- Alternatives Route Éco : rapide, éco, équilibré, sans péage.
- Calcul temps, distance, pauses, carburant/énergie, péage manuel et coût total.
- Score global par alternative.

## Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir l’URL affichée par Vite.

## Tests

```bash
npm test
npm run build
```

## Limites actuelles

- Les alternatives Éco/Équilibré/Sans péage sont simulées à partir de l’itinéraire réel quand OSRM ne renvoie qu’une route.
- Le péage est encore manuel/estimé.
- Prochaine étape : audit OpenTollData/TollGuru et vrais points de passage déplaçables.

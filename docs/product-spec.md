# Route Éco — Cahier des charges MVP

## Promesse

Route Éco aide l’utilisateur à comparer le vrai temps et le vrai coût d’un trajet selon sa conduite réelle : vitesses choisies, pauses, véhicule, carburant, péages et choix de route.

## Cible

- Conducteurs qui veulent économiser argent ou temps.
- Familles en départ vacances.
- Conducteurs prudents.
- Véhicules thermiques, hybrides, puis électriques.
- Personnes qui veulent comparer autoroute, route principale et sans péage.

## MVP

- Application web mobile gratuite.
- Départ / arrivée.
- Conso moyenne saisie depuis le tableau de bord.
- Prix carburant.
- Vitesses ville / route / autoroute.
- Pauses : 15 min par défaut, +10 / -10, saisie directe.
- Alternatives automatiques : rapide, éco, équilibré, sans péage.
- Score temps / économie / confort / global.
- Carte simple d’abord, vraie carte OSM ensuite.
- Péages : champ manuel d’abord + audit OpenTollData/TollGuru.

## Après MVP

- Carte OSM réelle.
- Points de passage déplaçables.
- Guidage vocal simple.
- Données péages automatiques fiables.
- App iPhone / Android.

## Décision péages

Les péages sont importants, mais il ne faut pas baser le produit sur du scraping fragile. On prévoit une couche technique avec plusieurs fournisseurs : manuel, OpenTollData, TollGuru, puis éventuellement Google Routes.

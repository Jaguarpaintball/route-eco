# Route Éco — notes données péage

Objectif : afficher un coût de péage fiable devant l’utilisateur.

## Stratégie retenue

Ne pas scraper ViaMichelin ou les sites des sociétés d’autoroute tant que les conditions d’utilisation/API ne sont pas claires.

Implémenter une couche `TollProvider` plus tard avec plusieurs sources :

1. `ManualTollProvider` — champ manuel, déjà présent dans le prototype.
2. `OpenTollDataProvider` — piste open-source à auditer.
3. `TollGuruProvider` — API commerciale fiable potentielle.
4. `GoogleRoutesProvider` — possible mais probablement cher.

## Décision MVP

Pour pouvoir tester vite : péage manuel/estimé maintenant, architecture ouverte pour automatiser ensuite.

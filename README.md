# Japan Travel

Application web pour organiser un voyage au Japon à partir du carnet de **289 lieux** (Tokyo → Hiroshima) :
durée de visite conseillée, prix d'entrée (yens et euros), délai de réservation, 6 photos, vidéos et avis de voyageurs.

## Fonctionnalités

- **Compte** : inscription, connexion, mot de passe oublié (Supabase Auth, e-mail + mot de passe).
- **Carte** (accueil) : carte du Japon ; une fois connecté, elle montre les lieux de votre voyage, numérotés et reliés
  par un trajet ville par ville (pointillés entre deux villes). Option pour afficher aussi le reste du catalogue.
- **Catalogue** : tous les lieux regroupés par ville, d'est en ouest ; filtres par type, par ville, recherche,
  et « masquer les lieux déjà ajoutés ». Bouton « Ajouter à mes lieux » sur chaque fiche.
- **Mes lieux** : les lieux choisis, ville par ville, avec le détail de chaque fiche, des notes perso et les réservations à anticiper.
- **Usages** : chaque lieu est « à visiter », « pour manger » ou « pour dormir » (filtres dans le catalogue et Mes lieux).
- **Fiches perso** : « + Créer une fiche » dans le catalogue (position via un lien Google Maps ou des coordonnées).
- **Voyage** : dates de départ et de retour, puis les lieux de « Mes lieux » placés jour par jour, dans l'ordre de visite.
  Les lieux se déplacent d'un jour à l'autre par glisser-déposer (poignée ⠿) ou avec le menu « J… ».
  Entre deux jours, une section « Nuit » indique où dormir. Depuis Mes lieux, un menu place directement un lieu sur un jour ou une nuit.
  Ce planning forme le trajet tracé sur la carte d'accueil.

## Technique

- Vite + React + TypeScript, routage par hash (compatible GitHub Pages).
- Carte : contour détouré du Japon (Natural Earth 1:10 m via `world-atlas`), pré-projeté en SVG par
  `node scripts/build-japan-map.mjs` → `src/data/japan-map.json` ; repères en français.
- Données du carnet : `src/data/catalogue.json` ; photos en planches `public/sprites/<id>.jpg` (6 photos Wikimedia Commons par lieu).
- Base : projet Supabase **JapanTravel** (`bjpinzjpxdiaxagtldqq`), tables `trip_items` (mes lieux), `voyages` (dates) `voyage_etapes` (lieux par jour) `custom_places` (fiches créées à la main) et `favoris`,
  protégées par RLS ; les notes perso sont dans `trip_items.note`
  (voir `supabase/migrations/`). La clé publique dans `src/config.ts` est faite pour le navigateur ;
  elle peut être remplacée par les variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY`.

## Lancer en local

```bash
npm install
npm run dev
```

## Mise en ligne

Le workflow `.github/workflows/deploy.yml` publie l'application sur GitHub Pages à chaque push sur `main`.

1. Dans GitHub : **Settings → Pages → Source : GitHub Actions**.
   (Pages sur un dépôt privé demande un compte GitHub Pro ; sinon rendre le dépôt public, ou déployer `dist/`
   sur Vercel / Netlify.)
2. Dans Supabase : **Authentication → URL Configuration** :
   - *Site URL* : `https://carottejy.github.io/JapanTravel/`
   - *Redirect URLs* : ajouter `https://carottejy.github.io/JapanTravel/**` (et `http://localhost:5173/**` pour le local).
   Sans cela, les liens de confirmation d'inscription et de mot de passe oublié renvoient vers `localhost`.

## Mettre à jour le catalogue

Le fichier `src/data/catalogue.json` est généré depuis le carnet « Lieux du Japon ». Chaque lieu a un `id` stable :
c'est lui qui est enregistré dans `trip_items.place_id`, il ne faut donc pas le renommer.

## Versions et notes de version

Le numéro de version vient de `package.json` et s'affiche sur la carte d'accueil. Les notes de version sont dans
`src/data/releases.ts` et s'affichent dans l'onglet **Info**. Pour une nouvelle version : augmenter `version`
dans `package.json` et ajouter une entrée en tête de `RELEASES`.

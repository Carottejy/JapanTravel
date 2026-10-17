# Japan Travel

Application web pour organiser un voyage au Japon à partir du carnet de **126 lieux** (Tokyo → Hiroshima) :
durée de visite conseillée, prix d'entrée (yens et euros), délai de réservation, 6 photos, vidéos et avis de voyageurs.

## Fonctionnalités

- **Compte** : inscription, connexion, mot de passe oublié (Supabase Auth, e-mail + mot de passe).
- **Carte** (accueil) : carte du Japon ; une fois connecté, elle montre les lieux de votre voyage, numérotés et reliés
  par un trajet ville par ville (pointillés entre deux villes). Option pour afficher aussi le reste du catalogue.
- **Catalogue** : tous les lieux regroupés par ville, d'est en ouest ; filtres par type, par ville, recherche,
  et « seulement les lieux pas encore dans mon voyage ». Bouton « Ajouter au voyage » sur chaque fiche.
- **Mon voyage** : les lieux choisis, ville par ville, réordonnables ; liste des réservations à anticiper.

## Technique

- Vite + React + TypeScript, routage par hash (compatible GitHub Pages).
- Carte : Leaflet + fond OpenStreetMap.
- Données du carnet : `src/data/catalogue.json` ; photos en planches `public/sprites/<id>.jpg` (6 photos Wikimedia Commons par lieu).
- Base : projet Supabase **JapanTravel** (`bjpinzjpxdiaxagtldqq`), table `trip_items` protégée par RLS
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

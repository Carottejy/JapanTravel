export const APP_VERSION: string = __APP_VERSION__;

export interface Release {
  version: string;
  date: string; // AAAA-MM-JJ
  titre: string;
  notes: string[];
}

/** Notes de version, de la plus récente à la plus ancienne. Ajouter une entrée à chaque nouvelle version
 *  (et mettre à jour "version" dans package.json). */
export const RELEASES: Release[] = [
  {
    version: "1.3.0",
    date: "2026-10-17",
    titre: "Carte détourée du Japon",
    notes: [
      "L'accueil affiche une carte détourée du Japon, simple et informative, à la place du fond de carte détaillé.",
      "Les lieux du voyage sont en surbrillance, numérotés et reliés par le trajet ; leurs noms s'affichent à côté.",
      "Tous les noms sont en français : îles, mers, grandes villes et mont Fuji.",
      "Toucher un lieu ouvre un encadré pour voir sa fiche ou l'ajouter au voyage ; boutons « Japon entier » et « Centrer sur mon trajet ».",
    ],
  },
  {
    version: "1.2.1",
    date: "2026-10-17",
    titre: "Un maneki-neko comme icône",
    notes: [
      "Nouvelle icône : un maneki-neko, le chat porte-bonheur qui fait signe de la patte, sur fond vermillon.",
      "L'application peut être ajoutée à l'écran d'accueil du téléphone avec cette icône.",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-10-17",
    titre: "Carte épurée et onglet Info",
    notes: [
      "La carte d'accueil n'affiche plus le panneau « Mon itinéraire » : elle laisse toute la place au trajet. La liste détaillée reste dans l'onglet Mon voyage.",
      "Un bouton sur la carte affiche ou masque les autres lieux du catalogue.",
      "Nouvel onglet Info avec ces notes de version ; le numéro de version est affiché sur la carte.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-10-17",
    titre: "Nouvelle apparence, pensée pour le téléphone",
    notes: [
      "Barre d'onglets en bas de l'écran sur téléphone.",
      "Style Japon traditionnel : papier washi, encre sumi, indigo aizome, vermillon, sceaux de catégorie et noms des villes en kanji.",
      "Catalogue parcouru comme une ligne de train, de ville en ville ; photos à faire défiler au doigt.",
      "Mon voyage : chaque lieu présenté comme un panneau de gare JR, avec l'arrêt précédent et le suivant.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-10-17",
    titre: "Première version",
    notes: [
      "Comptes : inscription, connexion et mot de passe oublié.",
      "Catalogue des 126 lieux du carnet, regroupés par ville, avec durée de visite, prix, réservation, photos, vidéos et avis.",
      "Filtre pour n'afficher que les lieux pas encore ajoutés au voyage.",
      "Mon voyage : les lieux choisis, ville par ville, réordonnables, et la carte qui les relie par un trajet.",
    ],
  },
];

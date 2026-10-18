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
    version: "2.2.0",
    date: "2026-10-18",
    titre: "Les lieux de vos documents de voyage",
    notes: [
      "41 lieux repris de l'itinéraire, des excursions et des bons de réservation du dossier « Japon » : Kinkaku-ji, Ginkaku-ji, Heian-jingū, Tokyo Skytree, Shibuya Sky, teamLab Borderless, DisneySea, Nikkō, mont Misen…",
      "Alpes japonaises : château de Matsumoto, singes des neiges de Jigokudani, vieux Takayama et village de Shirakawa-gō.",
      "Vos activités réservées ont leur fiche : dîner-spectacle sumo à Tokyo, cérémonie du thé Koto à Kyoto, atelier okonomiyaki OKOSTA à Hiroshima.",
      "Le catalogue compte désormais 283 lieux.",
    ],
  },
  {
    version: "2.1.0",
    date: "2026-10-18",
    titre: "Où manger, où dormir",
    notes: [
      "109 nouvelles fiches, dans chacune des 21 villes du carnet : 55 adresses pour manger (ramen, tonkatsu, okonomiyaki, cuisine des moines, marchés, cafés à thème…) et 54 pour dormir.",
      "Hébergements variés : ryokans, shukubō (nuits au temple), maisons de ville et fermes chez l'habitant, auberges, capsules, manga-cafés, hôtel-librairie, hôtel des robots, yourtes sur la plage, glamping, hôtel-musée…",
      "Le catalogue compte désormais 242 lieux. Prix indicatifs à vérifier avant de réserver.",
    ],
  },
  {
    version: "2.0.0",
    date: "2026-10-18",
    titre: "Visiter, manger, dormir",
    notes: [
      "Chaque lieu est classé : à visiter (観), pour manger (食) ou pour dormir (宿) ; le catalogue se filtre par usage, et vos fiches perso se classent à la création.",
      "Voyage : entre chaque jour, une section « Nuit » (泊) pour choisir où dormir, avec un raccourci « Même hébergement que la veille ». L'hébergement termine la journée sur la carte.",
      "Mes lieux : filtre par usage, et un menu sur chaque lieu pour le placer directement dans le voyage (un jour pour visiter ou manger, une nuit pour dormir).",
    ],
  },
  {
    version: "1.9.0",
    date: "2026-10-18",
    titre: "Favoris",
    notes: [
      "Catalogue : touchez l'étoile ☆ à côté du nom d'un lieu pour le mettre en favori, sans l'ajouter à Mes lieux.",
      "Nouveau filtre « Seulement mes favoris » pour n'afficher qu'eux ; il se combine avec la recherche et les types.",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-10-18",
    titre: "Notes perso, fiches maison et glisser-déposer",
    notes: [
      "Mes lieux : chaque lieu peut recevoir vos notes personnelles (メモ), enregistrées automatiquement et rappelées dans l'onglet Voyage.",
      "Catalogue : bouton « + Créer une fiche » pour ajouter un lieu à vous (nom, ville, position via un lien Google Maps, description, durée, prix…). Vos fiches portent le sceau 手作 et se modifient ou se suppriment à tout moment.",
      "Voyage : faites glisser un lieu par sa poignée ⠿ d'un jour à l'autre, au doigt ou à la souris ; un menu « J… » permet aussi de le déplacer.",
    ],
  },
  {
    version: "1.7.3",
    date: "2026-10-18",
    titre: "Bouton d'installation",
    notes: [
      "Dans l'onglet Info, un bouton « Installer l'application » apparaît quand le navigateur le permet, avec un petit diagnostic en cas de problème.",
    ],
  },
  {
    version: "1.7.2",
    date: "2026-10-18",
    titre: "Installation : nouvel identifiant d'application",
    notes: [
      "L'application a un nouvel identifiant pour Android : un téléphone qui la croyait « déjà installée » peut maintenant l'installer normalement.",
    ],
  },
  {
    version: "1.7.1",
    date: "2026-10-18",
    titre: "Installation sur téléphone",
    notes: [
      "L'application s'installe désormais comme une vraie appli sur Android (icône dans la liste des applications) : icônes aux formats demandés par Android et service worker.",
      "La dernière version de l'application reste consultable sans réseau ; vos lieux et votre voyage, eux, nécessitent une connexion.",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-10-17",
    titre: "7 nouveaux lieux au catalogue",
    notes: [
      "Tokyo : Omoide Yokochō (ruelle des petits comptoirs de Shinjuku) et l'atelier de carillons Shinohara Furin Honpo.",
      "Hakone : le ryokan Mount View Hakone et ses bains thermaux à Sengokuhara.",
      "Osaka : Yoshitake (sukiyaki de wagyu), Yaoya to Gohan Uraya (cantine de légumes) et le Diorama Restaurant (chats et trains miniatures).",
      "Chūbu : les gorges de Kurobe et leur petit train Torokko.",
      "Le catalogue compte désormais 133 lieux.",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-10-17",
    titre: "Nouvel onglet Voyage, jour par jour",
    notes: [
      "Nouvel onglet Voyage (旅程) : choisissez la date de départ et la date de retour, puis placez chaque jour des lieux de votre liste « Mes lieux », dans l'ordre de visite.",
      "La carte d'accueil trace désormais le trajet du voyage, jour après jour (pointillés d'un jour à l'autre) ; un lieu touché indique son jour et son étape.",
      "Mes lieux devient une simple liste par ville, sans ordre de visite ; chaque lieu indique les jours où il est prévu.",
      "Retirer un lieu de Mes lieux le retire aussi des journées du voyage ; raccourcir les dates retire, après confirmation, les lieux placés hors des nouvelles dates.",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-10-17",
    titre: "Mes lieux : villes repliables et fiches détaillées",
    notes: [
      "Dans Mes lieux, chaque ville se replie ou se déplie d'un toucher sur son nom ; une ville repliée rappelle la liste de ses lieux.",
      "Boutons « Tout replier » et « Tout déplier » ; les villes repliées restent repliées à la prochaine visite.",
      "Chaque lieu a un bouton « Voir le détail » qui affiche sa fiche complète, comme dans le catalogue : photos, description, infos pratiques, vidéos et avis.",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-10-17",
    titre: "« Mon voyage » devient « Mes lieux »",
    notes: [
      "L'onglet Mon voyage s'appelle désormais Mes lieux (行き先).",
      "Dans le catalogue et sur la carte, les boutons deviennent « Ajouter à mes lieux » et « Dans mes lieux ».",
      "Les anciens liens vers Mon voyage mènent automatiquement à Mes lieux.",
    ],
  },
  {
    version: "1.3.1",
    date: "2026-10-17",
    titre: "Accueil réduit à la carte",
    notes: [
      "L'accueil n'affiche plus que la carte et le trajet : plus de message d'invite ni de boutons par-dessus la carte.",
      "Toucher un lieu du trajet ouvre toujours son encadré.",
    ],
  },
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

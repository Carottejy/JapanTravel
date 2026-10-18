import raw from "./catalogue.json";

export type Category = "classique" | "hors" | "activite";
/** Usage du lieu : à visiter, pour manger, pour dormir */
export type Usage = "visiter" | "manger" | "dormir";
export const USAGE_LABEL: Record<Usage, string> = { visiter: "À visiter", manger: "Pour manger", dormir: "Pour dormir" };
export const USAGE_KANJI: Record<Usage, string> = { visiter: "観", manger: "食", dormir: "宿" };
export type Zone = "tokyo" | "fuji" | "chubu" | "kansai" | "osaka" | "kii" | "sanyo" | "hiro";

export interface Place {
  id: string;
  nom: string;
  cat: Category;
  usage: Usage;
  zone: Zone;
  lieu: string;
  lat: number;
  lon: number;
  desc: string;
  note?: string | null;
  ville: number;
  duree: string;
  prix: string;
  resa: string;
  q: string;
  photos: { name: string; page: string }[];
  videos: { titre: string; url: string }[];
  avis: { en: string; fr: string; url: string }[];
  ta?: string | null;
  taNom?: string | null;
  /** fiche créée à la main par le compte */
  custom?: boolean;
  lien?: string | null;
}
export interface Ville {
  nom: string;
  sous: string;
}

export const VILLES: Ville[] = raw.villes;
/** Nom japonais de chaque groupe de villes, dans l'ordre du carnet (affiché sur les panneaux de gare). */
const KANJI = ["東京", "東京近郊", "富士山", "箱根・伊豆", "名古屋・中部", "琵琶湖", "伊賀・伊勢", "京都", "宇治", "丹後", "奈良", "奈良近郊",
  "大阪", "大阪近郊", "神戸", "紀伊半島", "姫路", "岡山・倉敷", "瀬戸内海", "広島", "広島近郊"];
export const villeKanji = (i: number) => KANJI[i] ?? "";

export const PLACES: Place[] = raw.places as Place[];
export const PLACE_BY_ID: Record<string, Place> = Object.fromEntries(PLACES.map((p) => [p.id, p]));

export const CAT_LABEL: Record<Category, string> = {
  classique: "Incontournable",
  hors: "Moins touristique",
  activite: "Activité atypique",
};

export const ZONE_COLOR: Record<Zone, string> = {
  tokyo: "#b23a48",
  fuji: "#b9771a",
  chubu: "#8a5a9e",
  kansai: "#2f6f73",
  osaka: "#4b4f8a",
  kii: "#3b7d4f",
  sanyo: "#b0602a",
  hiro: "#5e7f1f",
};

export const spriteUrl = (id: string) => `${import.meta.env.BASE_URL}sprites/${id}.jpg`;
/** Position CSS d'une vignette dans la planche 3 × 2 */
export const spritePos = (k: number) => `${(k % 3) * 50}% ${Math.floor(k / 3) * 100}%`;

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

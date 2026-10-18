/** Villes proposées pour définir la zone d'un voyage (un cercle de N km autour de chacune). */
export interface ZoneVille { id: string; nom: string; lat: number; lon: number }

export const ZONE_VILLES: ZoneVille[] = [
  { id: "tokyo", nom: "Tokyo", lat: 35.681, lon: 139.767 },
  { id: "yokohama", nom: "Yokohama", lat: 35.444, lon: 139.638 },
  { id: "kamakura", nom: "Kamakura", lat: 35.319, lon: 139.547 },
  { id: "nikko", nom: "Nikkō", lat: 36.758, lon: 139.599 },
  { id: "hakone", nom: "Hakone", lat: 35.233, lon: 139.107 },
  { id: "kawaguchiko", nom: "Kawaguchiko (mont Fuji)", lat: 35.5, lon: 138.76 },
  { id: "izu", nom: "Izu (Shuzenji)", lat: 34.97, lon: 138.927 },
  { id: "nagano", nom: "Nagano", lat: 36.648, lon: 138.181 },
  { id: "matsumoto", nom: "Matsumoto", lat: 36.238, lon: 137.969 },
  { id: "takayama", nom: "Takayama", lat: 36.141, lon: 137.252 },
  { id: "shirakawago", nom: "Shirakawa-gō", lat: 36.258, lon: 136.906 },
  { id: "toyama", nom: "Toyama", lat: 36.695, lon: 137.211 },
  { id: "kanazawa", nom: "Kanazawa", lat: 36.561, lon: 136.656 },
  { id: "nagoya", nom: "Nagoya", lat: 35.17, lon: 136.882 },
  { id: "ise", nom: "Ise", lat: 34.455, lon: 136.725 },
  { id: "hikone", nom: "Hikone (lac Biwa)", lat: 35.276, lon: 136.252 },
  { id: "kyoto", nom: "Kyoto", lat: 35.011, lon: 135.768 },
  { id: "amanohashidate", nom: "Amanohashidate", lat: 35.567, lon: 135.193 },
  { id: "uji", nom: "Uji", lat: 34.884, lon: 135.8 },
  { id: "nara", nom: "Nara", lat: 34.685, lon: 135.805 },
  { id: "osaka", nom: "Osaka", lat: 34.693, lon: 135.502 },
  { id: "kobe", nom: "Kobe", lat: 34.69, lon: 135.196 },
  { id: "koyasan", nom: "Kōya-san", lat: 34.213, lon: 135.585 },
  { id: "kumano", nom: "Kumano (Hongū)", lat: 33.84, lon: 135.773 },
  { id: "himeji", nom: "Himeji", lat: 34.827, lon: 134.69 },
  { id: "okayama", nom: "Okayama", lat: 34.666, lon: 133.918 },
  { id: "kurashiki", nom: "Kurashiki", lat: 34.596, lon: 133.771 },
  { id: "takamatsu", nom: "Takamatsu", lat: 34.351, lon: 134.047 },
  { id: "naoshima", nom: "Naoshima", lat: 34.46, lon: 133.995 },
  { id: "onomichi", nom: "Onomichi", lat: 34.409, lon: 133.205 },
  { id: "hiroshima", nom: "Hiroshima", lat: 34.397, lon: 132.475 },
  { id: "miyajima", nom: "Miyajima", lat: 34.296, lon: 132.32 },
  { id: "fukuoka", nom: "Fukuoka", lat: 33.59, lon: 130.42 },
  { id: "sendai", nom: "Sendai", lat: 38.268, lon: 140.869 },
  { id: "sapporo", nom: "Sapporo", lat: 43.068, lon: 141.351 },
];
export const ZONE_VILLE_BY_ID: Record<string, ZoneVille> = Object.fromEntries(ZONE_VILLES.map((v) => [v.id, v]));

/** Distance à vol d'oiseau, en km */
export function distKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const r = Math.PI / 180, dLat = (bLat - aLat) * r, dLon = (bLon - aLon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** Le lieu est-il à moins de `km` d'au moins une des villes de la zone ? */
export function inZone(p: { lat: number; lon: number }, villes: string[], km: number) {
  return villes.some((id) => { const v = ZONE_VILLE_BY_ID[id]; return v && distKm(p.lat, p.lon, v.lat, v.lon) <= km; });
}

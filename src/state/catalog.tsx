import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { PLACES, VILLES, norm, type Category, type Place, type Zone } from "../data/catalogue";
import { useAuth } from "./auth";

/* Catalogue = fiches du carnet + fiches créées à la main par le compte (table custom_places). */

export interface CustomInput {
  nom: string; cat: Category; ville: number; lieu: string; lat: number; lon: number;
  description: string; duree: string; prix: string; resa: string; lien: string;
}
interface Row extends CustomInput { id: string }

// Zone (couleur) et centre de chaque ville, déduits des fiches du carnet.
export const VILLE_ZONE: Zone[] = VILLES.map((_, i) => PLACES.find((p) => p.ville === i)?.zone ?? "kansai");
export const VILLE_CENTRE: [number, number][] = VILLES.map((_, i) => {
  const ps = PLACES.filter((p) => p.ville === i);
  return [ps.reduce((s, p) => s + p.lat, 0) / ps.length, ps.reduce((s, p) => s + p.lon, 0) / ps.length];
});

const toPlace = (r: Row): Place => ({
  id: r.id, nom: r.nom, cat: r.cat, zone: VILLE_ZONE[r.ville] ?? "kansai", lieu: r.lieu || VILLES[r.ville]?.nom || "",
  lat: r.lat, lon: r.lon, desc: r.description || "", note: null, ville: r.ville,
  duree: r.duree || "Non précisée", prix: r.prix || "Non précisé", resa: r.resa || "Non précisé",
  q: r.nom, photos: [], videos: [], avis: [], ta: null, taNom: null, custom: true, lien: r.lien || null,
});

interface CatalogValue {
  places: Place[];
  byId: Record<string, Place>;
  rank: Record<string, number>;
  hay: Record<string, string>;
  customRows: Record<string, Row>;
  create: (x: CustomInput) => Promise<{ error: string | null; id: string }>;
  update: (id: string, x: CustomInput) => Promise<string | null>;
  remove: (id: string) => Promise<string | null>;
}
const Ctx = createContext<CatalogValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!userId) { setRows([]); return; }
    let off = false;
    supabase.from("custom_places").select("id, nom, cat, ville, lieu, lat, lon, description, duree, prix, resa, lien").order("created_at")
      .then(({ data }) => { if (!off) setRows((data as Row[]) ?? []); });
    return () => { off = true; };
  }, [userId]);

  const value = useMemo(() => {
    const custom = rows.map(toPlace);
    // Les fiches perso se rangent à la fin de leur ville.
    const places: Place[] = [];
    VILLES.forEach((_, v) => { PLACES.forEach((p) => p.ville === v && places.push(p)); custom.forEach((p) => p.ville === v && places.push(p)); });
    const byId = Object.fromEntries(places.map((p) => [p.id, p]));
    const rank = Object.fromEntries(places.map((p, i) => [p.id, i]));
    const hay = Object.fromEntries(places.map((p) => [p.id, norm([p.nom, p.lieu, p.desc, p.q].join(" "))]));
    return { places, byId, rank, hay, customRows: Object.fromEntries(rows.map((r) => [r.id, r])) };
  }, [rows]);

  const create = useCallback(async (x: CustomInput) => {
    const id = "perso-" + crypto.randomUUID();
    const { error } = await supabase.from("custom_places").insert({ id, ...x });
    if (error) return { error: "La fiche n'a pas pu être enregistrée.", id };
    setRows((cur) => [...cur, { id, ...x }]);
    return { error: null, id };
  }, []);
  const update = useCallback(async (id: string, x: CustomInput) => {
    const { error } = await supabase.from("custom_places").update({ ...x, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return "Les modifications n'ont pas pu être enregistrées.";
    setRows((cur) => cur.map((r) => (r.id === id ? { id, ...x } : r)));
    return null;
  }, []);
  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("custom_places").delete().eq("id", id);
    if (error) return "La fiche n'a pas pu être supprimée.";
    await supabase.from("trip_items").delete().eq("place_id", id);
    await supabase.from("voyage_etapes").delete().eq("place_id", id);
    await supabase.from("favoris").delete().eq("place_id", id);
    setRows((cur) => cur.filter((r) => r.id !== id));
    return null;
  }, []);

  return <Ctx.Provider value={{ ...value, create, update, remove }}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCatalog hors CatalogProvider");
  return v;
}

/** Lit des coordonnées dans un lien Google Maps (…/@35.01,135.77,… ou ?q=35.01,135.77) ou un texte « 35.01, 135.77 ». */
export function parseCoords(s: string): [number, number] | null {
  const m = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || s.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
    || s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || s.match(/^\s*(-?\d+\.\d+)\s*[,; ]\s*(-?\d+\.\d+)\s*$/);
  if (!m) return null;
  const lat = +m[1], lon = +m[2];
  return lat >= 20 && lat <= 46 && lon >= 122 && lon <= 154 ? [lat, lon] : null;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Place } from "../data/catalogue";
import { useCatalog } from "./catalog";
import { useAuth } from "./auth";
import { useTrip } from "./trip";

/* Planning : plusieurs voyages par compte, chacun avec son nom, ses dates, ses lieux placés jour par jour
   et l'hébergement de chaque nuit. Les écrans travaillent sur le voyage « actif ». */

export type Kind = "jour" | "nuit";
export interface Etape { id: string; voyage_id: string; day: string; place_id: string; position: number; kind: Kind }
export interface Voyage { id: string; nom: string; start_date: string; end_date: string; zone_villes: string[]; zone_km: number | null }
/** Ce que l'on saisit pour créer ou modifier un voyage */
export interface VoyageInput { nom: string; start: string; end: string; zoneVilles: string[]; zoneKm: number | null }
export interface StopInfo { p: Place; day: string; dayIndex: number; n: number; kind: Kind }

interface PlanValue {
  voyages: Voyage[];                    // tous les voyages du compte, par date de départ
  voyage: Voyage | null;                // voyage actif
  setActive: (id: string) => void;
  createVoyage: (x: VoyageInput) => Promise<string | null>;
  saveVoyage: (x: VoyageInput) => Promise<string | null>;
  deleteVoyage: (id: string) => Promise<void>;
  etapes: Etape[];                      // étapes du voyage actif
  loading: boolean;
  days: string[];                       // toutes les dates du voyage actif (AAAA-MM-JJ)
  route: StopInfo[];                    // trajet : chaque jour ses visites dans l'ordre, puis l'hébergement du soir
  addToDay: (day: string, placeId: string, kind?: Kind) => Promise<void>;
  removeEtape: (id: string) => Promise<void>;
  moveEtape: (id: string, dir: -1 | 1) => Promise<void>;
  /** Glisser-déposer : place l'étape sur un jour donné, à l'index donné de ce jour */
  moveToDay: (id: string, day: string, index: number) => Promise<void>;
  removePlaceEverywhere: (placeId: string) => Promise<void>;
  daysOf: (placeId: string) => string[];
  nightsOf: (placeId: string) => string[];
  /** Noms des autres voyages où ce lieu est placé */
  otherVoyagesOf: (placeId: string) => string[];
  nights: string[];                     // soirs du voyage actif (tous les jours sauf le dernier)
}

const PlanContext = createContext<PlanValue | null>(null);
const COLS = "id, nom, start_date, end_date, zone_villes, zone_km";
const norm = (v: Voyage): Voyage => ({ ...v, zone_villes: v.zone_villes ?? [], zone_km: v.zone_km ?? null });
const row = (x: VoyageInput) => ({
  nom: x.nom.trim(), start_date: x.start, end_date: x.end,
  zone_villes: x.zoneVilles, zone_km: x.zoneVilles.length ? Math.round(x.zoneKm ?? 0) : null,
});
const ACTIVE_KEY = "jt-voyage-actif";

export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("fr-FR", { ...opts, timeZone: "UTC" });

const readActive = () => { try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; } };
const writeActive = (id: string) => { try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* stockage indisponible */ } };

function checkDates({ nom, start, end, zoneVilles, zoneKm }: VoyageInput) {
  if (!nom.trim()) return "Donnez un nom à ce voyage.";
  if (zoneVilles.length && !(zoneKm && zoneKm >= 1 && zoneKm <= 500)) return "Indiquez un périmètre entre 1 et 500 km autour des villes choisies.";
  if (!start || !end) return "Choisissez une date de départ et une date de retour.";
  if (end < start) return "La date de retour doit être après la date de départ.";
  if ((new Date(end).getTime() - new Date(start).getTime()) / 864e5 > 90) return "Un voyage ne peut pas dépasser 90 jours.";
  return null;
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { has } = useTrip();
  const { byId } = useCatalog();
  const userId = session?.user.id;
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [all, setAll] = useState<Etape[]>([]);
  const [activeId, setActiveId] = useState<string | null>(readActive);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setVoyages([]); setAll([]); return; }
    let off = false;
    setLoading(true);
    Promise.all([
      supabase.from("voyages").select(COLS).order("start_date"),
      supabase.from("voyage_etapes").select("id, voyage_id, day, place_id, position, kind").order("day").order("position"),
    ]).then(([v, e]) => {
      if (off) return;
      setVoyages(((v.data as Voyage[]) ?? []).map(norm).sort((a, b) => a.start_date.localeCompare(b.start_date)));
      setAll(((e.data as Etape[]) ?? []).map((x) => ({ ...x, kind: x.kind ?? "jour" })));
      setLoading(false);
    });
    return () => { off = true; };
  }, [userId]);

  // Voyage actif : le dernier choisi sur cet appareil, sinon le prochain à venir, sinon le premier.
  const voyage = useMemo(() => {
    if (!voyages.length) return null;
    const chosen = voyages.find((v) => v.id === activeId);
    if (chosen) return chosen;
    const today = new Date().toISOString().slice(0, 10);
    return voyages.find((v) => v.end_date >= today) ?? voyages[voyages.length - 1];
  }, [voyages, activeId]);
  const vid = voyage?.id ?? null;

  const setActive = useCallback((id: string) => { setActiveId(id); writeActive(id); }, []);

  const etapes = useMemo(() => (vid ? all.filter((e) => e.voyage_id === vid) : []), [all, vid]);

  const days = useMemo(() => {
    if (!voyage) return [];
    const out: string[] = [];
    for (let d = voyage.start_date; d <= voyage.end_date && out.length < 92; d = addDays(d, 1)) out.push(d);
    return out;
  }, [voyage]);

  const nights = useMemo(() => days.slice(0, -1), [days]);

  const route = useMemo(() => {
    const out: StopInfo[] = [];
    const ok = (e: Etape) => has(e.place_id) && byId[e.place_id];
    days.forEach((day, dayIndex) => {
      etapes.filter((e) => e.day === day && e.kind === "jour" && ok(e)).sort((a, b) => a.position - b.position)
        .forEach((e) => out.push({ p: byId[e.place_id], day, dayIndex, n: out.length + 1, kind: "jour" }));
      // L'hébergement du soir termine la journée sur la carte.
      etapes.filter((e) => e.day === day && e.kind === "nuit" && ok(e)).sort((a, b) => a.position - b.position)
        .forEach((e) => out.push({ p: byId[e.place_id], day, dayIndex, n: out.length + 1, kind: "nuit" }));
    });
    return out;
  }, [days, etapes, has, byId]);

  const sortV = (list: Voyage[]) => [...list].sort((a, b) => a.start_date.localeCompare(b.start_date));

  const createVoyage = useCallback(async (x: VoyageInput) => {
    const bad = checkDates(x);
    if (bad) return bad;
    const { data, error } = await supabase.from("voyages").insert(row(x)).select(COLS).single();
    if (error || !data) return "Le voyage n'a pas pu être créé.";
    const v = norm(data as Voyage);
    setVoyages((cur) => sortV([...cur, v]));
    setActive(v.id);
    return null;
  }, [setActive]);

  const saveVoyage = useCallback(async (x: VoyageInput) => {
    if (!voyage) return "Aucun voyage sélectionné.";
    const bad = checkDates(x);
    if (bad) return bad;
    const { start, end } = x;
    const outside = etapes.filter((e) => e.day < start || e.day > end || (e.kind === "nuit" && e.day >= end));
    if (outside.length && !window.confirm(`${outside.length} lieu(x) placé(s) sur des jours hors de ces dates seront retirés du planning. Continuer ?`))
      return "Dates inchangées.";
    const { error } = await supabase.from("voyages").update({ ...row(x), updated_at: new Date().toISOString() }).eq("id", voyage.id);
    if (error) return "Le voyage n'a pas pu être enregistré.";
    if (outside.length) {
      await supabase.from("voyage_etapes").delete().in("id", outside.map((e) => e.id));
      setAll((cur) => cur.filter((e) => !outside.includes(e)));
    }
    setVoyages((cur) => sortV(cur.map((v) => (v.id === voyage.id ? { ...v, ...norm({ id: v.id, ...row(x) } as Voyage) } : v))));
    return null;
  }, [voyage, etapes]);

  const deleteVoyage = useCallback(async (id: string) => {
    const { error } = await supabase.from("voyages").delete().eq("id", id);
    if (error) return;
    setVoyages((cur) => cur.filter((v) => v.id !== id));
    setAll((cur) => cur.filter((e) => e.voyage_id !== id));
  }, []);

  const addToDay = useCallback(async (day: string, placeId: string, kind: Kind = "jour") => {
    if (!vid) return;
    if (etapes.some((e) => e.day === day && e.kind === kind && e.place_id === placeId)) return;
    const position = etapes.filter((e) => e.day === day && e.kind === kind).reduce((m, e) => Math.max(m, e.position), 0) + 1;
    const tmp: Etape = { id: "tmp-" + kind + day + placeId, voyage_id: vid, day, place_id: placeId, position, kind };
    setAll((cur) => [...cur, tmp]);
    const { data, error } = await supabase.from("voyage_etapes").insert({ voyage_id: vid, day, place_id: placeId, position, kind })
      .select("id, voyage_id, day, place_id, position, kind").single();
    setAll((cur) => (error || !data ? cur.filter((e) => e.id !== tmp.id) : cur.map((e) => (e.id === tmp.id ? ({ ...(data as Etape), voyage_id: vid, kind }) : e))));
  }, [etapes, vid]);

  const removeEtape = useCallback(async (id: string) => {
    const prev = all;
    setAll((cur) => cur.filter((e) => e.id !== id));
    const { error } = await supabase.from("voyage_etapes").delete().eq("id", id);
    if (error) setAll(prev);
  }, [all]);

  // Retirer un lieu de « Mes lieux » le retire de tous les voyages.
  const removePlaceEverywhere = useCallback(async (placeId: string) => {
    if (!all.some((e) => e.place_id === placeId)) return;
    setAll((cur) => cur.filter((e) => e.place_id !== placeId));
    await supabase.from("voyage_etapes").delete().eq("place_id", placeId);
  }, [all]);

  const moveEtape = useCallback(async (id: string, dir: -1 | 1) => {
    const me = etapes.find((e) => e.id === id);
    if (!me) return;
    const same = etapes.filter((e) => e.day === me.day && e.kind === me.kind).sort((a, b) => a.position - b.position);
    const k = same.findIndex((e) => e.id === id), other = same[k + dir];
    if (!other) return;
    const pa = me.position === other.position ? other.position + dir : other.position, pb = me.position;
    const prev = all;
    setAll((cur) => cur.map((e) => (e.id === me.id ? { ...e, position: pa } : e.id === other.id ? { ...e, position: pb } : e)));
    const r1 = await supabase.from("voyage_etapes").update({ position: pa }).eq("id", me.id);
    const r2 = await supabase.from("voyage_etapes").update({ position: pb }).eq("id", other.id);
    if (r1.error || r2.error) setAll(prev);
  }, [etapes, all]);

  const moveToDay = useCallback(async (id: string, day: string, index: number) => {
    const me = etapes.find((e) => e.id === id);
    if (!me) return;
    const prev = all;
    // Le même lieu est déjà prévu ce jour-là : on retire simplement le doublon.
    const dup = me.day !== day && etapes.find((e) => e.day === day && e.kind === me.kind && e.place_id === me.place_id);
    if (dup) { await removeEtape(id); return; }
    const target = etapes.filter((e) => e.day === day && e.kind === me.kind && e.id !== id).sort((a, b) => a.position - b.position);
    target.splice(Math.max(0, Math.min(index, target.length)), 0, { ...me, day });
    const renum = new Map(target.map((e, k) => [e.id, k + 1]));
    const source = me.day !== day ? etapes.filter((e) => e.day === me.day && e.kind === me.kind && e.id !== id).sort((a, b) => a.position - b.position) : [];
    source.forEach((e, k) => renum.set(e.id, k + 1));
    const next = all.map((e) => (e.id === id ? { ...e, day, position: renum.get(id)! } : renum.has(e.id) ? { ...e, position: renum.get(e.id)! } : e));
    setAll(next);
    const changed = next.filter((e) => { const o = prev.find((x) => x.id === e.id)!; return o.day !== e.day || o.position !== e.position; });
    const res = await Promise.all(changed.map((e) => supabase.from("voyage_etapes").update({ day: e.day, position: e.position }).eq("id", e.id)));
    if (res.some((r) => r.error)) setAll(prev);
  }, [etapes, all, removeEtape]);

  const daysOf = useCallback((placeId: string) => etapes.filter((e) => e.place_id === placeId && e.kind === "jour").map((e) => e.day).sort(), [etapes]);
  const nightsOf = useCallback((placeId: string) => etapes.filter((e) => e.place_id === placeId && e.kind === "nuit").map((e) => e.day).sort(), [etapes]);
  const otherVoyagesOf = useCallback((placeId: string) => {
    const ids = new Set(all.filter((e) => e.place_id === placeId && e.voyage_id !== vid).map((e) => e.voyage_id));
    return voyages.filter((v) => ids.has(v.id)).map((v) => v.nom);
  }, [all, vid, voyages]);

  return (
    <PlanContext.Provider value={{ voyages, voyage, setActive, createVoyage, saveVoyage, deleteVoyage, etapes, loading, days, route,
      addToDay, removeEtape, moveEtape, moveToDay, removePlaceEverywhere, daysOf, nightsOf, otherVoyagesOf, nights }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const v = useContext(PlanContext);
  if (!v) throw new Error("usePlan hors PlanProvider");
  return v;
}

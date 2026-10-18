import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Place } from "../data/catalogue";
import { useCatalog } from "./catalog";
import { useAuth } from "./auth";
import { useTrip } from "./trip";

/* Planning du voyage : dates de départ et de retour, et lieux placés jour par jour. */

export interface Etape { id: string; day: string; place_id: string; position: number }
export interface Voyage { start_date: string; end_date: string }
export interface StopInfo { p: Place; day: string; dayIndex: number; n: number }

interface PlanValue {
  voyage: Voyage | null;
  etapes: Etape[];
  loading: boolean;
  days: string[];                       // toutes les dates du voyage (AAAA-MM-JJ)
  route: StopInfo[];                    // trajet : jours dans l'ordre, puis ordre dans la journée
  saveDates: (start: string, end: string) => Promise<string | null>;
  addToDay: (day: string, placeId: string) => Promise<void>;
  removeEtape: (id: string) => Promise<void>;
  moveEtape: (id: string, dir: -1 | 1) => Promise<void>;
  /** Glisser-déposer : place l'étape sur un jour donné, à l'index donné de ce jour */
  moveToDay: (id: string, day: string, index: number) => Promise<void>;
  removePlaceEverywhere: (placeId: string) => Promise<void>;
  daysOf: (placeId: string) => string[];
}

const PlanContext = createContext<PlanValue | null>(null);

export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("fr-FR", { ...opts, timeZone: "UTC" });

export function PlanProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { has } = useTrip();
  const { byId } = useCatalog();
  const userId = session?.user.id;
  const [voyage, setVoyage] = useState<Voyage | null>(null);
  const [etapes, setEtapes] = useState<Etape[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setVoyage(null); setEtapes([]); return; }
    let off = false;
    setLoading(true);
    Promise.all([
      supabase.from("voyages").select("start_date, end_date").maybeSingle(),
      supabase.from("voyage_etapes").select("id, day, place_id, position").order("day").order("position"),
    ]).then(([v, e]) => {
      if (off) return;
      setVoyage((v.data as Voyage) ?? null);
      setEtapes((e.data as Etape[]) ?? []);
      setLoading(false);
    });
    return () => { off = true; };
  }, [userId]);

  const days = useMemo(() => {
    if (!voyage) return [];
    const out: string[] = [];
    for (let d = voyage.start_date; d <= voyage.end_date && out.length < 92; d = addDays(d, 1)) out.push(d);
    return out;
  }, [voyage]);

  const route = useMemo(() => {
    const out: StopInfo[] = [];
    days.forEach((day, dayIndex) =>
      etapes.filter((e) => e.day === day && has(e.place_id) && byId[e.place_id]).sort((a, b) => a.position - b.position)
        .forEach((e) => out.push({ p: byId[e.place_id], day, dayIndex, n: out.length + 1 })));
    return out;
  }, [days, etapes, has, byId]);

  const saveDates = useCallback(async (start: string, end: string) => {
    if (!start || !end) return "Choisissez une date de départ et une date de retour.";
    if (end < start) return "La date de retour doit être après la date de départ.";
    if ((new Date(end).getTime() - new Date(start).getTime()) / 864e5 > 90) return "Le voyage ne peut pas dépasser 90 jours.";
    const outside = etapes.filter((e) => e.day < start || e.day > end);
    if (outside.length && !window.confirm(`${outside.length} lieu(x) placé(s) sur des jours hors de ces dates seront retirés du planning. Continuer ?`))
      return "Dates inchangées.";
    const { error } = await supabase.from("voyages").upsert({ user_id: userId, start_date: start, end_date: end, updated_at: new Date().toISOString() });
    if (error) return "Les dates n'ont pas pu être enregistrées.";
    if (outside.length) {
      await supabase.from("voyage_etapes").delete().in("id", outside.map((e) => e.id));
      setEtapes((cur) => cur.filter((e) => !outside.includes(e)));
    }
    setVoyage({ start_date: start, end_date: end });
    return null;
  }, [etapes, userId]);

  const addToDay = useCallback(async (day: string, placeId: string) => {
    if (etapes.some((e) => e.day === day && e.place_id === placeId)) return;
    const position = etapes.filter((e) => e.day === day).reduce((m, e) => Math.max(m, e.position), 0) + 1;
    const tmp: Etape = { id: "tmp-" + day + placeId, day, place_id: placeId, position };
    setEtapes((cur) => [...cur, tmp]);
    const { data, error } = await supabase.from("voyage_etapes").insert({ day, place_id: placeId, position }).select("id, day, place_id, position").single();
    setEtapes((cur) => (error || !data ? cur.filter((e) => e.id !== tmp.id) : cur.map((e) => (e.id === tmp.id ? (data as Etape) : e))));
  }, [etapes]);

  const removeEtape = useCallback(async (id: string) => {
    const prev = etapes;
    setEtapes((cur) => cur.filter((e) => e.id !== id));
    const { error } = await supabase.from("voyage_etapes").delete().eq("id", id);
    if (error) setEtapes(prev);
  }, [etapes]);

  const removePlaceEverywhere = useCallback(async (placeId: string) => {
    if (!etapes.some((e) => e.place_id === placeId)) return;
    setEtapes((cur) => cur.filter((e) => e.place_id !== placeId));
    await supabase.from("voyage_etapes").delete().eq("place_id", placeId);
  }, [etapes]);

  const moveEtape = useCallback(async (id: string, dir: -1 | 1) => {
    const me = etapes.find((e) => e.id === id);
    if (!me) return;
    const same = etapes.filter((e) => e.day === me.day).sort((a, b) => a.position - b.position);
    const k = same.findIndex((e) => e.id === id), other = same[k + dir];
    if (!other) return;
    const pa = me.position === other.position ? other.position + dir : other.position, pb = me.position;
    const prev = etapes;
    setEtapes((cur) => cur.map((e) => (e.id === me.id ? { ...e, position: pa } : e.id === other.id ? { ...e, position: pb } : e)));
    const r1 = await supabase.from("voyage_etapes").update({ position: pa }).eq("id", me.id);
    const r2 = await supabase.from("voyage_etapes").update({ position: pb }).eq("id", other.id);
    if (r1.error || r2.error) setEtapes(prev);
  }, [etapes]);

  const moveToDay = useCallback(async (id: string, day: string, index: number) => {
    const me = etapes.find((e) => e.id === id);
    if (!me) return;
    const prev = etapes;
    // Le même lieu est déjà prévu ce jour-là : on retire simplement le doublon.
    const dup = me.day !== day && etapes.find((e) => e.day === day && e.place_id === me.place_id);
    if (dup) { await removeEtape(id); return; }
    const target = etapes.filter((e) => e.day === day && e.id !== id).sort((a, b) => a.position - b.position);
    target.splice(Math.max(0, Math.min(index, target.length)), 0, { ...me, day });
    const renum = new Map(target.map((e, k) => [e.id, k + 1]));
    const source = me.day !== day ? etapes.filter((e) => e.day === me.day && e.id !== id).sort((a, b) => a.position - b.position) : [];
    source.forEach((e, k) => renum.set(e.id, k + 1));
    const next = etapes.map((e) => (e.id === id ? { ...e, day, position: renum.get(id)! } : renum.has(e.id) ? { ...e, position: renum.get(e.id)! } : e));
    setEtapes(next);
    const changed = next.filter((e) => { const o = prev.find((x) => x.id === e.id)!; return o.day !== e.day || o.position !== e.position; });
    const res = await Promise.all(changed.map((e) => supabase.from("voyage_etapes").update({ day: e.day, position: e.position }).eq("id", e.id)));
    if (res.some((r) => r.error)) setEtapes(prev);
  }, [etapes, removeEtape]);

  const daysOf = useCallback((placeId: string) => etapes.filter((e) => e.place_id === placeId).map((e) => e.day).sort(), [etapes]);

  return (
    <PlanContext.Provider value={{ voyage, etapes, loading, days, route, saveDates, addToDay, removeEtape, moveEtape, moveToDay, removePlaceEverywhere, daysOf }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const v = useContext(PlanContext);
  if (!v) throw new Error("usePlan hors PlanProvider");
  return v;
}

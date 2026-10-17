import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { PLACE_BY_ID, type Place } from "../data/catalogue";
import { useAuth } from "./auth";

export interface TripItem {
  id: string;
  place_id: string;
  position: number;
}

interface TripValue {
  items: TripItem[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  has: (placeId: string) => boolean;
  add: (placeId: string) => Promise<void>;
  remove: (placeId: string) => Promise<void>;
  move: (placeId: string, dir: -1 | 1) => Promise<void>;
  /** Lieux du voyage triés : par ville (ordre du carnet, d'est en ouest), puis par ordre choisi */
  ordered: Place[];
}

const TripContext = createContext<TripValue | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [items, setItems] = useState<TripItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("trip_items")
      .select("id, place_id, position")
      .order("position")
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) setError("Impossible de charger vos lieux.");
        else setItems((data ?? []).filter((i) => PLACE_BY_ID[i.place_id]));
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const has = useCallback((id: string) => items.some((i) => i.place_id === id), [items]);

  const add = useCallback(
    async (placeId: string) => {
      if (!userId || items.some((i) => i.place_id === placeId)) return;
      const position = items.reduce((m, i) => Math.max(m, i.position), 0) + 1;
      const temp: TripItem = { id: "tmp-" + placeId, place_id: placeId, position };
      setItems((cur) => [...cur, temp]);
      const { data, error } = await supabase
        .from("trip_items")
        .insert({ place_id: placeId, position })
        .select("id, place_id, position")
        .single();
      if (error || !data) {
        setItems((cur) => cur.filter((i) => i.id !== temp.id));
        setError("L'ajout n'a pas pu être enregistré.");
      } else setItems((cur) => cur.map((i) => (i.id === temp.id ? data : i)));
    },
    [userId, items],
  );

  const remove = useCallback(
    async (placeId: string) => {
      const prev = items;
      setItems((cur) => cur.filter((i) => i.place_id !== placeId));
      const { error } = await supabase.from("trip_items").delete().eq("place_id", placeId);
      if (error) {
        setItems(prev);
        setError("La suppression n'a pas pu être enregistrée.");
      }
    },
    [items],
  );

  const ordered = useMemo(
    () =>
      [...items]
        .sort((a, b) => {
          const pa = PLACE_BY_ID[a.place_id], pb = PLACE_BY_ID[b.place_id];
          return pa.ville - pb.ville || a.position - b.position;
        })
        .map((i) => PLACE_BY_ID[i.place_id]),
    [items],
  );

  // Échange la position avec le lieu voisin de la même ville.
  const move = useCallback(
    async (placeId: string, dir: -1 | 1) => {
      const ville = PLACE_BY_ID[placeId].ville;
      const same = ordered.filter((p) => p.ville === ville).map((p) => items.find((i) => i.place_id === p.id)!);
      const k = same.findIndex((i) => i.place_id === placeId);
      const other = same[k + dir];
      if (!other) return;
      const me = same[k];
      const prev = items;
      // positions distinctes garanties
      const pa = me.position === other.position ? other.position + dir : other.position;
      const pb = me.position;
      setItems((cur) =>
        cur.map((i) => (i.id === me.id ? { ...i, position: pa } : i.id === other.id ? { ...i, position: pb } : i)),
      );
      const r1 = await supabase.from("trip_items").update({ position: pa }).eq("id", me.id);
      const r2 = await supabase.from("trip_items").update({ position: pb }).eq("id", other.id);
      if (r1.error || r2.error) {
        setItems(prev);
        setError("Le nouvel ordre n'a pas pu être enregistré.");
      }
    },
    [items, ordered],
  );

  return (
    <TripContext.Provider value={{ items, loading, error, clearError: () => setError(null), has, add, remove, move, ordered }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const v = useContext(TripContext);
  if (!v) throw new Error("useTrip hors TripProvider");
  return v;
}

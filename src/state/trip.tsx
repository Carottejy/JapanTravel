import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./auth";

export interface TripItem {
  id: string;
  place_id: string;
  position: number;
  note: string | null;
}

interface TripValue {
  items: TripItem[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  has: (placeId: string) => boolean;
  add: (placeId: string) => Promise<void>;
  remove: (placeId: string) => Promise<void>;
  /** Note personnelle sur un lieu de « Mes lieux » */
  setNote: (placeId: string, note: string) => Promise<boolean>;
  noteOf: (placeId: string) => string;
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
      .select("id, place_id, position, note")
      .order("position")
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) setError("Impossible de charger vos lieux.");
        else setItems(data ?? []);
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
      const temp: TripItem = { id: "tmp-" + placeId, place_id: placeId, position, note: null };
      setItems((cur) => [...cur, temp]);
      const { data, error } = await supabase
        .from("trip_items")
        .insert({ place_id: placeId, position })
        .select("id, place_id, position, note")
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

  const setNote = useCallback(async (placeId: string, note: string) => {
    const it = items.find((i) => i.place_id === placeId);
    if (!it) return false;
    const v = note.trim() ? note.slice(0, 2000) : null;
    setItems((cur) => cur.map((i) => (i.place_id === placeId ? { ...i, note: v } : i)));
    const { error } = await supabase.from("trip_items").update({ note: v }).eq("id", it.id);
    if (error) { setError("La note n'a pas pu être enregistrée."); return false; }
    return true;
  }, [items]);
  const noteOf = useCallback((placeId: string) => items.find((i) => i.place_id === placeId)?.note ?? "", [items]);

  return (
    <TripContext.Provider value={{ items, loading, error, clearError: () => setError(null), has, add, remove, setNote, noteOf }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const v = useContext(TripContext);
  if (!v) throw new Error("useTrip hors TripProvider");
  return v;
}

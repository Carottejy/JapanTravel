import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./auth";

/* Favoris du catalogue : une simple liste de lieux marqués d'une étoile, indépendante de « Mes lieux ». */
interface FavValue { favs: Set<string>; isFav: (id: string) => boolean; toggle: (id: string) => Promise<void> }
const Ctx = createContext<FavValue | null>(null);

export function FavProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [favs, setFavs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) { setFavs(new Set()); return; }
    let off = false;
    supabase.from("favoris").select("place_id").then(({ data }) => {
      if (!off) setFavs(new Set(((data as { place_id: string }[]) ?? []).map((r) => r.place_id)));
    });
    return () => { off = true; };
  }, [userId]);

  const isFav = useCallback((id: string) => favs.has(id), [favs]);
  const toggle = useCallback(async (id: string) => {
    const on = !favs.has(id);
    setFavs((cur) => { const n = new Set(cur); if (on) n.add(id); else n.delete(id); return n; });
    const { error } = on
      ? await supabase.from("favoris").insert({ place_id: id })
      : await supabase.from("favoris").delete().eq("place_id", id);
    if (error) setFavs((cur) => { const n = new Set(cur); if (on) n.delete(id); else n.add(id); return n; });
  }, [favs]);

  return <Ctx.Provider value={{ favs, isFav, toggle }}>{children}</Ctx.Provider>;
}

export function useFav() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFav hors FavProvider");
  return v;
}

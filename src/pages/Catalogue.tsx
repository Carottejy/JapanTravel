import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { VILLES, norm, villeKanji, type Category } from "../data/catalogue";
import { useCatalog } from "../state/catalog";
import { useFav } from "../state/fav";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import PlaceCard from "../components/PlaceCard";

const CATS: { v: "all" | "perso" | Category; l: string }[] = [
  { v: "all", l: "Tous" },
  { v: "classique", l: "Incontournables" },
  { v: "hors", l: "Moins touristiques" },
  { v: "activite", l: "Activités atypiques" },
  { v: "perso", l: "Mes fiches" },
];

export default function Catalogue() {
  const { session } = useAuth();
  const { has, items } = useTrip();
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState<"all" | "perso" | Category>("all");
  const { places: PLACES, hay: HAY } = useCatalog();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const rail = useRef<HTMLOListElement>(null);
  const onlyNew = params.get("nouveaux") === "1";
  const onlyFav = params.get("favoris") === "1";
  const { favs } = useFav();
  const focus = params.get("lieu");

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return PLACES.filter((p) => (cat === "all" || (cat === "perso" ? p.custom : p.cat === cat)) && (!nq || HAY[p.id].includes(nq)) && (!onlyNew || !session || !has(p.id)) && (!onlyFav || !session || favs.has(p.id)));
  }, [cat, q, onlyNew, onlyFav, favs, session, has, PLACES, HAY]);

  const groups = useMemo(() => {
    const m = new Map<number, typeof list>();
    list.forEach((p) => m.set(p.ville, [...(m.get(p.ville) ?? []), p]));
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [list]);
  const inTripByVille = useMemo(() => {
    const c: Record<number, number> = {};
    items.forEach((i) => { const p = PLACES.find((x) => x.id === i.place_id); if (p) c[p.ville] = (c[p.ville] ?? 0) + 1; });
    return c;
  }, [items, PLACES]);

  // Gare active de la ligne = ville en cours de lecture.
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(+(e.target as HTMLElement).dataset.v!)),
      { rootMargin: "-30% 0px -65% 0px" },
    );
    document.querySelectorAll("section.city").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [groups]);
  useEffect(() => {
    rail.current?.querySelector<HTMLElement>(`[data-v="${active}"]`)?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [active]);

  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById("lieu-" + focus);
    if (el) {
      el.scrollIntoView({ block: "start" });
      el.classList.add("flash");
      setTimeout(() => el.classList.remove("flash"), 1800);
    }
  }, [focus]);

  const setFlag = (k: string, v: boolean) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, "1"); else p.delete(k);
    p.delete("lieu");
    setParams(p, { replace: true });
  };
  const setOnlyNew = (v: boolean) => {
    const p = new URLSearchParams(params);
    if (v) p.set("nouveaux", "1"); else p.delete("nouveaux");
    p.delete("lieu");
    setParams(p, { replace: true });
  };
  const present = new Set(groups.map(([v]) => v));

  return (
    <div className="page">
      <div className="page-head">
        <h1>Catalogue <span lang="ja" className="jp-sub">目録</span></h1>
        <p className="muted">{PLACES.length} lieux, de Tokyo à Hiroshima, rangés ville par ville comme les gares d'une ligne.</p>
        {session && <div className="row"><Link to="/fiche/nouvelle" className="btn ghost">+ Créer une fiche</Link></div>}
      </div>

      <div className="filters">
        <input type="search" placeholder="Rechercher un lieu, un quartier…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un lieu" />
        <div className="chips" role="group" aria-label="Type de lieu">
          {CATS.filter((c) => c.v !== "perso" || PLACES.some((p) => p.custom)).map((c) => <button key={c.v} className="chip" aria-pressed={cat === c.v} onClick={() => setCat(c.v)}>{c.l}</button>)}
        </div>
        {session && (
          <label className="switch">
            <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
            Masquer les lieux déjà ajoutés
          </label>
        )}
        {session && (
          <label className="switch fav-switch">
            <input type="checkbox" checked={onlyFav} onChange={(e) => setFlag("favoris", e.target.checked)} />
            <span className="fav-ico" aria-hidden="true">★</span> Seulement mes favoris ({favs.size})
          </label>
        )}
      </div>

      <nav className="line" aria-label="Aller à une ville">
        <ol ref={rail}>
          {VILLES.map((v, i) => (
            <li key={i} data-v={i} className={(i === active ? "on " : "") + (present.has(i) ? "" : "off")}>
              <button disabled={!present.has(i)} aria-current={i === active ? "true" : undefined}
                onClick={() => document.getElementById("ville-" + i)?.scrollIntoView({ block: "start" })}>
                <span className="st" aria-hidden="true">{inTripByVille[i] ? <span className="st-n">{inTripByVille[i]}</span> : null}</span>
                <span className="st-jp" lang="ja">{villeKanji(i)}</span>
                <span className="st-fr">{v.nom}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <p className="muted small count-line" aria-live="polite">{list.length} lieu{list.length > 1 ? "x" : ""} affiché{list.length > 1 ? "s" : ""}</p>
      {groups.length === 0 && <p className="empty">{onlyFav && favs.size === 0 ? "Aucun favori pour l'instant : touchez l'étoile ☆ à côté du nom d'un lieu pour le mettre de côté." : "Aucun lieu ne correspond. Effacez la recherche ou choisissez « Tous »."}</p>}
      {groups.map(([v, places]) => (
        <section key={v} className="city" data-v={v} id={"ville-" + v} aria-labelledby={"vh-" + v}>
          <div className="city-head">
            <span className="city-jp" lang="ja" aria-hidden="true">{villeKanji(v)}</span>
            <div>
              <h2 id={"vh-" + v}>{VILLES[v].nom}</h2>
              <span className="muted small">{VILLES[v].sous}, {places.length} lieu{places.length > 1 ? "x" : ""}</span>
            </div>
          </div>
          {places.map((p) => <PlaceCard key={p.id} p={p} />)}
        </section>
      ))}
    </div>
  );
}

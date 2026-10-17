import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PLACES, VILLES, norm, type Category } from "../data/catalogue";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import PlaceCard from "../components/PlaceCard";

const CATS: { v: "all" | Category; l: string }[] = [
  { v: "all", l: "Tous" },
  { v: "classique", l: "Incontournables" },
  { v: "hors", l: "Moins touristiques" },
  { v: "activite", l: "Activités atypiques" },
];
const HAY = Object.fromEntries(PLACES.map((p) => [p.id, norm([p.nom, p.lieu, p.desc, p.q].join(" "))]));

export default function Catalogue() {
  const { session } = useAuth();
  const { has } = useTrip();
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState<"all" | Category>("all");
  const [q, setQ] = useState("");
  const [ville, setVille] = useState<number | "all">("all");
  const onlyNew = params.get("nouveaux") === "1";
  const focus = params.get("lieu");

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return PLACES.filter(
      (p) =>
        (cat === "all" || p.cat === cat) &&
        (ville === "all" || p.ville === ville) &&
        (!nq || HAY[p.id].includes(nq)) &&
        (!onlyNew || !session || !has(p.id)),
    );
  }, [cat, q, ville, onlyNew, session, has]);

  const groups = useMemo(() => {
    const m = new Map<number, typeof list>();
    list.forEach((p) => m.set(p.ville, [...(m.get(p.ville) ?? []), p]));
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [list]);

  // Arrivée depuis la carte : ouvrir la ville du lieu et y défiler.
  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById("lieu-" + focus);
    if (el) {
      el.scrollIntoView({ block: "start" });
      el.classList.add("flash");
      setTimeout(() => el.classList.remove("flash"), 1800);
    }
  }, [focus]);

  const setOnlyNew = (v: boolean) => {
    const p = new URLSearchParams(params);
    if (v) p.set("nouveaux", "1"); else p.delete("nouveaux");
    p.delete("lieu");
    setParams(p, { replace: true });
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>Catalogue</h1>
        <p className="muted">
          {PLACES.length} lieux regroupés par ville, d'est en ouest, avec durée de visite, prix et réservation.
        </p>
      </div>

      <div className="filters" role="search">
        <div className="chips" role="group" aria-label="Type de lieu">
          {CATS.map((c) => (
            <button key={c.v} className="chip" aria-pressed={cat === c.v} onClick={() => setCat(c.v)}>{c.l}</button>
          ))}
        </div>
        <select value={ville} onChange={(e) => setVille(e.target.value === "all" ? "all" : +e.target.value)} aria-label="Ville">
          <option value="all">Toutes les villes</option>
          {VILLES.map((v, i) => <option key={i} value={i}>{v.nom}</option>)}
        </select>
        <input type="search" placeholder="Rechercher un lieu…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un lieu" />
        {session && (
          <label className="switch">
            <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
            Seulement les lieux pas encore dans mon voyage
          </label>
        )}
        <span className="muted count-line" aria-live="polite">{list.length} lieu{list.length > 1 ? "x" : ""}</span>
      </div>

      {groups.length === 0 && <p className="empty">Aucun lieu ne correspond à ces filtres.</p>}
      {groups.map(([v, places]) => (
        <section key={v} className="city" aria-labelledby={"ville-" + v}>
          <div className="city-head">
            <h2 id={"ville-" + v}>{VILLES[v].nom}</h2>
            <span className="muted">{VILLES[v].sous} · {places.length} lieu{places.length > 1 ? "x" : ""}</span>
          </div>
          {places.map((p) => <PlaceCard key={p.id} p={p} />)}
        </section>
      ))}
    </div>
  );
}

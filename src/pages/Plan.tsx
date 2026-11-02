import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { USAGE_KANJI, USAGE_LABEL, VILLES, type Place, type Usage } from "../data/catalogue";
import { useCatalog } from "../state/catalog";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import { dayLabel, usePlan } from "../state/plan";

/* Plan : vraie carte zoomable avec tous les lieux de « Mes lieux » (et, au choix, ceux du catalogue).
   Chaque repère ouvre une bulle avec la fiche, Google Maps, l'itinéraire, et l'ajout ou le retrait de Mes lieux. */

const VIEW_KEY = "jt-plan-vue";
const USAGE_KEY = "jt-plan-usage";
const CAT_KEY = "jt-plan-catalogue";
const FOND_KEY = "jt-plan-fond";
// Fonds de carte sans clé : noms en français quand OpenStreetMap les connaît (sinon nom local),
// ou en lettres latines partout (CARTO), ou noms d'origine.
const FONDS = {
  fr: { nom: "Noms en français", url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", sub: "abc", max: 20,
    attr: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · OSM France' },
  latin: { nom: "Lettres latines", url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", sub: "abcd", max: 20,
    attr: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · © <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>' },
  local: { nom: "Noms japonais", url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", sub: "", max: 19,
    attr: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' },
} as const;
type Fond = keyof typeof FONDS;
type View = { lat: number; lon: number; z: number };
const read = <T,>(k: string): T | null => { try { return JSON.parse(sessionStorage.getItem(k) || "null"); } catch { return null; } };
const write = (k: string, v: unknown) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible */ } };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Lien Google Maps : par nom pour un restaurant ou un hébergement, par coordonnées sinon (comme sur les fiches). */
const gmaps = (p: Place) => {
  const parNom = !p.custom && p.usage !== "visiter" && !/^(Partout|Domiciles|Centre de|Pied du)/.test(p.lieu);
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(parNom ? `${p.q}, ${p.lieu}` : `${p.lat},${p.lon}`);
};

export default function Plan() {
  const { session, loading: authLoading } = useAuth();
  const { items, noteOf, has, add, remove } = useTrip();
  const { removePlaceEverywhere } = usePlan();
  const { byId, places } = useCatalog();
  const { voyage, voyages, daysOf, nightsOf, days } = usePlan();
  const [usage, setUsage] = useState<Usage | "all">(() => read<Usage | "all">(USAGE_KEY) ?? "all");
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const me = useRef<L.LayerGroup | null>(null);
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [showCat, setShowCat] = useState<boolean>(() => read<boolean>(CAT_KEY) ?? false);
  const [fond, setFond] = useState<Fond>(() => { const f = read<Fond>(FOND_KEY); return f && f in FONDS ? f : "fr"; });
  const tiles = useRef<L.TileLayer | null>(null);

  const mine = useMemo(() => items.map((i) => byId[i.place_id]).filter((p): p is Place => !!p && Number.isFinite(p.lat) && Number.isFinite(p.lon)), [items, byId]);
  const counts = useMemo(() => {
    const c = { all: mine.length, visiter: 0, manger: 0, dormir: 0 } as Record<Usage | "all", number>;
    mine.forEach((p) => c[p.usage]++);
    return c;
  }, [mine]);
  const shown = useMemo(() => (usage === "all" ? mine : mine.filter((p) => p.usage === usage)), [mine, usage]);
  // Lieux du catalogue qui ne sont pas encore dans Mes lieux (repères pâles), si on les affiche
  const catMode = showCat || mine.length === 0;
  const others = useMemo(() => (!catMode ? [] : places.filter((p) => !has(p.id) && Number.isFinite(p.lat) && Number.isFinite(p.lon) && (usage === "all" || p.usage === usage))),
    [catMode, places, has, usage]);

  // Création de la carte (une fois)
  const ready = !!session;
  useEffect(() => {
    if (!ready || !box.current || map.current) return;
    const m = L.map(box.current, { zoomControl: true, zoomAnimation: true, fadeAnimation: false, markerZoomAnimation: true, attributionControl: true });
    m.attributionControl.setPrefix(false);
    // Les noms des lieux s'affichent à côté des repères à partir d'un certain zoom.
    const lbl = () => m.getContainer().classList.toggle("show-labels", m.getZoom() >= 11);
    m.on("zoomend", lbl); lbl();
    layer.current = L.layerGroup().addTo(m);
    me.current = L.layerGroup().addTo(m);
    const v = read<View>(VIEW_KEY);
    if (v) m.setView([v.lat, v.lon], v.z, { animate: false });
    else m.setView([35.2, 136.5], 6, { animate: false });
    m.on("moveend", () => { const c = m.getCenter(); write(VIEW_KEY, { lat: c.lat, lon: c.lng, z: m.getZoom() }); });
    map.current = m;
    return () => { m.off(); m.remove(); map.current = null; layer.current = null; me.current = null; tiles.current = null; };
  }, [ready]);

  // Fond de carte
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    tiles.current?.remove();
    const f = FONDS[fond];
    const t = L.tileLayer(f.url, { maxZoom: f.max, subdomains: f.sub || "abc", attribution: f.attr, detectRetina: false });
    // Serveur indisponible : on bascule sur le fond OpenStreetMap standard.
    let ok = 0, ko = 0;
    t.on("tileload", () => { ok++; });
    t.on("tileerror", () => { if (++ko >= 6 && ok === 0 && fond !== "local") { setLocMsg(`Fond « ${f.nom} » indisponible : fond standard affiché.`); setFond("local"); } });
    tiles.current = t.addTo(m);
    write(FOND_KEY, fond);
  }, [fond, ready]);
  useEffect(() => write(CAT_KEY, showCat), [showCat]);

  // Repères : Mes lieux (vifs, avec leur nom) puis, au choix, le reste du catalogue (pâles)
  const fitted = useRef(!!read<View>(VIEW_KEY));
  useEffect(() => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const short = (d: string) => dayLabel(d, { weekday: "short", day: "numeric", month: "short" });
    const popup = (p: Place, inTrip: boolean) => {
      const plan = inTrip ? [
        ...daysOf(p.id).filter((d) => days.includes(d)).map((d) => `jour ${days.indexOf(d) + 1} (${short(d)})`),
        ...nightsOf(p.id).filter((d) => days.includes(d)).map((d) => `nuit du ${short(d)}`),
      ] : [];
      const note = inTrip ? noteOf(p.id) : "";
      const el = document.createElement("div");
      el.className = "pm-pop";
      el.innerHTML = `
        <span class="pm-tag pm-${p.usage}">${USAGE_KANJI[p.usage]} ${esc(USAGE_LABEL[p.usage])}</span>
        <strong>${esc(p.nom)}</strong>
        <span class="pm-sub">${esc(VILLES[p.ville]?.nom ?? "")} · ${esc(p.lieu)}</span>
        ${plan.length ? `<span class="pm-plan">${voyages.length > 1 && voyage ? esc(voyage.nom) + " : " : "Prévu : "}${esc(plan.join(", "))}</span>` : ""}
        ${note ? `<span class="pm-note">✎ ${esc(note)}</span>` : ""}
        <span class="pm-act">
          <a href="#/catalogue?lieu=${encodeURIComponent(p.id)}">Voir la fiche</a>
          <a href="${gmaps(p)}" target="_blank" rel="noopener">Google Maps ↗</a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}" target="_blank" rel="noopener">Itinéraire ↗</a>
        </span>
        <button type="button" class="pm-btn ${inTrip ? "out" : "in"}">${inTrip ? "Retirer de mes lieux" : "+ Ajouter à mes lieux"}</button>`;
      el.querySelector("button")!.addEventListener("click", async () => {
        m.closePopup();
        if (inTrip) { await removePlaceEverywhere(p.id); await remove(p.id); } else await add(p.id);
      });
      return el;
    };
    const mark = (p: Place, inTrip: boolean) => {
      const icon = L.divIcon({
        className: "pm-wrap" + (inTrip ? "" : " pm-cat"), iconSize: inTrip ? [34, 42] : [24, 30], iconAnchor: inTrip ? [17, 40] : [12, 28], popupAnchor: [0, inTrip ? -36 : -26],
        html: `<span class="pm pm-${p.usage}"><b lang="ja">${USAGE_KANJI[p.usage]}</b></span>`,
      });
      const mk = L.marker([p.lat, p.lon], { icon, title: p.nom, alt: p.nom, keyboard: true, zIndexOffset: inTrip ? 1000 : 0 })
        .bindPopup(() => popup(p, inTrip), { maxWidth: 280, autoPanPadding: [16, 70] });
      if (inTrip) mk.bindTooltip(esc(p.nom), { permanent: true, direction: "right", offset: [12, -22], className: "pm-label" });
      mk.addTo(g);
    };
    others.forEach((p) => mark(p, false));
    shown.forEach((p) => mark(p, true));
    if (!fitted.current && (shown.length || others.length)) { fitAll(); fitted.current = true; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, others, ready, days, daysOf, nightsOf, noteOf, voyage, voyages]);

  useEffect(() => write(USAGE_KEY, usage), [usage]);

  function fitAll() {
    const m = map.current;
    const pts = shown.length ? shown : others;
    if (!m || !pts.length) return;
    if (pts.length === 1) m.setView([pts[0].lat, pts[0].lon], 14);
    else m.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lon] as [number, number])), { padding: [40, 40], maxZoom: 15 });
  }
  function locate() {
    const m = map.current;
    if (!m || !navigator.geolocation) { setLocMsg("La position n'est pas disponible sur cet appareil."); return; }
    setLocMsg("Recherche de votre position…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;
        me.current?.clearLayers();
        L.circle([lat, lon], { radius: Math.min(accuracy, 2000), color: "#2f6fd6", weight: 1, fillOpacity: 0.12 }).addTo(me.current!);
        L.circleMarker([lat, lon], { radius: 7, color: "#fff", weight: 2, fillColor: "#2f6fd6", fillOpacity: 1 }).addTo(me.current!).bindTooltip("Vous êtes ici");
        m.setView([lat, lon], Math.max(m.getZoom(), 14));
        setLocMsg(null);
      },
      () => setLocMsg("Position refusée ou introuvable."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (!authLoading && !session)
    return (
      <div className="page narrow">
        <h1>Plan <span lang="ja" className="jp-sub">地図帳</span></h1>
        <p>Connectez-vous pour voir vos lieux sur la carte.</p>
        <Link to="/connexion" className="btn">Se connecter</Link>
      </div>
    );
  return (
    <div className="plan">
      <div ref={box} className="plan-map" role="region" aria-label="Carte de mes lieux" />
      <div className="plan-tools">
        <div className="chips" role="group" aria-label="Type de lieu">
          {(["all", "visiter", "manger", "dormir"] as const).map((u) => (
            <button key={u} className="chip" aria-pressed={usage === u} onClick={() => setUsage(u)}>
              {u === "all" ? "Tous" : <><span lang="ja">{USAGE_KANJI[u]}</span> {USAGE_LABEL[u]}</>} <span className="dot-num">{counts[u]}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="plan-side">
        <label className="switch plan-cat">
          <input type="checkbox" checked={catMode} disabled={mine.length === 0} onChange={(e) => setShowCat(e.target.checked)} />
          Afficher le catalogue
        </label>
        <label className="plan-fond">
          <span className="sr-only">Fond de carte</span>
          <select value={fond} onChange={(e) => setFond(e.target.value as Fond)}>
            {(Object.keys(FONDS) as Fond[]).map((k) => <option key={k} value={k}>{FONDS[k].nom}</option>)}
          </select>
        </label>
      </div>
      {mine.length === 0 && <p className="plan-msg top" role="status">Mes lieux est vide : touchez un repère du catalogue pour l'ajouter.</p>}
      <div className="plan-btns">
        <button className="btn sm" onClick={fitAll}>Tout voir</button>
        <button className="btn ghost sm" onClick={locate}>◎ Ma position</button>
      </div>
      {locMsg && <p className="plan-msg" role="status">{locMsg}</p>}
    </div>
  );
}

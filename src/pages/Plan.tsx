import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { USAGE_KANJI, USAGE_LABEL, VILLES, type Place, type Usage } from "../data/catalogue";
import { useCatalog } from "../state/catalog";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import { dayLabel, usePlan } from "../state/plan";

/* Plan : vraie carte zoomable (fond OpenStreetMap) avec tous les lieux de « Mes lieux ».
   Chaque repère ouvre une bulle avec la fiche, Google Maps et l'itinéraire. */

const VIEW_KEY = "jt-plan-vue";
const USAGE_KEY = "jt-plan-usage";
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
  const { items, noteOf } = useTrip();
  const { byId } = useCatalog();
  const { voyage, voyages, daysOf, nightsOf, days } = usePlan();
  const [usage, setUsage] = useState<Usage | "all">(() => read<Usage | "all">(USAGE_KEY) ?? "all");
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const me = useRef<L.LayerGroup | null>(null);
  const [locMsg, setLocMsg] = useState<string | null>(null);

  const mine = useMemo(() => items.map((i) => byId[i.place_id]).filter((p): p is Place => !!p && Number.isFinite(p.lat) && Number.isFinite(p.lon)), [items, byId]);
  const counts = useMemo(() => {
    const c = { all: mine.length, visiter: 0, manger: 0, dormir: 0 } as Record<Usage | "all", number>;
    mine.forEach((p) => c[p.usage]++);
    return c;
  }, [mine]);
  const shown = useMemo(() => (usage === "all" ? mine : mine.filter((p) => p.usage === usage)), [mine, usage]);

  // Création de la carte (une fois)
  const ready = !!session && mine.length > 0;
  useEffect(() => {
    if (!ready || !box.current || map.current) return;
    const m = L.map(box.current, { zoomControl: true, zoomAnimation: true, fadeAnimation: false, markerZoomAnimation: true, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(m);
    m.attributionControl.setPrefix(false);
    layer.current = L.layerGroup().addTo(m);
    me.current = L.layerGroup().addTo(m);
    const v = read<View>(VIEW_KEY);
    if (v) m.setView([v.lat, v.lon], v.z, { animate: false });
    else m.setView([35.2, 136.5], 6, { animate: false });
    m.on("moveend", () => { const c = m.getCenter(); write(VIEW_KEY, { lat: c.lat, lon: c.lng, z: m.getZoom() }); });
    map.current = m;
    return () => { m.off(); m.remove(); map.current = null; layer.current = null; me.current = null; };
  }, [ready]);

  // Repères
  const fitted = useRef(!!read<View>(VIEW_KEY));
  useEffect(() => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const short = (d: string) => dayLabel(d, { weekday: "short", day: "numeric", month: "short" });
    shown.forEach((p) => {
      const icon = L.divIcon({
        className: "pm-wrap", iconSize: [34, 42], iconAnchor: [17, 40], popupAnchor: [0, -36],
        html: `<span class="pm pm-${p.usage}"><b lang="ja">${USAGE_KANJI[p.usage]}</b></span>`,
      });
      const plan = [
        ...daysOf(p.id).filter((d) => days.includes(d)).map((d) => `jour ${days.indexOf(d) + 1} (${short(d)})`),
        ...nightsOf(p.id).filter((d) => days.includes(d)).map((d) => `nuit du ${short(d)}`),
      ];
      const note = noteOf(p.id);
      const html = `<div class="pm-pop">
        <span class="pm-tag pm-${p.usage}">${USAGE_KANJI[p.usage]} ${esc(USAGE_LABEL[p.usage])}</span>
        <strong>${esc(p.nom)}</strong>
        <span class="pm-sub">${esc(VILLES[p.ville]?.nom ?? "")} · ${esc(p.lieu)}</span>
        ${plan.length ? `<span class="pm-plan">${voyages.length > 1 && voyage ? esc(voyage.nom) + " : " : "Prévu : "}${esc(plan.join(", "))}</span>` : ""}
        ${note ? `<span class="pm-note">✎ ${esc(note)}</span>` : ""}
        <span class="pm-act">
          <a href="#/catalogue?lieu=${encodeURIComponent(p.id)}">Voir la fiche</a>
          <a href="${gmaps(p)}" target="_blank" rel="noopener">Google Maps ↗</a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}" target="_blank" rel="noopener">Itinéraire ↗</a>
        </span></div>`;
      L.marker([p.lat, p.lon], { icon, title: p.nom, alt: p.nom, keyboard: true }).bindPopup(html, { maxWidth: 280, autoPanPadding: [16, 70] }).addTo(g);
    });
    if (!fitted.current && shown.length) { fitAll(); fitted.current = true; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, ready, days, daysOf, nightsOf, noteOf, voyage, voyages]);

  useEffect(() => write(USAGE_KEY, usage), [usage]);

  function fitAll() {
    const m = map.current;
    if (!m || !shown.length) return;
    if (shown.length === 1) m.setView([shown[0].lat, shown[0].lon], 14);
    else m.fitBounds(L.latLngBounds(shown.map((p) => [p.lat, p.lon] as [number, number])), { padding: [40, 40], maxZoom: 15 });
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
  if (!authLoading && session && mine.length === 0)
    return (
      <div className="page narrow">
        <h1>Plan <span lang="ja" className="jp-sub">地図帳</span></h1>
        <p className="empty">Votre liste « Mes lieux » est vide. <Link to="/catalogue">Choisissez des lieux dans le catalogue</Link> : ils apparaîtront ici sur la carte.</p>
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
      <div className="plan-btns">
        <button className="btn sm" onClick={fitAll}>Tout voir</button>
        <button className="btn ghost sm" onClick={locate}>◎ Ma position</button>
      </div>
      {locMsg && <p className="plan-msg" role="status">{locMsg}</p>}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { PLACES, VILLES, ZONE_COLOR, type Place } from "../data/catalogue";
import { APP_VERSION } from "../data/releases";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import AddButton from "../components/AddButton";

const JAPAN_CENTER: [number, number] = [35.0, 135.9];

function numIcon(n: number, color: string, active: boolean) {
  return L.divIcon({
    className: "num-pin" + (active ? " active" : ""),
    html: `<span style="background:${color}">${n}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -12],
  });
}

function FitTo({ places, focus }: { places: Place[]; focus: string | null }) {
  const map = useMap();
  const done = useRef("");
  useEffect(() => {
    const key = places.map((p) => p.id).join(",") + "|" + focus;
    if (done.current === key) return;
    done.current = key;
    const f = focus && places.find((p) => p.id === focus);
    if (f) map.setView([f.lat, f.lon], 13, { animate: false });
    else if (places.length === 1) map.setView([places[0].lat, places[0].lon], 12);
    else if (places.length > 1)
      map.fitBounds(L.latLngBounds(places.map((p) => [p.lat, p.lon] as [number, number])), { padding: [40, 40], animate: false });
  }, [places, focus, map]);
  return null;
}

function PopupBody({ p, n }: { p: Place; n?: number }) {
  return (
    <div className="pop">
      <div className="pop-city">{n ? `Étape ${n} · ` : ""}{VILLES[p.ville].nom}</div>
      <strong>{p.nom}</strong>
      <div className="pop-dur">⏱ {p.duree}</div>
      <div className="pop-actions">
        <AddButton id={p.id} small />
        <Link to={`/catalogue?lieu=${p.id}`} className="small">Voir la fiche</Link>
      </div>
    </div>
  );
}

export default function Home() {
  const { session, loading } = useAuth();
  const { ordered, has, loading: tripLoading } = useTrip();
  const [params, setParams] = useSearchParams();
  const focus = params.get("focus");
  const [showAll, setShowAll] = useState(false);

  // Trajet : une ligne continue dans l'ordre du voyage, colorée par segment de ville.
  const segments = useMemo(() => {
    const segs: { pts: [number, number][]; color: string; inter: boolean }[] = [];
    for (let i = 1; i < ordered.length; i++) {
      const a = ordered[i - 1], b = ordered[i];
      const inter = a.ville !== b.ville;
      segs.push({ pts: [[a.lat, a.lon], [b.lat, b.lon]], color: inter ? "#1f2a3a" : ZONE_COLOR[b.zone], inter });
    }
    return segs;
  }, [ordered]);

  return (
    <div className="home">
      <div className="map-wrap">
        <MapContainer center={JAPAN_CENTER} zoom={6} minZoom={5} className="map" zoomControl={true} worldCopyJump>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {session && showAll &&
            PLACES.filter((p) => !has(p.id)).map((p) => (
              <CircleMarker key={p.id} center={[p.lat, p.lon]} radius={5}
                pathOptions={{ color: "#fff", weight: 1.5, fillColor: ZONE_COLOR[p.zone], fillOpacity: 0.55 }}>
                <Popup><PopupBody p={p} /></Popup>
              </CircleMarker>
            ))}
          {segments.map((s, i) => (
            <Polyline key={i} positions={s.pts}
              pathOptions={{ color: s.color, weight: s.inter ? 2.5 : 4, opacity: 0.85, dashArray: s.inter ? "6 8" : undefined }} />
          ))}
          {ordered.map((p, i) => (
            <Marker key={p.id} position={[p.lat, p.lon]} icon={numIcon(i + 1, ZONE_COLOR[p.zone], p.id === focus)}
              eventHandlers={{ click: () => setParams({ focus: p.id }, { replace: true }) }}>
              <Popup><PopupBody p={p} n={i + 1} /></Popup>
            </Marker>
          ))}
          <FitTo places={ordered} focus={focus} />
        </MapContainer>

        {session && (
          <div className="map-tools">
            <button className="chip" aria-pressed={showAll} onClick={() => setShowAll(!showAll)}>
              {showAll ? "Masquer les autres lieux" : "Afficher tous les lieux"}
            </button>
          </div>
        )}
        {session && !tripLoading && ordered.length === 0 && (
          <div className="map-hint">
            <p>Ajoutez des lieux depuis le catalogue : ils apparaîtront ici, reliés par un trajet.</p>
            <Link to="/catalogue" className="btn sm">Ouvrir le catalogue</Link>
          </div>
        )}
        <Link to="/info" className="version dot-num" aria-label={`Version ${APP_VERSION}, voir les nouveautés`}>v{APP_VERSION}</Link>

        {!loading && !session && (
          <div className="overlay">
            <div className="kippu">
              <div className="kippu-top">
                <span lang="ja">乗車券</span>
                <span className="dot-num">126</span>
              </div>
              <h1>Votre voyage au Japon, sur une carte</h1>
              <p>
                Choisissez vos lieux parmi les {PLACES.length} du carnet : ils s'affichent ici, reliés d'une ville à l'autre comme
                les gares d'une ligne.
              </p>
              <div className="kippu-actions">
                <Link to="/connexion" className="btn">Se connecter</Link>
                <Link to="/connexion?mode=inscription" className="btn ghost">Créer un compte</Link>
              </div>
              <Link to="/catalogue" className="small kippu-link">Parcourir le catalogue sans compte</Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

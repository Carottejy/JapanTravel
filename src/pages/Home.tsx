import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PLACES, PLACE_BY_ID, VILLES, ZONE_COLOR } from "../data/catalogue";
import { APP_VERSION } from "../data/releases";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import AddButton from "../components/AddButton";
import JapanMap from "../components/JapanMap";

export default function Home() {
  const { session, loading } = useAuth();
  const { ordered } = useTrip();
  const [params, setParams] = useSearchParams();
  const selected = params.get("focus");
  // Sans compte, les lieux du carnet apparaissent en points discrets derrière le billet de connexion.
  const others = useMemo(() => (session ? [] : PLACES), [session]);
  const stops = session ? ordered : [];
  const sel = selected ? PLACE_BY_ID[selected] : null;
  const selIndex = sel ? stops.findIndex((p) => p.id === sel.id) : -1;
  const select = (id: string | null) => setParams(id ? { focus: id } : {}, { replace: true });

  return (
    <div className="home">
      <div className="map-wrap">
        <JapanMap stops={stops} others={others} selected={selected} onSelect={select} view="trajet" />

        {sel && session && (
          <div className="map-card" style={{ ["--zone" as string]: ZONE_COLOR[sel.zone] }}>
            <button className="map-card-close" onClick={() => select(null)} aria-label="Fermer">✕</button>
            <p className="muted small">{selIndex >= 0 ? `Arrêt ${selIndex + 1}, ` : ""}{VILLES[sel.ville].nom}</p>
            <h2>{sel.nom}</h2>
            <p className="small">⏱ {sel.duree}</p>
            <div className="row">
              <AddButton id={sel.id} small />
              <Link to={`/catalogue?lieu=${sel.id}`} className="btn ghost sm">Voir la fiche</Link>
            </div>
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

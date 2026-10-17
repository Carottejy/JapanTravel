import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PLACES, PLACE_BY_ID, VILLES, ZONE_COLOR } from "../data/catalogue";
import { APP_VERSION } from "../data/releases";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import AddButton from "../components/AddButton";
import JapanMap from "../components/JapanMap";

export default function Home() {
  const { session, loading } = useAuth();
  const { ordered, has, loading: tripLoading } = useTrip();
  const [params, setParams] = useSearchParams();
  const selected = params.get("focus");
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState<"trajet" | "japon">("trajet");

  const others = useMemo(
    () => (!session ? PLACES : showAll ? PLACES.filter((p) => !has(p.id)) : []),
    [session, showAll, has],
  );
  const stops = session ? ordered : [];
  const sel = selected ? PLACE_BY_ID[selected] : null;
  const selIndex = sel ? stops.findIndex((p) => p.id === sel.id) : -1;
  const select = (id: string | null) => setParams(id ? { focus: id } : {}, { replace: true });

  return (
    <div className="home">
      <div className="map-wrap">
        <JapanMap stops={stops} others={others} selected={selected} onSelect={select} view={view} />

        {session && (
          <div className="map-tools">
            {stops.length > 0 && (
              <button className="chip" onClick={() => setView(view === "trajet" ? "japon" : "trajet")}>
                {view === "trajet" ? "Japon entier" : "Centrer sur mon trajet"}
              </button>
            )}
            <button className="chip" aria-pressed={showAll} onClick={() => setShowAll(!showAll)}>
              {showAll ? "Masquer les autres lieux" : "Afficher tous les lieux"}
            </button>
          </div>
        )}

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

        {session && !sel && !tripLoading && stops.length === 0 && (
          <div className="map-hint">
            <p>Ajoutez des lieux depuis le catalogue : ils s'afficheront ici en surbrillance, reliés par un trajet.</p>
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

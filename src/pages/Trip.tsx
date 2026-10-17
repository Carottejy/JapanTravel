import { Link } from "react-router-dom";
import { VILLES, ZONE_COLOR, spritePos, spriteUrl, villeKanji, type Place } from "../data/catalogue";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import { must } from "../components/PlaceCard";

const pad = (n: number) => String(n).padStart(2, "0");

export default function Trip() {
  const { session, loading: authLoading } = useAuth();
  const { ordered, remove, move, loading } = useTrip();

  if (!authLoading && !session)
    return (
      <div className="page narrow">
        <h1>Mes lieux <span lang="ja" className="jp-sub">行き先</span></h1>
        <p>Connectez-vous pour choisir vos lieux et les retrouver sur tous vos appareils.</p>
        <Link to="/connexion" className="btn">Se connecter</Link>
      </div>
    );

  const groups: { v: number; places: { p: Place; n: number }[] }[] = [];
  ordered.forEach((p, i) => {
    const last = groups[groups.length - 1];
    if (last && last.v === p.ville) last.places.push({ p, n: i + 1 });
    else groups.push({ v: p.ville, places: [{ p, n: i + 1 }] });
  });
  const toBook = ordered.filter((p) => must(p.resa));

  return (
    <div className="page">
      <div className="page-head">
        <h1>Mes lieux <span lang="ja" className="jp-sub">行き先</span></h1>
        <p className="muted">
          {loading ? "Chargement…" : ordered.length
            ? `${ordered.length} arrêt${ordered.length > 1 ? "s" : ""} dans ${groups.length} ville${groups.length > 1 ? "s" : ""}, d'est en ouest. Dans une ville, changez l'ordre avec les flèches.`
            : "Aucun arrêt pour l'instant : choisissez vos lieux dans le catalogue."}
        </p>
        <div className="row">
          {ordered.length > 0 && <Link to="/" className="btn">Voir le trajet sur la carte</Link>}
          <Link to="/catalogue?nouveaux=1" className={ordered.length ? "btn ghost" : "btn"}>Ajouter des lieux</Link>
        </div>
      </div>

      {toBook.length > 0 && (
        <section className="tobook" aria-labelledby="tobook-h">
          <h2 id="tobook-h"><span lang="ja" aria-hidden="true">予約</span> À réserver à l'avance</h2>
          <ul>{toBook.map((p) => <li key={p.id}><strong>{p.nom}</strong> : {p.resa}</li>)}</ul>
        </section>
      )}

      {groups.map(({ v, places }) => (
        <section key={v} className="city" aria-labelledby={"tv-" + v}>
          <div className="city-head">
            <span className="city-jp" lang="ja" aria-hidden="true">{villeKanji(v)}</span>
            <div>
              <h2 id={"tv-" + v}>{VILLES[v].nom}</h2>
              <span className="muted small">{places.length} arrêt{places.length > 1 ? "s" : ""}</span>
            </div>
          </div>
          <ol className="stops">
            {places.map(({ p, n }, k) => {
              const prev = ordered[n - 2], next = ordered[n];
              return (
                <li key={p.id} className="stop" style={{ ["--zone" as string]: ZONE_COLOR[p.zone] }}>
                  {/* Panneau de gare façon JR : nom, bande de couleur de la ligne, arrêts voisins */}
                  <div className="eki">
                    <div className="eki-body">
                      <div className="thumb" style={{ backgroundImage: `url("${spriteUrl(p.id)}")`, backgroundPosition: spritePos(0) }} />
                      <div className="eki-name">
                        <span className="eki-city" lang="ja">{villeKanji(p.ville)}</span>
                        <h3>{p.nom}</h3>
                        <span className="muted small">{p.lieu}</span>
                      </div>
                    </div>
                    <div className="eki-band">
                      <span className="eki-prev">{prev ? `← ${prev.nom}` : "Départ"}</span>
                      <span className="eki-num" aria-label={`Arrêt ${n}`}>{pad(n)}</span>
                      <span className="eki-next">{next ? `${next.nom} →` : "Terminus"}</span>
                    </div>
                  </div>
                  <dl className="stub compact">
                    <div><dt><span lang="ja">時間</span> Visite</dt><dd>{p.duree}</dd></div>
                    <div><dt><span lang="ja">料金</span> Entrée</dt><dd>{p.prix}</dd></div>
                    {must(p.resa) && <div className="must"><dt><span lang="ja">予約</span> Réservation</dt><dd>{p.resa}</dd></div>}
                  </dl>
                  <div className="stop-actions">
                    <button className="icon" onClick={() => move(p.id, -1)} disabled={k === 0} aria-label={`Monter ${p.nom}`}>↑</button>
                    <button className="icon" onClick={() => move(p.id, 1)} disabled={k === places.length - 1} aria-label={`Descendre ${p.nom}`}>↓</button>
                    <Link className="btn ghost sm" to={`/?focus=${p.id}`}>Sur la carte</Link>
                    <button className="btn ghost sm danger" onClick={() => remove(p.id)}>Retirer</button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

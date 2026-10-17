import { useState } from "react";
import { Link } from "react-router-dom";
import { VILLES, ZONE_COLOR, spritePos, spriteUrl, villeKanji, type Place } from "../data/catalogue";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import PlaceCard, { must } from "../components/PlaceCard";

const pad = (n: number) => String(n).padStart(2, "0");

// Villes repliées : mémorisées dans ce navigateur (simple confort, sans conséquence si indisponible).
const KEY = "jt-villes-repliees";
const loadFolded = (): number[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
const saveFolded = (v: number[]) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignoré */ } };

export default function Trip() {
  const { session, loading: authLoading } = useAuth();
  const { ordered, remove, move, loading } = useTrip();
  const [folded, setFolded] = useState<number[]>(loadFolded);
  const [open, setOpen] = useState<string[]>([]);
  const setF = (v: number[]) => { setFolded(v); saveFolded(v); };
  const toggleCity = (v: number) => setF(folded.includes(v) ? folded.filter((x) => x !== v) : [...folded, v]);
  const toggleDetail = (id: string) => setOpen(open.includes(id) ? open.filter((x) => x !== id) : [...open, id]);

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
          {groups.length > 1 && (
            folded.length >= groups.length
              ? <button className="btn ghost" onClick={() => setF([])}>Tout déplier</button>
              : <button className="btn ghost" onClick={() => setF(groups.map((g) => g.v))}>Tout replier</button>
          )}
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
          <h2 className="city-h"><button className="city-head city-toggle" aria-label={`${VILLES[v].nom}, ${places.length} arrêt${places.length > 1 ? "s" : ""}`} aria-expanded={!folded.includes(v)} aria-controls={"stops-" + v}
            onClick={() => toggleCity(v)}>
            <span className="city-jp" lang="ja" aria-hidden="true">{villeKanji(v)}</span>
            <span className="city-txt">
              <span className="city-name" id={"tv-" + v}>{VILLES[v].nom}</span>
              <span className="muted small">
                {places.length} arrêt{places.length > 1 ? "s" : ""}
                {folded.includes(v) ? ` : ${places.map((x) => x.p.nom).join(", ")}` : ""}
              </span>
            </span>
            <span className="chev" aria-hidden="true">{folded.includes(v) ? "▾" : "▴"}</span>
          </button></h2>
          {!folded.includes(v) && <ol className="stops" id={"stops-" + v}>
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
                  {open.includes(p.id) ? <PlaceCard p={p} embedded /> : <dl className="stub compact">
                    <div><dt><span lang="ja">時間</span> Visite</dt><dd>{p.duree}</dd></div>
                    <div><dt><span lang="ja">料金</span> Entrée</dt><dd>{p.prix}</dd></div>
                    {must(p.resa) && <div className="must"><dt><span lang="ja">予約</span> Réservation</dt><dd>{p.resa}</dd></div>}
                  </dl>}
                  <div className="stop-actions">
                    <button className="btn sm detail-btn" aria-expanded={open.includes(p.id)} onClick={() => toggleDetail(p.id)}>
                      {open.includes(p.id) ? "Masquer le détail ▴" : "Voir le détail ▾"}
                    </button>
                    <button className="icon" onClick={() => move(p.id, -1)} disabled={k === 0} aria-label={`Monter ${p.nom}`}>↑</button>
                    <button className="icon" onClick={() => move(p.id, 1)} disabled={k === places.length - 1} aria-label={`Descendre ${p.nom}`}>↓</button>
                    <Link className="btn ghost sm" to={`/?focus=${p.id}`}>Sur la carte</Link>
                    <button className="btn ghost sm danger" onClick={() => remove(p.id)}>Retirer</button>
                  </div>
                </li>
              );
            })}
          </ol>}
        </section>
      ))}
    </div>
  );
}

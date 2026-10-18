import { Link } from "react-router-dom";
import { CAT_LABEL, ZONE_COLOR, type Category, type Place } from "../data/catalogue";
import Photos from "./Photos";
import AddButton from "./AddButton";

const yt = (q: string) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q + " Japan");
const ta = (q: string) => "https://www.tripadvisor.com/Search?q=" + encodeURIComponent(q);
export const must = (s: string) => /^(Indispensable|Oui)/.test(s);
/** Sceau (hanko) de la catégorie : lieu célèbre, coin caché, expérience */
export const SEAL: Record<Category, string> = { classique: "名所", hors: "穴場", activite: "体験" };

/** embedded : affichée dans Mes lieux (sans identifiant d'ancre ni bouton d'ajout, déjà gérés par la page). */
export default function PlaceCard({ p, embedded = false }: { p: Place; embedded?: boolean }) {
  const gm = `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`;
  return (
    <article className={"card" + (embedded ? " embedded" : "")} id={embedded ? undefined : "lieu-" + p.id} style={{ ["--zone" as string]: ZONE_COLOR[p.zone] }}>
      <Photos place={p} />
      <div className="card-main">
        <div className="card-head">
          <div>
            <h3>{p.nom}</h3>
            <p className="meta">{p.lieu}</p>
          </div>
          <span className={"seal " + (p.custom ? "perso" : p.cat)} title={p.custom ? "Fiche perso" : CAT_LABEL[p.cat]}>
            <span lang="ja" aria-hidden="true">{p.custom ? "手作" : SEAL[p.cat]}</span>
            <span className="seal-fr">{p.custom ? `Fiche perso · ${CAT_LABEL[p.cat]}` : CAT_LABEL[p.cat]}</span>
          </span>
        </div>
        <p className="desc">{p.desc}</p>
        {p.note && <p className="note">{p.note}</p>}
        <dl className="stub">
          <div><dt><span lang="ja">時間</span> Visite</dt><dd>{p.duree}</dd></div>
          <div><dt><span lang="ja">料金</span> Entrée</dt><dd>{p.prix}</dd></div>
          <div className={must(p.resa) ? "must" : ""}><dt><span lang="ja">予約</span> Réservation</dt><dd>{p.resa}</dd></div>
        </dl>
        {p.custom ? (p.lien ? <a className="small" href={p.lien} target="_blank" rel="noopener">Lien : {p.lien.replace(/^https?:\/\//, "").slice(0, 60)} ↗</a> : null) : <details className="more">
          <summary>Vidéos et avis de voyageurs</summary>
          <div className="media">
            <div>
              <h4>Vidéos</h4>
              {p.videos.length ? (
                <ul className="vid">
                  {p.videos.map((v) => <li key={v.url}><a href={v.url} target="_blank" rel="noopener">{v.titre}</a></li>)}
                </ul>
              ) : (
                <a href={yt(p.q)} target="_blank" rel="noopener">Rechercher sur YouTube ↗</a>
              )}
            </div>
            <div>
              <h4>Avis de voyageurs</h4>
              {p.avis.length > 0 && (
                <ul className="rev">
                  {p.avis.map((a) => (
                    <li key={a.url}>
                      <a href={a.url} target="_blank" rel="noopener">« {a.fr} »</a>
                      {a.fr !== a.en && <span className="en">{a.en}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {p.ta ? (
                <a className="small" href={p.ta} target="_blank" rel="noopener">Tous les avis sur Tripadvisor{p.taNom ? ` (${p.taNom})` : ""} ↗</a>
              ) : (
                <a href={ta(p.q)} target="_blank" rel="noopener">Rechercher sur Tripadvisor ↗</a>
              )}
            </div>
          </div>
        </details>}
        <div className="actions">
          {!embedded && <AddButton id={p.id} />}
          <a className="btn ghost" href={gm} target="_blank" rel="noopener">Google Maps ↗</a>
          {p.custom && <Link className="btn ghost" to={`/fiche/${p.id}`}>Modifier</Link>}
        </div>
      </div>
    </article>
  );
}

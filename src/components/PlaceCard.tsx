import { CAT_LABEL, VILLES, ZONE_COLOR, type Place } from "../data/catalogue";
import Photos from "./Photos";
import AddButton from "./AddButton";

const yt = (q: string) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q + " Japan");
const ta = (q: string) => "https://www.tripadvisor.com/Search?q=" + encodeURIComponent(q);
const must = (s: string) => /^(Indispensable|Oui)/.test(s);

export default function PlaceCard({ p }: { p: Place }) {
  const gm = `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`;
  return (
    <article className="card" id={"lieu-" + p.id}>
      <div className="card-main">
        <div className="card-head">
          <span className={"cat " + p.cat}>{CAT_LABEL[p.cat]}</span>
          <h3>{p.nom}</h3>
          <p className="meta">
            <span className="dot" style={{ background: ZONE_COLOR[p.zone] }} />
            {p.lieu}
          </p>
        </div>
        <p className="desc">{p.desc}</p>
        {p.note && <p className="note">{p.note}</p>}
        <dl className="prat">
          <div><dt>Visite conseillée</dt><dd>{p.duree}</dd></div>
          <div><dt>Entrée</dt><dd>{p.prix}</dd></div>
          <div className={must(p.resa) ? "must" : ""}><dt>Réservation</dt><dd>{p.resa}</dd></div>
        </dl>
        <details className="more">
          <summary>Vidéos et avis de voyageurs</summary>
          <div className="media">
            <div>
              <h4>Vidéos</h4>
              {p.videos.length ? (
                <ul className="vid">
                  {p.videos.map((v) => (
                    <li key={v.url}><a href={v.url} target="_blank" rel="noopener">{v.titre}</a></li>
                  ))}
                </ul>
              ) : (
                <a href={yt(p.q)} target="_blank" rel="noopener">Rechercher des vidéos sur YouTube ↗</a>
              )}
            </div>
            <div>
              <h4>Avis de voyageurs</h4>
              {p.avis.length ? (
                <ul className="rev">
                  {p.avis.map((a) => (
                    <li key={a.url}>
                      <a href={a.url} target="_blank" rel="noopener">« {a.fr} »</a>
                      {a.fr !== a.en && <span className="en">{a.en}</span>}
                    </li>
                  ))}
                </ul>
              ) : null}
              {p.ta ? (
                <a className="small" href={p.ta} target="_blank" rel="noopener">
                  Tous les avis sur Tripadvisor{p.taNom ? ` (${p.taNom})` : ""} ↗
                </a>
              ) : (
                <a href={ta(p.q)} target="_blank" rel="noopener">Rechercher des avis sur Tripadvisor ↗</a>
              )}
            </div>
          </div>
        </details>
        <div className="actions">
          <AddButton id={p.id} />
          <a className="btn ghost" href={gm} target="_blank" rel="noopener">Google Maps ↗</a>
          <span className="sr-only">{VILLES[p.ville].nom}</span>
        </div>
      </div>
      <Photos place={p} />
    </article>
  );
}

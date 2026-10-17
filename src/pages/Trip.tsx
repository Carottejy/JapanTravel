import { Link } from "react-router-dom";
import { VILLES, ZONE_COLOR, spritePos, spriteUrl, type Place } from "../data/catalogue";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";

const must = (s: string) => /^(Indispensable|Oui)/.test(s);

export default function Trip() {
  const { session, loading: authLoading } = useAuth();
  const { ordered, remove, move, loading } = useTrip();

  if (!authLoading && !session)
    return (
      <div className="page narrow">
        <h1>Mon voyage</h1>
        <p>Connectez-vous pour composer votre voyage et le retrouver sur tous vos appareils.</p>
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
        <h1>Mon voyage</h1>
        <p className="muted">
          {loading ? "Chargement…" : ordered.length
            ? `${ordered.length} lieu${ordered.length > 1 ? "x" : ""} dans ${groups.length} ville${groups.length > 1 ? "s" : ""}. Les étapes suivent l'ordre des villes d'est en ouest ; dans chaque ville, réordonnez avec les flèches.`
            : "Votre voyage est vide pour l'instant."}
        </p>
        <div className="row">
          <Link to="/" className="btn">Voir le trajet sur la carte</Link>
          <Link to="/catalogue?nouveaux=1" className="btn ghost">Ajouter des lieux</Link>
        </div>
      </div>

      {toBook.length > 0 && (
        <section className="tobook" aria-labelledby="tobook-h">
          <h2 id="tobook-h">À réserver à l'avance</h2>
          <ul>
            {toBook.map((p) => (
              <li key={p.id}><strong>{p.nom}</strong> — {p.resa}</li>
            ))}
          </ul>
        </section>
      )}

      {groups.map(({ v, places }) => (
        <section key={v} className="city" aria-labelledby={"tv-" + v}>
          <div className="city-head">
            <h2 id={"tv-" + v}>{VILLES[v].nom}</h2>
            <span className="muted">{places.length} lieu{places.length > 1 ? "x" : ""}</span>
          </div>
          <ol className="stops">
            {places.map(({ p, n }, k) => (
              <li key={p.id} className="stop">
                <span className="n" style={{ background: ZONE_COLOR[p.zone] }}>{n}</span>
                <div className="thumb" style={{ backgroundImage: `url("${spriteUrl(p.id)}")`, backgroundPosition: spritePos(0) }} />
                <div className="stop-body">
                  <h3>{p.nom}</h3>
                  <p className="muted small">{p.lieu}</p>
                  <p className="small">⏱ {p.duree}</p>
                  <p className="small">🎟 {p.prix}</p>
                  {must(p.resa) && <p className="small must">Réservation : {p.resa}</p>}
                </div>
                <div className="stop-actions">
                  <button className="icon" onClick={() => move(p.id, -1)} disabled={k === 0} aria-label={`Monter ${p.nom}`}>↑</button>
                  <button className="icon" onClick={() => move(p.id, 1)} disabled={k === places.length - 1} aria-label={`Descendre ${p.nom}`}>↓</button>
                  <Link className="btn ghost sm" to={`/?focus=${p.id}`}>Sur la carte</Link>
                  <button className="btn ghost sm danger" onClick={() => remove(p.id)}>Retirer</button>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

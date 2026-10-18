import { useState } from "react";
import { Link } from "react-router-dom";
import { VILLES, ZONE_COLOR, villeKanji, type Place } from "../data/catalogue";
import { useCatalog } from "../state/catalog";
import Thumb from "../components/Thumb";
import NoteBox from "../components/NoteBox";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import { dayLabel, usePlan } from "../state/plan";
import PlaceCard, { must } from "../components/PlaceCard";

// Villes repliées : mémorisées dans ce navigateur (simple confort, sans conséquence si indisponible).
const KEY = "jt-villes-repliees";
const loadFolded = (): number[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
const saveFolded = (v: number[]) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignoré */ } };

/** Mes lieux : la liste des lieux retenus, rangés par ville (sans ordre de visite : il se règle dans Voyage). */
export default function Trip() {
  const { session, loading: authLoading } = useAuth();
  const { items, remove, loading } = useTrip();
  const { days, daysOf, removePlaceEverywhere } = usePlan();
  const { byId, rank: RANK } = useCatalog();
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

  const places = items.map((i) => byId[i.place_id]).filter(Boolean).sort((a, b) => a.ville - b.ville || RANK[a.id] - RANK[b.id]);
  const groups: { v: number; places: Place[] }[] = [];
  places.forEach((p) => {
    const last = groups[groups.length - 1];
    if (last && last.v === p.ville) last.places.push(p);
    else groups.push({ v: p.ville, places: [p] });
  });
  const toBook = places.filter((p) => must(p.resa));
  const planned = (id: string) => daysOf(id).map((d) => `jour ${days.indexOf(d) + 1} (${dayLabel(d, { weekday: "short", day: "numeric", month: "short" })})`).filter((s) => !s.startsWith("jour 0"));

  return (
    <div className="page">
      <div className="page-head">
        <h1>Mes lieux <span lang="ja" className="jp-sub">行き先</span></h1>
        <p className="muted">
          {loading ? "Chargement…" : places.length
            ? `${places.length} lieu${places.length > 1 ? "x" : ""} dans ${groups.length} ville${groups.length > 1 ? "s" : ""}. Placez-les ensuite jour par jour dans l'onglet Voyage.`
            : "Aucun lieu pour l'instant : choisissez-les dans le catalogue."}
        </p>
        <div className="row">
          {places.length > 0 && <Link to="/voyage" className="btn">Organiser le voyage</Link>}
          <Link to="/catalogue?nouveaux=1" className={places.length ? "btn ghost" : "btn"}>Ajouter des lieux</Link>
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
          <h2 className="city-h"><button className="city-head city-toggle" aria-label={`${VILLES[v].nom}, ${places.length} lieu${places.length > 1 ? "x" : ""}`}
            aria-expanded={!folded.includes(v)} aria-controls={"stops-" + v} onClick={() => toggleCity(v)}>
            <span className="city-jp" lang="ja" aria-hidden="true">{villeKanji(v)}</span>
            <span className="city-txt">
              <span className="city-name" id={"tv-" + v}>{VILLES[v].nom}</span>
              <span className="muted small">
                {places.length} lieu{places.length > 1 ? "x" : ""}
                {folded.includes(v) ? ` : ${places.map((x) => x.nom).join(", ")}` : ""}
              </span>
            </span>
            <span className="chev" aria-hidden="true">{folded.includes(v) ? "▾" : "▴"}</span>
          </button></h2>
          {!folded.includes(v) && <ul className="stops" id={"stops-" + v}>
            {places.map((p) => {
              const plan = planned(p.id);
              return (
                <li key={p.id} className="stop" style={{ ["--zone" as string]: ZONE_COLOR[p.zone] }}>
                  {/* Panneau de gare façon JR : nom du lieu, bande de couleur de la ligne */}
                  <div className="eki">
                    <div className="eki-body">
                      <Thumb p={p} />
                      <div className="eki-name">
                        <span className="eki-city" lang="ja">{villeKanji(p.ville)}</span>
                        <h3>{p.nom}</h3>
                        <span className="muted small">{p.lieu}</span>
                      </div>
                    </div>
                    <div className={"eki-band plan" + (plan.length ? "" : " none")}>
                      <span>{plan.length ? `Prévu : ${plan.join(", ")}` : "Pas encore placé dans le voyage"}</span>
                    </div>
                  </div>
                  {open.includes(p.id) ? <PlaceCard p={p} embedded /> : (
                    <dl className="stub compact">
                      <div><dt><span lang="ja">時間</span> Visite</dt><dd>{p.duree}</dd></div>
                      <div><dt><span lang="ja">料金</span> Entrée</dt><dd>{p.prix}</dd></div>
                      {must(p.resa) && <div className="must"><dt><span lang="ja">予約</span> Réservation</dt><dd>{p.resa}</dd></div>}
                    </dl>
                  )}
                  <NoteBox placeId={p.id} />
                  <div className="stop-actions">
                    <button className="btn sm detail-btn" aria-expanded={open.includes(p.id)} onClick={() => toggleDetail(p.id)}>
                      {open.includes(p.id) ? "Masquer le détail ▴" : "Voir le détail ▾"}
                    </button>
                    <button className="btn ghost sm danger" onClick={() => { remove(p.id); removePlaceEverywhere(p.id); }}>Retirer de mes lieux</button>
                  </div>
                </li>
              );
            })}
          </ul>}
        </section>
      ))}
    </div>
  );
}

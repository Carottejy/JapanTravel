import { useState } from "react";
import { Link } from "react-router-dom";
import { USAGE_KANJI, USAGE_LABEL, VILLES, ZONE_COLOR, villeKanji, type Place, type Usage } from "../data/catalogue";
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
  const { voyage, days, nights, daysOf, nightsOf, addToDay, removePlaceEverywhere } = usePlan();
  const [usage, setUsage] = useState<Usage | "all">("all");
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

  const all = items.map((i) => byId[i.place_id]).filter(Boolean).sort((a, b) => a.ville - b.ville || RANK[a.id] - RANK[b.id]);
  const counts = { all: all.length, visiter: 0, manger: 0, dormir: 0 } as Record<Usage | "all", number>;
  all.forEach((p) => counts[p.usage]++);
  const places = usage === "all" ? all : all.filter((p) => p.usage === usage);
  const groups: { v: number; places: Place[] }[] = [];
  places.forEach((p) => {
    const last = groups[groups.length - 1];
    if (last && last.v === p.ville) last.places.push(p);
    else groups.push({ v: p.ville, places: [p] });
  });
  const toBook = places.filter((p) => must(p.resa));
  const short = (d: string) => dayLabel(d, { weekday: "short", day: "numeric", month: "short" });
  const planned = (id: string) => [
    ...daysOf(id).filter((d) => days.includes(d)).map((d) => `jour ${days.indexOf(d) + 1} (${short(d)})`),
    ...nightsOf(id).filter((d) => nights.includes(d)).map((d) => `nuit du ${short(d)}`),
  ];

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

      {all.length > 0 && (
        <div className="chips usage-chips" role="group" aria-label="Type de lieu">
          {(["all", "visiter", "manger", "dormir"] as const).map((u) => (
            <button key={u} className="chip" aria-pressed={usage === u} onClick={() => setUsage(u)}>
              {u === "all" ? "Tous" : <><span lang="ja">{USAGE_KANJI[u]}</span> {USAGE_LABEL[u]}</>} <span className="dot-num">{counts[u]}</span>
            </button>
          ))}
        </div>
      )}

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
                  {voyage ? (
                    <label className="assign">
                      <span className="sr-only">Placer {p.nom} dans le voyage</span>
                      {p.usage === "dormir" ? (
                        <select value="" onChange={(ev) => ev.target.value && addToDay(ev.target.value, p.id, "nuit")}>
                          <option value="">泊 Dormir ici la nuit du…</option>
                          {nights.map((d, k) => !nightsOf(p.id).includes(d) && <option key={d} value={d}>Nuit {k + 1} : {short(d)} → {short(days[k + 1])}</option>)}
                        </select>
                      ) : (
                        <select value="" onChange={(ev) => ev.target.value && addToDay(ev.target.value, p.id)}>
                          <option value="">旅 Placer dans le voyage : jour…</option>
                          {days.map((d, k) => !daysOf(p.id).includes(d) && <option key={d} value={d}>Jour {k + 1} : {short(d)}</option>)}
                        </select>
                      )}
                    </label>
                  ) : (
                    <Link className="small" to="/voyage">Définir les dates du voyage pour placer ce lieu</Link>
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

import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PLACES, VILLES, ZONE_COLOR, spritePos, spriteUrl, villeKanji, type Place } from "../data/catalogue";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import { dayLabel, usePlan } from "../state/plan";

const RANK = Object.fromEntries(PLACES.map((p, i) => [p.id, i]));
const pad = (n: number) => String(n).padStart(2, "0");

/** Voyage : dates de départ et de retour, puis les lieux de « Mes lieux » placés jour par jour. */
export default function Voyage() {
  const { session, loading: authLoading } = useAuth();
  const { items } = useTrip();
  const { voyage, etapes, days, route, saveDates, addToDay, removeEtape, moveEtape, daysOf, loading } = usePlan();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [editDates, setEditDates] = useState(false);

  useEffect(() => {
    if (voyage) { setStart(voyage.start_date); setEnd(voyage.end_date); }
  }, [voyage]);

  if (!authLoading && !session)
    return (
      <div className="page narrow">
        <h1>Voyage <span lang="ja" className="jp-sub">旅程</span></h1>
        <p>Connectez-vous pour organiser votre voyage jour par jour.</p>
        <Link to="/connexion" className="btn">Se connecter</Link>
      </div>
    );

  const mine: Place[] = items.map((i) => PLACES[RANK[i.place_id]]).filter(Boolean).sort((a, b) => a.ville - b.ville || RANK[a.id] - RANK[b.id]);
  const unplanned = mine.filter((p) => daysOf(p.id).filter((d) => days.includes(d)).length === 0);
  const byVille = mine.reduce<Record<number, Place[]>>((m, p) => ((m[p.ville] ??= []).push(p), m), {});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = await saveDates(start, end);
    setMsg(err ? { ok: false, t: err } : { ok: true, t: "Dates enregistrées." });
    if (!err) setEditDates(false);
  };
  const nbDays = days.length;
  const showForm = !voyage || editDates;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Voyage <span lang="ja" className="jp-sub">旅程</span></h1>
        {voyage && !editDates ? (
          <div className="dates-sum">
            <p>
              <strong>{nbDays} jour{nbDays > 1 ? "s" : ""}</strong>, du {dayLabel(voyage.start_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {" "}au {dayLabel(voyage.end_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.
            </p>
            <div className="row">
              <button className="btn ghost sm" onClick={() => { setEditDates(true); setMsg(null); }}>Modifier les dates</button>
              {route.length > 0 && <Link to="/" className="btn sm">Voir le trajet sur la carte</Link>}
            </div>
          </div>
        ) : (
          <p className="muted">Indiquez vos dates, puis placez chaque jour les lieux de votre liste « Mes lieux » : ils formeront le trajet de la carte.</p>
        )}
      </div>

      {showForm && (
        <form className="dates" onSubmit={submit}>
          <label>Départ<input type="date" required value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label>Retour<input type="date" required value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} /></label>
          <div className="row">
            <button className="btn">Enregistrer les dates</button>
            {voyage && <button type="button" className="btn ghost" onClick={() => { setEditDates(false); setStart(voyage.start_date); setEnd(voyage.end_date); }}>Annuler</button>}
          </div>
        </form>
      )}
      {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.t}</p>}

      {voyage && mine.length === 0 && !loading && (
        <p className="empty">Votre liste « Mes lieux » est vide. <Link to="/catalogue">Choisissez des lieux dans le catalogue</Link>, puis revenez les placer ici.</p>
      )}

      {voyage && mine.length > 0 && (
        <>
          {unplanned.length > 0 && (
            <section className="unplanned" aria-labelledby="unp-h">
              <h2 id="unp-h">Pas encore placés <span className="dot-num">{unplanned.length}</span></h2>
              <p className="muted small">{unplanned.map((p) => p.nom).join(", ")}</p>
            </section>
          )}

          <nav className="daybar" aria-label="Aller à un jour">
            {days.map((d, i) => {
              const c = etapes.filter((e) => e.day === d).length;
              return (
                <button key={d} className={"daypill" + (c ? " has" : "")} onClick={() => document.getElementById("jour-" + d)?.scrollIntoView({ block: "start" })}>
                  <span className="dot-num">J{i + 1}</span>
                  <span className="small">{dayLabel(d, { day: "numeric", month: "short" })}</span>
                </button>
              );
            })}
          </nav>

          <ol className="days">
            {days.map((d, i) => {
              const today = route.filter((s) => s.day === d);
              const ids = new Set(today.map((s) => s.p.id));
              return (
                <li key={d} id={"jour-" + d} className="day">
                  <div className="day-head">
                    <span className="day-n dot-num">J{pad(i + 1)}</span>
                    <div>
                      <h2>{dayLabel(d)}</h2>
                      <span className="muted small">{today.length ? `${today.length} lieu${today.length > 1 ? "x" : ""}` : "Journée libre"}</span>
                    </div>
                  </div>
                  {today.length > 0 && (
                    <ol className="day-stops">
                      {today.map((s, k) => {
                        const e = etapes.find((x) => x.day === d && x.place_id === s.p.id)!;
                        return (
                          <li key={s.p.id} className="day-stop" style={{ ["--zone" as string]: ZONE_COLOR[s.p.zone] }}>
                            <span className="n" style={{ background: ZONE_COLOR[s.p.zone] }}>{s.n}</span>
                            <div className="thumb sm" style={{ backgroundImage: `url("${spriteUrl(s.p.id)}")`, backgroundPosition: spritePos(0) }} />
                            <div className="day-stop-txt">
                              <strong>{s.p.nom}</strong>
                              <span className="muted small"><span lang="ja">{villeKanji(s.p.ville)}</span> {VILLES[s.p.ville].nom} · ⏱ {s.p.duree}</span>
                            </div>
                            <div className="day-stop-act">
                              <button className="icon" onClick={() => moveEtape(e.id, -1)} disabled={k === 0} aria-label={`Monter ${s.p.nom}`}>↑</button>
                              <button className="icon" onClick={() => moveEtape(e.id, 1)} disabled={k === today.length - 1} aria-label={`Descendre ${s.p.nom}`}>↓</button>
                              <button className="icon" onClick={() => removeEtape(e.id)} aria-label={`Retirer ${s.p.nom} de ce jour`}>✕</button>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  <label className="day-add">
                    <span className="sr-only">Ajouter un lieu au jour {i + 1}</span>
                    <select value="" onChange={(ev) => ev.target.value && addToDay(d, ev.target.value)}>
                      <option value="">+ Ajouter un lieu à ce jour…</option>
                      {Object.entries(byVille).map(([v, ps]) => (
                        <optgroup key={v} label={VILLES[+v].nom}>
                          {ps.filter((p) => !ids.has(p.id)).map((p) => {
                            const other = daysOf(p.id).filter((x) => days.includes(x)).map((x) => "J" + (days.indexOf(x) + 1));
                            return <option key={p.id} value={p.id}>{p.nom}{other.length ? ` (déjà ${other.join(", ")})` : ""}</option>;
                          })}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}

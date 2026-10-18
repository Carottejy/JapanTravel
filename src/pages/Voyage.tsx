import { Fragment, useEffect, useRef, useState, type FormEvent, type PointerEvent as RPointerEvent } from "react";
import { Link } from "react-router-dom";
import { VILLES, ZONE_COLOR, villeKanji, type Place } from "../data/catalogue";
import { useCatalog } from "../state/catalog";
import Thumb from "../components/Thumb";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import { dayLabel, usePlan } from "../state/plan";

const pad = (n: number) => String(n).padStart(2, "0");

/** Voyage : dates de départ et de retour, puis les lieux de « Mes lieux » placés jour par jour. */
export default function Voyage() {
  const { session, loading: authLoading } = useAuth();
  const { items, noteOf } = useTrip();
  const { byId, rank: RANK } = useCatalog();
  const { voyage, etapes, days, route, saveDates, addToDay, removeEtape, moveEtape, moveToDay, daysOf, loading } = usePlan();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [editDates, setEditDates] = useState(false);

  // ── Glisser-déposer d'un lieu d'un jour à l'autre (souris et doigt) ──
  type Drag = { id: string; label: string; x: number; y: number; day: string | null; index: number };
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  dragRef.current = drag;
  const moveRef = useRef(moveToDay);
  moveRef.current = moveToDay;
  const startDrag = (ev: RPointerEvent, id: string, label: string) => {
    if (ev.pointerType === "mouse") ev.preventDefault();
    setDrag({ id, label, x: ev.clientX, y: ev.clientY, day: null, index: 0 });
  };
  // Au doigt : empêcher le navigateur de lancer un défilement depuis la poignée (sinon il annule le geste).
  useEffect(() => {
    const stop = (e: TouchEvent) => { if ((e.target as Element | null)?.closest?.(".grip") || dragRef.current) e.preventDefault(); };
    document.addEventListener("touchstart", stop, { passive: false });
    document.addEventListener("touchmove", stop, { passive: false });
    return () => { document.removeEventListener("touchstart", stop); document.removeEventListener("touchmove", stop); };
  }, []);
  const dragId = drag?.id;
  useEffect(() => {
    if (!dragId) return;
    const where = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y)?.closest<HTMLElement>(".day");
      if (!el) return { day: null, index: 0 };
      const stops = [...el.querySelectorAll<HTMLElement>(".day-stop")].filter((s) => s.dataset.id !== dragId);
      return { day: el.dataset.day ?? null, index: stops.filter((s) => { const r = s.getBoundingClientRect(); return r.top + r.height / 2 < y; }).length };
    };
    const move = (e: PointerEvent) => { e.preventDefault(); const w = where(e.clientX, e.clientY); setDrag((d) => d && { ...d, x: e.clientX, y: e.clientY, ...w }); };
    const up = () => { const d = dragRef.current; if (d?.day) moveRef.current(d.id, d.day, d.index); setDrag(null); };
    const cancel = () => setDrag(null);
    const key = (e: KeyboardEvent) => e.key === "Escape" && cancel();
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", key);
    // Défilement automatique près des bords de l'écran
    let raf = 0;
    const tick = () => {
      const d = dragRef.current;
      if (d) { if (d.y < 110) window.scrollBy(0, -12); else if (d.y > window.innerHeight - 150) window.scrollBy(0, 12); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    document.body.classList.add("dragging-on");
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", key);
      cancelAnimationFrame(raf);
      document.body.classList.remove("dragging-on");
    };
  }, [dragId]);

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

  const mine: Place[] = items.map((i) => byId[i.place_id]).filter(Boolean).sort((a, b) => a.ville - b.ville || RANK[a.id] - RANK[b.id]);
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
                <li key={d} id={"jour-" + d} data-day={d} className={"day" + (drag?.day === d ? " drop-target" : "")}>
                  <div className="day-head">
                    <span className="day-n dot-num">J{pad(i + 1)}</span>
                    <div>
                      <h2>{dayLabel(d)}</h2>
                      <span className="muted small">{today.length ? `${today.length} lieu${today.length > 1 ? "x" : ""}` : "Journée libre"}</span>
                    </div>
                  </div>
                  {(today.length > 0 || drag?.day === d) && (
                    <ol className="day-stops">
                      {today.map((s, k) => {
                        const e = etapes.find((x) => x.day === d && x.place_id === s.p.id)!;
                        const before = drag?.day === d && drag.index === today.filter((t) => etapes.find((x) => x.day === d && x.place_id === t.p.id)?.id !== drag.id).indexOf(s);
                        return (
                          <Fragment key={s.p.id}>
                          {before && <li key={"drop-" + s.p.id} className="drop-line" aria-hidden="true" />}
                          <li key={s.p.id} data-id={e.id} className={"day-stop" + (drag?.id === e.id ? " dragging" : "")} style={{ ["--zone" as string]: ZONE_COLOR[s.p.zone] }}>
                            <button className="grip" onPointerDown={(ev) => startDrag(ev, e.id, s.p.nom)} aria-label={`Glisser ${s.p.nom} vers un autre jour`} title="Glisser vers un autre jour">⠿</button>
                            <span className="n" style={{ background: ZONE_COLOR[s.p.zone] }}>{s.n}</span>
                            <Thumb p={s.p} small />
                            <div className="day-stop-txt">
                              <strong>{s.p.nom}</strong>
                              <span className="muted small"><span lang="ja">{villeKanji(s.p.ville)}</span> {VILLES[s.p.ville].nom} · ⏱ {s.p.duree}</span>
                              {noteOf(s.p.id) && <span className="day-note small">✎ {noteOf(s.p.id)}</span>}
                            </div>
                            <div className="day-stop-act">
                              <button className="icon" onClick={() => moveEtape(e.id, -1)} disabled={k === 0} aria-label={`Monter ${s.p.nom}`}>↑</button>
                              <button className="icon" onClick={() => moveEtape(e.id, 1)} disabled={k === today.length - 1} aria-label={`Descendre ${s.p.nom}`}>↓</button>
                              <select className="icon day-move" value="" aria-label={`Déplacer ${s.p.nom} vers un autre jour`} title="Déplacer vers un autre jour"
                                onChange={(ev) => ev.target.value && moveToDay(e.id, ev.target.value, 999)}>
                                <option value="">J…</option>
                                {days.map((dd, j) => dd !== d && <option key={dd} value={dd}>Jour {j + 1} ({dayLabel(dd, { day: "numeric", month: "short" })})</option>)}
                              </select>
                              <button className="icon" onClick={() => removeEtape(e.id)} aria-label={`Retirer ${s.p.nom} de ce jour`}>✕</button>
                            </div>
                          </li>
                          </Fragment>
                        );
                      })}
                      {drag?.day === d && drag.index >= today.filter((t) => etapes.find((x) => x.day === d && x.place_id === t.p.id)?.id !== drag.id).length && (
                        <li className="drop-line" aria-hidden="true" />
                      )}
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
      {drag && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          {drag.label}{drag.day ? ` → J${days.indexOf(drag.day) + 1}` : ""}
        </div>
      )}
    </div>
  );
}

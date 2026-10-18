import { dayLabel, usePlan } from "../state/plan";

const short = (d: string) => dayLabel(d, { day: "numeric", month: "short" });

/** Choix du voyage actif : onglets (page Voyage) ou menu compact (Mes lieux, carte). Rien s'il n'y a qu'un voyage en mode compact. */
export default function VoyageSwitch({ variant = "tabs", onNew }: { variant?: "tabs" | "select"; onNew?: () => void }) {
  const { voyages, voyage, setActive } = usePlan();
  if (variant === "select") {
    if (voyages.length < 2) return null;
    return (
      <label className="vselect">
        <span lang="ja" aria-hidden="true">旅</span>
        <span className="sr-only">Voyage affiché</span>
        <select value={voyage?.id ?? ""} onChange={(e) => setActive(e.target.value)}>
          {voyages.map((v) => <option key={v.id} value={v.id}>{v.nom} ({short(v.start_date)} → {short(v.end_date)})</option>)}
        </select>
      </label>
    );
  }
  return (
    <div className="vtabs" role="tablist" aria-label="Mes voyages">
      {voyages.map((v) => (
        <button key={v.id} role="tab" aria-selected={v.id === voyage?.id} className={"vtab" + (v.id === voyage?.id ? " on" : "")} onClick={() => setActive(v.id)}>
          <strong>{v.nom}</strong>
          <span className="small">{short(v.start_date)} → {short(v.end_date)}</span>
        </button>
      ))}
      {onNew && <button className="vtab add" onClick={onNew}>+ Nouveau voyage</button>}
    </div>
  );
}

import { APP_VERSION, RELEASES } from "../data/releases";
import { PLACES } from "../data/catalogue";
import InstallBox from "../components/InstallBox";

const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function Info() {
  return (
    <div className="page narrow-md">
      <div className="page-head">
        <h1>Info <span lang="ja" className="jp-sub">情報</span></h1>
        <p className="muted">
          Japan Travel, version <span className="dot-num">{APP_VERSION}</span>. Carnet de {PLACES.length} lieux ; photos Wikimedia Commons,
          avis Tripadvisor, contour du Japon Natural Earth. Tarifs relevés en octobre 2026.
        </p>
      </div>
      <InstallBox />
      <section aria-labelledby="rn-h" className="releases">
        <h2 id="rn-h">Notes de version</h2>
        <ol>
          {RELEASES.map((r) => (
            <li key={r.version} className={"rel" + (r.version === APP_VERSION ? " current" : "")}>
              <div className="rel-head">
                <span className="rel-v dot-num">v{r.version}</span>
                <div>
                  <h3>{r.titre}</h3>
                  <span className="muted small">{fmt(r.date)}{r.version === APP_VERSION ? ", version actuelle" : ""}</span>
                </div>
              </div>
              <ul>{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

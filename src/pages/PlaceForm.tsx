import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CAT_LABEL, VILLES, type Category } from "../data/catalogue";
import { useAuth } from "../state/auth";
import { VILLE_CENTRE, parseCoords, useCatalog, type CustomInput } from "../state/catalog";
import { useTrip } from "../state/trip";

/** Créer ou modifier une fiche perso du catalogue. */
export default function PlaceForm() {
  const { id } = useParams();
  const { session } = useAuth();
  const { customRows, create, update, remove } = useCatalog();
  const { add } = useTrip();
  const nav = useNavigate();
  const row = id ? customRows[id] : undefined;
  const [f, setF] = useState<CustomInput>(row ?? { nom: "", cat: "hors", ville: 0, lieu: "", lat: 0, lon: 0, description: "", duree: "", prix: "", resa: "", lien: "" });
  const [pos, setPos] = useState(row ? `${row.lat}, ${row.lon}` : "");
  const [addToMine, setAddToMine] = useState(!row);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!session) return <div className="page narrow"><p>Connectez-vous pour créer vos propres fiches.</p><Link className="btn" to="/connexion">Se connecter</Link></div>;
  if (id && !row) return <div className="page narrow"><p>Fiche introuvable.</p><Link className="btn" to="/catalogue">Retour au catalogue</Link></div>;

  const coords = pos.trim() ? parseCoords(pos) : null;
  const set = <K extends keyof CustomInput>(k: K, v: CustomInput[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pos.trim() && !coords) { setErr("Position non reconnue : collez un lien Google Maps ou des coordonnées comme « 35.0116, 135.7681 »."); return; }
    const [lat, lon] = coords ?? VILLE_CENTRE[f.ville];
    setBusy(true); setErr(null);
    const data = { ...f, nom: f.nom.trim(), lat, lon };
    let newId = id;
    if (row) {
      const e2 = await update(row.id, data);
      if (e2) { setErr(e2); setBusy(false); return; }
    } else {
      const r = await create(data);
      if (r.error) { setErr(r.error); setBusy(false); return; }
      newId = r.id;
      if (addToMine) await add(r.id);
    }
    setBusy(false);
    nav(`/catalogue?lieu=${newId}`);
  };

  return (
    <div className="page narrow-md">
      <div className="page-head">
        <h1>{row ? "Modifier ma fiche" : "Nouvelle fiche"} <span lang="ja" className="jp-sub">手作り</span></h1>
        <p className="muted">Vos fiches s'ajoutent au catalogue, visibles uniquement sur votre compte. Seul le nom et la ville sont obligatoires.</p>
      </div>
      <form className="auth pform" onSubmit={submit}>
        <label>Nom du lieu
          <input required maxLength={120} value={f.nom} onChange={(e) => set("nom", e.target.value)} placeholder="Ex. : Restaurant Kichi Kichi" />
        </label>
        <div className="pform-row">
          <label>Ville
            <select value={f.ville} onChange={(e) => set("ville", +e.target.value)}>
              {VILLES.map((v, i) => <option key={i} value={i}>{v.nom}</option>)}
            </select>
          </label>
          <label>Type
            <select value={f.cat} onChange={(e) => set("cat", e.target.value as Category)}>
              {(Object.keys(CAT_LABEL) as Category[]).map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
            </select>
          </label>
        </div>
        <label>Quartier ou adresse
          <input maxLength={160} value={f.lieu} onChange={(e) => set("lieu", e.target.value)} placeholder="Ex. : Pontochō, Kyoto" />
        </label>
        <label>Position sur la carte
          <input value={pos} onChange={(e) => setPos(e.target.value)} placeholder="Lien Google Maps ou « 35.0116, 135.7681 »" />
          <span className="hint">
            {pos.trim() ? (coords ? `Position reconnue : ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}` : "Position non reconnue.")
              : `Laissez vide pour placer la fiche au centre de ${VILLES[f.ville].nom}. Dans Google Maps : appui long sur le lieu, puis copiez les coordonnées affichées.`}
          </span>
        </label>
        <label>Description
          <textarea rows={4} maxLength={4000} value={f.description} onChange={(e) => set("description", e.target.value)} />
        </label>
        <div className="pform-row">
          <label>Durée de visite<input maxLength={200} value={f.duree} onChange={(e) => set("duree", e.target.value)} placeholder="Ex. : 2 h" /></label>
          <label>Prix d'entrée<input maxLength={300} value={f.prix} onChange={(e) => set("prix", e.target.value)} placeholder="Ex. : 1 000 ¥" /></label>
        </div>
        <label>Réservation<input maxLength={300} value={f.resa} onChange={(e) => set("resa", e.target.value)} placeholder="Ex. : Oui, 1 mois avant" /></label>
        <label>Lien (site, vidéo…)<input type="url" maxLength={600} value={f.lien} onChange={(e) => set("lien", e.target.value)} placeholder="https://" /></label>
        {!row && (
          <label className="switch"><input type="checkbox" checked={addToMine} onChange={(e) => setAddToMine(e.target.checked)} /> Ajouter aussi à mes lieux</label>
        )}
        {err && <p className="err" role="alert">{err}</p>}
        <div className="row">
          <button className="btn" disabled={busy}>{busy ? "Enregistrement…" : row ? "Enregistrer" : "Créer la fiche"}</button>
          <Link className="btn ghost" to="/catalogue">Annuler</Link>
          {row && (
            <button type="button" className="btn ghost danger" onClick={async () => {
              if (!window.confirm("Supprimer cette fiche ? Elle sera aussi retirée de vos lieux et de votre voyage.")) return;
              const e2 = await remove(row.id);
              if (e2) setErr(e2); else nav("/catalogue");
            }}>Supprimer la fiche</button>
          )}
        </div>
      </form>
    </div>
  );
}

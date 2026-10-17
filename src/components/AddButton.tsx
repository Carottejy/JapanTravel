import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";

export default function AddButton({ id, small = false }: { id: string; small?: boolean }) {
  const { session } = useAuth();
  const { has, add, remove } = useTrip();
  const nav = useNavigate();
  const inTrip = has(id);
  if (!session)
    return (
      <button className={"btn ghost" + (small ? " sm" : "")} onClick={() => nav("/connexion")}>
        Se connecter pour ajouter
      </button>
    );
  return inTrip ? (
    <button className={"btn added" + (small ? " sm" : "")} onClick={() => remove(id)} aria-pressed="true" title="Retirer du voyage">
      <span className="lbl-on">✓ Dans mon voyage</span>
      <span className="lbl-off">Retirer</span>
    </button>
  ) : (
    <button className={"btn" + (small ? " sm" : "")} onClick={() => add(id)} aria-pressed="false">
      + Ajouter au voyage
    </button>
  );
}

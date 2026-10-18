import { useAuth } from "../state/auth";
import { useFav } from "../state/fav";

/** Étoile « favori » d'une fiche du catalogue (visible une fois connecté). */
export default function FavButton({ id, nom }: { id: string; nom: string }) {
  const { session } = useAuth();
  const { isFav, toggle } = useFav();
  if (!session) return null;
  const on = isFav(id);
  return (
    <button className={"fav" + (on ? " on" : "")} aria-pressed={on} onClick={() => toggle(id)}
      aria-label={on ? `Retirer ${nom} des favoris` : `Ajouter ${nom} aux favoris`} title={on ? "Retirer des favoris" : "Ajouter aux favoris"}>
      {on ? "★" : "☆"}
    </button>
  );
}

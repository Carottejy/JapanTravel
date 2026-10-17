import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/auth";

/** Page atteinte par le lien « mot de passe oublié » : choisir un nouveau mot de passe. */
export default function Account() {
  const { session } = useAuth();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  if (!session)
    return (
      <div className="page narrow">
        <p>Le lien a expiré ou vous n'êtes pas connecté.</p>
        <Link to="/connexion?mode=oubli" className="btn">Demander un nouveau lien</Link>
      </div>
    );
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setMsg(error ? { ok: false, t: "Échec : " + error.message } : { ok: true, t: "Mot de passe mis à jour." });
  };
  return (
    <div className="page narrow">
      <form className="auth" onSubmit={submit}>
        <h1>Mon compte</h1>
        <p className="muted">{session.user.email}</p>
        <label>
          Nouveau mot de passe
          <input type="password" minLength={6} required autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        {msg && <p className={msg.ok ? "ok" : "err"}>{msg.t}</p>}
        <button className="btn wide">Enregistrer</button>
      </form>
    </div>
  );
}

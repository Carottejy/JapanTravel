import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../state/auth";

type Mode = "connexion" | "inscription" | "oubli";

export default function Login() {
  const { session, signIn, signUp, resetPassword } = useAuth();
  const [params, setParams] = useSearchParams();
  const mode = (params.get("mode") as Mode) || "connexion";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => { setError(null); setInfo(null); }, [mode]);
  if (session) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null); setInfo(null);
    if (mode === "connexion") {
      const err = await signIn(email, password);
      if (err) setError(err);
    } else if (mode === "inscription") {
      const r = await signUp(email, password);
      if (r.error) setError(r.error);
      else if (r.needsConfirmation)
        setInfo("Compte créé. Ouvrez le lien de confirmation envoyé à " + email + ", puis connectez-vous.");
    } else {
      const err = await resetPassword(email);
      if (err) setError(err);
      else setInfo("Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé.");
    }
    setBusy(false);
  };
  const go = (m: Mode) => setParams(m === "connexion" ? {} : { mode: m }, { replace: true });

  return (
    <div className="page narrow">
      <div className="auth kippu-form">
        <div className="kippu-top"><span lang="ja">会員証</span><span className="hanko sm" lang="ja" aria-hidden="true">旅</span></div>
        <div className="seg" role="tablist" aria-label="Connexion ou inscription">
          <button role="tab" aria-selected={mode === "connexion"} onClick={() => go("connexion")}>Se connecter</button>
          <button role="tab" aria-selected={mode === "inscription"} onClick={() => go("inscription")}>Créer un compte</button>
        </div>
        <form onSubmit={submit}>
          <h1>{mode === "connexion" ? "Connexion" : mode === "inscription" ? "Nouveau compte" : "Mot de passe oublié"}</h1>
          <p className="muted small">{mode === "inscription" ? "Vos lieux seront enregistrés sur ce compte et visibles sur tous vos appareils." : mode === "oubli" ? "Indiquez votre adresse : vous recevrez un lien pour choisir un nouveau mot de passe." : "Retrouvez vos lieux et leur carte."}</p>
          <label>
            Adresse e-mail
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {mode !== "oubli" && (
            <label>
              Mot de passe
              <input type="password" required minLength={6}
                autoComplete={mode === "inscription" ? "new-password" : "current-password"}
                value={password} onChange={(e) => setPassword(e.target.value)} />
              {mode === "inscription" && <span className="hint">6 caractères minimum.</span>}
            </label>
          )}
          {error && <p className="err" role="alert">{error}</p>}
          {info && <p className="ok" role="status">{info}</p>}
          <button className="btn wide" disabled={busy}>
            {busy ? "Un instant…" : mode === "connexion" ? "Se connecter" : mode === "inscription" ? "Créer mon compte" : "Envoyer le lien"}
          </button>
          {mode === "connexion" && (
            <button type="button" className="linkish" onClick={() => go("oubli")}>Mot de passe oublié ?</button>
          )}
          {mode === "oubli" && (
            <button type="button" className="linkish" onClick={() => go("connexion")}>← Retour à la connexion</button>
          )}
        </form>
      </div>
    </div>
  );
}

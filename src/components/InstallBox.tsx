import { useEffect, useState } from "react";

/* Aide à l'installation sur téléphone : bouton d'installation quand le navigateur le permet,
   et un petit diagnostic à recopier si ça ne marche pas. */
interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

let deferred: BIPEvent | null = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as BIPEvent; });

export default function InstallBox() {
  const [canPrompt, setCanPrompt] = useState(!!deferred);
  const [msg, setMsg] = useState<string | null>(null);
  const [sw, setSw] = useState("…");
  const standalone = matchMedia("(display-mode: standalone)").matches;
  const ua = navigator.userAgent;
  const browser = /SamsungBrowser/.test(ua) ? "Samsung Internet" : /EdgA/.test(ua) ? "Edge" : /Firefox/.test(ua) ? "Firefox"
    : /; wv\)/.test(ua) ? "Navigateur intégré à une autre appli" : /Chrome\//.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "Autre";

  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); deferred = e as BIPEvent; setCanPrompt(true); };
    window.addEventListener("beforeinstallprompt", on);
    window.addEventListener("appinstalled", () => setMsg("Application installée : elle doit apparaître dans la liste de vos applis."));
    navigator.serviceWorker?.getRegistration().then((r) => setSw(r?.active ? "actif" : "absent")).catch(() => setSw("absent"));
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setMsg(outcome === "accepted" ? "Installation lancée." : "Installation annulée.");
    deferred = null; setCanPrompt(false);
  };

  return (
    <section className="install" aria-labelledby="inst-h">
      <h2 id="inst-h">Installer sur ce téléphone</h2>
      {standalone ? (
        <p>Vous utilisez déjà l'application installée.</p>
      ) : canPrompt ? (
        <button className="btn" onClick={install}>Installer l'application</button>
      ) : (
        <p className="muted small">
          Le bouton d'installation apparaît ici quand le navigateur l'autorise. Ouvrez cette page directement dans Chrome
          (pas depuis une autre application), puis menu ⋮ → « Installer l'application ».
        </p>
      )}
      {msg && <p className="ok">{msg}</p>}
      <p className="diag small muted">
        Diagnostic : {browser} · mode {standalone ? "appli" : "navigateur"} · service worker {sw} · installation proposée {canPrompt ? "oui" : "non"}
      </p>
    </section>
  );
}

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";

export default function Layout() {
  const { session, signOut } = useAuth();
  const { items, error, clearError } = useTrip();
  const nav = useNavigate();
  return (
    <div className="app">
      <header className="top">
        <NavLink to="/" className="brand" aria-label="Japan Travel, accueil">
          <span className="hinomaru" aria-hidden="true" />
          Japan Travel
        </NavLink>
        <nav className="tabs" aria-label="Navigation principale">
          <NavLink to="/" end>Carte</NavLink>
          <NavLink to="/catalogue">Catalogue</NavLink>
          <NavLink to="/voyage">
            Mon voyage{session && items.length > 0 && <span className="count">{items.length}</span>}
          </NavLink>
        </nav>
        <div className="account">
          {session ? (
            <>
              <span className="who" title={session.user.email}>{session.user.email}</span>
              <button className="btn ghost sm" onClick={async () => { await signOut(); nav("/"); }}>
                Se déconnecter
              </button>
            </>
          ) : (
            <NavLink to="/connexion" className="btn sm">Se connecter</NavLink>
          )}
        </div>
      </header>
      {error && (
        <div className="toast" role="alert">
          {error}
          <button onClick={clearError} aria-label="Fermer le message">✕</button>
        </div>
      )}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

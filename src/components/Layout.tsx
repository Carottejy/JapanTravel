import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { useTrip } from "../state/trip";
import { IconLantern, IconMap, IconScroll, IconTicket, IconUser } from "./Icons";

export default function Layout() {
  const { session, signOut } = useAuth();
  const { items, error, clearError } = useTrip();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);

  const tabs = (
    <>
      <NavLink to="/" end><IconMap /><span className="t-fr">Carte</span><span className="t-jp" lang="ja">地図</span></NavLink>
      <NavLink to="/catalogue"><IconScroll /><span className="t-fr">Catalogue</span><span className="t-jp" lang="ja">目録</span></NavLink>
      <NavLink to="/voyage">
        <span className="ico-wrap"><IconTicket />{session && items.length > 0 && <span className="count">{items.length}</span>}</span>
        <span className="t-fr">Mon voyage</span><span className="t-jp" lang="ja">旅程</span>
      </NavLink>
      <NavLink to="/info"><IconLantern /><span className="t-fr">Info</span><span className="t-jp" lang="ja">情報</span></NavLink>
    </>
  );

  return (
    <div className="app">
      <header className="top">
        <NavLink to="/" className="brand" aria-label="Japan Travel, accueil">
          <img className="logo" src={`${import.meta.env.BASE_URL}maneki.svg`} alt="" width="34" height="34" />
          <span className="brand-name">Japan Travel</span>
        </NavLink>
        <nav className="tabs-top" aria-label="Navigation principale">{tabs}</nav>
        <div className="account">
          {session ? (
            <>
              <button className="avatar" aria-expanded={menu} aria-label="Mon compte" onClick={() => setMenu(!menu)}>
                <IconUser />
              </button>
              {menu && (
                <div className="menu" role="menu" onMouseLeave={() => setMenu(false)}>
                  <p className="menu-mail">{session.user.email}</p>
                  <NavLink to="/compte" role="menuitem" onClick={() => setMenu(false)}>Changer de mot de passe</NavLink>
                  <button role="menuitem" onClick={async () => { setMenu(false); await signOut(); nav("/"); }}>Se déconnecter</button>
                </div>
              )}
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
      <nav className="tabs-bottom" aria-label="Navigation principale">{tabs}</nav>
    </div>
  );
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles.css";
import { AuthProvider } from "./state/auth";
import { TripProvider } from "./state/trip";
import { PlanProvider } from "./state/plan";
import Voyage from "./pages/Voyage";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Catalogue from "./pages/Catalogue";
import Trip from "./pages/Trip";
import Login from "./pages/Login";
import Account from "./pages/Account";
import Info from "./pages/Info";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <TripProvider>
        <PlanProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="catalogue" element={<Catalogue />} />
              <Route path="lieux" element={<Trip />} />
              <Route path="voyage" element={<Voyage />} />
              <Route path="connexion" element={<Login />} />
              <Route path="compte" element={<Account />} />
              <Route path="info" element={<Info />} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </HashRouter>
        </PlanProvider>
      </TripProvider>
    </AuthProvider>
  </StrictMode>,
);

// Service worker (production seulement) : installation sur l'écran d'accueil et ouverture hors ligne.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {});
  });
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import "./styles.css";
import { AuthProvider } from "./state/auth";
import { TripProvider } from "./state/trip";
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
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="catalogue" element={<Catalogue />} />
              <Route path="voyage" element={<Trip />} />
              <Route path="connexion" element={<Login />} />
              <Route path="compte" element={<Account />} />
              <Route path="info" element={<Info />} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </HashRouter>
      </TripProvider>
    </AuthProvider>
  </StrictMode>,
);

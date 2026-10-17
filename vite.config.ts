import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json" with { type: "json" };

// BASE_PATH est fourni par le workflow GitHub Pages (ex. "/JapanTravel/").
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || "/",
  // Numéro de version affiché dans l'application (lu dans package.json).
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
});

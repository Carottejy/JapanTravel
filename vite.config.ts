import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// BASE_PATH est fourni par le workflow GitHub Pages (ex. "/JapanTravel/").
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || "/",
});

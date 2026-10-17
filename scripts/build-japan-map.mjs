// Génère le contour du Japon (Natural Earth 1:10m, via world-atlas) en tracé SVG pré-projeté.
// Usage : node scripts/build-japan-map.mjs  →  src/data/japan-map.json
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoMercator, geoPath } from "d3-geo";

const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/countries-10m.json", import.meta.url)));
const japan = feature(topo, topo.objects.countries).features.find((f) => f.id === "392");

// On garde l'archipel principal (Kyūshū → Hokkaidō) ; Okinawa et les îles lointaines sont hors cadre.
const BOX = { lon0: 128.6, lon1: 146.2, lat0: 30.9, lat1: 45.7 };
const keep = (ring) => ring.every(([lo, la]) => lo >= BOX.lon0 - 1 && lo <= BOX.lon1 + 1 && la >= BOX.lat0 - 1 && la <= BOX.lat1 + 1);
const polys = (japan.geometry.type === "MultiPolygon" ? japan.geometry.coordinates : [japan.geometry.coordinates])
  .filter((p) => keep(p[0]));
const geo = { type: "Feature", geometry: { type: "MultiPolygon", coordinates: polys } };

const W = 1000;
const proj = geoMercator().fitWidth(W, { type: "Feature", geometry: { type: "MultiPoint", coordinates: [[BOX.lon0, BOX.lat0], [BOX.lon1, BOX.lat1]] } });
const [, y0] = proj([BOX.lon0, BOX.lat1]);
const [, y1] = proj([BOX.lon0, BOX.lat0]);
const H = Math.round(y1 - y0);
proj.translate([proj.translate()[0], proj.translate()[1] - y0]);
const path = geoPath(proj).digits(1);

// Petites îles (< ~4 km²) écartées pour alléger le tracé.
const d = polys
  .map((p) => ({ p, a: geoPath(proj).area({ type: "Polygon", coordinates: p }) }))
  .filter((x) => x.a > 1.2)
  .map((x) => path({ type: "Polygon", coordinates: x.p }))
  .join("");

writeFileSync(new URL("../src/data/japan-map.json", import.meta.url),
  JSON.stringify({ W, H, scale: proj.scale(), tx: proj.translate()[0], ty: proj.translate()[1], d }));
console.log("ok", W, H, d.length, "caractères");

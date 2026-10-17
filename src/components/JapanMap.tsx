import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import japan from "../data/japan-map.json";
import { ZONE_COLOR, type Place } from "../data/catalogue";

/* Carte détourée du Japon, purement informative : contour Natural Earth 1:10 m pré-projeté
   (Mercator), repères géographiques en français, lieux du voyage en surbrillance. */

const { W, H, scale, tx, ty, d: LAND } = japan as { W: number; H: number; scale: number; tx: number; ty: number; d: string };
export const project = (lon: number, lat: number): [number, number] => {
  const l = (lon * Math.PI) / 180, p = (lat * Math.PI) / 180;
  return [scale * l + tx, ty - scale * Math.log(Math.tan(Math.PI / 4 + p / 2))];
};

type Kind = "ile" | "mer" | "ville" | "fuji";
const REPERES: { n: string; lon: number; lat: number; k: Kind; big?: boolean }[] = [
  { n: "Hokkaidō", lon: 142.9, lat: 43.55, k: "ile" },
  { n: "Honshū", lon: 138.3, lat: 37.15, k: "ile" },
  { n: "Shikoku", lon: 133.4, lat: 33.72, k: "ile" },
  { n: "Kyūshū", lon: 130.85, lat: 32.55, k: "ile" },
  { n: "Mer du Japon", lon: 135.2, lat: 39.6, k: "mer" },
  { n: "Océan Pacifique", lon: 141.6, lat: 33.4, k: "mer" },
  { n: "Mer d'Okhotsk", lon: 144.6, lat: 45.15, k: "mer" },
  { n: "Mer intérieure de Seto", lon: 132.9, lat: 34.05, k: "mer" },
  { n: "Sapporo", lon: 141.35, lat: 43.06, k: "ville", big: true },
  { n: "Sendai", lon: 140.87, lat: 38.27, k: "ville", big: true },
  { n: "Tokyo", lon: 139.69, lat: 35.69, k: "ville", big: true },
  { n: "Yokohama", lon: 139.64, lat: 35.44, k: "ville" },
  { n: "Nagoya", lon: 136.91, lat: 35.18, k: "ville", big: true },
  { n: "Kanazawa", lon: 136.65, lat: 36.56, k: "ville" },
  { n: "Kyoto", lon: 135.77, lat: 35.01, k: "ville", big: true },
  { n: "Nara", lon: 135.8, lat: 34.68, k: "ville" },
  { n: "Osaka", lon: 135.5, lat: 34.69, k: "ville", big: true },
  { n: "Kobe", lon: 135.19, lat: 34.69, k: "ville" },
  { n: "Okayama", lon: 133.92, lat: 34.66, k: "ville" },
  { n: "Hiroshima", lon: 132.46, lat: 34.39, k: "ville", big: true },
  { n: "Fukuoka", lon: 130.4, lat: 33.59, k: "ville", big: true },
  { n: "Mont Fuji", lon: 138.73, lat: 35.36, k: "fuji" },
];

type VB = [number, number, number, number];
const FULL: VB = [0, 0, W, H];

function fit(points: [number, number][], aspect: number): VB {
  if (!points.length) return withAspect(FULL, aspect);
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const minSpan = 90; // ≈ 1,5° : on ne zoome pas plus que l'échelle d'une région
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let w = Math.max(x1 - x0, minSpan) * 1.6 + 60, h = Math.max(y1 - y0, minSpan) * 1.5 + 30;
  return withAspect([cx - w / 2, cy - h / 2, w, h], aspect);
}
function withAspect([x, y, w, h]: VB, aspect: number): VB {
  if (w / h < aspect) { const nw = h * aspect; return [x - (nw - w) / 2, y, nw, h]; }
  const nh = w / aspect; return [x, y - (nh - h) / 2, w, nh];
}

export interface JapanMapProps {
  stops: Place[];             // lieux du voyage, dans l'ordre
  others: Place[];            // lieux affichés en retrait
  selected: string | null;
  onSelect: (id: string | null) => void;
  view: "trajet" | "japon";
}

export default function JapanMap({ stops, others, selected, onSelect, view }: JapanMapProps) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [vb, setVb] = useState<VB>(FULL);
  const anim = useRef(0);

  useLayoutEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth || 1, h: el.clientHeight || 1 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pts = useMemo(() => stops.map((p) => project(p.lon, p.lat)), [stops]);
  const target = useMemo(
    () => (view === "trajet" && pts.length ? fit(pts, size.w / size.h) : withAspect(FULL, size.w / size.h)),
    [pts, view, size],
  );

  // Transition douce du cadrage (sauf si l'utilisateur limite les animations).
  useEffect(() => {
    cancelAnimationFrame(anim.current);
    const from = vb, to = target;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setVb(to); return; }
    const t0 = performance.now(), dur = 550;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      setVb(from.map((v, i) => v + (to[i] - v) * e) as VB);
      if (k < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const u = vb[2] / size.w; // unités SVG par pixel écran
  const inView = ([x, y]: [number, number]) => x >= vb[0] && x <= vb[0] + vb[2] && y >= vb[1] && y <= vb[1] + vb[3];

  // Étiquettes des lieux : placées à droite (ou à gauche) du repère, sans chevauchement.
  const labels = useMemo(() => {
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    const hit = (r: { x: number; y: number; w: number; h: number }) =>
      placed.some((q) => r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y);
    const fs = 12.5 * u, out: { id: string; x: number; y: number; anchor: "start" | "end" | "middle"; text: string }[] = [];
    pts.forEach(([x, y]) => placed.push({ x: x - 12 * u, y: y - 12 * u, w: 24 * u, h: 24 * u }));
    const order = stops.map((p, i) => ({ p, i })).sort((a, b) => (a.p.id === selected ? -1 : b.p.id === selected ? 1 : 0));
    for (const { p, i } of order) {
      const [x, y] = pts[i];
      if (!inView([x, y])) continue;
      const text = p.nom.split(" :")[0].split(" (")[0];
      const w = text.length * fs * 0.56, h = fs * 1.3;
      // Essais : à droite, à gauche, au-dessus, en dessous.
      const tries: { r: { x: number; y: number; w: number; h: number }; tx: number; ty: number; a: "start" | "end" | "middle" }[] = [
        { r: { x: x + 16 * u, y: y - h / 2, w, h }, tx: x + 16 * u, ty: y + fs * 0.36, a: "start" },
        { r: { x: x - 16 * u - w, y: y - h / 2, w, h }, tx: x - 16 * u, ty: y + fs * 0.36, a: "end" },
        { r: { x: x - w / 2, y: y - 16 * u - h, w, h }, tx: x, ty: y - 16 * u - fs * 0.3, a: "middle" },
        { r: { x: x - w / 2, y: y + 16 * u, w, h }, tx: x, ty: y + 16 * u + fs, a: "middle" },
      ];
      for (const t of tries) {
        const inside = t.r.x >= vb[0] + 4 * u && t.r.x + t.r.w <= vb[0] + vb[2] - 4 * u;
        if (inside && !hit(t.r)) { placed.push(t.r); out.push({ id: p.id, x: t.tx, y: t.ty, anchor: t.a, text }); break; }
      }
    }
    return { out, placed };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pts, stops, vb, size, selected]);

  const zoomed = vb[2] < W * 0.55;

  return (
    <div className="jmap" ref={box}>
      <svg viewBox={vb.join(" ")} preserveAspectRatio="xMidYMid meet" role="img"
        aria-label={stops.length ? `Carte du Japon avec les ${stops.length} lieux de votre voyage` : "Carte du Japon"}
        onClick={(e) => { if (e.target === e.currentTarget) onSelect(null); }}>
        <defs>
          <pattern id="seigaiha" width={40 * u} height={20 * u} patternUnits="userSpaceOnUse">
            <path d={`M0 ${20 * u}a${20 * u} ${20 * u} 0 0 1 ${40 * u} 0M${6 * u} ${20 * u}a${14 * u} ${14 * u} 0 0 1 ${28 * u} 0M${12 * u} ${20 * u}a${8 * u} ${8 * u} 0 0 1 ${16 * u} 0`}
              fill="none" className="wave" strokeWidth={1 * u} />
          </pattern>
        </defs>
        <rect x={vb[0]} y={vb[1]} width={vb[2]} height={vb[3]} className="sea" onClick={() => onSelect(null)} />
        <rect x={vb[0]} y={vb[1]} width={vb[2]} height={vb[3]} fill="url(#seigaiha)" pointerEvents="none" />
        <path d={LAND} className="land" strokeWidth={1.2 * u} pointerEvents="none" />

        {/* Repères géographiques */}
        <g className="reperes" pointerEvents="none">
          {REPERES.map((r) => {
            const [x, y] = project(r.lon, r.lat);
            if (!inView([x, y])) return null;
            if (r.k === "ville" && !r.big && !zoomed) return null;
            if (r.k === "mer" && r.n.startsWith("Mer intérieure") && !zoomed) return null;
            if (r.k === "ville" || r.k === "fuji") {
              const lw = r.n.length * 11 * u * 0.56;
              const rect = { x: x + 6 * u, y: y - 11 * u, w: lw, h: 13 * u };
              const out = rect.x + rect.w > vb[0] + vb[2];
              const clash = out || labels.placed.some((q) => rect.x < q.x + q.w && rect.x + rect.w > q.x && rect.y < q.y + q.h && rect.y + rect.h > q.y);
              return (
                <g key={r.n} className={r.k}>
                  {r.k === "fuji"
                    ? <path d={`M${x - 7 * u} ${y + 5 * u}L${x} ${y - 7 * u}L${x + 7 * u} ${y + 5 * u}Z`} strokeWidth={1.2 * u} />
                    : <circle cx={x} cy={y} r={2.6 * u} />}
                  {!clash && <text x={x + 6 * u} y={y - 4 * u} fontSize={11 * u}>{r.n}</text>}
                </g>
              );
            }
            const fsz = (r.k === "ile" ? 15 : 12.5) * u, half = r.n.length * fsz * 0.33 + (r.k === "ile" ? r.n.length * 1.25 * u : 0);
            if (x - half < vb[0] || x + half > vb[0] + vb[2]) return null;
            return (
              <text key={r.n} x={x} y={y} className={r.k} textAnchor="middle"
                fontSize={(r.k === "ile" ? 15 : 12.5) * u} letterSpacing={(r.k === "ile" ? 2.5 : 1) * u}>{r.n}</text>
            );
          })}
        </g>

        {/* Lieux en retrait */}
        {others.map((p) => {
          const [x, y] = project(p.lon, p.lat);
          return <circle key={p.id} cx={x} cy={y} r={(p.id === selected ? 6 : 3.6) * u} className={"other" + (p.id === selected ? " on" : "")}
            fill={ZONE_COLOR[p.zone]} strokeWidth={1.2 * u} onClick={() => onSelect(p.id)} />;
        })}

        {/* Trajet */}
        {pts.slice(1).map(([x, y], i) => {
          const [px, py] = pts[i];
          const inter = stops[i].ville !== stops[i + 1].ville;
          return <line key={i} x1={px} y1={py} x2={x} y2={y} className={inter ? "leg inter" : "leg"}
            stroke={inter ? undefined : ZONE_COLOR[stops[i + 1].zone]}
            strokeWidth={(inter ? 2.2 : 3.4) * u} strokeDasharray={inter ? `${6 * u} ${6 * u}` : undefined} />;
        })}

        {/* Lieux du voyage, en surbrillance */}
        {stops.map((p, i) => {
          const [x, y] = pts[i];
          const on = p.id === selected, s = (on ? 13 : 11) * u;
          return (
            <g key={p.id} className={"stop-pin" + (on ? " on" : "")} onClick={() => onSelect(p.id)} role="button"
              aria-label={`Arrêt ${i + 1} : ${p.nom}`}>
              <circle cx={x} cy={y} r={s * 1.9} className="halo" fill={ZONE_COLOR[p.zone]} />
              <rect x={x - s} y={y - s} width={2 * s} height={2 * s} rx={3 * u} fill={ZONE_COLOR[p.zone]} strokeWidth={2 * u} />
              <text x={x} y={y + 4.3 * u} textAnchor="middle" fontSize={12 * u}>{i + 1}</text>
            </g>
          );
        })}
        <g className="pin-labels" pointerEvents="none">
          {labels.out.map((l) => (
            <text key={l.id} x={l.x} y={l.y} textAnchor={l.anchor} fontSize={12.5 * u} strokeWidth={3.4 * u}
              className={l.id === selected ? "on" : ""}>{l.text}</text>
          ))}
        </g>
      </svg>
    </div>
  );
}

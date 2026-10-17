// Pictogrammes au trait, dessinés pour l'application.
const s = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

/** Carte : un torii posé sur la ligne d'horizon */
export const IconMap = () => (
  <svg {...s}><path d="M3 6.5h18M5 9.5h14M7.5 6.5V20M16.5 6.5V20M4 4.5c3 1 13 1 16 0" /></svg>
);
/** Catalogue : un rouleau (makimono) */
export const IconScroll = () => (
  <svg {...s}><rect x="5" y="4" width="14" height="16" rx="1.5" /><path d="M3 4h18M3 20h18M8.5 8.5h7M8.5 12h7M8.5 15.5h4" /></svg>
);
/** Voyage : un billet de train poinçonné */
export const IconTicket = () => (
  <svg {...s}><path d="M3 7.5a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 7.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-2a2.5 2.5 0 0 0 0-5z" /><path d="M14.5 6v12" strokeDasharray="1.5 2" /></svg>
);
export const IconUser = () => (
  <svg {...s}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" /></svg>
);
/** Info : une lanterne chōchin */
export const IconLantern = () => (
  <svg {...s}><path d="M12 2.5v2M9 4.5h6M9 19.5h6M12 19.5v2" /><path d="M8.5 4.5C5.5 6.5 5.5 17.5 8.5 19.5h7c3-2 3-13 0-15z" /><path d="M6.4 9h11.2M6.4 15h11.2" /></svg>
);
/** Mes lieux : une épingle de carte */
export const IconPin = () => (
  <svg {...s}><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z" /><circle cx="12" cy="9.8" r="2.4" /></svg>
);
/** Voyage : le nez d'un shinkansen */
export const IconTrain = () => (
  <svg {...s}><path d="M4 16.5c0-6 4-10.5 10-10.5h1.5c2.5 0 4.5 2 4.5 4.5v6a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 16.5z" /><path d="M8.5 11h11.5M4.5 20.5h16" /><circle cx="16.5" cy="14.5" r=".6" fill="currentColor" /></svg>
);

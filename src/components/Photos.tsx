import { useEffect, useRef, useState } from "react";
import { spritePos, spriteUrl, type Place } from "../data/catalogue";

/** Photos du lieu : carrousel à faire glisser sur téléphone, grille sur grand écran ; visionneuse au toucher. */
export default function Photos({ place }: { place: Place }) {
  const [open, setOpen] = useState<number | null>(null);
  const [cur, setCur] = useState(0);
  const dlg = useRef<HTMLDialogElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const n = place.photos.length;
  const bg = { backgroundImage: `url("${spriteUrl(place.id)}")` };

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  const onScroll = () => {
    const el = strip.current;
    if (el) setCur(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="photos">
      <div className="ph" ref={strip} onScroll={onScroll}>
        {place.photos.map((_, k) => (
          <button key={k} type="button" aria-label={`Agrandir la photo ${k + 1} de ${place.nom}`}
            style={{ ...bg, backgroundPosition: spritePos(k) }} onClick={() => setOpen(k)} />
        ))}
      </div>
      <div className="ph-dots" aria-hidden="true">
        {place.photos.map((_, k) => <span key={k} className={k === cur ? "on" : ""} />)}
      </div>
      <dialog ref={dlg} className="lb" aria-label={`Photos de ${place.nom}`} onClose={() => setOpen(null)}
        onClick={(e) => e.target === dlg.current && setOpen(null)}
        onKeyDown={(e) => {
          if (open === null) return;
          if (e.key === "ArrowRight") setOpen((open + 1) % n);
          if (e.key === "ArrowLeft") setOpen((open + n - 1) % n);
        }}>
        {open !== null && (
          <figure>
            <div className="lb-img" role="img" aria-label={`${place.nom}, photo ${open + 1}`} style={{ ...bg, backgroundPosition: spritePos(open) }} />
            <figcaption>
              <span>{place.nom}, photo <span className="dot-num">{open + 1}/{n}</span></span>
              <span className="lb-nav">
                <button className="btn ghost sm inv" onClick={() => setOpen((open + n - 1) % n)} aria-label="Photo précédente">←</button>
                <button className="btn ghost sm inv" onClick={() => setOpen((open + 1) % n)} aria-label="Photo suivante">→</button>
                <a href={place.photos[open].page} target="_blank" rel="noopener">Source Commons ↗</a>
              </span>
            </figcaption>
            <button className="lb-close" onClick={() => setOpen(null)} aria-label="Fermer">✕</button>
          </figure>
        )}
      </dialog>
    </div>
  );
}

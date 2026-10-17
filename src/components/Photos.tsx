import { useEffect, useRef, useState } from "react";
import { spritePos, spriteUrl, type Place } from "../data/catalogue";

/** Grille de 6 photos (une planche JPEG par lieu) avec visionneuse. */
export default function Photos({ place, compact = false }: { place: Place; compact?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const n = place.photos.length;
  const shown = compact ? place.photos.slice(0, 3) : place.photos;

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  return (
    <>
      <div className={"ph" + (compact ? " compact" : "")}>
        {shown.map((_, k) => (
          <button
            key={k}
            type="button"
            aria-label={`Agrandir la photo ${k + 1} de ${place.nom}`}
            style={{ backgroundImage: `url("${spriteUrl(place.id)}")`, backgroundPosition: spritePos(k) }}
            onClick={() => setOpen(k)}
          />
        ))}
      </div>
      <dialog
        ref={dlg}
        className="lb"
        aria-label={`Photos de ${place.nom}`}
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === dlg.current && setOpen(null)}
        onKeyDown={(e) => {
          if (open === null) return;
          if (e.key === "ArrowRight") setOpen((open + 1) % n);
          if (e.key === "ArrowLeft") setOpen((open + n - 1) % n);
        }}
      >
        {open !== null && (
          <figure>
            <div
              className="lb-img"
              role="img"
              aria-label={`${place.nom}, photo ${open + 1}`}
              style={{ backgroundImage: `url("${spriteUrl(place.id)}")`, backgroundPosition: spritePos(open) }}
            />
            <figcaption>
              <span>{place.nom} · photo {open + 1} sur {n}</span>
              <span className="lb-nav">
                <button className="btn ghost sm inv" onClick={() => setOpen((open + n - 1) % n)}>← Précédente</button>
                <button className="btn ghost sm inv" onClick={() => setOpen((open + 1) % n)}>Suivante →</button>
                <a href={place.photos[open].page} target="_blank" rel="noopener">Source Commons ↗</a>
              </span>
            </figcaption>
            <button className="lb-close" onClick={() => setOpen(null)} aria-label="Fermer">✕</button>
          </figure>
        )}
      </dialog>
    </>
  );
}

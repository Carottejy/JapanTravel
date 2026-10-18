import { useEffect, useRef, useState } from "react";
import { useTrip } from "../state/trip";

/** Notes personnelles sur un lieu de « Mes lieux », enregistrées automatiquement. */
export default function NoteBox({ placeId }: { placeId: string }) {
  const { noteOf, setNote } = useTrip();
  const saved = noteOf(placeId);
  const [v, setV] = useState(saved);
  const [state, setState] = useState<"" | "saving" | "saved">("");
  const timer = useRef<number>(0);
  const [open, setOpen] = useState(!!saved);

  useEffect(() => { setV(saved); setOpen((o) => o || !!saved); }, [saved]);

  const save = async (text: string) => {
    if (text === saved) return;
    setState("saving");
    const ok = await setNote(placeId, text);
    setState(ok ? "saved" : "");
  };
  const onChange = (text: string) => {
    setV(text); setState("");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => save(text), 900);
  };

  if (!open)
    return <button className="note-add" onClick={() => setOpen(true)}>✎ Ajouter une note perso</button>;
  return (
    <label className="notebox">
      <span className="notebox-h"><span lang="ja">メモ</span> Mes notes
        <span className="notebox-s" aria-live="polite">{state === "saving" ? "Enregistrement…" : state === "saved" ? "Enregistré" : ""}</span>
      </span>
      <textarea rows={3} maxLength={2000} value={v} placeholder="Horaires, idées, avec qui y aller, ce qu'on veut y manger…"
        onChange={(e) => onChange(e.target.value)} onBlur={() => { window.clearTimeout(timer.current); save(v); }} />
    </label>
  );
}

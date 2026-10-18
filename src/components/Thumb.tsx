import { spritePos, spriteUrl, type Place } from "../data/catalogue";

/** Vignette d'un lieu : 1re photo, ou un sceau « 手作り » pour une fiche perso sans photo. */
export default function Thumb({ p, small = false }: { p: Place; small?: boolean }) {
  if (p.custom || !p.photos.length)
    return <div className={"thumb ph-none" + (small ? " sm" : "")} aria-hidden="true"><span lang="ja">手作り</span></div>;
  return <div className={"thumb" + (small ? " sm" : "")} style={{ backgroundImage: `url("${spriteUrl(p.id)}")`, backgroundPosition: spritePos(0) }} />;
}

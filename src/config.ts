// Clés publiques du projet Supabase « JapanTravel ».
// La clé « publishable » est faite pour être dans le navigateur : la sécurité
// des données repose sur les règles RLS de la base (chacun ne voit que son voyage).
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://bjpinzjpxdiaxagtldqq.supabase.co";
export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY ?? "sb_publishable_0G_FsTPzjwKyS9cGOlPc7A_Ohil3RtE";

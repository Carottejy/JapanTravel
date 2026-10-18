-- Fiches créées à la main par chaque compte (s'ajoutent au catalogue du carnet)
create table public.custom_places (
  id text primary key check (id ~ '^perso-[0-9a-f-]{36}$'),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nom text not null check (char_length(nom) between 1 and 120),
  cat text not null default 'hors' check (cat in ('classique', 'hors', 'activite')),
  ville integer not null check (ville between 0 and 50),
  lieu text check (lieu is null or char_length(lieu) <= 160),
  lat double precision not null check (lat between 20 and 46),
  lon double precision not null check (lon between 122 and 154),
  description text check (description is null or char_length(description) <= 4000),
  duree text check (duree is null or char_length(duree) <= 200),
  prix text check (prix is null or char_length(prix) <= 300),
  resa text check (resa is null or char_length(resa) <= 300),
  lien text check (lien is null or char_length(lien) <= 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index custom_places_user_idx on public.custom_places (user_id);
alter table public.custom_places enable row level security;
create policy "select own" on public.custom_places for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own" on public.custom_places for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own" on public.custom_places for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on public.custom_places for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.custom_places from anon;
grant select, insert, update, delete on public.custom_places to authenticated;

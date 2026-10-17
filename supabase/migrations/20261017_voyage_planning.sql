-- Dates du voyage (une ligne par compte)
create table public.voyages (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (end_date - start_date <= 90)
);
alter table public.voyages enable row level security;
create policy "select own" on public.voyages for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own" on public.voyages for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own" on public.voyages for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on public.voyages for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.voyages from anon;
grant select, insert, update, delete on public.voyages to authenticated;

-- Lieux placés sur chaque journée, dans l'ordre de visite
create table public.voyage_etapes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  place_id text not null check (char_length(place_id) between 1 and 64),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, day, place_id)
);
create index voyage_etapes_user_idx on public.voyage_etapes (user_id, day, position);
alter table public.voyage_etapes enable row level security;
create policy "select own" on public.voyage_etapes for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own" on public.voyage_etapes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own" on public.voyage_etapes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on public.voyage_etapes for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.voyage_etapes from anon;
grant select, insert, update, delete on public.voyage_etapes to authenticated;

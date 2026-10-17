-- Voyage propre à chaque compte : la liste des lieux choisis dans le catalogue.
create table public.trip_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  place_id text not null check (char_length(place_id) between 1 and 64),
  position integer not null default 0,
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);
create index trip_items_user_idx on public.trip_items (user_id);
alter table public.trip_items enable row level security;
-- Chaque utilisateur ne lit et ne modifie que ses propres lignes.
create policy "select own" on public.trip_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own" on public.trip_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own" on public.trip_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own" on public.trip_items for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.trip_items from anon;
grant select, insert, update, delete on public.trip_items to authenticated;

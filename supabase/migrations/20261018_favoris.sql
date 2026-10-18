-- Lieux favoris du catalogue (indépendants de « Mes lieux »)
create table public.favoris (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  place_id text not null check (char_length(place_id) between 1 and 64),
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);
alter table public.favoris enable row level security;
create policy "select own" on public.favoris for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own" on public.favoris for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "delete own" on public.favoris for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.favoris from anon;
grant select, insert, delete on public.favoris to authenticated;

-- Plusieurs voyages par compte : chaque voyage a son identifiant, son nom et ses dates ;
-- les étapes appartiennent à un voyage (supprimées avec lui).

alter table public.voyages add column id uuid not null default gen_random_uuid();
alter table public.voyages add column nom text not null default 'Mon voyage' check (char_length(btrim(nom)) between 1 and 80);
alter table public.voyages add column created_at timestamptz not null default now();
alter table public.voyages drop constraint voyages_pkey;
alter table public.voyages add primary key (id);
alter table public.voyages alter column user_id set not null;
create index voyages_user_idx on public.voyages (user_id, start_date);

alter table public.voyage_etapes add column voyage_id uuid references public.voyages(id) on delete cascade;
update public.voyage_etapes e set voyage_id = v.id from public.voyages v where v.user_id = e.user_id;
delete from public.voyage_etapes where voyage_id is null;
alter table public.voyage_etapes alter column voyage_id set not null;
alter table public.voyage_etapes drop constraint voyage_etapes_user_day_kind_place_key;
alter table public.voyage_etapes add constraint voyage_etapes_voyage_day_kind_place_key unique (voyage_id, day, kind, place_id);
create index voyage_etapes_voyage_idx on public.voyage_etapes (voyage_id, day, position);

-- Une étape ne peut viser qu'un voyage du même compte.
drop policy "insert own" on public.voyage_etapes;
drop policy "update own" on public.voyage_etapes;
create policy "insert own" on public.voyage_etapes for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (select 1 from public.voyages v where v.id = voyage_id and v.user_id = (select auth.uid())));
create policy "update own" on public.voyage_etapes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (select 1 from public.voyages v where v.id = voyage_id and v.user_id = (select auth.uid())));

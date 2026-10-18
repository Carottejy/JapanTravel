-- Plusieurs voyages par compte : chaque voyage a son identifiant, son nom et ses dates ;
-- les étapes appartiennent à un voyage (supprimées avec lui).
-- Appliqué en trois migrations : plusieurs_voyages_1_colonnes, _2_cles, _3_regles.

-- 1. Colonnes (le voyage existant de chaque compte devient « Mon voyage »)
alter table public.voyages add column id uuid not null default gen_random_uuid();
alter table public.voyages add column nom text not null default 'Mon voyage' check (char_length(btrim(nom)) between 1 and 80);
alter table public.voyages add column created_at timestamptz not null default now();
create unique index voyages_id_key on public.voyages (id);
create index voyages_user_idx on public.voyages (user_id, start_date);
alter table public.voyage_etapes add column voyage_id uuid;
update public.voyage_etapes e set voyage_id = v.id from public.voyages v where v.user_id = e.user_id;
create index voyage_etapes_voyage_idx on public.voyage_etapes (voyage_id, day, position);

-- 2. Clés
alter table public.voyages drop constraint voyages_pkey;
alter table public.voyages add constraint voyages_pkey primary key using index voyages_id_key;
alter table public.voyages alter column user_id set not null;
alter table public.voyage_etapes add constraint voyage_etapes_voyage_id_fkey foreign key (voyage_id) references public.voyages(id) on delete cascade;
alter table public.voyage_etapes alter column voyage_id set not null;
alter table public.voyage_etapes drop constraint voyage_etapes_user_day_kind_place_key;
alter table public.voyage_etapes add constraint voyage_etapes_voyage_day_kind_place_key unique (voyage_id, day, kind, place_id);

-- 3. Règles d'accès : une étape ne peut viser qu'un voyage du même compte
alter policy "insert own" on public.voyage_etapes
  with check ((select auth.uid()) = user_id and exists (select 1 from public.voyages v where v.id = voyage_id and v.user_id = (select auth.uid())));
alter policy "update own" on public.voyage_etapes
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (select 1 from public.voyages v where v.id = voyage_id and v.user_id = (select auth.uid())));

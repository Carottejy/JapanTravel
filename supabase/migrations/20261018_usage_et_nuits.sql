-- Fiches perso : usage du lieu (visiter, manger, dormir)
alter table public.custom_places add column usage text not null default 'visiter' check (usage in ('visiter', 'manger', 'dormir'));

-- Voyage : une étape est soit une visite de la journée, soit l'hébergement de la nuit (day = date du soir)
alter table public.voyage_etapes add column kind text not null default 'jour' check (kind in ('jour', 'nuit'));
alter table public.voyage_etapes drop constraint voyage_etapes_user_id_day_place_id_key;
alter table public.voyage_etapes add constraint voyage_etapes_user_day_kind_place_key unique (user_id, day, kind, place_id);

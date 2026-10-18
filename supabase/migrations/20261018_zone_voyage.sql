-- Zone d'un voyage : des villes (identifiants de src/data/zone.ts) et un périmètre en km autour de chacune
alter table public.voyages add column zone_villes text[] not null default '{}' check (cardinality(zone_villes) <= 40);
alter table public.voyages add column zone_km integer check (zone_km between 1 and 500);

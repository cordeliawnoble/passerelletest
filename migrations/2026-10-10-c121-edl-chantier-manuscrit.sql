-- Passerelle C121 · État des lieux, documents de chantier et corrections du Manuscrit
-- Exécuter dans Supabase SQL Editor AVANT de fusionner la PR.
create table if not exists passerelle.edl_evaluations (
  oeuvre_id uuid not null references passerelle.oeuvres(id) on delete cascade,
  critere text not null check (critere in ('resume','informations','mots_cles','personnages','plan')),
  etat text not null check (etat in ('Non renseigné','À qualifier','Sommaire','Complet','Non nécessaire')),
  user_id uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (oeuvre_id, critere)
);
create table if not exists passerelle.documents_chantier (
  id uuid primary key default gen_random_uuid(),
  oeuvre_id uuid not null references passerelle.oeuvres(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  titre text not null,
  contenu text not null default '',
  archive boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_documents_chantier_oeuvre on passerelle.documents_chantier(oeuvre_id, archive, updated_at desc);
create table if not exists passerelle.chapitres_manuels (
  chapitre_id uuid primary key references passerelle.chapitres(id) on delete cascade,
  oeuvre_id uuid not null references passerelle.oeuvres(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  champs text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table passerelle.edl_evaluations enable row level security;
alter table passerelle.documents_chantier enable row level security;
alter table passerelle.chapitres_manuels enable row level security;
drop policy if exists edl_owner_c121 on passerelle.edl_evaluations;
create policy edl_owner_c121 on passerelle.edl_evaluations for all to authenticated
  using (user_id = auth.uid() and exists (
    select 1 from passerelle.oeuvres o where o.id = oeuvre_id and o.user_id = auth.uid()
  ))
  with check (user_id = auth.uid() and exists (
    select 1 from passerelle.oeuvres o where o.id = oeuvre_id and o.user_id = auth.uid()
  ));
drop policy if exists chantier_documents_owner_c121 on passerelle.documents_chantier;
create policy chantier_documents_owner_c121 on passerelle.documents_chantier for all to authenticated
  using (user_id = auth.uid() and exists (
    select 1 from passerelle.oeuvres o where o.id = oeuvre_id and o.user_id = auth.uid()
  ))
  with check (user_id = auth.uid() and exists (
    select 1 from passerelle.oeuvres o where o.id = oeuvre_id and o.user_id = auth.uid()
  ));
drop policy if exists chapitres_manuels_owner_c121 on passerelle.chapitres_manuels;
create policy chapitres_manuels_owner_c121 on passerelle.chapitres_manuels for all to authenticated
  using (user_id = auth.uid() and exists (
    select 1 from passerelle.oeuvres o where o.id = oeuvre_id and o.user_id = auth.uid()
  ))
  with check (user_id = auth.uid() and exists (
    select 1 from passerelle.oeuvres o where o.id = oeuvre_id and o.user_id = auth.uid()
  ));
grant select,insert,update,delete on passerelle.edl_evaluations, passerelle.documents_chantier, passerelle.chapitres_manuels to authenticated;

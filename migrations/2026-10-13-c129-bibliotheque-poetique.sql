-- C129 · Bibliothèque poétique. À appliquer dans Supabase SQL Editor.
-- Aucun changement automatique de la base en déposant ce fichier.
create table if not exists passerelle.poemes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 titre text not null,
 texte text not null default '',
 recueil_origine text,
 theme text,
 date_ecriture date,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists passerelle.poemes_oeuvres (
 poeme_id uuid not null references passerelle.poemes(id) on delete cascade,
 oeuvre_id uuid not null references passerelle.oeuvres(id) on delete cascade,
 user_id uuid not null references auth.users(id),
 ordre integer not null default 0,
 primary key(poeme_id,oeuvre_id)
);
create index if not exists poemes_oeuvres_ordre_c129 on passerelle.poemes_oeuvres(oeuvre_id,ordre);
alter table passerelle.poemes enable row level security;
alter table passerelle.poemes_oeuvres enable row level security;
drop policy if exists poemes_owner_c129 on passerelle.poemes;
create policy poemes_owner_c129 on passerelle.poemes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists poemes_oeuvres_owner_c129 on passerelle.poemes_oeuvres;
create policy poemes_oeuvres_owner_c129 on passerelle.poemes_oeuvres for all to authenticated
 using(user_id=auth.uid() and exists(select 1 from passerelle.poemes p where p.id=poeme_id and p.user_id=auth.uid()) and exists(select 1 from passerelle.oeuvres o where o.id=oeuvre_id and o.user_id=auth.uid()))
 with check(user_id=auth.uid() and exists(select 1 from passerelle.poemes p where p.id=poeme_id and p.user_id=auth.uid()) and exists(select 1 from passerelle.oeuvres o where o.id=oeuvre_id and o.user_id=auth.uid()));
grant select,insert,update,delete on passerelle.poemes,passerelle.poemes_oeuvres to authenticated;

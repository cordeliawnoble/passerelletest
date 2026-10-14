-- C132 : lier les poèmes existants aux recueils sans les dupliquer.
-- Cette migration conserve toutes les données existantes.
alter table passerelle.poemes add column if not exists recueil_origine text;
alter table passerelle.poemes add column if not exists theme text;
create table if not exists passerelle.poemes_recueils (
 poeme_id uuid not null references passerelle.poemes(id) on delete cascade,
 recueil_id uuid not null references passerelle.recueils(id) on delete cascade,
 user_id uuid not null references auth.users(id),
 ordre integer not null default 0,
 primary key(poeme_id,recueil_id)
);
create index if not exists poemes_recueils_order_c132 on passerelle.poemes_recueils(recueil_id,ordre);
alter table passerelle.poemes_recueils enable row level security;
drop policy if exists poemes_recueils_owner_c132 on passerelle.poemes_recueils;
create policy poemes_recueils_owner_c132 on passerelle.poemes_recueils for all to authenticated
 using(user_id=auth.uid() and exists(select 1 from passerelle.poemes p where p.id=poeme_id and p.user_id=auth.uid()) and exists(select 1 from passerelle.recueils r where r.id=recueil_id and r.user_id=auth.uid()))
 with check(user_id=auth.uid() and exists(select 1 from passerelle.poemes p where p.id=poeme_id and p.user_id=auth.uid()) and exists(select 1 from passerelle.recueils r where r.id=recueil_id and r.user_id=auth.uid()));
grant select,insert,update,delete on passerelle.poemes_recueils to authenticated;
-- Reprendre les poèmes déjà présents dans les fiches recueils.
insert into passerelle.poemes_recueils(poeme_id,recueil_id,user_id,ordre)
select p.id,p.recueil_id,p.user_id,coalesce(p.ordre,0)
from passerelle.poemes p
where p.recueil_id is not null
on conflict(poeme_id,recueil_id) do nothing;

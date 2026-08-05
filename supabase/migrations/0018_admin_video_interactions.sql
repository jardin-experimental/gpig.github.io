-- 0010_admin_video_interactions.sql
-- CRUD complet sur video_interactions pour le back-office, sur le même
-- modèle que admin_create_video_interaction : chaque fonction vérifie
-- elle-même role = 'administrateur', donc pas de service_role nécessaire
-- et pas de re-vérification côté Server Action.

create or replace function public.admin_list_video_interactions(p_lecon_id uuid)
returns setof public.video_interactions
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select role from profiles where id = auth.uid()) is distinct from 'administrateur' then
    raise exception 'Accès refusé : réservé aux administrateurs';
  end if;

  return query
    select *
    from video_interactions
    where lecon_id = p_lecon_id
    order by timestamp_seconds;
end;
$$;

create or replace function public.admin_create_video_interaction(
  p_lecon_id uuid,
  p_timestamp_seconds numeric,
  p_type text,
  p_titre text default null,
  p_contenu text default null,
  p_image_url text default null,
  p_quiz_id uuid default null,
  p_pause_video boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if (select role from profiles where id = auth.uid()) is distinct from 'administrateur' then
    raise exception 'Accès refusé : réservé aux administrateurs';
  end if;

  insert into video_interactions
    (lecon_id, timestamp_seconds, type, titre, contenu, image_url, quiz_id, pause_video)
  values
    (p_lecon_id, p_timestamp_seconds, p_type, p_titre, p_contenu, p_image_url, p_quiz_id, p_pause_video)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.admin_update_video_interaction(
  p_id uuid,
  p_timestamp_seconds numeric,
  p_type text,
  p_titre text default null,
  p_contenu text default null,
  p_image_url text default null,
  p_quiz_id uuid default null,
  p_pause_video boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select role from profiles where id = auth.uid()) is distinct from 'administrateur' then
    raise exception 'Accès refusé : réservé aux administrateurs';
  end if;

  update video_interactions
  set
    timestamp_seconds = p_timestamp_seconds,
    type = p_type,
    titre = p_titre,
    contenu = p_contenu,
    image_url = p_image_url,
    quiz_id = p_quiz_id,
    pause_video = p_pause_video
  where id = p_id;
end;
$$;

create or replace function public.admin_delete_video_interaction(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select role from profiles where id = auth.uid()) is distinct from 'administrateur' then
    raise exception 'Accès refusé : réservé aux administrateurs';
  end if;

  delete from video_interactions where id = p_id;
end;
$$;

grant execute on function public.admin_list_video_interactions(uuid) to authenticated;
grant execute on function public.admin_create_video_interaction(uuid, numeric, text, text, text, text, uuid, boolean) to authenticated;
grant execute on function public.admin_update_video_interaction(uuid, numeric, text, text, text, text, uuid, boolean) to authenticated;
grant execute on function public.admin_delete_video_interaction(uuid) to authenticated;
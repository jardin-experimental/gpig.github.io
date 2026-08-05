-- 0017_admin_create_video_interaction.sql
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
  v_role text;
  v_id uuid;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is distinct from 'administrateur' then
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

-- Seul un utilisateur authentifié peut appeler la fonction ; la vérification
-- du rôle se fait à l'intérieur, comme pour complete_lesson.
grant execute on function public.admin_create_video_interaction to authenticated;
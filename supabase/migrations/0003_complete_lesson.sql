-- ============================================================
-- 0003_complete_lesson.sql
-- Point d'entrée unique pour "terminer une leçon".
-- Le client ne touche jamais profiles.xp directement (RLS l'interdit) :
-- il appelle cette fonction via supabase.rpc('complete_lesson', ...).
-- ============================================================

create function public.complete_lesson(p_lecon_id uuid, p_score integer default null)
returns table (xp_gagne integer, xp_total integer, niveau integer, level_up boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_xp_gain integer := 10; -- valeur simple pour l'instant, la table de règles viendra avec la gamification
  v_already_done boolean;
  v_old_level integer;
  v_new_xp integer;
  v_new_level integer;
begin
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  if not public.is_lesson_unlocked(p_lecon_id, v_user_id) then
    raise exception 'Leçon verrouillée';
  end if;

  select exists (
    select 1 from public.lesson_progress
    where user_id = v_user_id and lecon_id = p_lecon_id
  ) into v_already_done;

  if v_already_done then
    -- Idempotent : on ne re-crédite pas l'XP si déjà validée
    select xp, level into v_new_xp, v_new_level from public.profiles where id = v_user_id;
    return query select 0, v_new_xp, v_new_level, false;
    return;
  end if;

  insert into public.lesson_progress (user_id, lecon_id, score)
  values (v_user_id, p_lecon_id, p_score);

  select level into v_old_level from public.profiles where id = v_user_id;

  update public.profiles
     set xp = xp + v_xp_gain,
         level = 1 + floor((xp + v_xp_gain) / 100.0), -- 100 XP par niveau, sera raffiné
         last_active_at = now()
   where id = v_user_id
   returning xp, level into v_new_xp, v_new_level;

  return query select v_xp_gain, v_new_xp, v_new_level, (v_new_level > v_old_level);
end;
$$;

revoke all on function public.complete_lesson(uuid, integer) from public;
grant execute on function public.complete_lesson(uuid, integer) to authenticated;

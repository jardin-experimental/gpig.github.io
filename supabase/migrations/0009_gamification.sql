-- ============================================================
-- 0009_gamification.sql
-- Centralise tout gain d'XP dans un ledger (historique + traçabilité),
-- et introduit les badges à conditions automatiques.
-- ============================================================

create type public.badge_condition_type as enum (
  'lecons_completees',
  'quiz_reussis',
  'streak_jours',
  'formations_terminees',
  'niveau_atteint',
  'xp_total'
);

-- Historique de tous les gains d'XP (remplace les updates directs et non tracés)
create table public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  montant integer not null,
  raison text not null,               -- ex. 'lecon_terminee', 'quiz_reussi', 'connexion_quotidienne'
  reference_type text,                -- ex. 'lecon', 'quiz', 'streak'
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index xp_ledger_user_idx on public.xp_ledger (user_id, created_at desc);

-- Catalogue des badges (gérable depuis le futur back-office)
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  nom text not null,
  description text,
  icone_url text,
  condition_type public.badge_condition_type not null,
  seuil integer not null,
  created_at timestamptz not null default now()
);

-- Badges obtenus
create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  obtenu_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create index user_badges_user_idx on public.user_badges (user_id);

-- ============================================================
-- RLS
-- ============================================================

alter table public.xp_ledger enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy "Users see own xp ledger" on public.xp_ledger for select using (auth.uid() = user_id);
create policy "Badges are public" on public.badges for select using (true);
create policy "User badges are publicly readable"
  on public.user_badges for select using (true); -- pour affichage sur profil public / classement

create policy "No direct xp ledger inserts" on public.xp_ledger for insert with check (false);
create policy "No direct user badge inserts" on public.user_badges for insert with check (false);

-- ============================================================
-- Fonctions
-- ============================================================

-- Point d'entrée unique pour tout gain d'XP (remplace l'update direct de complete_lesson)
create function public.award_xp(
  p_user_id uuid,
  p_montant integer,
  p_raison text,
  p_reference_type text default null,
  p_reference_id uuid default null
)
returns table (xp_total integer, niveau integer, level_up boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_old_level integer;
  v_new_xp integer;
  v_new_level integer;
begin
  insert into public.xp_ledger (user_id, montant, raison, reference_type, reference_id)
  values (p_user_id, p_montant, p_raison, p_reference_type, p_reference_id);

  select level into v_old_level from public.profiles where id = p_user_id;

  update public.profiles
     set xp = xp + p_montant,
         level = 1 + floor((xp + p_montant) / 100.0)
   where id = p_user_id
   returning xp, level into v_new_xp, v_new_level;

  perform public.check_and_award_badges(p_user_id);

  return query select v_new_xp, v_new_level, (v_new_level > v_old_level);
end;
$$;

revoke all on function public.award_xp(uuid, integer, text, text, uuid) from public;
-- Pas de grant à authenticated : award_xp n'est appelée que par d'autres fonctions
-- security definer (complete_lesson, connexion quotidienne...), jamais directement par le client.

-- Vérifie et attribue les badges non encore obtenus dont la condition est remplie
create function public.check_and_award_badges(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_badge record;
  v_valeur_actuelle integer;
begin
  for v_badge in
    select b.* from public.badges b
    where not exists (
      select 1 from public.user_badges ub
      where ub.user_id = p_user_id and ub.badge_id = b.id
    )
  loop
    v_valeur_actuelle := case v_badge.condition_type
      when 'lecons_completees' then (
        select count(*)::integer from public.lesson_progress where user_id = p_user_id
      )
      when 'quiz_reussis' then (
        select count(*)::integer from public.quiz_attempts
        where user_id = p_user_id and reussi = true
      )
      when 'streak_jours' then (
        select streak_count from public.profiles where id = p_user_id
      )
      when 'niveau_atteint' then (
        select level from public.profiles where id = p_user_id
      )
      when 'xp_total' then (
        select xp from public.profiles where id = p_user_id
      )
      when 'formations_terminees' then (
        select count(*)::integer from public.enrollments e
        where e.user_id = p_user_id
          and not exists (
            select 1 from public.lecons l
            join public.chapitres c on c.id = l.chapitre_id
            join public.modules m on m.id = c.module_id
            where m.formation_id = e.formation_id
              and not exists (
                select 1 from public.lesson_progress lp
                where lp.user_id = p_user_id and lp.lecon_id = l.id
              )
          )
      )
    end;

    if v_valeur_actuelle >= v_badge.seuil then
      insert into public.user_badges (user_id, badge_id)
      values (p_user_id, v_badge.id)
      on conflict do nothing;
    end if;
  end loop;
end;
$$;

-- Connexion quotidienne : à appeler une fois par session (idempotent par jour)
create function public.enregistrer_connexion_quotidienne()
returns table (streak integer, xp_gagne integer)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_last_date date;
  v_today date := (now() at time zone 'utc')::date;
  v_new_streak integer;
  v_xp_gagne integer := 0;
begin
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  select (last_active_at at time zone 'utc')::date into v_last_date
  from public.profiles where id = v_user_id;

  if v_last_date = v_today then
    -- déjà comptabilisé aujourd'hui, aucune action
    select streak_count into v_new_streak from public.profiles where id = v_user_id;
    return query select v_new_streak, 0;
  end if;

  if v_last_date = v_today - interval '1 day' then
    v_new_streak := (select streak_count from public.profiles where id = v_user_id) + 1;
  else
    v_new_streak := 1;
  end if;

  update public.profiles
     set streak_count = v_new_streak, last_active_at = now()
   where id = v_user_id;

  v_xp_gagne := 5 + least(v_new_streak, 10); -- bonus croissant plafonné, à ajuster
  perform public.award_xp(v_user_id, v_xp_gagne, 'connexion_quotidienne', 'streak', null);

  return query select v_new_streak, v_xp_gagne;
end;
$$;

revoke all on function public.enregistrer_connexion_quotidienne() from public;
grant execute on function public.enregistrer_connexion_quotidienne() to authenticated;

-- ============================================================
-- Refonte de complete_lesson : passe désormais par award_xp (traçabilité + badges)
-- ============================================================

create or replace function public.complete_lesson(p_lecon_id uuid, p_score integer default null)
returns table (xp_gagne integer, xp_total integer, niveau integer, level_up boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_xp_gain integer := 10;
  v_already_done boolean;
  v_result record;
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
    select xp, level into v_result from public.profiles where id = v_user_id;
    return query select 0, v_result.xp, v_result.level, false;
    return;
  end if;

  insert into public.lesson_progress (user_id, lecon_id, score)
  values (v_user_id, p_lecon_id, p_score);

  select * into v_result
  from public.award_xp(v_user_id, v_xp_gain, 'lecon_terminee', 'lecon', p_lecon_id);

  return query select v_xp_gain, v_result.xp_total, v_result.niveau, v_result.level_up;
end;
$$;

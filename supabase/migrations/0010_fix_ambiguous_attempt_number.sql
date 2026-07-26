-- ============================================================
-- 0010_fix_ambiguous_attempt_number.sql
-- submit_quiz_attempt (0005) déclare `attempt_number` comme colonne de sortie
-- (RETURNS TABLE), ce qui en fait une variable implicite dans toute la
-- fonction. La requête `select max(attempt_number) from quiz_attempts`
-- devenait donc ambiguë entre cette variable et la colonne réelle de la
-- table — corrigé en qualifiant explicitement la colonne.
-- ============================================================

create or replace function public.submit_quiz_attempt(
  p_quiz_id uuid,
  p_reponses jsonb,
  p_duree_secondes integer default null
)
returns table (
  attempt_id uuid,
  score_pourcentage numeric,
  reussi boolean,
  attempt_number integer,
  details jsonb
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_lecon_id uuid;
  v_tentatives_max integer;
  v_note_passage integer;
  v_tentative_precedente integer;
  v_attempt_id uuid;
  v_total_points numeric := 0;
  v_points_obtenus numeric := 0;
  v_reponse jsonb;
  v_question record;
  v_is_correct boolean;
  v_points_question numeric;
  v_reponse_texte text;
  v_correct_option_ids uuid[];
  v_submitted_option_ids uuid[];
  v_ordered_correct_ids uuid[];
  v_pairs_correct jsonb;
  v_score numeric;
  v_reussi boolean;
  v_details jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  select lecon_id, tentatives_max, note_passage_pourcentage
    into v_lecon_id, v_tentatives_max, v_note_passage
  from public.quizzes where id = p_quiz_id;

  if v_lecon_id is null then
    raise exception 'Quiz introuvable';
  end if;

  if not public.is_lesson_unlocked(v_lecon_id, v_user_id) then
    raise exception 'Quiz verrouillé';
  end if;

  select max(qa.attempt_number) into v_tentative_precedente
  from public.quiz_attempts qa
  where qa.user_id = v_user_id and qa.quiz_id = p_quiz_id;

  if v_tentatives_max is not null
     and coalesce(v_tentative_precedente, 0) >= v_tentatives_max then
    raise exception 'Nombre maximum de tentatives atteint';
  end if;

  insert into public.quiz_attempts (user_id, quiz_id, attempt_number, duree_secondes)
  values (v_user_id, p_quiz_id, coalesce(v_tentative_precedente, 0) + 1, p_duree_secondes)
  returning id into v_attempt_id;

  for v_reponse in select * from jsonb_array_elements(p_reponses)
  loop
    select id, type, points, reponse_attendue, explication
      into v_question
    from public.questions
    where id = (v_reponse->>'question_id')::uuid;

    if v_question.id is null then
      continue;
    end if;

    v_points_question := v_question.points;
    v_total_points := v_total_points + v_points_question;
    v_is_correct := null;

    case v_question.type
      when 'qcm', 'vrai_faux', 'image' then
        select id into v_correct_option_ids
        from public.question_options
        where question_id = v_question.id and is_correct = true
        limit 1;

        v_is_correct := (v_reponse->>'reponse')::uuid = any(v_correct_option_ids);

      when 'choix_multiple' then
        select array_agg(id) into v_correct_option_ids
        from public.question_options
        where question_id = v_question.id and is_correct = true;

        select array_agg(value::uuid) into v_submitted_option_ids
        from jsonb_array_elements_text(v_reponse->'reponse');

        v_is_correct := (
          v_correct_option_ids is not null
          and v_submitted_option_ids is not null
          and v_correct_option_ids <@ v_submitted_option_ids
          and v_submitted_option_ids <@ v_correct_option_ids
        );

      when 'texte_libre' then
        v_reponse_texte := lower(trim(v_reponse->>'reponse'));
        v_is_correct := exists (
          select 1 from unnest(v_question.reponse_attendue) as attendu
          where lower(trim(attendu)) = v_reponse_texte
        );

      when 'ordonnancement' then
        select array_agg(id order by position_correcte) into v_ordered_correct_ids
        from public.question_options
        where question_id = v_question.id;

        select array_agg(value::uuid) into v_submitted_option_ids
        from jsonb_array_elements_text(v_reponse->'reponse');

        v_is_correct := (v_ordered_correct_ids = v_submitted_option_ids);

      when 'association' then
        select jsonb_object_agg(gauche, droite) into v_pairs_correct
        from public.question_pairs
        where question_id = v_question.id;

        v_is_correct := (v_pairs_correct = (v_reponse->'reponse'));

      when 'code' then
        v_is_correct := null;

      else
        v_is_correct := null;
    end case;

    if v_is_correct then
      v_points_obtenus := v_points_obtenus + v_points_question;
    end if;

    insert into public.quiz_attempt_answers (attempt_id, question_id, reponse, is_correct, points_obtenus)
    values (
      v_attempt_id,
      v_question.id,
      v_reponse->'reponse',
      v_is_correct,
      case when v_is_correct then v_points_question else 0 end
    );

    v_details := v_details || jsonb_build_object(
      'question_id', v_question.id,
      'is_correct', v_is_correct,
      'points_obtenus', case when v_is_correct then v_points_question else 0 end,
      'points_max', v_points_question,
      'explication', v_question.explication
    );
  end loop;

  v_score := case when v_total_points > 0
    then round((v_points_obtenus / v_total_points) * 100, 2)
    else 0
  end;
  v_reussi := v_score >= v_note_passage;

  update public.quiz_attempts
     set completed_at = now(),
         score_pourcentage = v_score,
         reussi = v_reussi
   where id = v_attempt_id;

  if v_reussi then
    perform public.complete_lesson(v_lecon_id, v_score::integer);
  end if;

  return query select v_attempt_id, v_score, v_reussi, coalesce(v_tentative_precedente, 0) + 1, v_details;
end;
$$;

revoke all on function public.submit_quiz_attempt(uuid, jsonb, integer) from public;
grant execute on function public.submit_quiz_attempt(uuid, jsonb, integer) to authenticated;

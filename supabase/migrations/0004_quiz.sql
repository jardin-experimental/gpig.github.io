-- ============================================================
-- 0004_quiz.sql
-- Un quiz est toujours rattaché à une leçon de type 'quiz'.
-- La correction se fait exclusivement côté serveur (fonction
-- security definer submit_quiz_attempt) : le client ne voit jamais
-- quelle réponse est correcte avant d'avoir soumis sa tentative.
-- ============================================================

create type public.question_type as enum (
  'qcm',            -- choix unique
  'choix_multiple', -- plusieurs bonnes réponses
  'vrai_faux',
  'texte_libre',
  'association',    -- relier gauche <-> droite
  'ordonnancement', -- remettre dans l'ordre
  'image',          -- choix unique parmi des images
  'code'            -- soumission de code (correction automatique non couverte ici, cf. note en fin de fichier)
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lecon_id uuid unique not null references public.lecons(id) on delete cascade,
  titre text not null,
  description text,
  temps_limite_secondes integer, -- null = pas de limite
  tentatives_max integer,        -- null = illimité
  note_passage_pourcentage integer not null default 50,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  type public.question_type not null,
  enonce text not null,
  explication text,           -- affichée après correction, quelle que soit la réponse
  image_url text,
  reponse_attendue text[],    -- utilisé uniquement pour 'texte_libre' (réponses acceptées, comparaison insensible à la casse)
  points integer not null default 1,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index questions_quiz_idx on public.questions (quiz_id, position);

-- Options : utilisées par qcm / choix_multiple / vrai_faux / image / ordonnancement
create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  contenu text,
  image_url text,
  is_correct boolean not null default false,      -- qcm / choix_multiple / vrai_faux / image
  position_correcte integer,                      -- ordonnancement uniquement
  position integer not null default 0,            -- ordre d'affichage (mélangé côté client si besoin)
  created_at timestamptz not null default now()
);

create index question_options_question_idx on public.question_options (question_id);

-- Paires correctes pour les questions de type 'association'
create table public.question_pairs (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  gauche text not null,
  droite text not null
);

create index question_pairs_question_idx on public.question_pairs (question_id);

-- Tentatives
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  attempt_number integer not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duree_secondes integer,
  score_pourcentage numeric(5,2),
  reussi boolean,
  unique (user_id, quiz_id, attempt_number)
);

create index quiz_attempts_user_quiz_idx on public.quiz_attempts (user_id, quiz_id);

create table public.quiz_attempt_answers (
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  reponse jsonb not null,
  is_correct boolean,          -- null pour 'code' : correction manuelle non encore implémentée
  points_obtenus numeric(5,2) not null default 0,
  primary key (attempt_id, question_id)
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_pairs enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;

-- Le quiz et l'énoncé des questions sont visibles si la leçon est débloquée
-- (même règle que lecon_contents : is_lesson_unlocked fait autorité)
create policy "Quiz visible if lesson unlocked"
  on public.quizzes for select
  using (public.is_lesson_unlocked(lecon_id, auth.uid()));

create policy "Questions visible if lesson unlocked"
  on public.questions for select
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and public.is_lesson_unlocked(q.lecon_id, auth.uid())
    )
  );

-- L'énoncé est visible avant de répondre, mais pas l'explication ni la
-- réponse attendue (texte libre) : ces colonnes ne sont révélées qu'après
-- soumission, dans le "details" jsonb renvoyé par submit_quiz_attempt.
revoke select on public.questions from authenticated;
grant select (id, quiz_id, type, enonce, image_url, points, position) on public.questions to authenticated;

-- Options visibles, mais SANS la colonne is_correct / position_correcte
-- (sécurité par privilège de colonne, pas seulement par ligne)
create policy "Options visible if lesson unlocked"
  on public.question_options for select
  using (
    exists (
      select 1 from public.questions qu
      join public.quizzes q on q.id = qu.quiz_id
      where qu.id = question_id and public.is_lesson_unlocked(q.lecon_id, auth.uid())
    )
  );

revoke select on public.question_options from authenticated;
grant select (id, question_id, contenu, image_url, position) on public.question_options to authenticated;
-- is_correct et position_correcte restent illisibles pour le rôle authenticated :
-- seule la fonction submit_quiz_attempt (security definer) peut les lire.

-- question_pairs : le client a besoin des libellés "gauche" à associer,
-- mais jamais de "droite" (qui constitue directement la réponse correcte —
-- les valeurs de droite existent déjà, sans le mapping, dans question_options.contenu)
create policy "Question pairs visible if lesson unlocked"
  on public.question_pairs for select
  using (
    exists (
      select 1 from public.questions qu
      join public.quizzes q on q.id = qu.quiz_id
      where qu.id = question_id and public.is_lesson_unlocked(q.lecon_id, auth.uid())
    )
  );

revoke select on public.question_pairs from authenticated;
grant select (id, question_id, gauche) on public.question_pairs to authenticated;

-- Tentatives : chacun voit et crée les siennes
create policy "Users see own attempts"
  on public.quiz_attempts for select
  using (auth.uid() = user_id);

create policy "Users see own attempt answers"
  on public.quiz_attempt_answers for select
  using (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

-- Aucun insert direct : tout passe par submit_quiz_attempt (security definer)
create policy "No direct attempt inserts" on public.quiz_attempts for insert with check (false);
create policy "No direct attempt answer inserts" on public.quiz_attempt_answers for insert with check (false);

-- ============================================================
-- NOTE — type 'code' :
-- la correction automatique de code nécessite un exécuteur sandboxé
-- (ex. conteneur éphémère par langage) qui n'est pas couvert par ce bloc.
-- Pour l'instant, submit_quiz_attempt (0005) enregistre la soumission avec
-- is_correct = null et points_obtenus = 0 ; un bloc dédié "correction de code"
-- sera nécessaire avant de l'utiliser en production.
-- ============================================================

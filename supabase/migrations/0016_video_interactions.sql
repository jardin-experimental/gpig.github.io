-- 0016_video_interactions.sql
-- Points d'interaction posés sur une vidéo de leçon (VdoCipher côté lecture).
-- Suit les mêmes conventions que lecon_contents / quizzes : contenu gated,
-- aucune écriture directe côté client, pas de nouvelle table de correction —
-- le type "quiz" pointe vers un quiz existant (Bloc 3) et passe donc par
-- submit_quiz_attempt / complete_lesson comme n'importe quel autre quiz.

create table if not exists public.video_interactions (
  id uuid primary key default gen_random_uuid(),
  lecon_id uuid not null references public.lecons(id) on delete cascade,
  timestamp_seconds numeric not null check (timestamp_seconds >= 0),
  type text not null check (type in ('quiz', 'texte', 'image')),
  quiz_id uuid references public.quizzes(id) on delete set null,
  titre text,
  contenu text,
  image_url text,
  pause_video boolean not null default true,
  created_at timestamptz not null default now(),

  constraint video_interactions_quiz_requires_quiz_id
    check (type <> 'quiz' or quiz_id is not null)
);

-- Une leçon a rarement plus de quelques dizaines d'interactions : un index
-- simple sur (lecon_id, timestamp_seconds) suffit pour l'affichage ordonné.
create index if not exists video_interactions_lecon_id_idx
  on public.video_interactions (lecon_id, timestamp_seconds);

alter table public.video_interactions enable row level security;

-- Lecture : mêmes règles d'accès qu'un contenu de leçon classique.
-- is_lesson_unlocked() est déjà la seule source de vérité (Bloc 2) —
-- on la réutilise plutôt que de dupliquer la logique de déblocage ici.
create policy "video_interactions_select_if_unlocked"
  on public.video_interactions
  for select
  using (public.is_lesson_unlocked(lecon_id, auth.uid()));

-- Écriture : aucun insert/update/delete direct depuis le client.
-- À terme, la création de ces interactions se fera depuis le back-office
-- (Bloc Administration, encore à construire côté formations) ou via une
-- fonction security definer dédiée, sur le même modèle que enrollments.
create policy "video_interactions_no_direct_write"
  on public.video_interactions
  for all
  using (false)
  with check (false);

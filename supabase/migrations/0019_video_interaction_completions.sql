-- 0019_video_interaction_completions.sql
-- Persiste quelles interactions un utilisateur a déjà "passées", pour
-- qu'elles ne réapparaissent pas après un refresh ou une nouvelle session,
-- et pour servir de référence au verrou anti-avance côté lecteur.

create table if not exists public.video_interaction_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  interaction_id uuid not null references public.video_interactions(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, interaction_id)
);

create index if not exists video_interaction_completions_user_idx
  on public.video_interaction_completions (user_id);

alter table public.video_interaction_completions enable row level security;

-- Chacun ne voit et n'écrit que ses propres lignes de progression —
-- pas besoin de security definer ici, c'est une écriture sur sa propre
-- progression comme lesson_progress, pas une donnée sensible partagée.
create policy "video_interaction_completions_own_select"
  on public.video_interaction_completions
  for select
  using (user_id = auth.uid());

create policy "video_interaction_completions_own_insert"
  on public.video_interaction_completions
  for insert
  with check (user_id = auth.uid());
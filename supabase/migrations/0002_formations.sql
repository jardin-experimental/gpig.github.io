-- ============================================================
-- 0002_formations.sql
-- Catégorie > Formation > Module > Chapitre > Leçon
-- Le contenu réel (vidéo/texte/ressources) est séparé des métadonnées
-- pour pouvoir afficher un catalogue public sans exposer le contenu payant.
-- ============================================================

create type public.lecon_type as enum ('video', 'exercice', 'quiz', 'telechargement', 'texte');
create type public.enrollment_source as enum ('achat', 'offert', 'abonnement');

-- 1. Catégories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nom text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2. Formations
create table public.formations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  slug text unique not null,
  titre text not null,
  description text,
  image_url text,
  is_premium boolean not null default true,
  prix_centimes integer default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index formations_category_idx on public.formations (category_id);
create index formations_published_idx on public.formations (is_published) where is_published = true;

-- 3. Modules
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.formations(id) on delete cascade,
  titre text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index modules_formation_idx on public.modules (formation_id, position);

-- 4. Chapitres
create table public.chapitres (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  titre text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index chapitres_module_idx on public.chapitres (module_id, position);

-- 5. Leçons (métadonnées uniquement — publiques dès que la formation est publiée)
create table public.lecons (
  id uuid primary key default gen_random_uuid(),
  chapitre_id uuid not null references public.chapitres(id) on delete cascade,
  titre text not null,
  type public.lecon_type not null default 'video',
  duree_minutes integer default 0,
  position integer not null default 0,
  is_free_preview boolean not null default false,
  created_at timestamptz not null default now()
);

create index lecons_chapitre_idx on public.lecons (chapitre_id, position);

-- 6. Contenu réel des leçons (gated — jamais exposé au catalogue)
create table public.lecon_contents (
  lecon_id uuid primary key references public.lecons(id) on delete cascade,
  video_url text,
  contenu_texte text,
  ressources jsonb default '[]'::jsonb -- [{ "nom": "...", "url": "..." }]
);

-- 7. Inscriptions (accès à une formation premium)
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  formation_id uuid not null references public.formations(id) on delete cascade,
  source public.enrollment_source not null default 'achat',
  enrolled_at timestamptz not null default now(),
  unique (user_id, formation_id)
);

create index enrollments_user_idx on public.enrollments (user_id);

-- 8. Progression (une leçon marquée terminée par un utilisateur)
create table public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lecon_id uuid not null references public.lecons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  score integer, -- utilisé pour les leçons de type 'quiz'
  primary key (user_id, lecon_id)
);

-- ============================================================
-- Fonctions de verrouillage / accès
-- ============================================================

-- Un utilisateur a-t-il accès à une formation (gratuite, ou premium + inscrit) ?
create function public.has_formation_access(p_formation_id uuid, p_user_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select
    case
      when p_user_id is null then false
      when public.is_admin(p_user_id) then true
      else (
        (select not is_premium from public.formations where id = p_formation_id)
        or exists (
          select 1 from public.enrollments
          where user_id = p_user_id and formation_id = p_formation_id
        )
      )
    end;
$$;

-- Une leçon donnée est-elle débloquée pour un utilisateur ?
-- Règle : la 1ère leçon de la formation est toujours accessible (preview),
-- les suivantes nécessitent que la leçon précédente (dans l'ordre global) soit terminée.
create function public.is_lesson_unlocked(p_lecon_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
stable
as $$
declare
  v_formation_id uuid;
  v_previous_lecon_id uuid;
  v_is_free boolean;
begin
  select f.id, l.is_free_preview
    into v_formation_id, v_is_free
  from public.lecons l
  join public.chapitres c on c.id = l.chapitre_id
  join public.modules m on m.id = c.module_id
  join public.formations f on f.id = m.formation_id
  where l.id = p_lecon_id;

  if v_is_free then
    return true;
  end if;

  if not public.has_formation_access(v_formation_id, p_user_id) then
    return false;
  end if;

  -- Ordre global : module.position, puis chapitre.position, puis lecon.position
  with ordered as (
    select l.id,
           row_number() over (
             order by m.position, c.position, l.position
           ) as rang
    from public.lecons l
    join public.chapitres c on c.id = l.chapitre_id
    join public.modules m on m.id = c.module_id
    where m.formation_id = v_formation_id
  )
  select o_prev.id into v_previous_lecon_id
  from ordered o_target
  join ordered o_prev on o_prev.rang = o_target.rang - 1
  where o_target.id = p_lecon_id;

  -- Pas de leçon précédente => c'est la première => débloquée
  if v_previous_lecon_id is null then
    return true;
  end if;

  return exists (
    select 1 from public.lesson_progress
    where user_id = p_user_id and lecon_id = v_previous_lecon_id
  );
end;
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.categories enable row level security;
alter table public.formations enable row level security;
alter table public.modules enable row level security;
alter table public.chapitres enable row level security;
alter table public.lecons enable row level security;
alter table public.lecon_contents enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

-- Catalogue public : catégories, formations publiées, modules/chapitres/leçons (métadonnées) associés
create policy "Categories are public" on public.categories for select using (true);

create policy "Published formations are public"
  on public.formations for select
  using (is_published = true or public.is_admin(auth.uid()));

create policy "Modules of published formations are public"
  on public.modules for select
  using (
    exists (
      select 1 from public.formations f
      where f.id = formation_id and (f.is_published or public.is_admin(auth.uid()))
    )
  );

create policy "Chapitres of published formations are public"
  on public.chapitres for select
  using (
    exists (
      select 1 from public.modules m
      join public.formations f on f.id = m.formation_id
      where m.id = module_id and (f.is_published or public.is_admin(auth.uid()))
    )
  );

create policy "Lecons metadata is public"
  on public.lecons for select
  using (
    exists (
      select 1 from public.chapitres c
      join public.modules m on m.id = c.module_id
      join public.formations f on f.id = m.formation_id
      where c.id = chapitre_id and (f.is_published or public.is_admin(auth.uid()))
    )
  );

-- Contenu gated : uniquement si la leçon est débloquée pour l'utilisateur courant
create policy "Lecon content requires unlock"
  on public.lecon_contents for select
  using (public.is_lesson_unlocked(lecon_id, auth.uid()));

-- Inscriptions : un utilisateur ne voit que les siennes
create policy "Users see own enrollments"
  on public.enrollments for select
  using (auth.uid() = user_id);

-- Aucun insert direct : les inscriptions sont créées par la logique serveur
-- (webhook Stripe côté service_role, cf. bloc Paiement)
create policy "No direct enrollment inserts"
  on public.enrollments for insert
  with check (false);

-- Progression : un utilisateur gère la sienne
create policy "Users see own progress"
  on public.lesson_progress for select
  using (auth.uid() = user_id);

create policy "Users insert own progress"
  on public.lesson_progress for insert
  with check (
    auth.uid() = user_id
    and public.is_lesson_unlocked(lecon_id, auth.uid())
  );

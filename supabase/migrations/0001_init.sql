-- ============================================================
-- 0001_init.sql
-- Rôles utilisateurs + table profiles + RLS
-- Supabase : auth.users existe déjà nativement, on l'étend via profiles
-- ============================================================

-- 1. Enum des rôles
create type public.user_role as enum (
  'visiteur',
  'membre',
  'etudiant',
  'client',
  'coach',
  'administrateur'
);

-- 2. Table profiles (1-1 avec auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  role public.user_role not null default 'visiteur',
  xp integer not null default 0,
  level integer not null default 1,
  streak_count integer not null default 0,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index pour les classements (leaderboard) et recherche par username
create index profiles_xp_idx on public.profiles (xp desc);
create index profiles_username_idx on public.profiles (username);

-- 3. Trigger : création automatique du profil à l'inscription
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Trigger : updated_at automatique
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- 5. Row Level Security
alter table public.profiles enable row level security;

-- Tout le monde peut lire les profils publics (pour le fil communauté, classements...)
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

-- Un utilisateur ne peut modifier que son propre profil
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Personne ne peut modifier role/xp/level directement depuis le client
-- (ces colonnes sont gérées uniquement par des fonctions "security definer" côté serveur)
revoke update (role, xp, level) on public.profiles from authenticated;

-- Insertion réservée au trigger système (pas d'insert direct côté client)
create policy "No direct inserts"
  on public.profiles for insert
  with check (false);

-- 6. Fonction utilitaire : vérifier le rôle admin (à réutiliser dans d'autres policies)
create function public.is_admin(user_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'administrateur'
  );
$$;

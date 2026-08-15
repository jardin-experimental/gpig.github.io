-- Table des chasses au trésor géolocalisées (voir app/ar/chasse/page.tsx).
-- Chaque ligne = un indice à trouver, réutilisable via son "slug" dans
-- l'URL au lieu de tout écrire à la main (lat/lng/url...) à chaque fois.

create table if not exists public.chasses_ar (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  latitude double precision not null,
  longitude double precision not null,
  rayon_metres integer not null default 15,
  tolerance_angle integer not null default 35,
  url_destination text not null,
  formation_id uuid references public.formations(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.chasses_ar is
  'Chasses au trésor géolocalisées (GPS + boussole) consultées depuis /ar/chasse?slug=...';

alter table public.chasses_ar enable row level security;

-- Lecture publique des chasses actives uniquement — nécessaire car la page
-- /ar/chasse est un composant client qui interroge Supabase directement
-- avec la clé anonyme (même principe que les formations publiées).
create policy "Chasses actives visibles par tous"
  on public.chasses_ar
  for select
  using (is_active = true);

-- Écriture réservée aux admins (même pattern que le reste du back-office).
-- ⚠️ Vérifie que 'admin' correspond bien à la valeur exacte utilisée dans
-- ta colonne profiles.role — ajuste cette chaîne si besoin.
create policy "Admins gèrent les chasses"
  on public.chasses_ar
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'administrateur'
    )
  );

create index if not exists chasses_ar_slug_idx on public.chasses_ar (slug);

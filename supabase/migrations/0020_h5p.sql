-- À adapter aux noms réels de colonnes de ta table atomes_ledger si différents.
-- Objectif : empêcher qu'un même contenu H5P soit crédité plusieurs fois pour le même utilisateur.

-- Index pour accélérer la vérification anti-doublon faite dans la route API
create index if not exists idx_atomes_ledger_user_raison
  on atomes_ledger (user_id, raison);

-- Anti-doublon strict au niveau base, mais SCOPÉ aux lignes H5P uniquement
-- (index unique partiel : ne s'applique pas aux achats de packs en boutique,
-- où une même "raison" comme "shop:pack-10h" peut légitimement se répéter)
create unique index if not exists uniq_user_h5p_raison
  on atomes_ledger (user_id, raison)
  where raison like 'h5p:%';

-- Si tu veux stocker les tentatives H5P séparément (historique complet, pas juste le crédit retenu) :
create table if not exists h5p_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  lesson_id text not null,
  score numeric not null,
  raw_score numeric,
  max_score numeric,
  verb text,
  created_at timestamptz not null default now()
);

create index if not exists idx_h5p_attempts_user on h5p_attempts (user_id);
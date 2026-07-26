-- ============================================================
-- 0006_paiement.sql
-- Stripe reste la source de vérité pour l'état des paiements ;
-- ces tables sont une projection locale, alimentée uniquement par le
-- webhook Stripe (rôle service_role, qui contourne RLS — d'où l'absence
-- volontaire de policy d'insertion pour le rôle authenticated).
-- ============================================================

create type public.order_type as enum ('formation', 'abonnement', 'pack', 'bon_cadeau');
create type public.order_statut as enum ('en_attente', 'paye', 'rembourse', 'echoue');
create type public.subscription_statut as enum ('active', 'en_pause', 'annulee', 'impayee');

alter table public.formations
  add column stripe_product_id text,
  add column stripe_price_id text,
  add column tva_taux numeric(4,2) not null default 20.00; -- TVA France par défaut, ajustable par formation

alter table public.profiles add column credit_centimes integer not null default 0;
revoke update (credit_centimes) on public.profiles from authenticated;

-- Commandes (paiement unique, pack, bon cadeau)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  formation_id uuid references public.formations(id) on delete set null,
  type public.order_type not null,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  montant_centimes integer not null,
  tva_centimes integer not null default 0,
  devise text not null default 'eur',
  code_promo text,
  statut public.order_statut not null default 'en_attente',
  created_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_session_idx on public.orders (stripe_session_id);

-- Abonnements (packs annuels type "Au menu")
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  plan text not null,
  statut public.subscription_statut not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id);

-- Bons cadeaux : soit un montant, soit un accès direct à une formation précise
create table public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  formation_id uuid references public.formations(id) on delete set null,
  montant_centimes integer,
  purchased_by uuid references public.profiles(id) on delete set null,
  redeemed_by uuid references public.profiles(id) on delete set null,
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint gift_card_has_target check (formation_id is not null or montant_centimes is not null)
);

create index gift_cards_code_idx on public.gift_cards (code);

-- ============================================================
-- RLS
-- ============================================================

alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;
alter table public.gift_cards enable row level security;

create policy "Users see own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users see own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);

-- Un bon cadeau non utilisé n'est PAS listable (on ne veut pas qu'un utilisateur
-- parcoure les codes) : uniquement consultable par code exact via la fonction
-- redeem_gift_card. On autorise juste à voir ceux qu'on a soi-même achetés ou utilisés.
create policy "Users see gift cards they purchased or redeemed"
  on public.gift_cards for select
  using (auth.uid() = purchased_by or auth.uid() = redeemed_by);

-- Aucun insert/update direct depuis le client : tout passe par le webhook
-- (service_role) ou par la fonction redeem_gift_card (security definer)
create policy "No direct order writes" on public.orders for insert with check (false);
create policy "No direct subscription writes" on public.subscriptions for insert with check (false);
create policy "No direct gift card writes" on public.gift_cards for insert with check (false);

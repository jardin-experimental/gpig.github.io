-- ============================================================
-- 0013_boutique.sql
-- Boutique d'objets scientifiques : catalogue, monnaie "Atomes",
-- panier persistant, commandes.
--
-- Deux familles de produits :
--   - numérique : payé en Atomes (monnaie du jeu, achetée par packs
--     via Stripe) ou parfois directement en euros pour du contenu premium
--   - physique : payé en euros via Stripe, expédié via un prestataire
--     print-on-demand externe (Printful/Gelato/... — pas géré ici,
--     juste préparé côté données : voir colonnes pod_*)
--
-- Les Atomes ne servent jamais à payer du physique : on garde une
-- séparation stricte pour ne pas mélanger monnaie virtuelle et
-- comptabilité/TVA réelle.
-- ============================================================

alter type public.order_type add value 'pack_atomes';
alter type public.order_type add value 'boutique';

create type public.produit_type as enum ('numerique', 'physique');

create table public.produits (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nom text not null,
  description text,
  categorie text not null,             -- 'cosmetique' | 'boost' | 'contenu' | 'poster' | 'textile' | ...
  type public.produit_type not null,
  prix_atomes integer,                 -- rempli si achetable en Atomes (numérique uniquement)
  prix_centimes integer,                -- rempli si achetable en euros (physique, ou numérique premium)
  image_url text,
  disponible boolean not null default true,
  -- Print-on-demand : identifiants chez le prestataire externe, à
  -- renseigner quand un fournisseur (Printful/Gelato/...) est choisi.
  pod_provider text,
  pod_variant_id text,
  created_at timestamptz not null default now(),
  constraint produit_prix_coherent check (
    (type = 'numerique' and (prix_atomes is not null or prix_centimes is not null))
    or (type = 'physique' and prix_centimes is not null)
  )
);

create index produits_categorie_idx on public.produits (categorie);
create index produits_type_idx on public.produits (type);

-- Historique du solde d'Atomes, même modèle que consultation_credits_ledger :
-- montant positif = crédit (achat de pack, récompense), négatif = dépense.
create table public.atomes_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  montant integer not null,
  raison text not null,                -- 'achat_pack' | 'recompense_formation' | 'achat_boutique' | 'remboursement'
  reference_id uuid,
  stripe_session_id text,
  created_at timestamptz not null default now()
);

create index atomes_ledger_user_idx on public.atomes_ledger (user_id, created_at desc);

-- Panier persistant (1 ligne par produit par utilisateur).
create table public.panier_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  produit_id uuid not null references public.produits(id) on delete cascade,
  quantite integer not null default 1 check (quantite > 0),
  created_at timestamptz not null default now(),
  unique (user_id, produit_id)
);

-- Une commande boutique peut contenir plusieurs produits (contrairement
-- à `orders` qui gère un item unique pour formations/consultations).
-- Le prix est snapshotté au moment de l'achat pour ne jamais dépendre
-- d'un changement de tarif ultérieur du produit.
create table public.boutique_commande_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  produit_id uuid not null references public.produits(id),
  quantite integer not null,
  prix_unitaire_centimes integer,
  prix_unitaire_atomes integer
);

create index boutique_commande_items_order_idx on public.boutique_commande_items (order_id);

-- ============================================================
-- RLS
-- ============================================================

alter table public.produits enable row level security;
alter table public.atomes_ledger enable row level security;
alter table public.panier_items enable row level security;
alter table public.boutique_commande_items enable row level security;

-- create policy "Catalogue visible par tous"
--   on public.produits for select
--   to authenticated
--   using (disponible = true or public.is_admin(auth.uid()));

create policy "Catalogue visible par tous"
  on public.produits for select
  to authenticated, anon
  using (disponible = true);

create policy "Admin gère le catalogue"
  on public.produits for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Users see own atomes ledger"
  on public.atomes_ledger for select
  using (auth.uid() = user_id);

create policy "No direct atomes ledger writes"
  on public.atomes_ledger for insert with check (false);

create policy "Users manage own panier"
  on public.panier_items for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users see own commande items"
  on public.boutique_commande_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = boutique_commande_items.order_id
        and orders.user_id = auth.uid()
    )
    or public.is_admin(auth.uid())
  );

create policy "No direct commande items writes"
  on public.boutique_commande_items for insert with check (false);

-- ============================================================
-- Fonctions
-- ============================================================

-- Solde d'Atomes de l'utilisateur connecté.
create function public.mes_atomes_disponibles()
returns integer
language sql
security definer set search_path = public
stable
as $$
  select coalesce(sum(montant), 0)::integer from public.atomes_ledger
  where user_id = auth.uid();
$$;

-- Ajoute (ou incrémente) un produit dans le panier de l'utilisateur connecté.
create function public.ajouter_au_panier(p_produit_id uuid, p_quantite integer default 1)
returns public.panier_items
language plpgsql
security definer set search_path = public
as $$
declare
  v_item public.panier_items;
  v_disponible boolean;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  if p_quantite < 1 then
    raise exception 'Quantité invalide';
  end if;

  select disponible into v_disponible from public.produits where id = p_produit_id;

  if v_disponible is null or v_disponible = false then
    raise exception 'Ce produit n''est plus disponible.';
  end if;

  insert into public.panier_items (user_id, produit_id, quantite)
  values (auth.uid(), p_produit_id, p_quantite)
  on conflict (user_id, produit_id)
    do update set quantite = panier_items.quantite + excluded.quantite
  returning * into v_item;

  return v_item;
end;
$$;

-- Fixe la quantité d'un item du panier ; une quantité <= 0 le retire.
create function public.modifier_quantite_panier(p_produit_id uuid, p_quantite integer)
returns public.panier_items
language plpgsql
security definer set search_path = public
as $$
declare
  v_item public.panier_items;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  if p_quantite <= 0 then
    delete from public.panier_items
    where user_id = auth.uid() and produit_id = p_produit_id;
    return null;
  end if;

  update public.panier_items
  set quantite = p_quantite
  where user_id = auth.uid() and produit_id = p_produit_id
  returning * into v_item;

  if v_item.id is null then
    raise exception 'Cet article n''est pas dans le panier.';
  end if;

  return v_item;
end;
$$;

create function public.vider_panier()
returns void
language sql
security definer set search_path = public
as $$
  delete from public.panier_items where user_id = auth.uid();
$$;

-- Valide en une seule transaction toute la partie du panier payable en
-- Atomes (produits numériques avec prix_atomes renseigné) : débite le
-- solde, crée la commande + ses lignes, retire ces articles du panier.
-- Les articles physiques du panier ne sont pas touchés ici : ils passent
-- par un checkout Stripe séparé (préparé côté serveur, voir
-- preparer_commande_panier_physique).
--
-- NOTE : le déblocage effectif de l'accès (appliquer un cosmétique,
-- débloquer un PDF, créditer un boost...) dépend de la catégorie du
-- produit et n'est pas encore câblé ici — à faire dans une passe dédiée
-- une fois les catégories de produits réelles définies.
create function public.acheter_panier_atomes()
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_solde integer;
  v_total integer;
  v_order public.orders;
begin
  if v_user is null then
    raise exception 'Non authentifié';
  end if;

  select coalesce(sum(pi.quantite * p.prix_atomes), 0)
  into v_total
  from public.panier_items pi
  join public.produits p on p.id = pi.produit_id
  where pi.user_id = v_user
    and p.type = 'numerique'
    and p.prix_atomes is not null;

  if v_total <= 0 then
    raise exception 'Aucun article payable en Atomes dans le panier.';
  end if;

  select coalesce(sum(montant), 0) into v_solde
  from public.atomes_ledger where user_id = v_user;

  if v_solde < v_total then
    raise exception 'Solde d''Atomes insuffisant.';
  end if;

  insert into public.orders (user_id, type, montant_centimes, devise, statut)
  values (v_user, 'boutique', 0, 'eur', 'paye')
  returning * into v_order;

  insert into public.boutique_commande_items (order_id, produit_id, quantite, prix_unitaire_atomes)
  select v_order.id, p.id, pi.quantite, p.prix_atomes
  from public.panier_items pi
  join public.produits p on p.id = pi.produit_id
  where pi.user_id = v_user
    and p.type = 'numerique'
    and p.prix_atomes is not null;

  insert into public.atomes_ledger (user_id, montant, raison, reference_id)
  values (v_user, -v_total, 'achat_boutique', v_order.id);

  delete from public.panier_items pi
  using public.produits p
  where pi.produit_id = p.id
    and pi.user_id = v_user
    and p.type = 'numerique'
    and p.prix_atomes is not null;

  return v_order;
end;
$$;

-- Snapshotte les articles physiques du panier dans une commande
-- 'en_attente' (même logique que le hold des créneaux de consultation :
-- on fige les prix et les lignes avant de partir vers Stripe). Le webhook
-- se contente ensuite de faire passer cette commande à 'paye' via son id
-- transmis en metadata Stripe.
create function public.preparer_commande_panier_physique()
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_total integer;
  v_order public.orders;
begin
  if v_user is null then
    raise exception 'Non authentifié';
  end if;

  select coalesce(sum(pi.quantite * p.prix_centimes), 0)
  into v_total
  from public.panier_items pi
  join public.produits p on p.id = pi.produit_id
  where pi.user_id = v_user
    and p.type = 'physique';

  if v_total <= 0 then
    raise exception 'Aucun article physique dans le panier.';
  end if;

  insert into public.orders (user_id, type, montant_centimes, devise, statut)
  values (v_user, 'boutique', v_total, 'eur', 'en_attente')
  returning * into v_order;

  insert into public.boutique_commande_items (order_id, produit_id, quantite, prix_unitaire_centimes)
  select v_order.id, p.id, pi.quantite, p.prix_centimes
  from public.panier_items pi
  join public.produits p on p.id = pi.produit_id
  where pi.user_id = v_user
    and p.type = 'physique';

  return v_order;
end;
$$;

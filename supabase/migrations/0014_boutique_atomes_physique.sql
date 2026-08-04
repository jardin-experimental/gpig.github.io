-- ============================================================
-- 0014_boutique_atomes_physique.sql
--
-- Permet de payer des articles physiques en Atomes (en plus du
-- numérique). Comme il n'y a plus systématiquement de session Stripe
-- pour collecter l'adresse, on stocke une adresse de livraison
-- directement sur la commande, remplie soit par le webhook Stripe
-- (paiement en euros), soit par le formulaire du panier (paiement en
-- Atomes).
--
-- Règle de répartition entre les deux boutons du panier, pour éviter
-- qu'un même article à double tarif (Atomes + euros) ne se retrouve
-- des deux côtés en même temps : un article payable en Atomes
-- (prix_atomes renseigné, numérique ou physique) passe uniquement par
-- "Payer en Atomes". Le circuit Stripe/euros ne concerne que les
-- articles physiques SANS prix en Atomes.
-- ============================================================

alter table public.orders add column adresse_livraison jsonb;

-- Remplace acheter_panier_atomes : couvre maintenant tout article
-- (numérique ou physique) ayant un prix_atomes renseigné, et exige une
-- adresse de livraison dès qu'un article physique est concerné.
create or replace function public.acheter_panier_atomes(p_adresse jsonb default null)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_solde integer;
  v_total integer;
  v_a_du_physique boolean;
  v_order public.orders;
begin
  if v_user is null then
    raise exception 'Non authentifié';
  end if;

  select
    coalesce(sum(pi.quantite * p.prix_atomes), 0),
    coalesce(bool_or(p.type = 'physique'), false)
  into v_total, v_a_du_physique
  from public.panier_items pi
  join public.produits p on p.id = pi.produit_id
  where pi.user_id = v_user
    and p.prix_atomes is not null;

  if v_total <= 0 then
    raise exception 'Aucun article payable en Atomes dans le panier.';
  end if;

  if v_a_du_physique and (p_adresse is null or p_adresse = '{}'::jsonb) then
    raise exception 'Une adresse de livraison est requise pour les articles physiques.';
  end if;

  select coalesce(sum(montant), 0) into v_solde
  from public.atomes_ledger where user_id = v_user;

  if v_solde < v_total then
    raise exception 'Solde d''Atomes insuffisant.';
  end if;

  insert into public.orders (user_id, type, montant_centimes, devise, statut, adresse_livraison)
  values (v_user, 'boutique', 0, 'eur', 'paye', p_adresse)
  returning * into v_order;

  insert into public.boutique_commande_items (order_id, produit_id, quantite, prix_unitaire_atomes)
  select v_order.id, p.id, pi.quantite, p.prix_atomes
  from public.panier_items pi
  join public.produits p on p.id = pi.produit_id
  where pi.user_id = v_user
    and p.prix_atomes is not null;

  insert into public.atomes_ledger (user_id, montant, raison, reference_id)
  values (v_user, -v_total, 'achat_boutique', v_order.id);

  delete from public.panier_items pi
  using public.produits p
  where pi.produit_id = p.id
    and pi.user_id = v_user
    and p.prix_atomes is not null;

  return v_order;
end;
$$;

-- Le circuit Stripe/physique ne doit plus ramasser les articles qui ont
-- aussi un prix en Atomes (ils passent désormais par acheter_panier_atomes).
create or replace function public.preparer_commande_panier_physique()
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
    and p.type = 'physique'
    and p.prix_atomes is null;

  if v_total <= 0 then
    raise exception 'Aucun article physique payable en euros dans le panier.';
  end if;

  insert into public.orders (user_id, type, montant_centimes, devise, statut)
  values (v_user, 'boutique', v_total, 'eur', 'en_attente')
  returning * into v_order;

  insert into public.boutique_commande_items (order_id, produit_id, quantite, prix_unitaire_centimes)
  select v_order.id, p.id, pi.quantite, p.prix_centimes
  from public.panier_items pi
  join public.produits p on p.id = pi.produit_id
  where pi.user_id = v_user
    and p.type = 'physique'
    and p.prix_atomes is null;

  return v_order;
end;
$$;

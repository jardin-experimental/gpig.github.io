-- ============================================================
-- 0012_consultations.sql
-- Réservation d'appels vidéo (Zoom) avec le scientifique (rôle 'administrateur').
-- Deux offres :
--   - l'heure à l'unité (85€), payée directement pour un créneau précis
--   - le forfait 10h (800€), qui crédite des heures consommées ensuite
--     librement sur n'importe quel créneau libre du planning
--
-- Le planning est un calendrier de créneaux d'1h ouverts manuellement par le
-- scientifique. La réservation "à l'unité" passe par un statut intermédiaire
-- 'en_attente_paiement' (créé avant la redirection Stripe) pour éviter que
-- deux personnes paient pour le même créneau ; ce statut expire tout seul
-- (hold_expires_at) si le paiement n'aboutit pas.
-- ============================================================

alter type public.order_type add value 'consultation_heure';
alter type public.order_type add value 'consultation_pack10h';

create type public.consultation_statut as enum (
  'libre',
  'en_attente_paiement',
  'reservee',
  'annulee'
);

create table public.consultation_slots (
  id uuid primary key default gen_random_uuid(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  statut public.consultation_statut not null default 'libre',
  user_id uuid references public.profiles(id) on delete set null,
  source text, -- 'stripe_heure' | 'credit_pack', renseigné à la réservation
  hold_expires_at timestamptz,
  stripe_session_id text,
  zoom_meeting_id text,
  zoom_join_url text,
  zoom_start_url text,
  created_at timestamptz not null default now(),
  constraint consultation_slot_duree check (end_at > start_at)
);

create index consultation_slots_start_idx on public.consultation_slots (start_at);
create index consultation_slots_user_idx on public.consultation_slots (user_id);

-- Un seul créneau actif (non annulé) par horaire de début : évite les doublons
-- lors de la création du planning par le scientifique.
create unique index consultation_slots_no_overlap_idx
  on public.consultation_slots (start_at) where statut <> 'annulee';

-- Historique des crédits d'heures (forfait 10h), sur le modèle de xp_ledger :
-- montant positif = achat, négatif = consommation à la réservation.
create table public.consultation_credits_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  heures numeric(5,1) not null,
  raison text not null, -- 'achat_pack10h' | 'reservation_creneau' | 'annulation_creneau'
  reference_id uuid,    -- id du créneau le cas échéant
  stripe_session_id text,
  created_at timestamptz not null default now()
);

create index consultation_credits_user_idx on public.consultation_credits_ledger (user_id, created_at desc);

-- ============================================================
-- RLS
-- ============================================================

alter table public.consultation_slots enable row level security;
alter table public.consultation_credits_ledger enable row level security;

-- Planning visible par tous les connectés : créneaux libres (y compris les
-- réservations provisoires expirées, redevenues disponibles de fait), ses
-- propres réservations, et tout pour le scientifique (administrateur).
create policy "Planning visible"
  on public.consultation_slots for select
  to authenticated
  using (
    statut = 'libre'
    or (statut = 'en_attente_paiement' and hold_expires_at < now())
    or user_id = auth.uid()
    or public.is_admin(auth.uid())
  );

-- Seul le scientifique gère le planning directement (ouverture/suppression
-- de créneaux). Les réservations elles-mêmes passent uniquement par les
-- fonctions ci-dessous ou par le webhook Stripe (service_role, hors RLS).
create policy "Admin gère le planning"
  on public.consultation_slots for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Users see own credits" on public.consultation_credits_ledger
  for select using (auth.uid() = user_id);

create policy "No direct credit ledger writes"
  on public.consultation_credits_ledger for insert with check (false);

-- ============================================================
-- Fonctions
-- ============================================================

-- Solde d'heures de forfait de l'utilisateur connecté.
create function public.mes_heures_consultation_disponibles()
returns numeric
language sql
security definer set search_path = public
stable
as $$
  select coalesce(sum(heures), 0) from public.consultation_credits_ledger
  where user_id = auth.uid();
$$;

-- Pose une réservation provisoire (30 min) le temps du paiement Stripe pour
-- un créneau payé à l'unité. Échoue si le créneau n'est plus disponible.
create function public.hold_consultation_slot(p_slot_id uuid)
returns public.consultation_slots
language plpgsql
security definer set search_path = public
as $$
declare
  v_slot public.consultation_slots;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  update public.consultation_slots
  set statut = 'en_attente_paiement',
      user_id = auth.uid(),
      source = 'stripe_heure',
      hold_expires_at = now() + interval '30 minutes',
      stripe_session_id = null,
      zoom_meeting_id = null,
      zoom_join_url = null,
      zoom_start_url = null
  where id = p_slot_id
    and start_at > now()
    and (
      statut = 'libre'
      or (statut = 'en_attente_paiement' and hold_expires_at < now())
    )
  returning * into v_slot;

  if v_slot.id is null then
    raise exception 'Ce créneau n''est plus disponible.';
  end if;

  return v_slot;
end;
$$;

-- Réserve un créneau en consommant 1h du forfait de l'utilisateur connecté.
-- Débit du crédit et passage du créneau à 'reservee' dans la même transaction.
create function public.book_consultation_slot_with_credit(p_slot_id uuid)
returns public.consultation_slots
language plpgsql
security definer set search_path = public
as $$
declare
  v_slot public.consultation_slots;
  v_solde numeric;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  select coalesce(sum(heures), 0) into v_solde
  from public.consultation_credits_ledger
  where user_id = auth.uid();

  if v_solde < 1 then
    raise exception 'Crédit d''heures insuffisant.';
  end if;

  update public.consultation_slots
  set statut = 'reservee',
      user_id = auth.uid(),
      source = 'credit_pack',
      hold_expires_at = null,
      stripe_session_id = null
  where id = p_slot_id
    and start_at > now()
    and (
      statut = 'libre'
      or (statut = 'en_attente_paiement' and hold_expires_at < now())
    )
  returning * into v_slot;

  if v_slot.id is null then
    raise exception 'Ce créneau n''est plus disponible.';
  end if;

  insert into public.consultation_credits_ledger (user_id, heures, raison, reference_id)
  values (auth.uid(), -1, 'reservation_creneau', v_slot.id);

  return v_slot;
end;
$$;

-- Enregistre les informations Zoom une fois la réunion créée côté application
-- (l'appel à l'API Zoom ne peut pas se faire depuis Postgres). Restreint au
-- propriétaire de la réservation ou à l'administrateur.
create function public.set_consultation_slot_zoom(
  p_slot_id uuid,
  p_zoom_meeting_id text,
  p_zoom_join_url text,
  p_zoom_start_url text
)
returns public.consultation_slots
language plpgsql
security definer set search_path = public
as $$
declare
  v_slot public.consultation_slots;
begin
  update public.consultation_slots
  set zoom_meeting_id = p_zoom_meeting_id,
      zoom_join_url = p_zoom_join_url,
      zoom_start_url = p_zoom_start_url
  where id = p_slot_id
    and (user_id = auth.uid() or public.is_admin(auth.uid()))
  returning * into v_slot;

  if v_slot.id is null then
    raise exception 'Créneau introuvable.';
  end if;

  return v_slot;
end;
$$;

-- Annule une réservation : l'administrateur peut toujours annuler ; le
-- titulaire peut annuler la sienne jusqu'à 24h avant le rendez-vous. Rembourse
-- le crédit d'heure s'il avait été consommé depuis un forfait.
create function public.cancel_consultation_slot(p_slot_id uuid)
returns public.consultation_slots
language plpgsql
security definer set search_path = public
as $$
declare
  v_slot public.consultation_slots;
  v_est_admin boolean;
begin
  select public.is_admin(auth.uid()) into v_est_admin;

  select * into v_slot from public.consultation_slots where id = p_slot_id;

  if v_slot.id is null then
    raise exception 'Créneau introuvable.';
  end if;

  if not v_est_admin then
    if v_slot.user_id is distinct from auth.uid() then
      raise exception 'Vous ne pouvez annuler que vos propres réservations.';
    end if;
    if v_slot.start_at < now() + interval '24 hours' then
      raise exception 'Annulation possible jusqu''à 24h avant le rendez-vous.';
    end if;
  end if;

  if v_slot.source = 'credit_pack' then
    insert into public.consultation_credits_ledger (user_id, heures, raison, reference_id)
    values (v_slot.user_id, 1, 'annulation_creneau', v_slot.id);
  end if;

  update public.consultation_slots
  set statut = 'libre',
      user_id = null,
      source = null,
      hold_expires_at = null,
      stripe_session_id = null,
      zoom_meeting_id = null,
      zoom_join_url = null,
      zoom_start_url = null
  where id = p_slot_id
  returning * into v_slot;

  return v_slot;
end;
$$;

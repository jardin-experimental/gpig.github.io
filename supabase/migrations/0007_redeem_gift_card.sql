-- ============================================================
-- 0007_redeem_gift_card.sql
-- Deux cas : bon cadeau lié à une formation précise (accès direct)
-- ou bon cadeau à montant libre (crédit appliqué au prochain achat).
-- ============================================================

create function public.redeem_gift_card(p_code text)
returns table (type text, formation_slug text, credit_ajoute integer)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_card record;
  v_formation_slug text;
begin
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  select * into v_card from public.gift_cards where code = p_code for update;

  if v_card.id is null then
    raise exception 'Code invalide';
  end if;

  if v_card.redeemed_at is not null then
    raise exception 'Ce bon cadeau a déjà été utilisé';
  end if;

  if v_card.expires_at is not null and v_card.expires_at < now() then
    raise exception 'Ce bon cadeau a expiré';
  end if;

  update public.gift_cards
     set redeemed_by = v_user_id, redeemed_at = now()
   where id = v_card.id;

  if v_card.formation_id is not null then
    insert into public.enrollments (user_id, formation_id, source)
    values (v_user_id, v_card.formation_id, 'offert')
    on conflict (user_id, formation_id) do nothing;

    select slug into v_formation_slug from public.formations where id = v_card.formation_id;

    return query select 'formation'::text, v_formation_slug, 0;
  else
    update public.profiles
       set credit_centimes = credit_centimes + v_card.montant_centimes
     where id = v_user_id;

    return query select 'credit'::text, null::text, v_card.montant_centimes;
  end if;
end;
$$;

revoke all on function public.redeem_gift_card(text) from public;
grant execute on function public.redeem_gift_card(text) to authenticated;

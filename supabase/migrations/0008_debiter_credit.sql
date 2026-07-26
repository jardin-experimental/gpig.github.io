create function public.debiter_credit(p_montant_centimes integer)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  update public.profiles
     set credit_centimes = greatest(0, credit_centimes - p_montant_centimes)
   where id = v_user_id;
end;
$$;

revoke all on function public.debiter_credit(integer) from public;
grant execute on function public.debiter_credit(integer) to authenticated;

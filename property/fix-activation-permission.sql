-- Activation is atomic and enforced in the database rather than trusting browser-side counters.
create or replace function public.activate_listing(p_listing_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.lg_listings%rowtype;
  v_usage public.lg_founder_usage%rowtype;
  v_month text := to_char(now() at time zone 'UTC','YYYY-MM');
begin
  select * into v_listing from public.lg_listings where id=p_listing_id for update;
  if not found then raise exception 'listing_not_found'; end if;
  select * into v_usage from public.lg_founder_usage where founder_email=v_listing.founder_email for update;
  if not found then raise exception 'account_not_found'; end if;
  if v_usage.tier='founding_1000' then
    if coalesce(v_usage.lifetime_uses_used,0)>=coalesce(v_usage.lifetime_uses_allowed,5) then raise exception 'lifetime_cap_reached'; end if;
    update public.lg_founder_usage set lifetime_uses_used=coalesce(lifetime_uses_used,0)+1,updated_at=now() where founder_email=v_listing.founder_email;
  elsif v_usage.tier='corporate_5000' then
    if v_usage.month_key=v_month and coalesce(v_usage.month_uses_used,0)>=coalesce(v_usage.monthly_cap,30) then raise exception 'monthly_cap_reached'; end if;
    update public.lg_founder_usage set month_key=v_month,month_uses_used=case when month_key=v_month then coalesce(month_uses_used,0)+1 else 1 end,updated_at=now() where founder_email=v_listing.founder_email;
  else raise exception 'invalid_tier'; end if;
  update public.lg_listings set status='active' where id=p_listing_id;
  return jsonb_build_object('status','active');
end; $$;

revoke all on function public.activate_listing(uuid) from public;
grant execute on function public.activate_listing(uuid) to authenticated;grant execute on function public.activate_listing(uuid) to anon;

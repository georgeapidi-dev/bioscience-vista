-- Learnova · migration 023: donations (PayPal in USD or M-Pesa in KES). Anyone can donate, signed in or not.
-- 70% of every subscription and donation goes to charity (the note is shown from app_settings.charity_note).
begin;

alter table public.payments alter column user_id drop not null;
alter table public.payments add column if not exists kind text not null default 'premium';
alter table public.payments add column if not exists donor_name text;
alter table public.payments add column if not exists donor_message text;
do $$ begin
  alter table public.payments add constraint payments_kind_chk check (kind in ('premium', 'donation'));
exception when duplicate_object then null; end $$;

drop policy if exists set_read on public.app_settings;
create policy set_read on public.app_settings for select to anon, authenticated
  using (k in ('paypal_client_id', 'currency', 'premium_note', 'mpesa_number', 'mpesa_name', 'charity_note'));
insert into public.app_settings (k, v) values ('charity_note', '70% of every subscription and donation goes to charity.') on conflict do nothing;

-- PayPal donation: called by the paypal edge function (service role) with the amount the donor chose
create or replace function public.start_donation(amt numeric, donor text, note text, uid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ref text;
begin
  if amt is null or amt < 1 or amt > 5000 then raise exception 'Choose an amount between 1 and 5,000 US dollars.'; end if;
  ref := 'DN-' || replace(gen_random_uuid()::text, '-', '');
  insert into public.payments (reference, user_id, kind, amount, currency, method, donor_name, donor_message)
  values (ref, uid, 'donation', round(amt, 2), 'USD', 'paypal', left(nullif(trim(donor), ''), 80), left(nullif(trim(note), ''), 300));
  return jsonb_build_object('reference', ref, 'amount', round(amt, 2), 'currency', 'USD');
end $$;
create or replace function public.confirm_donation(ref text, paid_amount numeric, paid_currency text, payload jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare p public.payments;
begin
  select * into p from public.payments where reference = ref and kind = 'donation' for update;
  if p.reference is null or p.status <> 'pending' then return false; end if;
  if paid_amount < p.amount or upper(paid_currency) <> upper(p.currency) then
    update public.payments set status = 'failed', raw = payload where reference = ref; return false; end if;
  update public.payments set status = 'paid', paid_at = now(), raw = payload where reference = ref;
  return true;
end $$;
revoke all on function public.start_donation(numeric, text, text, uuid), public.confirm_donation(text, numeric, text, jsonb) from public, anon, authenticated;
grant execute on function public.start_donation(numeric, text, text, uuid), public.confirm_donation(text, numeric, text, jsonb) to service_role;

-- M-Pesa donation: the donor sends money to the M-Pesa number, then types the code; the admin confirms it
create or replace function public.submit_mpesa_donation(amt numeric, mpesa text, phone text, donor text default null, note text default null) returns text
language plpgsql security definer set search_path = public as $$
declare ref text; c text := upper(regexp_replace(coalesce(mpesa, ''), '\s', '', 'g'));
        ph text := regexp_replace(coalesce(phone, ''), '[^0-9+]', '', 'g');
begin
  if amt is null or amt < 10 or amt > 1000000 then raise exception 'Type the amount you sent in Kenya shillings.'; end if;
  if c !~ '^[A-Z0-9]{10}$' then raise exception 'The M-Pesa code has 10 letters and numbers, for example SKL4ABC12D.'; end if;
  if ph !~ '^\+?[0-9]{9,13}$' then raise exception 'Type the phone number you paid from.'; end if;
  if exists (select 1 from public.payments y where y.mpesa_code = c) then raise exception 'That M-Pesa code has already been sent.'; end if;
  if (select count(*) from public.payments y where y.kind = 'donation' and y.method = 'mpesa' and y.status = 'pending' and y.payer_phone = ph) >= 3 then
    raise exception 'Three donations from this number are already waiting to be confirmed. Thank you!'; end if;
  ref := 'MD-' || replace(gen_random_uuid()::text, '-', '');
  insert into public.payments (reference, user_id, kind, amount, currency, method, mpesa_code, payer_phone, payer_name, donor_name, donor_message)
  values (ref, auth.uid(), 'donation', round(amt), 'KES', 'mpesa', c, ph, left(nullif(trim(donor), ''), 80), left(nullif(trim(donor), ''), 80), left(nullif(trim(note), ''), 300));
  return ref;
end $$;
revoke all on function public.submit_mpesa_donation(numeric, text, text, text, text) from public;
grant execute on function public.submit_mpesa_donation(numeric, text, text, text, text) to anon, authenticated;

-- admin confirms M-Pesa payments: premium time only for premium payments (never for donations)
create or replace function public.decide_mpesa(ref text, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare p public.payments; pl public.plans;
begin
  if not public.is_admin() then raise exception 'Only an admin can confirm payments.'; end if;
  select * into p from public.payments where reference = ref and method = 'mpesa' for update;
  if p.reference is null or p.status <> 'pending' then raise exception 'That payment is not waiting.'; end if;
  if not approve then update public.payments set status = 'failed' where reference = ref; return; end if;
  update public.payments set status = 'paid', paid_at = now(), raw = jsonb_build_object('confirmed_by', auth.uid()) where reference = ref;
  if p.kind = 'premium' and p.plan_code is not null and p.user_id is not null then
    select * into pl from public.plans where code = p.plan_code;
    update public.profiles set premium_until = greatest(coalesce(premium_until, now()), now()) + make_interval(months => pl.months) where id = p.user_id;
  end if;
end $$;

drop function if exists public.admin_payments();
create or replace function public.admin_payments() returns table (reference text, kind text, full_name text, email text, plan text, method text, amount numeric, currency text,
  status text, mpesa_code text, payer_phone text, payer_name text, donor_message text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select y.reference, y.kind, coalesce(p.full_name, y.donor_name), u.email::text, coalesce(pl.name, case when y.kind = 'donation' then 'Donation' end), y.method, y.amount, y.currency,
         y.status, y.mpesa_code, y.payer_phone, y.payer_name, y.donor_message, y.created_at
    from public.payments y left join public.profiles p on p.id = y.user_id left join auth.users u on u.id = y.user_id left join public.plans pl on pl.code = y.plan_code
   where public.is_admin() order by (y.status = 'pending') desc, y.created_at desc limit 300;
$$;
revoke all on function public.admin_payments() from public, anon;
grant execute on function public.admin_payments() to authenticated;

commit;
select 'migration 023 done' as result;

-- =============================================================
-- Justscribe — Supabase Schema
-- Run this in the Supabase SQL editor (in order)
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Profiles (extends auth.users)
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id  text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- ---------------------------------------------------------------
-- 2. Balances
-- ---------------------------------------------------------------
create table if not exists public.balances (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.profiles(id) on delete cascade,
  credits     numeric(12, 4) not null default 0 check (credits >= 0),
  updated_at  timestamptz default now()
);

alter table public.balances enable row level security;

create policy "Users can read own balance"
  on public.balances for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 3. Payments
-- ---------------------------------------------------------------
create table if not exists public.payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  stripe_payment_id   text not null unique,
  amount_usd_cents    integer not null check (amount_usd_cents > 0),
  credits_added       numeric(12, 4) not null,
  status              text not null default 'pending'
                      check (status in ('pending', 'succeeded', 'failed')),
  created_at          timestamptz default now()
);

alter table public.payments enable row level security;

create policy "Users can read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 4. Usage Logs
-- ---------------------------------------------------------------
create table if not exists public.usage_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  model             text not null check (model in ('standard', 'chirp')),
  duration_seconds  numeric(8, 2) not null check (duration_seconds > 0),
  credits_charged   numeric(12, 4) not null check (credits_charged >= 0),
  created_at        timestamptz default now()
);

alter table public.usage_logs enable row level security;

create policy "Users can read own usage"
  on public.usage_logs for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 5. Trigger: auto-create profile + balance on signup
-- (defined after both tables exist)
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict do nothing;

  insert into public.balances (user_id, credits)
  values (new.id, 0)
  on conflict do nothing;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------
-- 6. Pricing Config
-- ---------------------------------------------------------------
create table if not exists public.pricing_config (
  id                  serial primary key,
  model               text not null unique check (model in ('standard', 'chirp')),
  credits_per_second  numeric(8, 6) not null,
  usd_per_credit      numeric(8, 6) not null,
  active              boolean default true,
  updated_at          timestamptz default now()
);

-- No RLS needed — pricing is public read
insert into public.pricing_config (model, credits_per_second, usd_per_credit)
values
  ('standard', 0.004000, 0.010000),
  ('chirp',    0.016800, 0.010000)
on conflict (model) do nothing;

-- ---------------------------------------------------------------
-- 7. Database Functions (called from backend service role)
-- ---------------------------------------------------------------

-- Atomic balance deduction
-- Returns new balance or raises INSUFFICIENT_BALANCE
create or replace function public.deduct_balance(
  p_user_id  uuid,
  p_credits  numeric
) returns numeric language plpgsql security definer as $$
declare
  v_new_balance numeric;
begin
  update public.balances
  set    credits    = credits - p_credits,
         updated_at = now()
  where  user_id   = p_user_id
    and  credits   >= p_credits
  returning credits into v_new_balance;

  if not found then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  return v_new_balance;
end;
$$;

-- Atomic balance top-up
create or replace function public.top_up_balance(
  p_user_id  uuid,
  p_credits  numeric
) returns numeric language plpgsql security definer as $$
declare
  v_new_balance numeric;
begin
  update public.balances
  set    credits    = credits + p_credits,
         updated_at = now()
  where  user_id   = p_user_id
  returning credits into v_new_balance;

  if not found then
    raise exception 'USER_BALANCE_NOT_FOUND';
  end if;

  return v_new_balance;
end;
$$;

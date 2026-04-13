-- ============================================================
-- Vocri – Supabase Database Schema
-- Run this in: Supabase → SQL Editor → New query → Run
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
-- One row per auth user. Created automatically via trigger.
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  stripe_customer_id text,
  created_at       timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- ── balances ─────────────────────────────────────────────────
-- Stores credit balance per user.
create table if not exists public.balances (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  credits   numeric(12,2) not null default 0,
  updated_at timestamptz default now()
);

alter table public.balances enable row level security;

create policy "Users can read own balance"
  on public.balances for select
  using (auth.uid() = user_id);

-- ── payments ──────────────────────────────────────────────────
-- Records every Stripe payment intent.
create table if not exists public.payments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  stripe_payment_id    text not null unique,
  amount_usd_cents     int  not null,
  credits_added        int  not null,
  status               text not null default 'pending', -- pending | succeeded | failed
  created_at           timestamptz default now()
);

alter table public.payments enable row level security;

create policy "Users can read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- ── usage_logs ────────────────────────────────────────────────
-- Records every transcription job.
create table if not exists public.usage_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  credits_used     numeric(12,2) not null,
  duration_seconds numeric(10,2),
  model            text,
  created_at       timestamptz default now()
);

alter table public.usage_logs enable row level security;

create policy "Users can read own usage"
  on public.usage_logs for select
  using (auth.uid() = user_id);

-- ── trigger: create profile + balance on signup ───────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;

  insert into public.balances (user_id, credits)
    values (new.id, 0)
    on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RPC: top_up_balance ───────────────────────────────────────
create or replace function public.top_up_balance(
  p_user_id  uuid,
  p_credits  numeric
) returns numeric language plpgsql security definer as $$
declare
  new_balance numeric;
begin
  insert into public.balances (user_id, credits)
    values (p_user_id, p_credits)
    on conflict (user_id)
    do update set credits = balances.credits + p_credits,
                  updated_at = now()
    returning credits into new_balance;

  return new_balance;
end;
$$;

-- ── RPC: deduct_balance ───────────────────────────────────────
create or replace function public.deduct_balance(
  p_user_id  uuid,
  p_credits  numeric
) returns numeric language plpgsql security definer as $$
declare
  current_credits numeric;
  new_balance     numeric;
begin
  select credits into current_credits
    from public.balances
    where user_id = p_user_id
    for update;

  if current_credits is null or current_credits < p_credits then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  update public.balances
    set credits = credits - p_credits,
        updated_at = now()
    where user_id = p_user_id
    returning credits into new_balance;

  return new_balance;
end;
$$;

-- ── backfill: create balance row for existing users ──────────
insert into public.balances (user_id, credits)
  select id, 0 from auth.users
  on conflict (user_id) do nothing;

insert into public.profiles (id, email)
  select id, email from auth.users
  on conflict (id) do nothing;

-- Subscription state, free-tier counters, cloud resume, and archived games.

alter table public.profiles
  add column if not exists subscription_tier text not null default 'free',
  add column if not exists pro_expires_at timestamp with time zone,
  add column if not exists polar_customer_id text,
  add column if not exists polar_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists subscription_updated_at timestamp with time zone,
  add column if not exists limit_usage jsonb not null default '{}'::jsonb,
  add column if not exists current_game jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_subscription_tier_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_subscription_tier_check
      check (subscription_tier in ('free', 'trial', 'pro'));
  end if;
end;
$$;

create table if not exists public.game_history (
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_record_id text not null,
  record jsonb not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (user_id, client_record_id)
);

alter table public.game_history enable row level security;

drop policy if exists "Game history readable by owner" on public.game_history;
create policy "Game history readable by owner"
  on public.game_history
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Game history insertable by owner" on public.game_history;
create policy "Game history insertable by owner"
  on public.game_history
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Game history updatable by owner" on public.game_history;
create policy "Game history updatable by owner"
  on public.game_history
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists game_history_user_created_at_idx
  on public.game_history (user_id, created_at desc);

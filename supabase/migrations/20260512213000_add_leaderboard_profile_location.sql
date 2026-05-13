-- Adds public daily leaderboard entries while keeping full profiles private.

create schema if not exists private;

alter table public.profiles
  add column if not exists nickname text,
  add column if not exists city text not null default 'Алматы',
  add column if not exists country text not null default 'Kazakhstan';

update public.profiles
set
  nickname = coalesce(nullif(nickname, ''), nullif(display_name, '')),
  city = coalesce(nullif(city, ''), 'Алматы'),
  country = coalesce(nullif(country, ''), 'Kazakhstan');

create table if not exists public.daily_leaderboard (
  user_id uuid not null references public.profiles(id) on delete cascade,
  date_key text not null,
  nickname text not null,
  city text not null,
  country text not null default 'Kazakhstan',
  seconds integer not null check (seconds > 0),
  updated_at timestamp with time zone not null default now(),
  primary key (user_id, date_key)
);

alter table public.daily_leaderboard enable row level security;

drop policy if exists "Daily leaderboard is publicly readable" on public.daily_leaderboard;
create policy "Daily leaderboard is publicly readable"
  on public.daily_leaderboard
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Daily leaderboard insertable by owner" on public.daily_leaderboard;
create policy "Daily leaderboard insertable by owner"
  on public.daily_leaderboard
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Daily leaderboard updatable by owner" on public.daily_leaderboard;
create policy "Daily leaderboard updatable by owner"
  on public.daily_leaderboard
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists daily_leaderboard_date_city_seconds_idx
  on public.daily_leaderboard (date_key, city, seconds);

create or replace function private.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  picked_name text := coalesce(
    nullif(new.raw_user_meta_data ->> 'nickname', ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Player'
  );
begin
  insert into public.profiles (id, display_name, nickname, city, country)
  values (
    new.id,
    picked_name,
    picked_name,
    coalesce(nullif(new.raw_user_meta_data ->> 'city', ''), 'Алматы'),
    coalesce(nullif(new.raw_user_meta_data ->> 'country', ''), 'Kazakhstan')
  )
  on conflict (id) do update
  set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    nickname = coalesce(public.profiles.nickname, excluded.nickname),
    city = coalesce(nullif(public.profiles.city, ''), excluded.city),
    country = coalesce(nullif(public.profiles.country, ''), excluded.country);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function private.handle_new_user_profile();

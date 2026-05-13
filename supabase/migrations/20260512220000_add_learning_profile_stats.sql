-- Adds learning-first profile fields used by the app's local/cloud profile merge.

alter table public.profiles
  add column if not exists learning_progress jsonb not null default '{}'::jsonb,
  add column if not exists achievements jsonb not null default '[]'::jsonb,
  add column if not exists stats_by_mode jsonb not null default '{}'::jsonb;

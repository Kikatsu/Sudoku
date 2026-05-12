-- Adds per-user personal bests for the "Famous Sudoku" puzzles surface.
-- The column mirrors the existing daily_results jsonb column on the same
-- profiles row, so we can keep using a single profile-row upsert.

alter table public.profiles
  add column if not exists famous_bests jsonb not null default '{}'::jsonb;

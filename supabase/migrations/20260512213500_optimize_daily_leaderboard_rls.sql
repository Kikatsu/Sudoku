-- Avoid per-row auth.uid() re-evaluation in daily leaderboard owner policies.

drop policy if exists "Daily leaderboard insertable by owner" on public.daily_leaderboard;
create policy "Daily leaderboard insertable by owner"
  on public.daily_leaderboard
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Daily leaderboard updatable by owner" on public.daily_leaderboard;
create policy "Daily leaderboard updatable by owner"
  on public.daily_leaderboard
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

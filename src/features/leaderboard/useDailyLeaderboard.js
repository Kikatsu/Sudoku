import { useCallback, useEffect, useState } from "react";
import { fetchDailyLeaderboard } from "../../lib/cloudSync.js";
import { supabase } from "../../lib/supabaseClient.js";

export function useDailyLeaderboard({ dateKey, city, cloudSynced }) {
  const [dailyLeaderboard, setDailyLeaderboard] = useState([]);

  const refreshDailyLeaderboard = useCallback(async () => {
    if (!supabase) {
      setDailyLeaderboard([]);
      return [];
    }
    const rows = await fetchDailyLeaderboard(supabase, dateKey, city);
    setDailyLeaderboard(rows);
    return rows;
  }, [dateKey, city]);

  useEffect(() => {
    if (!supabase) {
      setDailyLeaderboard([]);
      return undefined;
    }
    let cancelled = false;
    refreshDailyLeaderboard()
      .then((rows) => {
        if (!cancelled) setDailyLeaderboard(rows);
      })
      .catch((error) => {
        console.warn("Daily leaderboard fetch failed.", error);
        if (!cancelled) setDailyLeaderboard([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshDailyLeaderboard, cloudSynced]);

  return { dailyLeaderboard, setDailyLeaderboard, refreshDailyLeaderboard };
}

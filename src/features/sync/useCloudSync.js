import { useEffect, useState } from "react";
import { loadPreferences, normalizePreferences } from "../settings/preferencesRepository.js";
import { loadProfile } from "../profile/profileRepository.js";
import { getElapsed } from "../game/gameRepository.js";
import {
  fetchRemoteHistory,
  gameToCloudBlob,
  hydrateGameFromCloud,
  mergeHistoryFromRemote,
  mergePreferencesWithRemote,
  mergeProfileForSync,
  mapProfileFromDb,
  profileToRemotePatch,
  upsertHistoryRecords,
} from "../../lib/cloudSync.js";
import { gameHasProgress, loadArchive, saveArchive } from "../../lib/gameHistory.js";
import { supabase } from "../../lib/supabaseClient.js";

export function useCloudSync({
  authUser,
  game,
  setGame,
  profile,
  setProfile,
  preferences,
  setPreferences,
  setHistoryRecords,
}) {
  const [cloudSynced, setCloudSynced] = useState(false);

  useEffect(() => {
    if (!supabase || !authUser?.id) {
      setCloudSynced(false);
      return undefined;
    }
    let cancelled = false;
    setCloudSynced(false);
    (async () => {
      try {
        const { data: row, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
        if (error) throw error;
        if (cancelled) return;

        const remoteProfile = mapProfileFromDb(row, authUser.email);
        const localProfile = loadProfile();
        const mergedProfile = mergeProfileForSync(localProfile, remoteProfile);
        setProfile(mergedProfile);

        const mergedPrefs = mergePreferencesWithRemote(loadPreferences(), row?.preferences || {});
        setPreferences(normalizePreferences(mergedPrefs));

        const localHist = loadArchive();
        const remoteRows = await fetchRemoteHistory(supabase, authUser.id);
        const mergedHist = mergeHistoryFromRemote(localHist, remoteRows);
        saveArchive(mergedHist);
        setHistoryRecords(mergedHist);
        await upsertHistoryRecords(supabase, authUser.id, mergedHist);

        const cloudGame = hydrateGameFromCloud(row?.current_game);
        if (cloudGame) {
          setGame((g) => (gameHasProgress(g) ? g : cloudGame));
        }

        await supabase.from("profiles").upsert(profileToRemotePatch(mergedProfile, mergedPrefs, authUser.id), {
          onConflict: "id",
        });
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setCloudSynced(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id, authUser?.email, setGame, setHistoryRecords, setPreferences, setProfile]);

  useEffect(() => {
    if (!supabase || !authUser?.id || !cloudSynced) return undefined;
    const timer = window.setTimeout(() => {
      void supabase.from("profiles").upsert(profileToRemotePatch(profile, preferences, authUser.id), {
        onConflict: "id",
      });
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [profile, preferences, authUser?.id, cloudSynced]);

  useEffect(() => {
    if (!supabase || !authUser?.id || !cloudSynced) return undefined;
    const timer = window.setTimeout(() => {
      const elapsedFlush = getElapsed(game, Date.now());
      const payloadFlush = gameToCloudBlob(game, elapsedFlush);
      void supabase.from("profiles").update({ current_game: payloadFlush }).eq("id", authUser.id);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [game, authUser?.id, cloudSynced]);

  return { cloudSynced, setCloudSynced };
}

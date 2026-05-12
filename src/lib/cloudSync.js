import { MAX_ARCHIVED_GAMES, normalizeSelection } from "./gameHistory.js";
import { GAME_RULES_VERSION, normalizeNotes } from "./sudoku.js";
import { mergeFamousBests } from "./famousPuzzles.js";

export function computeProStatus(tier, proExpiresAt) {
  const t = tier || "free";
  if (t !== "pro" && t !== "trial") return false;
  if (!proExpiresAt) return t === "pro";
  return new Date(proExpiresAt).getTime() > Date.now();
}

export function normalizeBadges(value) {
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

export function mapProfileFromDb(row, email) {
  if (!row) return null;
  return {
    name: row.display_name || (email ? email.split("@")[0] : null) || "Player",
    xp: row.xp ?? 0,
    streak: row.streak ?? 0,
    lastPlayed: row.last_played ?? null,
    solved: row.solved ?? 0,
    badges: normalizeBadges(row.badges),
    dailyResults: row.daily_results && typeof row.daily_results === "object" ? { ...row.daily_results } : {},
    famousBests: row.famous_bests && typeof row.famous_bests === "object" ? { ...row.famous_bests } : {},
    subscriptionTier: row.subscription_tier || "free",
    proExpiresAt: row.pro_expires_at ?? null,
    _remotePreferences:
      row.preferences && typeof row.preferences === "object" ? { ...row.preferences } : null,
  };
}

export function mergeProfileForSync(local, remote) {
  if (!remote) return local;
  const badgeSet = new Set([...(local.badges || []), ...(remote.badges || [])]);
  const daily = { ...(remote.dailyResults || {}) };
  for (const [k, v] of Object.entries(local.dailyResults || {})) {
    const cur = daily[k];
    if (cur == null || (typeof v === "number" && v < cur)) daily[k] = v;
  }
  return {
    name: remote.name || local.name,
    xp: Math.max(local.xp || 0, remote.xp || 0),
    streak: Math.max(local.streak || 0, remote.streak || 0),
    lastPlayed: [local.lastPlayed, remote.lastPlayed].filter(Boolean).sort().pop() ?? null,
    solved: Math.max(local.solved || 0, remote.solved || 0),
    badges: [...badgeSet],
    dailyResults: daily,
    famousBests: mergeFamousBests(local.famousBests || {}, remote.famousBests || {}),
    subscriptionTier: remote.subscriptionTier || "free",
    proExpiresAt: remote.proExpiresAt ?? null,
  };
}

export function profileToRemotePatch(profile, preferences, userId) {
  return {
    id: userId,
    display_name: profile.name,
    xp: profile.xp ?? 0,
    streak: profile.streak ?? 0,
    last_played: profile.lastPlayed ?? null,
    solved: profile.solved ?? 0,
    badges: profile.badges ?? [],
    daily_results: profile.dailyResults ?? {},
    famous_bests: profile.famousBests ?? {},
    preferences: {
      showFocusLens: preferences.showFocusLens,
      soundEnabled: preferences.soundEnabled,
      soundVolume: preferences.soundVolume,
      boardSize: preferences.boardSize,
      theme: preferences.theme,
      language: preferences.language,
    },
  };
}

export function mergePreferencesWithRemote(localPrefs, remotePrefs) {
  if (!remotePrefs || typeof remotePrefs !== "object") return localPrefs;
  return {
    ...localPrefs,
    ...Object.fromEntries(
      Object.entries(remotePrefs).filter(([, v]) => v !== undefined && v !== null),
    ),
  };
}

export function hydrateGameFromCloud(saved) {
  try {
    if (!saved || saved.rulesVersion !== GAME_RULES_VERSION) return null;
    if (!saved.generator?.unique) return null;
    if (!Array.isArray(saved.values) || saved.values.length !== 81) return null;
    if (!Array.isArray(saved.puzzle) || saved.puzzle.length !== 81) return null;
    if (!Array.isArray(saved.solution) || saved.solution.length !== 81) return null;
    const fixed =
      Array.isArray(saved.fixed) && saved.fixed.length === 81 ? saved.fixed : saved.puzzle.map(Boolean);
    for (let i = 0; i < 81; i += 1) {
      if (saved.puzzle[i] && saved.puzzle[i] !== saved.solution[i]) return null;
    }
    return {
      ...saved,
      fixed,
      selected: normalizeSelection(saved.selected, saved.values, fixed),
      startedAt: Date.now(),
      notes: normalizeNotes(saved.notes),
      hintCells: saved.hintCells || [],
      history: saved.history || [],
      future: saved.future || [],
      awardXp: saved.awardXp || 0,
      suppressVictoryRewards: Boolean(saved.suppressVictoryRewards),
    };
  } catch {
    return null;
  }
}

export function gameToCloudBlob(game, elapsedSeconds) {
  return {
    ...game,
    elapsedBefore: elapsedSeconds,
    startedAt: Date.now(),
  };
}

export function mergeHistoryFromRemote(localRecords, rows) {
  const byId = new Map();
  for (const r of localRecords) {
    if (r?.id && r.id !== "__history_preview__") byId.set(r.id, r);
  }
  for (const row of rows || []) {
    const rec = row?.record;
    if (!rec?.id || rec.rulesVersion !== GAME_RULES_VERSION) continue;
    if (!Array.isArray(rec.timeline) || !rec.timeline.length) continue;
    if (!byId.has(rec.id)) byId.set(rec.id, rec);
  }
  const merged = [...byId.values()].sort((a, b) => b.endedAt - a.endedAt);
  return merged.slice(0, MAX_ARCHIVED_GAMES);
}

export async function fetchRemoteHistory(client, userId) {
  const { data, error } = await client
    .from("game_history")
    .select("client_record_id, record, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_ARCHIVED_GAMES);
  if (error) throw error;
  return data || [];
}

export async function upsertHistoryRecords(client, userId, records) {
  const rows = records
    .filter((r) => r?.id && r.id !== "__history_preview__" && r.rulesVersion === GAME_RULES_VERSION)
    .map((record) => ({
      user_id: userId,
      client_record_id: record.id,
      record,
    }));
  if (!rows.length) return;
  const { error } = await client.from("game_history").upsert(rows, { onConflict: "user_id,client_record_id" });
  if (error) throw error;
}

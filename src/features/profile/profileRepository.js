import { EMPTY_PROFILE, LEVELS, PROFILE_KEY } from "../../app/config.js";
import { loadFamousBests } from "../../lib/famousPuzzles.js";
import { normalizeLimitUsage } from "../subscription/subscriptionLimits.js";

export function normalizeStatsByMode(value) {
  return value && typeof value === "object" ? { ...value } : {};
}

export function normalizeAchievements(value) {
  return Array.isArray(value) ? [...value] : [];
}

export function normalizeProfile(profile = {}) {
  const merged = {
    ...EMPTY_PROFILE,
    ...profile,
    achievements: normalizeAchievements(profile.achievements),
    statsByMode: normalizeStatsByMode(profile.statsByMode),
    limitUsage: normalizeLimitUsage(profile.limitUsage),
  };
  if (!merged.famousBests || typeof merged.famousBests !== "object") {
    merged.famousBests = {};
  }
  return merged;
}

export function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    const merged = normalizeProfile(saved);
    const localBests = loadFamousBests();
    if (localBests && Object.keys(localBests).length) {
      merged.famousBests = { ...localBests, ...merged.famousBests };
      for (const [id, entry] of Object.entries(localBests)) {
        const cur = merged.famousBests[id];
        if (!cur || (entry?.seconds != null && entry.seconds < cur.seconds)) {
          merged.famousBests[id] = entry;
        }
      }
    }
    return merged;
  } catch {
    return EMPTY_PROFILE;
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getLevel(xp) {
  return LEVELS.reduce((current, level) => (xp >= level.min ? level : current), LEVELS[0]);
}

export function getNextLevel(xp) {
  return LEVELS.find((level) => level.min > xp) || LEVELS[LEVELS.length - 1];
}

export function recordProfileSolve(profile, game, finalTime, gainedXp, options = {}) {
  const today = options.today;
  const yesterday = options.yesterday;
  const isFamous = game.mode === "famous" && game.famousId;
  const nextStreak = isFamous
    ? profile.streak
    : profile.lastPlayed === today
      ? profile.streak
      : profile.lastPlayed === yesterday
        ? profile.streak + 1
        : 1;
  const badges = new Set(profile.badges || []);
  if (game.hintsUsed === 0) badges.add("Чистое решение");
  if (finalTime < 180) badges.add("Молния");
  if (game.difficulty === "impossible") badges.add("Невозможное возможно");
  if (isFamous) badges.add("Хроника судоку");

  const modeKey = game.mode || "free";
  const statsByMode = {
    ...(profile.statsByMode || {}),
    [modeKey]: {
      solved: ((profile.statsByMode || {})[modeKey]?.solved || 0) + 1,
      bestSeconds:
        (profile.statsByMode || {})[modeKey]?.bestSeconds == null
          ? finalTime
          : Math.min((profile.statsByMode || {})[modeKey].bestSeconds, finalTime),
      cleanSolves:
        ((profile.statsByMode || {})[modeKey]?.cleanSolves || 0) + (game.hintsUsed === 0 && game.mistakes === 0 ? 1 : 0),
    },
  };

  return {
    ...profile,
    xp: profile.xp + gainedXp,
    solved: profile.solved + 1,
    streak: nextStreak,
    lastPlayed: isFamous ? profile.lastPlayed : today,
    badges: [...badges],
    achievements: [...new Set([...(profile.achievements || []), ...badges])],
    statsByMode,
  };
}

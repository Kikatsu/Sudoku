export const FREE_TIER_LIMITS = {
  freeGamesPerDay: 3,
  dailyGamesPerDay: 1,
  coachRequestsPerDay: 25,
  historyAnalysisPerDay: 1,
  historyVisibleRecords: 5,
};

export const PRO_THEME_KEYS = new Set(["ocean", "sakura"]);

export function isThemePro(themeKey) {
  return PRO_THEME_KEYS.has(themeKey);
}

export function normalizeLimitUsage(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

export function getLimitUsageForDate(profile, dateKey) {
  const usage = normalizeLimitUsage(profile?.limitUsage);
  const day = usage[dateKey];
  return day && typeof day === "object"
    ? {
        freeGames: day.freeGames || 0,
        dailyGames: day.dailyGames || 0,
        coachRequests: day.coachRequests || 0,
        historyAnalysis: day.historyAnalysis || 0,
      }
    : { freeGames: 0, dailyGames: 0, coachRequests: 0, historyAnalysis: 0 };
}

export function canStartGame(profile, isPro, mode, dateKey) {
  if (isPro || mode === "learning" || mode === "famous") return { allowed: true, usageKey: null };
  const today = getLimitUsageForDate(profile, dateKey);
  if (mode === "daily") {
    return today.dailyGames < FREE_TIER_LIMITS.dailyGamesPerDay
      ? { allowed: true, usageKey: "dailyGames" }
      : { allowed: false, reason: "dailyGameLimit" };
  }
  return today.freeGames < FREE_TIER_LIMITS.freeGamesPerDay
    ? { allowed: true, usageKey: "freeGames" }
    : { allowed: false, reason: "freeGameLimit" };
}

export function canUseCoach(profile, isPro, dateKey) {
  if (isPro) return { allowed: true, usageKey: null };
  const today = getLimitUsageForDate(profile, dateKey);
  return today.coachRequests < FREE_TIER_LIMITS.coachRequestsPerDay
    ? { allowed: true, usageKey: "coachRequests" }
    : { allowed: false, reason: "coachLimit" };
}

export function canAnalyzeHistory(profile, isPro, dateKey) {
  if (isPro) return { allowed: true, usageKey: null };
  const today = getLimitUsageForDate(profile, dateKey);
  return today.historyAnalysis < FREE_TIER_LIMITS.historyAnalysisPerDay
    ? { allowed: true, usageKey: "historyAnalysis" }
    : { allowed: false, reason: "historyAnalysisLimit" };
}

export function recordLimitUsage(profile, usageKey, dateKey) {
  if (!usageKey) return profile;
  const usage = normalizeLimitUsage(profile?.limitUsage);
  const today = getLimitUsageForDate(profile, dateKey);
  const nextUsage = {
    ...usage,
    [dateKey]: {
      ...today,
      [usageKey]: today[usageKey] + 1,
    },
  };
  const keep = Object.keys(nextUsage).sort().slice(-14);
  return {
    ...profile,
    limitUsage: Object.fromEntries(keep.map((key) => [key, nextUsage[key]])),
  };
}

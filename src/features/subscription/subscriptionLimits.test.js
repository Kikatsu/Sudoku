import { describe, expect, it } from "vitest";
import {
  FREE_TIER_LIMITS,
  canAnalyzeHistory,
  canStartGame,
  canUseCoach,
  isThemePro,
  recordLimitUsage,
} from "./subscriptionLimits.js";

describe("subscription limits", () => {
  it("allows Pro users without consuming daily free counters", () => {
    const profile = { limitUsage: { "2026-05-13": { freeGames: 99, coachRequests: 99 } } };

    expect(canStartGame(profile, true, "free", "2026-05-13")).toMatchObject({ allowed: true, usageKey: null });
    expect(canUseCoach(profile, true, "2026-05-13")).toMatchObject({ allowed: true, usageKey: null });
  });

  it("enforces daily game and Coach counters for free users", () => {
    const dateKey = "2026-05-13";
    let profile = { limitUsage: {} };

    for (let i = 0; i < FREE_TIER_LIMITS.freeGamesPerDay; i += 1) {
      const limit = canStartGame(profile, false, "free", dateKey);
      expect(limit.allowed).toBe(true);
      profile = recordLimitUsage(profile, limit.usageKey, dateKey);
    }

    expect(canStartGame(profile, false, "free", dateKey)).toMatchObject({
      allowed: false,
      reason: "freeGameLimit",
    });

    profile = {
      limitUsage: { [dateKey]: { coachRequests: FREE_TIER_LIMITS.coachRequestsPerDay } },
    };
    expect(canUseCoach(profile, false, dateKey)).toMatchObject({ allowed: false, reason: "coachLimit" });
  });

  it("locks deeper history analysis and early themes behind Pro", () => {
    const dateKey = "2026-05-13";
    const profile = {
      limitUsage: { [dateKey]: { historyAnalysis: FREE_TIER_LIMITS.historyAnalysisPerDay } },
    };

    expect(canAnalyzeHistory(profile, false, dateKey)).toMatchObject({
      allowed: false,
      reason: "historyAnalysisLimit",
    });
    expect(isThemePro("sakura")).toBe(true);
    expect(isThemePro("studio")).toBe(false);
  });
});

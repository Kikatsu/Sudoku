import { describe, expect, it } from "vitest";
import {
  computeProStatus,
  mapProfileFromDb,
  mergeProfileForSync,
  profileToRemotePatch,
  upsertDailyLeaderboardEntry,
} from "./cloudSync.js";

function leaderboardClient(currentSeconds = null) {
  const calls = [];
  const client = {
    calls,
    from(table) {
      calls.push(["from", table]);
      const builder = {
        select(value) {
          calls.push(["select", value]);
          return builder;
        },
        eq(key, value) {
          calls.push(["eq", key, value]);
          return builder;
        },
        maybeSingle() {
          calls.push(["maybeSingle"]);
          return Promise.resolve({ data: currentSeconds == null ? null : { seconds: currentSeconds }, error: null });
        },
        upsert(payload, options) {
          calls.push(["upsert", payload, options]);
          currentSeconds = null;
          return builder;
        },
      };
      return builder;
    },
  };
  return client;
}

describe("cloud sync services", () => {
  it("maps and patches learning-first profile fields", () => {
    const remote = mapProfileFromDb({
      nickname: "Aruzhan",
      city: "Алматы",
      country: "Kazakhstan",
      learning_progress: { completedIds: ["l01"] },
      achievements: ["Молния"],
      stats_by_mode: { daily: { solved: 2 } },
      limit_usage: { "2026-05-13": { freeGames: 1 } },
    });

    expect(remote).toMatchObject({
      name: "Aruzhan",
      learningProgress: { completedIds: ["l01"] },
      achievements: ["Молния"],
      statsByMode: { daily: { solved: 2 } },
      limitUsage: { "2026-05-13": { freeGames: 1 } },
    });

    const patch = profileToRemotePatch(remote, { language: "ru" }, "user-1");
    expect(patch.learning_progress).toEqual({ completedIds: ["l01"] });
    expect(patch.achievements).toEqual(["Молния"]);
    expect(patch.stats_by_mode).toEqual({ daily: { solved: 2 } });
    expect(patch.limit_usage).toEqual({ "2026-05-13": { freeGames: 1 } });
  });

  it("merges profile achievements and keeps remote subscription authority", () => {
    const merged = mergeProfileForSync(
      { name: "Local", xp: 20, achievements: ["Чистое решение"], statsByMode: { free: { solved: 1 } } },
      { name: "Remote", xp: 10, achievements: ["Молния"], statsByMode: { daily: { solved: 2 } }, subscriptionTier: "pro" },
    );

    expect(merged.name).toBe("Remote");
    expect(merged.xp).toBe(20);
    expect(merged.achievements).toEqual(expect.arrayContaining(["Чистое решение", "Молния"]));
    expect(merged.statsByMode).toMatchObject({ free: { solved: 1 }, daily: { solved: 2 } });
    expect(computeProStatus(merged.subscriptionTier, null)).toBe(true);
  });

  it("does not overwrite a faster daily leaderboard result", async () => {
    const client = leaderboardClient(100);

    const result = await upsertDailyLeaderboardEntry(client, "user-1", {
      dateKey: "2026-05-12",
      seconds: 120,
    });

    expect(result).toEqual({ seconds: 100 });
    expect(client.calls.some(([name]) => name === "upsert")).toBe(false);
  });
});

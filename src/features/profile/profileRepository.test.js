import { describe, expect, it } from "vitest";
import { normalizeProfile, recordProfileSolve } from "./profileRepository.js";

describe("profile repository helpers", () => {
  it("normalizes new profile fields for retention stats", () => {
    const profile = normalizeProfile({ name: "Dana", achievements: "bad", statsByMode: null });

    expect(profile.name).toBe("Dana");
    expect(profile.achievements).toEqual([]);
    expect(profile.statsByMode).toEqual({});
  });

  it("records solve achievements and stats by mode", () => {
    const profile = normalizeProfile({ xp: 10, solved: 1, streak: 2, lastPlayed: "2026-05-11" });
    const game = {
      mode: "daily",
      difficulty: "hard",
      hintsUsed: 0,
      mistakes: 0,
    };

    const next = recordProfileSolve(profile, game, 170, 50, {
      today: "2026-05-12",
      yesterday: "2026-05-11",
    });

    expect(next.xp).toBe(60);
    expect(next.solved).toBe(2);
    expect(next.streak).toBe(3);
    expect(next.badges).toEqual(expect.arrayContaining(["Чистое решение", "Молния"]));
    expect(next.achievements).toEqual(expect.arrayContaining(["Чистое решение", "Молния"]));
    expect(next.statsByMode.daily).toMatchObject({ solved: 1, bestSeconds: 170, cleanSolves: 1 });
  });
});

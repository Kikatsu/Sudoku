import { describe, expect, it } from "vitest";
import { LEARNING_LEVELS, isLessonUnlocked } from "./learningLevels.js";

describe("learning path metadata", () => {
  it("adds technique, objective, difficulty, and prerequisites to every lesson", () => {
    for (const [index, level] of LEARNING_LEVELS.entries()) {
      expect(level.technique).toBeTruthy();
      expect(level.objective.en).toBeTruthy();
      expect(level.recommendedDifficulty).toBe(level.difficulty);
      expect(level.prerequisiteLessonIds).toEqual(index === 0 ? [] : [LEARNING_LEVELS[index - 1].id]);
    }
  });

  it("unlocks lessons through explicit previous-lesson completion", () => {
    expect(isLessonUnlocked("l01", [])).toBe(true);
    expect(isLessonUnlocked("l02", [])).toBe(false);
    expect(isLessonUnlocked("l02", ["l01"])).toBe(true);
  });
});

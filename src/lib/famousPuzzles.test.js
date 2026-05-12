import { beforeEach, describe, expect, it } from "vitest";
import { FAMOUS_PUZZLES, mergeFamousBests, recordFamousBest, loadFamousBests, saveFamousBests, getFamousPuzzleById } from "./famousPuzzles.js";
import { BOARD_UNITS, NUMBERS, countSolutions } from "./sudoku.js";

function isCompleteValidSolution(solution) {
  if (!Array.isArray(solution) || solution.length !== 81) return false;
  if (solution.some((v) => !Number.isInteger(v) || v < 1 || v > 9)) return false;
  return BOARD_UNITS.every((unit) => {
    const seen = new Set(unit.map((idx) => solution[idx]));
    return seen.size === 9 && NUMBERS.every((n) => seen.has(n));
  });
}

describe("famous puzzles dataset", () => {
  it("has a healthy catalog of famous entries with unique ids", () => {
    expect(FAMOUS_PUZZLES.length).toBeGreaterThanOrEqual(10);
    const ids = FAMOUS_PUZZLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const entry of FAMOUS_PUZZLES) {
    describe(entry.id, () => {
      it("has 81-cell puzzle and solution arrays", () => {
        expect(entry.puzzle).toHaveLength(81);
        expect(entry.solution).toHaveLength(81);
      });

      it("solution is a valid completed sudoku", () => {
        expect(isCompleteValidSolution(entry.solution)).toBe(true);
      });

      it("clue cells in the puzzle match the solution", () => {
        for (let i = 0; i < 81; i += 1) {
          if (entry.puzzle[i] !== 0) {
            expect(entry.puzzle[i]).toBe(entry.solution[i]);
          }
        }
      });

      it("puzzle has exactly one solution", () => {
        expect(countSolutions(entry.puzzle, 2)).toBe(1);
      });

      it("provides translated copy for ru / en / kk", () => {
        for (const lang of ["ru", "en", "kk"]) {
          expect(entry.name[lang]).toBeTruthy();
          expect(entry.story[lang]).toBeTruthy();
          expect(entry.tagline[lang]).toBeTruthy();
        }
      });
    });
  }

  it("getFamousPuzzleById returns null for unknown ids", () => {
    expect(getFamousPuzzleById("__nope__")).toBeNull();
    expect(getFamousPuzzleById(FAMOUS_PUZZLES[0].id)).toBe(FAMOUS_PUZZLES[0]);
  });
});

describe("famous bests storage", () => {
  beforeEach(() => {
    saveFamousBests({});
  });

  it("recordFamousBest keeps only the faster entry", () => {
    saveFamousBests({});
    const first = recordFamousBest("ai-escargot", { seconds: 600, mistakes: 1, hintsUsed: 0 });
    expect(first["ai-escargot"].seconds).toBe(600);
    const slower = recordFamousBest("ai-escargot", { seconds: 900, mistakes: 0, hintsUsed: 0 });
    expect(slower["ai-escargot"].seconds).toBe(600);
    const faster = recordFamousBest("ai-escargot", { seconds: 420, mistakes: 0, hintsUsed: 0 });
    expect(faster["ai-escargot"].seconds).toBe(420);
    saveFamousBests({});
  });

  it("recordFamousBest ignores invalid input", () => {
    saveFamousBests({});
    recordFamousBest("", { seconds: 100 });
    recordFamousBest("x", { seconds: NaN });
    recordFamousBest("x", null);
    expect(loadFamousBests()).toEqual({});
  });

  it("mergeFamousBests picks the smallest time per puzzle", () => {
    const local = { a: { seconds: 200 }, b: { seconds: 500 } };
    const remote = { a: { seconds: 150 }, c: { seconds: 999 } };
    const merged = mergeFamousBests(local, remote);
    expect(merged.a.seconds).toBe(150);
    expect(merged.b.seconds).toBe(500);
    expect(merged.c.seconds).toBe(999);
  });
});

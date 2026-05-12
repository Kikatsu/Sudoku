import { describe, expect, it } from "vitest";
import {
  canEnterSolutionNumber,
  countSolutions,
  createGame,
  generatePuzzle,
  isSolved,
  sanitizeEditableValues,
} from "./sudoku.js";

describe("puzzle generation", () => {
  it("createGame yields a uniquely solvable board matching clues", () => {
    const game = createGame("medium", "free");
    expect(game.generator.unique).toBe(true);
    expect(countSolutions(game.puzzle, 2)).toBe(1);
    for (let i = 0; i < 81; i += 1) {
      if (game.puzzle[i]) {
        expect(game.puzzle[i]).toBe(game.solution[i]);
      }
    }
  });

  it("createGame selects a valid empty cell when possible", () => {
    const game = createGame("easy", "free");
    const s = game.selected;
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThan(81);
    expect(game.fixed[s]).toBe(false);
    expect(game.values[s]).toBe(0);
  });

  it("generatePuzzle stays consistent for a fixed seed", () => {
    const a = generatePuzzle("unit-seed", "easy");
    const b = generatePuzzle("unit-seed", "easy");
    expect(a.puzzle.join(",")).toBe(b.puzzle.join(","));
    expect(a.solution.join(",")).toBe(b.solution.join(","));
  });

  it("solved state matches solution grid", () => {
    const game = createGame("easy", "free");
    const done = {
      ...game,
      values: [...game.solution],
      completed: false,
    };
    expect(isSolved(done)).toBe(true);
  });

  it("rejects wrong normal entries before they can poison candidates", () => {
    const game = createGame("easy", "free");
    const index = game.values.findIndex((value, i) => !value && !game.fixed[i]);
    const wrong = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((number) => number !== game.solution[index]);

    expect(canEnterSolutionNumber(game, index, wrong)).toEqual({
      ok: false,
      reason: "wrong-number",
    });
    expect(game.values[index]).toBe(0);
  });

  it("accepts correct normal entries", () => {
    const game = createGame("easy", "free");
    const index = game.values.findIndex((value, i) => !value && !game.fixed[i]);

    expect(canEnterSolutionNumber(game, index, game.solution[index])).toEqual({
      ok: true,
      reason: "correct-number",
    });
  });

  it("repairs legacy saved boards with wrong editable values", () => {
    const game = createGame("easy", "free");
    const index = game.values.findIndex((value, i) => !value && !game.fixed[i]);
    const wrong = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((number) => number !== game.solution[index]);
    const poisoned = [...game.values];
    poisoned[index] = wrong;

    const repaired = sanitizeEditableValues(poisoned, game.fixed, game.solution);

    expect(repaired.values[index]).toBe(0);
    expect(repaired.repairedIndices).toEqual([index]);
  });
});

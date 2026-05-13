import { describe, expect, it } from "vitest";
import { GAME_ACTIONS, sudokuGameReducer } from "./useSudokuGame.js";
import { createGame } from "../../lib/sudoku.js";

function playable(game) {
  return game.values.findIndex((value, index) => !value && !game.fixed[index]);
}

describe("sudoku game action reducer", () => {
  it("toggles note mode and records pencil notes with undo support", () => {
    let game = createGame("easy", "free");
    const index = playable(game);
    game = { ...game, selected: index };

    game = sudokuGameReducer(game, { type: GAME_ACTIONS.TOGGLE_NOTE_MODE });
    game = sudokuGameReducer(game, { type: GAME_ACTIONS.ENTER_NUMBER, number: 3 });

    expect(game.noteMode).toBe(true);
    expect(game.notes[index]).toEqual([3]);
    expect(game.history.length).toBe(1);

    game = sudokuGameReducer(game, { type: GAME_ACTIONS.UNDO });
    expect(game.notes[index]).toEqual([]);
  });

  it("rejects wrong entries without poisoning the board", () => {
    const game = createGame("easy", "free");
    const index = playable(game);
    const wrong = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((number) => number !== game.solution[index]);

    const next = sudokuGameReducer({ ...game, selected: index }, {
      type: GAME_ACTIONS.ENTER_NUMBER,
      number: wrong,
    });

    expect(next.values[index]).toBe(0);
    expect(next.mistakes).toBe(game.mistakes + 1);
    expect(next.lastNumber).toBe(wrong);
  });

  it("places correct numbers, erases them, and redoes the placement", () => {
    let game = createGame("easy", "free");
    const index = playable(game);
    const number = game.solution[index];
    game = { ...game, selected: index };

    game = sudokuGameReducer(game, { type: GAME_ACTIONS.ENTER_NUMBER, number });
    expect(game.values[index]).toBe(number);

    game = sudokuGameReducer(game, { type: GAME_ACTIONS.ERASE });
    expect(game.values[index]).toBe(0);

    game = sudokuGameReducer(game, { type: GAME_ACTIONS.UNDO });
    expect(game.values[index]).toBe(number);

    game = sudokuGameReducer(game, { type: GAME_ACTIONS.REDO });
    expect(game.values[index]).toBe(0);
  });

  it("marks learning boards unclean when a counted hint is requested", () => {
    const game = createGame("easy", "learning", { learningLevelId: "l01" });
    const next = sudokuGameReducer(game, {
      type: GAME_ACTIONS.REQUEST_HINT,
      countHint: true,
      target: 10,
      number: 4,
    });

    expect(next.hintsUsed).toBe(game.hintsUsed + 1);
    expect(next.learningCleanEligible).toBe(false);
    expect(next.selected).toBe(10);
    expect(next.lastNumber).toBe(4);
  });

  it("applies strict coach steps as reducer actions", () => {
    const game = createGame("easy", "free");
    const index = playable(game);
    const step = {
      strict: true,
      target: index,
      number: game.solution[index],
    };

    const next = sudokuGameReducer(game, { type: GAME_ACTIONS.APPLY_COACH_STEP, step });

    expect(next.values[index]).toBe(game.solution[index]);
    expect(next.selected).toBe(index);
    expect(next.history.length).toBe(1);
  });
});

import { describe, expect, it } from "vitest";
import { createInitialGame } from "./App.jsx";
import { createGame } from "./lib/sudoku.js";

describe("app startup", () => {
  it("starts new visitors on an easy free-training board", () => {
    const game = createInitialGame({ kind: "play", lessonId: null }, null);

    expect(game.mode).toBe("free");
    expect(game.difficulty).toBe("easy");
  });

  it("continues an existing saved board on the play route", () => {
    const loaded = createGame("hard", "daily");

    expect(createInitialGame({ kind: "play", lessonId: null }, loaded)).toBe(loaded);
  });
});

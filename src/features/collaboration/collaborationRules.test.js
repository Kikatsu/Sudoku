import { describe, expect, it } from "vitest";
import { createGame } from "../../lib/sudoku.js";
import {
  applyCollaborationAction,
  getActiveMembers,
  getCollaborationLimit,
  getVoteThreshold,
  validateCollaborationAction,
} from "./collaborationRules.js";

function playable(game) {
  return game.values.findIndex((value, index) => !value && !game.fixed[index]);
}

describe("collaboration rules", () => {
  it("maps free and pro room limits", () => {
    expect(getCollaborationLimit(false)).toBe(5);
    expect(getCollaborationLimit(true)).toBe(10);
  });

  it("requires at least half of active members to agree", () => {
    expect(getVoteThreshold(1)).toBe(1);
    expect(getVoteThreshold(2)).toBe(1);
    expect(getVoteThreshold(3)).toBe(2);
    expect(getVoteThreshold(4)).toBe(2);
    expect(getVoteThreshold(5)).toBe(3);
  });

  it("filters stale members out of voting and selections", () => {
    const now = Date.now();
    const members = [
      { user_id: "a", last_seen_at: new Date(now - 5_000).toISOString() },
      { user_id: "b", last_seen_at: new Date(now - 70_000).toISOString() },
    ];

    expect(getActiveMembers(members, now).map((member) => member.user_id)).toEqual(["a"]);
  });

  it("rejects wrong digits and fixed cells before proposal", () => {
    const game = createGame("easy", "free");
    const index = playable(game);
    const wrong = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((number) => number !== game.solution[index]);
    const fixedIndex = game.fixed.findIndex(Boolean);

    expect(validateCollaborationAction(game, { kind: "place", index, number: wrong })).toMatchObject({
      ok: false,
      reason: "wrong-number",
    });
    expect(validateCollaborationAction(game, { kind: "erase", index: fixedIndex })).toMatchObject({
      ok: false,
      reason: "fixedCell",
    });
  });

  it("applies valid shared placements and notes", () => {
    const game = createGame("easy", "free");
    const index = playable(game);
    const placed = applyCollaborationAction(game, {
      kind: "place",
      index,
      number: game.solution[index],
    });

    expect(placed.applied).toBe(true);
    expect(placed.game.values[index]).toBe(game.solution[index]);
    expect(placed.game.history.length).toBe(1);

    const noteIndex = playable(placed.game);
    const noted = applyCollaborationAction(placed.game, { kind: "note", index: noteIndex, number: 3 });
    expect(noted.applied).toBe(true);
    expect(noted.game.notes[noteIndex]).toContain(3);
  });
});

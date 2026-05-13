import { STORAGE_KEY } from "../../app/config.js";
import {
  GAME_RULES_VERSION,
  normalizeNotes,
  sanitizeEditableValues,
} from "../../lib/sudoku.js";
import { normalizeSelection } from "../../lib/gameHistory.js";

export function getElapsed(game, now = Date.now()) {
  if (game.completed) return game.elapsedBefore;
  return game.elapsedBefore + Math.floor((now - game.startedAt) / 1000);
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved.rulesVersion !== GAME_RULES_VERSION) return null;
    if (!saved.generator?.unique) return null;
    if (!Array.isArray(saved.values) || saved.values.length !== 81) return null;
    if (!Array.isArray(saved.puzzle) || saved.puzzle.length !== 81) return null;
    if (!Array.isArray(saved.solution) || saved.solution.length !== 81) return null;
    const fixed =
      Array.isArray(saved.fixed) && saved.fixed.length === 81 ? saved.fixed : saved.puzzle.map(Boolean);

    for (let i = 0; i < 81; i += 1) {
      if (saved.puzzle[i] && saved.puzzle[i] !== saved.solution?.[i]) return null;
    }

    const sanitized = sanitizeEditableValues(saved.values, fixed, saved.solution);
    const repaired = new Set(sanitized.repairedIndices);
    const notes = normalizeNotes(saved.notes).map((note, index) => (repaired.has(index) ? [] : note));

    return {
      ...saved,
      fixed,
      values: sanitized.values,
      selected: normalizeSelection(saved.selected, sanitized.values, fixed),
      startedAt: Date.now(),
      notes,
      hintCells: saved.hintCells || [],
      history: saved.history || [],
      future: saved.future || [],
      awardXp: saved.awardXp || 0,
      suppressVictoryRewards: Boolean(saved.suppressVictoryRewards),
      learningLevelId: saved.learningLevelId,
      learningCleanEligible:
        saved.mode === "learning" ? saved.learningCleanEligible !== false : saved.learningCleanEligible,
    };
  } catch {
    return null;
  }
}

export function saveGame(game) {
  const data = {
    ...game,
    elapsedBefore: getElapsed(game),
    startedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function makeSnapshot(game) {
  const snap = {
    values: [...game.values],
    notes: game.notes.map((note) => [...note]),
    mistakes: game.mistakes,
    hintsUsed: game.hintsUsed,
    lastNumber: game.lastNumber,
    hintCells: [...game.hintCells],
  };
  if (game.mode === "learning") {
    snap.learningCleanEligible = game.learningCleanEligible !== false;
  }
  return snap;
}

export function restoreSnapshot(game, snapshot) {
  return {
    ...game,
    values: [...snapshot.values],
    notes: snapshot.notes.map((note) => [...note]),
    mistakes: snapshot.mistakes,
    hintsUsed: snapshot.hintsUsed,
    lastNumber: snapshot.lastNumber,
    hintCells: [...snapshot.hintCells],
    learningCleanEligible:
      snapshot.learningCleanEligible !== undefined
        ? snapshot.learningCleanEligible
        : game.learningCleanEligible,
  };
}

export function withHistory(game) {
  return {
    ...game,
    history: [...game.history.slice(-119), makeSnapshot(game)],
    future: [],
  };
}

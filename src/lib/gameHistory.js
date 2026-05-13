import { GAME_RULES_VERSION, makeNotes, normalizeNotes } from "./sudoku.js";

export const HISTORY_ARCHIVE_KEY = "sana-sudoku-game-archive-v1";
export const MAX_ARCHIVED_GAMES = 60;

export function gameHasProgress(game) {
  if (!game || game.completed) return false;
  if (game.history.length > 0) return true;
  if (game.mistakes > 0 || game.hintsUsed > 0) return true;
  return game.values.some((v, i) => v !== game.puzzle[i]);
}

/** Boards after each distinct value-grid state (pencil-only edits omitted). */
export function buildValueTimeline(game) {
  const puzzle = [...game.puzzle];
  const frames = [];
  const pushFrame = (v) => {
    const key = v.join(",");
    if (!frames.length || frames[frames.length - 1].key !== key) {
      frames.push({ key, values: [...v] });
    }
  };
  pushFrame(puzzle);
  for (const snap of game.history || []) {
    if (snap?.values) pushFrame(snap.values);
  }
  pushFrame(game.values);
  return frames.map((f) => f.values);
}

export function analyzePlacements(timeline, solution, fixed) {
  const moves = [];
  for (let i = 1; i < timeline.length; i += 1) {
    const prev = timeline[i - 1];
    const cur = timeline[i];
    for (let c = 0; c < 81; c += 1) {
      if (fixed[c]) continue;
      if (prev[c] === cur[c]) continue;
      const placed = cur[c];
      const kind = placed === 0 ? "erase" : "place";
      const correct = placed === 0 || placed === solution[c];
      moves.push({
        stepIndex: i,
        index: c,
        kind,
        value: placed,
        correct,
        better: kind === "place" && !correct ? solution[c] : null,
      });
    }
  }
  return moves;
}

function snapshotUndoSlice(snap) {
  if (!snap) return null;
  return {
    values: [...snap.values],
    notes: snap.notes.map((note) => [...note]),
    mistakes: snap.mistakes,
    hintsUsed: snap.hintsUsed,
    lastNumber: snap.lastNumber,
    hintCells: [...(snap.hintCells || [])],
    learningCleanEligible: snap.learningCleanEligible,
  };
}

/** Full game snapshot so an unfinished (or in-progress won) board can be resumed from history. */
export function snapshotRestorePayload(game, options = {}) {
  const elapsed =
    options.elapsedSec ??
    (Number.isFinite(game.elapsedBefore) ? game.elapsedBefore : 0);
  return {
    rulesVersion: game.rulesVersion ?? GAME_RULES_VERSION,
    difficulty: game.difficulty,
    mode: game.mode,
    seed: game.seed,
    puzzle: [...game.puzzle],
    solution: [...game.solution],
    generator: game.generator,
    fixed: [...game.fixed],
    values: [...game.values],
    notes: game.notes.map((n) => [...n]),
    selected: game.selected,
    noteMode: Boolean(game.noteMode),
    elapsedBefore: elapsed,
    completed: Boolean(game.completed),
    mistakes: game.mistakes,
    hintsUsed: game.hintsUsed,
    history: (game.history || []).map(snapshotUndoSlice).filter(Boolean),
    future: (game.future || []).map(snapshotUndoSlice).filter(Boolean),
    hintCells: [...(game.hintCells || [])],
    lastNumber: game.lastNumber,
    wrongEntries: (game.wrongEntries || []).map((entry) => ({ ...entry })),
    activityLog: (game.activityLog || []).map((entry) => ({ ...entry })),
    awardXp: game.awardXp ?? 0,
    suppressVictoryRewards: Boolean(game.suppressVictoryRewards),
    learningLevelId: game.learningLevelId,
    learningCleanEligible: game.learningCleanEligible,
    famousId: game.famousId,
  };
}

export function firstPlayableIndex(values, fixed) {
  const idx = values.findIndex((v, i) => !fixed[i] && !v);
  if (idx >= 0) return idx;
  const editable = fixed.findIndex((f) => !f);
  return editable >= 0 ? editable : 0;
}

/** Valid 0..80 selection, or a sensible empty cell for typing. */
export function normalizeSelection(selected, values, fixed) {
  if (Number.isInteger(selected) && selected >= 0 && selected < 81) return selected;
  return firstPlayableIndex(values, fixed);
}

/** Rebuild a live `game` object from an archive row (continues unfinished games). */
export function restoreGameFromRecord(record) {
  const r = record.restore;
  if (
    r &&
    Array.isArray(r.values) &&
    r.values.length === 81 &&
    Array.isArray(r.puzzle) &&
    r.puzzle.length === 81 &&
    Array.isArray(r.solution) &&
    r.solution.length === 81
  ) {
    const history = (r.history || []).map(snapshotUndoSlice).filter(Boolean);
    const future = (r.future || []).map(snapshotUndoSlice).filter(Boolean);
    const fixed =
      Array.isArray(r.fixed) && r.fixed.length === 81 ? [...r.fixed] : r.puzzle.map(Boolean);
    return {
      rulesVersion: r.rulesVersion ?? GAME_RULES_VERSION,
      difficulty: r.difficulty,
      mode: r.mode,
      seed: r.seed,
      puzzle: [...r.puzzle],
      solution: [...r.solution],
      generator: r.generator ?? {
        unique: true,
        clues: record.clues ?? r.puzzle.filter(Boolean).length,
        actualHoles: 81 - (record.clues ?? r.puzzle.filter(Boolean).length),
        targetHoles: 0,
      },
      fixed,
      values: [...r.values],
      notes: normalizeNotes(r.notes),
      selected: normalizeSelection(r.selected, r.values, fixed),
      noteMode: Boolean(r.noteMode),
      startedAt: Date.now(),
      elapsedBefore: Number.isFinite(r.elapsedBefore) ? r.elapsedBefore : record.elapsedSec ?? 0,
      completed: false,
      mistakes: r.mistakes ?? 0,
      hintsUsed: r.hintsUsed ?? 0,
      history,
      future,
      hintCells: [...(r.hintCells || [])],
      lastNumber: r.lastNumber ?? null,
      wrongEntries: (r.wrongEntries || []).map((entry) => ({ ...entry })),
      activityLog: (r.activityLog || []).map((entry) => ({ ...entry })),
      awardXp: r.awardXp ?? 0,
      suppressVictoryRewards: record.outcome === "won",
      learningLevelId: r.learningLevelId,
      learningCleanEligible:
        r.mode === "learning" ? r.learningCleanEligible !== false : r.learningCleanEligible,
      famousId: r.famousId,
    };
  }

  const values = [...record.timeline[record.timeline.length - 1]];
  const puzzle = [...record.puzzle];
  const fixed = [...record.fixed];
  return {
    rulesVersion: GAME_RULES_VERSION,
    difficulty: record.difficulty,
    mode: record.mode,
    seed: record.seed,
    puzzle,
    solution: [...record.solution],
    generator: {
      unique: true,
      targetHoles: 0,
      actualHoles: 81 - (record.clues ?? puzzle.filter(Boolean).length),
      clues: record.clues ?? puzzle.filter(Boolean).length,
    },
    fixed,
    values,
    notes: makeNotes(),
    selected: firstPlayableIndex(values, fixed),
    noteMode: false,
    startedAt: Date.now(),
    elapsedBefore: record.elapsedSec ?? 0,
    completed: false,
    mistakes: record.mistakes ?? 0,
    hintsUsed: record.hintsUsed ?? 0,
    history: [],
    future: [],
    hintCells: [],
    lastNumber: null,
    wrongEntries: [],
    activityLog: [],
    awardXp: record.awardXp ?? 0,
    suppressVictoryRewards: record.outcome === "won",
    learningLevelId: record.learningLevelId,
    learningCleanEligible:
      record.mode === "learning" ? record.learningCleanEligible !== false : record.learningCleanEligible,
    famousId: record.famousId,
  };
}

export function createRecordFromGame(game, outcome, options = {}) {
  const timeline = buildValueTimeline(game);
  const placements = analyzePlacements(timeline, game.solution, game.fixed);
  const wrongPlacements = placements.filter((m) => m.kind === "place" && !m.correct);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    rulesVersion: GAME_RULES_VERSION,
    endedAt: Date.now(),
    startedAt: game.startedAt || options.startedAt || Date.now(),
    outcome,
    difficulty: game.difficulty,
    mode: game.mode,
    seed: game.seed,
    learningLevelId: game.learningLevelId,
    learningCleanEligible: game.learningCleanEligible,
    famousId: game.famousId,
    puzzle: [...game.puzzle],
    solution: [...game.solution],
    fixed: [...game.fixed],
    clues: game.generator?.clues ?? null,
    generator: game.generator ?? null,
    elapsedSec: options.elapsedSec ?? 0,
    mistakes: game.mistakes,
    hintsUsed: game.hintsUsed,
    awardXp: options.awardXp ?? game.awardXp ?? 0,
    filledFinal: game.values.filter(Boolean).length,
    timeline,
    placements,
    wrongEntries: (game.wrongEntries || []).map((entry) => ({ ...entry })),
    activityLog: (game.activityLog || []).map((entry) => ({ ...entry })),
    wrongCount: wrongPlacements.length,
    moveCount: placements.length,
    restore: snapshotRestorePayload(game, options),
  };
}

export function loadArchive() {
  try {
    const raw = localStorage.getItem(HISTORY_ARCHIVE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (r) =>
        r.id !== "__history_preview__" &&
        r.rulesVersion === GAME_RULES_VERSION &&
        Array.isArray(r.timeline) &&
        r.timeline.length,
    );
  } catch {
    return [];
  }
}

export function saveArchive(records) {
  localStorage.setItem(HISTORY_ARCHIVE_KEY, JSON.stringify(records.slice(0, MAX_ARCHIVED_GAMES)));
}

export function appendToArchive(game, outcome, options) {
  const record = createRecordFromGame(game, outcome, options);
  const prev = loadArchive();
  saveArchive([record, ...prev]);
  return record;
}

export function sortRecords(records, sortKey) {
  const next = [...records];
  switch (sortKey) {
    case "dateOld":
      return next.sort((a, b) => a.endedAt - b.endedAt);
    case "timeFast":
      return next.sort((a, b) => a.elapsedSec - b.elapsedSec);
    case "timeSlow":
      return next.sort((a, b) => b.elapsedSec - a.elapsedSec);
    case "mistakesLow":
      return next.sort((a, b) => a.mistakes - b.mistakes);
    case "mistakesHigh":
      return next.sort((a, b) => b.mistakes - a.mistakes);
    case "dateNew":
    default:
      return next.sort((a, b) => b.endedAt - a.endedAt);
  }
}

/** Static demo record for empty history UI (not stored in archive). */
const PREVIEW_PUZZLE = [
  5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0, 0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
];

const PREVIEW_SOLUTION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
];

const PREVIEW_FIXED = PREVIEW_PUZZLE.map((v) => Boolean(v));
const PREVIEW_T0 = [...PREVIEW_PUZZLE];
const PREVIEW_T1 = [...PREVIEW_T0];
PREVIEW_T1[2] = 4;
const PREVIEW_T2 = [...PREVIEW_T1];
PREVIEW_T2[3] = 9;
const PREVIEW_T3 = [...PREVIEW_T2];
PREVIEW_T3[3] = 6;

const PREVIEW_TIMELINE = [PREVIEW_T0, PREVIEW_T1, PREVIEW_T2, PREVIEW_T3];
const PREVIEW_PLACEMENTS = analyzePlacements(PREVIEW_TIMELINE, PREVIEW_SOLUTION, PREVIEW_FIXED);
const PREVIEW_WRONG = PREVIEW_PLACEMENTS.filter((m) => m.kind === "place" && !m.correct);

export const HISTORY_PREVIEW_RECORD = {
  id: "__history_preview__",
  rulesVersion: GAME_RULES_VERSION,
  endedAt: Date.now() - 36e6,
  startedAt: Date.now() - 36e6,
  outcome: "won",
  difficulty: "medium",
  mode: "free",
  seed: "preview-demo",
  puzzle: PREVIEW_PUZZLE,
  solution: PREVIEW_SOLUTION,
  fixed: PREVIEW_FIXED,
  generator: { unique: true, clues: PREVIEW_PUZZLE.filter(Boolean).length, actualHoles: 81 - PREVIEW_PUZZLE.filter(Boolean).length, targetHoles: 0 },
  clues: PREVIEW_PUZZLE.filter(Boolean).length,
  elapsedSec: 245,
  mistakes: 1,
  hintsUsed: 1,
  awardXp: 48,
  filledFinal: PREVIEW_T3.filter(Boolean).length,
  timeline: PREVIEW_TIMELINE,
  placements: PREVIEW_PLACEMENTS,
  wrongCount: PREVIEW_WRONG.length,
  moveCount: PREVIEW_PLACEMENTS.length,
};

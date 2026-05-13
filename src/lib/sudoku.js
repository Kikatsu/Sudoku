export const GAME_RULES_VERSION = 3;
export const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const DIFFICULTIES = {
  easy: { label: "Легко", holes: 36, xp: 40 },
  medium: { label: "Средне", holes: 44, xp: 60 },
  hard: { label: "Сложно", holes: 50, xp: 85 },
  expert: { label: "Мастер", holes: 55, xp: 120 },
  impossible: { label: "Невозможно", holes: 58, xp: 180 },
};

export const CELL_INDICES = Array.from({ length: 81 }, (_, index) => index);
export const BOARD_UNITS = createUnits();
export const CELL_PEERS = CELL_INDICES.map((index) => createPeerSet(index));

function initialSelectionIndex(puzzle, fixed) {
  const idx = puzzle.findIndex((value, i) => value === 0 && !fixed[i]);
  if (idx >= 0) return idx;
  const editable = fixed.findIndex((f) => !f);
  return editable >= 0 ? editable : 0;
}

export function createGame(difficulty = "medium", mode = "free", options = {}) {
  const dateKey = getDateKey();
  let seed;
  if (mode === "learning" && options.learningLevelId) {
    seed = `learning-${options.learningLevelId}`;
  } else if (mode === "daily") {
    seed = `daily-${dateKey}`;
  } else {
    seed = `${difficulty}-${Date.now()}`;
  }

  let puzzle;
  let solution;
  let generator;
  for (let retry = 0; retry < 14; retry += 1) {
    const attemptSeed = retry === 0 ? seed : `${seed}-r${retry}`;
    const built = generatePuzzle(attemptSeed, difficulty);
    ({ puzzle, solution, generator } = built);
    if (generator.unique && countSolutions(puzzle, 2) === 1) break;
  }

  const fixed = puzzle.map(Boolean);
  const selected = initialSelectionIndex(puzzle, fixed);

  const base = {
    rulesVersion: GAME_RULES_VERSION,
    difficulty,
    mode,
    seed,
    puzzle,
    solution,
    generator,
    values: [...puzzle],
    fixed,
    notes: makeNotes(),
    selected,
    noteMode: false,
    startedAt: Date.now(),
    elapsedBefore: 0,
    completed: false,
    mistakes: 0,
    hintsUsed: 0,
    history: [],
    future: [],
    hintCells: [],
    lastNumber: null,
    wrongEntries: [],
    activityLog: [],
    awardXp: 0,
    suppressVictoryRewards: false,
  };

  if (mode === "learning" && options.learningLevelId) {
    return {
      ...base,
      learningLevelId: options.learningLevelId,
      learningCleanEligible: true,
    };
  }

  return base;
}

export function createGameFromPuzzle({ id, puzzle, solution, difficulty = "impossible" }) {
  const safePuzzle = [...puzzle];
  const safeSolution = [...solution];
  const fixed = safePuzzle.map(Boolean);
  const selected = initialSelectionIndex(safePuzzle, fixed);
  const clues = safePuzzle.filter(Boolean).length;

  return {
    rulesVersion: GAME_RULES_VERSION,
    difficulty,
    mode: "famous",
    seed: `famous-${id}`,
    famousId: id,
    puzzle: safePuzzle,
    solution: safeSolution,
    generator: {
      unique: true,
      targetHoles: 81 - clues,
      actualHoles: 81 - clues,
      clues,
    },
    values: [...safePuzzle],
    fixed,
    notes: makeNotes(),
    selected,
    noteMode: false,
    startedAt: Date.now(),
    elapsedBefore: 0,
    completed: false,
    mistakes: 0,
    hintsUsed: 0,
    history: [],
    future: [],
    hintCells: [],
    lastNumber: null,
    wrongEntries: [],
    activityLog: [],
    awardXp: 0,
    suppressVictoryRewards: false,
  };
}

export function makeNotes() {
  return Array.from({ length: 81 }, () => []);
}

export function normalizeNotes(notes) {
  if (!Array.isArray(notes) || notes.length !== 81) return makeNotes();
  return notes.map((entry) =>
    Array.isArray(entry)
      ? entry.map(Number).filter((value) => value >= 1 && value <= 9)
      : [],
  );
}

export function sanitizeEditableValues(values, fixed, solution) {
  const safeValues = Array.isArray(values) && values.length === 81 ? values : Array(81).fill(0);
  const safeFixed = Array.isArray(fixed) && fixed.length === 81 ? fixed : Array(81).fill(false);
  const safeSolution = Array.isArray(solution) && solution.length === 81 ? solution : Array(81).fill(0);
  const repairedIndices = [];

  const sanitized = safeValues.map((rawValue, index) => {
    const value = Number(rawValue) || 0;
    if (!value || safeFixed[index]) return value;
    if (value !== safeSolution[index]) {
      repairedIndices.push(index);
      return 0;
    }
    return value;
  });

  return { values: sanitized, repairedIndices };
}

export function canEnterSolutionNumber(game, index, number) {
  if (!game || !Number.isInteger(index) || index < 0 || index > 80) {
    return { ok: false, reason: "invalid-cell" };
  }
  if (game.fixed?.[index]) {
    return { ok: false, reason: "fixed-cell" };
  }
  if (game.solution?.[index] !== number) {
    return { ok: false, reason: "wrong-number" };
  }
  return { ok: true, reason: "correct-number" };
}

export function generatePuzzle(seed, difficulty) {
  const targetHoles = DIFFICULTIES[difficulty].holes;
  const attempts = difficulty === "impossible" ? 10 : difficulty === "expert" ? 6 : 3;
  let best = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = buildUniquePuzzle(`${seed}-${attempt}`, difficulty);
    if (!best || candidate.generator.actualHoles > best.generator.actualHoles) {
      best = candidate;
    }
    if (candidate.generator.actualHoles >= targetHoles) return candidate;
  }

  return best;
}

function buildUniquePuzzle(seed, difficulty) {
  const rng = makeRng(seed);
  const solution = generateSolution(rng);
  const puzzle = [...solution];
  const targetHoles = DIFFICULTIES[difficulty].holes;
  const cells = shuffle(CELL_INDICES, rng);
  let removed = 0;

  for (const index of cells) {
    if (removed >= targetHoles) break;
    if (puzzle[index] === 0) continue;

    const pairIndex = 80 - index;
    const removal = pairIndex !== index && puzzle[pairIndex] !== 0 ? [index, pairIndex] : [index];
    if (removed + removal.length > targetHoles) continue;

    const backup = removal.map((cellIndex) => [cellIndex, puzzle[cellIndex]]);
    removal.forEach((cellIndex) => {
      puzzle[cellIndex] = 0;
    });

    if (countSolutions(puzzle, 2) === 1) {
      removed += removal.length;
    } else {
      backup.forEach(([cellIndex, value]) => {
        puzzle[cellIndex] = value;
      });
    }
  }

  for (const index of cells) {
    if (removed >= targetHoles) break;
    if (puzzle[index] === 0) continue;

    const backup = puzzle[index];
    puzzle[index] = 0;
    if (countSolutions(puzzle, 2) === 1) {
      removed += 1;
    } else {
      puzzle[index] = backup;
    }
  }

  return {
    puzzle,
    solution,
    generator: {
      unique: countSolutions(puzzle, 2) === 1,
      targetHoles,
      actualHoles: removed,
      clues: 81 - removed,
    },
  };
}

function generateSolution(rng) {
  const board = Array(81).fill(0);
  fillBoard(board, rng);
  return board;
}

function fillBoard(board, rng) {
  const index = board.findIndex((value) => value === 0);
  if (index === -1) return true;

  for (const number of shuffle(getBoardCandidates(board, index), rng)) {
    board[index] = number;
    if (fillBoard(board, rng)) return true;
    board[index] = 0;
  }

  return false;
}

export function countSolutions(board, limit = 2) {
  const working = [...board];
  let found = 0;

  function solve() {
    if (found >= limit) return;

    const next = findBestEmptyCell(working);
    if (!next) {
      found += 1;
      return;
    }
    if (next.candidates.length === 0) return;

    for (const number of next.candidates) {
      working[next.index] = number;
      solve();
      working[next.index] = 0;
      if (found >= limit) return;
    }
  }

  solve();
  return found;
}

function findBestEmptyCell(board) {
  let best = null;

  for (const index of CELL_INDICES) {
    if (board[index] !== 0) continue;
    const candidates = getBoardCandidates(board, index);
    if (!best || candidates.length < best.candidates.length) {
      best = { index, candidates };
      if (candidates.length <= 1) break;
    }
  }

  return best;
}

function getBoardCandidates(board, index) {
  if (board[index] !== 0) return [];
  const used = new Set();
  CELL_PEERS[index].forEach((peer) => {
    if (board[peer]) used.add(board[peer]);
  });
  return NUMBERS.filter((number) => !used.has(number));
}

function makeRng(seed) {
  let value = hashSeed(seed);
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(seed) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffle(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createUnits() {
  const units = [];

  for (let row = 0; row < 9; row += 1) {
    units.push(Array.from({ length: 9 }, (_, col) => row * 9 + col));
  }

  for (let col = 0; col < 9; col += 1) {
    units.push(Array.from({ length: 9 }, (_, row) => row * 9 + col));
  }

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const unit = [];
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          unit.push((boxRow * 3 + row) * 9 + boxCol * 3 + col);
        }
      }
      units.push(unit);
    }
  }

  return units;
}

function createPeerSet(index) {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  const peers = new Set();

  for (let i = 0; i < 9; i += 1) {
    peers.add(row * 9 + i);
    peers.add(i * 9 + col);
  }

  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      peers.add((boxRow + r) * 9 + boxCol + c);
    }
  }

  peers.delete(index);
  return peers;
}

export function getPeers(index) {
  return CELL_PEERS[index];
}

export function getCandidates(values, index) {
  if (values[index]) return [];
  const used = new Set();
  getPeers(index).forEach((peer) => {
    if (values[peer]) used.add(values[peer]);
  });
  return NUMBERS.filter((number) => !used.has(number));
}

export function getConflictIndices(values) {
  const conflicts = new Set();
  BOARD_UNITS.forEach((unit) => {
    const positionsByValue = new Map();
    unit.forEach((index) => {
      const value = values[index];
      if (!value) return;
      if (!positionsByValue.has(value)) positionsByValue.set(value, []);
      positionsByValue.get(value).push(index);
    });
    positionsByValue.forEach((positions) => {
      if (positions.length > 1) {
        positions.forEach((index) => conflicts.add(index));
      }
    });
  });
  return conflicts;
}

export function findBlockers(values, index, number) {
  return [...getPeers(index)].filter((peer) => values[peer] === number);
}

export function isBoardSolvedByRules(values) {
  return BOARD_UNITS.every((unit) => {
    const unitValues = unit.map((index) => values[index]);
    return NUMBERS.every((number) => unitValues.includes(number));
  });
}

export function isSolved(game) {
  return (
    game.values.every((value, index) => value === game.solution[index]) &&
    isBoardSolvedByRules(game.values)
  );
}

export function findHint(game) {
  for (let index = 0; index < 81; index += 1) {
    const candidates = getCandidates(game.values, index);
    if (candidates.length === 1) {
      return {
        index,
        number: candidates[0],
        technique: "Naked Single",
        message: `В ячейке ${cellName(index)} остался единственный кандидат: ${candidates[0]}. Все остальные числа уже видны в строке, столбце или квадрате.`,
      };
    }
  }

  const hidden = findHiddenSingle(game.values);
  if (hidden) return hidden;

  const emptyCells = game.values
    .map((value, index) => ({ index, candidates: value ? [] : getCandidates(game.values, index) }))
    .filter((cell) => cell.candidates.length > 0)
    .sort((a, b) => a.candidates.length - b.candidates.length);

  if (!emptyCells.length) return null;

  const choice = emptyCells[0];
  return {
    index: choice.index,
    number: game.solution[choice.index],
    technique: "Candidate Scan",
    message: `${cellName(choice.index)} сейчас имеет ${choice.candidates.length} кандидата: ${choice.candidates.join(", ")}. Сфокусируйтесь на этом квадрате и проверьте пересечения строк.`,
  };
}

function findHiddenSingle(values) {
  const labels = [
    ...Array.from({ length: 9 }, (_, index) => `строке ${index + 1}`),
    ...Array.from({ length: 9 }, (_, index) => `столбце ${index + 1}`),
    ...Array.from({ length: 9 }, (_, index) => `квадрате ${index + 1}`),
  ];

  for (let unitIndex = 0; unitIndex < BOARD_UNITS.length; unitIndex += 1) {
    const unit = BOARD_UNITS[unitIndex];
    for (const number of NUMBERS) {
      const possible = unit.filter(
        (index) => !values[index] && getCandidates(values, index).includes(number),
      );
      if (possible.length === 1) {
        return {
          index: possible[0],
          number,
          technique: "Hidden Single",
          message: `В ${labels[unitIndex]} число ${number} может стоять только в ${cellName(possible[0])}. Это скрытая одиночка.`,
        };
      }
    }
  }

  return null;
}

export function cellName(index) {
  return `R${Math.floor(index / 9) + 1}C${(index % 9) + 1}`;
}

export function getDateKey(time = Date.now()) {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getElapsedSeconds(game) {
  if (game.completed) return game.elapsedBefore;
  return game.elapsedBefore + Math.floor((Date.now() - game.startedAt) / 1000);
}

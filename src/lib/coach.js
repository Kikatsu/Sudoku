import {
  BOARD_UNITS,
  CELL_INDICES,
  NUMBERS,
  cellName,
  findBlockers,
  getCandidates,
  getConflictIndices,
  getDateKey,
} from "./sudoku.js";

const UNIT_LABELS = [
  ...Array.from({ length: 9 }, (_, index) => `строка ${index + 1}`),
  ...Array.from({ length: 9 }, (_, index) => `столбец ${index + 1}`),
  ...Array.from({ length: 9 }, (_, index) => `квадрат ${index + 1}`),
];

const TECHNIQUE_COPY = {
  "Naked Single": {
    title: "Naked Single",
    short: "В клетке остался ровно один допустимый кандидат.",
  },
  "Hidden Single": {
    title: "Hidden Single",
    short: "Внутри строки, столбца или квадрата число может стоять только в одном месте.",
  },
  "Locked Candidate / Pointing": {
    title: "Locked Candidate / Pointing",
    short: "Кандидаты числа заперты в одной линии внутри квадрата, значит в этой линии вне квадрата число можно исключить.",
  },
  "Candidate Scan": {
    title: "Candidate Scan",
    short: "Это не готовый ход, а лучшая точка внимания: клетка с минимальным числом кандидатов.",
  },
  "Conflict Explanation": {
    title: "Conflict Explanation",
    short: "Красные или подсвеченные клетки показывают, почему число нарушает правило.",
  },
};

export function createCoachStep(game, mode = "hint", options = {}) {
  const conflicts = getConflictIndices(game.values);
  if (conflicts.size > 0 && mode !== "why") {
    return createBoardConflictStep(game.values, conflicts);
  }

  if (mode === "why") {
    return explainCandidate(game, options.index, options.number);
  }

  const hint =
    findNakedSingle(game) ||
    findHiddenSingle(game) ||
    findLockedCandidate(game) ||
    findCandidateScan(game);

  if (!hint) {
    return {
      id: "coach-complete",
      mode,
      kind: "status",
      technique: "Candidate Scan",
      title: "Доска почти закрыта",
      number: null,
      target: null,
      candidates: [],
      confidence: 0.4,
      strict: false,
      summary: "Я не вижу безопасного обучающего шага в текущем состоянии.",
      explanation: "Проверьте красные конфликты или заполните очевидные клетки по правилам строк, столбцов и квадратов.",
      proof: "Coach не будет угадывать число, если ход не доказан.",
      highlights: emptyHighlights(),
    };
  }

  return {
    ...hint,
    mode,
    id: `${hint.technique}-${hint.target ?? "unit"}-${hint.number ?? "scan"}`,
  };
}

export function createLessonStep(game) {
  const dateKey = getDateKey();
  const rotation = [
    findNakedSingle,
    findHiddenSingle,
    findLockedCandidate,
    findCandidateScan,
  ];
  const start = hashText(dateKey) % rotation.length;

  for (let offset = 0; offset < rotation.length; offset += 1) {
    const finder = rotation[(start + offset) % rotation.length];
    const step = finder(game);
    if (step) {
      return {
        ...step,
        mode: "lesson",
        id: `lesson-${step.technique}-${step.target ?? step.number ?? "scan"}`,
        summary: `Урок дня: ${TECHNIQUE_COPY[step.technique].short}`,
      };
    }
  }

  return createCoachStep(game, "lesson");
}

export function findLockedCandidateStep(game) {
  return findLockedCandidate(game);
}

export function explainCandidate(game, index, number) {
  if (index === null || index === undefined) {
    return {
      id: "why-no-cell",
      mode: "why",
      kind: "instruction",
      technique: "Conflict Explanation",
      title: TECHNIQUE_COPY["Conflict Explanation"].title,
      number: null,
      target: null,
      candidates: [],
      confidence: 0.2,
      strict: false,
      summary: "Выберите клетку и число.",
      explanation: "После этого Coach покажет, какая строка, столбец или квадрат блокирует этот вариант.",
      proof: "Сначала нужна конкретная клетка.",
      highlights: emptyHighlights(),
    };
  }

  if (game.fixed?.[index]) {
    return {
      id: `why-fixed-${index}`,
      mode: "why",
      kind: "instruction",
      technique: "Conflict Explanation",
      title: TECHNIQUE_COPY["Conflict Explanation"].title,
      number: game.values[index],
      target: index,
      candidates: [],
      confidence: 1,
      strict: false,
      summary: `${cellName(index)} уже задана в условии.`,
      explanation: "Стартовые числа являются частью пазла, поэтому их нельзя менять.",
      proof: "Проверяйте только пустые клетки: именно они составляют решение.",
      highlights: {
        ...emptyHighlights(),
        target: [index],
      },
    };
  }

  if (!number) {
    return {
      id: `why-no-number-${index}`,
      mode: "why",
      kind: "instruction",
      technique: "Conflict Explanation",
      title: TECHNIQUE_COPY["Conflict Explanation"].title,
      number: null,
      target: index,
      candidates: getCandidates(game.values, index),
      confidence: 0.3,
      strict: false,
      summary: `Для ${cellName(index)} выберите число на панели ввода.`,
      explanation: "Coach сравнит число с уже заполненными клетками в строке, столбце и квадрате.",
      proof: "Без выбранного числа нечего проверять.",
      highlights: {
        ...emptyHighlights(),
        target: [index],
      },
    };
  }

  const blockers = findBlockers(game.values, index, number);
  const unit = getMostRelevantUnit(index, blockers);
  const candidates = getCandidates(game.values, index);

  if (blockers.length > 0) {
    return {
      id: `why-blocked-${index}-${number}`,
      mode: "why",
      kind: "conflict",
      technique: "Conflict Explanation",
      title: TECHNIQUE_COPY["Conflict Explanation"].title,
      number,
      target: index,
      candidates,
      confidence: 1,
      strict: false,
      summary: `${number} нельзя поставить в ${cellName(index)}.`,
      explanation: `Это число уже стоит в подсвеченной зоне, поэтому ход нарушит правило судоку.`,
      proof: `Блокирующие клетки: ${blockers.map(cellName).join(", ")}.`,
      highlights: {
        ...emptyHighlights(),
        target: [index],
        unit,
        blockers,
      },
    };
  }

  const isSolution = game.solution[index] === number;
  return {
    id: `why-allowed-${index}-${number}`,
    mode: "why",
    kind: isSolution ? "valid-candidate" : "unproven-candidate",
    technique: "Conflict Explanation",
    title: TECHNIQUE_COPY["Conflict Explanation"].title,
    number,
    target: index,
    candidates,
    confidence: isSolution ? 0.9 : 0.45,
    strict: isSolution && candidates.length === 1,
    summary: `${number} не конфликтует с правилами в ${cellName(index)}.`,
    explanation: isSolution
      ? "Это число совпадает с решением, но Coach всё равно рекомендует ставить его только когда ход доказан техникой."
      : "Прямого конфликта нет, но это ещё не доказательство. Лучше найти одиночку или исключение кандидатов.",
    proof: candidates.length > 0 ? `Текущие кандидаты клетки: ${candidates.join(", ")}.` : "Клетка уже заполнена.",
    highlights: {
      ...emptyHighlights(),
      target: [index],
      unit,
      candidates: [index],
    },
  };
}

function findNakedSingle(game) {
  for (const index of CELL_INDICES) {
    const candidates = getCandidates(game.values, index);
    if (candidates.length === 1) {
      const number = candidates[0];
      const blockers = [...getPeerValuesForOtherNumbers(game.values, index, number)];
      return {
        kind: "placement",
        technique: "Naked Single",
        title: TECHNIQUE_COPY["Naked Single"].title,
        number,
        target: index,
        candidates,
        confidence: 1,
        strict: true,
        summary: `${cellName(index)} может быть только ${number}.`,
        explanation: "Все остальные цифры уже встречаются в строке, столбце или квадрате этой клетки.",
        proof: `Кандидаты ${cellName(index)}: ${candidates.join(", ")}. Значит ход доказан без угадывания.`,
        highlights: {
          ...emptyHighlights(),
          target: [index],
          unit: [...getRelatedUnit(index)],
          blockers,
          candidates: [index],
        },
      };
    }
  }

  return null;
}

function findHiddenSingle(game) {
  for (let unitIndex = 0; unitIndex < BOARD_UNITS.length; unitIndex += 1) {
    const unit = BOARD_UNITS[unitIndex];
    for (const number of NUMBERS) {
      const possible = unit.filter(
        (index) => !game.values[index] && getCandidates(game.values, index).includes(number),
      );
      if (possible.length === 1) {
        const target = possible[0];
        const candidates = getCandidates(game.values, target);
        return {
          kind: "placement",
          technique: "Hidden Single",
          title: TECHNIQUE_COPY["Hidden Single"].title,
          number,
          target,
          candidates,
          confidence: 0.98,
          strict: true,
          summary: `${number} может стоять только в ${cellName(target)} внутри ${UNIT_LABELS[unitIndex]}.`,
          explanation: "Другие пустые клетки этой зоны не допускают это число по пересечениям.",
          proof: `${UNIT_LABELS[unitIndex]} имеет ровно одну позицию для ${number}: ${cellName(target)}.`,
          highlights: {
            ...emptyHighlights(),
            target: [target],
            unit,
            candidates: possible,
            blockers: unit.filter((index) => game.values[index] === number),
          },
        };
      }
    }
  }

  return null;
}

function findLockedCandidate(game) {
  const boxes = BOARD_UNITS.slice(18);

  for (let boxOffset = 0; boxOffset < boxes.length; boxOffset += 1) {
    const box = boxes[boxOffset];
    for (const number of NUMBERS) {
      const positions = box.filter(
        (index) => !game.values[index] && getCandidates(game.values, index).includes(number),
      );
      if (positions.length < 2) continue;

      const rows = new Set(positions.map(rowOf));
      const cols = new Set(positions.map(colOf));
      const lockedLine =
        rows.size === 1
          ? getRowCells([...rows][0])
          : cols.size === 1
            ? getColCells([...cols][0])
            : null;
      if (!lockedLine) continue;

      const eliminations = lockedLine.filter(
        (index) =>
          !box.includes(index) &&
          !game.values[index] &&
          getCandidates(game.values, index).includes(number),
      );
      if (eliminations.length === 0) continue;

      const lineName = rows.size === 1 ? `строке ${[...rows][0] + 1}` : `столбце ${[...cols][0] + 1}`;
      return {
        kind: "elimination",
        technique: "Locked Candidate / Pointing",
        title: TECHNIQUE_COPY["Locked Candidate / Pointing"].title,
        number,
        target: positions[0],
        candidates: [number],
        confidence: 0.86,
        strict: false,
        summary: `Кандидат ${number} заперт в ${lineName} внутри квадрата ${boxOffset + 1}.`,
        explanation: `Все варианты ${number} в этом квадрате лежат на одной линии, значит вне квадрата на этой линии ${number} можно исключить.`,
        proof: `Клетки-кандидаты в квадрате: ${positions.map(cellName).join(", ")}. Исключения: ${eliminations.map(cellName).join(", ")}.`,
        highlights: {
          ...emptyHighlights(),
          target: positions,
          unit: [...new Set([...box, ...lockedLine])],
          candidates: positions,
          eliminations,
        },
      };
    }
  }

  return null;
}

function findCandidateScan(game) {
  const emptyCells = game.values
    .map((value, index) => ({ index, candidates: value ? [] : getCandidates(game.values, index) }))
    .filter((cell) => cell.candidates.length > 0)
    .sort((a, b) => a.candidates.length - b.candidates.length);

  if (!emptyCells.length) return null;

  const choice = emptyCells[0];
  return {
    kind: "focus",
    technique: "Candidate Scan",
    title: TECHNIQUE_COPY["Candidate Scan"].title,
    number: null,
    target: choice.index,
    candidates: choice.candidates,
    confidence: 0.55,
    strict: false,
    summary: `${cellName(choice.index)} сейчас самая узкая клетка: ${choice.candidates.length} кандидата.`,
    explanation: "Это не ход для автопостановки, но хорошее место для ручной проверки пересечений.",
    proof: `Кандидаты: ${choice.candidates.join(", ")}.`,
    highlights: {
      ...emptyHighlights(),
      target: [choice.index],
      unit: [...getRelatedUnit(choice.index)],
      candidates: [choice.index],
    },
  };
}

function createBoardConflictStep(values, conflicts) {
  const conflictCells = [...conflicts];
  const first = conflictCells[0];
  return {
    id: `board-conflict-${first}`,
    mode: "hint",
    kind: "conflict",
    technique: "Conflict Explanation",
    title: TECHNIQUE_COPY["Conflict Explanation"].title,
    number: values[first],
    target: first,
    candidates: [],
    confidence: 1,
    strict: false,
    summary: "Сначала нужно убрать конфликт на доске.",
    explanation: "Coach не предлагает следующий ход, пока правило судоку уже нарушено.",
    proof: `Проверьте подсвеченные конфликтные клетки: ${conflictCells.map(cellName).join(", ")}.`,
    highlights: {
      ...emptyHighlights(),
      target: [first],
      blockers: conflictCells,
      unit: [...getRelatedUnit(first)],
    },
  };
}

function emptyHighlights() {
  return {
    target: [],
    unit: [],
    blockers: [],
    candidates: [],
    eliminations: [],
  };
}

function getRelatedUnit(index) {
  const units = BOARD_UNITS.filter((unit) => unit.includes(index));
  return new Set(units.flat());
}

function getMostRelevantUnit(index, blockers) {
  if (blockers.length === 0) return [...getRelatedUnit(index)];
  const unit = BOARD_UNITS.find((candidateUnit) =>
    candidateUnit.includes(index) && blockers.some((blocker) => candidateUnit.includes(blocker)),
  );
  return unit || [...getRelatedUnit(index)];
}

function getPeerValuesForOtherNumbers(values, index, number) {
  return new Set(
    [...getRelatedUnit(index)].filter((peer) => peer !== index && values[peer] && values[peer] !== number),
  );
}

function rowOf(index) {
  return Math.floor(index / 9);
}

function colOf(index) {
  return index % 9;
}

function getRowCells(row) {
  return Array.from({ length: 9 }, (_, col) => row * 9 + col);
}

function getColCells(col) {
  return Array.from({ length: 9 }, (_, row) => row * 9 + col);
}

function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

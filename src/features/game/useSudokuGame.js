import { useCallback, useReducer } from "react";
import { canEnterSolutionNumber, getCandidates, isSolved } from "../../lib/sudoku.js";
import { makeSnapshot, restoreSnapshot, withHistory } from "./gameRepository.js";

export const GAME_ACTIONS = {
  REPLACE: "REPLACE",
  START_GAME: "START_GAME",
  SELECT_CELL: "SELECT_CELL",
  TOGGLE_NOTE_MODE: "TOGGLE_NOTE_MODE",
  ENTER_NUMBER: "ENTER_NUMBER",
  ERASE: "ERASE",
  UNDO: "UNDO",
  REDO: "REDO",
  REQUEST_HINT: "REQUEST_HINT",
  APPLY_COACH_STEP: "APPLY_COACH_STEP",
  COMPLETE_GAME: "COMPLETE_GAME",
};

function cloneNotes(notes) {
  return notes.map((note) => [...note]);
}

function cleanPeerNotes(game, index, number) {
  return game.notes.map((note, noteIndex) => {
    if (noteIndex === index) return [];
    if (!number || !note.includes(number)) return [...note];
    return note.filter((candidate) => candidate !== number);
  });
}

function fillSmartNotes(game) {
  return game.notes.map((note, index) => {
    if (game.values[index] || game.fixed[index]) return [];
    return note.length ? [...note] : getCandidates(game.values, index);
  });
}

export function sudokuGameReducer(game, action) {
  switch (action?.type) {
    case GAME_ACTIONS.REPLACE:
      return typeof action.next === "function" ? action.next(game) : action.next;

    case GAME_ACTIONS.START_GAME:
      return action.game;

    case GAME_ACTIONS.SELECT_CELL:
      return {
        ...game,
        selected: action.index,
        hintCells: [],
      };

    case GAME_ACTIONS.TOGGLE_NOTE_MODE:
      return {
        ...game,
        noteMode: action.value ?? !game.noteMode,
      };

    case GAME_ACTIONS.ENTER_NUMBER: {
      if (game.completed) return game;
      const index = action.index ?? game.selected;
      const number = Number(action.number);
      if (!Number.isInteger(index) || index < 0 || index > 80 || !number) return game;
      if (game.fixed[index]) return game;

      if (game.noteMode) {
        if (game.values[index]) return game;
        const next = withHistory(game);
        const currentNotes = new Set(next.notes[index]);
        if (currentNotes.has(number)) currentNotes.delete(number);
        else currentNotes.add(number);
        next.notes = next.notes.map((note, noteIndex) =>
          noteIndex === index ? [...currentNotes].sort((a, b) => a - b) : note,
        );
        next.lastNumber = number;
        return next;
      }

      if (game.values[index] === number) return game;
      const entry = canEnterSolutionNumber(game, index, number);
      if (!entry.ok) {
        if (entry.reason !== "wrong-number") return game;
        return {
          ...game,
          mistakes: game.mistakes + 1,
          hintCells: [],
          lastNumber: number,
        };
      }

      const next = withHistory(game);
      next.values = [...next.values];
      next.values[index] = number;
      next.notes = action.smartNotes ? cleanPeerNotes(next, index, number) : cloneNotes(next.notes);
      next.notes[index] = [];
      next.hintCells = [];
      next.lastNumber = number;
      return isSolved(next) && action.markComplete
        ? sudokuGameReducer(next, { type: GAME_ACTIONS.COMPLETE_GAME, elapsedSec: action.elapsedSec ?? next.elapsedBefore })
        : next;
    }

    case GAME_ACTIONS.ERASE: {
      if (game.completed) return game;
      const index = action.index ?? game.selected;
      if (!Number.isInteger(index) || index < 0 || index > 80 || game.fixed[index]) return game;
      if (!game.values[index] && game.notes[index].length === 0) return game;
      const next = withHistory(game);
      next.values = [...next.values];
      next.notes = cloneNotes(next.notes);
      next.values[index] = 0;
      next.notes[index] = action.smartNotes ? getCandidates(next.values, index) : [];
      next.hintCells = [];
      return action.smartNotes ? { ...next, notes: fillSmartNotes(next) } : next;
    }

    case GAME_ACTIONS.UNDO: {
      if (game.history.length === 0 || game.completed) return game;
      const previous = game.history[game.history.length - 1];
      return restoreSnapshot(
        {
          ...game,
          history: game.history.slice(0, -1),
          future: [...game.future, makeSnapshot(game)],
        },
        previous,
      );
    }

    case GAME_ACTIONS.REDO: {
      if (game.future.length === 0 || game.completed) return game;
      const future = game.future[game.future.length - 1];
      return restoreSnapshot(
        {
          ...game,
          history: [...game.history, makeSnapshot(game)],
          future: game.future.slice(0, -1),
        },
        future,
      );
    }

    case GAME_ACTIONS.REQUEST_HINT:
      return {
        ...game,
        hintsUsed: game.hintsUsed + (action.countHint ? 1 : 0),
        learningCleanEligible: action.countHint && game.mode === "learning" ? false : game.learningCleanEligible,
        selected: Number.isInteger(action.target) ? action.target : game.selected,
        lastNumber: action.number || game.lastNumber,
      };

    case GAME_ACTIONS.APPLY_COACH_STEP: {
      const step = action.step;
      if (!step?.strict || !Number.isInteger(step.target) || !step.number || game.completed || game.fixed[step.target]) {
        return game;
      }
      const next = withHistory(game);
      next.values = [...next.values];
      next.values[step.target] = step.number;
      next.notes = action.smartNotes ? cleanPeerNotes(next, step.target, step.number) : cloneNotes(next.notes);
      next.notes[step.target] = [];
      next.lastNumber = step.number;
      next.selected = step.target;
      next.hintCells = [];
      if (game.mode === "learning") next.learningCleanEligible = false;
      return next;
    }

    case GAME_ACTIONS.COMPLETE_GAME:
      return {
        ...game,
        completed: true,
        elapsedBefore: action.elapsedSec ?? game.elapsedBefore,
        history: [],
        future: [],
        awardXp: action.awardXp ?? game.awardXp ?? 0,
        suppressVictoryRewards: action.suppressVictoryRewards ?? game.suppressVictoryRewards,
      };

    default:
      return game;
  }
}

export function useSudokuGame(initializer) {
  const [game, dispatchGame] = useReducer(sudokuGameReducer, null, initializer);
  const setGame = useCallback((next) => {
    dispatchGame({ type: GAME_ACTIONS.REPLACE, next });
  }, []);
  return { game, setGame, dispatchGame };
}

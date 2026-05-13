import { canEnterSolutionNumber, isSolved } from "../../lib/sudoku.js";
import { getElapsed, withHistory } from "../game/gameRepository.js";

export const COLLABORATION_LIMITS = {
  free: 5,
  pro: 10,
};

export const COLLABORATION_ACTIVE_MS = 60_000;

export const COLLABORATION_COLORS = [
  "#137466",
  "#4659b7",
  "#b87922",
  "#d7544b",
  "#7c3aed",
  "#0f766e",
  "#be123c",
  "#2563eb",
  "#a16207",
  "#059669",
];

export function getCollaborationLimit(isPro) {
  return isPro ? COLLABORATION_LIMITS.pro : COLLABORATION_LIMITS.free;
}

export function getVoteThreshold(activeCount) {
  return Math.max(1, Math.ceil(Math.max(1, activeCount) / 2));
}

export function isActiveMember(member, now = Date.now()) {
  if (!member?.last_seen_at) return false;
  return now - new Date(member.last_seen_at).getTime() <= COLLABORATION_ACTIVE_MS;
}

export function getActiveMembers(members = [], now = Date.now()) {
  return members.filter((member) => isActiveMember(member, now));
}

export function compactName(name, fallback = "Player") {
  const clean = String(name || "").trim();
  if (!clean) return fallback;
  return clean.length > 18 ? `${clean.slice(0, 17)}…` : clean;
}

export function colorForUser(userId, members = []) {
  const existing = members.find((member) => member.user_id === userId)?.color_token;
  if (existing) return existing;
  let hash = 0;
  for (const char of String(userId || "")) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLLABORATION_COLORS[hash % COLLABORATION_COLORS.length];
}

export function normalizeProposalAction(action) {
  if (!action || typeof action !== "object") return null;
  const kind = action.kind;
  const index = Number(action.index);
  const number = Number(action.number);
  if (!["place", "erase", "note"].includes(kind)) return null;
  if (!Number.isInteger(index) || index < 0 || index > 80) return null;
  if ((kind === "place" || kind === "note") && (!Number.isInteger(number) || number < 1 || number > 9)) return null;
  return { kind, index, number: kind === "erase" ? null : number };
}

export function validateCollaborationAction(game, action) {
  const normalized = normalizeProposalAction(action);
  if (!normalized) return { ok: false, reason: "invalidAction" };
  if (!game || game.completed) return { ok: false, reason: "completed" };
  if (game.fixed?.[normalized.index]) return { ok: false, reason: "fixedCell" };
  if (normalized.kind === "erase") {
    const hasValue = Boolean(game.values?.[normalized.index]);
    const hasNotes = Boolean(game.notes?.[normalized.index]?.length);
    return hasValue || hasNotes ? { ok: true, action: normalized } : { ok: false, reason: "emptyCell" };
  }
  if (normalized.kind === "note") {
    if (game.values?.[normalized.index]) return { ok: false, reason: "filledCell" };
    return { ok: true, action: normalized };
  }
  if (game.values?.[normalized.index] === normalized.number) return { ok: false, reason: "sameNumber" };
  const entry = canEnterSolutionNumber(game, normalized.index, normalized.number);
  if (!entry.ok) return { ok: false, reason: entry.reason || "invalidNumber" };
  return { ok: true, action: normalized };
}

function cloneNotes(notes) {
  return notes.map((note) => [...note]);
}

export function applyCollaborationAction(game, action, options = {}) {
  const valid = validateCollaborationAction(game, action);
  if (!valid.ok) return { game, applied: false, reason: valid.reason };
  const next = withHistory(game);
  const normalized = valid.action;
  next.values = [...next.values];
  next.notes = cloneNotes(next.notes);
  next.hintCells = [];

  if (normalized.kind === "erase") {
    next.values[normalized.index] = 0;
    next.notes[normalized.index] = [];
    next.activityLog = [
      ...(next.activityLog || []),
      { kind: "erase", index: normalized.index, elapsedSec: getElapsed(game) },
    ];
  } else if (normalized.kind === "note") {
    const current = new Set(next.notes[normalized.index]);
    if (current.has(normalized.number)) current.delete(normalized.number);
    else current.add(normalized.number);
    next.notes[normalized.index] = [...current].sort((a, b) => a - b);
    next.lastNumber = normalized.number;
    next.activityLog = [
      ...(next.activityLog || []),
      { kind: "note", index: normalized.index, value: normalized.number, elapsedSec: getElapsed(game) },
    ];
  } else {
    next.values[normalized.index] = normalized.number;
    if (options.smartNotes) {
      next.notes = next.notes.map((note, noteIndex) =>
        noteIndex === normalized.index ? [] : note.filter((candidate) => candidate !== normalized.number),
      );
    }
    next.notes[normalized.index] = [];
    next.lastNumber = normalized.number;
    next.activityLog = [
      ...(next.activityLog || []),
      {
        kind: "collaboration",
        index: normalized.index,
        value: normalized.number,
        proposerId: options.proposerId,
        elapsedSec: getElapsed(game),
      },
    ];
  }

  if (isSolved(next)) {
    next.completed = true;
    next.elapsedBefore = getElapsed(next);
    next.history = [];
    next.future = [];
  }

  return { game: next, applied: true, completed: Boolean(next.completed), action: normalized };
}

export function summarizeAction(action, labels = {}) {
  const normalized = normalizeProposalAction(action);
  if (!normalized) return labels.unknownMove || "Move";
  const cell = `${String.fromCharCode(65 + (normalized.index % 9))}${Math.floor(normalized.index / 9) + 1}`;
  if (normalized.kind === "erase") return labels.eraseMove?.(cell) || `Erase ${cell}`;
  if (normalized.kind === "note") return labels.noteMove?.(normalized.number, cell) || `Pencil ${normalized.number} in ${cell}`;
  return labels.placeMove?.(normalized.number, cell) || `Place ${normalized.number} in ${cell}`;
}

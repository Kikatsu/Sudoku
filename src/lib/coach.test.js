import { describe, expect, it } from "vitest";
import { createCoachStep, findLockedCandidateStep } from "./coach.js";

const SOLUTION = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  4, 5, 6, 7, 8, 9, 1, 2, 3,
  7, 8, 9, 1, 2, 3, 4, 5, 6,
  2, 3, 4, 5, 6, 7, 8, 9, 1,
  5, 6, 7, 8, 9, 1, 2, 3, 4,
  8, 9, 1, 2, 3, 4, 5, 6, 7,
  3, 4, 5, 6, 7, 8, 9, 1, 2,
  6, 7, 8, 9, 1, 2, 3, 4, 5,
  9, 1, 2, 3, 4, 5, 6, 7, 8,
];

function makeGame(values, solution = SOLUTION) {
  return {
    values,
    solution,
    fixed: values.map(Boolean),
  };
}

describe("local coach techniques", () => {
  it("finds a Naked Single", () => {
    const values = [...SOLUTION];
    values[0] = 0;

    const step = createCoachStep(makeGame(values), "hint");

    expect(step.technique).toBe("Naked Single");
    expect(step.strict).toBe(true);
    expect(step.target).toBe(0);
    expect(step.number).toBe(1);
    expect(step.candidates).toEqual([1]);
    expect(step.highlights.target).toContain(0);
  });

  it("finds a Hidden Single in a row", () => {
    const values = [
      1, 0, 0, 7, 0, 0, 0, 0, 9,
      5, 0, 0, 0, 8, 2, 0, 0, 3,
      8, 0, 0, 0, 0, 9, 0, 4, 5,
      0, 0, 0, 9, 0, 0, 4, 0, 2,
      0, 4, 0, 0, 2, 0, 0, 3, 0,
      9, 0, 3, 0, 0, 6, 0, 0, 0,
      3, 9, 0, 6, 0, 0, 0, 0, 4,
      4, 0, 0, 2, 3, 0, 0, 0, 1,
      2, 0, 0, 0, 0, 4, 0, 0, 6,
    ];

    const step = createCoachStep(makeGame(values), "hint");

    expect(step.technique).toBe("Hidden Single");
    expect(step.strict).toBe(true);
    expect(step.target).toBe(11);
    expect(step.number).toBe(9);
    expect(step.proof).toContain("строка 2");
  });

  it("finds a Hidden Single in a column", () => {
    const values = [
      0, 0, 0, 0, 1, 0, 8, 0, 0,
      9, 0, 0, 0, 0, 0, 2, 0, 4,
      0, 2, 0, 0, 5, 0, 6, 3, 0,
      6, 0, 0, 1, 3, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 5, 0, 2, 4, 0, 0, 1,
      2, 1, 3, 0, 7, 0, 0, 4, 8,
      4, 0, 8, 0, 0, 0, 0, 0, 2,
      0, 0, 6, 0, 0, 0, 0, 0, 0,
    ];

    const step = createCoachStep(makeGame(values), "hint");

    expect(step.technique).toBe("Hidden Single");
    expect(step.strict).toBe(true);
    expect(step.target).toBe(76);
    expect(step.number).toBe(4);
    expect(step.proof).toContain("столбец 5");
  });

  it("finds a Hidden Single in a square", () => {
    const values = [
      0, 6, 0, 0, 0, 1, 0, 0, 0,
      4, 0, 0, 7, 0, 0, 8, 0, 0,
      0, 0, 5, 0, 0, 0, 0, 2, 0,
      6, 0, 0, 0, 9, 7, 0, 0, 0,
      0, 0, 1, 0, 0, 0, 2, 0, 0,
      0, 0, 0, 4, 3, 0, 0, 0, 8,
      0, 9, 0, 0, 0, 0, 4, 0, 0,
      0, 0, 6, 0, 0, 8, 0, 0, 3,
      0, 0, 0, 3, 0, 0, 5, 8, 0,
    ];

    const step = createCoachStep(makeGame(values), "hint");

    expect(step.technique).toBe("Hidden Single");
    expect(step.strict).toBe(true);
    expect(step.target).toBe(30);
    expect(step.number).toBe(1);
    expect(step.proof).toContain("квадрат 5");
  });

  it("returns Locked Candidate proof highlights", () => {
    const values = [
      2, 0, 1, 0, 0, 0, 9, 0, 0,
      5, 9, 4, 1, 8, 6, 0, 7, 2,
      7, 0, 6, 3, 0, 0, 0, 0, 0,
      0, 5, 8, 0, 1, 3, 2, 9, 6,
      0, 1, 0, 6, 0, 2, 0, 8, 0,
      0, 2, 7, 8, 9, 0, 4, 1, 0,
      0, 0, 0, 0, 0, 0, 8, 6, 0,
      4, 9, 6, 0, 4, 3, 7, 8, 5,
      1, 0, 0, 5, 0, 0, 0, 7, 0,
    ];

    const step = findLockedCandidateStep(makeGame(values));

    expect(step.technique).toBe("Locked Candidate / Pointing");
    expect(step.strict).toBe(false);
    expect(step.number).toBe(8);
    expect(step.highlights.target).toEqual([1, 19]);
    expect(step.highlights.eliminations).toContain(73);
    expect(step.highlights.unit).toEqual(expect.arrayContaining([1, 19, 73]));
  });

  it("explains exact blockers for an invalid candidate", () => {
    const values = Array(81).fill(0);
    values[0] = 1;
    values[10] = 1;

    const step = createCoachStep(makeGame(values), "why", {
      index: 1,
      number: 1,
    });

    expect(step.technique).toBe("Conflict Explanation");
    expect(step.kind).toBe("conflict");
    expect(step.highlights.blockers).toEqual(expect.arrayContaining([0, 10]));
    expect(step.summary).toContain("нельзя");
  });

  it("does not propose a move while the board has a conflict", () => {
    const values = [...SOLUTION];
    values[1] = 1;

    const step = createCoachStep(makeGame(values), "hint");

    expect(step.technique).toBe("Conflict Explanation");
    expect(step.kind).toBe("conflict");
    expect(step.strict).toBe(false);
    expect(step.summary).toContain("убрать конфликт");
  });
});

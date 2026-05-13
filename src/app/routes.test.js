import { describe, expect, it } from "vitest";
import { parseAppRoute, ROUTES } from "./routes.js";

describe("hash routes", () => {
  it("parses public app routes", () => {
    expect(parseAppRoute("#/")).toEqual({ kind: "landing", lessonId: null, roomId: null });
    expect(parseAppRoute("#/play")).toEqual({ kind: "play", lessonId: null, roomId: null });
    expect(parseAppRoute("#/sign-in")).toEqual({ kind: "sign-in", lessonId: null });
    expect(parseAppRoute("#/famous")).toEqual({ kind: "famous", lessonId: null });
    expect(parseAppRoute("#/learn")).toEqual({ kind: "learn", lessonId: null });
    expect(parseAppRoute("#/learn/techniques")).toEqual({ kind: "techniques", lessonId: null });
    expect(parseAppRoute("#/learn/l01")).toEqual({ kind: "learn", lessonId: "l01" });
    expect(parseAppRoute("#/collab/room%201")).toEqual({ kind: "collab", lessonId: null, roomId: "room 1" });
  });

  it("builds lesson routes centrally", () => {
    expect(ROUTES.landing).toBe("#/");
    expect(ROUTES.play).toBe("#/play");
    expect(ROUTES.techniques).toBe("#/learn/techniques");
    expect(ROUTES.lesson("lesson one")).toBe("#/learn/lesson%20one");
    expect(ROUTES.collab("room one")).toBe("#/collab/room%20one");
  });
});

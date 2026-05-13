export const ROUTES = {
  landing: "#/",
  play: "#/play",
  signIn: "#/sign-in",
  famous: "#/famous",
  learn: "#/learn",
  techniques: "#/learn/techniques",
  collab: (roomId) => `#/collab/${encodeURIComponent(roomId)}`,
  lesson: (lessonId) => `#/learn/${encodeURIComponent(lessonId)}`,
};

export function parseAppRoute(hash = globalThis.window?.location?.hash || "") {
  let path = hash.slice(1) || "/";
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  if (path === "/") return { kind: "landing", lessonId: null, roomId: null };
  if (path === "/play") return { kind: "play", lessonId: null, roomId: null };
  if (path === "/sign-in") return { kind: "sign-in", lessonId: null };
  if (path === "/famous") return { kind: "famous", lessonId: null };
  if (path === "/learn") return { kind: "learn", lessonId: null };
  if (path === "/learn/techniques") return { kind: "techniques", lessonId: null };
  if (path.startsWith("/collab/")) {
    const rest = path.slice("/collab/".length);
    if (rest) return { kind: "collab", lessonId: null, roomId: decodeURIComponent(rest) };
  }
  if (path.startsWith("/learn/")) {
    const rest = path.slice("/learn/".length);
    if (rest) return { kind: "learn", lessonId: decodeURIComponent(rest) };
  }
  return { kind: "landing", lessonId: null, roomId: null };
}

export function navigateTo(route) {
  if (globalThis.window?.location) {
    globalThis.window.location.hash = route;
  }
}

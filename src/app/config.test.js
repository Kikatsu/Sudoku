import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppOrigin, getAuthRedirectUrl } from "./config.js";

const originalWindow = globalThis.window;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalWindow === undefined) {
    delete globalThis.window;
  } else {
    globalThis.window = originalWindow;
  }
});

describe("app config", () => {
  it("builds Supabase auth redirects from the current deployed origin", () => {
    vi.stubGlobal("window", { location: { origin: "https://sudocore.vercel.app" } });

    expect(getAppOrigin()).toBe("https://sudocore.vercel.app");
    expect(getAuthRedirectUrl()).toBe("https://sudocore.vercel.app/#/");
  });

  it("lets the browser origin win over the configured fallback", () => {
    vi.stubGlobal("window", { location: { origin: "https://preview-sudocore.vercel.app" } });

    expect(getAppOrigin()).toBe("https://preview-sudocore.vercel.app");
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { allowedOrigins, isAllowedOrigin, isSafeHttpsUrl } from "./security.js";

const envKeys = ["APP_ORIGIN", "POLAR_ALLOWED_ORIGINS", "VITE_APP_ORIGIN", "VERCEL_URL"];
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
});

describe("API security helpers", () => {
  it("combines server, browser, and Vercel origins", () => {
    process.env.APP_ORIGIN = "https://app.example.com";
    process.env.POLAR_ALLOWED_ORIGINS = "https://admin.example.com, https://staging.example.com/";
    process.env.VITE_APP_ORIGIN = "http://localhost:5173";
    process.env.VERCEL_URL = "sudocore.vercel.app";

    expect(allowedOrigins()).toEqual([
      "https://app.example.com",
      "https://admin.example.com",
      "https://staging.example.com",
      "http://localhost:5173",
      "https://sudocore.vercel.app",
    ]);
  });

  it("only allows configured origins plus localhost development", () => {
    expect(isAllowedOrigin("https://evil.example", ["https://app.example.com"])).toBe(false);
    expect(isAllowedOrigin("https://app.example.com", ["https://app.example.com"])).toBe(true);
    expect(isAllowedOrigin("http://localhost:5173", ["https://app.example.com"])).toBe(true);
  });

  it("requires HTTPS except for local development URLs", () => {
    expect(isSafeHttpsUrl("https://api.polar.sh")).toBe(true);
    expect(isSafeHttpsUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isSafeHttpsUrl("http://example.com")).toBe(false);
  });
});

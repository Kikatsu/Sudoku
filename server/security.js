const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;

export const contentSecurityPolicy =
  "default-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.polar.sh; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests";

export const baseSecurityHeaders = {
  "Content-Security-Policy": contentSecurityPolicy,
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

export function splitEnvList(value) {
  return value
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function allowedOrigins() {
  const configured = [...(splitEnvList(process.env.APP_ORIGIN) || []), ...(splitEnvList(process.env.POLAR_ALLOWED_ORIGINS) || [])];
  const publicAppOrigin = process.env.VITE_APP_ORIGIN?.trim();
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  return [...(configured || []), publicAppOrigin, vercelUrl].filter(Boolean).map((origin) => origin.replace(/\/$/, ""));
}

export function requestOrigin(request) {
  return request.headers.get("origin")?.replace(/\/$/, "") || "";
}

export function isAllowedOrigin(origin, origins = allowedOrigins()) {
  if (!origin) return true;
  if (origins.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function corsHeadersForRequest(request) {
  const origin = requestOrigin(request);
  const headers = {
    ...baseSecurityHeaders,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function rejectDisallowedOrigin(request) {
  const origin = requestOrigin(request);
  if (isAllowedOrigin(origin)) return null;
  return new Response("Forbidden origin", {
    status: 403,
    headers: { ...baseSecurityHeaders, Vary: "Origin" },
  });
}

export function rejectOversizedRequest(request, maxBytes = DEFAULT_MAX_BODY_BYTES) {
  const rawLength = request.headers.get("content-length");
  if (!rawLength) return null;
  const length = Number(rawLength);
  if (!Number.isFinite(length) || length <= maxBytes) return null;
  return new Response("Payload too large", {
    status: 413,
    headers: baseSecurityHeaders,
  });
}

export function sameOriginFromRequest(request) {
  const origin = requestOrigin(request);
  if (origin && isAllowedOrigin(origin)) return origin;
  const allowed = allowedOrigins();
  if (allowed[0]) return allowed[0];
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return "";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`.replace(/\/$/, "");
}

export function isSafeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch {
    return false;
  }
}

export function serverSupabaseUrl() {
  return process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
}

export function serverSupabasePublishableKey() {
  return (
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim()
  );
}

export async function nodeRequestToWebRequest(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = new URL(req.url || "/", `${proto}://${host}`);
  const init = {
    method: req.method,
    headers: req.headers,
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    init.body = Buffer.concat(chunks);
  }
  return new Request(url, init);
}

export async function sendWebResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
}

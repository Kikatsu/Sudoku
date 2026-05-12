import { supabase } from "./supabaseClient.js";

/**
 * Opens Polar checkout via Vercel `/api/polar-checkout` (same origin on Vercel).
 * For local dev use `vercel dev`, or set `VITE_API_BASE` to your API origin.
 * @returns {Promise<{ url?: string, error?: string }>}
 */
export async function createPolarCheckoutSession() {
  if (!supabase) {
    return { error: "not_configured" };
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { error: "auth_required" };
  }

  const base = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
  const res = await fetch(`${base}/api/polar-checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  let data;
  try {
    data = await res.json();
  } catch {
    return { error: "bad_response" };
  }

  if (!res.ok) {
    return { error: data?.error || `http_${res.status}` };
  }
  if (data?.error) {
    return { error: typeof data.error === "string" ? data.error : "checkout_failed" };
  }
  if (!data?.url) {
    return { error: "no_url" };
  }
  return { url: data.url };
}

import { createClient } from "@supabase/supabase-js";
import {
  corsHeadersForRequest,
  isSafeHttpsUrl,
  nodeRequestToWebRequest,
  rejectDisallowedOrigin,
  rejectOversizedRequest,
  sameOriginFromRequest,
  sendWebResponse,
  serverSupabasePublishableKey,
  serverSupabaseUrl,
  splitEnvList,
} from "../server/security.js";

export async function OPTIONS(request) {
  const originError = rejectDisallowedOrigin(request);
  if (originError) return originError;
  return new Response(null, { status: 204, headers: corsHeadersForRequest(request) });
}

export async function POST(request) {
  const originError = rejectDisallowedOrigin(request);
  if (originError) return originError;
  const sizeError = rejectOversizedRequest(request, 16 * 1024);
  if (sizeError) return sizeError;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(request, { error: "Unauthorized" }, 401);
  }

  const supabaseUrl = serverSupabaseUrl();
  const supabaseAnon = serverSupabasePublishableKey();
  if (!supabaseUrl || !supabaseAnon) {
    return json(request, { error: "Server misconfigured" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return json(request, { error: "Invalid session" }, 401);
  }

  const polarToken = process.env.POLAR_ACCESS_TOKEN;
  const productRaw = process.env.POLAR_PRODUCT_IDS || process.env.POLAR_PRODUCT_ID;
  const products = splitEnvList(productRaw);

  if (!polarToken || !products?.length) {
    return json(request, { error: "Polar is not configured on the server" }, 500);
  }

  const apiBase = (process.env.POLAR_API_BASE || "https://api.polar.sh").replace(/\/$/, "");
  if (!isSafeHttpsUrl(apiBase)) {
    console.error("POLAR_API_BASE must be HTTPS except for localhost development");
    return json(request, { error: "Server misconfigured" }, 500);
  }

  const origin = sameOriginFromRequest(request);
  const successUrl = process.env.POLAR_SUCCESS_URL || (origin ? `${origin}/#/` : undefined);
  const returnUrl = process.env.POLAR_RETURN_URL || (origin ? `${origin}/#/` : undefined);
  if ((successUrl && !isSafeHttpsUrl(successUrl)) || (returnUrl && !isSafeHttpsUrl(returnUrl))) {
    console.error("Polar redirect URLs must be HTTPS except for localhost development");
    return json(request, { error: "Server misconfigured" }, 500);
  }

  const customerIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined;

  const polarRes = await fetch(`${apiBase}/v1/checkouts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${polarToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      products,
      external_customer_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: {
        supabase_user_id: user.id,
        plan: "pro",
      },
      customer_metadata: {
        supabase_user_id: user.id,
      },
      success_url: successUrl,
      return_url: returnUrl,
      customer_ip_address: customerIp,
    }),
  });

  if (!polarRes.ok) {
    const detail = await polarRes.text();
    console.error("Polar checkout error", polarRes.status, detail);
    return json(request, { error: "Polar checkout failed" }, 502);
  }

  const checkout = await polarRes.json();
  if (!checkout?.url) {
    return json(request, { error: "No checkout URL returned" }, 502);
  }
  if (!isSafeHttpsUrl(checkout.url)) {
    console.error("Polar checkout returned an unsafe URL");
    return json(request, { error: "Polar checkout failed" }, 502);
  }

  return json(request, { url: checkout.url }, 200);
}

/**
 * @param {unknown} data
 * @param {number} status
 */
function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json" },
  });
}

export default async function handler(req, res) {
  const request = await nodeRequestToWebRequest(req);
  let response;
  if (req.method === "OPTIONS") {
    response = await OPTIONS(request);
  } else if (req.method === "POST") {
    response = await POST(request);
  } else {
    response = new Response("Method not allowed", {
      status: 405,
      headers: { ...corsHeadersForRequest(request), Allow: "POST, OPTIONS" },
    });
  }
  await sendWebResponse(res, response);
}

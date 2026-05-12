import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return json({ error: "Server misconfigured" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return json({ error: "Invalid session" }, 401);
  }

  const polarToken = process.env.POLAR_ACCESS_TOKEN;
  const productRaw = process.env.POLAR_PRODUCT_IDS || process.env.POLAR_PRODUCT_ID;
  const products = productRaw
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!polarToken || !products?.length) {
    return json({ error: "Polar is not configured on the server" }, 500);
  }

  const apiBase = (process.env.POLAR_API_BASE || "https://api.polar.sh").replace(/\/$/, "");
  const successUrl = process.env.POLAR_SUCCESS_URL || undefined;
  const returnUrl = process.env.POLAR_RETURN_URL || undefined;

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
      success_url: successUrl,
      return_url: returnUrl,
      customer_ip_address: customerIp,
    }),
  });

  if (!polarRes.ok) {
    const detail = await polarRes.text();
    console.error("Polar checkout error", polarRes.status, detail);
    return json({ error: "Polar checkout failed", detail }, 502);
  }

  const checkout = await polarRes.json();
  if (!checkout?.url) {
    return json({ error: "No checkout URL returned" }, 502);
  }

  return json({ url: checkout.url }, 200);
}

/**
 * @param {unknown} data
 * @param {number} status
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

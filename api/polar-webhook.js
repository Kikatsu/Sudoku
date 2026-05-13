import { createClient } from "@supabase/supabase-js";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { baseSecurityHeaders, rejectOversizedRequest, splitEnvList } from "./security.js";

function periodEndIso(sub) {
  const end = sub?.currentPeriodEnd ?? sub?.current_period_end ?? sub?.endsAt ?? sub?.ends_at;
  if (!end) return null;
  return end instanceof Date ? end.toISOString() : String(end);
}

function allowedProductIds() {
  return splitEnvList(process.env.POLAR_PRODUCT_IDS || process.env.POLAR_PRODUCT_ID) || [];
}

function productMatches(sub, productIds = allowedProductIds()) {
  if (!productIds.length) return true;
  const productId = sub?.productId ?? sub?.product_id ?? sub?.product?.id;
  return productIds.includes(productId);
}

function externalCustomerId(customerLike) {
  return customerLike?.externalId ?? customerLike?.external_id ?? null;
}

function subscriptionHasAccess(sub) {
  const status = sub?.status;
  if (["active", "trialing", "past_due"].includes(status)) return true;
  if (status === "canceled") {
    const end = periodEndIso(sub);
    return end ? new Date(end).getTime() > Date.now() : false;
  }
  return false;
}

export function deriveProGrantFromEvent(event, productIds = allowedProductIds()) {
  const t = event?.type;

  if (t === "customer.state_changed") {
    const customer = event.data;
    const uid = externalCustomerId(customer);
    if (!uid) return null;
    const activeSubscriptions = customer.activeSubscriptions || customer.active_subscriptions || [];
    const matches = activeSubscriptions
      .filter((sub) => productMatches(sub, productIds) && subscriptionHasAccess(sub))
      .sort((a, b) => {
        const aEnd = new Date(periodEndIso(a) || 0).getTime();
        const bEnd = new Date(periodEndIso(b) || 0).getTime();
        return bEnd - aEnd;
      });
    const sub = matches[0];
    return sub
      ? {
          userId: uid,
          tier: "pro",
          proExpiresAt: periodEndIso(sub),
          polarCustomerId: customer.id ?? null,
          polarSubscriptionId: sub.id ?? null,
          subscriptionStatus: sub.status ?? null,
        }
      : {
          userId: uid,
          tier: "free",
          proExpiresAt: null,
          polarCustomerId: customer.id ?? null,
          polarSubscriptionId: null,
          subscriptionStatus: "inactive",
        };
  }

  if (t?.startsWith("subscription.")) {
    const sub = event.data;
    if (!productMatches(sub, productIds)) return null;
    const uid = externalCustomerId(sub?.customer);
    if (!uid) return null;
    if (t === "subscription.revoked" || !subscriptionHasAccess(sub)) {
      return {
        userId: uid,
        tier: "free",
        proExpiresAt: null,
        polarCustomerId: sub?.customer?.id ?? sub?.customerId ?? sub?.customer_id ?? null,
        polarSubscriptionId: sub?.id ?? null,
        subscriptionStatus: sub?.status ?? "revoked",
      };
    }
    return {
      userId: uid,
      tier: "pro",
      proExpiresAt: periodEndIso(sub),
      polarCustomerId: sub?.customer?.id ?? sub?.customerId ?? sub?.customer_id ?? null,
      polarSubscriptionId: sub?.id ?? null,
      subscriptionStatus: sub?.status ?? null,
    };
  }

  return null;
}

/** @param {Headers} h */
function headersToRecord(h) {
  /** @type {Record<string, string>} */
  const out = {};
  h.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export async function POST(request) {
  const sizeError = rejectOversizedRequest(request);
  if (sizeError) return sizeError;

  const contentType = request.headers.get("content-type") || "";
  if (contentType && !contentType.toLowerCase().includes("application/json")) {
    return new Response("Unsupported media type", { status: 415, headers: baseSecurityHeaders });
  }

  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("POLAR_WEBHOOK_SECRET missing");
    return new Response("Server misconfigured", { status: 500, headers: baseSecurityHeaders });
  }

  const body = await request.text();
  const headers = headersToRecord(request.headers);

  let event;
  try {
    event = validateEvent(body, headers, secret);
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return new Response("Invalid signature", { status: 400, headers: baseSecurityHeaders });
    }
    console.error("Webhook parse error", e);
    return new Response("Invalid payload", { status: 400, headers: baseSecurityHeaders });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return new Response("Server misconfigured", { status: 500, headers: baseSecurityHeaders });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const grant = deriveProGrantFromEvent(event);
  if (grant) {
    const patch = {
      subscription_tier: grant.tier,
      pro_expires_at: grant.proExpiresAt,
      polar_customer_id: grant.polarCustomerId,
      polar_subscription_id: grant.polarSubscriptionId,
      subscription_status: grant.subscriptionStatus,
      subscription_updated_at: new Date().toISOString(),
    };
    const { error } = await admin.from("profiles").update(patch).eq("id", grant.userId);
    if (error) {
      console.error("Polar profile subscription update failed", error);
      return Response.json({ ok: false }, { status: 500, headers: baseSecurityHeaders });
    }
  }

  return Response.json({ ok: true }, { headers: baseSecurityHeaders });
}

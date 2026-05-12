import { createClient } from "@supabase/supabase-js";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

function periodEndIso(sub) {
  const end = sub.currentPeriodEnd;
  return end instanceof Date ? end.toISOString() : String(end);
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
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("POLAR_WEBHOOK_SECRET missing");
    return new Response("Server misconfigured", { status: 500 });
  }

  const body = await request.text();
  const headers = headersToRecord(request.headers);

  let event;
  try {
    event = validateEvent(body, headers, secret);
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return new Response("Invalid signature", { status: 400 });
    }
    console.error("Webhook parse error", e);
    return new Response("Invalid payload", { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  async function grantPro(userId, endIso) {
    const { error } = await admin
      .from("profiles")
      .update({ subscription_tier: "pro", pro_expires_at: endIso })
      .eq("id", userId);
    if (error) console.error("grantPro", error);
  }

  async function revokePro(userId) {
    const { error } = await admin
      .from("profiles")
      .update({ subscription_tier: "free", pro_expires_at: null })
      .eq("id", userId);
    if (error) console.error("revokePro", error);
  }

  const t = event.type;

  if (t === "subscription.revoked") {
    const uid = event.data.customer.externalId;
    if (uid) await revokePro(uid);
    return Response.json({ ok: true });
  }

  const withSubscription = new Set([
    "subscription.active",
    "subscription.created",
    "subscription.uncanceled",
    "subscription.updated",
    "subscription.canceled",
    "subscription.past_due",
  ]);

  if (withSubscription.has(t)) {
    const sub = event.data;
    const uid = sub.customer.externalId;
    if (uid) {
      const st = sub.status;
      if (st === "active" || st === "trialing" || st === "past_due" || st === "canceled") {
        await grantPro(uid, periodEndIso(sub));
      } else {
        await revokePro(uid);
      }
    }
  }

  return Response.json({ ok: true });
}

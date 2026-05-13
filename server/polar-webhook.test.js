import { describe, expect, it } from "vitest";
import { deriveProGrantFromEvent } from "../api/polar-webhook.js";

describe("Polar webhook subscription mapping", () => {
  it("grants Pro for a matching active subscription event", () => {
    const grant = deriveProGrantFromEvent(
      {
        type: "subscription.active",
        data: {
          id: "sub_1",
          status: "active",
          productId: "product_pro",
          currentPeriodEnd: new Date("2026-06-13T00:00:00.000Z"),
          customer: { id: "cus_1", externalId: "user_1" },
        },
      },
      ["product_pro"],
    );

    expect(grant).toMatchObject({
      userId: "user_1",
      tier: "pro",
      proExpiresAt: "2026-06-13T00:00:00.000Z",
      polarCustomerId: "cus_1",
      polarSubscriptionId: "sub_1",
      subscriptionStatus: "active",
    });
  });

  it("ignores subscription events for other products", () => {
    const grant = deriveProGrantFromEvent(
      {
        type: "subscription.active",
        data: {
          id: "sub_1",
          status: "active",
          productId: "other",
          currentPeriodEnd: new Date("2026-06-13T00:00:00.000Z"),
          customer: { id: "cus_1", externalId: "user_1" },
        },
      },
      ["product_pro"],
    );

    expect(grant).toBeNull();
  });

  it("revokes Pro when customer state has no matching active subscriptions", () => {
    const grant = deriveProGrantFromEvent(
      {
        type: "customer.state_changed",
        data: {
          id: "cus_1",
          externalId: "user_1",
          activeSubscriptions: [],
        },
      },
      ["product_pro"],
    );

    expect(grant).toMatchObject({
      userId: "user_1",
      tier: "free",
      proExpiresAt: null,
      polarCustomerId: "cus_1",
      subscriptionStatus: "inactive",
    });
  });
});

import { computeProStatus } from "../../lib/cloudSync.js";
import { createPolarCheckoutSession } from "../../lib/polarCheckout.js";
export {
  FREE_TIER_LIMITS,
  canAnalyzeHistory,
  canStartGame,
  canUseCoach,
  getLimitUsageForDate,
  isThemePro,
  normalizeLimitUsage,
  recordLimitUsage,
} from "./subscriptionLimits.js";

export function isProfilePro(profile) {
  return computeProStatus(profile.subscriptionTier, profile.proExpiresAt);
}

export async function startProCheckout() {
  return createPolarCheckoutSession();
}

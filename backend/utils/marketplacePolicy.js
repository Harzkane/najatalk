const PREMIUM_STATUS_ACTIVE = new Set(["active", "legacy"]);

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isPremiumBySnapshot = (user) => {
  if (!user) return false;
  if (user.isPremium === true) return true;
  if (PREMIUM_STATUS_ACTIVE.has(String(user.premiumStatus || ""))) return true;

  if (user.premiumExpiresAt) {
    const expiry = new Date(user.premiumExpiresAt);
    return Number.isFinite(expiry.getTime()) && expiry > new Date();
  }
  return false;
};

export const getMarketplaceTier = (user) => (isPremiumBySnapshot(user) ? "premium" : "free");

export const getMarketplacePolicy = (user) => {
  const tier = getMarketplaceTier(user);
  const freeLimit = toPositiveInt(process.env.MARKETPLACE_FREE_ACTIVE_LIMIT, 2);
  const premiumLimit = toPositiveInt(process.env.MARKETPLACE_PREMIUM_ACTIVE_LIMIT, 20);
  const freeFeeBps = toPositiveInt(process.env.MARKETPLACE_FREE_FEE_BPS, 1000);
  const premiumFeeBps = toPositiveInt(process.env.MARKETPLACE_PREMIUM_FEE_BPS, 500);
  const freeBoostKobo = toPositiveInt(process.env.MARKETPLACE_FREE_BOOST_COST_KOBO, 25000);
  const premiumBoostKobo = toPositiveInt(
    process.env.MARKETPLACE_PREMIUM_BOOST_COST_KOBO,
    10000
  );
  const boostHours = toPositiveNumber(process.env.MARKETPLACE_BOOST_HOURS, 72);

  const policy =
    tier === "premium"
      ? {
          tier,
          activeListingLimit: premiumLimit,
          commissionBps: premiumFeeBps,
          boostCostKobo: premiumBoostKobo,
          boostHours,
        }
      : {
          tier,
          activeListingLimit: freeLimit,
          commissionBps: freeFeeBps,
          boostCostKobo: freeBoostKobo,
          boostHours,
        };

  return {
    ...policy,
    commissionRate: policy.commissionBps / 10000,
    boostDurationMs: policy.boostHours * 60 * 60 * 1000,
  };
};

export const calculateMarketplaceFee = (grossAmountKobo, user) => {
  const policy = getMarketplacePolicy(user);
  const fee = Math.round((Number(grossAmountKobo || 0) * policy.commissionBps) / 10000);
  return {
    policy,
    feeKobo: Math.max(0, fee),
    sellerNetKobo: Math.max(0, Number(grossAmountKobo || 0) - fee),
  };
};

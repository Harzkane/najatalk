const PREMIUM_PLAN_DAYS = Number(process.env.PREMIUM_PLAN_DAYS || 30);

const safeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addDays = (baseDate, days) => {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
};

export const getPremiumSnapshot = (user, now = new Date()) => {
  const expiresAt = safeDate(user?.premiumExpiresAt);
  const status = String(user?.premiumStatus || "inactive");
  const isLegacy = status === "legacy";
  const isActive = isLegacy || (expiresAt ? expiresAt > now : Boolean(user?.isPremium));
  const hasExpiredDate = Boolean(expiresAt && expiresAt <= now);

  return {
    isPremium: isActive,
    premiumStatus: isLegacy
      ? "legacy"
      : isActive
        ? "active"
        : status === "canceled"
          ? "canceled"
          : status === "expired" || hasExpiredDate
            ? "expired"
            : "inactive",
    premiumExpiresAt: expiresAt,
  };
};

export const syncPremiumAccessState = (user, now = new Date()) => {
  if (!user) return { changed: false, snapshot: getPremiumSnapshot(null, now) };

  const snapshot = getPremiumSnapshot(user, now);
  let changed = false;

  if (Boolean(user.isPremium) !== snapshot.isPremium) {
    user.isPremium = snapshot.isPremium;
    changed = true;
  }

  if ((user.premiumStatus || "inactive") !== snapshot.premiumStatus) {
    user.premiumStatus = snapshot.premiumStatus;
    changed = true;
  }

  if (!snapshot.isPremium && user.premiumStatus === "expired" && user.nextBillingAt) {
    user.nextBillingAt = null;
    changed = true;
  }

  return { changed, snapshot };
};

export const applyPremiumActivation = (user, { reference = null, now = new Date() } = {}) => {
  const currentExpiry = safeDate(user?.premiumExpiresAt);
  const cycleStart = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const nextExpiry = addDays(cycleStart, PREMIUM_PLAN_DAYS);

  user.isPremium = true;
  user.premiumStatus = "active";
  user.premiumPlan = "monthly";
  user.premiumStartedAt = user.premiumStartedAt || now;
  user.premiumExpiresAt = nextExpiry;
  user.nextBillingAt = nextExpiry;
  user.cancelAtPeriodEnd = false;
  if (reference) {
    user.premiumLastPaymentRef = reference;
  }

  return {
    premiumExpiresAt: nextExpiry,
    premiumStatus: "active",
    isPremium: true,
    premiumPlan: "monthly",
  };
};

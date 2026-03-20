const limiterStore = new Map();

const nowMs = () => Date.now();

const defaultKeyGenerator = (req) => {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.ip || "unknown";
};

const getOrCreateWindow = (key, windowMs) => {
  const current = limiterStore.get(key);
  const currentTime = nowMs();
  if (!current || current.resetAt <= currentTime) {
    const fresh = { count: 0, resetAt: currentTime + windowMs };
    limiterStore.set(key, fresh);
    return fresh;
  }
  return current;
};

export const createRateLimiter = ({
  id,
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Too many requests. Please try again later.",
  keyGenerator = defaultKeyGenerator,
}) => {
  if (!id) {
    throw new Error("Rate limiter id is required.");
  }

  return (req, res, next) => {
    const scopedKey = `${id}:${keyGenerator(req)}`;
    const window = getOrCreateWindow(scopedKey, windowMs);
    window.count += 1;

    const remaining = Math.max(max - window.count, 0);
    const retryAfterSeconds = Math.max(Math.ceil((window.resetAt - nowMs()) / 1000), 1);

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(retryAfterSeconds));

    if (window.count > max) {
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        message,
        retryAfterSeconds,
      });
    }

    return next();
  };
};

export const authSignupLimiter = createRateLimiter({
  id: "auth-signup",
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many signup attempts. Please try again later.",
});

export const authLoginLimiter = createRateLimiter({
  id: "auth-login",
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: "Too many login attempts. Please wait and try again.",
});

export const moneyActionLimiter = createRateLimiter({
  id: "money-action",
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "Too many money actions in a short time. Please wait.",
});

export const contestActionLimiter = createRateLimiter({
  id: "contest-action",
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: "Too many contest actions in a short time. Please wait.",
});

export const reportActionLimiter = createRateLimiter({
  id: "report-action",
  windowMs: 10 * 60 * 1000,
  max: 25,
  message: "Too many reports in a short time. Please wait.",
});

export const writeActionLimiter = createRateLimiter({
  id: "write-action",
  windowMs: 10 * 60 * 1000,
  max: 80,
  message: "Too many write actions in a short time. Please wait.",
});

export const searchActionLimiter = createRateLimiter({
  id: "search-action",
  windowMs: 10 * 60 * 1000,
  max: 180,
  message: "Too many search actions in a short time. Please wait.",
});

export const adminMutationLimiter = createRateLimiter({
  id: "admin-mutation",
  windowMs: 10 * 60 * 1000,
  max: 120,
  message: "Too many admin mutation actions. Please wait.",
});

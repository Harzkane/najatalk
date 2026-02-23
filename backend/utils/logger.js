const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "cookie",
  "verificationtoken",
  "paystack_secret",
  "jwt_secret",
  "email_pass",
  "smtp_pass",
  "app_password",
]);

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === "[object Object]";

const redactValue = (key, value) => {
  if (!key) return value;
  if (SENSITIVE_KEYS.has(String(key).toLowerCase())) return "[REDACTED]";
  return value;
};

export const redactSensitive = (input, depth = 0) => {
  if (depth > 5) return "[TRUNCATED]";
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) {
    return input.map((item) => redactSensitive(item, depth + 1));
  }
  if (isPlainObject(input)) {
    return Object.entries(input).reduce((acc, [key, value]) => {
      const safeValue = redactValue(key, value);
      acc[key] = safeValue === value ? redactSensitive(value, depth + 1) : safeValue;
      return acc;
    }, {});
  }
  if (input instanceof Error) {
    return {
      name: input.name,
      message: input.message,
      stack: input.stack,
    };
  }
  return input;
};

export const logEvent = (level, event, data = {}) => {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    data: redactSensitive(data),
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  console.log(line);
};

export const logger = {
  info: (event, data) => logEvent("info", event, data),
  warn: (event, data) => logEvent("warn", event, data),
  error: (event, data) => logEvent("error", event, data),
};

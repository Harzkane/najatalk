import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    logger.info("http.request", {
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      requestId: req.headers["x-request-id"] || null,
      userId: req.user?._id ? String(req.user._id) : null,
    });
  });

  next();
};


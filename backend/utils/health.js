const READY_STATE_LABELS = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export const buildHealthPayload = () => ({
  status: "ok",
  service: "najatalk-backend",
  timestamp: new Date().toISOString(),
  uptimeSeconds: Math.round(process.uptime()),
  environment: process.env.NODE_ENV || "development",
});

export const buildReadinessPayload = (mongoReadyState = 0) => {
  const dbReady = mongoReadyState === 1;
  return {
    status: dbReady ? "ready" : "not_ready",
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: dbReady ? "up" : "down",
        readyState: mongoReadyState,
        label: READY_STATE_LABELS[mongoReadyState] || "unknown",
      },
    },
  };
};


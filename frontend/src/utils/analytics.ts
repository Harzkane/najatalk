"use client";

type AnalyticsPayload = Record<string, unknown>;
type AnalyticsEntry = AnalyticsPayload & { event: string; ts: string };

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const getAnalyticsEndpoint = () => {
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT?.trim();
  return endpoint ? endpoint : null;
};

const postAnalyticsEntry = (entry: AnalyticsEntry) => {
  const endpoint = getAnalyticsEndpoint();
  if (!endpoint || typeof navigator === "undefined") return;

  const body = JSON.stringify(entry);
  if (typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Never block app flow on analytics network failures.
  });
};

export const trackEvent = (event: string, payload: AnalyticsPayload = {}) => {
  if (typeof window === "undefined") return;
  const entry: AnalyticsEntry = {
    event,
    ts: new Date().toISOString(),
    ...payload,
  };

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(entry);
  }

  if (process.env.NODE_ENV !== "production") {
    // Debug visibility until a real analytics sink is wired.
    console.info("[analytics]", entry);
  }

  postAnalyticsEntry(entry);
};

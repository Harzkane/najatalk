import { test, expect, request as playwrightRequest, type BrowserContext, type Page } from "@playwright/test";

const uiBaseUrl = (process.env.E2E_UI_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const backendBase = (process.env.E2E_BACKEND_BASE || "http://localhost:8000").replace(/\/$/, "");
const apiBase = (process.env.E2E_UI_API_BASE || `${backendBase}/api`).replace(/\/$/, "");
const userEmail = String(process.env.E2E_UI_USER_EMAIL || process.env.E2E_USER_EMAIL || "").trim();
const userPassword = String(
  process.env.E2E_UI_USER_PASSWORD || process.env.E2E_USER_PASSWORD || ""
).trim();
const adminEmail = String(
  process.env.E2E_UI_ADMIN_EMAIL || process.env.E2E_ADMIN_EMAIL || ""
).trim();
const adminPassword = String(
  process.env.E2E_UI_ADMIN_PASSWORD || process.env.E2E_ADMIN_PASSWORD || ""
).trim();

type Session = { token: string; userId: string };

test.beforeAll(() => {
  const missing = [];
  if (!userEmail) missing.push("E2E_UI_USER_EMAIL/E2E_USER_EMAIL");
  if (!userPassword) missing.push("E2E_UI_USER_PASSWORD/E2E_USER_PASSWORD");
  if (!adminEmail) missing.push("E2E_UI_ADMIN_EMAIL/E2E_ADMIN_EMAIL");
  if (!adminPassword) missing.push("E2E_UI_ADMIN_PASSWORD/E2E_ADMIN_PASSWORD");
  if (missing.length > 0) {
    // Explicit signal in test output so skipped auth tests are self-explanatory.
    console.warn(`[ui-e2e] Missing auth env vars: ${missing.join(", ")}`);
  }
});

const login = async (email: string, password: string): Promise<Session> => {
  const api = await playwrightRequest.newContext();
  try {
    const res = await api.post(`${apiBase}/auth/login`, {
      data: { email, password },
    });
    if (!res.ok()) {
      throw new Error(`Login failed with status ${res.status()}`);
    }
    const json = await res.json();
    if (!json?.token || !json?.userId) {
      throw new Error("Login response missing token/userId");
    }
    return { token: json.token, userId: json.userId };
  } finally {
    await api.dispose();
  }
};

const ensureProfileComplete = async (token: string, fallbackUserId: string, fallbackEmail: string) => {
  const api = await playwrightRequest.newContext();
  try {
    const meRes = await api.get(`${apiBase}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok()) return;
    const me = await meRes.json();
    const usernameSeed = String(me?.username || fallbackEmail.split("@")[0] || `user_${fallbackUserId.slice(-6)}`)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24);
    const username = usernameSeed.length >= 3 ? usernameSeed : `usr_${fallbackUserId.slice(-6)}`;

    await api.patch(`${apiBase}/users/me/profile`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: {
        username,
        bio: "E2E profile bio",
        location: "Lagos",
      },
    });
  } finally {
    await api.dispose();
  }
};

const assertAdminRole = async (token: string) => {
  const api = await playwrightRequest.newContext();
  try {
    const meRes = await api.get(`${apiBase}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok()) return false;
    const me = await meRes.json();
    return ["admin", "super_admin"].includes(String(me?.role || "").toLowerCase());
  } finally {
    await api.dispose();
  }
};

const seedSessionInBrowser = async (
  context: BrowserContext,
  _page: Page,
  session: Session
) => {
  await context.addInitScript(
    ([token, userId]) => {
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
    },
    [session.token, session.userId]
  );
};

test("authenticated user can open compose panel on threads", async ({ context, page }) => {
  test.skip(
    !userEmail || !userPassword,
    "E2E_UI_USER_EMAIL/PASSWORD (or E2E_USER_EMAIL/PASSWORD) not configured"
  );

  const session = await login(userEmail, userPassword);
  await ensureProfileComplete(session.token, session.userId, userEmail);
  await seedSessionInBrowser(context, page, session);

  // Use the product-supported compose deep-link to avoid UI-state ambiguity
  // (empty state button vs floating button vs already-open panel).
  await page.goto(`${uiBaseUrl}/threads?compose=1`);
  await expect(page).not.toHaveURL(/\/onboarding\/profile/);
  const composeHeading = page.getByRole("heading", { name: /create new thread/i });
  const titleInput = page.getByPlaceholder("Thread Title");
  await expect(composeHeading).toBeVisible({ timeout: 30_000 });
  await expect(titleInput).toBeVisible({ timeout: 30_000 });
});

test("authenticated admin can open admin dashboard", async ({ context, page }) => {
  test.skip(
    !adminEmail || !adminPassword,
    "E2E_UI_ADMIN_EMAIL/PASSWORD (or E2E_ADMIN_EMAIL/PASSWORD) not configured"
  );

  const session = await login(adminEmail, adminPassword);
  const isAdmin = await assertAdminRole(session.token);
  test.skip(!isAdmin, "Configured admin credential does not have admin role");
  await ensureProfileComplete(session.token, session.userId, adminEmail);
  await seedSessionInBrowser(context, page, session);

  await page.goto(`${uiBaseUrl}/admin`);
  await expect(page).not.toHaveURL(/\/onboarding\/profile/);
  await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("heading", { name: /overview/i })).toBeVisible();
});

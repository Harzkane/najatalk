import {
  expect,
  request as playwrightRequest,
  test,
  type BrowserContext,
  type Page,
} from "@playwright/test";

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
const allowMutations = String(process.env.E2E_UI_ALLOW_MUTATIONS || "false").toLowerCase() === "true";

type Session = { token: string; userId: string };
type ApiCallResult = { ok: boolean; status: number; json: Record<string, unknown> | null };

const login = async (email: string, password: string): Promise<Session> => {
  const api = await playwrightRequest.newContext();
  try {
    const res = await api.post(`${apiBase}/auth/login`, {
      data: { email, password },
    });
    if (!res.ok()) throw new Error(`Login failed with status ${res.status()}`);
    const json = await res.json();
    if (!json?.token || !json?.userId) throw new Error("Login response missing token/userId");
    return { token: json.token, userId: json.userId };
  } finally {
    await api.dispose();
  }
};

const withAuth = async (
  url: string,
  token: string,
  method = "GET",
  data?: unknown
): Promise<ApiCallResult> => {
  const api = await playwrightRequest.newContext();
  try {
    const res = await api.fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(data ? { "Content-Type": "application/json" } : {}),
      },
      data,
    });
    const json = await res.json().catch(() => null);
    return { ok: res.ok(), status: res.status(), json };
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

const seedSessionInBrowser = async (context: BrowserContext, _page: Page, session: Session) => {
  await context.addInitScript(
    ([token, userId]) => {
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
    },
    [session.token, session.userId]
  );
};

test("contest submit + vote flow works via UI", async ({ context, page }) => {
  test.skip(!allowMutations, "Set E2E_UI_ALLOW_MUTATIONS=true to run mutation-heavy flow");
  test.skip(
    !userEmail || !userPassword || !adminEmail || !adminPassword,
    "Missing E2E user/admin credentials"
  );
  test.setTimeout(120_000);

  const user = await login(userEmail, userPassword);
  const admin = await login(adminEmail, adminPassword);
  const isAdmin = await assertAdminRole(admin.token);
  test.skip(!isAdmin, "Configured admin credential does not have admin role");
  await ensureProfileComplete(user.token, user.userId, userEmail);
  await ensureProfileComplete(admin.token, admin.userId, adminEmail);

  const nonce = Date.now();
  const contestTitle = `UI E2E Contest ${nonce}`;
  const threadTitle = `UI E2E Thread ${nonce}`;
  const entryTitle = `UI E2E Entry ${nonce}`;
  const startDate = new Date(Date.now() - 60_000).toISOString();
  const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const createContestRes = await withAuth(`${apiBase}/contests/admin`, admin.token, "POST", {
    title: contestTitle,
    description: "UI contest flow verification",
    rules: "E2E automation test",
    prize: 5000000,
    status: "live",
    startDate,
    endDate,
    requireTermsAcceptance: true,
  });
  expect(createContestRes.ok, `Contest create failed: ${createContestRes.status}`).toBeTruthy();
  const contestJson = createContestRes.json;
  const contestId = contestJson?.contest?._id;
  expect(contestId).toBeTruthy();

  const createThreadRes = await withAuth(`${apiBase}/threads`, user.token, "POST", {
    title: threadTitle,
    body: "Contest entry thread body for UI flow test.",
    category: "General",
  });
  expect(createThreadRes.ok, `Thread create failed: ${createThreadRes.status}`).toBeTruthy();
  const threadJson = createThreadRes.json;
  const threadId = threadJson?.thread?._id;
  expect(threadId).toBeTruthy();

  const submitRes = await withAuth(
    `${apiBase}/contests/${contestId}/submissions`,
    user.token,
    "POST",
    {
      threadId,
      title: entryTitle,
      summary: "Submission created by Playwright advanced flow test.",
      acceptTerms: true,
      termsVersionAccepted: "2026-02-21",
    }
  );
  expect(submitRes.ok, `Submission create failed: ${submitRes.status}`).toBeTruthy();
  const submissionJson = submitRes.json;
  const submissionId = submissionJson?.submission?._id;
  expect(submissionId).toBeTruthy();

  const approveRes = await withAuth(
    `${apiBase}/contests/admin/${contestId}/submissions/${submissionId}/review`,
    admin.token,
    "PUT",
    { status: "approved", reviewNote: "approved by ui e2e", score: 9 }
  );
  expect(approveRes.ok, `Submission approve failed: ${approveRes.status}`).toBeTruthy();

  // Vote as a different user from the submission author so vote state can toggle.
  await seedSessionInBrowser(context, page, admin);

  await page.goto(`${uiBaseUrl}/contests`);
  await expect(page).not.toHaveURL(/\/onboarding\/profile/);
  await page.getByRole("button", { name: new RegExp(contestTitle, "i") }).click();
  await expect(page.locator("h3", { hasText: contestTitle }).first()).toBeVisible();
  await expect(page.getByText(entryTitle)).toBeVisible();

  const entryCard = page.locator("div.rounded-md.border.border-slate-200", { hasText: entryTitle }).first();
  const voteButton = entryCard.getByRole("button", { name: /vote|voted/i });
  await expect(voteButton).toBeVisible();
  const previousVoteLabel = (await voteButton.innerText()).trim();
  await voteButton.click();
  // Message text can be quickly replaced by a details-refresh message; validate state transition directly.
  await expect
    .poll(async () => (await voteButton.innerText()).trim(), { timeout: 10_000 })
    .not.toBe(previousVoteLabel);
});

test("admin payouts section loads and exposes decision controls", async ({ context, page }) => {
  test.skip(!adminEmail || !adminPassword, "Missing E2E admin credentials");
  test.setTimeout(90_000);

  const admin = await login(adminEmail, adminPassword);
  const isAdmin = await assertAdminRole(admin.token);
  test.skip(!isAdmin, "Configured admin credential does not have admin role");
  await ensureProfileComplete(admin.token, admin.userId, adminEmail);
  await seedSessionInBrowser(context, page, admin);

  await page.goto(`${uiBaseUrl}/admin`);
  await expect(page).not.toHaveURL(/\/onboarding\/profile/);
  await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("link", { name: /payouts/i }).first().click();
  await expect(page.getByRole("heading", { name: /payout reconciliation/i })).toBeVisible({
    timeout: 30_000,
  });

  const pendingApproveButton = page.getByRole("button", { name: "Approve" }).first();
  const noRowsMessage = page.getByText(/No payouts found for selected filters/i);
  await expect(pendingApproveButton.or(noRowsMessage)).toBeVisible();
});

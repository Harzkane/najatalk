// cd frontend
// npx playwright test e2e/public-smoke.spec.ts
// npx playwright test e2e/public-smoke.spec.ts e2e/authenticated-ui.spec.ts

import { test, expect } from "@playwright/test";

const uiBaseUrl = (process.env.E2E_UI_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

test("home page renders", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/`);
  await expect(page.getByRole("heading", { name: /naijatalk forum/i })).toBeVisible();
});

test("home page shows login CTA for guests", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/`);
  await expect(page.getByRole("link", { name: /^login$/i }).first()).toBeVisible();
});

test("guest is redirected to login for threads route", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/threads`);
  await expect(page).toHaveURL(/\/login\?next=%2Fthreads/);
});

test("contests page renders", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/contests`);
  await expect(page.getByRole("heading", { name: /contests/i })).toBeVisible();
});

test("marketplace shows login action for guests", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/marketplace`);
  await expect(page.getByRole("link", { name: /^login$/i }).first()).toBeVisible();
});

test("guest is redirected to login for protected route", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/premium`);
  await expect(page).toHaveURL(/\/login\?next=%2Fpremium/);
});

test("forgot password page renders", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/forgot-password`);
  await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /return to home/i })).toBeVisible();
});

test("reset password page renders for token path", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/reset-password/dummy-token`);
  await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
});

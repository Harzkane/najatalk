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

test("threads page renders", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/threads`);
  await expect(page.getByText(/naijatalk threads/i)).toBeVisible();
});

test("contests page renders", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/contests`);
  await expect(page.getByRole("heading", { name: /contests/i })).toBeVisible();
});

test("marketplace shows login action for guests", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/marketplace`);
  await expect(page.getByRole("link", { name: /^login$/i }).first()).toBeVisible();
});

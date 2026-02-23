import { test, expect } from "@playwright/test";

const uiBaseUrl = (process.env.E2E_UI_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

test("home page renders", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/`);
  await expect(page.getByRole("heading", { name: /naijatalk forum/i })).toBeVisible();
});

test("threads page renders", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/threads`);
  await expect(page.getByText(/naijatalk threads/i)).toBeVisible();
});

test("contests page renders", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/contests`);
  await expect(page.getByRole("heading", { name: /contests/i })).toBeVisible();
});

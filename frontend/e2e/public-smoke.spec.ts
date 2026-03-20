// cd frontend
// npx playwright test e2e/public-smoke.spec.ts
// npx playwright test e2e/public-smoke.spec.ts e2e/authenticated-ui.spec.ts

import { test, expect, type Page } from "@playwright/test";

const uiBaseUrl = (process.env.E2E_UI_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const getFirstThreadLink = async (page: Page) => {
  await page.goto(`${uiBaseUrl}/`);
  const firstThreadLink = page.locator('a[href^="/threads/"]').first();
  await expect(firstThreadLink).toBeVisible();
  const href = await firstThreadLink.getAttribute("href");
  const title = (await firstThreadLink.textContent())?.trim() || "";
  expect(href).toBeTruthy();
  const threadId = href?.split("/").filter(Boolean).pop() || "";
  expect(threadId).toBeTruthy();
  return {
    href: href as string,
    threadId,
    title,
  };
};

test("home page renders", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/`);
  await expect(page.getByRole("heading", { name: /naijatalk forum/i })).toBeVisible();
});

test("home page shows login CTA for guests", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/`);
  await expect(page.getByRole("link", { name: /^login$/i }).first()).toBeVisible();
});

test("guest can open threads route", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/threads`);
  await expect(page).toHaveURL(/\/threads/);
  await expect(page.getByRole("heading", { name: /naijatalk threads|naijatalk forum/i })).toBeVisible();
});

test("guest can search from homepage", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/`);
  const searchResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/threads/search") &&
      response.request().method() === "GET",
  );
  await page
    .getByPlaceholder(/search (abuja rent|news), nysc, jobs, japa, football, local life/i)
    .fill("lagos");
  await page.getByRole("button", { name: /search am!/i }).click();
  const searchResponse = await searchResponsePromise;
  expect(searchResponse.ok()).toBeTruthy();
  await expect(
    page.getByPlaceholder(/search (abuja rent|news), nysc, jobs, japa, football, local life/i),
  ).toHaveValue("lagos");
});

test("guest can filter by category from homepage", async ({ page }) => {
  await page.goto(`${uiBaseUrl}/`);
  const categoryRow = page.getByText(/explore categories/i).locator("..");
  const newsButton = categoryRow.getByRole("button", { name: /^news/i }).first();
  await newsButton.click();
  await expect(
    page.getByRole("heading", { name: /news discussions/i }),
  ).toBeVisible();
});

test("guest can open a thread detail page", async ({ page }) => {
  const thread = await getFirstThreadLink(page);
  await page.goto(`${uiBaseUrl}/threads?id=${thread.threadId}`);
  await expect(page).toHaveURL(new RegExp(`/threads\\?id=${thread.threadId}`));
  if (thread.title) {
    await expect(page.getByText(thread.title, { exact: true }).first()).toBeVisible();
  }
});

test("guest clicking reply redirects to login", async ({ page }) => {
  const thread = await getFirstThreadLink(page);
  await page.goto(`${uiBaseUrl}/threads?id=${thread.threadId}`);
  await page.getByRole("button", { name: /reply/i }).first().click();
  await expect(page).toHaveURL(/\/login/);
});

test("guest clicking report redirects to login", async ({ page }) => {
  const thread = await getFirstThreadLink(page);
  await page.goto(`${uiBaseUrl}/threads?id=${thread.threadId}`);
  await page.locator('button[title="Report"]').first().click();
  await expect(page).toHaveURL(/\/login/);
});

test("guest clicking like redirects to login", async ({ page }) => {
  const thread = await getFirstThreadLink(page);
  await page.goto(`${uiBaseUrl}/threads?id=${thread.threadId}`);
  await page.getByRole("button", { name: /like/i }).first().click();
  await expect(page).toHaveURL(/\/login/);
});

test("guest clicking save redirects to login", async ({ page }) => {
  const thread = await getFirstThreadLink(page);
  await page.goto(`${uiBaseUrl}/threads?id=${thread.threadId}`);
  await page.getByRole("link", { name: /save/i }).first().click();
  await page.waitForURL(/\/login/, { timeout: 10_000 });
  await expect(page).toHaveURL(/\/login/);
});

test("guest clicking tip redirects to login", async ({ page }) => {
  const thread = await getFirstThreadLink(page);
  await page.goto(`${uiBaseUrl}/threads?id=${thread.threadId}`);
  await page.getByRole("button", { name: /tip|dash/i }).first().click();
  await expect(page).toHaveURL(/\/login/);
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
  await page.waitForURL(/\/login(?:\?|$)/, { timeout: 20_000 });
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
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

import { test, expect } from "@playwright/test";

const EMAIL = `e2e+${Date.now()}@example.com`;
const PASSWORD = "hunter22";

test("happy path: signup → list → create → detail → edit → comment → board → palette", async ({ page }) => {
  await page.goto("/signup");
  await page.getByPlaceholder("full name").fill("E2E User");
  await page.getByPlaceholder("email").fill(EMAIL);
  await page.getByPlaceholder("password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForURL("**/issues");
  await expect(page.getByRole("heading", { name: "Issues" })).toBeVisible();

  await page.getByTestId("new-issue").click();
  await page.getByPlaceholder("Issue title").fill("Smoke test issue");
  await page.getByRole("button", { name: "Create" }).click();

  const row = page.getByTestId("issue-1");
  await expect(row).toBeVisible();
  await row.click();

  await expect(page.getByTestId("issue-title")).toHaveText("Smoke test issue");
  await page.getByTestId("status-select").selectOption("in_progress");
  await expect(page.getByTestId("status-select")).toHaveValue("in_progress");

  await page.getByTestId("comment-input").fill("Looks good");
  await page.getByRole("button", { name: "Post" }).click();
  await expect(page.getByText("Looks good")).toBeVisible();

  await page.goto("/board");
  await expect(page.getByTestId("column-in_progress")).toBeVisible();
  await expect(page.getByTestId("card-1")).toBeVisible();

  await page.keyboard.press("Meta+k");
  const palette = page.getByTestId("palette-input");
  await expect(palette).toBeVisible();
  await palette.fill("Smoke");
  await expect(page.getByRole("listitem").filter({ hasText: "Smoke test issue" })).toBeVisible();
});

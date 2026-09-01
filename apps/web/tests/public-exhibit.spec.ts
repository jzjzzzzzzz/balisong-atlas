import { expect, test } from "@playwright/test";

test("draft first exhibit publishes no historical claims", async ({ page }) => {
  await page.goto("/exhibits/between-two-handles");
  await expect(page.getByRole("heading", { name: "Between Two Handles: A Visual History of the Balisong" })).toBeVisible();
  await expect(page.getByText("Evidence collection is in progress.")).toBeVisible();
  await expect(page.getByText("No unreviewed historical conclusions have been published.")).toBeVisible();
});

test("fictional demo renders evidence legend and constrained viewer", async ({ page }) => {
  await page.goto("/exhibits/balisong-atlas-demo");
  await expect(page.getByRole("heading", { name: "Balisong Atlas Demo Collection" })).toBeVisible();
  await expect(page.getByText("Observed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Inferred", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Unknown", { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId("safe-proxy-viewer")).toBeVisible();
  await expect(page.getByRole("button", { name: /download/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /measure/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /exploded/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /joint/i })).toHaveCount(0);
});

test("public source register excludes unknown-rights originals", async ({ page }) => {
  await page.goto("/exhibits/balisong-atlas-demo/sources");
  await expect(page.getByText("Public domain").first()).toBeVisible();
  await expect(page.getByText("Rights unknown")).toHaveCount(0);
});

test("research reading room exposes citations but not private research copies", async ({ page }) => {
  await page.goto("/exhibits/between-two-handles/sources");
  await expect(page.getByRole("heading", { name: "Books before posts." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Screened, not accepted." })).toBeVisible();
  await expect(page.getByText("76", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Direct lead", exact: true }).click();
  await expect(page.getByText("Showing 4 of 16 prioritized records")).toBeVisible();
  await expect(page.locator("td").filter({ hasText: "Filipinas: pequeños estudios; Batangas y su provincia" }).first()).toBeVisible();
  await expect(page.locator("table").getByRole("link", { name: "Cite" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /download/i })).toHaveCount(0);
  await expect(page.getByText("Access is not publication.")).toBeVisible();
});

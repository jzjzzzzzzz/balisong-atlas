import { expect, test } from "@playwright/test";

test("login and project creation surfaces are present", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("form", { name: "Researcher login" })).toBeVisible();
  await page.goto("/admin/projects/new");
  await expect(page.getByRole("heading", { name: "New research project" })).toBeVisible();
  await expect(page.getByText("New projects begin in draft")).toBeVisible();
});

test("review workspaces expose required evidence controls", async ({ page }) => {
  await page.goto("/admin/projects/demo/claims");
  await expect(page.getByRole("button", { name: /Accept/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Reject/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Dispute/ })).toBeVisible();
  await page.goto("/admin/projects/demo/contradictions");
  await expect(page.getByText("AI and rules can surface disagreement")).toBeVisible();
  await page.goto("/admin/projects/demo/evidence-graph");
  await expect(page.getByLabel("Evidence relationship graph")).toBeVisible();
});

test("image board omits engineering analysis tools", async ({ page }) => {
  await page.goto("/admin/projects/demo/images");
  await expect(page.getByRole("heading", { name: "Images & visual observations" })).toBeVisible();
  await expect(page.getByRole("button", { name: /perspective/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /dimension/i })).toHaveCount(0);
});

test("reconstruction brief and public proxy steps are explicit", async ({ page }) => {
  await page.goto("/admin/projects/demo/reconstruction");
  await expect(page.getByRole("button", { name: /Reconstruction Brief/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Safety Validation/ })).toBeVisible();
  await page.getByRole("button", { name: /Safe Proxy Preview/ }).click();
  await expect(page.getByTestId("safe-proxy-viewer")).toBeVisible();
});

import { expect, test } from "@playwright/test";

const route = "/research/balisong-boundary-object";

test("top navigation and research paper route are available", async ({ page }) => {
  const response = await page.goto(route);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("link", { name: "Research Paper" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Between Two Handles" })).toBeVisible();
  await expect(page.getByTestId("research-draft-status")).toHaveText("Research Draft");
  await expect(page.getByText("2026-09-01", { exact: true })).toHaveCount(2);
});

test("mobile navigation reaches the research paper", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByText("Menu", { exact: true }).click();
  const mobile = page.getByTestId("mobile-navigation");
  await expect(mobile.getByRole("link", { name: "Research Paper" })).toBeVisible();
  await mobile.getByRole("link", { name: "Research Paper" }).click();
  await expect(page).toHaveURL(new RegExp(`${route}$`));
});

test("table of contents, footnotes, return links, and bibliography work", async ({ page }) => {
  await page.goto(route);
  const toc = page.getByRole("navigation", { name: "Contents" });
  await expect(toc.getByRole("link", { name: /One Object, Four Social Lives/ })).toHaveAttribute("href", "#section-1");
  const firstCitation = page.getByTestId("citation-1").first();
  await firstCitation.focus();
  await expect(page.getByTestId("footnote-popover")).toContainText("Gregorio Lardizabal");
  await firstCitation.click();
  await expect(page.locator("#note-1")).toBeAttached();
  await expect(page.locator("#note-1").getByRole("link", { name: "Return to note reference 1" })).toHaveAttribute("href", "#ref-note-1");
  await expect(page.getByTestId("bibliography")).toContainText("Primary and Official Sources");
  await expect(page.getByTestId("bibliography").locator("[data-citation-key=stargriesemer1989]")).toBeVisible();
});

test("argument map and methods expose evidence state without unsafe controls", async ({ page }) => {
  await page.goto(route);
  await page.getByTestId("paper-tab-evidence").click();
  await expect(page.getByTestId("argument-map")).toBeVisible();
  await page.getByRole("button", { name: "Legal Classification" }).click();
  await expect(page.getByTestId("argument-map")).toContainText("15 U.S.C.");
  await page.getByTestId("paper-tab-methods").click();
  await expect(page.getByTestId("sources-methods")).toContainText("50");
  await expect(page.getByTestId("legal-disclaimer")).toContainText("does not provide legal advice");
  await expect(page.getByTestId("ai-disclosure")).toContainText("not a historical source");
  await expect(page.getByRole("button", { name: /download model|measure|exploded|joint/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /buy|shop|tutorial/i })).toHaveCount(0);
});

test("public figures honor rights and synthetic labels", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByTestId("figure-F01")).toContainText("AI-assisted interpretive visualization");
  await expect(page.getByTestId("figure-F02").locator("img")).toHaveCount(2);
  await expect(page.locator("figure").filter({ hasText: "unknown" })).toHaveCount(0);
});

test("Chinese switch localizes the paper interface and keeps English paper explicit", async ({ page }) => {
  await page.goto(route);
  await page.getByRole("button", { name: "切换到中文" }).click();
  await expect(page.getByRole("heading", { name: "双柄之间" })).toBeVisible();
  await expect(page.getByTestId("research-draft-status")).toHaveText("研究草稿");
  await expect(page.getByTestId("paper-tab-essay")).toHaveText("论文");
  await expect(page.getByText("中文扩展摘要", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "展开完整英文论文" })).toBeVisible();
  await page.getByTestId("paper-tab-evidence").click();
  await expect(page.getByRole("heading", { name: "同一转化，四种制度性阅读" })).toBeVisible();
  await page.getByTestId("paper-tab-methods").click();
  await expect(page.getByText("来源不是数量游戏")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});

test("print media hides navigation and interactive controls", async ({ page }) => {
  await page.goto(route);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("header").first()).toBeHidden();
  await expect(page.getByTestId("print-paper").first()).toBeHidden();
  await expect(page.getByTestId("research-paper-article")).toBeVisible();
});

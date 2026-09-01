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
  await expect(page.getByTestId("balisong-kinetic-showcase")).toBeVisible();
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
  await expect(page.getByText("81", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Direct lead", exact: true }).click();
  await expect(page.getByText("Showing 11 of 30 prioritized records")).toBeVisible();
  await expect(page.locator("td").filter({ hasText: "Filipinas: pequeños estudios; Batangas y su provincia" }).first()).toBeVisible();
  await expect(page.locator("table").getByRole("link", { name: "Cite" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /download/i })).toHaveCount(0);
  await expect(page.getByText("Access is not publication.")).toBeVisible();
});

test("language switch changes the complete public interface and persists", async ({ page }) => {
  await page.goto("/exhibits/between-two-handles");
  await expect(page.getByRole("heading", { name: "Between Two Handles: A Visual History of the Balisong" })).toBeVisible();
  await expect(page.getByText("双柄之间", { exact: true })).toHaveCount(0);

  await page.goto("/exhibits/between-two-handles/sources");
  await expect(page.getByRole("heading", { name: "Books before posts." })).toBeVisible();

  await page.getByRole("button", { name: "切换到中文" }).click();
  await expect(page.getByRole("heading", { name: "书籍优先于网络帖子。" })).toBeVisible();
  await expect(page.getByText("已筛选，不等于已接受。")).toBeVisible();
  await expect(page.getByRole("navigation").getByText("研究方法")).toBeVisible();
  await expect(page.getByText("Books before posts.")).toHaveCount(0);
  await expect(page.getByText("Cultural Center of the Philippines editorial project")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");

  await page.reload();
  await expect(page.getByRole("heading", { name: "书籍优先于网络帖子。" })).toBeVisible();
  await page.getByRole("link", { name: "研究方法" }).click();
  await expect(page.getByRole("heading", { name: "证据先于外观" })).toBeVisible();
  await expect(page.getByText("Evidence before appearance")).toHaveCount(0);

  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(page.getByRole("heading", { name: "Evidence before appearance" })).toBeVisible();
  await expect(page.getByText("证据先于外观")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("all public exhibit routes honor the selected Chinese locale", async ({ page }) => {
  await page.goto("/exhibits/between-two-handles");
  await page.getByRole("button", { name: "切换到中文" }).click();

  const routes = [
    ["/exhibits/between-two-handles", "双柄之间：蝴蝶刀的视觉设计史"],
    ["/exhibits/between-two-handles/timeline", "设计演变时间轴"],
    ["/exhibits/between-two-handles/artifacts", "历史物件与设计假设"],
    ["/exhibits/balisong-atlas-demo/sources", "来源、权利与署名"],
    ["/exhibits/balisong-atlas-demo/artifacts/fictional-kinetic-folding-artifact-a-01", "虚构动态折叠物件 A-01"],
    ["/exhibits/balisong-atlas-demo/reconstruction", "非功能性博物馆视觉展示"],
  ] as const;

  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  }
});

test("evidence-era timeline locks historical proxies and isolates the fictional method demo", async ({ page }) => {
  await page.goto("/exhibits/between-two-handles/timeline");
  await expect(page.getByRole("heading", { name: "Design evolution timeline" })).toBeVisible();
  await expect(page.getByTestId("certainty-audit")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Separate a verified record from a certain origin" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Record verified/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A digitized Philippine popular-fiction issue used the word balisong in October 1947." })).toBeVisible();
  await expect(page.getByRole("heading", { name: /contemporaneous education report based on 1950-1951 provincial visits/ })).toBeVisible();
  await expect(page.getByText("Evidence insufficient; visual proxy withheld")).toBeVisible();
  await expect(page.getByText("Accepted claims").locator("..").getByText("0", { exact: true })).toBeVisible();
  await expect(page.getByTestId("balisong-kinetic-showcase")).toBeVisible();
  await expect(page.getByText("The historical-period proxy remains gated; the study below is a method-only visual without a period claim.")).toBeVisible();

  await page.getByRole("button", { name: "View fictional A-01 method demo" }).click();
  await expect(page.getByText("Fictional A-01 demonstrates review and display methods only; it represents no historical period.")).toBeVisible();
  await expect(page.getByTestId("safe-proxy-viewer")).toBeVisible();
  await expect(page.getByRole("button", { name: /download/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /measure/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /joint/i })).toHaveCount(0);

  await page.getByRole("tab", { name: "Performance / media study" }).click();
  await expect(page.getByRole("heading", { name: "Period form and kinetic study" })).toBeVisible();
  await expect(page.getByTestId("balisong-kinetic-showcase")).toBeVisible();
  await expect(page.getByText("Real-time WebGL · single visual proxy · no download")).toBeVisible();
  await expect(page.getByRole("tab", { name: /Contemporary channel-form study/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Ringer matched photographs, 2016 + public anatomy reference")).toBeVisible();
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-handle-style", "milled-channel");
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-insert-style", "contemporary-drop");
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-evidence-state", "observed");
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-motion-source-families", "2");
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-motion-track-version", "2");
  await page.getByRole("tab", { name: /Documented two-section clasp form/ }).click();
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-handle-style", "segmented-scale");
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-insert-style", "comparative-clasp");
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-evidence-state", "observed");
  await page.getByRole("tab", { name: /Batangas industry record/ }).click();
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-handle-style", "horn-and-bolster");
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-insert-style", "regional-spear");
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-evidence-state", "inferred");
  await page.getByRole("tab", { name: /Industrial catalogue geometry/ }).click();
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-handle-style", "skeletonized-metal");
  await expect(page.getByTestId("kinetic-geometry-stage")).toHaveAttribute("data-insert-style", "industrial-clip");
  await page.getByRole("tab", { name: /Contemporary channel-form study/ }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await expect(page.getByRole("button", { name: /download/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /measure/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /export/i })).toHaveCount(0);
  await expect(page.getByTestId("open-media-dossier")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Visual media evidence room" })).toBeVisible();
  await expect(page.getByText("9 open-licensed media records")).toBeVisible();
  await expect(page.getByText("Source family A · primary sequence")).toBeVisible();
  await expect(page.getByText("Source family B · independent modern media")).toBeVisible();
  await expect(page.locator('img[alt="Opening / closing motion record"]')).toBeVisible();
  await expect(page.locator('img[alt="Matched open view"]')).toBeVisible();
  await expect(page.locator('img[alt="Matched closed view"]')).toBeVisible();
  await expect(page.getByText("Dating unverified")).toBeVisible();
  await expect(page.getByRole("button", { name: /frame/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /speed/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Archival source folios" })).toBeVisible();
  await expect(page.locator('img[alt$="title page"]')).toHaveCount(3);
  await expect(page.getByRole("link", { name: "CC BY-SA 3.0 source" })).toHaveAttribute("href", /commons\.wikimedia\.org/);
  await expect(page.getByRole("link", { name: "View public anatomy reference" })).toHaveAttribute("href", /squidindustries\.co/);
  await expect(page.getByRole("link", { name: "View 1994 craft entry" })).toHaveAttribute("href", /nlpdl\.nlp\.gov\.ph/);
  await expect(page.getByRole("link", { name: "View period catalogue scans" })).toHaveAttribute("href", /pbase\.com/);
});

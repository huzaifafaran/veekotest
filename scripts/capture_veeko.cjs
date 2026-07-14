const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const browserPath =
  process.env.VEEKO_CHROMIUM_PATH ||
  "C:\\Users\\Gigabyte\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1208\\chrome-headless-shell-win64\\chrome-headless-shell.exe";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "large-mobile", width: 414, height: 896 },
  { name: "mobile", width: 375, height: 812 },
  { name: "narrow", width: 320, height: 800 },
];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: browserPath });
  const results = [];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
      await page.screenshot({
        path: path.join(root, `qa-${viewport.name}.png`),
        fullPage: true,
      });

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        videos: Array.from(document.querySelectorAll("video")).map((video) => ({
          readyState: video.readyState,
          paused: video.paused,
          source: video.querySelector("source")?.getAttribute("src"),
        })),
      }));

      if (viewport.name === "mobile") {
        await page.getByRole("button", { name: "Open navigation" }).click();
        await page.waitForTimeout(400);
        const menuVisible = await page
          .getByRole("navigation", { name: "Mobile navigation" })
          .isVisible();
        await page.getByRole("button", { name: "Close navigation" }).click();
        dimensions.menuVisible = menuVisible;
      }

      if (viewport.name === "desktop") {
        await page.locator("#risk").scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        dimensions.visibleStageVideoPlaying = await page
          .locator("#risk video")
          .evaluate((video) => !video.paused && video.readyState >= 2);
        dimensions.retractedAnnouncementLinkTabIndex = await page
          .locator(".announcement__link")
          .getAttribute("tabindex");
      }

      results.push({ ...viewport, ...dimensions, errors });
      await page.close();
    }

    const staticPage = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      reducedMotion: "reduce",
    });
    await staticPage.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
    results.push({
      name: "reduced-motion",
      videos: await staticPage.locator("video").count(),
      generatedPosters: await staticPage.locator('img[src*="-poster.webp"]').count(),
    });
    await staticPage.close();
  } finally {
    await browser.close();
  }

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

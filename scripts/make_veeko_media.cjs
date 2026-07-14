const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public", "veeko");
const sourceDir = path.join(root, "source-assets", "veeko");

const jobs = [
  { stem: "mascot-hero", width: 720, height: 720, panX: -0.012, panY: -0.008 },
  { stem: "risk-analysis", width: 960, height: 640, panX: 0.012, panY: -0.006 },
  { stem: "ai-assistant", width: 960, height: 640, panX: -0.012, panY: -0.004 },
  { stem: "analytics", width: 960, height: 640, panX: 0.01, panY: -0.008 },
  { stem: "closing", width: 1280, height: 720, panX: -0.014, panY: -0.004 },
];

const duration = 4000;
const fps = 16;

async function encode(page, job) {
  const input = path.join(sourceDir, `${job.stem}.png`);
  const output = path.join(publicDir, `${job.stem}-loop.webm`);
  const poster = path.join(publicDir, `${job.stem}-poster.webp`);
  const image = fs.readFileSync(input);
  const dataUrl = `data:image/png;base64,${image.toString("base64")}`;

  await sharp(image)
    .resize(job.width, job.height, { fit: "cover", position: "centre" })
    .webp({ quality: 86, effort: 5 })
    .toFile(poster);

  const videoBase64 = await page.evaluate(
    async ({ dataUrl, width, height, duration, fps, panX, panY }) => {
      const image = new Image();
      image.src = dataUrl;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const draw = (progress) => {
        const loop = (1 - Math.cos(progress * Math.PI * 2)) / 2;
        const drift = Math.sin(progress * Math.PI * 2);
        const cover = Math.max(width / image.width, height / image.height);
        const scale = cover * (1 + 0.028 * loop);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const x = (width - drawWidth) / 2 + drift * width * panX;
        const y = (height - drawHeight) / 2 + drift * height * panY;

        context.fillStyle = "#edf8f7";
        context.fillRect(0, 0, width, height);
        context.filter = `brightness(${1 + 0.018 * loop})`;
        context.drawImage(image, x, y, drawWidth, drawHeight);
        context.filter = "none";
      };

      draw(0);
      const stream = canvas.captureStream(fps);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: width > 1000 ? 1300000 : 900000,
      });
      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };

      const completed = new Promise((resolve) => {
        recorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const blob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.readAsDataURL(blob);
        };
      });

      recorder.start(250);
      const started = performance.now();
      await new Promise((resolve) => {
        const tick = () => {
          const elapsed = performance.now() - started;
          const progress = Math.min(elapsed / duration, 1);
          draw(progress);
          if (progress < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      recorder.stop();
      return completed;
    },
    { dataUrl, ...job, duration, fps },
  );

  fs.writeFileSync(output, Buffer.from(videoBase64, "base64"));
  process.stdout.write(`built ${path.basename(output)}\n`);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.VEEKO_CHROMIUM_PATH ||
      "C:\\Users\\Gigabyte\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1208\\chrome-headless-shell-win64\\chrome-headless-shell.exe",
  });
  const page = await browser.newPage();
  try {
    for (const job of jobs) await encode(page, job);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveFromBackendRoot = (...parts) => path.resolve(__dirname, "..", ...parts);

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function replaceFileWithRetry(srcPath, destPath) {
  const maxAttempts = 12;
  const delayMs = 200;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      // Try a simple overwrite copy first
      await fs.copyFile(srcPath, destPath);
      return;
    } catch (err) {
      // If destination is locked, wait and retry. As a fallback, try delete+rename.
      if (attempt === maxAttempts) throw err;
      await sleep(delayMs);

      try {
        await fs.unlink(destPath);
        await fs.rename(srcPath, destPath);
        return;
      } catch {
        // ignore and retry
      }
    }
  }
}

async function main() {
  const relPath = process.argv[2] || "uploads/logo.webp";
  const inputPath = path.isAbsolute(relPath) ? relPath : resolveFromBackendRoot(relPath);

  if (!(await fileExists(inputPath))) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const parsed = path.parse(inputPath);
  const tmpPath = path.join(parsed.dir, `${parsed.name}.trimmed${parsed.ext || ".webp"}`);
  const backupPath = path.join(parsed.dir, `${parsed.name}.backup${parsed.ext || ".webp"}`);

  // Backup once (don’t overwrite an existing backup)
  if (!(await fileExists(backupPath))) {
    await fs.copyFile(inputPath, backupPath);
  }

  // Trim removes uniform borders (works well for transparent padding)
  // Threshold controls sensitivity.
  await sharp(inputPath)
    .trim({ threshold: 10 })
    .webp({ quality: 100 })
    .toFile(tmpPath);

  // Replace original
  await replaceFileWithRetry(tmpPath, inputPath);
  if (await fileExists(tmpPath)) {
    await fs.unlink(tmpPath);
  }

  const meta = await sharp(inputPath).metadata();
  console.log(`Trimmed logo saved: ${inputPath}`);
  console.log(`Result size: ${meta.width}x${meta.height}`);
  console.log(`Backup kept at: ${backupPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

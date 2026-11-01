import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const STATIC_FILES = [
  "index.html",
  "app.js",
  "experience.js",
  "mood-analysis.js",
  "style.css",
  "layout.css",
  "palette.css",
  "experience.css",
];

export async function buildStaticSite(root, output) {
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });

  await Promise.all(
    STATIC_FILES.map((file) =>
      fs.copyFile(path.join(root, file), path.join(output, file)),
    ),
  );
  await fs.cp(path.join(root, "assets"), path.join(output, "assets"), {
    recursive: true,
  });
}

const scriptPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (scriptPath === import.meta.url) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  await buildStaticSite(root, path.join(root, "dist"));
}


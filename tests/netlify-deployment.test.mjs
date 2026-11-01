import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import roomsHandler, { config as roomsConfig } from "../netlify/functions/rooms.mjs";
import { buildStaticSite } from "../scripts/build-static.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the Netlify function handles every shared-room API route", async () => {
  assert.equal(roomsHandler.name, "proxyRoomsRequest");
  assert.deepEqual(roomsConfig, {
    method: ["GET", "POST"],
    path: ["/api/rooms", "/api/rooms/*"],
  });
});

test("the Netlify build publishes only browser assets", async (t) => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), "forma-netlify-"));
  t.after(() => fs.rm(output, { recursive: true, force: true }));

  await buildStaticSite(root, output);

  await fs.access(path.join(output, "index.html"));
  await fs.access(path.join(output, "app.js"));
  await fs.access(path.join(output, "assets", "vibe.svg"));
  await assert.rejects(fs.access(path.join(output, "rooms.cjs")));
  await assert.rejects(fs.access(path.join(output, "tests")));
  await assert.rejects(fs.access(path.join(output, "vercel.json")));
});

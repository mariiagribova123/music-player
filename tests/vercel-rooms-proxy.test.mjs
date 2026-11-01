import assert from "node:assert/strict";
import test from "node:test";

import { proxyRoomsRequest } from "../api/_rooms-proxy.mjs";

test("the Vercel proxy keeps room paths and rewrites invitation links", async (t) => {
  const originalFetch = globalThis.fetch;
  let upstreamRequest;

  globalThis.fetch = async (input, init) => {
    upstreamRequest = new Request(input, init);
    return Response.json(
      {
        room: "abc123",
        inviteOrigin: "https://forma-music-player.mariia-gribova94.chatgpt.site",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const response = await proxyRoomsRequest(
    new Request("https://forma-music-player.vercel.app/api/rooms/abc123/join?client=listener", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer browser-secret",
        "Content-Type": "application/json",
        Origin: "https://forma-music-player.vercel.app",
      },
      body: JSON.stringify({ mood: "chill" }),
    }),
  );

  assert.equal(
    upstreamRequest.url,
    "https://forma-music-player.mariia-gribova94.chatgpt.site/api/rooms/abc123/join?client=listener",
  );
  assert.equal(upstreamRequest.method, "POST");
  assert.equal(upstreamRequest.headers.get("origin"), null);
  assert.equal(upstreamRequest.headers.get("authorization"), null);
  assert.equal(upstreamRequest.headers.get("content-type"), "application/json");
  assert.deepEqual(await upstreamRequest.json(), { mood: "chill" });

  assert.equal(response.status, 201);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    room: "abc123",
    inviteOrigin: "https://forma-music-player.vercel.app",
  });
});

test("the Vercel proxy returns a friendly response when room storage is unavailable", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("network unavailable");
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const response = await proxyRoomsRequest(
    new Request("https://forma-music-player.vercel.app/api/rooms", { method: "POST" }),
  );

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error: "Не удалось связаться с хранилищем комнат.",
  });
});

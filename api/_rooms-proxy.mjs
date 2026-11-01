const ROOM_STORAGE_ORIGIN =
  "https://forma-music-player.mariia-gribova94.chatgpt.site";

function forwardedHeaders(request) {
  const headers = new Headers();
  for (const name of ["accept", "content-type"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

function responseHeaders(response) {
  const headers = new Headers({
    "Cache-Control": response.headers.get("cache-control") || "no-store",
  });
  const contentType = response.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  return headers;
}

export async function proxyRoomsRequest(request) {
  try {
    const incomingUrl = new URL(request.url);
    const upstreamUrl = new URL(
      `${incomingUrl.pathname}${incomingUrl.search}`,
      ROOM_STORAGE_ORIGIN,
    );
    const init = {
      method: request.method,
      headers: forwardedHeaders(request),
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      const body = await request.arrayBuffer();
      if (body.byteLength) init.body = body;
    }

    const upstream = await fetch(upstreamUrl, init);
    const headers = responseHeaders(upstream);
    let body = await upstream.text();

    if (headers.get("content-type")?.includes("application/json")) {
      try {
        const data = JSON.parse(body);
        if (data && typeof data === "object" && "inviteOrigin" in data) {
          data.inviteOrigin = incomingUrl.origin;
        }
        body = JSON.stringify(data);
      } catch {
        // Preserve an unexpected upstream response so its status remains useful.
      }
    }

    return new Response(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch {
    return Response.json(
      { error: "Не удалось связаться с хранилищем комнат." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}


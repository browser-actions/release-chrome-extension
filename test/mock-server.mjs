// Standalone mock server for e2e-testing the packaged action offline.
//
// Stands in for both the Google OAuth2 token endpoint and the Chrome Web
// Store API, so the action's CWS_API_ORIGIN / GOOGLE_API_ORIGIN env var
// overrides (see src/index.ts, src/cws.ts) can point at it instead of the
// real services. Used by the "e2e" job in .github/workflows/build.yml, and
// can be run manually for local testing:
//
//   node test/mock-server.mjs
//
import http from "node:http";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(json);
}

// Matches an exact `${prefix}<id>${suffix}` path, where <id> is a single
// non-empty path segment (no further slashes). Returns the extracted id, or
// null if the path doesn't match exactly.
function matchPath(pathname, prefix, suffix = "") {
  if (!pathname.startsWith(prefix) || !pathname.endsWith(suffix)) {
    return null;
  }
  const id = pathname.slice(prefix.length, pathname.length - suffix.length);
  if (id.length === 0 || id.includes("/")) {
    return null;
  }
  return id;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  console.log(`[mock-server] ${req.method} ${url.pathname}`);

  if (req.method === "GET" && url.pathname === "/healthz") {
    res.writeHead(200);
    res.end("ok");
    return;
  }

  if (req.method === "POST" && url.pathname === "/token") {
    sendJson(res, 200, {
      access_token: "mock-access-token",
      token_type: "Bearer",
      expires_in: 3600,
    });
    return;
  }

  const uploadId = matchPath(
    url.pathname,
    "/upload/chromewebstore/v1.1/items/",
  );
  if (req.method === "PUT" && uploadId) {
    sendJson(res, 200, {
      kind: "chromewebstore#item",
      id: uploadId,
      publicKey: "mock-public-key",
      uploadState: "SUCCESS",
    });
    return;
  }

  const publishId = matchPath(
    url.pathname,
    "/chromewebstore/v1.1/items/",
    "/publish",
  );
  if (req.method === "POST" && publishId) {
    sendJson(res, 200, {
      kind: "chromewebstore#item",
      item_id: publishId,
      status: ["OK"],
      statusDetail: [],
    });
    return;
  }

  console.log(`[mock-server] no route for ${req.method} ${url.pathname}`);
  sendJson(res, 404, { error: "not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-server] listening on http://127.0.0.1:${PORT}`);
});

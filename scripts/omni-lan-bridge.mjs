/**
 * Localhost bridge for OmniCashier on HTTPS production (app.inflero.com).
 *
 * Browsers block HTTPS → http://192.168.x.x (Mixed Content). They allow
 * HTTPS → http://127.0.0.1 (with Private Network Access CORS headers).
 *
 * Run on the POS PC (same Wi‑Fi as the cash register):
 *   npm run omni:bridge
 *   # or: node scripts/omni-lan-bridge.mjs
 *
 * Settings → OmniCashier: Device IP = register IPv4 (e.g. 192.168.100.250), port 8989.
 *
 * Env:
 *   OMNI_BRIDGE_PORT  listen port on 127.0.0.1 (default 18989)
 */

import http from "node:http";

const LISTEN_PORT = Number(process.env.OMNI_BRIDGE_PORT || 18989);
const LISTEN_HOST = "127.0.0.1";

function isPrivateHost(host) {
  const h = String(host || "").toLowerCase();
  if (h === "localhost" || h === "127.0.0.1") return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

function parseTarget(header) {
  if (!header || typeof header !== "string") return null;
  const raw = header.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const colon = raw.lastIndexOf(":");
  let host;
  let port = 8989;
  if (colon > 0 && /^\d+$/.test(raw.slice(colon + 1))) {
    host = raw.slice(0, colon).trim();
    port = Number(raw.slice(colon + 1));
  } else {
    host = raw.trim();
  }
  if (!host || !Number.isFinite(port) || port <= 0 || port > 65535) return null;
  if (!isPrivateHost(host)) return null;
  return { host, port };
}

function setCors(req, res) {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Omni-Target, Access-Control-Request-Private-Network",
  );
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (origin !== "*") {
    res.setHeader("Vary", "Origin");
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const path = (req.url || "/").split("?")[0];

  if (req.method === "GET" && (path === "/health" || path === "/")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "omni-lan-bridge",
        listen: `http://${LISTEN_HOST}:${LISTEN_PORT}`,
      }),
    );
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: -1, message: "Only POST /v2 supported" }));
    return;
  }

  if (path !== "/v2" && path !== "/v2/") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: -1, message: "Use POST /v2" }));
    return;
  }

  const target = parseTarget(req.headers["x-omni-target"]);
  if (!target) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        code: -1,
        message:
          "Missing or invalid X-Omni-Target (private LAN IPv4:port required, e.g. 192.168.100.250:8989)",
      }),
    );
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: -1, message: String(err?.message || err) }));
    return;
  }

  console.log(`[omni-lan-bridge] POST /v2 → ${target.host}:${target.port}`);

  const upstream = http.request(
    {
      hostname: target.host,
      port: target.port,
      path: "/v2",
      method: "POST",
      headers: {
        "Content-Type":
          req.headers["content-type"] || "application/json;charset=UTF-8",
        "Content-Length": body.length,
      },
      timeout: 90_000,
    },
    (upRes) => {
      const chunks = [];
      upRes.on("data", (c) => chunks.push(c));
      upRes.on("end", () => {
        const buf = Buffer.concat(chunks);
        setCors(req, res);
        res.writeHead(upRes.statusCode || 502, {
          "Content-Type": upRes.headers["content-type"] || "application/json",
        });
        res.end(buf);
      });
    },
  );

  upstream.on("timeout", () => {
    upstream.destroy();
    if (!res.headersSent) {
      setCors(req, res);
      res.writeHead(504, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ code: -2, message: "OmniCashier device timed out" }),
      );
    }
  });

  upstream.on("error", (err) => {
    console.error(
      `[omni-lan-bridge] cannot reach ${target.host}:${target.port}:`,
      err.message,
    );
    if (!res.headersSent) {
      setCors(req, res);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          code: -3,
          message: `Cannot reach OmniCashier at ${target.host}:${target.port} — ${err.message}. Check device power, Wi‑Fi, and port 8989.`,
        }),
      );
    }
  });

  upstream.write(body);
  upstream.end();
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`[omni-lan-bridge] ready  http://${LISTEN_HOST}:${LISTEN_PORT}/v2`);
  console.log(`[omni-lan-bridge] health http://${LISTEN_HOST}:${LISTEN_PORT}/health`);
  console.log(
    "[omni-lan-bridge] Keep running on the POS PC. Device IP in Inflero = cash register IPv4.",
  );
});

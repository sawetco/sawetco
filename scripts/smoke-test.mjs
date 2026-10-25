import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { setTimeout } from "node:timers/promises";

const require = createRequire(import.meta.url);
const { name } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url)),
);
const isAzra = name === "azra";
const port = 4179;
const origin = `http://127.0.0.1:${port}`;
const testSecret = randomUUID();
const server = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    env: {
      ...process.env,
      NODE_ENV: "production",
      SANITY_REVALIDATE_SECRET: testSecret,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
for (const stream of [server.stdout, server.stderr]) {
  stream.on("data", (chunk) => {
    logs = `${logs}${chunk}`.slice(-4000);
  });
}
const exited = new Promise((resolve) => server.once("exit", resolve));

async function request(path, expected = 200, options = {}) {
  const response = await fetch(`${origin}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
    ...options,
  });
  assert.equal(
    response.status,
    expected,
    `${path}: expected ${expected}, got ${response.status}`,
  );
  return response;
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Server exited before readiness: ${logs}`);
    try {
      const response = await fetch(origin, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.status === 200) {
        ready = true;
        break;
      }
    } catch {
      /* The server is still starting. */
    }
    await setTimeout(300);
  }
  assert.ok(ready, `Production server did not become ready: ${logs}`);
  const home = await request("/");
  assert.match(await home.text(), /<title>.+?<\/title>/);
  for (const path of isAzra
    ? [
        "/hakkinda",
        "/iletisim",
        "/urunler/katlanir-cam-balkon",
        "/blog",
        "/referanslar",
        "/yonetim",
        "/robots.txt",
        "/sitemap.xml",
      ]
    : [
        "/robots.txt",
        "/sitemap.xml",
        "/manifest.webmanifest",
        "/opengraph-image",
      ]) {
    await request(path);
  }
  const imagePath = isAzra
    ? "/images/products/katlanir-cam-balkon.webp"
    : "/images/samet.png";
  const image = await request(
    `/_next/image?url=${encodeURIComponent(imagePath)}&w=640&q=75`,
  );
  assert.match(image.headers.get("content-type"), /^image\//);
  assert.ok((await image.arrayBuffer()).byteLength > 100);
  await request("/.env.production", 404);
  if (isAzra) {
    const webhookRequire = createRequire(
      require.resolve("next-sanity/webhook"),
    );
    const { encodeSignatureHeader } = webhookRequire("@sanity/webhook");
    const body = JSON.stringify({ _type: "blogPost", slug: "ci-smoke-test" });
    const invalid = await encodeSignatureHeader(
      body,
      Date.now(),
      "wrong-secret",
    );
    await request("/api/sanity/revalidate", 401, {
      method: "POST",
      headers: { "sanity-webhook-signature": invalid },
      body,
    });
    const signature = await encodeSignatureHeader(body, Date.now(), testSecret);
    const valid = await request("/api/sanity/revalidate", 200, {
      method: "POST",
      headers: { "sanity-webhook-signature": signature },
      body,
    });
    assert.ok((await valid.json()).revalidated.includes("content:blog"));
  } else {
    const data = await (await request("/api/contributions")).json();
    assert.equal(data.account, "sawetco");
    assert.equal(data.days.length, 365);
    assert.ok(
      data.days.every(
        (day) => Number.isSafeInteger(day.count) && day.count >= 0,
      ),
    );
  }
  console.log(`${name}: production HTTP, assets and API smoke checks passed.`);
} finally {
  server.kill("SIGTERM");
  await Promise.race([exited, setTimeout(5000)]);
  if (server.exitCode === null && server.signalCode === null)
    server.kill("SIGKILL");
}

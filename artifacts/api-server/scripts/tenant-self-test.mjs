#!/usr/bin/env node
/**
 * Multi-tenant smoke test — run against a live API (pnpm dev).
 * Usage: node artifacts/api-server/scripts/tenant-self-test.mjs [baseUrl]
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

async function req(path, init) {
  const res = await fetch(`${base}/api${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

const checks = [];

async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (e) {
    checks.push({ name, ok: false, error: e.message });
    console.error(`✗ ${name}: ${e.message}`);
  }
}

await check("GET /public/config", async () => {
  const { status, body } = await req("/public/config");
  if (status !== 200) throw new Error(`status ${status}`);
  if (!("defaultHotelSlug" in body)) throw new Error("missing defaultHotelSlug");
});

await check("GET /hotel/branding without slug uses default", async () => {
  const { status } = await req("/hotel/branding");
  if (status !== 200 && status !== 404) throw new Error(`unexpected ${status}`);
});

const slug = (await req("/public/config")).body?.defaultHotelSlug;
if (slug) {
  await check(`GET /public/hotels/${slug}`, async () => {
    const { status, body } = await req(`/public/hotels/${encodeURIComponent(slug)}`);
    if (status !== 200) throw new Error(`status ${status}`);
    if (!body.slug) throw new Error("no slug in body");
  });

  await check("GET /hotel/branding with X-Hotel-Slug", async () => {
    const { status, body } = await req("/hotel/branding", {
      headers: { "X-Hotel-Slug": slug },
    });
    if (status !== 200) throw new Error(`status ${status}`);
    if (!body.appName) throw new Error("missing appName");
  });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} passed`);
process.exit(failed.length ? 1 : 0);

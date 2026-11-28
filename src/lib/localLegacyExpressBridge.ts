/**
 * BULK117 — opt-in in-process legacy Express compatibility bridge.
 *
 * Original controllers and routers are reused as delivered in the user's
 * Express archive. This is NOT a claim of native Next.js rewrites or verified
 * DB/response/authorization parity. The original backend server.js is NEVER
 * imported (it synchronizes/backfills the DB and opens port 5000).
 *
 * During development, GETs are enabled by default. Production access, all
 * mutating methods and known side-effectful GET endpoints require opt-in.
 */
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const safeJson = (message: string, status: number) =>
  Response.json({ success: false, message }, { status, headers: { 'Cache-Control': 'no-store' } });

// Original Express uses write operations in certain GET handlers. Keep those
// blocked until explicitly authorized, without inventing a changed response.
export function isKnownSideEffectfulGet(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '').toLowerCase();
  return p === '/v2/api/sellers/sendmail-cron'
    || p === '/v2/api/products/product-keyword-update'
    || p === '/v2/api/users/insert-from-company'
    || p === '/v2/api/signup/insert-from-company'
    || /^\/v2\/api\/seller_mail_histories\/track-open\//.test(p)
    || /^\/v2\/api\/tickets\/support-ticket\/track\//.test(p);
}

let bridgeUrl: Promise<string> | undefined;

function internalServerUrl(): Promise<string> {
  if (bridgeUrl) return bridgeUrl;
  bridgeUrl = (async () => {
    const file = resolve(process.cwd(), 'legacy/sourceindia-express/compat-app.cjs');
    // Runtime-only require; Next must never bundle or evaluate the original
    // Express controllers during route collection, static generation or build.
    const requireLegacy = createRequire(file);
    const expressApp = requireLegacy(file);
    const server = createServer(expressApp);
    await new Promise<void>((ok, fail) => {
      server.once('error', fail);
      server.listen(0, '127.0.0.1', () => {
        server.removeListener('error', fail);
        ok();
      });
    });
    server.unref();
    const address = server.address();
    if (!address || typeof address === 'string') {
      server.close();
      throw Error('No loopback address for legacy compatibility bridge');
    }
    return `http://127.0.0.1:${address.port}`;
  })().catch((error: unknown) => {
    bridgeUrl = undefined;
    throw error;
  });
  return bridgeUrl;
}

const blockedRequestHeaders = new Set([
  'host', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade',
  'proxy-authorization', 'proxy-authenticate', 'te', 'trailer',
  'accept-encoding', 'content-length',
]);
const blockedResponseHeaders = new Set([
  'connection', 'keep-alive', 'transfer-encoding', 'upgrade',
  'proxy-authenticate', 'te', 'trailer',
]);

export async function legacyExpressBridgeRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/v2/api/') && url.pathname !== '/v2/')
    return safeJson('Unknown compatibility route.', 404);
  if (process.env.NODE_ENV === 'production'
      && process.env.SOURCEINDIA_LEGACY_COMPAT_PRODUCTION !== '1')
    return safeJson('Legacy compatibility is disabled in production.', 503);
  const read = request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS';
  if (!read && process.env.SOURCEINDIA_LEGACY_COMPAT_WRITES !== '1')
    return safeJson('Legacy mutation route not enabled; isolated database QA required.', 403);
  if ((request.method === 'GET' || request.method === 'HEAD')
      && isKnownSideEffectfulGet(url.pathname)
      && process.env.SOURCEINDIA_LEGACY_COMPAT_SIDE_EFFECTFUL_GET !== '1')
    return safeJson('Side-effectful GET requires isolated QA and explicit opt-in.', 403);

  try {
    const base = await internalServerUrl();
    // Fixed loopback origin; only pathname and search are forwarded. No arbitrary
    // upstream host or unvalidated external URL can be selected by a client.
    const target = `${base}${url.pathname}${url.search}`;
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!blockedRequestHeaders.has(key.toLowerCase())) headers.append(key, value);
    });
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    const init = {
      method: request.method,
      headers,
      body: hasBody ? request.body : null,
      duplex: 'half',
      redirect: 'manual',
      signal: request.signal,
    } as RequestInit & { duplex: 'half' };
    const upstream = await fetch(target, init);
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!blockedResponseHeaders.has(key.toLowerCase())) responseHeaders.append(key, value);
    });
    responseHeaders.set('Cache-Control', 'no-store');
    // HEAD, 204 and 304 responses must not have a body in the Fetch API.
    const body = request.method === 'HEAD' || [204, 304].includes(upstream.status)
      ? null : upstream.body;
    return new Response(body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    // Sensitive details and DB connection errors are never reflected to clients.
    console.error('Local legacy API bridge failed', error instanceof Error ? error.message : 'unknown');
    return safeJson('Local legacy compatibility endpoint unavailable.', 503);
  }
}

/*
 * germanplus.skifi.co on SkiFi's own server.
 *
 * Serves the pages and photos, makes /data.js fresh from the catalogue in the
 * database (the pages read it exactly as they read the old static file), sends
 * uploaded product photos at /media/<id>, and passes sign-in and database
 * calls (/rest/v1, /auth/v1, /functions/v1) to the German Plus API next to it.
 * Plain Node, no packages.
 */
import { createServer } from 'node:http';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import zlib from 'node:zlib';
import { makePages } from './pages.mjs';

const ROOT = path.resolve(process.env.SITE_ROOT || path.join(import.meta.dirname, '..', 'web'));
const API = (process.env.API_INTERNAL || 'http://germanplus-api:8000').replace(/\/$/, '');
const PORT = Number(process.env.PORT || 8000);
const WA = process.env.GP_WHATSAPP || '233506690190';
/* The public address (germanplusgh.com) and the admin's address
   (germanplus.skifi.co, where the SkiFi sign in works). When SITE_URL is set,
   www and the admin address send visitors of the public pages to it, and
   /admin on the public address goes to the admin's address. */
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');
const ADMIN_URL = (process.env.ADMIN_URL || '').replace(/\/$/, '');
const SITE_HOST = SITE_URL ? new URL(SITE_URL).host : '';
const ADMIN_HOST = ADMIN_URL ? new URL(ADMIN_URL).host : '';
const EMAIL = process.env.GP_EMAIL || 'germanplusgs@gmail.com';
const pages = makePages({ root: ROOT, email: EMAIL });

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
};
const TEXT = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.xml', '.webmanifest']);
const API_PATHS = /^\/(rest|auth|functions|storage)\/v1(\/|$)|^\/platform\//;
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const MEDIA = new RegExp(`^/media/(${UUID})$`);

const SECURITY = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'SAMEORIGIN',
  'strict-transport-security': 'max-age=31536000',
};

/** A real file for this path: the file, the folder's index.html, or name.html. */
function fileFor(p) {
  let rel;
  try { rel = decodeURIComponent(p); } catch { return null; }
  if (rel.includes('\0')) return null;
  for (const cand of [rel, path.join(rel, 'index.html'), `${rel}.html`]) {
    const f = path.resolve(ROOT, `.${cand}`);
    if (f !== ROOT && !f.startsWith(ROOT + path.sep)) continue;
    try { if (statSync(f).isFile()) return f; } catch { /* next */ }
  }
  return null;
}

function cacheFor(rel) {
  if (rel.startsWith('/admin/')) return 'no-cache';
  if (rel.startsWith('/vendor/')) return 'public, max-age=86400';
  if (rel.startsWith('/assets/')) return 'public, max-age=604800';
  if (/\.(html|json)$/.test(rel) || !path.extname(rel)) return 'no-cache';
  return 'public, max-age=300, must-revalidate';
}

function encodingFor(req) {
  const a = String(req.headers['accept-encoding'] || '');
  return /\bbr\b/.test(a) ? 'br' : /\bgzip\b/.test(a) ? 'gzip' : null;
}
function squeeze(buf, enc) {
  return enc === 'br'
    ? zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 } })
    : zlib.gzipSync(buf, { level: 6 });
}

/** Sends text made here (data.js), compressed when it is worth it. */
function sendText(req, res, body, type, cache) {
  let buf = Buffer.from(body);
  const enc = buf.length > 1024 ? encodingFor(req) : null;
  if (enc) buf = squeeze(buf, enc);
  res.writeHead(200, {
    ...SECURITY, 'content-type': type, 'content-length': String(buf.length), 'cache-control': cache,
    vary: 'accept-encoding', ...(enc ? { 'content-encoding': enc } : {}),
  });
  res.end(req.method === 'HEAD' ? undefined : buf);
}

const packed = new Map();
function send(req, res, file, status = 200) {
  const rel = '/' + path.relative(ROOT, file).split(path.sep).join('/');
  const st = statSync(file);
  const ext = path.extname(file).toLowerCase();
  const enc = TEXT.has(ext) && st.size > 1024 ? encodingFor(req) : null;
  let body = null;
  if (enc) {
    const key = `${enc}:${file}`;
    const hit = packed.get(key);
    if (hit && hit.m === st.mtimeMs && hit.n === st.size) body = hit.body;
    else { body = squeeze(readFileSync(file), enc); packed.set(key, { m: st.mtimeMs, n: st.size, body }); }
  }
  const headers = {
    ...SECURITY,
    'content-type': TYPES[ext] || 'application/octet-stream',
    'content-length': String(body ? body.length : st.size),
    'cache-control': cacheFor(rel),
    ...(TEXT.has(ext) ? { vary: 'accept-encoding' } : {}),
    ...(enc ? { 'content-encoding': enc } : {}),
  };
  if (rel.startsWith('/admin/')) {
    headers['x-robots-tag'] = 'noindex, nofollow';
    headers['referrer-policy'] = 'same-origin';
  }
  res.writeHead(status, headers);
  if (req.method === 'HEAD') return res.end();
  if (body) return res.end(body);
  createReadStream(file).pipe(res);
}

// ---------------------------------------------------------------- the API
const HOP = new Set(['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'te', 'trailer', 'host', 'content-length']);

async function proxy(req, res) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (HOP.has(k) || v == null) continue;
    headers.set(k, Array.isArray(v) ? v.join(', ') : v);
  }
  headers.set('x-forwarded-for', String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''));
  headers.set('x-forwarded-proto', String(req.headers['x-forwarded-proto'] || 'https'));
  headers.set('x-forwarded-host', String(req.headers.host || ''));
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let up;
  try {
    up = await fetch(API + req.url, {
      method: req.method, headers, redirect: 'manual',
      body: hasBody ? Readable.toWeb(req) : undefined,
      duplex: hasBody ? 'half' : undefined,
    });
  } catch (e) {
    console.error('api unreachable', e.message);
    res.writeHead(502, { 'content-type': 'application/json' });
    return res.end('{"message":"The German Plus server is starting up. Try again in a moment."}');
  }
  const out = {};
  up.headers.forEach((v, k) => { if (!HOP.has(k) && k !== 'content-encoding') out[k] = v; });
  res.writeHead(up.status, out);
  if (!up.body || req.method === 'HEAD') return res.end();
  Readable.fromWeb(up.body).pipe(res);
}

// ---------------------------------------------------------------- the catalogue as data.js
/* The pages read three constants: WA, PRODUCTS and CATEGORIES. They come from
   the database, kept for 20 seconds, so a change in the admin shows on the
   site straight away. If the database cannot be reached, the static data.js
   in the repo is sent instead. */
let catalogCache = { at: 0, c: null, js: null };
async function catalog() {
  if (catalogCache.c && Date.now() - catalogCache.at < 20000) return catalogCache.c;
  const r = await fetch(`${API}/rest/v1/rpc/catalog`, { signal: AbortSignal.timeout(2500) });
  if (!r.ok) throw new Error(`catalog ${r.status}`);
  const c = await r.json();
  if (!c || !Array.isArray(c.products) || !Array.isArray(c.categories)) throw new Error('catalog shape');
  catalogCache = { at: Date.now(), c, js: null };
  return c;
}
const safe = (v) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '');
async function dataJs() {
  const c = await catalog();
  if (catalogCache.js) return catalogCache.js;
  const js = `/* German Plus catalogue, from the database${c.updated_at ? `, last changed ${c.updated_at}` : ''}. */\n` +
    `const WA = ${JSON.stringify(WA)};\n\nconst PRODUCTS = ${safe(c.products)};\n\nconst CATEGORIES = ${safe(c.categories)};\n`;
  catalogCache.js = js;
  return js;
}

// ---------------------------------------------------------------- uploaded photos
const mediaCache = new Map();
async function media(req, res, id) {
  let hit = mediaCache.get(id);
  if (hit && Date.now() - hit.at > 600000) { mediaCache.delete(id); hit = null; }
  if (!hit) {
    const r = await fetch(`${API}/rest/v1/rpc/media_file?id=${id}`);
    const j = r.ok ? await r.json() : null;
    if (!j || !j.b64) {
      res.writeHead(404, { 'content-type': 'text/plain', 'cache-control': 'no-cache' });
      return res.end('Not found');
    }
    hit = { type: j.mime, body: Buffer.from(j.b64, 'base64'), at: Date.now() };
    mediaCache.set(id, hit);
    if (mediaCache.size > 300) mediaCache.delete(mediaCache.keys().next().value);
  }
  res.writeHead(200, {
    ...SECURITY,
    'content-type': /^image\/(jpeg|webp|png)$/.test(hit.type) ? hit.type : 'application/octet-stream',
    'content-length': String(hit.body.length),
    // An id is never reused: a new photo gets a new id.
    'cache-control': 'public, max-age=31536000, immutable',
  });
  if (req.method === 'HEAD') return res.end();
  res.end(hit.body);
}

// ---------------------------------------------------------------- the public pages
const PUBLIC = /^\/($|products$|[pc]\/[a-z0-9-]+$|sitemap\.xml$|llms(-full)?\.txt$)/;
const HTML = 'text/html; charset=utf-8';
function redirect(res, code, location) {
  res.writeHead(code, { location, 'cache-control': code === 301 ? 'public, max-age=3600' : 'no-cache' });
  res.end();
}
/* The address links and structured data point to: the public address when it
   is set, otherwise whatever address this request came in on. */
const baseFor = (req) => SITE_URL || `${String(req.headers['x-forwarded-proto'] || 'http').split(',')[0]}://${req.headers.host}`;

async function page(req, res, p) {
  const base = baseFor(req);
  let c;
  try { c = await catalog(); } catch (e) {
    console.error('catalog:', e.message);
    if (p === '/' || p === '/products') return false;   // the plain files still work
    res.writeHead(503, { 'content-type': 'text/plain', 'retry-after': '30' });
    return res.end('The catalogue is loading. Try again in a moment.');
  }
  let body = null, type = HTML;
  if (p === '/') body = pages.home(c, base);
  else if (p === '/products') body = pages.products(c, base);
  else if (p.startsWith('/c/')) body = pages.category(c, base, p.slice(3));
  else if (p.startsWith('/p/')) body = pages.product(c, base, p.slice(3));
  else if (p === '/sitemap.xml') { body = pages.sitemap(c, base); type = 'application/xml; charset=utf-8'; }
  else if (p === '/llms.txt') { body = pages.llms(c, base, false); type = 'text/plain; charset=utf-8'; }
  else if (p === '/llms-full.txt') { body = pages.llms(c, base, true); type = 'text/plain; charset=utf-8'; }
  if (body == null) {
    const html = pages.notFound(base);
    const buf = Buffer.from(html);
    res.writeHead(404, { ...SECURITY, 'content-type': HTML, 'content-length': String(buf.length), 'cache-control': 'no-cache' });
    return res.end(req.method === 'HEAD' ? undefined : buf);
  }
  return sendText(req, res, body, type, 'no-cache');
}

// ---------------------------------------------------------------- requests
async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;

  if (p === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end('{"ok":true}');
  }

  // One address for the public pages, one for the admin.
  const host = String(req.headers.host || '').toLowerCase().split(':')[0];
  if (SITE_HOST && (req.method === 'GET' || req.method === 'HEAD')) {
    if (host === `www.${SITE_HOST}`) return redirect(res, 301, SITE_URL + req.url);
    if (host === SITE_HOST && ADMIN_URL && /^\/admin(\/|$)/.test(p)) return redirect(res, 302, ADMIN_URL + req.url);
    if (host === ADMIN_HOST && (PUBLIC.test(p) || p === '/index.html' || p === '/products.html')) {
      const to = p === '/index.html' ? '/' : p === '/products.html' ? '/products' : p;
      return redirect(res, 301, SITE_URL + to + url.search);
    }
  }
  if (p === '/robots.txt' && ADMIN_HOST && host === ADMIN_HOST) {
    // The admin's address is not for search engines; the public address is.
    return sendText(req, res, 'User-agent: *\nDisallow: /\n', 'text/plain; charset=utf-8', 'public, max-age=3600');
  }

  if (API_PATHS.test(p)) return proxy(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'content-type': 'text/plain', allow: 'GET, HEAD' });
    return res.end('Method not allowed');
  }

  // Clean addresses: /index.html is /, /products.html is /products.
  if (p === '/index.html') return redirect(res, 301, '/' + url.search);
  if (p === '/products.html') return redirect(res, 301, '/products' + url.search);
  if (p === '/admin') { res.writeHead(308, { location: '/admin/' + url.search }); return res.end(); }

  if (PUBLIC.test(p)) {
    const done = await page(req, res, p);
    if (done !== false) return;
  }

  if (p === '/data.js') {
    try {
      return sendText(req, res, await dataJs(), TYPES['.js'], 'no-cache');
    } catch (e) {
      console.error('catalog:', e.message);
      const f = fileFor('/data.js');
      if (f) return send(req, res, f);
    }
  }

  const m = p.match(MEDIA);
  if (m) return media(req, res, m[1]);

  const f = fileFor(p);
  if (f) return send(req, res, f);
  if (!path.extname(p)) {
    try { return await page(req, res, '/__missing__'); } catch { /* fall through */ }
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
}

createServer((req, res) => {
  handle(req, res).catch((e) => {
    console.error(e);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('Server error');
  });
}).listen(PORT, '0.0.0.0', () => console.log(`german plus site on ${PORT}, api at ${API}`));

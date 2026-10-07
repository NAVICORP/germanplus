/*
 * The public pages, written out on the server so search engines and AI
 * assistants can read them without running the page's script:
 *
 *   /             home, with the first products and the categories in the HTML
 *   /products     every product
 *   /c/<key>      one category
 *   /p/<id>       one product: photo, description, details, enquiry
 *   /sitemap.xml  every page above, with the product photos
 *   /llms.txt     a plain summary for AI assistants, /llms-full.txt with details
 *
 * Each page is index.html or products.html with the catalogue filled in, so
 * the header, footer and styles stay the ones the site already uses. The
 * script on the page then takes over as before (filters, search, quick view).
 */
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const STORE_DESC = 'German Plus kitchen and home appliances in Ghana. Microwaves, air fryers, ovens, gas stoves, blenders, juicers, kettles, cookware and dinner sets, with local warranty and service.';
const HOURS = { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '08:30', closes: '17:00' };

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const xml = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]));
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const imgPath = (p) => p.img || `/assets/products/${p.id}.webp`;
const day = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function makePages({ root, email }) {
  const tplCache = new Map();
  function tpl(name) {
    const f = path.join(root, name);
    const m = statSync(f).mtimeMs;
    const hit = tplCache.get(f);
    if (hit && hit.m === m) return hit.html;
    const html = readFileSync(f, 'utf8');
    tplCache.set(f, { m, html });
    return html;
  }

  /* ------------------------------------------------------------ shared bits */
  const catName = (c, key) => (c.categories.find((x) => x.key === key) || {}).name || '';
  const visibleCats = (c) => c.categories.filter((k) => c.products.some((p) => p.cat === k.key));
  const mailto = (p) => `mailto:${email}?subject=${encodeURIComponent('Enquiry: ' + p.name)}&body=${encodeURIComponent('Hello German Plus, I would like details on the ' + p.name + '.')}`;

  function card(p, reveal = true) {
    return `
    <a class="card${reveal ? ' reveal' : ''}" href="/p/${esc(p.id)}" data-id="${esc(p.id)}" aria-label="View details for ${esc(p.name)}">
      <div class="card-media">
        <span class="tag">${esc(p.tag)}</span>
        <img src="${esc(imgPath(p))}" alt="${esc(p.name)}" width="820" height="620" loading="lazy" />
      </div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <p class="card-cat">${esc(p.labels)}</p>
        <span class="card-more">Read More ${arrow}</span>
      </div>
    </a>`;
  }
  function catTile(c, k) {
    const n = c.products.filter((p) => p.cat === k.key).length;
    const cover = c.products.find((p) => p.id === k.img);
    const src = cover ? imgPath(cover) : `/assets/products/${k.img}.webp`;
    return `<a class="cat reveal" href="/c/${esc(k.key)}" data-jump="${esc(k.key)}">
    <img src="${esc(src)}" alt="" aria-hidden="true" width="180" height="180" loading="lazy" />
    <strong>${esc(k.name)}</strong>
    <span>${n} product${n === 1 ? '' : 's'}</span>
  </a>`;
  }

  /* Title, description, canonical and preview tags for one page. */
  function head(html, base, { title, description, canonical, image, type = 'website', jsonld = [] }) {
    const t = esc(title), d = esc(description), u = esc(base + canonical);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
      .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${d}" />`)
      .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${t}" />`)
      .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${d}" />`)
      .replace(/<meta property="og:type" content="[^"]*" \/>/, `<meta property="og:type" content="${type}" />`)
      .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${u}" />`)
      .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${u}" />`);
    if (image) {
      html = html.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(base + image)}" />`)
        .replace(/<meta property="og:image:width" content="[^"]*" \/>\n<meta property="og:image:height" content="[^"]*" \/>\n/, '');
    } else {
      html = html.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(base)}/assets/brand/og.jpg" />`);
    }
    return html.replace('<!--jsonld-->', jsonld.map(ld).join('\n'));
  }
  const replaceMain = (html, inner) => html.replace(/<!--main:start-->[\s\S]*?<!--main:end-->/, inner);
  const fillGrid = (html, list) => html.replace(/<div class="grid" id="productGrid"><\/div>/, `<div class="grid" id="productGrid">${list.map(card).join('')}\n      </div>`);

  const store = (base) => ({
    '@type': 'Store', '@id': `${base}/#store`, name: 'German Plus', url: `${base}/`,
    logo: `${base}/assets/brand/logo.webp`, image: `${base}/assets/brand/og.jpg`,
    description: STORE_DESC, email,
    address: { '@type': 'PostalAddress', addressLocality: 'Accra', addressCountry: 'GH' },
    areaServed: { '@type': 'Country', name: 'Ghana' },
    brand: { '@type': 'Brand', name: 'German Plus' },
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: HOURS.days, opens: HOURS.opens, closes: HOURS.closes }],
  });
  const website = (base) => ({
    '@type': 'WebSite', '@id': `${base}/#website`, url: `${base}/`, name: 'German Plus', inLanguage: 'en-GH',
    publisher: { '@id': `${base}/#store` },
    potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${base}/products?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
  });
  const crumbs = (base, items) => ({
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: base + url })),
  });
  const itemList = (base, list) => ({
    '@type': 'ItemList', numberOfItems: list.length,
    itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}/p/${p.id}`, name: p.name })),
  });

  /* ------------------------------------------------------------ the pages */
  function home(c, base) {
    const limit = Number((tpl('index.html').match(/<body data-limit="(\d+)"/) || [])[1] || 0);
    let html = tpl('index.html');
    html = fillGrid(html, limit ? c.products.slice(0, limit) : c.products);
    html = html.replace(/<div class="cats" id="cats"><\/div>/, `<div class="cats" id="cats">${visibleCats(c).map((k) => catTile(c, k)).join('\n')}</div>`);
    return head(html, base, {
      title: 'German Plus | Kitchen & Home Appliances', description: STORE_DESC, canonical: '/',
      jsonld: [{ '@context': 'https://schema.org', '@graph': [store(base), website(base)] }],
    });
  }

  function products(c, base) {
    let html = fillGrid(tpl('products.html'), c.products);
    return head(html, base, {
      title: 'All Products | German Plus',
      description: 'The full German Plus range: microwaves, air fryers, ovens, gas stoves, blenders, stand mixers, juicers, kettles, cookware, dinner sets and kitchen storage.',
      canonical: '/products',
      jsonld: [{ '@context': 'https://schema.org', '@graph': [
        { '@type': 'CollectionPage', '@id': `${base}/products`, url: `${base}/products`, name: 'All Products', isPartOf: { '@id': `${base}/#website` }, mainEntity: itemList(base, c.products) },
        crumbs(base, [['Home', '/'], ['All Products', '/products']]),
      ] }],
    });
  }

  function category(c, base, key) {
    const k = c.categories.find((x) => x.key === key);
    if (!k) return null;
    const list = c.products.filter((p) => p.cat === key);
    const n = list.length;
    let html = tpl('products.html').replace('<body>', `<body data-cat="${esc(key)}">`);
    html = html.replace(/<section class="page-head">[\s\S]*?<\/section>/, `<section class="page-head">
    <div class="shell">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/products">All Products</a>
        <span aria-hidden="true">/</span>
        <span>${esc(k.name)}</span>
      </nav>
      <h1>${esc(k.name)}</h1>
      <p>German Plus ${esc(k.name.toLowerCase())} in Ghana: ${n} product${n === 1 ? '' : 's'}. Open any product for full details and an email enquiry.</p>
    </div>
  </section>`);
    html = fillGrid(html, list);
    return head(html, base, {
      title: `${k.name} | German Plus Ghana`,
      description: `German Plus ${k.name.toLowerCase()} in Ghana: ${list.slice(0, 6).map((p) => p.name).join(', ')}${n > 6 ? ' and more' : ''}.`,
      canonical: `/c/${key}`,
      jsonld: [{ '@context': 'https://schema.org', '@graph': [
        { '@type': 'CollectionPage', '@id': `${base}/c/${key}`, url: `${base}/c/${key}`, name: k.name, isPartOf: { '@id': `${base}/#website` }, mainEntity: itemList(base, list) },
        crumbs(base, [['Home', '/'], ['All Products', '/products'], [k.name, `/c/${key}`]]),
      ] }],
    });
  }

  function product(c, base, id) {
    const p = c.products.find((x) => x.id === id);
    if (!p) return null;
    const cn = catName(c, p.cat);
    const related = c.products.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
    const spec = (p.spec || []).map((s) => `<li><span>${esc(s[0])}</span><span>${esc(s[1])}</span></li>`).join('');
    const main = `<section class="page-head pdp-head">
    <div class="shell">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/c/${esc(p.cat)}">${esc(cn)}</a>
        <span aria-hidden="true">/</span>
        <span>${esc(p.name)}</span>
      </nav>
    </div>
  </section>

  <section class="section pdp-section">
    <div class="shell">
      <article class="pdp">
        <div class="sheet-visual pdp-visual">
          <img src="${esc(imgPath(p))}" alt="${esc(p.name)}" width="820" height="620" fetchpriority="high" />
        </div>
        <div class="sheet-copy pdp-copy">
          <p class="eyebrow">${esc(p.labels)}</p>
          <h1>${esc(p.name)}</h1>
          ${p.short ? `<p class="pdp-lead">${esc(p.short)}</p>` : ''}
          ${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
          ${spec ? `<ul class="spec">${spec}</ul>` : ''}
          <div class="pdp-cta">
            <a class="btn btn-primary" href="${esc(mailto(p))}">Enquire about this model</a>
            <a class="btn btn-ghost" href="/c/${esc(p.cat)}">More ${esc(cn)}</a>
          </div>
        </div>
      </article>
    </div>
  </section>
${related.length ? `
  <section class="section section-alt">
    <div class="shell">
      <h2 class="sec-title left">More in ${esc(cn)}</h2>
      <div class="grid" id="relatedGrid">${related.map((r) => card(r, false)).join('')}
      </div>
    </div>
  </section>
` : ''}`;
    let html = replaceMain(tpl('products.html'), main);
    const description = (p.short || p.desc || p.name).slice(0, 300);
    const jsonProduct = {
      '@type': 'Product', '@id': `${base}/p/${p.id}#product`, name: p.name, url: `${base}/p/${p.id}`,
      image: [base + imgPath(p)], description: p.desc || p.short || p.name, sku: p.id,
      category: p.labels || cn, brand: { '@type': 'Brand', name: 'German Plus' },
    };
    if ((p.spec || []).length) jsonProduct.additionalProperty = p.spec.map((s) => ({ '@type': 'PropertyValue', name: s[0], value: s[1] }));
    return head(html, base, {
      title: `${p.name} | German Plus Ghana`, description, canonical: `/p/${p.id}`, image: imgPath(p), type: 'product',
      jsonld: [{ '@context': 'https://schema.org', '@graph': [jsonProduct, crumbs(base, [['Home', '/'], [cn, `/c/${p.cat}`], [p.name, `/p/${p.id}`]])] }],
    });
  }

  function notFound(base) {
    const main = `<section class="page-head">
    <div class="shell">
      <h1>Page not found</h1>
      <p>This page has moved or no longer exists. Browse the full range, or go back to the home page.</p>
      <p style="margin-top:22px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-primary" href="/products">All Products</a><a class="btn btn-ghost" href="/">Home</a></p>
    </div>
  </section>`;
    const html = replaceMain(tpl('products.html'), main).replace('<meta name="robots" content="index, follow, max-image-preview:large" />', '<meta name="robots" content="noindex" />');
    return head(html, base, { title: 'Page not found | German Plus', description: STORE_DESC, canonical: '/' });
  }

  /* ------------------------------------------------------------ for crawlers */
  function sitemap(c, base) {
    const lm = day(c.updated_at);
    const url = (loc, extra = '') => `  <url><loc>${xml(base + loc)}</loc><lastmod>${lm}</lastmod>${extra}</url>`;
    const rows = [url('/'), url('/products'),
      ...visibleCats(c).map((k) => url(`/c/${k.key}`)),
      ...c.products.map((p) => url(`/p/${p.id}`, `<image:image><image:loc>${xml(base + imgPath(p))}</image:loc></image:image>`))];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${rows.join('\n')}\n</urlset>\n`;
  }

  function llms(c, base, full) {
    const out = [
      '# German Plus',
      '',
      '> German Plus sells kitchen and home appliances, cookware and tableware to households in Ghana, from a showroom in Accra.',
      '',
      `- Website: ${base}/`,
      `- Email: ${email}`,
      '- Showroom: Accra, Ghana',
      '- Hours: Monday to Saturday, 8:30am to 5pm. Sunday closed.',
      '- To ask about a product, stock or the showroom, email with the product name.',
      '',
    ];
    for (const k of visibleCats(c)) {
      out.push(`## ${k.name}`, '', `Category page: ${base}/c/${k.key}`, '');
      for (const p of c.products.filter((x) => x.cat === k.key)) {
        if (!full) { out.push(`- [${p.name}](${base}/p/${p.id}): ${p.short || p.labels || ''}`); continue; }
        out.push(`### ${p.name}`, '', `- Page: ${base}/p/${p.id}`, `- Type: ${p.labels || k.name}`);
        if (p.short) out.push(`- In short: ${p.short}`);
        for (const s of p.spec || []) out.push(`- ${s[0]}: ${s[1]}`);
        if (p.desc) out.push('', p.desc);
        out.push('');
      }
      out.push('');
    }
    if (!full) out.push('## More', '', `- [All products](${base}/products)`, `- [Full product details for AI assistants](${base}/llms-full.txt)`, '');
    return out.join('\n');
  }

  return { home, products, category, product, notFound, sitemap, llms };
}

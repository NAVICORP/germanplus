# German Plus

Product showcase website for German Plus home and kitchen appliances, Ghana.

Static site, no build step. Deployed on Vercel at germanplus.skifi.co.

## Structure

- `index.html` — single page: hero, collection, values, brand story, contact
- `styles.css` — design tokens and all styling
- `script.js` — product data, filtering, detail sheet, reveal animations
- `assets/products/` — cut out product images (WebP)
- `assets/brand/` — logo, light logo, favicon, social preview

## Editing products

All product content lives in the `PRODUCTS` array at the top of `script.js`.
Add an entry and drop a matching WebP into `assets/products/` named after its `id`.

Designed and built by SkiFi Designs.

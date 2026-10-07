# German Plus

Product showcase website for German Plus home and kitchen appliances, Ghana, with an admin for the catalogue.

## Structure

- `index.html`, `products.html`: the pages. `script.js` draws the categories, the product grid, search and the detail sheet from `data.js`.
- `data.js`: the catalogue as three constants (`WA`, `PRODUCTS`, `CATEGORIES`). On the server it is made fresh from the database on every request (kept 20 seconds); this file is the fallback.
- `admin/`: the admin at `/admin`. Sign in with WhatsApp (Ghana and India included), Google or an emailed code, through the SkiFi login.
- `server/site.mjs`: the site server. Pages, `/data.js` from the database, uploaded photos at `/media/<id>`, and `/rest/v1`, `/auth/v1` passed to the API.
- `supabase/migrations/`: the database. `0001` is the catalogue, the team and every change function; `0002_seed.sql` is the catalogue as it was before the admin (made by `node tools/seed.mjs`).
- `deploy/docker-compose.yml`, `Dockerfile`: the stack for Dokploy (Postgres, the German Plus API on the shared SkiFi app base, the site, a nightly backup).
- `assets/products/`: the original product photos (WebP). Photos added in the admin live in the database.

## The admin

- Products: add, edit, hide or show, delete, and change the order within a category. Photos are made smaller in the browser before upload.
- Categories: add, rename, reorder, pick the photo on the category tile.
- Team: super admins (Ishaque, Nusaif) can change everything. Admins can change products and categories and add or remove admins. Only a super admin can add, change or remove a super admin, and nobody can remove themselves.
- Activity: the last 100 changes and who made them.

## Deploying

Dokploy, project "German Plus", Docker Compose from GitHub (NAVICORP/germanplus, branch main, compose path `./deploy/docker-compose.yml`, autodeploy on). Domains on service `site`, port 8000, HTTPS (Let's Encrypt): `germanplusgh.com`, `www.germanplusgh.com` and `germanplus.skifi.co`. DNS: at GoDaddy, `germanplusgh.com` has an A record to the SkiFi server and `www` a CNAME to it; `germanplus` on skifi.co has an A record to the same server.

## Addresses

- `germanplusgh.com` is the public site. `www.germanplusgh.com` redirects to it.
- `germanplus.skifi.co` is the admin, at `/admin`, because the SkiFi sign in works on skifi.co addresses. Its public pages redirect to germanplusgh.com, and `/admin` on germanplusgh.com redirects here.
- Set by `SITE_URL` and `ADMIN_URL` in `deploy/docker-compose.yml`.

## Search engines and AI assistants

`server/pages.mjs` writes the public pages on the server from the catalogue, so they read the same with or without the script:

- `/`, `/products`, `/c/<category>` and `/p/<product>`, each with a canonical address, link previews and schema.org data (Store, WebSite, CollectionPage, Product, BreadcrumbList).
- `/sitemap.xml` lists every page with its product photo. `/robots.txt` points to it and keeps `/admin` out.
- `/llms.txt` and `/llms-full.txt` describe the shop and every product in plain text for AI assistants.
- A product added in the admin gets its page, sitemap entry and llms.txt line straight away.

Designed and built by SkiFi Designs.

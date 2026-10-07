# German Plus on SkiFi's own server (germanplus.skifi.co), on the shared SkiFi
# app base: the database API and sign-in through SkAuth. The same image runs
# twice (deploy/docker-compose.yml): as the API, and as the site in front of
# it (server/site.mjs).

# ---- the pages: everything in the repo except what only builds or runs it
FROM busybox:1.37 AS web
COPY . /w
RUN cd /w && rm -rf .git .github supabase tools server deploy \
      Dockerfile .dockerignore .gitignore vercel.json ./*.md

FROM ghcr.io/navicorp/skifi-app:latest
USER root
COPY supabase/migrations /srv/app/migrations
COPY server /srv/site/server
COPY --from=web /w /srv/site/web
# The sign-in library the admin page loads, from the copy the server already has.
RUN mkdir -p /srv/site/web/vendor \
 && cp /srv/backend/api/node_modules/@supabase/supabase-js/dist/umd/supabase.js /srv/site/web/vendor/supabase.js
ENV SITE_ROOT=/srv/site/web
USER node

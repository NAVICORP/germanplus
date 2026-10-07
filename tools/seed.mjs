// Writes supabase/migrations/0002_seed.sql from data.js: the catalogue as the
// site had it before the admin page. Runs once; edits made in the admin stay.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
const src = readFileSync(new URL('../data.js', import.meta.url), 'utf8');
const ctx = {};
vm.runInNewContext(src + '\n;this.out = { WA, PRODUCTS, CATEGORIES };', ctx);
const { PRODUCTS, CATEGORIES } = ctx.out;
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const lines = [
  '-- The catalogue as the site had it before the admin page (made by tools/seed.mjs).',
  '-- Only fills an empty catalogue, so it never undoes changes made in the admin.',
  'do $$',
  'begin',
  '  if exists (select 1 from public.products) or exists (select 1 from public.categories) then return; end if;',
];
CATEGORIES.forEach((c, i) => {
  lines.push(`  insert into public.categories (key, name, sort) values (${q(c.key)}, ${q(c.name)}, ${i});`);
});
const n = {};
for (const p of PRODUCTS) {
  const cat = CATEGORIES.find((c) => c.key === p.cat);
  const sort = (n[p.cat] = (n[p.cat] ?? -1) + 1);
  const tag = p.tag && cat && p.tag !== cat.name ? p.tag : null;
  lines.push(`  insert into public.products (id, name, cat, tag, labels, short, descr, spec, sort, updated_by) values (${[
    q(p.id), q(p.name), q(p.cat), q(tag), q(p.labels), q(p.short), q(p.desc), `${q(JSON.stringify(p.spec))}::jsonb`, sort, q('setup'),
  ].join(', ')});`);
}
CATEGORIES.forEach((c) => {
  if (c.img) lines.push(`  update public.categories set cover = ${q(c.img)} where key = ${q(c.key)} and exists (select 1 from public.products where id = ${q(c.img)});`);
});
lines.push('end $$;', '');
writeFileSync(new URL('../supabase/migrations/0002_seed.sql', import.meta.url), lines.join('\n'));
console.log(`seeded ${CATEGORIES.length} categories, ${PRODUCTS.length} products`);

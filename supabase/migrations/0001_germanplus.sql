-- German Plus on SkiFi's own server: the product catalogue and who may change it.
--
-- The public pages read the catalogue through catalog() (the site server turns
-- it into /data.js, the same shape the pages always used). Changes go through
-- the functions below, which check who is signed in. No table is open to the
-- public or to signed-in people directly.
--
-- Two roles, both for the admin page:
--   super  can do everything, and is the only one who can add, change or
--          remove a super admin. A super admin cannot remove themselves.
--   admin  can change products and categories, and add or remove admins.

-- ---------------------------------------------------------------- who is signed in

-- The signed-in email, lower-cased, or null.
create or replace function public.me() returns text
language sql stable set search_path = '' as $$
  select nullif(lower(btrim(coalesce(auth.email(), ''))), '');
$$;

-- The signed-in WhatsApp number, digits only, or null.
create or replace function public.my_phone() returns text
language sql stable set search_path = '' as $$
  select nullif(regexp_replace(coalesce(auth.jwt() ->> 'phone', ''), '[^0-9]', '', 'g'), '');
$$;

-- A typed number as digits with the country code ("+233 50 669 0190" -> 233506690190).
create or replace function public.phone_digits(p text) returns text
language sql immutable set search_path = '' as $$
  select case when d ~ '^00[0-9]+$' then substr(d, 3) else nullif(d, '') end
  from (select regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') as d) x;
$$;

-- ---------------------------------------------------------------- the team

create table public.team (
  id       uuid primary key default gen_random_uuid(),
  name     text not null check (char_length(btrim(name)) between 1 and 80),
  email    text unique check (email is null or (email = lower(btrim(email)) and email like '%_@_%._%')),
  phone    text unique check (phone is null or phone ~ '^[0-9]{8,15}$'),
  role     text not null check (role in ('super', 'admin')),
  added_at timestamptz not null default now(),
  added_by text,
  check (email is not null or phone is not null)
);
alter table public.team enable row level security;
revoke all on public.team from anon, authenticated;

-- The signed-in person's row on the team, if any. A super row wins if the
-- email and the number belong to two different rows.
create or replace function public.my_member() returns public.team
language sql stable security definer set search_path = '' as $$
  select t.* from public.team t
   where (t.email is not null and t.email = public.me())
      or (t.phone is not null and t.phone = public.my_phone())
   order by case t.role when 'super' then 1 else 2 end
   limit 1;
$$;

create or replace function public.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select (public.my_member()).role;
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select (public.my_member()).id is not null;
$$;

create or replace function public.is_super() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((public.my_member()).role = 'super', false);
$$;

create or replace function public.my_name() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((public.my_member()).name, public.me(), '+' || public.my_phone());
$$;

create or replace function public.whoami() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'email', public.me(), 'phone', public.my_phone(), 'name', public.my_name(),
    'id', (public.my_member()).id, 'role', public.my_role(),
    'admin', public.is_admin(), 'super', public.is_super());
$$;

-- Before a WhatsApp code is sent: is this number on the team at all?
create or replace function public.can_sign_in(phone text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.team t where t.phone = public.phone_digits(can_sign_in.phone));
$$;

-- ---------------------------------------------------------------- the catalogue

create table public.categories (
  key        text primary key check (key ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  cover      text,               -- the product whose photo shows on the category tile
  sort       int not null default 0,
  updated_at timestamptz not null default now()
);

-- Photos people upload. The admin page shrinks them first; kept in the
-- database so the nightly backup has them. Served at /media/<id>.
create table public.media (
  id       uuid primary key default gen_random_uuid(),
  mime     text not null check (mime in ('image/webp', 'image/jpeg', 'image/png')),
  data     bytea not null,
  width    int check (width between 1 and 6000),
  height   int check (height between 1 and 6000),
  added_by text,
  added_key text,
  added_at timestamptz not null default now()
);

create table public.products (
  id         text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  name       text not null check (char_length(btrim(name)) between 1 and 120),
  cat        text not null references public.categories(key) on update cascade,
  tag        text check (char_length(tag) <= 40),
  labels     text check (char_length(labels) <= 160),
  short      text check (char_length(short) <= 300),
  descr      text check (char_length(descr) <= 3000),
  spec       jsonb not null default '[]'::jsonb check (jsonb_typeof(spec) = 'array'),
  image      uuid references public.media(id) on delete set null,
  visible    boolean not null default true,
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);
create index products_cat_idx on public.products (cat, sort);
alter table public.categories add constraint categories_cover_fk
  foreign key (cover) references public.products(id) on update cascade on delete set null deferrable initially deferred;

create table public.activity (
  id     bigserial primary key,
  at     timestamptz not null default now(),
  who    text,
  action text not null,
  detail text
);
create index activity_at_idx on public.activity (at desc);

alter table public.categories enable row level security;
alter table public.media enable row level security;
alter table public.products enable row level security;
alter table public.activity enable row level security;
revoke all on public.categories, public.media, public.products, public.activity from anon, authenticated;
revoke all on sequence public.activity_id_seq from anon, authenticated;

create or replace function public.log(action text, detail text) returns void
language sql security definer set search_path = '' as $$
  insert into public.activity (who, action, detail) values (public.my_name(), log.action, left(log.detail, 300));
  delete from public.activity a where a.id < (select coalesce(max(x.id), 0) - 2000 from public.activity x);
$$;

-- A product as the pages read it. Uploaded photos are /media/<id>; the
-- site's own photos stay at assets/products/<id>.webp (no img given).
create or replace function public.product_json(p public.products, admin boolean default false) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', p.id, 'name', p.name, 'cat', p.cat, 'tag', coalesce(nullif(p.tag, ''), c.name),
    'labels', coalesce(p.labels, ''), 'short', coalesce(p.short, ''), 'desc', coalesce(p.descr, ''),
    'spec', p.spec,
    'img', case when p.image is not null then '/media/' || p.image end
  )) || case when admin then jsonb_build_object(
    'visible', p.visible, 'sort', p.sort, 'image', p.image, 'tagOwn', p.tag,
    'updated_at', p.updated_at, 'updated_by', p.updated_by) else '{}'::jsonb end
  from public.categories c where c.key = p.cat;
$$;

-- The whole public catalogue, in order: what /data.js is made from.
create or replace function public.catalog() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'products', coalesce((
      select jsonb_agg(public.product_json(p) order by c.sort, p.sort, p.name)
        from public.products p join public.categories c on c.key = p.cat
       where p.visible), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('key', c.key, 'name', c.name,
               'img', coalesce(c.cover, (select p.id from public.products p where p.cat = c.key and p.visible order by p.sort limit 1)))
             order by c.sort, c.name)
        from public.categories c), '[]'::jsonb),
    'updated_at', greatest((select max(updated_at) from public.products), (select max(updated_at) from public.categories))
  );
$$;

-- One uploaded photo's bytes, for the site to send.
create or replace function public.media_file(id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('mime', m.mime, 'b64', encode(m.data, 'base64'))
    from public.media m where m.id = media_file.id;
$$;

-- Everything the admin page shows, hidden products too.
create or replace function public.admin_catalog() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'products', coalesce((
      select jsonb_agg(public.product_json(p, true) order by c.sort, p.sort, p.name)
        from public.products p join public.categories c on c.key = p.cat), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('key', c.key, 'name', c.name, 'cover', c.cover, 'sort', c.sort,
               'count', (select count(*) from public.products p where p.cat = c.key))
             order by c.sort, c.name)
        from public.categories c), '[]'::jsonb));
end $$;

-- A url-safe id from a name: "GP Air Fryer 6.5L" -> "gp-air-fryer-6-5l".
create or replace function public.slugify(t text) returns text
language sql immutable set search_path = '' as $$
  select left(trim(both '-' from regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]+', '-', 'g')), 80);
$$;

-- Add or change a product. `original` is the id it was loaded with (null for
-- a new one); `expected` the updated_at it was loaded with, so two people
-- editing the same product do not overwrite each other.
create or replace function public.save_product(p jsonb, original text default null, expected timestamptz default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  cur public.products%rowtype;
  new_id text := public.slugify(coalesce(nullif(p ->> 'id', ''), p ->> 'name'));
  spec jsonb := coalesce(p -> 'spec', '[]'::jsonb);
  img uuid;
  row public.products%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  if coalesce(btrim(p ->> 'name'), '') = '' then
    raise exception 'Give the product a name.' using errcode = '22023';
  end if;
  if new_id = '' then
    raise exception 'The product needs a name with letters or numbers.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.categories c where c.key = p ->> 'cat') then
    raise exception 'Pick a category.' using errcode = '22023';
  end if;
  if jsonb_typeof(spec) <> 'array' or jsonb_array_length(spec) > 30 or exists (
       select 1 from jsonb_array_elements(spec) s
        where jsonb_typeof(s) <> 'array' or jsonb_array_length(s) <> 2
           or char_length(s ->> 0) > 60 or char_length(s ->> 1) > 160) then
    raise exception 'Each detail needs a label and a value.' using errcode = '22023';
  end if;
  -- Empty rows are dropped rather than refused.
  select coalesce(jsonb_agg(jsonb_build_array(btrim(s ->> 0), btrim(s ->> 1))), '[]'::jsonb) into spec
    from jsonb_array_elements(spec) s
   where btrim(coalesce(s ->> 0, '')) <> '' and btrim(coalesce(s ->> 1, '')) <> '';
  begin
    img := nullif(p ->> 'image', '')::uuid;
  exception when others then
    raise exception 'That photo did not come through. Add it again.' using errcode = '22023';
  end;
  if img is not null and not exists (select 1 from public.media m where m.id = img) then
    raise exception 'That photo did not come through. Add it again.' using errcode = '22023';
  end if;

  if original is not null then
    select * into cur from public.products x where x.id = original for update;
    if not found then
      raise exception 'This product was deleted a moment ago.' using errcode = 'PT404';
    end if;
    if expected is not null and date_trunc('milliseconds', cur.updated_at) <> date_trunc('milliseconds', expected) then
      raise exception 'Someone else saved this product a moment ago. Reload to see their change.' using errcode = 'PT409';
    end if;
  end if;
  if (original is null or new_id <> original) and exists (select 1 from public.products x where x.id = new_id) then
    raise exception 'Another product already uses the id "%". Change the id or the name.', new_id using errcode = '23505';
  end if;

  if original is null then
    insert into public.products (id, name, cat, tag, labels, short, descr, spec, image, visible, sort, updated_by)
    values (new_id, btrim(p ->> 'name'), p ->> 'cat', nullif(btrim(p ->> 'tag'), ''), nullif(btrim(p ->> 'labels'), ''),
            nullif(btrim(p ->> 'short'), ''), nullif(btrim(p ->> 'desc'), ''), spec, img,
            coalesce((p ->> 'visible')::boolean, true),
            coalesce((select max(x.sort) + 1 from public.products x where x.cat = p ->> 'cat'), 0),
            public.my_name())
    returning * into row;
    perform public.log('added', row.name);
  else
    update public.products x set
      id = new_id, name = btrim(p ->> 'name'), cat = p ->> 'cat', tag = nullif(btrim(p ->> 'tag'), ''),
      labels = nullif(btrim(p ->> 'labels'), ''), short = nullif(btrim(p ->> 'short'), ''),
      descr = nullif(btrim(p ->> 'desc'), ''), spec = save_product.spec, image = img,
      visible = coalesce((p ->> 'visible')::boolean, x.visible),
      sort = case when x.cat = p ->> 'cat' then x.sort
                  else coalesce((select max(y.sort) + 1 from public.products y where y.cat = p ->> 'cat'), 0) end,
      updated_at = now(), updated_by = public.my_name()
     where x.id = original
    returning * into row;
    perform public.log('changed', row.name);
    -- A photo replaced or removed is no longer needed.
    if cur.image is not null and cur.image is distinct from img then
      delete from public.media m where m.id = cur.image
        and not exists (select 1 from public.products y where y.image = m.id);
    end if;
  end if;
  return public.product_json(row, true);
end $$;

create or replace function public.set_product_visible(id text, visible boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare row public.products%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  update public.products p set visible = set_product_visible.visible, updated_at = now(), updated_by = public.my_name()
   where p.id = set_product_visible.id returning * into row;
  if not found then raise exception 'That product is gone.' using errcode = 'PT404'; end if;
  perform public.log(case when visible then 'showed' else 'hid' end, row.name);
  return public.product_json(row, true);
end $$;

create or replace function public.delete_product(id text) returns void
language plpgsql security definer set search_path = '' as $$
declare row public.products%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  delete from public.products p where p.id = delete_product.id returning * into row;
  if not found then return; end if;
  if row.image is not null then
    delete from public.media m where m.id = row.image and not exists (select 1 from public.products y where y.image = m.id);
  end if;
  perform public.log('deleted', row.name);
end $$;

-- The order products show in, within one category: ids top to bottom.
create or replace function public.reorder_products(cat text, ids text[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  update public.products p set sort = x.n - 1
    from unnest(ids) with ordinality as x(id, n)
   where p.id = x.id and p.cat = reorder_products.cat;
  perform public.log('reordered', (select c.name from public.categories c where c.key = reorder_products.cat));
end $$;

-- Add or change a category. `original` is its key as loaded (null for new).
create or replace function public.save_category(c jsonb, original text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  k text := public.slugify(coalesce(nullif(c ->> 'key', ''), c ->> 'name'));
  cov text := nullif(c ->> 'cover', '');
  row public.categories%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  if coalesce(btrim(c ->> 'name'), '') = '' then
    raise exception 'Give the category a name.' using errcode = '22023';
  end if;
  k := left(k, 40);
  if (original is null or k <> original) and exists (select 1 from public.categories x where x.key = k) then
    raise exception 'There is already a category called that.' using errcode = '23505';
  end if;
  if cov is not null and not exists (select 1 from public.products p where p.id = cov) then
    cov := null;
  end if;
  if original is null then
    insert into public.categories (key, name, cover, sort)
    values (k, btrim(c ->> 'name'), cov, coalesce((select max(x.sort) + 1 from public.categories x), 0))
    returning * into row;
    perform public.log('added category', row.name);
  else
    update public.categories x set key = k, name = btrim(c ->> 'name'), cover = cov, updated_at = now()
     where x.key = original returning * into row;
    if not found then raise exception 'That category is gone.' using errcode = 'PT404'; end if;
    perform public.log('changed category', row.name);
  end if;
  return to_jsonb(row);
end $$;

create or replace function public.delete_category(key text) returns void
language plpgsql security definer set search_path = '' as $$
declare n int; nm text;
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  select count(*) into n from public.products p where p.cat = delete_category.key;
  if n > 0 then
    raise exception 'Move or delete its % product% first.', n, case when n = 1 then '' else 's' end using errcode = '23503';
  end if;
  delete from public.categories c where c.key = delete_category.key returning c.name into nm;
  if nm is not null then perform public.log('deleted category', nm); end if;
end $$;

create or replace function public.reorder_categories(keys text[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  update public.categories c set sort = x.n - 1, updated_at = now()
    from unnest(keys) with ordinality as x(key, n) where c.key = x.key;
  perform public.log('reordered categories', null);
end $$;

-- A product photo. The page shrinks it first (longest side 1400px).
create or replace function public.add_media(data text, mime text, width int, height int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  bytes bytea;
  key text := coalesce(public.me(), public.my_phone());
  id uuid;
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  if add_media.mime not in ('image/webp', 'image/jpeg', 'image/png') then
    raise exception 'Use a JPEG, PNG or WebP photo.' using errcode = '22023';
  end if;
  begin
    bytes := decode(add_media.data, 'base64');
  exception when others then
    raise exception 'That photo did not come through. Try again.' using errcode = '22023';
  end;
  if length(bytes) > 3 * 1024 * 1024 then
    raise exception 'That photo is too large.' using errcode = '22023';
  end if;
  if (select count(*) from public.media m where m.added_key = key and m.added_at > now() - interval '1 day') >= 300 then
    raise exception 'That is a lot of photos for one day. Add the rest tomorrow.' using errcode = '22023';
  end if;
  -- Photos uploaded but never saved on a product are cleared after a day.
  delete from public.media m where m.added_at < now() - interval '1 day'
    and not exists (select 1 from public.products p where p.image = m.id);
  insert into public.media (mime, data, width, height, added_by, added_key)
  values (add_media.mime, bytes, add_media.width, add_media.height, public.my_name(), key)
  returning media.id into id;
  return jsonb_build_object('id', id, 'url', '/media/' || id);
end $$;

-- ---------------------------------------------------------------- managing the team

create or replace function public.team_list() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare mine uuid := (public.my_member()).id;
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', t.id, 'name', t.name, 'email', t.email, 'phone', t.phone, 'role', t.role,
      'added_at', t.added_at, 'added_by', t.added_by, 'me', t.id = mine)
    order by case t.role when 'super' then 1 else 2 end, t.name) from public.team t), '[]'::jsonb);
end $$;

-- Add someone, or change their name, email, number or role (id given).
-- Admins add and change admins; only a super admin touches a super admin.
create or replace function public.save_member(m jsonb, id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  e text := nullif(lower(btrim(coalesce(m ->> 'email', ''))), '');
  ph text := public.phone_digits(m ->> 'phone');
  r text := coalesce(nullif(m ->> 'role', ''), 'admin');
  nm text := btrim(coalesce(m ->> 'name', ''));
  cur public.team%rowtype;
  row public.team%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  if nm = '' then raise exception 'Add their name.' using errcode = '22023'; end if;
  if e is null and ph is null then
    raise exception 'Add their WhatsApp number or email, or both.' using errcode = '22023';
  end if;
  if e is not null and e not like '%_@_%._%' then
    raise exception 'That email does not look right.' using errcode = '22023';
  end if;
  if ph is not null and ph !~ '^[0-9]{8,15}$' then
    raise exception 'That number does not look right. Include the country code.' using errcode = '22023';
  end if;
  if r not in ('super', 'admin') then raise exception 'Pick admin or super admin.' using errcode = '22023'; end if;
  if r = 'super' and not public.is_super() then
    raise exception 'Only a super admin can make someone a super admin.' using errcode = '42501';
  end if;
  if exists (select 1 from public.team t where (t.email = e or t.phone = ph) and t.id is distinct from save_member.id) then
    raise exception 'Someone on the team already has that email or number.' using errcode = '23505';
  end if;

  if save_member.id is null then
    insert into public.team (name, email, phone, role, added_by) values (nm, e, ph, r, public.my_name())
    returning * into row;
    perform public.log('added to the team', row.name || ' (' || row.role || ')');
  else
    select * into cur from public.team t where t.id = save_member.id for update;
    if not found then raise exception 'That person is no longer on the team.' using errcode = 'PT404'; end if;
    if cur.role = 'super' and not public.is_super() then
      raise exception 'Only a super admin can change a super admin.' using errcode = '42501';
    end if;
    if cur.id = (public.my_member()).id and r <> cur.role then
      raise exception 'You cannot change your own role. Ask another super admin.' using errcode = '22023';
    end if;
    update public.team t set name = nm, email = e, phone = ph, role = r where t.id = save_member.id returning * into row;
    perform public.log('changed on the team', row.name || ' (' || row.role || ')');
  end if;
  return to_jsonb(row);
end $$;

create or replace function public.remove_member(id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare cur public.team%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  select * into cur from public.team t where t.id = remove_member.id for update;
  if not found then return; end if;
  if cur.id = (public.my_member()).id then
    raise exception 'You cannot remove yourself. Ask another admin.' using errcode = '22023';
  end if;
  if cur.role = 'super' and not public.is_super() then
    raise exception 'Super admins can only be removed by another super admin.' using errcode = '42501';
  end if;
  delete from public.team t where t.id = cur.id;
  perform public.log('removed from the team', cur.name);
end $$;

create or replace function public.activity_list() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Sign in as a German Plus admin.' using errcode = '42501';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('at', a.at, 'who', a.who, 'action', a.action, 'detail', a.detail) order by a.at desc)
    from (select * from public.activity order by at desc limit 100) a), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------- grants

revoke execute on all functions in schema public from public, anon;

grant execute on function public.me(), public.my_phone(), public.phone_digits(text), public.whoami(),
  public.can_sign_in(text), public.catalog(), public.media_file(uuid), public.my_role(), public.is_admin(),
  public.is_super(), public.my_name()
  to anon, authenticated;

grant execute on function public.admin_catalog(), public.save_product(jsonb, text, timestamptz),
  public.set_product_visible(text, boolean), public.delete_product(text), public.reorder_products(text, text[]),
  public.save_category(jsonb, text), public.delete_category(text), public.reorder_categories(text[]),
  public.add_media(text, text, int, int), public.team_list(), public.save_member(jsonb, uuid),
  public.remove_member(uuid), public.activity_list()
  to authenticated;

-- ---------------------------------------------------------------- the first team

insert into public.team (name, email, phone, role, added_by) values
  ('Ishaque', 'ishaquenv@gmail.com', '919746018630', 'super', 'setup'),
  ('Nusaif', null, '917510812618', 'super', 'setup')
on conflict do nothing;

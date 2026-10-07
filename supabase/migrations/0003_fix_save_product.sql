-- Saving changes to an existing product failed with "missing FROM-clause
-- entry for table save_product": the details list was a variable named like
-- the products.spec column, and the qualified name did not resolve inside the
-- UPDATE. The variable is now v_spec. Adding new products was not affected.

create or replace function public.save_product(p jsonb, original text default null, expected timestamptz default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  cur public.products%rowtype;
  new_id text := public.slugify(coalesce(nullif(p ->> 'id', ''), p ->> 'name'));
  v_spec jsonb := coalesce(p -> 'spec', '[]'::jsonb);
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
  if jsonb_typeof(v_spec) <> 'array' or jsonb_array_length(v_spec) > 30 or exists (
       select 1 from jsonb_array_elements(v_spec) s
        where jsonb_typeof(s) <> 'array' or jsonb_array_length(s) <> 2
           or char_length(s ->> 0) > 60 or char_length(s ->> 1) > 160) then
    raise exception 'Each detail needs a label and a value.' using errcode = '22023';
  end if;
  -- Empty rows are dropped rather than refused.
  select coalesce(jsonb_agg(jsonb_build_array(btrim(s ->> 0), btrim(s ->> 1))), '[]'::jsonb) into v_spec
    from jsonb_array_elements(v_spec) s
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
            nullif(btrim(p ->> 'short'), ''), nullif(btrim(p ->> 'desc'), ''), v_spec, img,
            coalesce((p ->> 'visible')::boolean, true),
            coalesce((select max(x.sort) + 1 from public.products x where x.cat = p ->> 'cat'), 0),
            public.my_name())
    returning * into row;
    perform public.log('added', row.name);
  else
    update public.products x set
      id = new_id, name = btrim(p ->> 'name'), cat = p ->> 'cat', tag = nullif(btrim(p ->> 'tag'), ''),
      labels = nullif(btrim(p ->> 'labels'), ''), short = nullif(btrim(p ->> 'short'), ''),
      descr = nullif(btrim(p ->> 'desc'), ''), spec = v_spec, image = img,
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

-- Motivar a las empresas a publicar (14 nov 2026)
-- Reclama tu empresa · marca empleadora · seguidores en la base · fotos de la empresa

-- 1. Columnas nuevas en empresas
alter table public.empresas add column if not exists marca jsonb not null default '{}'::jsonb;
alter table public.empresas add column if not exists perfil_slug text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'empresas_marca_tam') then
    alter table public.empresas add constraint empresas_marca_tam check (length(marca::text) <= 12000);
  end if;
end $$;
create unique index if not exists empresas_perfil_slug_u on public.empresas (perfil_slug) where perfil_slug is not null;

-- perfil_slug solo lo pone la administradora (al aprobar el reclamo)
create or replace function public.proteger_verificada()
 returns trigger language plpgsql security definer set search_path to ''
as $function$
declare v_admin boolean := coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false);
begin
  if auth.uid() is null or current_setting('enlace.prueba', true) = '1' then return new; end if;
  if tg_op = 'INSERT' then
    if not v_admin then new.verificada := false; new.plan := 'gratis'; new.plan_hasta := null; new.prueba_usada := false; new.perfil_slug := null; end if;
  elsif not v_admin then
    new.verificada := old.verificada; new.plan := old.plan; new.plan_hasta := old.plan_hasta; new.prueba_usada := old.prueba_usada; new.perfil_slug := old.perfil_slug;
  end if;
  return new;
end $function$;

-- 2. Nuevo tipo de solicitud: reclamo del perfil
do $$ declare c text; begin
  select conname into c from pg_constraint where conrelid = 'public.solicitudes_empresa'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%plan_empresa%';
  if c is not null then execute format('alter table public.solicitudes_empresa drop constraint %I', c); end if;
end $$;
alter table public.solicitudes_empresa add constraint solicitudes_empresa_tipo_check check (tipo = any (array['plan_empresa','destacar','prueba','asistido','reclamo']));

-- 3. Seguidores (anónimos: un id al azar del navegador, sin datos personales)
create table if not exists public.seguidores_empresa (
  slug text not null, anon text not null, created_at timestamptz not null default now(), primary key (slug, anon)
);
alter table public.seguidores_empresa enable row level security;

create or replace function public.seguir_empresa(p_slug text, p_anon text, p_sigue boolean)
 returns integer language plpgsql security definer set search_path to 'public'
as $$
begin
  if p_slug !~ '^[a-z0-9-]{2,120}$' or p_anon !~ '^[a-z0-9]{16,40}$' then return null; end if;
  if p_sigue then
    if (select count(*) from seguidores_empresa where anon = p_anon) >= 200 then return null; end if;
    insert into seguidores_empresa (slug, anon) values (p_slug, p_anon) on conflict do nothing;
  else
    delete from seguidores_empresa where slug = p_slug and anon = p_anon;
  end if;
  return (select count(*)::int from seguidores_empresa where slug = p_slug);
end $$;

-- 4. Audiencia de una empresa: lo que Enlace ya le dio (solo cifras, nada personal)
create or replace function public.empresa_audiencia(p_slug text)
 returns json language sql stable security definer set search_path to 'public'
as $$
  with v as (
    select id from vacantes
    where estado = 'publicada' and created_at > now() - interval '30 days'
      and empresa_slug(vacante_empresa(etiquetas)) = p_slug
  )
  select json_build_object(
    'vistas', coalesce((select sum(n) from vacante_vistas vv where vv.vacante_id in (select id from v) and vv.dia >= current_date - 30), 0),
    'aplicaciones', (select count(*) from aplicaciones a where a.vacante_id in (select id from v)),
    'seguidores', (select count(*) from seguidores_empresa s where s.slug = p_slug),
    'empresa_id', (select x.id from empresas x
                   where x.verificada and not has_role(x.owner_id, 'admin'::app_role)
                     and (x.perfil_slug = p_slug or empresa_slug(x.nombre) = p_slug)
                   order by (x.perfil_slug = p_slug) desc nulls last limit 1)
  )
$$;

-- 5. Reclamar el perfil: crea una solicitud que la administradora aprueba
create or replace function public.reclamar_empresa(p_slug text)
 returns text language plpgsql security definer set search_path to 'public'
as $$
declare e empresas; n text;
begin
  if p_slug !~ '^[a-z0-9-]{2,120}$' then return 'slug'; end if;
  select * into e from empresas where owner_id = auth.uid() limit 1;
  if e.id is null then return 'sin_empresa'; end if;
  n := empresa_por_slug(p_slug);
  if n is null then return 'no_existe'; end if;
  if exists (select 1 from empresas x where x.verificada and x.id <> e.id and (x.perfil_slug = p_slug or empresa_slug(x.nombre) = p_slug)) then return 'ya_reclamada'; end if;
  if exists (select 1 from solicitudes_empresa s where s.empresa_id = e.id and s.tipo = 'reclamo' and s.estado in ('nueva', 'contactada')) then return 'pendiente'; end if;
  insert into solicitudes_empresa (empresa_id, owner_id, tipo, detalle) values (e.id, auth.uid(), 'reclamo', left(p_slug || ' · ' || n, 480));
  return 'ok';
end $$;

-- 6. Marca empleadora pública
create or replace function public.empresa_marca(p_empresa uuid)
 returns jsonb language sql stable security definer set search_path to 'public'
as $$ select e.marca from empresas e where e.id = p_empresa and not has_role(e.owner_id, 'admin'::app_role) $$;

-- 7. Fotos y logo de la empresa (carpeta = id de su empresa)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('empresas', 'empresas', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists "empresas fotos sube" on storage.objects;
drop policy if exists "empresas fotos cambia" on storage.objects;
drop policy if exists "empresas fotos borra" on storage.objects;
create policy "empresas fotos sube" on storage.objects for insert to authenticated
  with check (bucket_id = 'empresas' and (storage.foldername(name))[1] = (select e.id::text from public.empresas e where e.owner_id = public.mi_dueno() limit 1));
create policy "empresas fotos cambia" on storage.objects for update to authenticated
  using (bucket_id = 'empresas' and (storage.foldername(name))[1] = (select e.id::text from public.empresas e where e.owner_id = public.mi_dueno() limit 1));
create policy "empresas fotos borra" on storage.objects for delete to authenticated
  using (bucket_id = 'empresas' and (storage.foldername(name))[1] = (select e.id::text from public.empresas e where e.owner_id = public.mi_dueno() limit 1));

grant execute on function public.seguir_empresa(text, text, boolean), public.empresa_audiencia(text), public.empresa_marca(uuid) to anon, authenticated;
grant execute on function public.reclamar_empresa(text) to authenticated;
revoke execute on function public.reclamar_empresa(text) from anon;

notify pgrst, 'reload schema';

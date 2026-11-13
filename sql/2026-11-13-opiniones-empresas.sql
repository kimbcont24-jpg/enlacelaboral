-- Opiniones y calificaciones de empresas (13 nov 2026)
-- Dos tipos:
--   proceso  → «Su proceso de selección»: solo quien aplicó por Enlace (una vacante de esa empresa
--               en sus postulaciones guardadas en su cuenta, con correo verificado).
--   trabajo  → «Trabajar aquí»: cualquiera con correo verificado.
-- Todo pasa por la aprobación de la administradora antes de publicarse. El promedio solo se muestra
-- desde 5 opiniones publicadas. La empresa verificada con cuenta puede responder en público.
-- La tabla no se lee directo: todo va por funciones SECURITY DEFINER.

create or replace function public.empresa_slug(t text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(
    replace(regexp_replace(lower(translate(coalesce(t, ''),
      'ÁÉÍÓÚÜÑÀÈÌÒÙÂÊÎÔÛáéíóúüñàèìòùâêîôû', 'AEIOUUNAEIOUAEIOUaeiouunaeiouaeiou')), '\(.*?\)', '', 'g'), '&', ' y '),
    '[^a-z0-9]+', '-', 'g'))
$$;

-- Nombre de la empresa de una vacante (etiqueta m:empresa:…), igual que empresaDe() en el sitio.
create or replace function public.vacante_empresa(etiquetas text[])
returns text language sql immutable as $$
  select nullif(btrim(substr(e, 11)), '') from unnest(coalesce(etiquetas, '{}'::text[])) e
  where e like 'm:empresa:%' limit 1
$$;

create table if not exists public.opiniones_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_slug text not null check (empresa_slug ~ '^[a-z0-9-]{2,120}$'),
  empresa_nombre text not null,
  tipo text not null check (tipo in ('proceso', 'trabajo')),
  user_id uuid not null,
  estrellas smallint not null check (estrellas between 1 and 5),
  categorias jsonb not null default '{}'::jsonb,
  recomienda boolean,
  titulo text,
  positivo text,
  mejorar text,
  puesto text,
  relacion text check (relacion is null or relacion in ('actual', 'anterior')),
  vacante_id uuid,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'publicada', 'rechazada')),
  motivo text,
  respuesta text,
  respuesta_at timestamptz,
  revisada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, empresa_slug, tipo)
);
create index if not exists opiniones_empresa_slug_idx on public.opiniones_empresa (empresa_slug, estado);
create index if not exists opiniones_empresa_estado_idx on public.opiniones_empresa (estado, created_at);
alter table public.opiniones_empresa enable row level security;
revoke all on public.opiniones_empresa from public, anon, authenticated;
grant all on public.opiniones_empresa to service_role;

create or replace function public.opinion_texto(t text, maxlen int)
returns text language sql immutable as $$
  select nullif(left(btrim(regexp_replace(regexp_replace(coalesce(t, ''), '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g'), '\n{3,}', E'\n\n', 'g')), maxlen), '')
$$;

-- Categorías válidas por tipo.
create or replace function public.opinion_categorias(p_tipo text)
returns text[] language sql immutable as $$
  select case p_tipo
    when 'proceso' then array['respuesta', 'trato', 'claridad', 'rapidez']
    else array['pago', 'tss', 'horario', 'trato', 'crecimiento', 'ambiente'] end
$$;

-- Vacante de esa empresa a la que la persona aplicó por Enlace (según su cuenta), o null.
create or replace function public.opinion_vacante_aplicada(p_user uuid, p_slug text)
returns uuid language sql stable security definer set search_path = public as $$
  select v.id
  from candidatos c
  cross join lateral jsonb_array_elements(case when jsonb_typeof(c.postulaciones) = 'array' then c.postulaciones else '[]'::jsonb end) p
  join vacantes v on v.id::text = p->>'id'
  where c.user_id = p_user
    and public.empresa_slug(public.vacante_empresa(v.etiquetas)) = p_slug
  order by v.created_at desc
  limit 1
$$;
revoke all on function public.opinion_vacante_aplicada(uuid, text) from public, anon, authenticated;

-- Nombre de la empresa por su slug (de las vacantes o de las empresas con cuenta).
create or replace function public.empresa_por_slug(p_slug text)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select public.vacante_empresa(v.etiquetas) from vacantes v
     where public.empresa_slug(public.vacante_empresa(v.etiquetas)) = p_slug
     order by v.created_at desc limit 1),
    (select e.nombre from empresas e where public.empresa_slug(e.nombre) = p_slug limit 1))
$$;
grant execute on function public.empresa_por_slug(text) to anon, authenticated;

-- Enviar o editar mi opinión (vuelve a «pendiente» si la edito).
create or replace function public.opinar_empresa(
  p_slug text, p_tipo text, p_estrellas int, p_categorias jsonb, p_recomienda boolean,
  p_titulo text, p_positivo text, p_mejorar text, p_puesto text, p_relacion text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _nombre text;
  _vac uuid;
  _cats jsonb := '{}'::jsonb;
  _k text;
  _v int;
  _id uuid;
begin
  if _uid is null or not exists (select 1 from auth.users u where u.id = _uid and u.email_confirmed_at is not null) then
    raise exception 'Confirma tu correo para opinar.' using errcode = '42501';
  end if;
  if p_tipo not in ('proceso', 'trabajo') then raise exception 'Tipo no válido.' using errcode = '22023'; end if;
  if p_estrellas is null or p_estrellas not between 1 and 5 then raise exception 'Elige de 1 a 5 estrellas.' using errcode = '22023'; end if;
  _nombre := public.empresa_por_slug(p_slug);
  if _nombre is null then raise exception 'No encontramos esa empresa.' using errcode = '22023'; end if;
  if p_tipo = 'proceso' then
    _vac := public.opinion_vacante_aplicada(_uid, p_slug);
    if _vac is null then
      raise exception 'Para opinar del proceso de selección tienes que haber aplicado a una vacante de esta empresa desde Enlace, con tu cuenta.' using errcode = 'P0001';
    end if;
  end if;
  foreach _k in array public.opinion_categorias(p_tipo) loop
    begin
      _v := (p_categorias ->> _k)::int;
    exception when others then _v := null;
    end;
    if _v between 1 and 5 then _cats := _cats || jsonb_build_object(_k, _v); end if;
  end loop;
  if (select count(*) from opiniones_empresa where user_id = _uid and updated_at > now() - interval '1 day') >= 8 then
    raise exception 'Por hoy ya enviaste varias opiniones. Vuelve mañana.' using errcode = 'P0001';
  end if;
  if public.opinion_texto(p_positivo, 600) is null and public.opinion_texto(p_mejorar, 600) is null then
    raise exception 'Cuéntanos al menos algo bueno o algo por mejorar.' using errcode = '22023';
  end if;

  insert into opiniones_empresa as o (empresa_slug, empresa_nombre, tipo, user_id, estrellas, categorias, recomienda,
    titulo, positivo, mejorar, puesto, relacion, vacante_id)
  values (p_slug, _nombre, p_tipo, _uid, p_estrellas, _cats, p_recomienda,
    public.opinion_texto(p_titulo, 90), public.opinion_texto(p_positivo, 600), public.opinion_texto(p_mejorar, 600),
    public.opinion_texto(p_puesto, 80), case when p_tipo = 'trabajo' and p_relacion in ('actual', 'anterior') then p_relacion end, _vac)
  on conflict (user_id, empresa_slug, tipo) do update set
    estrellas = excluded.estrellas, categorias = excluded.categorias, recomienda = excluded.recomienda,
    titulo = excluded.titulo, positivo = excluded.positivo, mejorar = excluded.mejorar, puesto = excluded.puesto,
    relacion = excluded.relacion, vacante_id = excluded.vacante_id, estado = 'pendiente', motivo = null,
    revisada_at = null, updated_at = now()
  returning o.id into _id;
  return jsonb_build_object('id', _id, 'estado', 'pendiente');
end;
$$;
revoke all on function public.opinar_empresa(text, text, int, jsonb, boolean, text, text, text, text, text) from public, anon;
grant execute on function public.opinar_empresa(text, text, int, jsonb, boolean, text, text, text, text, text) to authenticated;

-- Lo que ve cualquiera: resumen por tipo (promedio desde 5) y opiniones publicadas, sin datos de quién.
create or replace function public.opiniones_empresa_publicas(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  with pub as (select * from opiniones_empresa where empresa_slug = p_slug and estado = 'publicada'),
  tipos as (select unnest(array['proceso', 'trabajo']) t)
  select jsonb_build_object(
    'slug', p_slug,
    'nombre', public.empresa_por_slug(p_slug),
    'general', (select jsonb_build_object('total', count(*), 'promedio', case when count(*) >= 5 then round(avg(estrellas)::numeric, 1) end) from pub),
    'resumen', (select jsonb_object_agg(t, (
        select jsonb_build_object(
          'total', count(*),
          'promedio', case when count(*) >= 5 then round(avg(estrellas)::numeric, 1) end,
          'recomienda', case when count(*) >= 5 and count(recomienda) > 0 then round(100.0 * count(*) filter (where recomienda) / count(recomienda)) end,
          'estrellas', case when count(*) >= 5 then jsonb_build_array(
             count(*) filter (where estrellas = 5), count(*) filter (where estrellas = 4), count(*) filter (where estrellas = 3),
             count(*) filter (where estrellas = 2), count(*) filter (where estrellas = 1)) end,
          'categorias', case when count(*) >= 5 then (
             select jsonb_object_agg(k, round(a, 1)) from (
               select k, avg((p2.categorias ->> k)::numeric) a
               from pub p2, unnest(public.opinion_categorias(t)) k
               where p2.tipo = t and p2.categorias ? k group by k having count(*) >= 3) z) end)
        from pub p where p.tipo = t)) from tipos),
    'opiniones', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', id, 'tipo', tipo, 'estrellas', estrellas, 'recomienda', recomienda, 'titulo', titulo,
        'positivo', positivo, 'mejorar', mejorar, 'puesto', puesto, 'relacion', relacion,
        'verificada', vacante_id is not null, 'fecha', to_char(created_at, 'YYYY-MM'),
        'respuesta', respuesta, 'respuesta_fecha', to_char(respuesta_at, 'YYYY-MM'))) order by created_at desc)
      from (select * from pub order by created_at desc limit 60) x), '[]'::jsonb))
$$;
grant execute on function public.opiniones_empresa_publicas(text) to anon, authenticated;

-- Resumen corto para tarjetas y listas: promedio general (desde 5 opiniones) por empresa.
create or replace function public.calificaciones_empresas(p_slugs text[])
returns table (slug text, promedio numeric, total int)
language sql stable security definer set search_path = public as $$
  select empresa_slug, round(avg(estrellas)::numeric, 1), count(*)::int
  from opiniones_empresa
  where estado = 'publicada' and empresa_slug = any ((coalesce(p_slugs, '{}'::text[]))[1:100])
  group by empresa_slug having count(*) >= 5
$$;
grant execute on function public.calificaciones_empresas(text[]) to anon, authenticated;

-- Mi situación con esta empresa: si puedo opinar del proceso y mis opiniones (para editarlas).
create or replace function public.mis_opiniones_empresa(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then jsonb_build_object('sesion', false) else jsonb_build_object(
    'sesion', true,
    'verificado', exists (select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null),
    'puede_proceso', public.opinion_vacante_aplicada(auth.uid(), p_slug) is not null,
    'mias', coalesce((select jsonb_agg(jsonb_build_object('tipo', tipo, 'estado', estado, 'motivo', motivo,
        'estrellas', estrellas, 'categorias', categorias, 'recomienda', recomienda, 'titulo', titulo,
        'positivo', positivo, 'mejorar', mejorar, 'puesto', puesto, 'relacion', relacion))
      from opiniones_empresa where user_id = auth.uid() and empresa_slug = p_slug), '[]'::jsonb)) end
$$;
grant execute on function public.mis_opiniones_empresa(text) to anon, authenticated;

-- Administración: lista y moderación.
create or replace function public.opiniones_admin(p_estado text default 'pendiente')
returns setof jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then raise exception 'Solo administración.' using errcode = '42501'; end if;
  return query
    select jsonb_build_object('id', o.id, 'empresa_slug', o.empresa_slug, 'empresa_nombre', o.empresa_nombre,
      'tipo', o.tipo, 'estrellas', o.estrellas, 'categorias', o.categorias, 'recomienda', o.recomienda,
      'titulo', o.titulo, 'positivo', o.positivo, 'mejorar', o.mejorar, 'puesto', o.puesto, 'relacion', o.relacion,
      'verificada', o.vacante_id is not null, 'estado', o.estado, 'motivo', o.motivo, 'respuesta', o.respuesta,
      'creada', o.created_at, 'editada', o.updated_at, 'correo', u.email)
    from opiniones_empresa o left join auth.users u on u.id = o.user_id
    where p_estado is null or o.estado = p_estado
    order by o.updated_at asc
    limit 300;
end;
$$;
revoke all on function public.opiniones_admin(text) from public, anon;
grant execute on function public.opiniones_admin(text) to authenticated;

create or replace function public.moderar_opinion(p_id uuid, p_accion text, p_motivo text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then raise exception 'Solo administración.' using errcode = '42501'; end if;
  if p_accion = 'borrar' then
    delete from opiniones_empresa where id = p_id;
    return;
  end if;
  if p_accion not in ('publicar', 'rechazar') then raise exception 'Acción no válida.' using errcode = '22023'; end if;
  update opiniones_empresa set estado = case p_accion when 'publicar' then 'publicada' else 'rechazada' end,
    motivo = case when p_accion = 'rechazar' then public.opinion_texto(p_motivo, 300) end, revisada_at = now()
  where id = p_id;
end;
$$;
revoke all on function public.moderar_opinion(uuid, text, text) from public, anon;
grant execute on function public.moderar_opinion(uuid, text, text) to authenticated;

-- Empresa verificada con cuenta: ver y responder las opiniones publicadas sobre ella.
create or replace function public.mi_empresa_slug()
returns text language sql stable security definer set search_path = public as $$
  select public.empresa_slug(e.nombre) from empresas e where e.owner_id = auth.uid() and e.verificada order by e.created_at limit 1
$$;
grant execute on function public.mi_empresa_slug() to authenticated;

create or replace function public.responder_opinion(p_id uuid, p_texto text)
returns void language plpgsql security definer set search_path = public as $$
declare _slug text := public.mi_empresa_slug();
begin
  if _slug is null then raise exception 'Solo una empresa verificada puede responder.' using errcode = '42501'; end if;
  update opiniones_empresa set respuesta = public.opinion_texto(p_texto, 600),
    respuesta_at = case when public.opinion_texto(p_texto, 600) is null then null else now() end
  where id = p_id and empresa_slug = _slug and estado = 'publicada';
  if not found then raise exception 'No encontramos esa opinión.' using errcode = '22023'; end if;
end;
$$;
revoke all on function public.responder_opinion(uuid, text) from public, anon;
grant execute on function public.responder_opinion(uuid, text) to authenticated;

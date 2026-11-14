-- Insignias de habilidades con pruebas propias de Enlace Laboral (14 nov 2026)
-- Reemplaza, mientras tanto, la conexión con Perfila. Mismo formato de insignia (prueba, nivel, ref)
-- para que más adelante las pruebas se puedan llevar a Perfila sin perder las insignias ganadas.
--
-- Seguridad: el banco de preguntas (con las respuestas correctas) NO está en este repositorio, que es
-- público. Vive solo en la base de datos y nunca sale hacia el navegador: la corrección se hace aquí.
-- Las tablas no se leen directo; todo va por funciones SECURITY DEFINER.

create table if not exists public.insignias_banco (
  id text primary key,
  prueba text not null check (prueba in ('servicio_cliente', 'excel_word', 'ortografia_redaccion', 'calculo_caja')),
  enunciado text not null,
  opciones jsonb not null,
  correcta smallint not null,
  activa boolean not null default true
);

create table if not exists public.insignias_intentos (
  ref uuid primary key default gen_random_uuid(),
  prueba text not null,
  nombre text not null,
  correo text not null,
  preguntas text[] not null,
  respuestas jsonb,
  salidas int not null default 0,
  inicio timestamptz not null default now(),
  limite timestamptz not null,
  fin timestamptz,
  aciertos int,
  total int,
  porcentaje numeric(5,1),
  nivel text check (nivel is null or nivel in ('destacado', 'solido')),
  alertas text[] not null default '{}',
  estado text not null default 'en_curso' check (estado in ('en_curso', 'terminada', 'vencida')),
  created_at timestamptz not null default now()
);
create index if not exists insignias_intentos_correo_idx on public.insignias_intentos (correo, prueba, created_at);
create index if not exists insignias_intentos_dia_idx on public.insignias_intentos (created_at);

alter table public.insignias_banco enable row level security;
alter table public.insignias_intentos enable row level security;
revoke all on public.insignias_banco, public.insignias_intentos from public, anon, authenticated;
grant all on public.insignias_banco, public.insignias_intentos to service_role;

-- Minutos de cada prueba (lo que se anuncia) y preguntas por intento.
create or replace function public.insignia_minutos(p text)
returns int language sql immutable as $$
  select case p when 'excel_word' then 15 when 'calculo_caja' then 10 else 12 end
$$;

-- Empieza (o retoma) una prueba. Devuelve solo la referencia.
create or replace function public.insignia_iniciar(p_prueba text, p_nombre text, p_correo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_correo text := lower(btrim(coalesce(p_correo, '')));
  v_nombre text := left(btrim(regexp_replace(coalesce(p_nombre, ''), '\s+', ' ', 'g')), 120);
  v_ref uuid;
  v_n int;
  v_proxima timestamptz;
begin
  if p_prueba not in ('servicio_cliente', 'excel_word', 'ortografia_redaccion', 'calculo_caja') then
    raise exception 'Esa prueba no existe.' using errcode = 'P0001';
  end if;
  if length(v_nombre) < 2 then raise exception 'Escribe tu nombre.' using errcode = 'P0001'; end if;
  if v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_correo) > 160 then
    raise exception 'Escribe un correo válido.' using errcode = 'P0001';
  end if;

  update public.insignias_intentos set estado = 'vencida'
   where correo = v_correo and estado = 'en_curso' and limite < now();

  -- Si ya tiene esa prueba abierta, la retoma.
  select ref into v_ref from public.insignias_intentos
   where correo = v_correo and prueba = p_prueba and estado = 'en_curso' order by inicio desc limit 1;
  if v_ref is not null then return jsonb_build_object('ref', v_ref, 'reused', true); end if;

  -- Límites: 2 intentos por prueba cada 15 días, 6 por correo al día, 400 al día en total.
  select count(*), min(created_at) + interval '15 days' into v_n, v_proxima from public.insignias_intentos
   where correo = v_correo and prueba = p_prueba and created_at > now() - interval '15 days';
  if v_n >= 2 then
    raise exception 'Ya hiciste esta prueba 2 veces en los últimos 15 días. Podrás repetirla desde el %.',
      to_char(v_proxima at time zone 'America/Santo_Domingo', 'DD/MM/YYYY') using errcode = 'P0001';
  end if;
  select count(*) into v_n from public.insignias_intentos where correo = v_correo and created_at > now() - interval '1 day';
  if v_n >= 6 then raise exception 'Ya hiciste 6 pruebas hoy. Descansa y vuelve mañana.' using errcode = 'P0001'; end if;
  select count(*) into v_n from public.insignias_intentos where created_at > now() - interval '1 day';
  if v_n >= 400 then raise exception 'Hoy hay muchas personas haciendo pruebas. Vuelve a intentarlo mañana.' using errcode = 'P0001'; end if;

  insert into public.insignias_intentos (prueba, nombre, correo, preguntas, limite)
  values (
    p_prueba, v_nombre, v_correo,
    array(select id from public.insignias_banco where prueba = p_prueba and activa order by random() limit 12),
    now() + make_interval(mins => public.insignia_minutos(p_prueba) + 10)
  ) returning ref into v_ref;
  return jsonb_build_object('ref', v_ref, 'reused', false);
end $$;

-- Preguntas de una prueba en curso, SIN la respuesta correcta.
create or replace function public.insignia_preguntas(p_ref uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare i public.insignias_intentos;
begin
  select * into i from public.insignias_intentos where ref = p_ref;
  if not found then return jsonb_build_object('estado', 'no_existe'); end if;
  if i.estado = 'en_curso' and i.limite < now() then
    update public.insignias_intentos set estado = 'vencida' where ref = p_ref;
    i.estado := 'vencida';
  end if;
  if i.estado <> 'en_curso' then return jsonb_build_object('estado', i.estado, 'prueba', i.prueba); end if;
  return jsonb_build_object(
    'estado', 'en_curso', 'prueba', i.prueba, 'nombre', split_part(i.nombre, ' ', 1),
    'minutos', public.insignia_minutos(i.prueba), 'inicio', i.inicio, 'limite', i.limite, 'ahora', now(),
    'preguntas', (select jsonb_agg(jsonb_build_object('id', b.id, 'enunciado', b.enunciado, 'opciones', b.opciones) order by x.n)
                    from unnest(i.preguntas) with ordinality x(id, n) join public.insignias_banco b on b.id = x.id)
  );
end $$;

-- Entrega y corrección. p_respuestas: {"<id pregunta>": <índice de la opción>}.
create or replace function public.insignia_entregar(p_ref uuid, p_respuestas jsonb, p_salidas int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  i public.insignias_intentos;
  v_total int; v_resp int; v_ok int; v_pct numeric; v_seg numeric;
  v_alertas text[] := '{}'; v_nivel text; v_distintas int;
begin
  select * into i from public.insignias_intentos where ref = p_ref for update;
  if not found then raise exception 'No encontramos esa prueba.' using errcode = 'P0001'; end if;
  if i.estado = 'terminada' then
    return jsonb_build_object('estado', 'terminada', 'nivel', i.nivel, 'aciertos', i.aciertos, 'total', i.total, 'alertas', i.alertas);
  end if;
  if i.estado = 'vencida' or now() > i.limite + interval '2 minutes' then
    update public.insignias_intentos set estado = 'vencida' where ref = p_ref;
    return jsonb_build_object('estado', 'vencida');
  end if;
  if jsonb_typeof(coalesce(p_respuestas, '{}'::jsonb)) <> 'object' then
    raise exception 'Respuestas inválidas.' using errcode = 'P0001';
  end if;

  v_total := coalesce(array_length(i.preguntas, 1), 0);
  select count(*) filter (where p_respuestas ? b.id),
         count(*) filter (where p_respuestas ->> b.id ~ '^\d$' and (p_respuestas ->> b.id)::int = b.correcta),
         count(distinct p_respuestas ->> b.id) filter (where p_respuestas ? b.id)
    into v_resp, v_ok, v_distintas
    from unnest(i.preguntas) x(id) join public.insignias_banco b on b.id = x.id;

  v_pct := case when v_total > 0 then round(100.0 * v_ok / v_total, 1) else 0 end;
  v_seg := extract(epoch from now() - i.inicio);

  -- Controles: una insignia solo se da si la prueba se hizo de verdad.
  if v_resp < v_total then v_alertas := array_append(v_alertas, 'incompleta'); end if;
  if v_seg < v_total * 6 then v_alertas := array_append(v_alertas, 'muy_rapida'); end if;
  if v_total >= 8 and v_distintas = 1 then v_alertas := array_append(v_alertas, 'respuestas_iguales'); end if;
  if coalesce(p_salidas, 0) >= 4 then v_alertas := array_append(v_alertas, 'salio_de_la_prueba'); end if;

  v_nivel := case when cardinality(v_alertas) > 0 then null
                  when v_pct >= 85 then 'destacado' when v_pct >= 70 then 'solido' else null end;

  update public.insignias_intentos
     set respuestas = p_respuestas, salidas = greatest(coalesce(p_salidas, 0), 0), fin = now(), aciertos = v_ok,
         total = v_total, porcentaje = v_pct, nivel = v_nivel, alertas = v_alertas, estado = 'terminada'
   where ref = p_ref;
  return jsonb_build_object('estado', 'terminada', 'nivel', v_nivel, 'aciertos', v_ok, 'total', v_total, 'alertas', v_alertas);
end $$;

-- Estado público (para la vitrina y la verificación): solo primer nombre, prueba, nivel y fecha.
create or replace function public.insignia_estado(p_refs uuid[])
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'ref', ref, 'test_key', prueba,
    'status', case when estado = 'en_curso' and limite < now() then 'expired'
                   when estado = 'en_curso' then 'in_progress' when estado = 'terminada' then 'completed' else 'expired' end,
    'level', nivel, 'first_name', split_part(nombre, ' ', 1), 'completed_at', fin)), '[]'::jsonb)
  from public.insignias_intentos where ref = any(p_refs[1:20])
$$;

revoke all on function public.insignia_iniciar(text, text, text), public.insignia_preguntas(uuid),
  public.insignia_entregar(uuid, jsonb, int), public.insignia_estado(uuid[]) from public;
grant execute on function public.insignia_iniciar(text, text, text), public.insignia_preguntas(uuid),
  public.insignia_entregar(uuid, jsonb, int), public.insignia_estado(uuid[]) to anon, authenticated;

notify pgrst, 'reload schema';

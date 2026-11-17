-- 17 nov 2026 · Correo «Su vacante ya está publicada» para las empresas que publican.
-- La tarea programada llama a /api/gracias-empresas (vía Zapier) y envía desde info@ (Zoho).
-- La clave vive solo en privado.claves (nombre = 'gracias'); NO se escribe en este repositorio (es público).

create schema if not exists privado;
create table if not exists privado.claves (nombre text primary key, valor text not null);
revoke all on privado.claves from anon, authenticated;

create table if not exists public.gracias_empresas (
  vacante_id uuid primary key references public.vacantes(id) on delete cascade,
  correo text not null,
  enviado_at timestamptz not null default now()
);
alter table public.gracias_empresas enable row level security;
revoke all on public.gracias_empresas from anon, authenticated;

create or replace function public.gracias_pendientes(p_clave text)
returns table (vacante_id uuid, titulo text, empresa text, provincia text, modalidad text, tipo text,
               salario_min int, salario_max int, aplicar text, redes boolean,
               correo text, correo_id text, contacto text, origen text)
language plpgsql security definer set search_path = public, privado as $$
begin
  if p_clave is null or not exists (select 1 from privado.claves c where c.nombre = 'gracias' and c.valor = p_clave) then
    raise exception 'clave';
  end if;
  return query
  with v as (
    select x.*,
      (select substr(t, 11) from unnest(x.etiquetas) t where t like 'm:empresa:%' limit 1) as m_empresa,
      (select substr(t, 10) from unnest(x.etiquetas) t where t like 'm:fuente:%' limit 1) as m_fuente,
      (select substr(t, 14) from unnest(x.etiquetas) t where t like 'm:fuente_url:%' limit 1) as m_url,
      (select substr(t, 11) from unnest(x.etiquetas) t where t like 'm:aplicar:%' limit 1) as m_aplicar,
      exists (select 1 from unnest(x.etiquetas) t where t = 'm:redes:si') as m_redes
    from public.vacantes x
    where x.estado = 'publicada'
      and x.created_at > now() - interval '3 days'
      and not exists (select 1 from public.gracias_empresas g where g.vacante_id = x.id)
  ),
  cand as (
    -- 1) Formulario de /empresas (y cualquier borrador con correo de contacto)
    (select distinct on (v.id) v.id, b.contacto_email::text as correo, null::text as correo_id, b.contacto_nombre::text as contacto, 'formulario'::text as origen
    from v join public.borradores b
      on b.contacto_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     and v.created_at >= b.created_at - interval '1 hour'
     and v.created_at <= b.created_at + interval '30 days'
     and ( coalesce(v.m_url, '') like '%borrador-' || b.id::text || '%'
        or ( lower(trim(coalesce(v.m_empresa, ''))) = lower(trim(coalesce(b.empresa, '')))
             and ( lower(trim(v.titulo)) = lower(trim(coalesce(b.titulo, '')))
                   or coalesce(v.m_fuente, '') = 'Publicada por la empresa' ) ) )
    order by v.id, b.created_at desc)
    union all
    -- 2) Panel de empresas (empresa propia, no la cuenta de Enlace)
    select v.id, coalesce(nullif(e.contacto_email, ''), u.email)::text, null, coalesce(e.contacto_nombre, '')::text, 'panel'
    from v join public.empresas e on e.id = v.empresa_id
    left join auth.users u on u.id = e.owner_id
    where not exists (select 1 from public.user_roles r where r.user_id = e.owner_id and r.role = 'admin')
    union all
    -- 3) Vacantes que la empresa mandó por correo a info@ (la tarea busca el remitente en Zoho)
    select v.id, null, substring(v.m_url from 'correo=([^#&]+)'), null, 'correo_info'
    from v where coalesce(v.m_url, '') ~ 'enlacelaboralrd\.com/\?correo='
  ),
  uno as (
    select distinct on (c.id) c.* from cand c order by c.id, (c.origen = 'panel') desc, (c.origen = 'formulario') desc
  )
  select v.id, v.titulo, coalesce(nullif(v.m_empresa, ''), 'su empresa'), v.provincia, v.modalidad, v.tipo,
         v.salario_min, v.salario_max, v.m_aplicar, v.m_redes,
         lower(trim(uno.correo)), uno.correo_id, nullif(trim(uno.contacto), ''), uno.origen
  from uno join v on v.id = uno.id
  where (uno.correo is not null or uno.correo_id is not null)
    and coalesce(uno.correo, '') !~* '(kimbcont24|talentosrd2026|@enlacelaboralrd\.com|neurostem|ejemplo|prueba)'
    and v.titulo !~* 'prueba|ejemplo'
  order by v.created_at
  limit 60;
end $$;

create or replace function public.gracias_marcar(p_clave text, p_ids uuid[], p_correo text)
returns int language plpgsql security definer set search_path = public, privado as $$
declare n int;
begin
  if p_clave is null or not exists (select 1 from privado.claves c where c.nombre = 'gracias' and c.valor = p_clave) then
    raise exception 'clave';
  end if;
  insert into public.gracias_empresas (vacante_id, correo)
  select i, coalesce(nullif(p_correo, ''), '?') from unnest(p_ids) i
  where exists (select 1 from public.vacantes v where v.id = i)
  on conflict (vacante_id) do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.gracias_pendientes(text) from public;
revoke all on function public.gracias_marcar(text, uuid[], text) from public;
grant execute on function public.gracias_pendientes(text) to anon, authenticated;
grant execute on function public.gracias_marcar(text, uuid[], text) to anon, authenticated;

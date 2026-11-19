-- 19 nov 2026 · Alertas del Estado + envío de alertas de empleo desde info@ (Zoho, vía tarea programada).
-- Las alertas no salían desde el 18 oct (el flujo de n8n dejó de correr). Ahora la tarea programada
-- llama a /api/alertas-envio, que usa estas funciones. La clave vive solo en privado.claves (nombre = 'alertas');
-- NO se escribe en este repositorio (es público).

-- Grupos listos para enviar (un correo por persona, con asunto y HTML ya armados por privado.alertas_para_enviar).
create or replace function public.alertas_envio(p_clave text, p_max int default 1)
returns table (email text, alerta_ids uuid[], asunto text, html text, total int)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_clave is null or not exists (select 1 from privado.claves c where c.nombre = 'alertas' and c.valor = p_clave) then
    raise exception 'clave';
  end if;
  -- Primero quienes siguen el sector público (son las plazas con plazo más corto).
  return query
    select a.email, a.alerta_ids, a.asunto, a.html, a.total
    from privado.alertas_para_enviar(500) a
    order by exists (select 1 from public.alertas x where x.id = any(a.alerta_ids) and x.coleccion = 'sector-publico') desc, a.email
    limit greatest(least(p_max, 15), 1);
end $$;

create or replace function public.alertas_envio_marcar(p_clave text, p_ids uuid[])
returns int language plpgsql security definer set search_path = '' as $$
begin
  if p_clave is null or not exists (select 1 from privado.claves c where c.nombre = 'alertas' and c.valor = p_clave) then
    raise exception 'clave';
  end if;
  return privado.alertas_marcar(p_ids);
end $$;

-- Cuántas personas siguen las plazas del Estado (prueba social en la página; solo un número).
create or replace function public.total_alertas_estado()
returns int language sql stable security definer set search_path = '' as $$
  select count(distinct lower(email))::int from public.alertas where activa and coleccion = 'sector-publico';
$$;

revoke all on function public.alertas_envio(text, int) from public;
revoke all on function public.alertas_envio_marcar(text, uuid[]) from public;
grant execute on function public.alertas_envio(text, int) to anon, authenticated;
grant execute on function public.alertas_envio_marcar(text, uuid[]) to anon, authenticated;
grant execute on function public.total_alertas_estado() to anon, authenticated;
-- insert into privado.claves (nombre, valor) values ('alertas', '<clave>');  -- se hizo aparte

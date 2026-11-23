-- 23 nov 2026 · Aplicado en la base del sitio (Lovable Cloud).
-- Una vacante cargada por robot o por la admin no puede decir «Sin experiencia»
-- si el texto pide experiencia con tiempo («mínimo 6 meses», «2 años de experiencia»).
-- No cuenta «menos de 1 año», «hasta 1 año» ni «0-6 meses».

CREATE OR REPLACE FUNCTION privado.pide_experiencia(t text) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO '' AS $f$
  select coalesce(t,'') ~* '(experiencia[^.;|]{0,30}\d+\s*(\+\s*)?(mes|año|ano)|\d+\s*(\+\s*)?(mes(es)?|años?|anos?)[^.;|]{0,20}experiencia)'
     and coalesce(t,'') !~* '(menos de|hasta|0\s*(-|a)\s*)\s*\d*\s*(mes|año|ano)';
$f$;

CREATE OR REPLACE FUNCTION privado.experiencia_honesta()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare t text;
begin
  if new.experiencia = 'Sin experiencia'
     and (new.owner_id is null or public.has_role(new.owner_id, 'admin'::public.app_role))
     and not 'incl:primer-empleo' = any(coalesce(new.etiquetas, '{}')) then
    t := coalesce(new.titulo,'')||' '||coalesce(new.descripcion,'')||' | '||coalesce(array_to_string(new.requisitos,' | '),'');
    if privado.pide_experiencia(t)
       or t !~* '(sin experiencia|no (se )?(requiere|necesita|exige|es necesaria|es indispensable)[^.]{0,25}experiencia|experiencia no (es )?(necesaria|requerida|indispensable)|primer empleo|pasant|reci[eé]n graduad|estudiante)'
    then new.experiencia := 'No indica';
    end if;
  end if;
  return new;
end $function$;

-- Corrección de las publicadas que se contradecían (8 + la de Laboratorio Referencia).
update vacantes set experiencia = 'No indica'
where estado = 'publicada' and experiencia = 'Sin experiencia'
  and privado.pide_experiencia(coalesce(titulo,'')||' '||coalesce(descripcion,'')||' | '||coalesce(array_to_string(requisitos,' | '),''));

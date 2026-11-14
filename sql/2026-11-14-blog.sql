-- Blog «Entre líneas» (14 nov 2026)
-- Tabla de artículos, permisos, carpeta de imágenes y 3 artículos iniciales.

create table if not exists public.blog_articulos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 90),
  titulo text not null check (length(titulo) between 3 and 200),
  bajada text not null default '',
  contenido text not null default '',
  categoria text not null default 'reclutamiento' check (categoria in ('reclutamiento','mente','carrera','derechos','empresas','ia')),
  etiquetas text[] not null default '{}',
  portada text,
  autor text not null default 'Kimberly Contreras',
  autor_cargo text not null default '',
  estado text not null default 'borrador' check (estado in ('borrador','publicado')),
  destacado boolean not null default false,
  publicado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_articulos_publicados on public.blog_articulos (estado, publicado_at desc);

create or replace function public.blog_tocar() returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if new.estado = 'publicado' and new.publicado_at is null then new.publicado_at := now(); end if;
  return new;
end $$;
drop trigger if exists blog_tocar on public.blog_articulos;
create trigger blog_tocar before insert or update on public.blog_articulos for each row execute function public.blog_tocar();

alter table public.blog_articulos enable row level security;
drop policy if exists "blog lectura publica" on public.blog_articulos;
-- Visitantes: solo lo publicado. La administradora ve también los borradores por la regla «blog admin escribe».
create policy "blog lectura publica" on public.blog_articulos for select to anon, authenticated using (estado = 'publicado');
drop policy if exists "blog admin escribe" on public.blog_articulos;
create policy "blog admin escribe" on public.blog_articulos for all to authenticated using (public.has_role(auth.uid(), 'admin'::app_role)) with check (public.has_role(auth.uid(), 'admin'::app_role));
grant select on public.blog_articulos to anon, authenticated;
grant insert, update, delete on public.blog_articulos to authenticated;

-- Imágenes del blog (portadas y fotos dentro de los artículos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog', 'blog', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "blog imagenes lectura" on storage.objects;
create policy "blog imagenes lectura" on storage.objects for select to anon, authenticated using (bucket_id = 'blog');
drop policy if exists "blog imagenes admin sube" on storage.objects;
create policy "blog imagenes admin sube" on storage.objects for insert to authenticated with check (bucket_id = 'blog' and public.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "blog imagenes admin cambia" on storage.objects;
create policy "blog imagenes admin cambia" on storage.objects for update to authenticated using (bucket_id = 'blog' and public.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "blog imagenes admin borra" on storage.objects;
create policy "blog imagenes admin borra" on storage.objects for delete to authenticated using (bucket_id = 'blog' and public.has_role(auth.uid(), 'admin'::app_role));

-- Artículos iniciales (firmados por el equipo; se pueden editar, firmar o despublicar desde Admin → Blog)
insert into public.blog_articulos (slug, titulo, bajada, categoria, etiquetas, autor, autor_cargo, estado, destacado, publicado_at, contenido) values
('que-pasa-con-tu-cv-despues-de-aplicar',
 'Qué pasa con tu CV después de darle a «aplicar»',
 'Del otro lado hay una persona con varias vacantes abiertas, un plazo encima y un gerente preguntando por candidatos. Entender eso no acorta la espera, pero la hace menos personal.',
 'reclutamiento', '{cv,aplicar,reclutamiento}', 'Equipo Enlace Laboral', 'Desde Gestión Humana', 'publicado', true, now() - interval '2 hours',
$t$Cuando alguien aplica a una vacante se imagina a una persona leyendo su CV con calma, de principio a fin. Quienes trabajamos en reclutamiento sabemos que casi nunca es así, y no es que a nadie le importe. El proceso tiene un ritmo que quien aplica no ve.

## La primera lectura es rápida

En reclutamiento puedes tener que cubrir varias vacantes a la vez, coordinar entrevistas, dar seguimiento a los nuevos ingresos y contestarle a un gerente que necesitaba a alguien desde la semana pasada. Con ese día por delante, la primera revisión de un CV dura poco. Lo que se busca en esa pasada es saber si la persona cumple lo indispensable del puesto: la experiencia, la zona donde vive, la disponibilidad de horario y, cuando aplica, la formación técnica o la licencia.

Si eso no se ve de entrada, el CV queda para «después». Y cuando llegan muchas aplicaciones, ese después a veces no llega.

!> Arriba de todo, pon el puesto al que aplicas y los datos que la vacante pide como indispensables. Si piden licencia de conducir o disponibilidad para rotar turnos, que se vea en la primera mitad de la hoja.

## Por qué muchas veces no te responden

Hay razones que nadie le cuenta al candidato. La vacante se pausó porque cambió el presupuesto. Apareció un candidato interno. El gerente cambió el perfil después de las primeras entrevistas. O la empresa publicó para ir armando un banco de candidatos y todavía no tiene la posición aprobada.

También pasa que muchas empresas en el país todavía manejan sus procesos por correo y WhatsApp, sin un sistema que avise a cada persona en qué quedó su aplicación. Responderle uno por uno a todos es trabajo que, en la práctica, se queda sin hacer.

?> Cuando no hay respuesta, la mente llena ese vacío con la explicación que más duele: «no sirvo», «se fijaron en mi edad». A veces la discriminación existe, y por eso en Enlace Laboral no publicamos vacantes que pidan edad, sexo o foto. Pero la mayoría de las veces el silencio habla del proceso de la empresa y no de ti. Leerlo como un juicio personal desgasta mucho y no te da ninguna información útil.

## Lo que sí está en tus manos

No controlas el ritmo de la empresa, pero hay cosas que aumentan bastante la probabilidad de que te llamen:

- Adapta el CV al tipo de puesto, no a cada vacante. Tener una versión para servicio al cliente y otra para almacén ya cambia mucho, y no te agota.
- Aplica en los primeros días. Las vacantes viejas suelen tener la terna casi lista.
- Pon un teléfono que contestes y un correo que revises. Parece obvio, y es de las razones más comunes por las que se pierde un buen candidato.
- Da seguimiento una sola vez, una semana después, con un mensaje corto y amable. Más de eso juega en contra.

> Un CV no tiene que contar toda tu vida. Tiene que hacerle fácil a otra persona decir «a esta la llamo».

Si quieres revisar el tuyo, el [creador de CV de Enlace](/cv) te guía por partes y es gratis. Y si llevas semanas aplicando sin que te llamen, antes de cambiar el CV completo revisa a qué estás aplicando. Muchas veces el problema está en el ajuste al puesto.$t$),

('la-espera-despues-de-una-entrevista',
 'La espera después de una entrevista: qué hacer mientras no llaman',
 'Revisar el teléfono cada diez minutos, repasar cada respuesta, imaginar lo peor. Es normal, y también se puede manejar mejor.',
 'mente', '{entrevista,ansiedad,rechazo}', 'Equipo Enlace Laboral', 'Desde Gestión Humana', 'publicado', false, now() - interval '1 day',
$t$Saliste de la entrevista sintiendo que te fue bien. Al otro día ya no lo ves tan claro, y para el tercero piensas que dijiste algo que lo dañó todo. Si te ha pasado, le pasa a casi todo el mundo, y tiene explicación.

## Por qué la espera se siente tan pesada

Buscar trabajo junta varias cosas que al cerebro le cuestan: incertidumbre, falta de control y algo importante en juego, que muchas veces es la renta, la comida o la estabilidad de la familia. Cuando no hay información, la mente trata de producirla sola, y lo hace repasando la entrevista una y otra vez. En psicología a eso se le llama rumiación. Se siente como estar resolviendo algo, pero no resuelve nada y cansa muchísimo.

?> La rumiación promete control: «si entiendo qué hice mal, me voy a sentir mejor». El problema es que en la espera no hay datos nuevos, así que el repaso da vueltas sobre lo mismo. Ponerle nombre ayuda. Cuando te sorprendas repasando la entrevista por quinta vez, dite «estoy rumiando» y cambia de actividad. Suena simple, y funciona más de lo que parece.

## Un plan para la espera

Lo que más baja la ansiedad es recuperar un poco de control sobre lo que sí depende de ti. Algunas cosas que recomendamos:

1. Al terminar la entrevista, pregunta cuándo esperan tomar una decisión. Con esa fecha ya no estás esperando «para siempre».
2. Anota esa fecha y un día después pon un recordatorio para dar seguimiento con un mensaje corto. Hasta ese día, no hay nada que hacer con esa vacante.
3. Sigue aplicando a otras. Tener varios procesos abiertos baja muchísimo la presión que le pones a uno solo.
4. Escribe, mientras está fresco, qué te preguntaron y qué te gustaría haber respondido distinto. Sirve para la próxima y te saca la entrevista de la cabeza.
5. Decide a qué horas vas a revisar el correo y el WhatsApp. Revisar cada diez minutos mantiene la alarma encendida todo el día.

!> Un mensaje de seguimiento que funciona: «Buenas tardes, le saluda [tu nombre]. Gracias otra vez por la entrevista del martes para el puesto de [puesto]. Quedo a la espera de cualquier novedad sobre el proceso.» Corto, amable y sin presionar.

## Si la respuesta es no

Un «no» duele, y más cuando ya te habías visto en el puesto. Date permiso de sentirlo un rato. Lo que conviene cuidar es la historia que te cuentas después. «No me escogieron para esta posición» es un hecho. «Nunca voy a conseguir nada» es una conclusión que ese hecho no sostiene.

Las empresas escogen por muchas razones que no tienen que ver con tu valor como persona: otro candidato tenía una experiencia más parecida, alguien vivía más cerca, el gerente cambió de idea. Si puedes, pide retroalimentación. No siempre la dan, pero cuando la dan vale oro.

> Tu valor no se decide en una entrevista de cuarenta minutos.

Si la búsqueda ya lleva meses y sientes que te está afectando el sueño, el apetito o las ganas de hacer cosas, hablarlo con alguien de confianza o con un profesional de la salud mental no es exagerar. Buscar empleo es de las experiencias más estresantes de la vida laboral, y pedir apoyo es parte de cuidarte mientras sigues.$t$),

('regalia-pascual-quien-la-cobra-cuanto-y-hasta-cuando',
 'Regalía pascual: quién la cobra, cuánto y hasta cuándo',
 'El salario de Navidad es un derecho de todo trabajador del sector privado en RD, aunque haya salido de la empresa antes de diciembre. Aquí lo explicamos sin rodeos.',
 'derechos', '{regalia,codigo de trabajo,salario}', 'Equipo Enlace Laboral', 'Desde Gestión Humana', 'publicado', false, now() - interval '3 days',
$t$La regalía pascual, que el Código de Trabajo llama salario de Navidad, es un pago que el empleador está obligado a hacer cada año a sus trabajadores. Lo regulan los artículos 219 al 222 del Código de Trabajo de la República Dominicana. Este artículo habla del sector privado; el sector público se rige por otras normas.

## Cuánto te toca

La regla es sencilla. Te corresponde la doceava parte del salario ordinario que ganaste durante el año calendario. Si ganaste lo mismo todo el año, equivale a un mes de salario.

Salario ordinario quiere decir lo que te pagan de forma fija por tu trabajo. Las horas extras y la bonificación por beneficios de la empresa no entran en el cálculo.

!> Si entraste a trabajar a mitad de año, te toca la parte proporcional al tiempo trabajado. Por ejemplo, si ganas RD$30,000 al mes y empezaste en julio, en diciembre te corresponde aproximadamente la mitad de un salario. Para tu caso exacto, usa la [calculadora de regalía pascual](/herramientas/regalia-pascual).

La ley también pone un tope. Lo que la empresa está obligada a pagar llega hasta cinco salarios mínimos legalmente establecidos, así que el límite solo se nota en salarios altos.

## Hasta cuándo te la tienen que pagar

El empleador debe pagarla a más tardar el 20 de diciembre. Muchas empresas la pagan antes, en la primera quincena del mes.

## Si saliste de la empresa

Aquí es donde más dudas hay. Si dejaste de trabajar antes de diciembre, por la razón que sea, tienes derecho a la parte proporcional de la regalía por el tiempo que trabajaste ese año. No importa si renunciaste, si te desahuciaron o si terminó tu contrato. Ese pago forma parte de lo que la empresa te debe al salir.

?> Mucha gente no reclama lo que le corresponde por miedo a «quedar mal» o a que le pongan mala referencia. Es una reacción entendible, sobre todo en un mercado donde las recomendaciones pesan. Conocer bien tus derechos te permite pedirlos con calma y con argumentos, que es muy distinto a pelear.

## Descuentos

La regalía pascual no está sujeta al impuesto sobre la renta ni a los descuentos de la TSS. Lo que te calculen debería llegarte completo.

## Si no te la pagan

Primero conversa con Gestión Humana de la empresa; a veces se trata de un error de nómina. Si no se resuelve, puedes acudir al Ministerio de Trabajo, que ofrece orientación gratis a los trabajadores.

> Pedir lo que la ley te da es parte de una relación laboral sana.

Este artículo es informativo y no sustituye la asesoría de un abogado laboral. Si tu caso tiene detalles particulares, como comisiones, salarios variables o una salida en conflicto, vale la pena consultarlo con el Ministerio de Trabajo.$t$)
on conflict (slug) do nothing;

notify pgrst, 'reload schema';

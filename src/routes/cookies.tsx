import { createFileRoute, Link } from "@tanstack/react-router";
import { HardDrive, Megaphone, MousePointerClick } from "lucide-react";

import { Bloque, LEGAL_ACTUALIZADO, PaginaLegal } from "@/components/site/Legal";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ title: "Política de cookies | Enlace Laboral" }, { name: "description", content: "Enlace Laboral no usa cookies de publicidad ni de rastreo. Te explicamos qué guarda tu navegador y cómo borrarlo." }] }),
  component: Cookies,
});

const USOS: [string, string][] = [
  ["Tu CV y tus versiones", "Para que no pierdas tu CV aunque no tengas cuenta. Se queda en tu teléfono."],
  ["Vacantes guardadas y aplicaciones", "Para mostrarte qué guardaste y a qué aplicaste."],
  ["Tu sesión", "Si entras con tu cuenta (candidato o empresa), para que no tengas que entrar cada vez."],
  ["Accesibilidad", "Si cambiaste el tamaño de letra, el contraste u otra opción, para recordarlo."],
  ["Jornadas y avisos", "Para recordar a qué jornadas te apuntaste y no repetir avisos."],
];

function Cookies() {
  return (
    <PaginaLegal actual="/cookies" etiqueta="Sin rastreo" titulo="Política de cookies" intro={<p>Actualizada el {LEGAL_ACTUALIZADO}. Por qué no te mostramos el aviso de «Aceptar cookies».</p>}
      resumen={[
        { I: Megaphone, t: "Sin publicidad", d: "No hay cookies de anuncios ni te seguimos por otras páginas." },
        { I: HardDrive, t: "Solo lo necesario", d: "Tu CV, tus guardadas y tu sesión se quedan en tu teléfono." },
        { I: MousePointerClick, t: "Tú decides", d: "Puedes borrarlo cuando quieras desde tu navegador." },
      ]}
      indice={[["corto", "En corto"], ["que", "Qué guarda tu navegador"], ["terceros", "Servicios de otros"], ["borrar", "Cómo borrarlo"]]}>
      <Bloque id="corto" titulo="En corto">
        <p><strong>No usamos cookies de publicidad ni de rastreo.</strong> No vendemos tu información ni te seguimos por otras páginas. Por eso no te mostramos un aviso para aceptar cookies.</p>
        <p>Las «cookies» son pequeños datos que una página guarda en tu navegador. Nosotros solo guardamos lo necesario para que la página funcione y recuerde lo que hiciste.</p>
      </Bloque>
      <Bloque id="que" titulo="Qué guarda tu navegador">
        <p>Usamos el almacenamiento del navegador para:</p>
        <ul className="space-y-2">{USOS.map(([t, d]) => <li key={t} className="rounded-xl border border-border bg-surface p-3"><strong>{t}.</strong> <span className="text-muted-foreground">{d}</span></li>)}</ul>
        <p>Todo esto se queda en tu equipo. No se envía a nadie, salvo cuando tú aplicas a una vacante o guardas tu CV en tu cuenta (ver <Link to="/privacidad" className="font-semibold text-primary underline">privacidad</Link>).</p>
      </Bloque>
      <Bloque id="terceros" titulo="Servicios de otros">
        <p>La página está alojada en un proveedor de nube y usa una base de datos externa. Como cualquier servidor, pueden registrar datos técnicos (por ejemplo, la dirección de internet desde donde entras) por seguridad y para que la página funcione. No los usamos para publicidad.</p>
        <p>Si tocas un botón para compartir por WhatsApp, abrir un mapa o ir a otra página, esa página tiene sus propias reglas de cookies.</p>
      </Bloque>
      <Bloque id="borrar" titulo="Cómo borrarlo">
        <p>Puedes borrar estos datos cuando quieras desde la configuración de tu navegador («Borrar datos de navegación» o «Datos de sitios»). Ten en cuenta que, si no tienes cuenta, también se borrarán tu CV y tus vacantes guardadas en ese teléfono.</p>
        <p>Si guardas tu CV en tu cuenta, lo recuperas al volver a entrar con tu correo.</p>
      </Bloque>
    </PaginaLegal>
  );
}

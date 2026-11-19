import type { CV } from "@/lib/cv";
import type { Vacante } from "@/lib/vacantes";
import { enlaceAplicar } from "@/lib/vacantes";

const sinEmpresa = (e: string) => !e || /no indicada/i.test(e);

/** Por dónde se aplica a una vacante, en una palabra. */
export function viaAplicar(job: Pick<Vacante, "aplicar">): { clave: "whatsapp" | "correo" | "sitio" | "formulario" | "instrucciones"; texto: string } {
  const e = enlaceAplicar(job.aplicar);
  if (!job.aplicar.trim()) return { clave: "formulario", texto: "Aplicas aquí mismo" };
  if (!e) return { clave: "instrucciones", texto: "Ver cómo aplicar" };
  if (e.href.startsWith("https://wa.me/")) return { clave: "whatsapp", texto: "Por WhatsApp" };
  if (e.href.startsWith("mailto:")) return { clave: "correo", texto: "Aplicas aquí mismo" };
  return { clave: "sitio", texto: "En el sitio de la empresa" };
}

/** Mensaje listo para enviar a la empresa. Solo usa lo que la persona tiene en su CV. */
export function mensajeAplicacion(job: Pick<Vacante, "titulo" | "empresa">, nombre: string, cv: CV | null): string {
  const donde = sinEmpresa(job.empresa) ? "" : ` en ${job.empresa}`;
  const partes = [`Hola, buen día. Me interesa la vacante de ${job.titulo}${donde} que vi en Enlace Laboral.`];
  const quien = [nombre.trim() ? `Soy ${nombre.trim()}` : "", cv?.ciudad ? `vivo en ${cv.ciudad}` : ""].filter(Boolean).join(" y ");
  if (quien) partes.push(`${quien}.`);
  const exp = cv?.experiencia.find((x) => x.puesto.trim());
  if (exp) partes.push(`Mi última experiencia fue como ${exp.puesto}${exp.empresa.trim() ? ` en ${exp.empresa}` : ""}.`);
  if (cv?.habilidades.trim()) partes.push(`Sé hacer: ${cv.habilidades.trim().split(/\n|,/).map((s) => s.trim()).filter(Boolean).slice(0, 4).join(", ")}.`);
  partes.push("Tengo mi CV disponible y puedo presentarme cuando me digan. Quedo atento(a). Gracias.");
  return partes.join(" ");
}

export function mensajeSeguimiento(p: { titulo: string; empresa: string }, nombre: string): string {
  const donde = sinEmpresa(p.empresa) ? "" : ` en ${p.empresa}`;
  return `Hola, buen día. Le escribo para dar seguimiento a mi aplicación a la vacante de ${p.titulo}${donde}.${nombre.trim() ? ` Soy ${nombre.trim()}.` : ""} Quería saber si todavía está disponible o si necesitan algún dato adicional de mi parte. Gracias por su tiempo.`;
}

/** Enlace de contacto con el mensaje ya escrito (WhatsApp o correo). Para enlaces web devuelve el mismo enlace. */
export function enlaceConMensaje(job: Pick<Vacante, "aplicar" | "titulo">, mensaje: string, asunto?: string): { href: string; label: string } | null {
  const e = enlaceAplicar(job.aplicar);
  if (!e) return null;
  if (e.href.startsWith("https://wa.me/")) return { href: `${e.href}?text=${encodeURIComponent(mensaje)}`, label: "Enviar por WhatsApp" };
  if (e.href.startsWith("mailto:")) return { href: `${e.href}?subject=${encodeURIComponent(asunto ?? `Postulación: ${job.titulo}`)}&body=${encodeURIComponent(mensaje)}`, label: "Enviar por correo" };
  return e;
}

// ---------- Correo de postulación (para escribirle a la empresa) ----------

const limpio = (t: string) => t.replace(/\s+/g, " ").trim();
const sinPunto = (t: string) => limpio(t).replace(/[.;:,\s]+$/, "");
const primeraMinuscula = (t: string) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);
const lista = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);
/** Recorta en la última oración completa que quepa. */
const recortar = (t: string, max: number) => {
  const s = limpio(t);
  if (s.length <= max) return s;
  const corte = s.slice(0, max);
  const punto = corte.lastIndexOf(". ");
  return punto > max * 0.5 ? corte.slice(0, punto + 1) : `${corte.replace(/\s+\S*$/, "")}…`;
};

/** Arregla nombres pegados («MaríaNathalyCrecencio» → «María Nathaly Crecencio») y espacios. */
const arreglarNombre = (t: string) => limpio(t.replace(/[\[\]]/g, "").replace(/([a-záéíóúñü])([A-ZÁÉÍÓÚÑÜ])/g, "$1 $2"));
/** Nombre corto para el asunto: con 4 palabras (dos nombres y dos apellidos) toma nombre + primer apellido. */
const nombreCorto = (n: string) => {
  const w = n.split(" ").filter(Boolean);
  return w.length >= 4 ? `${w[0]} ${w[2]}` : n;
};
/** Número estable a partir de un texto: la misma persona y vacante siempre reciben la misma versión. */
const semilla = (t: string) => [...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const elegir = <T,>(xs: T[], n: number) => xs[n % xs.length];
/** Saludo según la hora de República Dominicana. */
function saludoHora(): string {
  let h = 9;
  try { h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Santo_Domingo" }).format(new Date())); } catch { /* sin Intl */ }
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}
/** Pasa a minúscula la primera letra solo si es una palabra común (no «Excel», «Word», «SAP»…). */
const PROPIOS = /^(excel|word|office|outlook|powerpoint|power|sap|canva|photoshop|illustrator|autocad|quickbooks|google|windows|linux|python|java|salesforce|odoo|inglés|ingles|francés|frances|español)$/i;
const minusculaComun = (t: string) => {
  const w = t.split(" ")[0];
  return /^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+$/.test(w) && !PROPIOS.test(w) ? primeraMinuscula(t) : t;
};
const esTelefono = (t: string) => /^[+\d][\d\s().-]{6,}$/.test(t.trim());
const esCorreo = (t: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.trim());

/**
 * Correo de postulación, corto y en voz de la persona (no de plantilla).
 * Psicología del reclutador: lo lee en segundos, así que va al grano, con un dato concreto
 * (puesto y empresa reales, un logro) en vez de adjetivos («responsable», «proactivo»).
 * Usa solo lo que la persona escribió en su CV; si no tiene CV, deja una línea entre corchetes
 * para que escriba su experiencia con sus propias palabras.
 * Tiene varias versiones para que una empresa no reciba diez correos idénticos desde Enlace.
 */
export function correoAplicacion(
  job: Pick<Vacante, "titulo" | "empresa"> & { id?: string },
  cv: CV | null,
  opciones: { asuntoPedido?: string; nombre?: string; contacto?: string } = {},
): { asunto: string; cuerpo: string } {
  const nombre = arreglarNombre(cv?.nombre || opciones.nombre || "");
  const empresa = sinEmpresa(job.empresa) ? "" : limpio(job.empresa);
  const puesto = sinPunto(job.titulo);
  const n = semilla(`${job.id ?? puesto}|${nombre}`);

  // Asunto: si la empresa pidió uno, se respeta (suelen filtrar por él).
  const base = opciones.asuntoPedido ? sinPunto(opciones.asuntoPedido) : `CV para vacante de ${puesto}`;
  const asunto = nombre ? `${base} – ${nombreCorto(nombre)}` : base;

  // Formato decidido por Kim (19 nov 2026): corto, directo, sin adornos.
  const contacto = limpio(opciones.contacto ?? "");
  const telefono = limpio(cv?.telefono || (esTelefono(contacto) ? contacto : ""));
  const cuerpo = [
    `${saludoHora()}${empresa ? `, equipo de ${empresa}` : ""}:`,
    "",
    `Por medio de la presente, envío mi CV para aplicar al puesto de ${puesto} que he visto en EnlaceLaboralRD. Espero que puedan revisar mi perfil; quedo pendiente a su respuesta.`,
    "",
    "Gracias de antemano por revisar mi CV.",
    "Saludos,",
    nombre || "[Tu nombre completo]",
    telefono ? `Tel./WhatsApp: ${telefono}` : "",
  ].filter((l, i, xs) => l !== "" || (i > 0 && xs[i - 1] !== "")).join("\n").trimEnd();
  return { asunto, cuerpo };
}

const lineasLogrosSimple = (t: string) => (t ?? "").split(/\n+/).map((l) => l.replace(/^\s*[-•*▪●]\s*/, "").trim()).filter(Boolean);

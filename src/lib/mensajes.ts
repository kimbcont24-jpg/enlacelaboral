import type { CV } from "@/lib/cv";
import type { Vacante } from "@/lib/vacantes";
import { enlaceAplicar } from "@/lib/vacantes";

const sinEmpresa = (e: string) => !e || /no indicada/i.test(e);

/** Por dónde se aplica a una vacante, en una palabra. */
export function viaAplicar(job: Pick<Vacante, "aplicar">): { clave: "whatsapp" | "correo" | "sitio" | "formulario" | "instrucciones"; texto: string } {
  const e = enlaceAplicar(job.aplicar);
  if (!job.aplicar.trim()) return { clave: "formulario", texto: "Formulario aquí" };
  if (!e) return { clave: "instrucciones", texto: "Ver cómo aplicar" };
  if (e.href.startsWith("https://wa.me/")) return { clave: "whatsapp", texto: "Por WhatsApp" };
  if (e.href.startsWith("mailto:")) return { clave: "correo", texto: "Por correo" };
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
export function enlaceConMensaje(job: Pick<Vacante, "aplicar" | "titulo">, mensaje: string): { href: string; label: string } | null {
  const e = enlaceAplicar(job.aplicar);
  if (!e) return null;
  if (e.href.startsWith("https://wa.me/")) return { href: `${e.href}?text=${encodeURIComponent(mensaje)}`, label: "Enviar por WhatsApp" };
  if (e.href.startsWith("mailto:")) return { href: `${e.href}?subject=${encodeURIComponent(`Vacante: ${job.titulo}`)}&body=${encodeURIComponent(mensaje)}`, label: "Enviar por correo" };
  return e;
}

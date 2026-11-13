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

/**
 * Correo formal de postulación, listo para enviar. Usa solo lo que la persona escribió en su CV;
 * si no tiene CV, deja marcados entre corchetes los datos que debe completar.
 */
export function correoAplicacion(
  job: Pick<Vacante, "titulo" | "empresa"> & { id?: string },
  cv: CV | null,
  opciones: { asuntoPedido?: string; nombre?: string } = {},
): { asunto: string; cuerpo: string } {
  const nombre = limpio(cv?.nombre || opciones.nombre || "");
  const empresa = sinEmpresa(job.empresa) ? "" : limpio(job.empresa);
  const puesto = sinPunto(job.titulo);

  const base = opciones.asuntoPedido ? sinPunto(opciones.asuntoPedido) : `Postulación: ${puesto}`;
  const asunto = nombre ? `${base} – ${nombre}` : base;

  const p: string[] = [];
  p.push(empresa ? `Estimado equipo de Gestión Humana de ${empresa}:` : "Estimado equipo de Gestión Humana:");
  p.push(`Reciban un cordial saludo. Me dirijo a ustedes para presentar mi candidatura a la posición de ${puesto}${empresa ? ` en ${empresa}` : ""}, publicada en Enlace Laboral.`);

  // Perfil: resumen propio o, si no hay, el puesto que la persona busca.
  const intro: string[] = [];
  if (cv?.resumen.trim()) intro.push(recortar(cv.resumen, 420));
  else if (cv?.puesto.trim()) intro.push(`Me desempeño como ${primeraMinuscula(sinPunto(cv.puesto))} y me interesa aportar mi experiencia y compromiso a su equipo.`);
  if (intro.length) p.push(intro.join(" "));
  const perfil: string[] = [];

  const exp = cv?.experiencia.find((x) => x.puesto.trim());
  if (exp) {
    const logro = lineasLogrosSimple(exp.logros)[0];
    const actual = !exp.hasta.trim() || /actual|presente/i.test(exp.hasta);
    perfil.push(`${actual ? "Actualmente me desempeño" : "En mi experiencia más reciente me desempeñé"} como ${sinPunto(exp.puesto)}${exp.empresa.trim() ? ` en ${sinPunto(exp.empresa)}` : ""}${logro ? `, donde ${primeraMinuscula(sinPunto(logro))}` : ""}.`);
  }
  const edu = cv?.educacion.find((x) => x.titulo.trim());
  if (edu) perfil.push(`Mi formación: ${sinPunto(edu.titulo)}${edu.centro.trim() ? `, ${sinPunto(edu.centro)}` : ""}.`);
  const habilidades = (cv?.habilidades ?? "").split(/\n|,|;/).map(sinPunto).filter(Boolean).slice(0, 4);
  if (habilidades.length) perfil.push(`Entre mis principales fortalezas se encuentran ${lista(habilidades.map(primeraMinuscula))}.`);
  if (cv?.idiomas.trim()) perfil.push(`Idiomas: ${sinPunto(cv.idiomas)}.`);
  if (!perfil.length && !intro.length) perfil.push("Me considero una persona responsable, organizada y con buena disposición para aprender, trabajar en equipo y cumplir los objetivos del puesto.");
  if (perfil.length) p.push(perfil.join(" "));

  const disponible = cv?.disponibilidad.trim() ? ` Disponibilidad: ${primeraMinuscula(sinPunto(cv.disponibilidad))}.` : "";
  p.push(`Adjunto mi currículum para su consideración. Quedo a su disposición para ampliar cualquier información y para una entrevista en el horario que les resulte conveniente.${disponible}`);
  p.push("Agradezco de antemano su tiempo y atención.");

  const firma = [
    "Atentamente,",
    "",
    nombre || "[Tu nombre completo]",
    cv?.puesto.trim() ? sinPunto(cv.puesto) : "",
    cv?.telefono.trim() ? `Tel./WhatsApp: ${limpio(cv.telefono)}` : nombre ? "" : "Tel./WhatsApp: [tu número]",
    cv?.correo.trim() ? `Correo: ${limpio(cv.correo)}` : "",
    cv?.ciudad.trim() ? limpio(cv.ciudad) : "",
    cv?.linkedin.trim() ? `LinkedIn: ${limpio(cv.linkedin)}` : "",
  ].filter((l, i) => l !== "" || i === 1);

  const pie = job.id ? ["", "—", `Vacante vista en Enlace Laboral: https://enlacelaboralrd.com/vacantes/${job.id}`] : [];
  return { asunto, cuerpo: [...p.flatMap((x) => [x, ""]), ...firma, ...pie].join("\n") };
}

const lineasLogrosSimple = (t: string) => (t ?? "").split(/\n+/).map((l) => l.replace(/^\s*[-•*▪●]\s*/, "").trim()).filter(Boolean);

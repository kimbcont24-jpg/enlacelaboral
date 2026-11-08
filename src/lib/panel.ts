import { diasRestantes } from "@/lib/claridad";
import type { Vacante } from "@/lib/vacantes";

/* ───────── Etapas del proceso ───────── */

export const ETAPAS = [
  { id: "nuevo", label: "Nuevos", corto: "Nuevo", accion: "Nuevo", color: "#1d6ff2", tono: "bg-[#1d6ff2]/10 text-[#1557c4]" },
  { id: "revision", label: "Revisando", corto: "Revisando", accion: "Revisando", color: "#5b6b82", tono: "bg-[#5b6b82]/12 text-[#3f4c60]" },
  { id: "entrevista", label: "Entrevista", corto: "Entrevista", accion: "Entrevista", color: "#c27803", tono: "bg-[#c27803]/12 text-[#8a5200]" },
  { id: "contratado", label: "Contratados", corto: "Contratado", accion: "Contratar", color: "#0f7a43", tono: "bg-[#0f7a43]/12 text-[#0f7a43]" },
  { id: "descartado", label: "Descartados", corto: "Descartado", accion: "Descartar", color: "#9aa3b2", tono: "bg-muted text-muted-foreground" },
] as const;
export type Etapa = (typeof ETAPAS)[number]["id"];
export const etapaDe = (id: string) => ETAPAS.find((e) => e.id === id) ?? ETAPAS[0];

export type Evento = { t: string; tipo: "etapa" | "mensaje" | "entrevista" | "puntaje"; texto: string };

export type Candidato = {
  id: string;
  vacante_id: string;
  nombre: string;
  contacto: string;
  mensaje: string | null;
  created_at: string;
  etapa: Etapa;
  nota: string | null;
  etapa_at: string | null;
  puntaje: number | null;
  entrevista_at: string | null;
  entrevista_lugar: string | null;
  historial: Evento[];
};
export const CAMPOS_CANDIDATO = "id,vacante_id,nombre,contacto,mensaje,created_at,etapa,nota,etapa_at,puntaje,entrevista_at,entrevista_lugar,historial";

export type Plantillas = Partial<Record<ClavePlantilla, string>>;
export type EmpresaPerfil = {
  id: string;
  nombre: string;
  verificada: boolean;
  contacto_nombre: string | null;
  contacto_email: string | null;
  contacto_telefono: string | null;
  sector: string | null;
  provincia: string | null;
  descripcion: string | null;
  sitio_web: string | null;
  plan: "gratis" | "empresa";
  plan_hasta: string | null;
  plantillas: Plantillas;
};
export const CAMPOS_EMPRESA = "id,nombre,verificada,contacto_nombre,contacto_email,contacto_telefono,sector,provincia,descripcion,sitio_web,plan,plan_hasta,plantillas";

export const planActivo = (e: Pick<EmpresaPerfil, "plan" | "plan_hasta">) => e.plan === "empresa" && (!e.plan_hasta || new Date(`${e.plan_hasta}T23:59:59`) >= new Date());

/* ───────── Contacto ───────── */

const RE_CORREO = /[^\s@]+@[^\s@]+\.[^\s@]+/;
export const esCorreo = (c: string) => RE_CORREO.test(c.trim());
export const correoDe = (c: string) => c.match(RE_CORREO)?.[0] ?? null;

/** Número en formato internacional para wa.me y tel:. Los de RD (809/829/849) llevan 1 delante. */
export function telefono(c: string): string | null {
  if (esCorreo(c)) return null;
  const d = c.replace(/\D/g, "");
  if (d.length === 10 && /^(809|829|849)/.test(d)) return `1${d}`;
  if (d.length === 11 && d.startsWith("1")) return d;
  if (d.length >= 10 && d.length <= 15) return d;
  return null;
}

/** Clave para reconocer a la misma persona aunque escriba su contacto distinto. */
export const claveContacto = (c: string) => (esCorreo(c) ? c.trim().toLowerCase() : (telefono(c) ?? c.replace(/\D/g, "")).slice(-10));

export const primerNombre = (n: string) => n.trim().split(/\s+/)[0] ?? "";
export const iniciales = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";

/* ───────── Mensajes (plantillas editables por la empresa) ───────── */

export const PLANTILLAS = [
  { clave: "recibido", titulo: "Recibimos tu aplicación", cuando: "Al revisar a alguien nuevo", texto: "Hola {nombre}, te escribe {empresa}. Recibimos tu aplicación a la vacante de {puesto} por Enlace Laboral. Estamos revisando los perfiles y te contactamos pronto." },
  { clave: "entrevista", titulo: "Invitación a entrevista", cuando: "Al agendar una entrevista", texto: "Hola {nombre}, te escribe {empresa}. Nos gustó tu perfil para la vacante de {puesto} y queremos invitarte a una entrevista el {fecha} a las {hora}. Lugar: {lugar}. ¿Nos confirmas tu asistencia?" },
  { clave: "contratado", titulo: "Seleccionado", cuando: "Al contratar", texto: "Hola {nombre}, te escribe {empresa}. ¡Felicidades! Quedaste seleccionado(a) para la vacante de {puesto}. Te escribimos con los próximos pasos." },
  { clave: "descartado", titulo: "Descarte amable", cuando: "Al descartar", texto: "Hola {nombre}, te escribe {empresa}. Gracias por aplicar a la vacante de {puesto}. En esta ocasión seguimos con otros perfiles, pero guardamos tus datos para próximas vacantes. ¡Mucho éxito!" },
] as const;
export type ClavePlantilla = (typeof PLANTILLAS)[number]["clave"];
export const VARIABLES = ["{nombre}", "{puesto}", "{empresa}", "{fecha}", "{hora}", "{lugar}"] as const;

const claveDeEtapa = (e: Etapa): ClavePlantilla => (e === "entrevista" ? "entrevista" : e === "contratado" ? "contratado" : e === "descartado" ? "descartado" : "recibido");

export const fechaLarga = (iso: string) => new Date(iso).toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" });
export const horaCorta = (iso: string) => new Date(iso).toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" });

export function mensajePara(etapa: Etapa, c: Pick<Candidato, "nombre" | "entrevista_at" | "entrevista_lugar">, puesto: string, empresa: string, propias: Plantillas): string {
  const clave = claveDeEtapa(etapa);
  const base = propias[clave]?.trim() || PLANTILLAS.find((p) => p.clave === clave)!.texto;
  const vars: Record<string, string> = {
    nombre: primerNombre(c.nombre),
    puesto,
    empresa,
    fecha: c.entrevista_at ? fechaLarga(c.entrevista_at) : "(fecha por confirmar)",
    hora: c.entrevista_at ? horaCorta(c.entrevista_at) : "(hora por confirmar)",
    lugar: c.entrevista_lugar?.trim() || "te lo confirmamos por aquí",
  };
  return base.replace(/\{(nombre|puesto|empresa|fecha|hora|lugar)\}/g, (_, k: string) => vars[k] ?? "").replace(/(a|p)\. m\.\./g, "$1. m.");
}

export function enlaceContacto(c: Pick<Candidato, "contacto">, texto: string, puesto: string): { href: string; tipo: "whatsapp" | "correo" } | null {
  const tel = telefono(c.contacto);
  if (tel) return { href: `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, tipo: "whatsapp" };
  const correo = correoDe(c.contacto);
  if (correo) return { href: `mailto:${correo}?subject=${encodeURIComponent(`Tu aplicación: ${puesto}`)}&body=${encodeURIComponent(texto)}`, tipo: "correo" };
  return null;
}

/* ───────── CV y coincidencia con requisitos ───────── */

export function partirMensaje(m: string | null): { mensaje: string; cv: string } {
  const t = (m ?? "").trim();
  const i = t.indexOf("--- CV ---");
  if (i < 0) return { mensaje: t, cv: "" };
  return { mensaje: t.slice(0, i).trim(), cv: t.slice(i + 10).trim() };
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const VACIAS = new Set("para como con sin por los las del una uno unos unas que sus este esta estos estas manejo conocimiento conocimientos experiencia minimo minima años anos ano tener debe deseable buen buena buenas buenos nivel alto alta excelente capacidad disponibilidad persona personas trabajo trabajar area areas otros otras entre sobre mas menos muy desde hasta preferiblemente indispensable requisito requisitos".split(" "));

/** Palabras con peso de un requisito ("Manejo de Excel avanzado" → excel, avanzado). */
function claves(req: string): string[] {
  return [...new Set(sinAcentos(req).replace(/[^a-z0-9ñ+#. ]/g, " ").split(/\s+/).map((w) => w.replace(/\.$/, "")).filter((w) => (w.length >= 4 || /^[a-z]{2,3}\+*#?$|^\d/.test(w)) && !VACIAS.has(w) && !/^\d+$/.test(w)))];
}

/**
 * Compara palabras de los requisitos con el texto que mandó la persona (mensaje + CV).
 * No juzga a nadie: solo dice qué palabras aparecen. Por eso se muestra como "palabras encontradas".
 */
export function coincidencia(texto: string, requisitos: string[]): { ok: string[]; falta: string[]; total: number } | null {
  const reqs = requisitos.map((r) => r.trim()).filter((r) => r.length > 2).slice(0, 12);
  if (!reqs.length || texto.trim().length < 20) return null;
  const t = sinAcentos(texto);
  const ok: string[] = [], falta: string[] = [];
  for (const r of reqs) {
    const k = claves(r);
    if (!k.length) continue;
    const hallados = k.filter((w) => t.includes(w.length > 5 ? w.slice(0, w.length - 1) : w)).length;
    (hallados / k.length >= (k.length <= 2 ? 1 : 0.5) ? ok : falta).push(r);
  }
  const total = ok.length + falta.length;
  return total ? { ok, falta, total } : null;
}

/* ───────── Vacantes ───────── */

export function estadoVacante(v: Pick<Vacante, "estado" | "creado">): { id: "activa" | "vencida" | "revision" | "pausada" | "cerrada"; label: string; tono: string } {
  if (v.estado === "revision") return { id: "revision", label: "En revisión", tono: "bg-[#c27803]/12 text-[#8a5200]" };
  if (v.estado === "cerrada") return { id: "cerrada", label: "Cerrada", tono: "bg-muted text-muted-foreground" };
  if (v.estado !== "publicada") return { id: "pausada", label: "Pausada", tono: "bg-muted text-muted-foreground" };
  if (diasRestantes(v) <= 0) return { id: "vencida", label: "Vencida", tono: "bg-destructive/10 text-destructive" };
  return { id: "activa", label: "Activa", tono: "bg-success/12 text-success" };
}

export const diasDesde = (fecha: string | null) => (fecha ? Math.floor((Date.now() - new Date(fecha).getTime()) / 864e5) : 0);

/* ───────── Entrevistas: calendario ───────── */

const icsFecha = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
export function enlaceGoogleCalendar(c: Pick<Candidato, "nombre" | "entrevista_at" | "entrevista_lugar" | "contacto">, puesto: string): string | null {
  if (!c.entrevista_at) return null;
  const ini = new Date(c.entrevista_at), fin = new Date(ini.getTime() + 45 * 60000);
  const p = new URLSearchParams({ action: "TEMPLATE", text: `Entrevista: ${c.nombre} (${puesto})`, dates: `${icsFecha(ini)}/${icsFecha(fin)}`, details: `Candidato: ${c.nombre}\nContacto: ${c.contacto}\nVía Enlace Laboral`, location: c.entrevista_lugar ?? "" });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
export function descargarIcs(c: Pick<Candidato, "id" | "nombre" | "entrevista_at" | "entrevista_lugar" | "contacto">, puesto: string) {
  if (!c.entrevista_at) return;
  const ini = new Date(c.entrevista_at), fin = new Date(ini.getTime() + 45 * 60000);
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Enlace Laboral//Panel//ES", "BEGIN:VEVENT", `UID:${c.id}@enlacelaboral`, `DTSTAMP:${icsFecha(new Date())}`, `DTSTART:${icsFecha(ini)}`, `DTEND:${icsFecha(fin)}`, `SUMMARY:${esc(`Entrevista: ${c.nombre} (${puesto})`)}`, `DESCRIPTION:${esc(`Contacto: ${c.contacto}`)}`, `LOCATION:${esc(c.entrevista_lugar ?? "")}`, "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Entrevista en 30 minutos", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  bajar(`entrevista-${primerNombre(c.nombre).toLowerCase()}.ics`, ics, "text/calendar;charset=utf-8");
}

/* ───────── Archivos ───────── */

function bajar(nombre: string, contenido: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export function descargarCsv(nombre: string, filas: (string | number)[][]) {
  bajar(nombre, "﻿" + filas.map((f) => f.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n"), "text/csv;charset=utf-8");
}

/* ───────── Métricas ───────── */

/** Horas promedio entre que alguien aplica y la empresa hace algo con esa persona. */
export function horasRespuesta(cs: Candidato[]): number | null {
  const hs = cs.map((c) => {
    const primero = c.historial[0]?.t ?? (c.etapa !== "nuevo" ? c.etapa_at : null);
    return primero ? (new Date(primero).getTime() - new Date(c.created_at).getTime()) / 36e5 : null;
  }).filter((h): h is number => h !== null && h >= 0);
  return hs.length ? hs.reduce((a, b) => a + b, 0) / hs.length : null;
}
export const textoHoras = (h: number) => (h < 1 ? "menos de 1 h" : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} días`);

/* ───────── Lo que toca hoy ───────── */

export type Pendiente = { id: string; texto: string; accion: string; tipo: "candidatos" | "entrevista-hoy" | "decidir" | "renovar" | "cerrar" | "salario"; vacanteId?: string; candidatoId?: string; urgente?: boolean };

const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export function pendientesDe(vacantes: Vacante[], candidatos: Candidato[]): Pendiente[] {
  const out: Pendiente[] = [];
  const hoy = new Date();
  for (const c of candidatos.filter((x) => x.entrevista_at && x.etapa === "entrevista" && mismoDia(new Date(x.entrevista_at), hoy))) {
    out.push({ id: `hoy-${c.id}`, tipo: "entrevista-hoy", candidatoId: c.id, urgente: true, texto: `Hoy a las ${horaCorta(c.entrevista_at!)} entrevistas a ${c.nombre}.`, accion: "Ver ficha" });
  }
  const nuevos = candidatos.filter((c) => c.etapa === "nuevo");
  if (nuevos.length) {
    const viejos = nuevos.filter((c) => diasDesde(c.created_at) >= 3).length;
    out.push({ id: "nuevos", tipo: "candidatos", urgente: viejos > 0, texto: `${nuevos.length === 1 ? "1 persona espera" : `${nuevos.length} personas esperan`} que revises su aplicación${viejos ? ` (${viejos} desde hace más de 3 días)` : ""}.`, accion: "Revisar" });
  }
  const pasadas = candidatos.filter((c) => c.etapa === "entrevista" && (c.entrevista_at ? new Date(c.entrevista_at).getTime() < hoy.getTime() - 864e5 : diasDesde(c.etapa_at ?? c.created_at) >= 7));
  if (pasadas.length) out.push({ id: "decidir", tipo: "decidir", texto: `${pasadas.length === 1 ? "1 persona ya fue entrevistada" : `${pasadas.length} personas ya fueron entrevistadas`} y espera tu respuesta.`, accion: "Decidir" });
  for (const v of vacantes) {
    const e = estadoVacante(v);
    const suyos = candidatos.filter((c) => c.vacante_id === v.id);
    if (e.id === "vencida") out.push({ id: `venc-${v.id}`, tipo: "renovar", vacanteId: v.id, texto: `“${v.titulo}” ya no se ve en la página: cumplió 30 días.`, accion: "Renovar" });
    else if (e.id === "activa" && diasRestantes(v) <= 5) out.push({ id: `pronto-${v.id}`, tipo: "renovar", vacanteId: v.id, texto: `“${v.titulo}” deja de verse en ${diasRestantes(v)} ${diasRestantes(v) === 1 ? "día" : "días"}.`, accion: "Renovar" });
    if ((e.id === "activa" || e.id === "vencida") && suyos.some((c) => c.etapa === "contratado")) out.push({ id: `cerrar-${v.id}`, tipo: "cerrar", vacanteId: v.id, texto: `Ya contrataste para “${v.titulo}”. Ciérrala para no recibir más aplicaciones.`, accion: "Cerrar" });
    if (e.id === "activa" && v.salarioMin <= 0 && diasDesde(v.creado) >= 3 && suyos.length < 3) out.push({ id: `sal-${v.id}`, tipo: "salario", vacanteId: v.id, texto: `“${v.titulo}” no muestra salario. Ponerlo ayuda a que más gente se anime a aplicar.`, accion: "Agregar salario" });
  }
  return out;
}

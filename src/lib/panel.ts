import { diasRestantes } from "@/lib/claridad";
import type { Vacante } from "@/lib/vacantes";

export const ETAPAS = [
  { id: "nuevo", label: "Nuevos", corto: "Nuevo", tono: "bg-cta text-cta-foreground" },
  { id: "revision", label: "En revisión", corto: "Revisando", tono: "bg-secondary text-primary" },
  { id: "entrevista", label: "Entrevista", corto: "Entrevista", tono: "bg-primary text-primary-foreground" },
  { id: "contratado", label: "Contratados", corto: "Contratado", tono: "bg-success text-white" },
  { id: "descartado", label: "Descartados", corto: "Descartado", tono: "bg-muted text-muted-foreground" },
] as const;
export type Etapa = (typeof ETAPAS)[number]["id"];
export const etapaDe = (id: string) => ETAPAS.find((e) => e.id === id) ?? ETAPAS[0];

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
};

export type EmpresaPerfil = { id: string; nombre: string; verificada: boolean; contacto_telefono: string | null };

const RE_CORREO = /[^\s@]+@[^\s@]+\.[^\s@]+/;
export const esCorreo = (c: string) => RE_CORREO.test(c.trim());

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

const primerNombre = (n: string) => n.trim().split(/\s+/)[0] ?? "";

/** Mensaje para el candidato según la etapa. Solo usa datos que ya están en la aplicación. */
export function plantilla(etapa: Etapa, c: Pick<Candidato, "nombre">, puesto: string, empresa: string): string {
  const hola = `Hola ${primerNombre(c.nombre)}, te escribe ${empresa}.`;
  switch (etapa) {
    case "entrevista":
      return `${hola} Nos gustó tu perfil para la vacante de ${puesto} y queremos invitarte a una entrevista. ¿Qué día y hora te queda bien esta semana?`;
    case "contratado":
      return `${hola} ¡Felicidades! Quedaste seleccionado(a) para la vacante de ${puesto}. Te escribimos con los próximos pasos.`;
    case "descartado":
      return `${hola} Gracias por aplicar a la vacante de ${puesto}. En esta ocasión seguimos con otros perfiles, pero guardamos tus datos para próximas vacantes. ¡Mucho éxito!`;
    default:
      return `${hola} Recibimos tu aplicación a la vacante de ${puesto} por Enlace Laboral. Estamos revisando los perfiles y te contactamos pronto.`;
  }
}

export function enlaceContacto(c: Candidato, texto: string, puesto: string): { href: string; tipo: "whatsapp" | "correo" } | null {
  const tel = telefono(c.contacto);
  if (tel) return { href: `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, tipo: "whatsapp" };
  if (esCorreo(c.contacto)) {
    const correo = c.contacto.match(RE_CORREO)?.[0] ?? c.contacto.trim();
    return { href: `mailto:${correo}?subject=${encodeURIComponent(`Tu aplicación: ${puesto}`)}&body=${encodeURIComponent(texto)}`, tipo: "correo" };
  }
  return null;
}

/** Cómo está la vacante para la empresa, en palabras simples. */
export function estadoVacante(v: Pick<Vacante, "estado" | "creado">): { id: "activa" | "vencida" | "revision" | "pausada" | "cerrada"; label: string; tono: string } {
  if (v.estado === "revision") return { id: "revision", label: "En revisión", tono: "bg-cta/15 text-[#8a5200]" };
  if (v.estado === "cerrada") return { id: "cerrada", label: "Cerrada", tono: "bg-muted text-muted-foreground" };
  if (v.estado !== "publicada") return { id: "pausada", label: "Pausada", tono: "bg-muted text-muted-foreground" };
  if (diasRestantes(v) <= 0) return { id: "vencida", label: "Vencida", tono: "bg-destructive/10 text-destructive" };
  return { id: "activa", label: "Activa", tono: "bg-success/10 text-success" };
}

export const diasDesde = (fecha: string | null) => (fecha ? Math.floor((Date.now() - new Date(fecha).getTime()) / 864e5) : 0);

export function descargarCsv(nombre: string, filas: (string | number)[][]) {
  const csv = filas.map((f) => f.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Lo que el panel le sugiere hacer hoy a la empresa, calculado solo con sus datos. */
export type Pendiente = { id: string; texto: string; accion: string; tipo: "candidatos" | "entrevista" | "renovar" | "cerrar" | "salario"; vacanteId?: string };

export function pendientesDe(vacantes: Vacante[], candidatos: Candidato[]): Pendiente[] {
  const out: Pendiente[] = [];
  const nuevos = candidatos.filter((c) => c.etapa === "nuevo").length;
  if (nuevos) out.push({ id: "nuevos", tipo: "candidatos", texto: nuevos === 1 ? "Tienes 1 candidato nuevo sin revisar." : `Tienes ${nuevos} candidatos nuevos sin revisar.`, accion: "Revisar" });
  const atascados = candidatos.filter((c) => c.etapa === "entrevista" && diasDesde(c.etapa_at ?? c.created_at) >= 7).length;
  if (atascados) out.push({ id: "entrevista", tipo: "entrevista", texto: `${atascados} ${atascados === 1 ? "persona lleva" : "personas llevan"} más de una semana en entrevista. Decide si sigue o no, para avisarle.`, accion: "Ver" });
  for (const v of vacantes) {
    const e = estadoVacante(v);
    const suyos = candidatos.filter((c) => c.vacante_id === v.id);
    if (e.id === "vencida") out.push({ id: `venc-${v.id}`, tipo: "renovar", vacanteId: v.id, texto: `“${v.titulo}” ya no se ve en la página porque cumplió 30 días.`, accion: "Renovar" });
    else if (e.id === "activa" && diasRestantes(v) <= 5) out.push({ id: `pronto-${v.id}`, tipo: "renovar", vacanteId: v.id, texto: `“${v.titulo}” deja de verse en ${diasRestantes(v)} ${diasRestantes(v) === 1 ? "día" : "días"}.`, accion: "Renovar" });
    if ((e.id === "activa" || e.id === "vencida") && suyos.some((c) => c.etapa === "contratado")) out.push({ id: `cerrar-${v.id}`, tipo: "cerrar", vacanteId: v.id, texto: `Ya contrataste para “${v.titulo}”. Ciérrala para no recibir más aplicaciones.`, accion: "Cerrar" });
    if (e.id === "activa" && v.salarioMin <= 0 && diasDesde(v.creado) >= 3 && suyos.length < 3) out.push({ id: `sal-${v.id}`, tipo: "salario", vacanteId: v.id, texto: `“${v.titulo}” no muestra salario. Ponerlo ayuda a que más gente se anime a aplicar.`, accion: "Agregar salario" });
  }
  return out;
}

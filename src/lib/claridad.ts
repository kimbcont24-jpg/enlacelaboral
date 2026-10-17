import type { Vacante } from "@/lib/vacantes";

export type Claridad = { nivel: "Alta" | "Media" | "Baja"; puntos: number; total: number; tiene: string[]; falta: string[] };

/**
 * Índice de claridad: cuánta información útil trae la vacante.
 * Se calcula con lo que la vacante realmente dice; no es una opinión sobre la empresa.
 */
export function claridad(job: Vacante): Claridad {
  const criterios: [string, boolean][] = [
    ["Salario publicado", job.salarioMin > 0],
    ["Empresa identificada", job.empresa !== "Empresa no indicada"],
    ["Requisitos claros", job.requisitos.length > 0],
    ["Funciones u horario", job.descripcion.trim().length > 20],
    ["Cómo aplicar", job.aplicar.trim().length > 0 || job.fuente === "Enlace Laboral"],
    ["Fuente verificable", job.fuenteUrl.trim().length > 0 || job.fuente === "Publicada por la empresa"],
  ];
  const tiene = criterios.filter(([, ok]) => ok).map(([n]) => n);
  const falta = criterios.filter(([, ok]) => !ok).map(([n]) => n);
  const puntos = tiene.length;
  const nivel = puntos >= 5 ? "Alta" : puntos >= 3 ? "Media" : "Baja";
  return { nivel, puntos, total: criterios.length, tiene, falta };
}

export const esNueva = (job: Vacante) => Date.now() - new Date(job.creado).getTime() < 24 * 3600 * 1000;

/** Días que le quedan visible a la vacante (30 desde que se publicó). */
export const diasRestantes = (job: Pick<Vacante, "creado">) => Math.max(0, Math.ceil(30 - (Date.now() - new Date(job.creado).getTime()) / 864e5));
export const venceTexto = (job: Pick<Vacante, "creado">) => {
  const d = diasRestantes(job);
  return d <= 0 ? "Vence hoy" : d === 1 ? "Vence mañana" : `Vence en ${d} días`;
};

export const NIVELES = ["Primer empleo", "Operativo / técnico", "Profesional", "Gerencial"] as const;
/** Nivel aproximado, deducido del título y la experiencia pedida. No es un dato que la empresa haya declarado. */
export function nivelDe(job: Pick<Vacante, "titulo" | "experiencia">): (typeof NIVELES)[number] {
  const t = job.titulo.toLowerCase();
  if (/gerente|director|directora|jefe|jefa|encargad|head of|líder|lider|coordinador|coordinadora|supervisor|supervisora/.test(t)) return "Gerencial";
  if (job.experiencia === "Sin experiencia") return "Primer empleo";
  if (/t[eé]cnic|operari|auxiliar|mensajer|chofer|conductor|cajer|vendedor|vendedora|almacen|seguridad|limpieza|mec[aá]nic|electricist|soldador|cocinero|mesero|mesera|asistente|recepcion/.test(t)) return "Operativo / técnico";
  return "Profesional";
}

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

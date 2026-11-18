import { createElement, useEffect, useMemo, useState } from "react";

import { EVENTO_CV, EVENTO_CV_REMOTO, leerCV, type CV } from "@/lib/cv";
import { recomendar, type Recomendada } from "@/lib/recomendar";
import type { Vacante } from "@/lib/vacantes";

/**
 * Afinidad: qué tanto encaja cada vacante con lo que la persona busca (su CV o «Vacantes para ti en 3 toques»).
 * Todo se calcula en su teléfono con lo que ella misma escribió; no se envía a ningún lado.
 */

/** El CV guardado, al día cuando cambia (sin escribir nada, a diferencia de useCV). */
export function useMiPerfil(): CV | null {
  const [cv, setCv] = useState<CV | null>(null);
  useEffect(() => {
    const leer = () => setCv(leerCV());
    leer();
    window.addEventListener(EVENTO_CV, leer);
    window.addEventListener(EVENTO_CV_REMOTO, leer);
    return () => { window.removeEventListener(EVENTO_CV, leer); window.removeEventListener(EVENTO_CV_REMOTO, leer); };
  }, []);
  return cv;
}

export const tienePerfil = (cv: CV | null): cv is CV => !!cv && !!(cv.puesto.trim() || cv.habilidades.trim());

/** Afinidad de todas las vacantes de una vez (para ordenar y contar). */
export function useAfinidades(jobs: Vacante[]): { perfil: CV | null; mapa: Map<string, Recomendada> } {
  const perfil = useMiPerfil();
  const mapa = useMemo(() => (tienePerfil(perfil) ? new Map(recomendar(perfil, jobs, new Set(), 100000).map((r) => [r.job.id, r])) : new Map<string, Recomendada>()), [perfil, jobs]);
  return { perfil, mapa };
}

/** Afinidad de una sola vacante (para la tarjeta). */
export function useAfinidad(job: Vacante): Recomendada | undefined {
  const perfil = useMiPerfil();
  return useMemo(() => (tienePerfil(perfil) ? recomendar(perfil, [job], new Set(), 1)[0] : undefined), [perfil, job]);
}

/** Etiqueta «Para ti» con el porqué (los puntos de recomendar: puesto 6, ciudad 2, cada habilidad 1.5). */
export function ParaTiChip({ r, className = "" }: { r: Recomendada | undefined; className?: string }) {
  if (!r) return null;
  const muy = r.puntos >= 8;
  return createElement(
    "span",
    { title: `Coincide con: ${r.porque.join(", ")}`, className: `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${muy ? "bg-[#1d6ff2] text-white" : "bg-[#1d6ff2]/12 text-[#1557c4]"} ${className}` },
    `✦ ${muy ? "Muy para ti" : "Para ti"}`,
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/**
 * Opiniones de empresas (sql/2026-11-13-opiniones-empresas.sql).
 * Dos tipos: «proceso» (solo quien aplicó por Enlace con su cuenta) y «trabajo» (correo verificado).
 * Todo pasa por la aprobación de Kim. El promedio aparece desde 5 opiniones publicadas.
 */
export type TipoOpinion = "proceso" | "trabajo";

export const TIPOS: Record<TipoOpinion, { titulo: string; corto: string; pregunta: string; recomienda: string }> = {
  proceso: { titulo: "Su proceso de selección", corto: "Proceso de selección", pregunta: "¿Cómo te fue al aplicar?", recomienda: "¿Le recomendarías a un amigo aplicar aquí?" },
  trabajo: { titulo: "Trabajar aquí", corto: "Trabajar aquí", pregunta: "¿Cómo es trabajar ahí?", recomienda: "¿Le recomendarías a un amigo trabajar aquí?" },
};

export const CATEGORIAS: Record<TipoOpinion, { k: string; t: string; ayuda: string }[]> = {
  proceso: [
    { k: "respuesta", t: "Te respondieron", ayuda: "Te dijeron algo, aunque fuera un no" },
    { k: "trato", t: "Trato en la entrevista", ayuda: "Respeto, puntualidad, amabilidad" },
    { k: "claridad", t: "Información clara", ayuda: "Puesto, horario y sueldo como dijeron" },
    { k: "rapidez", t: "Rapidez del proceso", ayuda: "Sin semanas de silencio" },
  ],
  trabajo: [
    { k: "pago", t: "Pagan a tiempo", ayuda: "Quincena y extras sin atrasos" },
    { k: "tss", t: "Cumplen con la ley y la TSS", ayuda: "Seguro, regalía, vacaciones" },
    { k: "horario", t: "Respetan el horario", ayuda: "Horas extra pagadas y avisadas" },
    { k: "trato", t: "Trato y liderazgo", ayuda: "Cómo te tratan los supervisores" },
    { k: "crecimiento", t: "Puedes crecer", ayuda: "Ascensos, formación, aprendizaje" },
    { k: "ambiente", t: "Ambiente de trabajo", ayuda: "Compañeros y clima del equipo" },
  ],
};

export type ResumenTipo = {
  total: number;
  promedio: number | null;
  recomienda: number | null;
  estrellas: number[] | null;
  categorias: Record<string, number> | null;
};

export type Opinion = {
  id: string;
  tipo: TipoOpinion;
  estrellas: number;
  recomienda?: boolean;
  titulo?: string;
  positivo?: string;
  mejorar?: string;
  puesto?: string;
  relacion?: "actual" | "anterior";
  verificada?: boolean;
  fecha: string;
  respuesta?: string;
  respuesta_fecha?: string;
};

export type OpinionesEmpresa = {
  slug: string;
  nombre: string | null;
  resumen: Record<TipoOpinion, ResumenTipo>;
  general?: { promedio: number | null; total: number };
  opiniones: Opinion[];
};

const vacio: ResumenTipo = { total: 0, promedio: null, recomienda: null, estrellas: null, categorias: null };

export function normalizar(d: unknown, slug: string): OpinionesEmpresa {
  const x = (d && typeof d === "object" ? d : {}) as Partial<OpinionesEmpresa>;
  const r = (x.resumen ?? {}) as Partial<Record<TipoOpinion, Partial<ResumenTipo>>>;
  const uno = (t: TipoOpinion): ResumenTipo => ({ ...vacio, ...(r[t] ?? {}), promedio: r[t]?.promedio != null ? Number(r[t]!.promedio) : null, recomienda: r[t]?.recomienda != null ? Number(r[t]!.recomienda) : null });
  const g = x.general as { promedio?: number | string | null; total?: number } | undefined;
  return { slug, nombre: x.nombre ?? null, resumen: { proceso: uno("proceso"), trabajo: uno("trabajo") }, general: g ? { promedio: g.promedio != null ? Number(g.promedio) : null, total: Number(g.total ?? 0) } : undefined, opiniones: Array.isArray(x.opiniones) ? x.opiniones : [] };
}

export async function cargarOpiniones(slug: string): Promise<OpinionesEmpresa> {
  const { data, error } = await supabase.rpc("opiniones_empresa_publicas" as never, { p_slug: slug } as never);
  if (error) throw error;
  return normalizar(data, slug);
}

export function useOpiniones(slug: string | null, inicial?: OpinionesEmpresa) {
  return useQuery({
    queryKey: ["opiniones", slug],
    enabled: !!slug,
    initialData: inicial,
    staleTime: 60_000,
    queryFn: () => cargarOpiniones(slug!),
  });
}

/** Promedio general combinado (los dos tipos), calculado en la base; solo desde 5 opiniones. */
export function general(o: OpinionesEmpresa | undefined): { promedio: number | null; total: number } {
  if (!o) return { promedio: null, total: 0 };
  return o.general ?? { promedio: null, total: o.resumen.proceso.total + o.resumen.trabajo.total };
}

export type MiOpinion = { tipo: TipoOpinion; estado: "pendiente" | "publicada" | "rechazada"; motivo?: string | null; estrellas: number; categorias: Record<string, number>; recomienda: boolean | null; titulo: string | null; positivo: string | null; mejorar: string | null; puesto: string | null; relacion: "actual" | "anterior" | null };
export type MisOpiniones = { sesion: boolean; verificado?: boolean; puede_proceso?: boolean; mias?: MiOpinion[] };

export function useMisOpiniones(slug: string | null) {
  return useQuery({
    queryKey: ["mis-opiniones", slug],
    enabled: !!slug,
    queryFn: async (): Promise<MisOpiniones> => {
      const { data } = await supabase.rpc("mis_opiniones_empresa" as never, { p_slug: slug } as never);
      return (data ?? { sesion: false }) as MisOpiniones;
    },
  });
}

export type NuevaOpinion = {
  tipo: TipoOpinion; estrellas: number; categorias: Record<string, number>; recomienda: boolean | null;
  titulo: string; positivo: string; mejorar: string; puesto: string; relacion: "actual" | "anterior" | null;
};

export async function enviarOpinion(slug: string, o: NuevaOpinion): Promise<string | null> {
  const { error } = await supabase.rpc("opinar_empresa" as never, {
    p_slug: slug, p_tipo: o.tipo, p_estrellas: o.estrellas, p_categorias: o.categorias, p_recomienda: o.recomienda,
    p_titulo: o.titulo, p_positivo: o.positivo, p_mejorar: o.mejorar, p_puesto: o.puesto, p_relacion: o.relacion,
  } as never);
  if (!error) return null;
  return /^[A-ZÁÉÍÓÚ¿¡]/.test(error.message) && error.message.length < 220 ? error.message : "No se pudo enviar. Intenta de nuevo.";
}

export function useRefrescarOpiniones() {
  const qc = useQueryClient();
  return (slug: string) => {
    void qc.invalidateQueries({ queryKey: ["opiniones", slug] });
    void qc.invalidateQueries({ queryKey: ["mis-opiniones", slug] });
  };
}

/** Calificación corta (promedio desde 5 opiniones) de varias empresas a la vez, para tarjetas. */
export function useCalificaciones(slugs: string[]) {
  const clave = [...new Set(slugs.filter(Boolean))].sort();
  return useQuery({
    queryKey: ["calificaciones", clave.join(",")],
    enabled: clave.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Record<string, { promedio: number; total: number }>> => {
      const { data } = await supabase.rpc("calificaciones_empresas" as never, { p_slugs: clave.slice(0, 100) } as never);
      const out: Record<string, { promedio: number; total: number }> = {};
      for (const r of (data ?? []) as { slug: string; promedio: number; total: number }[]) out[r.slug] = { promedio: Number(r.promedio), total: r.total };
      return out;
    },
  });
}

export const mesAno = (f?: string) => {
  if (!f) return "";
  const [a, m] = f.split("-").map(Number);
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${meses[(m ?? 1) - 1]} ${a}`;
};

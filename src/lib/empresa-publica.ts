import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type EmpresaPublica = { id: string; nombre: string; sector: string | null; provincia: string | null; descripcion: string | null; sitio_web: string | null; verificada: boolean; activas: number; pro?: boolean; responde_pct?: number | null; responde_horas?: number | null; contratados?: number };

/** Datos públicos de una empresa con cuenta (no aparecen las vacantes que carga Enlace Laboral). */
export function useEmpresaPublica(p: { empresa?: string; vacante?: string }) {
  return useQuery({
    queryKey: ["empresa-publica", p.empresa ?? null, p.vacante ?? null],
    enabled: !!(p.empresa || p.vacante),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<EmpresaPublica | null> => {
      const { data, error } = await supabase.rpc("empresa_publica", { p_empresa: p.empresa ?? null, p_vacante: p.vacante ?? null });
      if (error) return null;
      return ((data ?? []) as EmpresaPublica[])[0] ?? null;
    },
  });
}

/** Señales de confianza reales, calculadas con su actividad en el panel. */
export function senalesEmpresa(e: EmpresaPublica): string[] {
  const out: string[] = [];
  if (e.responde_pct != null && e.responde_pct >= 50) out.push(`Revisa al ${e.responde_pct}% de quienes aplican`);
  if (e.contratados && e.contratados > 0) out.push(`Ya contrató ${e.contratados === 1 ? "1 persona" : `${e.contratados} personas`} por Enlace Laboral`);
  return out;
}

export const sitioSeguro = (u: string | null) => {
  if (!u) return null;
  const t = u.trim();
  const url = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try { const x = new URL(url); return x.protocol === "https:" || x.protocol === "http:" ? x.toString() : null; } catch { return null; }
};

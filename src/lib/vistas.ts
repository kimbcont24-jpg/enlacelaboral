import { supabase } from "@/integrations/supabase/client";

/** Cuenta una vista por persona y sesión, para que la empresa sepa cuánta gente vio su vacante. */
export function registrarVista(id: string, estado: string) {
  if (estado !== "publicada" || typeof window === "undefined") return;
  const k = `enlace-visto-${id}`;
  try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch { /* sin almacenamiento */ }
  void supabase.rpc("registrar_vista", { p_vacante: id });
}

export type Vistas = { total: number; semana: number; porDia: Record<string, number> };

/** Vistas de las vacantes de la empresa (últimos 30 días), agrupadas por vacante. */
export async function cargarVistas(): Promise<Record<string, Vistas>> {
  const { data, error } = await supabase.rpc("vistas_mis_vacantes", { p_dias: 30 });
  if (error || !data) return {};
  const hace7 = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const out: Record<string, Vistas> = {};
  for (const f of data) {
    const v = (out[f.vacante_id] ??= { total: 0, semana: 0, porDia: {} });
    v.total += f.n;
    if (f.dia >= hace7) v.semana += f.n;
    v.porDia[f.dia] = (v.porDia[f.dia] ?? 0) + f.n;
  }
  return out;
}

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Vacante } from "@/lib/vacantes";

/**
 * Vacantes de las tarjetas grandes del inicio (al lado del buscador).
 * Orden: 1) las que Kim fija desde Admin → Control; 2) si el automático está encendido,
 * las de empresas aliadas con salario desde el mínimo (RD$32,000 por defecto), las más nuevas primero;
 * 3) si aún faltan, las de siempre (destacadas y con salario) para que la portada nunca quede vacía.
 * Se guarda en contenido_sitio, clave `portada_vacantes` (lectura pública, escritura solo admin).
 */

export const CLAVE_PORTADA = "portada_vacantes";
export const MAX_TARJETAS = 3;

/** Fuentes que convierten a una empresa en aliada (las mismas de Admin → Aliadas). */
export const FUENTES_ALIADAS = [
  "Publicada por la empresa",
  "Texto de la empresa",
  "Mensaje de WhatsApp de la empresa",
  "Mensaje de reclutador",
  "Correo de la empresa a Enlace Laboral",
  "Correo recibido",
];

export type ConfigPortada = { auto: boolean; minimo: number; fijas: string[] };
export const portadaPorDefecto: ConfigPortada = { auto: true, minimo: 32000, fijas: [] };

type Datos = { config: ConfigPortada; aliadasAMano: string[] };

const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

async function leer(): Promise<Datos> {
  const { data } = await supabase.from("contenido_sitio").select("clave,valor").in("clave", [CLAVE_PORTADA, "aliadas_seguimiento"]);
  const m = new Map((data ?? []).map((r) => [r.clave, r.valor]));
  let config = { ...portadaPorDefecto };
  try {
    const c = JSON.parse(m.get(CLAVE_PORTADA) || "{}") as Partial<ConfigPortada>;
    config = {
      auto: c.auto !== false,
      minimo: Number.isFinite(Number(c.minimo)) && Number(c.minimo) > 0 ? Number(c.minimo) : portadaPorDefecto.minimo,
      fijas: Array.isArray(c.fijas) ? c.fijas.filter((x): x is string => typeof x === "string").slice(0, MAX_TARJETAS) : [],
    };
  } catch { /* se queda lo de por defecto */ }
  let aliadasAMano: string[] = [];
  try {
    const s = JSON.parse(m.get("aliadas_seguimiento") || "{}") as Record<string, { mano?: boolean }>;
    aliadasAMano = Object.entries(s).filter(([, x]) => x?.mano).map(([k]) => k);
  } catch { aliadasAMano = []; }
  return { config, aliadasAMano };
}

export function usePortada() {
  const q = useQuery({ queryKey: ["portada"], queryFn: leer, staleTime: 30_000 });
  return { config: q.data?.config ?? portadaPorDefecto, aliadasAMano: q.data?.aliadasAMano ?? [], cargando: q.isLoading };
}

export function useGuardarPortada() {
  const qc = useQueryClient();
  return async (config: ConfigPortada) => {
    const valor = JSON.stringify({ auto: config.auto, minimo: Math.round(config.minimo), fijas: config.fijas.slice(0, MAX_TARJETAS) });
    const { error } = await supabase.from("contenido_sitio").upsert({ clave: CLAVE_PORTADA, valor, updated_at: new Date().toISOString() });
    if (!error) await qc.invalidateQueries({ queryKey: ["portada"] });
    return !error;
  };
}

export function esAliada(job: Vacante, aliadasAMano: string[] = []): boolean {
  if (FUENTES_ALIADAS.includes(job.fuente)) return true;
  const e = norm(job.empresa);
  return aliadasAMano.some((n) => norm(n) === e);
}

export type Motivo = "fija" | "aliada" | "relleno";

/** Devuelve hasta 3 vacantes para la portada, con el motivo de cada una (el panel lo muestra). */
export function elegirPortada(jobs: Vacante[], config: ConfigPortada, aliadasAMano: string[] = []): { job: Vacante; motivo: Motivo }[] {
  const salida: { job: Vacante; motivo: Motivo }[] = [];
  const ids = new Set<string>();
  const empresas = new Set<string>();
  const poner = (j: Vacante, motivo: Motivo, unaPorEmpresa: boolean) => {
    if (salida.length >= MAX_TARJETAS || ids.has(j.id)) return;
    if (unaPorEmpresa && empresas.has(j.empresa)) return;
    ids.add(j.id);
    empresas.add(j.empresa);
    salida.push({ job: j, motivo });
  };

  // 1) Fijadas a mano, en el orden que Kim eligió (si siguen publicadas).
  const porId = new Map(jobs.map((j) => [j.id, j]));
  for (const id of config.fijas) { const j = porId.get(id); if (j) poner(j, "fija", false); }

  // 2) Aliadas que pagan desde el mínimo: las más nuevas primero, una por empresa.
  if (config.auto) {
    const aliadas = jobs
      .filter((j) => esAliada(j, aliadasAMano) && j.salarioMin >= config.minimo)
      .sort((a, b) => b.creado.localeCompare(a.creado));
    for (const j of aliadas) poner(j, "aliada", true);
  }

  // 3) Relleno: como antes (destacadas con salario, luego con salario, luego el resto).
  if (salida.length < MAX_TARJETAS) {
    const conSueldo = jobs.filter((j) => j.salarioMin > 0);
    for (const j of [...conSueldo.filter((x) => x.destacada), ...conSueldo.filter((x) => !x.destacada), ...jobs.filter((x) => x.salarioMin <= 0)]) poner(j, "relleno", true);
  }
  return salida;
}

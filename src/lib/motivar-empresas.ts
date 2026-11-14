import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { claridad } from "@/lib/claridad";
import { slug as slugDe } from "@/lib/empleos";
import type { Vacante } from "@/lib/vacantes";

/* ───────── Sello de empresa: Bronce, Plata y Oro ─────────
 * Mide qué tan completas vienen sus vacantes de los últimos 30 días (sueldo, requisitos, funciones,
 * cómo aplicar, empresa y fuente). No es una opinión sobre la empresa: es información que da.
 */

export type NivelSello = "oro" | "plata" | "bronce";
export type Sello = { nivel: NivelSello; t: string; color: string; fondo: string; borde: string; siguiente: { nivel: NivelSello; t: string; puntaje: number; vacantes: number } | null };

export const NIVELES_SELLO: { nivel: NivelSello; t: string; puntaje: number; vacantes: number; color: string; fondo: string; borde: string }[] = [
  { nivel: "oro", t: "Oro", puntaje: 97, vacantes: 3, color: "#8a5a00", fondo: "linear-gradient(135deg,#fff3c4,#ffd84d 55%,#f5a700)", borde: "#e0a200" },
  { nivel: "plata", t: "Plata", puntaje: 92, vacantes: 2, color: "#3f4c60", fondo: "linear-gradient(135deg,#f6f8fb,#d9dfe8 55%,#b6c0cf)", borde: "#9aa6b8" },
  { nivel: "bronce", t: "Bronce", puntaje: 85, vacantes: 1, color: "#7a3b0f", fondo: "linear-gradient(135deg,#fde7d3,#e8a46b 55%,#c9763a)", borde: "#b8692f" },
];

export const NOMBRE_SELLO = "Empresa que publica claro";
// Con 85 o más, una empresa no llega sin publicar el sueldo: 5 de 6 datos dan 83. El sueldo es lo que separa.

/** Consultoras y empresas de reclutamiento no entran al ranking (publican por otras empresas). */
const CONSULTORA = /consult|\bv[ií]a\b|talento firme|recursos humanos|reclutamiento|gesti[oó]n humana|talento humano|headhunt|manpower|people group|verox|outsourcing|neuro stem/i;

/** Puntaje 0–100: promedio de la claridad de sus vacantes. */
export function puntajeClaridad(vs: Vacante[]): number {
  if (!vs.length) return 0;
  return Math.round((vs.reduce((s, j) => { const c = claridad(j); return s + c.puntos / c.total; }, 0) / vs.length) * 100);
}

export function selloDe(puntaje: number, vacantes: number): Sello | null {
  const i = NIVELES_SELLO.findIndex((n) => puntaje >= n.puntaje && vacantes >= n.vacantes);
  const prox = i === -1 ? NIVELES_SELLO[NIVELES_SELLO.length - 1]! : i > 0 ? NIVELES_SELLO[i - 1]! : null;
  const siguiente = prox ? { nivel: prox.nivel, t: prox.t, puntaje: prox.puntaje, vacantes: prox.vacantes } : null;
  if (i === -1) return null;
  const n = NIVELES_SELLO[i]!;
  return { nivel: n.nivel, t: n.t, color: n.color, fondo: n.fondo, borde: n.borde, siguiente };
}

/** Lo que le falta para el próximo nivel, en palabras. */
export function faltaParaSello(puntaje: number, vacantes: number): { t: string; puntaje: number; vacantes: number } | null {
  const actual = selloDe(puntaje, vacantes);
  const meta = actual ? actual.siguiente : NIVELES_SELLO[NIVELES_SELLO.length - 1]!;
  if (!meta) return null;
  return { t: meta.t, puntaje: Math.max(0, meta.puntaje - puntaje), vacantes: Math.max(0, meta.vacantes - vacantes) };
}

/* ───────── Ranking «Empresas que publican claro» ───────── */

export type FilaRanking = { slug: string; nombre: string; vacantes: number; puntaje: number; conSueldo: number; areas: string[]; sello: Sello | null; claras: number };

export function rankingEmpresas(todas: Vacante[]): FilaRanking[] {
  const grupos = new Map<string, { nombre: string; js: Vacante[] }>();
  for (const j of todas) {
    if (j.empresa === "Empresa no indicada" || /confidencial/i.test(j.empresa) || CONSULTORA.test(j.empresa)) continue;
    const k = slugDe(j.empresa);
    const g = grupos.get(k) ?? { nombre: j.empresa, js: [] };
    g.js.push(j);
    grupos.set(k, g);
  }
  return [...grupos.entries()].map(([slug, g]) => {
    const puntaje = puntajeClaridad(g.js);
    const cuenta = new Map<string, number>();
    for (const j of g.js) cuenta.set(j.area, (cuenta.get(j.area) ?? 0) + 1);
    return {
      slug, nombre: g.nombre, vacantes: g.js.length, puntaje,
      conSueldo: Math.round((g.js.filter((j) => j.salarioMin > 0).length / g.js.length) * 100),
      claras: g.js.filter((j) => { const c = claridad(j); return c.puntos === c.total; }).length,
      areas: [...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a).slice(0, 3),
      sello: selloDe(puntaje, g.js.length),
    };
  }).sort((a, b) => b.puntaje - a.puntaje || b.vacantes - a.vacantes || a.nombre.localeCompare(b.nombre));
}

/* ───────── Audiencia: lo que Enlace ya le dio a una empresa ───────── */

export type Audiencia = { vistas: number; aplicaciones: number; seguidores: number; empresa_id: string | null };

export function useAudiencia(slug: string | null) {
  return useQuery({
    queryKey: ["audiencia", slug],
    enabled: !!slug,
    staleTime: 2 * 60_000,
    queryFn: async (): Promise<Audiencia | null> => {
      const { data, error } = await supabase.rpc("empresa_audiencia" as never, { p_slug: slug } as never);
      if (error || !data) return null;
      const d = data as unknown as Partial<Audiencia>;
      return { vistas: Number(d.vistas) || 0, aplicaciones: Number(d.aplicaciones) || 0, seguidores: Number(d.seguidores) || 0, empresa_id: d.empresa_id ?? null };
    },
  });
}

/* ───────── Seguidores (anónimos) ───────── */

const CLAVE_ANON = "enlace-anon";
/** Un id al azar de este navegador, sin datos de la persona. Sirve solo para contar seguidores sin repetir. */
export function anonId(): string | null {
  try {
    let v = localStorage.getItem(CLAVE_ANON);
    if (!v || !/^[a-z0-9]{16,40}$/.test(v)) {
      const b = new Uint8Array(12);
      crypto.getRandomValues(b);
      v = [...b].map((x) => x.toString(36).padStart(2, "0")).join("").slice(0, 24);
      localStorage.setItem(CLAVE_ANON, v);
    }
    return v;
  } catch { return null; }
}

export async function guardarSeguimiento(slug: string, sigue: boolean): Promise<number | null> {
  const anon = anonId();
  if (!anon) return null;
  const { data } = await supabase.rpc("seguir_empresa" as never, { p_slug: slug, p_anon: anon, p_sigue: sigue } as never);
  return typeof data === "number" ? data : null;
}

/* ───────── Reclamar el perfil ───────── */

const CLAVE_RECLAMO = "enlace-reclamo";
export function guardarReclamo(slug: string, nombre: string) {
  try { localStorage.setItem(CLAVE_RECLAMO, JSON.stringify({ slug, nombre, t: Date.now() })); } catch { /* sin almacenamiento */ }
}
export function leerReclamo(): { slug: string; nombre: string } | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_RECLAMO) ?? "null") as { slug?: string; nombre?: string; t?: number } | null;
    if (!v?.slug || !v.t || Date.now() - v.t > 14 * 864e5) return null;
    return { slug: v.slug, nombre: v.nombre ?? "" };
  } catch { return null; }
}
export function borrarReclamo() { try { localStorage.removeItem(CLAVE_RECLAMO); } catch { /* nada */ } }

export const MENSAJE_RECLAMO: Record<string, string> = {
  ok: "Recibimos tu solicitud. La revisamos con tu RNC y te avisamos aquí cuando tu perfil quede unido a tu cuenta.",
  pendiente: "Ya tienes una solicitud en revisión para ese perfil.",
  ya_reclamada: "Ese perfil ya está unido a otra cuenta verificada. Escríbenos si crees que es un error.",
  no_existe: "No encontramos ese perfil de empresa.",
  sin_empresa: "Primero completa los datos de tu empresa.",
  slug: "El enlace del perfil no es válido.",
};

/* ───────── Marca empleadora ───────── */

export type Marca = { logo?: string; beneficios?: string[]; cultura?: string; dia?: string; fotos?: string[]; valores?: string[] };

export const BENEFICIOS_SUGERIDOS = [
  "Seguro médico complementario", "Transporte o dieta de transporte", "Almuerzo o comedor", "Bono por desempeño", "Comisiones",
  "Uniforme", "Capacitación pagada", "Plan de carrera", "Horario flexible", "Trabajo híbrido", "Día libre en tu cumpleaños",
  "Bono navideño adicional", "Cooperativa", "Descuentos para empleados", "Parqueo", "Seguro de vida",
];

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
const urlFoto = (v: unknown) => (typeof v === "string" && /^https:\/\/[a-z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/empresas\//i.test(v) ? v : null);

/** Limpia lo que viene de la base para que nunca se muestre algo raro. */
export function marcaDe(v: unknown): Marca {
  if (!v || typeof v !== "object") return {};
  const o = v as Record<string, unknown>;
  const lista = (x: unknown, n: number, max: number) => (Array.isArray(x) ? x.map((s) => texto(s, max)).filter((s): s is string => !!s).slice(0, n) : []);
  return {
    logo: urlFoto(o["logo"]) ?? undefined,
    beneficios: lista(o["beneficios"], 12, 60),
    cultura: texto(o["cultura"], 900),
    dia: texto(o["dia"], 900),
    fotos: Array.isArray(o["fotos"]) ? o["fotos"].map(urlFoto).filter((s): s is string => !!s).slice(0, 6) : [],
    valores: lista(o["valores"], 5, 40),
  };
}

export function useMarca(empresaId: string | null | undefined) {
  return useQuery({
    queryKey: ["marca", empresaId ?? null],
    enabled: !!empresaId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Marca> => {
      const { data } = await supabase.rpc("empresa_marca" as never, { p_empresa: empresaId } as never);
      return marcaDe(data);
    },
  });
}

export type PasoPerfil = { id: string; t: string; ok: boolean; peso: number; por: string };

/** Qué tan completo está el perfil, con el porqué de cada paso (lo que gana la empresa). */
export function pasosPerfil(e: { descripcion: string | null; sector: string | null; provincia: string | null; sitio_web: string | null; contacto_telefono: string | null }, m: Marca, vacantesClaras: number): PasoPerfil[] {
  return [
    { id: "logo", t: "Sube tu logo", ok: !!m.logo, peso: 10, por: "La gente confía más en una empresa que reconoce." },
    { id: "desc", t: "Cuenta a qué se dedican", ok: (e.descripcion ?? "").trim().length >= 80, peso: 15, por: "Es lo primero que lee quien duda si aplicar." },
    { id: "datos", t: "Sector, provincia y teléfono", ok: !!(e.sector && e.provincia && e.contacto_telefono), peso: 10, por: "Además, te verificamos más rápido." },
    { id: "beneficios", t: "Al menos 3 beneficios", ok: (m.beneficios?.length ?? 0) >= 3, peso: 15, por: "Después del sueldo, es lo que más compara un candidato." },
    { id: "cultura", t: "Cómo es trabajar aquí", ok: (m.cultura ?? "").length >= 60, peso: 10, por: "Atrae a quien encaja y ahorra entrevistas con quien no." },
    { id: "dia", t: "Un día normal en tu empresa", ok: (m.dia ?? "").length >= 60, peso: 10, por: "Imaginarse ahí quita el miedo a lo desconocido." },
    { id: "fotos", t: "2 fotos o más del equipo o el lugar", ok: (m.fotos?.length ?? 0) >= 2, peso: 15, por: "Las fotos reales muestran que la empresa existe y cómo es." },
    { id: "web", t: "Tu sitio web o red social", ok: !!e.sitio_web, peso: 5, por: "Otra señal de que eres una empresa real." },
    { id: "clara", t: "Una vacante clara 6/6", ok: vacantesClaras > 0, peso: 10, por: "Sale primero entre las de su día y se puede filtrar." },
  ];
}
export const porcentajePerfil = (ps: PasoPerfil[]) => ps.reduce((s, p) => s + (p.ok ? p.peso : 0), 0);

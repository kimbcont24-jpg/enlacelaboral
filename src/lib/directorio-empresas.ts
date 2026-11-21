import { esSectorPublico, esZonaFranca } from "@/lib/colecciones";
import { slug } from "@/lib/empleos";
import { CONSULTORA, puntajeClaridad, selloDe, type Sello } from "@/lib/motivar-empresas";
import { FUENTES_ALIADAS } from "@/lib/portada";
import type { Vacante } from "@/lib/vacantes";

/**
 * Directorio «Empresas contratando» (/empresas-contratando).
 * Agrupa las vacantes publicadas por empresa y deja solo lo que la página necesita,
 * para que el listado pese poco aunque haya cientos de vacantes.
 */

export type Sector = "publico" | "zona-franca" | "privado";

export type FilaDirectorio = {
  slug: string;
  nombre: string;
  vacantes: number;
  /** Vacantes publicadas en los últimos 7 días. */
  nuevas: number;
  /** Fecha ISO de su vacante más reciente. */
  ultima: string;
  areas: string[];
  provincias: string[];
  puestos: string[];
  /** % de sus vacantes que dicen el sueldo. */
  conSueldo: number;
  /** Sueldo mínimo más alto publicado (0 si no publica). */
  topSueldo: number;
  sinExperiencia: number;
  remotas: number;
  sector: Sector;
  /** Publica directo con Enlace (correo, formulario, WhatsApp o panel). */
  aliada: boolean;
  /** Consultora o reclutadora que publica para otras empresas. */
  recluta: boolean;
  puntaje: number;
  sello: Pick<Sello, "nivel" | "t" | "color" | "fondo" | "borde" | "siguiente"> | null;
};

const SIETE_DIAS = 7 * 864e5;
const ordenPorCuenta = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
const provinciaCorta = (p: string) => p.replace(/\s*\(.*?\)\s*/g, "").trim();

export function directorioEmpresas(jobs: Vacante[], ahora = Date.now()): FilaDirectorio[] {
  const grupos = new Map<string, { nombre: string; js: Vacante[] }>();
  for (const j of jobs) {
    const e = j.empresa?.trim();
    if (!e || e === "Empresa no indicada" || /confidencial/i.test(e)) continue;
    const k = slug(e);
    if (!k) continue;
    const g = grupos.get(k) ?? { nombre: e, js: [] };
    g.js.push(j);
    grupos.set(k, g);
  }

  return [...grupos.entries()].map(([s, g]) => {
    const areas = new Map<string, number>();
    const provs = new Map<string, number>();
    const puestos = new Map<string, number>();
    let ultima = "";
    let nuevas = 0;
    for (const j of g.js) {
      if (j.area) areas.set(j.area, (areas.get(j.area) ?? 0) + 1);
      const p = provinciaCorta(j.provincia || "");
      if (p && !/^toda/i.test(p)) provs.set(p, (provs.get(p) ?? 0) + 1);
      const t = j.titulo.trim();
      if (t) puestos.set(t, (puestos.get(t) ?? 0) + 1);
      if (!ultima || j.creado > ultima) ultima = j.creado;
      if (ahora - new Date(j.creado).getTime() < SIETE_DIAS) nuevas++;
    }
    const puntaje = puntajeClaridad(g.js);
    const sello = selloDe(puntaje, g.js.length);
    const publico = g.js.filter(esSectorPublico).length;
    const franca = g.js.filter(esZonaFranca).length;
    return {
      slug: s,
      nombre: g.nombre,
      vacantes: g.js.length,
      nuevas,
      ultima,
      areas: ordenPorCuenta(areas),
      provincias: ordenPorCuenta(provs),
      puestos: ordenPorCuenta(puestos).slice(0, 4),
      conSueldo: Math.round((g.js.filter((j) => j.salarioMin > 0).length / g.js.length) * 100),
      topSueldo: Math.max(0, ...g.js.map((j) => j.salarioMin || 0)),
      sinExperiencia: g.js.filter((j) => /sin experiencia/i.test(j.experiencia)).length,
      remotas: g.js.filter((j) => /remoto/i.test(j.modalidad) || /remoto/i.test(j.provincia)).length,
      sector: publico * 2 > g.js.length ? "publico" : franca * 2 > g.js.length ? "zona-franca" : "privado",
      aliada: g.js.some((j) => FUENTES_ALIADAS.includes(j.fuente)),
      recluta: CONSULTORA.test(g.nombre),
      puntaje,
      sello: sello ? { nivel: sello.nivel, t: sello.t, color: sello.color, fondo: sello.fondo, borde: sello.borde, siguiente: sello.siguiente } : null,
    } satisfies FilaDirectorio;
  });
}

export const FILTROS = [
  { id: "", t: "Todas" },
  { id: "nuevas", t: "Nuevas esta semana" },
  { id: "sueldo", t: "Dicen el sueldo" },
  { id: "aliadas", t: "Publican directo" },
  { id: "sin-experiencia", t: "Primer empleo" },
  { id: "remoto", t: "Desde casa" },
  { id: "publico", t: "Sector público" },
  { id: "zona-franca", t: "Zonas francas" },
] as const;
export type FiltroId = (typeof FILTROS)[number]["id"];

export const ORDENES = [
  { id: "vacantes", t: "Más vacantes" },
  { id: "recientes", t: "Más recientes" },
  { id: "claras", t: "Más claras" },
  { id: "az", t: "A – Z" },
] as const;
export type OrdenId = (typeof ORDENES)[number]["id"];

export function pasaFiltro(f: FilaDirectorio, filtro: string): boolean {
  switch (filtro) {
    case "nuevas": return f.nuevas > 0;
    case "sueldo": return f.conSueldo > 0;
    case "aliadas": return f.aliada;
    case "sin-experiencia": return f.sinExperiencia > 0;
    case "remoto": return f.remotas > 0;
    case "publico": return f.sector === "publico";
    case "zona-franca": return f.sector === "zona-franca";
    default: return true;
  }
}

export function ordenar(filas: FilaDirectorio[], orden: string): FilaDirectorio[] {
  const az = (a: FilaDirectorio, b: FilaDirectorio) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
  const copia = [...filas];
  switch (orden) {
    case "recientes": return copia.sort((a, b) => b.ultima.localeCompare(a.ultima) || az(a, b));
    case "claras": return copia.sort((a, b) => b.puntaje - a.puntaje || b.vacantes - a.vacantes || az(a, b));
    case "az": return copia.sort(az);
    default: return copia.sort((a, b) => b.vacantes - a.vacantes || b.ultima.localeCompare(a.ultima) || az(a, b));
  }
}

/** Letra del índice A–Z (sin acentos; números y símbolos van a «#»). */
export function letraDe(nombre: string): string {
  const c = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : c === "Ñ" ? "N" : "#";
}

export const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

import { areas, provincias } from "@/lib/data";
import type { Vacante } from "@/lib/vacantes";

/**
 * Páginas de empleos por provincia, área y empresa: /empleos/santiago, /empleos/ventas, /empleos/claro.
 * Sirven para que Google indexe "empleos en Santiago" y para que cada empresa tenga su página.
 */
export type Landing = { tipo: "provincia" | "area" | "empresa"; nombre: string; slug: string };

export function slug(texto: string): string {
  return texto
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const nombreCorto = (p: string) => p.replace(/\s*\(.*?\)\s*/g, "").replace("Remoto desde RD", "Remoto");

export const landingsProvincia: Landing[] = provincias.slice(1).map((p) => ({ tipo: "provincia", nombre: p, slug: slug(nombreCorto(p)) }));
export const landingsArea: Landing[] = areas.map((a) => ({ tipo: "area", nombre: a, slug: slug(a) }));

export function landingEmpresa(empresa: string): Landing {
  return { tipo: "empresa", nombre: empresa, slug: slug(empresa) };
}

/** Resuelve un slug contra provincias, áreas y, por último, las empresas presentes en las vacantes. */
export function resolverLanding(s: string, jobs: Vacante[]): Landing | null {
  const fija = [...landingsProvincia, ...landingsArea].find((l) => l.slug === s);
  if (fija) return fija;
  const empresa = jobs.map((j) => j.empresa).find((e) => e && slug(e) === s);
  return empresa ? landingEmpresa(empresa) : null;
}

export function filtrarLanding(l: Landing, jobs: Vacante[]): Vacante[] {
  if (l.tipo === "provincia") return jobs.filter((j) => j.provincia === l.nombre || (l.nombre === "Remoto desde RD" && j.modalidad === "Remoto"));
  if (l.tipo === "area") return jobs.filter((j) => j.area === l.nombre);
  return jobs.filter((j) => j.empresa === l.nombre);
}

export function tituloLanding(l: Landing): string {
  if (l.tipo === "provincia") return l.nombre === "Remoto desde RD" ? "Empleos remotos desde República Dominicana" : `Empleos en ${nombreCorto(l.nombre)}`;
  if (l.tipo === "area") return `Empleos de ${l.nombre}`;
  return `Vacantes en ${l.nombre}`;
}

export function descripcionLanding(l: Landing, n: number): string {
  const cuantas = n === 1 ? "1 vacante publicada" : `${n} vacantes publicadas`;
  if (l.tipo === "provincia") return `${cuantas} ${l.nombre === "Remoto desde RD" ? "para trabajar desde casa" : `en ${nombreCorto(l.nombre)}`} en los últimos 30 días. Con salario visible cuando la empresa lo indica y aplicación gratis.`;
  if (l.tipo === "area") return `${cuantas} de ${l.nombre} en República Dominicana en los últimos 30 días. Aplica gratis, sin cuenta.`;
  return `${cuantas} de ${l.nombre} en Enlace Laboral. Información clara y aplicación directa.`;
}

/** Empresas con vacantes activas, con su cantidad, para listados y sitemap. */
export function empresasActivas(jobs: Vacante[]): { nombre: string; slug: string; total: number }[] {
  const m = new Map<string, number>();
  for (const j of jobs) if (j.empresa && j.empresa !== "Empresa no indicada") m.set(j.empresa, (m.get(j.empresa) ?? 0) + 1);
  return [...m].map(([nombre, total]) => ({ nombre, slug: slug(nombre), total })).sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
}

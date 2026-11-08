import type { Vacante } from "@/lib/vacantes";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const VACIAS = new Set(["de", "del", "la", "el", "los", "las", "en", "y", "para", "con", "a", "o", "e", "auxiliar", "asistente", "encargado", "encargada", "senior", "junior"]);

/** Raíces de las palabras importantes del puesto ("Cajera de tienda" → ["caje", "tien"]). */
function raices(titulo: string): string[] {
  return norm(titulo).replace(/[^a-z\s]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !VACIAS.has(w)).map((w) => w.slice(0, Math.max(4, w.length - 2)));
}

const pct = (xs: number[], p: number) => { const i = (xs.length - 1) * p; const a = Math.floor(i), b = Math.ceil(i); return Math.round((xs[a]! + (xs[b]! - xs[a]!) * (i - a)) / 500) * 500; };

export type Mercado = { n: number; bajo: number; medio: number; alto: number; provincia: boolean };

/** Salario de vacantes parecidas publicadas en Enlace Laboral (solo las que dicen cuánto pagan). */
export function salarioMercado(titulo: string, provincia: string, jobs: Vacante[], excluir?: string): Mercado | null {
  const rs = raices(titulo);
  if (!rs.length) return null;
  const parecidas = jobs.filter((j) => j.id !== excluir && j.salarioMin >= 8000 && j.salarioMin <= 400000 && rs.some((r) => norm(j.titulo).includes(r)));
  const deProv = parecidas.filter((j) => j.provincia === provincia);
  const uso = deProv.length >= 4 ? deProv : parecidas;
  if (uso.length < 3) return null;
  const xs = uso.map((j) => (j.salarioMax ? (j.salarioMin + j.salarioMax) / 2 : j.salarioMin)).sort((a, b) => a - b);
  return { n: uso.length, bajo: pct(xs, 0.25), medio: pct(xs, 0.5), alto: pct(xs, 0.75), provincia: uso === deProv };
}

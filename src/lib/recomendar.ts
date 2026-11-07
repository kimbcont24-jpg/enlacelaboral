import type { CV } from "@/lib/cv";
import type { Vacante } from "@/lib/vacantes";

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const VACIAS = new Set("para como con sin por los las del una uno que sus este esta muy mas trabajo empresa servicio general area nivel manejo conocimiento experiencia".split(" "));
const palabras = (t: string) => sinAcentos(t).replace(/[^a-z0-9ñ+# ]/g, " ").split(/\s+/).filter((w) => w.length >= 4 && !VACIAS.has(w));

export type Recomendada = { job: Vacante; puntos: number; porque: string[] };

/**
 * Vacantes que se parecen al CV: compara el puesto que busca, sus puestos anteriores y sus habilidades
 * con el título y los requisitos de cada vacante. Suma si queda en su ciudad. Solo usa lo que la persona escribió.
 */
export function recomendar(cv: CV | null, jobs: Vacante[], excluir: Set<string>, max = 6): Recomendada[] {
  if (!cv) return [];
  const habilidades = cv.habilidades.split(/,|\n/).map((h) => h.trim()).filter((h) => h.length > 2);
  const puestos = [cv.puesto, ...cv.experiencia.map((e) => e.puesto)].filter((x) => x.trim());
  if (!habilidades.length && !puestos.length) return [];
  const ciudad = sinAcentos(cv.ciudad.trim());
  const out: Recomendada[] = [];
  for (const job of jobs) {
    if (excluir.has(job.id)) continue;
    const titulo = sinAcentos(job.titulo);
    const resto = sinAcentos(`${job.requisitos.join(" ")} ${job.descripcion.slice(0, 1500)} ${job.area}`);
    let puntos = 0;
    const porque: string[] = [];
    for (const [i, p] of puestos.entries()) {
      const ws = palabras(p);
      if (ws.length && ws.filter((w) => titulo.includes(w)).length / ws.length >= 0.6) { puntos += i === 0 ? 6 : 3; if (!porque.includes(p.trim())) porque.push(p.trim()); }
    }
    for (const h of habilidades) {
      const ws = palabras(h);
      if (ws.length && ws.every((w) => titulo.includes(w) || resto.includes(w))) { puntos += 1.5; porque.push(h); }
    }
    if (puntos > 0 && ciudad.length > 3 && sinAcentos(job.provincia).includes(ciudad.split(/[ ,]/)[0]!)) { puntos += 2; porque.push(job.provincia); }
    if (puntos >= 3) out.push({ job, puntos, porque: [...new Set(porque)].slice(0, 3) });
  }
  return out.sort((a, b) => b.puntos - a.puntos || b.job.creado.localeCompare(a.job.creado)).slice(0, max);
}

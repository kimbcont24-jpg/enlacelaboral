import type { Vacante } from "@/lib/vacantes";

/** Perfil rápido de Descubrir: se guarda en el navegador, sin cuenta. */
export type Perfil = {
  provincias: string[];
  areas: string[];
  experiencia: "" | "Sin experiencia" | "1-3 años" | "3+ años";
  salarioMin: number;
};

export const PERFIL_VACIO: Perfil = { provincias: [], areas: [], experiencia: "", salarioMin: 0 };
const CLAVE = "enlace-descubrir-perfil";

export const leerPerfil = (): Perfil | null => {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? "null") as Partial<Perfil> | null;
    if (!v || typeof v !== "object") return null;
    return { ...PERFIL_VACIO, ...v, provincias: Array.isArray(v.provincias) ? v.provincias : [], areas: Array.isArray(v.areas) ? v.areas : [] };
  } catch { return null; }
};
export const guardarPerfil = (p: Perfil) => { try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch { /* sin almacenamiento */ } };
export const perfilListo = (p: Perfil) => p.provincias.length > 0 || p.areas.length > 0 || p.experiencia !== "" || p.salarioMin > 0;

const nivel = (e: string) => (e === "3+ años" ? 2 : e === "1-3 años" ? 1 : 0);
const diasDesde = (iso: string) => (Date.now() - new Date(iso).getTime()) / 864e5;

/** Lo que el perfil aprende de lo que guardas o pasas. */
export type Aprendido = { areas: Record<string, number>; empresas: Record<string, number> };
export const aprender = (jobs: Vacante[], guardadas: string[], pasadas: string[]): Aprendido => {
  const porId = new Map(jobs.map((j) => [j.id, j]));
  const a: Aprendido = { areas: {}, empresas: {} };
  for (const id of guardadas) { const j = porId.get(id); if (!j) continue; a.areas[j.area] = (a.areas[j.area] ?? 0) + 1; if (j.empresa) a.empresas[j.empresa] = (a.empresas[j.empresa] ?? 0) + 1; }
  for (const id of pasadas) { const j = porId.get(id); if (!j) continue; a.areas[j.area] = (a.areas[j.area] ?? 0) - 0.5; }
  return a;
};

const pesos = (n: number) => `RD$${n.toLocaleString("es-DO")}`;

export type Lectura = { puntos: number; razones: string[]; avisos: string[] };

/** Explica, con palabras simples, por qué una vacante encaja (o qué pide de más). */
export function leer(job: Vacante, p: Perfil, ap: Aprendido): Lectura {
  const razones: string[] = [];
  const avisos: string[] = [];
  let puntos = 0;

  const remoto = job.modalidad === "Remoto" || job.provincia === "Remoto desde RD";
  if (p.provincias.length > 0) {
    if (p.provincias.includes(job.provincia)) { puntos += 3; razones.push(`Está en ${job.provincia}`); }
    else if (remoto) { puntos += 2.5; razones.push("Es remoto: aplica desde donde estés"); }
    else avisos.push(`Está en ${job.provincia}`);
  }

  if (p.areas.length > 0) {
    if (p.areas.includes(job.area)) { puntos += 3; razones.push(`Es de ${job.area}`); }
  }

  const nj = nivel(job.experiencia);
  if (p.experiencia) {
    const nu = nivel(p.experiencia);
    if (nj === 0) { puntos += 2; razones.push("No pide experiencia"); }
    else if (nj <= nu) { puntos += 2; razones.push(`Pide ${job.experiencia}, como tú`); }
    else avisos.push(`Pide ${job.experiencia}`);
  } else if (nj === 0) razones.push("No pide experiencia");

  if (p.salarioMin > 0 && job.salarioMin > 0) {
    if (job.salarioMin >= p.salarioMin) { puntos += 1.5; razones.push(`Paga desde ${pesos(job.salarioMin)}`); }
    else avisos.push(`Paga desde ${pesos(job.salarioMin)}, menos de lo que pediste`);
  }

  const texto = job.requisitos.join(" · ").toLowerCase();
  if (/ingl[eé]s|english|biling/.test(texto)) avisos.push("Pide inglés");
  if (/licencia de conducir|licencia (categor|cat\.|vigente)/.test(texto)) avisos.push("Pide licencia de conducir");
  if (/veh[ií]culo propio|motor propio|carro propio|motocicleta propia/.test(texto)) avisos.push("Pide vehículo o motor propio");
  if (/licenciatura|t[ií]tulo universitario|graduado universitario|ingenier[oí]a|grado universitario/.test(texto) && !/estudiante/.test(texto)) avisos.push("Pide título universitario");

  const d = diasDesde(job.creado);
  if (d <= 1) { puntos += 0.6; razones.push("Publicada hoy"); }
  else if (d <= 3) { puntos += 0.3; razones.push("Publicada esta semana"); }
  if (job.destacada) puntos += 0.5;

  const afin = (ap.areas[job.area] ?? 0) + (job.empresa ? (ap.empresas[job.empresa] ?? 0) * 1.5 : 0);
  if (afin >= 1 && !razones.some((r) => r.startsWith("Es de "))) razones.push("Parecida a las que guardaste");
  puntos += Math.max(-1.5, Math.min(2, afin * 0.5));

  return { puntos, razones: razones.slice(0, 3), avisos: avisos.slice(0, 2) };
}

export const encaja = (l: Lectura) => l.puntos >= 3;

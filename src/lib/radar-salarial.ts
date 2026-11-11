import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/**
 * Radar salarial dominicano.
 * Fuente única: salarios publicados en vacantes de Enlace Laboral (últimos 12 meses).
 * No es una encuesta de mercado: por eso siempre se muestra cuántas vacantes hay detrás
 * de cada cifra y no se calculan cifras con muestras pequeñas.
 */

export const MESES = 12;
/** Debajo de esto no se calcula nada: solo se muestran las ofertas una por una. */
export const MIN_CALCULO = 3;
/** Desde aquí se muestra el rango típico (25 %–75 %) y la comparación de una oferta. */
export const MIN_RANGO = 10;
/** Desde aquí la muestra se considera amplia. */
export const MIN_AMPLIA = 30;
/** Mínimo para entrar al ranking de puestos y a la tabla por área. */
export const MIN_RANKING = 5;

const PISO = 8_000;
const TECHO = 400_000;

export type Observacion = {
  titulo: string;
  area: string;
  provincia: string;
  tipo: string;
  experiencia: string;
  salarioMin: number;
  salarioMax: number | null;
  /** Valor que se usa en los cálculos: punto medio del rango, o el salario único. */
  valor: number;
  fecha: string;
  stems: string[];
  grupo: string;
};

export type Nivel = "insuficiente" | "pequena" | "moderada" | "amplia";

export type Resumen = {
  n: number;
  nivel: Nivel;
  min: number;
  max: number;
  p25: number;
  mediana: number;
  p75: number;
  valores: number[];
};

// ---------- Texto de puestos ----------

export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const VACIAS = new Set(["de", "del", "la", "el", "los", "las", "en", "y", "para", "con", "a", "o", "e", "un", "una", "al", "cuanto", "gana", "ganan", "paga", "pagan", "salario", "sueldo", "que", "rango", "ofrecen", "puesto", "como", "mes", "rd"]);

/** Formas distintas de decir lo mismo en las vacantes dominicanas. */
const SINONIMOS: [RegExp, string][] = [
  [/\brr\s*\.?\s*hh\s*\.?|\brrhh\b/g, " recursos humanos "],
  [/\bgestion humana\b|\btalento humano\b|\bcapital humano\b/g, " recursos humanos "],
  [/\baux\b\.?/g, " auxiliar "],
  [/\basist\b\.?/g, " asistente "],
  [/\bencarg\b\.?/g, " encargado "],
  [/\bsupv?\b\.?/g, " supervisor "],
  [/\bcontable\b/g, " contabilidad "],
  [/\bcontador(a|es|as)?\b/g, " contador "],
  [/\bti\b|\bit\b/g, " tecnologia "],
  [/\bcall\s*center\b|\bcentro de llamadas\b/g, " callcenter "],
  [/\bservicio al cliente\b|\batencion al cliente\b/g, " servicioalcliente "],
];

const limpiarTitulo = (t: string) =>
  norm(t)
    .replace(/\(.*?\)/g, " ")
    .replace(/\s[-–|].*$/, " ")
    .replace(/\s*(masculino|femenina|femenino)\s*$/, " ");

/** Raíces de las palabras importantes: "Auxiliar de Contabilidad" y "Auxiliar contable" dan lo mismo. */
export function raices(texto: string): string[] {
  let t = ` ${limpiarTitulo(texto)} `;
  for (const [re, por] of SINONIMOS) t = t.replace(re, por);
  return t
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !VACIAS.has(w))
    // Sin género ni plural ("cajera"/"cajeros" → "cajer"), y raíz de 6 letras ("contabilidad" → "contab").
    .map((w) => (w.length > 4 ? w.replace(/(as|os|es|a|o|s)$/, "") : w).slice(0, 6));
}

/** Clave para juntar vacantes del mismo puesto (las 3 primeras palabras importantes). */
const claveGrupo = (stems: string[]) => stems.slice(0, 3).join(" ");

// ---------- Estadística ----------

const percentil = (xs: number[], p: number) => {
  const i = (xs.length - 1) * p;
  const a = Math.floor(i), b = Math.ceil(i);
  return xs[a]! + (xs[b]! - xs[a]!) * (i - a);
};
const redondear = (n: number) => Math.round(n / 500) * 500;

export function nivelDe(n: number): Nivel {
  if (n < MIN_CALCULO) return "insuficiente";
  if (n < MIN_RANGO) return "pequena";
  if (n < MIN_AMPLIA) return "moderada";
  return "amplia";
}

export function resumir(obs: Observacion[]): Resumen | null {
  if (!obs.length) return null;
  const xs = obs.map((o) => o.valor).sort((a, b) => a - b);
  return {
    n: xs.length,
    nivel: nivelDe(xs.length),
    min: xs[0]!,
    max: xs[xs.length - 1]!,
    p25: redondear(percentil(xs, 0.25)),
    mediana: redondear(percentil(xs, 0.5)),
    p75: redondear(percentil(xs, 0.75)),
    valores: xs,
  };
}

/** De cada 10 vacantes parecidas, cuántas pagan menos que esta oferta. */
export function posicion(oferta: number, r: Resumen): number {
  const menores = r.valores.filter((v) => v < oferta).length;
  const iguales = r.valores.filter((v) => v === oferta).length;
  return Math.round(((menores + iguales / 2) / r.n) * 10);
}

// ---------- Filtros y búsquedas ----------

export type Filtro = { q?: string; area?: string; provincia?: string; experiencia?: string; todas?: boolean };

export const TIPOS_COMPARABLES = new Set(["Tiempo completo", "Por proyecto"]);

export function filtrar(obs: Observacion[], f: Filtro): Observacion[] {
  const qs = f.q ? raices(f.q) : [];
  return obs.filter((o) =>
    (f.todas || TIPOS_COMPARABLES.has(o.tipo)) &&
    (!f.area || o.area === f.area) &&
    (!f.provincia || o.provincia === f.provincia) &&
    (!f.experiencia || o.experiencia === f.experiencia) &&
    qs.every((q) => o.stems.includes(q)),
  );
}

export type Grupo = { clave: string; nombre: string; obs: Observacion[]; resumen: Resumen };

/** Junta las observaciones por puesto. El nombre es el título más repetido del grupo. */
export function agrupar(obs: Observacion[]): Grupo[] {
  const mapa = new Map<string, Observacion[]>();
  for (const o of obs) {
    if (!o.grupo) continue;
    const l = mapa.get(o.grupo);
    if (l) l.push(o); else mapa.set(o.grupo, [o]);
  }
  return [...mapa.entries()].map(([clave, l]) => {
    const conteo = new Map<string, number>();
    for (const o of l) { const t = bonito(o.titulo); conteo.set(t, (conteo.get(t) ?? 0) + 1); }
    const abrev = (t: string) => (t.match(/\./g) ?? []).length;
    const nombre = [...conteo.entries()].sort((a, b) => b[1] - a[1] || abrev(a[0]) - abrev(b[0]) || b[0].length - a[0].length)[0]![0];
    return { clave, nombre, obs: l, resumen: resumir(l)! };
  });
}

const bonito = (t: string) => {
  const s = t.replace(/\s*\(.*?\)\s*/g, " ").replace(/\s[-–|].*$/, "").replace(/\s+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/\b(rrhh|rr\.hh\.|ti|it)\b/gi, (m) => m.toUpperCase());
};

export type FilaArea = { area: string; resumen: Resumen };
export function porArea(obs: Observacion[]): FilaArea[] {
  const mapa = new Map<string, Observacion[]>();
  for (const o of obs) { const l = mapa.get(o.area); if (l) l.push(o); else mapa.set(o.area, [o]); }
  return [...mapa.entries()].map(([area, l]) => ({ area, resumen: resumir(l)! })).sort((a, b) => b.resumen.n - a.resumen.n);
}

// ---------- Datos ----------

type Fila = { titulo: string; area: string; provincia: string; tipo: string; experiencia: string; salario_min: number; salario_max: number | null; created_at: string };

export function aObservaciones(filas: Fila[]): Observacion[] {
  const vistas = new Set<string>();
  const out: Observacion[] = [];
  for (const r of filas) {
    const min = Number(r.salario_min) || 0;
    const max = r.salario_max && r.salario_max > min ? Number(r.salario_max) : null;
    const valor = max ? (min + max) / 2 : min;
    if (min < PISO || valor > TECHO) continue;
    // Una vacante republicada o cargada dos veces cuenta una sola vez.
    const id = `${claveGrupo(raices(r.titulo))}|${min}|${max ?? ""}|${r.provincia}`;
    if (vistas.has(id)) continue;
    vistas.add(id);
    const stems = raices(r.titulo);
    out.push({ titulo: r.titulo, area: r.area, provincia: r.provincia, tipo: r.tipo, experiencia: r.experiencia, salarioMin: min, salarioMax: max, valor, fecha: r.created_at, stems, grupo: claveGrupo(stems) });
  }
  return out;
}

export async function fetchObservaciones(): Promise<Observacion[]> {
  const desde = new Date();
  desde.setMonth(desde.getMonth() - MESES);
  const { data, error } = await supabase
    .from("vacantes")
    .select("titulo,area,provincia,tipo,experiencia,salario_min,salario_max,created_at")
    .eq("estado", "publicada")
    .gt("salario_min", 0)
    .gte("created_at", desde.toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return aObservaciones((data ?? []) as unknown as Fila[]);
}

export function useObservaciones() {
  const q = useQuery({ queryKey: ["radar-salarial"], queryFn: fetchObservaciones, staleTime: 5 * 60_000 });
  return { obs: q.data ?? [], cargando: q.isLoading, error: q.isError };
}

export const pesos = (n: number) => `RD$${Math.round(n).toLocaleString("es-DO")}`;
export const pesosCortos = (n: number) => (n >= 1000 ? `RD$${Math.round(n / 1000).toLocaleString("es-DO")}k` : pesos(n));

export const TEXTO_NIVEL: Record<Nivel, { t: string; d: string; tono: string }> = {
  insuficiente: { t: "Datos insuficientes", d: "Hay muy pocas vacantes para calcular algo. Te mostramos cada oferta tal como se publicó.", tono: "bg-muted text-muted-foreground" },
  pequena: { t: "Muestra pequeña", d: "Orientativo. Son pocas vacantes: no lo tomes como el salario del mercado.", tono: "bg-[#fff4cc] text-[#7a5a00]" },
  moderada: { t: "Muestra moderada", d: "Ya da una idea útil de lo que se ofrece, pero puede cambiar con nuevas vacantes.", tono: "bg-[#e3efff] text-[#1557c4]" },
  amplia: { t: "Muestra amplia", d: "Hay suficientes vacantes para ver un patrón claro de lo que se publica.", tono: "bg-[#dcf5e8] text-[#0f7a45]" },
};

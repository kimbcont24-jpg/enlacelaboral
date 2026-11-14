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
  id: string;
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
  /** "ficha": el salario venía en su campo. "texto": lo dijo la descripción (por ejemplo, el flyer). */
  fuente: "ficha" | "texto";
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

type Fila = { id: string; titulo: string; area: string; provincia: string; tipo: string; experiencia: string; salario_min: number; salario_max: number | null; created_at: string; descripcion?: string | null };

const NUM = String.raw`(\d{1,3}(?:[,.]\d{3})+|\d{4,6})(?:\.\d{2})?`;
const RE_TEXTO = new RegExp(String.raw`(?:salario|sueldo|pago|paga|ofrecemos)[^\n\d]{0,45}?(?:RD\$|DOP|\$)?\s*` + NUM + String.raw`(?:\s*(?:-|–|a|hasta|y)\s*(?:RD\$|\$)?\s*` + NUM + ")?", "i");
const RE_RD = new RegExp(String.raw`RD\$\s*` + NUM + String.raw`(?:\s*(?:-|–|a|hasta)\s*(?:RD\$)?\s*` + NUM + ")?", "i");
const aNumero = (t?: string) => (t ? Number(t.replace(/[.,](?=\d{3}\b)/g, "").replace(/,/g, "")) : 0);

/**
 * Salario dicho en la descripción cuando la ficha no lo trae ("Salario publicado en el flyer: RD$27,987").
 * Solo montos mensuales en pesos: se descartan dólares, por hora y por día; quincenal y semanal se pasan a mes.
 */
const COBRO = /se paga|pagar|inscripci|deposit|gasto|reembols|cuota|costo|tarifa|cargo por|en efectivo/;
const SALARIO_MIN_REAL = 10_000;
export function salarioDelTexto(texto: string | null | undefined): { min: number; max: number | null } | null {
  if (!texto) return null;
  const m = texto.match(RE_TEXTO) ?? texto.match(RE_RD);
  if (!m || m.index === undefined) return null;
  const alrededor = norm(texto.slice(Math.max(0, m.index - 12), m.index + m[0].length + 30));
  if (/us\$|usd|dolar|por hora|la hora|\/hora|diario|por dia|al dia/.test(alrededor)) return null;
  // Cobros al candidato (inscripción, depósito, gastos, no reembolsable): no son salario. Ej.: «se paga RD$1,000 por gastos».
  if (COBRO.test(alrededor)) return null;
  const factor = /quincena/.test(alrededor) ? 2 : /semana/.test(alrededor) ? 4.33 : 1;
  const min = Math.round(aNumero(m[1]) * factor);
  const max2 = Math.round(aNumero(m[2]) * factor);
  // Menos de RD$10,000 al mes no es un sueldo real (está por debajo de cualquier mínimo): se ignora.
  if (!min || min < SALARIO_MIN_REAL) return null;
  return { min, max: max2 > min ? max2 : null };
}

const ES_PRUEBA = /ejemplo de prueba|\bprueba\b.*\bejemplo\b|\btest\b/i;

export function aObservaciones(filas: Fila[]): Observacion[] {
  const vistas = new Set<string>();
  const out: Observacion[] = [];
  for (const r of filas) {
    if (ES_PRUEBA.test(r.titulo)) continue;
    let min = Number(r.salario_min) || 0;
    let max = r.salario_max && r.salario_max > min ? Number(r.salario_max) : null;
    let fuente: Observacion["fuente"] = "ficha";
    if (!min) {
      const t = salarioDelTexto(r.descripcion);
      if (!t) continue;
      ({ min, max } = t);
      fuente = "texto";
    }
    const valor = max ? (min + max) / 2 : min;
    if (min < PISO || valor > TECHO) continue;
    // Una vacante republicada o cargada dos veces cuenta una sola vez.
    const stems = raices(r.titulo);
    const id = `${claveGrupo(stems)}|${min}|${max ?? ""}|${r.provincia}`;
    if (vistas.has(id)) continue;
    vistas.add(id);
    out.push({ id: r.id, titulo: r.titulo, area: r.area, provincia: r.provincia, tipo: r.tipo, experiencia: r.experiencia, salarioMin: min, salarioMax: max, valor, fecha: r.created_at, stems, grupo: claveGrupo(stems), fuente });
  }
  return out;
}

export type DatosRadar = { obs: Observacion[]; total: number; conSalario: number };

const COLUMNAS = "id,titulo,area,provincia,tipo,experiencia,salario_min,salario_max,created_at";

export async function fetchObservaciones(): Promise<DatosRadar> {
  const desde = new Date();
  desde.setMonth(desde.getMonth() - MESES);
  const d = desde.toISOString();
  const base = () => supabase.from("vacantes").select(COLUMNAS).eq("estado", "publicada").gte("created_at", d);
  const [conFicha, conTexto, conteo] = await Promise.all([
    base().gt("salario_min", 0).order("created_at", { ascending: false }).limit(5000),
    supabase.from("vacantes").select(`${COLUMNAS},descripcion`).eq("estado", "publicada").gte("created_at", d).or("salario_min.is.null,salario_min.eq.0")
      .or("descripcion.ilike.%salario%,descripcion.ilike.%sueldo%,descripcion.ilike.%RD$%").limit(3000),
    supabase.from("vacantes").select("id", { count: "exact", head: true }).eq("estado", "publicada").gte("created_at", d),
  ]);
  if (conFicha.error) throw conFicha.error;
  const filas = [...((conFicha.data ?? []) as unknown as Fila[]), ...((conTexto.data ?? []) as unknown as Fila[])];
  const conSalario = filas.filter((f) => !ES_PRUEBA.test(f.titulo) && (Number(f.salario_min) > 0 || salarioDelTexto(f.descripcion))).length;
  return { obs: aObservaciones(filas), total: conteo.count ?? 0, conSalario };
}

export function useObservaciones() {
  const q = useQuery({ queryKey: ["radar-salarial", 2], queryFn: fetchObservaciones, staleTime: 5 * 60_000 });
  return { obs: q.data?.obs ?? [], total: q.data?.total ?? 0, conSalario: q.data?.conSalario ?? 0, cargando: q.isLoading, error: q.isError };
}

// ---------- Referencias oficiales ----------

/** Salario mínimo del sector privado no sectorizado, Resolución CNS-01-2025, vigente desde el 1 de febrero de 2026. */
export const MINIMOS = [
  { t: "Microempresa", v: 16_993.2 },
  { t: "Pequeña empresa", v: 18_421.2 },
  { t: "Mediana empresa", v: 27_489.6 },
  { t: "Gran empresa", v: 29_988 },
] as const;
export const MINIMO_GRANDE = 29_988;

/** Canasta familiar (bienes y servicios de un hogar), Banco Central. */
export const CANASTA = { nacional: 49_613.15, mesNacional: "julio 2026", ozama: 57_384, mesOzama: "septiembre 2026" } as const;

/** Horas de trabajo al mes con la jornada legal de 44 horas semanales. */
export const HORAS_MES = (44 * 52) / 12;

export const FUENTES_RADAR = [
  { nombre: "Salario mínimo 2026 (Resolución CNS-01-2025) — Ministerio de Trabajo", url: "https://mt.gob.do/" },
  { nombre: "Canasta familiar por región y quintil — Banco Central", url: "https://www.bancentral.gov.do/a/d/2534-precios" },
];

export const pesos = (n: number) => `RD$${Math.round(n).toLocaleString("es-DO")}`;
export const pesosCortos = (n: number) => (n >= 1000 ? `RD$${Math.round(n / 1000).toLocaleString("es-DO")}k` : pesos(n));

export const TEXTO_NIVEL: Record<Nivel, { t: string; d: string; tono: string }> = {
  insuficiente: { t: "Datos insuficientes", d: "Hay muy pocas vacantes para calcular algo. Te mostramos cada oferta tal como se publicó.", tono: "bg-muted text-muted-foreground" },
  pequena: { t: "Muestra pequeña", d: "Orientativo. Son pocas vacantes: no lo tomes como el salario del mercado.", tono: "bg-[#fff4cc] text-[#7a5a00]" },
  moderada: { t: "Muestra moderada", d: "Ya da una idea útil de lo que se ofrece, pero puede cambiar con nuevas vacantes.", tono: "bg-[#e3efff] text-[#1557c4]" },
  amplia: { t: "Muestra amplia", d: "Hay suficientes vacantes para ver un patrón claro de lo que se publica.", tono: "bg-[#dcf5e8] text-[#0f7a45]" },
};

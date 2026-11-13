import { useCallback, useEffect, useState } from "react";

import { claridad, nivelDe } from "@/lib/claridad";
import { slug as slugDe } from "@/lib/empleos";
import { salarioMercado } from "@/lib/mercado";
import type { OpinionesEmpresa } from "@/lib/opiniones";
import type { Vacante } from "@/lib/vacantes";

/**
 * Radiografía de una empresa con lo que Enlace sabe de verdad: sus vacantes de los últimos 30 días
 * comparadas con las de todas las demás empresas. Nada se inventa: si no hay datos, no se muestra.
 */

// Centro aproximado de cada provincia (lat, lng) para el mapa.
export const CENTRO_PROVINCIA: Record<string, [number, number]> = {
  "Distrito Nacional": [18.4861, -69.9312], "Santo Domingo": [18.6, -69.6], Santiago: [19.4517, -70.697],
  "La Altagracia (Punta Cana)": [18.62, -68.55], "La Romana": [18.4273, -68.9728], "Puerto Plata": [19.7934, -70.6884],
  "San Cristóbal": [18.42, -70.11], "San Pedro de Macorís": [18.4616, -69.3089], "Duarte (San Francisco)": [19.3, -70.25],
  "La Vega": [19.2222, -70.5296], "Espaillat (Moca)": [19.48, -70.48], "Monseñor Nouel (Bonao)": [18.93, -70.41],
  "Peravia (Baní)": [18.28, -70.33], "Sánchez Ramírez (Cotuí)": [19.05, -70.15], Samaná: [19.2058, -69.3369],
  "María Trinidad Sánchez (Nagua)": [19.38, -69.85], "Hermanas Mirabal (Salcedo)": [19.38, -70.42], "Valverde (Mao)": [19.57, -71.08],
  "Monte Cristi": [19.8473, -71.6458], "Dajabón": [19.55, -71.71], "Santiago Rodríguez": [19.47, -71.34], Azua: [18.45, -70.73],
  "San Juan": [18.8059, -71.2296], Barahona: [18.2085, -71.1008], "Baoruco (Neiba)": [18.49, -71.42], "Independencia (Jimaní)": [18.49, -71.85],
  Pedernales: [18.04, -71.74], "Elías Piña": [18.88, -71.7], "San José de Ocoa": [18.55, -70.51], "Monte Plata": [18.81, -69.78],
  "Hato Mayor": [18.76, -69.26], "El Seibo": [18.77, -69.04],
};

/** Habilidades y requisitos que más se repiten en vacantes dominicanas. */
const HABILIDADES: [string, RegExp][] = [
  ["Bachiller", /bachill/i], ["Universitario", /universitar|licenciad|grado en|ingenier[oa] en|estudiante de/i], ["Técnico", /t[ée]cnico (en|superior)/i],
  ["Excel", /excel/i], ["Microsoft Office", /office|word|power ?point|paquete de oficina/i], ["Inglés", /ingl[ée]s|english|biling/i],
  ["Licencia de conducir", /licencia de (conducir|manejo)|licencia (categor|tipo)/i], ["Vehículo o motor propio", /veh[íi]culo propio|motor propio|motocicleta propia/i],
  ["Servicio al cliente", /servicio al cliente|atenci[óo]n al cliente/i], ["Ventas", /\bventas?\b|vendedor|negociaci/i], ["Manejo de caja", /caja|efectivo|cuadre/i],
  ["Trabajo en equipo", /trabajo en equipo|equipo de trabajo/i], ["Comunicación", /comunicaci[óo]n|redacci[óo]n|expresi[óo]n/i], ["Organización", /organizad|planificaci|orden/i],
  ["Disponibilidad de horario", /disponibilidad|horario rotativo|fines de semana|turnos/i], ["Liderazgo", /liderazgo|supervis|manejo de personal/i],
  ["Contabilidad", /contab|cuentas por|conciliaci/i], ["Inventario", /inventario|almac[ée]n/i], ["SAP / ERP", /\bsap\b|\berp\b/i],
  ["Power BI / datos", /power ?bi|an[áa]lisis de datos|sql/i], ["Redes sociales", /redes sociales|community|marketing digital/i],
  ["Buena presencia", /buena presencia|presentaci[óo]n personal/i], ["Experiencia comprobable", /experiencia (comprobable|demostrable)/i],
];

export type ProvinciaN = { nombre: string; n: number; lat: number; lng: number };
export type SalarioPuesto = { id: string; titulo: string; min: number; max: number | null; mercado: number | null; nMercado: number };
export type Parecida = { nombre: string; slug: string; total: number; claridad: number };

export type Radiografia = {
  total: number;
  ultima: string | null;
  semanas: number[]; // vacantes por semana, de hace 4 semanas a esta
  transparencia: { puntaje: number; percentil: number | null; empresas: number; criterios: { t: string; pct: number }[] } | null;
  conSalario: number;
  salarios: SalarioPuesto[];
  sobreMercado: number; // puestos con salario por encima de la mediana de puestos parecidos
  conMercado: number;
  provincias: ProvinciaN[];
  remoto: number;
  areas: { t: string; n: number }[];
  niveles: { t: string; n: number }[];
  modalidades: { t: string; n: number }[];
  sinExperiencia: number;
  habilidades: { t: string; n: number }[];
  parecidas: Parecida[];
};

const contar = <T,>(xs: T[], f: (x: T) => string) => {
  const m = new Map<string, number>();
  for (const x of xs) { const k = f(x); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].map(([t, n]) => ({ t, n })).sort((a, b) => b.n - a.n);
};

const claridadPct = (vs: Vacante[]) => (vs.length ? vs.reduce((s, j) => { const c = claridad(j); return s + c.puntos / c.total; }, 0) / vs.length * 100 : 0);

export function radiografia(nombre: string, propias: Vacante[], todas: Vacante[]): Radiografia {
  const v = propias;
  const ahora = Date.now();
  const semanas = [0, 0, 0, 0];
  for (const j of v) { const d = (ahora - new Date(j.creado).getTime()) / 864e5; if (d >= 0 && d < 28) semanas[3 - Math.floor(d / 7)]! += 1; }

  // Transparencia: qué tan completa viene cada vacante, comparada con las demás empresas de Enlace.
  let transparencia: Radiografia["transparencia"] = null;
  if (v.length) {
    const puntaje = Math.round(claridadPct(v));
    const porEmpresa = new Map<string, Vacante[]>();
    for (const j of todas) { if (j.empresa === "Empresa no indicada") continue; const k = slugDe(j.empresa); porEmpresa.set(k, [...(porEmpresa.get(k) ?? []), j]); }
    const propio = slugDe(nombre);
    const otras = [...porEmpresa.entries()].filter(([k]) => k !== propio).map(([, js]) => claridadPct(js));
    const percentil = otras.length >= 20 ? Math.round((otras.filter((x) => x < puntaje).length / otras.length) * 100) : null;
    const cs = v.map(claridad);
    const nombres = cs[0]!.tiene.concat(cs[0]!.falta);
    const criterios = nombres.map((t) => ({ t, pct: Math.round((cs.filter((c) => c.tiene.includes(t)).length / cs.length) * 100) }));
    transparencia = { puntaje, percentil, empresas: otras.length + 1, criterios };
  }

  const salarios: SalarioPuesto[] = v.filter((j) => j.salarioMin > 0).map((j) => {
    const m = salarioMercado(j.titulo, j.provincia, todas, j.id);
    return { id: j.id, titulo: j.titulo, min: j.salarioMin, max: j.salarioMax, mercado: m?.medio ?? null, nMercado: m?.n ?? 0 };
  }).sort((a, b) => (b.max ?? b.min) - (a.max ?? a.min)).slice(0, 8);
  const conMercado = salarios.filter((s) => s.mercado);
  const sobreMercado = conMercado.filter((s) => ((s.max ? (s.min + s.max) / 2 : s.min)) >= s.mercado!).length;

  const provincias = contar(v.filter((j) => CENTRO_PROVINCIA[j.provincia]), (j) => j.provincia).map(({ t, n }) => ({ nombre: t, n, lat: CENTRO_PROVINCIA[t]![0], lng: CENTRO_PROVINCIA[t]![1] }));

  const habilidades = HABILIDADES.map(([t, re]) => ({ t, n: v.filter((j) => re.test(j.requisitos.join(" · ")) || re.test(j.descripcion)).length })).filter((h) => h.n > 0).sort((a, b) => b.n - a.n).slice(0, 10);

  // Empresas parecidas: las que más contratan en sus mismas áreas.
  const misAreas = new Set(v.map((j) => j.area));
  const propio = slugDe(nombre);
  const grupos = new Map<string, { nombre: string; js: Vacante[] }>();
  for (const j of todas) {
    if (j.empresa === "Empresa no indicada" || !misAreas.has(j.area)) continue;
    const k = slugDe(j.empresa);
    if (k === propio) continue;
    const g = grupos.get(k) ?? { nombre: j.empresa, js: [] };
    g.js.push(j);
    grupos.set(k, g);
  }
  const parecidas = [...grupos.entries()].map(([slug, g]) => ({ nombre: g.nombre, slug, total: g.js.length, claridad: Math.round(claridadPct(g.js)) }))
    .sort((a, b) => b.total - a.total || b.claridad - a.claridad).slice(0, 4);

  return {
    total: v.length,
    ultima: v.reduce<string | null>((m, j) => (!m || j.creado > m ? j.creado : m), null),
    semanas,
    transparencia,
    conSalario: v.filter((j) => j.salarioMin > 0).length,
    salarios,
    sobreMercado,
    conMercado: conMercado.length,
    provincias,
    remoto: v.filter((j) => j.modalidad === "Remoto" || j.provincia === "Remoto desde RD").length,
    areas: contar(v, (j) => j.area).slice(0, 6),
    niveles: contar(v, (j) => nivelDe(j)),
    modalidades: contar(v, (j) => j.modalidad),
    sinExperiencia: v.filter((j) => j.experiencia === "Sin experiencia").length,
    habilidades,
    parecidas,
  };
}

/** Preguntas que conviene hacerle a esta empresa en la entrevista, según lo que sus vacantes no dicen y lo que opinan. */
export function preguntasParaHacer(r: Radiografia, o: OpinionesEmpresa | undefined): { p: string; por: string }[] {
  const out: { p: string; por: string }[] = [];
  if (r.total && r.conSalario < r.total) out.push({ p: "¿Cuál es el rango de salario y cada cuánto se paga?", por: `${r.total - r.conSalario} de sus ${r.total} vacantes no dicen el sueldo.` });
  out.push({ p: "¿Cómo es un día normal en este puesto?", por: "Te ayuda a imaginarte ahí y a saber si va contigo." });
  if (r.modalidades.some((m) => m.t === "Presencial" || m.t === "Campo")) out.push({ p: "¿Cuál es el horario y se trabaja fines de semana o en turnos?", por: "El horario pesa tanto como el sueldo en tu día a día." });
  const t = o?.resumen.trabajo.categorias, p = o?.resumen.proceso.categorias;
  if (t?.["tss"] != null && t["tss"] < 3.5) out.push({ p: "¿Me inscriben en la TSS desde el primer día?", por: "Quienes trabajaron ahí le dieron una nota baja a cumplir con la ley." });
  if (t?.["pago"] != null && t["pago"] < 3.5) out.push({ p: "¿Qué día se paga y por qué vía?", por: "Hay opiniones de que los pagos no siempre llegan a tiempo." });
  if (t?.["crecimiento"] != null && t["crecimiento"] >= 4) out.push({ p: "¿Cómo han crecido otras personas que entraron en este puesto?", por: "Quienes trabajan ahí dicen que se puede crecer: pregunta cómo." });
  else out.push({ p: "¿Qué posibilidades hay de crecer o aprender aquí?", por: "Muestra que piensas quedarte y te dice si hay futuro." });
  if (p?.["rapidez"] != null && p["rapidez"] < 3.5) out.push({ p: "¿Cuándo me darán una respuesta?", por: "Quienes aplicaron dicen que el proceso es lento: así no te quedas esperando." });
  else out.push({ p: "¿Cuáles son los próximos pasos del proceso?", por: "Te quita la incertidumbre de no saber cuándo te llamarán." });
  out.push({ p: "¿Qué beneficios hay además de los de ley?", por: "Seguro complementario, transporte, comida o bonos cambian mucho el total." });
  return out.slice(0, 6);
}

/** Color propio de la empresa (el mismo del avatar), para la portada. */
export function colorEmpresa(nombre: string): string {
  const COLORES = ["#0a2f5c", "#0f7a43", "#7a3b0f", "#5b2a86", "#0b6e7a", "#a1274a"];
  let h = 0;
  for (const ch of nombre.trim()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORES[h % COLORES.length]!;
}

export const haceDias = (f: string | null) => {
  if (!f) return null;
  const d = Math.floor((Date.now() - new Date(f).getTime()) / 864e5);
  return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`;
};

// ── Seguir empresas (en este navegador): recuerda la última visita para marcar lo nuevo ──
const CLAVE = "enlace-empresas-seguidas";
const EVENTO = "enlace-seguidas-cambio";
type Seguidas = Record<string, { nombre: string; visto: string }>;
function leer(): Seguidas {
  try { const v = JSON.parse(localStorage.getItem(CLAVE) ?? "{}") as unknown; return v && typeof v === "object" ? (v as Seguidas) : {}; } catch { return {}; }
}
function escribir(s: Seguidas) {
  try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new Event(EVENTO));
}

/** Seguir una empresa: guarda la última visita y dice qué vacantes son nuevas desde entonces. */
export function useSeguirEmpresa(slug: string, nombre: string) {
  const [estado, setEstado] = useState<{ sigue: boolean; visto: string | null }>({ sigue: false, visto: null });
  useEffect(() => {
    const s = leer();
    const previo = s[slug]?.visto ?? null;
    setEstado({ sigue: !!s[slug], visto: previo });
    // La visita de hoy cuenta para la próxima vez.
    if (s[slug]) { s[slug] = { nombre, visto: new Date().toISOString() }; escribir(s); }
  }, [slug, nombre]);
  const alternar = useCallback(() => {
    const s = leer();
    if (s[slug]) delete s[slug];
    else s[slug] = { nombre, visto: new Date().toISOString() };
    escribir(s);
    setEstado((e) => ({ sigue: !!s[slug], visto: e.visto }));
    return !!s[slug];
  }, [slug, nombre]);
  return { ...estado, alternar };
}

import { leerPreguntas, type Pregunta } from "@/lib/preguntas";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { todasLasFilas } from "@/lib/paginar";
import { salarioDelTexto } from "@/lib/radar-salarial";

/** Centro de contenido (generador de piezas para Instagram). Se abre con la vacante ya cargada. */
export const CENTRO_CONTENIDO = "https://claude.ai/artifact/UmhZSbiFjeTqkxTC9mpRK6";
export function enlacePieza(job: Pick<Vacante, "titulo" | "empresa" | "provincia" | "modalidad" | "tipo" | "salarioMin" | "salarioMax" | "requisitos">): string {
  const datos = { t: job.titulo, e: job.empresa, p: job.provincia, m: job.modalidad, j: job.tipo, a: job.salarioMin || 0, b: job.salarioMax || 0, r: job.requisitos[0] ?? "" };
  const bytes = new TextEncoder().encode(JSON.stringify(datos));
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${CENTRO_CONTENIDO}#p.${b64}`;
}

export type Vacante = {
  id: string;
  titulo: string;
  empresa: string;
  provincia: string;
  modalidad: string;
  tipo: string;
  experiencia: string;
  area: string;
  salarioMin: number;
  salarioMax: number | null;
  salario: string;
  descripcion: string;
  requisitos: string[];
  fuente: string;
  fuenteUrl: string;
  aplicar: string;
  publicado: string;
  creado: string;
  estado: string;
  categorias: string[];
  destacada: boolean;
  redes?: boolean;
  imagen?: string;
  preguntas?: Pregunta[];
};

export type VacanteRow = {
  id: string;
  titulo: string;
  area: string;
  provincia: string;
  modalidad: string;
  tipo: string;
  experiencia: string;
  salario_min: number;
  salario_max: number | null;
  descripcion: string;
  requisitos: string[] | null;
  etiquetas: string[] | null;
  estado: string;
  created_at: string;
  destacada?: boolean | null;
  preguntas?: unknown;
};

export const SELECT = "id,titulo,area,provincia,modalidad,tipo,experiencia,salario_min,salario_max,descripcion,requisitos,etiquetas,estado,created_at,destacada,preguntas";

/** Las empresas sin nombre («… (confidencial)», «Confidencial») se guardan todas igual. */
export const empresaDe = (e?: string) => (!e || /^(…|\.\.\.)|^\s*(empresa\s+)?confidencial\s*$|\(confidencial\)\s*$/i.test(e.trim()) ? "Empresa no indicada" : e.trim());

const pesos = (n: number) => `RD$${n.toLocaleString("es-DO")}`;

export function leerMeta(etiquetas: string[] | null) {
  const meta: Record<string, string> = {};
  const tags: string[] = [];
  for (const e of etiquetas ?? []) {
    if (e.startsWith("m:")) {
      const resto = e.slice(2);
      const i = resto.indexOf(":");
      if (i > 0) meta[resto.slice(0, i)] = resto.slice(i + 1);
    } else {
      tags.push(e);
    }
  }
  return { meta, tags };
}

export function hace(fecha: string) {
  const min = Math.max(1, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
  if (min < 60) return `hace ${min} min`;
  if (min < 1440) return `hace ${Math.round(min / 60)} h`;
  const d = Math.round(min / 1440);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

// Cero discriminación al mostrar: fuera el sexo pegado al puesto y los requisitos de edad, sexo, foto, estado civil o apariencia.
const SEXO_EN_TITULO = /\s*[(\-–]?\s*(masculino|femenina|femenino)\s*\)?\s*$/i;
const REQUISITO_EXCLUYE = /(\bedad\b.*\d{2}|\b\d{2}\s*(a|y|-|–)\s*\d{2}\s*años(?!\s*de\s*experiencia)|\bsexo\b|preferiblemente\s+(hombre|mujer|masculino|femenin)|\b(solo|sólo)\s+(hombres|mujeres|damas|caballeros)\b|buena presencia|\bfoto|estado civil|\bsolter[oa]|\bcasad[oa]\b|estatura|\bpeso\b|menor(es)? de \d{2} años)/i;

export function rowToVacante(r: VacanteRow): Vacante {
  const { meta, tags } = leerMeta(r.etiquetas);
  // Si la ficha no trae el salario pero la descripción sí ("Salario: RD$142,500 mensual"), se toma del texto,
  // igual que en el radar salarial. Así la tarjeta, el índice de claridad, los filtros y Google dicen lo mismo.
  const delTexto = !(r.salario_min > 0) ? salarioDelTexto(r.descripcion) : null;
  const min = delTexto ? delTexto.min : r.salario_min;
  const maxBruto = delTexto ? delTexto.max : r.salario_max;
  const max = maxBruto && maxBruto > min ? maxBruto : null;
  const salario = min > 0 ? (max ? `${pesos(min)} - ${pesos(max)}` : pesos(min)) : "";
  return {
    id: r.id,
    titulo: r.titulo.replace(SEXO_EN_TITULO, "").trim() || r.titulo,
    empresa: empresaDe(meta["empresa"]),
    provincia: r.provincia,
    modalidad: r.modalidad,
    tipo: r.tipo,
    experiencia: r.experiencia,
    area: r.area,
    salarioMin: min,
    salarioMax: max,
    salario,
    descripcion: r.descripcion,
    requisitos: (r.requisitos ?? []).filter((x) => !/^[\p{Lu}\s]{6,}:\s*$|^[^.]{3,40}:\s*$/u.test(x.trim()) && !REQUISITO_EXCLUYE.test(x)),
    fuente: meta["fuente"] || "Enlace Laboral",
    fuenteUrl: meta["fuente_url"] || "",
    aplicar: meta["aplicar"] || "",
    publicado: hace(r.created_at),
    creado: r.created_at,
    estado: r.estado,
    categorias: tags,
    destacada: !!r.destacada,
    redes: meta["redes"] === "si",
    imagen: meta["imagen"] || "",
    preguntas: leerPreguntas(r.preguntas),
  };
}

// ── Respaldo ─────────────────────────────────────────────────────────────────────────────────────
// Si la base de datos no responde (por ejemplo, sin créditos en Lovable Cloud), el sitio muestra las
// vacantes que el robot recolector guarda cada día en GitHub (carga/auto-latest.json). Así nunca queda vacío.
const RESPALDO = "https://raw.githubusercontent.com/kimbcont24-jpg/enlacelaboral/main/carga/";
type FilaRespaldo = {
  titulo: string; empresa?: string; provincia?: string; area?: string; modalidad?: string; tipo?: string; experiencia?: string;
  descripcion?: string; requisitos?: string; fuente?: string; fuente_url?: string; aplicar?: string; redes?: string; imagen?: string;
  salario_min?: number | string; salario_max?: number | string;
};

/** Id estable para cada vacante de respaldo (no tienen id de la base): «r-» + huella del título y la empresa. */
function idRespaldo(f: FilaRespaldo): string {
  const txt = `${f.titulo}|${f.empresa ?? ""}|${f.provincia ?? ""}`;
  let h1 = 5381, h2 = 52711;
  for (let i = 0; i < txt.length; i++) { const c = txt.charCodeAt(i); h1 = (h1 * 33) ^ c; h2 = (h2 * 31) ^ c; }
  return `r-${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
}

let respaldoCache: Promise<Vacante[]> | null = null;
export function fetchRespaldo(): Promise<Vacante[]> {
  respaldoCache ??= (async () => {
    const [filas, resumen] = await Promise.all([
      fetch(`${RESPALDO}auto-latest.json`).then((r) => (r.ok ? (r.json() as Promise<FilaRespaldo[]>) : [])),
      fetch(`${RESPALDO}auto-resumen.json`).then((r) => (r.ok ? (r.json() as Promise<{ fecha?: string }>) : ({} as { fecha?: string }))).catch(() => ({} as { fecha?: string })),
    ]);
    const creado = resumen.fecha ?? new Date().toISOString();
    const vistos = new Set<string>();
    const lista: Vacante[] = [];
    for (const f of filas) {
      if (!f?.titulo) continue;
      const id = idRespaldo(f);
      if (vistos.has(id)) continue;
      vistos.add(id);
      const etiquetas = [`m:empresa:${f.empresa ?? ""}`, `m:fuente:${f.fuente ?? ""}`, `m:fuente_url:${f.fuente_url ?? ""}`, `m:aplicar:${f.aplicar ?? ""}`, `m:redes:${f.redes ?? ""}`, `m:imagen:${f.imagen ?? ""}`].filter((t) => !t.endsWith(":"));
      lista.push(rowToVacante({
        id, titulo: f.titulo, area: f.area ?? "Otros", provincia: f.provincia ?? "República Dominicana", modalidad: f.modalidad ?? "Presencial",
        tipo: f.tipo ?? "Tiempo completo", experiencia: f.experiencia ?? "No indica", salario_min: Number(f.salario_min) || 0,
        salario_max: Number(f.salario_max) || null, descripcion: f.descripcion ?? "", requisitos: (f.requisitos ?? "").split("|").map((x) => x.trim()).filter(Boolean),
        etiquetas, estado: "publicada", created_at: creado, destacada: false, preguntas: null,
      } as unknown as VacanteRow));
    }
    return lista;
  })().catch((e) => { respaldoCache = null; throw e; });
  return respaldoCache;
}

/** Corta una espera larga: si la base no contesta en `ms`, se rinde y se usa el respaldo. */
function conLimite<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise((ok, mal) => {
    const t = setTimeout(() => mal(new Error("La base de datos tardó demasiado")), ms);
    Promise.resolve(p).then((v) => { clearTimeout(t); ok(v); }, (e) => { clearTimeout(t); mal(e); });
  });
}

// Si la base ya falló hace poco en este navegador, no se vuelve a esperar por ella durante 10 minutos.
const CAIDA = "el_base_caida";
const baseCaida = () => { try { return Date.now() - Number(sessionStorage.getItem(CAIDA) ?? 0) < 10 * 60_000; } catch { return false; } };
const marcarCaida = () => { try { sessionStorage.setItem(CAIDA, String(Date.now())); } catch { /* sin almacenamiento */ } };

export async function fetchPublicadas(): Promise<Vacante[]> {
  if (!baseCaida()) {
    try {
      const desdeBase = await conLimite(fetchPublicadasBase(), 4000);
      if (desdeBase.length > 0) return desdeBase;
    } catch { marcarCaida(); /* la base no respondió: seguimos con el respaldo */ }
  }
  return fetchRespaldo();
}

async function fetchPublicadasBase(): Promise<Vacante[]> {
  const desde = new Date(Date.now() - 30 * 864e5).toISOString();
  // Antes: .limit(1000) → Supabase nunca devuelve más de 1000 filas y todos los contadores se quedaban en 1000.
  const filas = await todasLasFilas((a, b) =>
    supabase.from("vacantes").select(SELECT, { count: "exact" }).eq("estado", "publicada").gte("created_at", desde).order("destacada", { ascending: false }).order("created_at", { ascending: false }).order("id").range(a, b),
  );
  return (filas as unknown as VacanteRow[]).map(rowToVacante);
}

export async function fetchVacante(id: string): Promise<Vacante | null> {
  if (/^r-[0-9a-f]+$/i.test(id)) return (await fetchRespaldo().catch(() => [])).find((j) => j.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const { data } = await conLimite(supabase.from("vacantes").select(SELECT).eq("id", id).maybeSingle(), 6000);
    return data ? rowToVacante(data as unknown as VacanteRow) : null;
  } catch { return null; }
}

export function useVacantes() {
  const q = useQuery({ queryKey: ["vacantes"], queryFn: fetchPublicadas, staleTime: 30_000 });
  return { jobs: q.data ?? [], cargando: q.isLoading, error: q.isError, reintentar: () => void q.refetch() };
}

export function enlaceAplicar(a: string): { href: string; label: string } | null {
  const t = a.trim();
  if (!t) return null;
  const url = t.match(/https?:\/\/\S+/);
  if (url) return { href: url[0], label: "Aplicar en el sitio original" };
  const mail = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (mail) return { href: `mailto:${mail[0]}`, label: `Enviar CV a ${mail[0]}` };
  const digitos = t.replace(/\D/g, "");
  if (digitos.length >= 10) {
    const n = digitos.length === 10 ? `1${digitos}` : digitos;
    return { href: `https://wa.me/${n}`, label: "Escribir por WhatsApp" };
  }
  return null;
}

export const SITIO = "https://enlacelaboralrd.com";

export function textoWhatsApp(job: Vacante, origen = SITIO): string {
  const lineas = [
    `*${job.titulo}*`,
    job.empresa !== "Empresa no indicada" ? `🏢 ${job.empresa}` : null,
    `📍 ${job.provincia} · ${job.modalidad}`,
    job.salarioMin > 0 ? `💰 ${job.salario}` : null,
    "",
    "Mira los requisitos y cómo aplicar (gratis):",
    `${origen}/vacantes/${job.id}`,
    "",
    "Más vacantes en el canal de Enlace Laboral:",
    CANAL_WHATSAPP,
  ];
  return lineas.filter((l) => l !== null).join("\n");
}

export const enlaceWhatsApp = (job: Vacante, origen?: string) => `https://wa.me/?text=${encodeURIComponent(textoWhatsApp(job, origen))}`;

const TIPO_GOOGLE: Record<string, string> = { "Tiempo completo": "FULL_TIME", "Medio tiempo": "PART_TIME", "Pasantía": "INTERN", "Por proyecto": "CONTRACTOR" };

/** Datos para Google Empleos. Solo para vacantes publicadas directamente por la empresa. */
export function jobPostingLd(job: Vacante): string | null {
  if (job.fuente !== "Publicada por la empresa" || job.empresa === "Empresa no indicada") return null;
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const partes = [
    job.descripcion ? `<p>${esc(job.descripcion).replace(/\n/g, "<br>")}</p>` : "",
    job.requisitos.length ? `<p>Requisitos:</p><ul>${job.requisitos.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : "",
  ].filter(Boolean);
  const vence = new Date(new Date(job.creado).getTime() + 30 * 864e5).toISOString();
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.titulo,
    description: partes.join("") || `<p>${esc(job.titulo)}</p>`,
    datePosted: job.creado,
    validThrough: vence,
    employmentType: TIPO_GOOGLE[job.tipo] ?? "OTHER",
    hiringOrganization: { "@type": "Organization", name: job.empresa },
    directApply: false,
  };
  if (job.modalidad === "Remoto" || job.provincia === "Remoto desde RD") {
    ld["jobLocationType"] = "TELECOMMUTE";
    ld["applicantLocationRequirements"] = { "@type": "Country", name: "DO" };
  } else {
    ld["jobLocation"] = { "@type": "Place", address: { "@type": "PostalAddress", addressRegion: job.provincia, addressCountry: "DO" } };
  }
  if (job.salarioMin > 0) {
    const valor = job.salarioMax ? { minValue: job.salarioMin, maxValue: job.salarioMax } : { value: job.salarioMin };
    ld["baseSalary"] = { "@type": "MonetaryAmount", currency: "DOP", value: { "@type": "QuantitativeValue", ...valor, unitText: "MONTH" } };
  }
  return JSON.stringify(ld).replace(/</g, "\\u003c");
}

export const CANAL_WHATSAPP = "https://whatsapp.com/channel/0029Vb7GW0UKLaHf3idEm62D";
export const CANAL_TELEGRAM = "https://t.me/enlacelaboral";
export const INSTAGRAM = "https://www.instagram.com/enlacelaboralrd";
/** Correos oficiales (Zoho Mail). aplicaciones@ es solo remitente de avisos automáticos: no se publica. */
export const CORREO_INFO = "info@enlacelaboralrd.com";
export const CORREO_EMPRESAS = "empresas@enlacelaboralrd.com";

// ---------- Total de vacantes abiertas (para el menú) ----------
// Consulta liviana (solo cuenta, sin traer las vacantes) y se recuerda en la sesión.
let totalEnMemoria: number | null = null;
export function useTotalVacantes(): number | null {
  const [n, setN] = useState<number | null>(() => {
    if (totalEnMemoria !== null) return totalEnMemoria;
    try { const v = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("enlace:total-vacantes") : null; return v ? Number(v) : null; } catch { return null; }
  });
  useEffect(() => {
    if (totalEnMemoria !== null) return;
    void supabase.from("vacantes").select("id", { count: "exact", head: true }).eq("estado", "publicada").gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString())
      .then(({ count }) => {
        if (typeof count !== "number") return;
        totalEnMemoria = count; setN(count);
        try { sessionStorage.setItem("enlace:total-vacantes", String(count)); } catch { /* sin almacenamiento */ }
      });
  }, []);
  return n;
}

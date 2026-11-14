import { supabase } from "@/integrations/supabase/client";

/** Nombre del blog. Cambiarlo aquí lo cambia en todo el sitio. */
export const BLOG = {
  nombre: "Entre líneas",
  lema: "El blog de Enlace Laboral",
  descripcion: "Lo que pasa detrás de una vacante, contado desde Gestión Humana: reclutamiento por dentro, mente y empleo, derechos laborales en RD y cómo la tecnología está cambiando la forma de contratar.",
};

export type Categoria = "reclutamiento" | "mente" | "carrera" | "derechos" | "empresas" | "ia";

export const CATEGORIAS: { id: Categoria; t: string; d: string; color: string }[] = [
  { id: "reclutamiento", t: "Reclutamiento por dentro", d: "Lo que pasa del otro lado del proceso", color: "#1d6ff2" },
  { id: "mente", t: "Mente y empleo", d: "Ansiedad, rechazo, motivación y decisiones", color: "#6d28d9" },
  { id: "carrera", t: "Tu carrera", d: "Crecer, cambiar y negociar", color: "#0e7490" },
  { id: "derechos", t: "Derechos y dinero", d: "Código de Trabajo, salario y prestaciones", color: "#0f7a43" },
  { id: "empresas", t: "Para empresas", d: "Contratar mejor y retener talento", color: "#0a2f5c" },
  { id: "ia", t: "IA y trabajo", d: "Tecnología útil, con criterio humano", color: "#be185d" },
];

export const categoria = (id: string) => CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[0]!;

export type Articulo = {
  id: string;
  slug: string;
  titulo: string;
  bajada: string;
  contenido: string;
  categoria: Categoria;
  etiquetas: string[];
  portada: string | null;
  autor: string;
  autor_cargo: string;
  estado: "borrador" | "publicado";
  destacado: boolean;
  publicado_at: string | null;
  created_at: string;
  updated_at: string;
};

const CAMPOS = "id,slug,titulo,bajada,contenido,categoria,etiquetas,portada,autor,autor_cargo,estado,destacado,publicado_at,created_at,updated_at";

/** Artículos publicados, del más nuevo al más viejo. */
export async function articulosPublicados(limite = 60): Promise<Articulo[]> {
  const { data } = await supabase.from("blog_articulos").select(CAMPOS).eq("estado", "publicado").order("publicado_at", { ascending: false }).limit(limite);
  return (data ?? []) as unknown as Articulo[];
}

export async function articuloPorSlug(slug: string): Promise<Articulo | null> {
  const { data } = await supabase.from("blog_articulos").select(CAMPOS).eq("slug", slug).eq("estado", "publicado").maybeSingle();
  return (data as unknown as Articulo) ?? null;
}

/** Solo para el panel: incluye borradores (las reglas de la base lo permiten solo a la administradora). */
export async function todosLosArticulos(): Promise<Articulo[]> {
  const { data } = await supabase.from("blog_articulos").select(CAMPOS).order("updated_at", { ascending: false });
  return (data ?? []) as unknown as Articulo[];
}

export function hacerSlug(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function minutosLectura(texto: string): number {
  const palabras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 220));
}

export function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

export function fechaLarga(f: string | null | undefined): string {
  if (!f) return "";
  return new Date(f).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
}

/* ───────────── Formato del contenido ─────────────
 * Texto sencillo, pensado para escribir sin saber código:
 *   ## Subtítulo          ### Subtítulo pequeño
 *   > Cita grande         !> Dato clave       ?> Mirada psicológica
 *   - viñeta              1. lista numerada
 *   ![descripción](enlace de la imagen)       ---  (separador)
 *   **negrita**  *cursiva*  [texto](enlace)
 * Un párrafo nuevo = una línea en blanco.
 */
export type Bloque =
  | { tipo: "p"; texto: string }
  | { tipo: "h2"; texto: string; id: string }
  | { tipo: "h3"; texto: string; id: string }
  | { tipo: "cita"; texto: string }
  | { tipo: "dato"; texto: string }
  | { tipo: "mirada"; texto: string }
  | { tipo: "ul"; items: string[] }
  | { tipo: "ol"; items: string[] }
  | { tipo: "img"; alt: string; src: string }
  | { tipo: "hr" };

export function analizar(md: string): Bloque[] {
  const lineas = md.replace(/\r/g, "").split("\n");
  const out: Bloque[] = [];
  const usados = new Map<string, number>();
  const idDe = (t: string) => {
    const base = hacerSlug(t) || "seccion";
    const n = usados.get(base) ?? 0;
    usados.set(base, n + 1);
    return n ? `${base}-${n + 1}` : base;
  };
  let parrafo: string[] = [];
  const cerrar = () => { if (parrafo.length) { out.push({ tipo: "p", texto: parrafo.join(" ") }); parrafo = []; } };
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i]!.trimEnd();
    const t = l.trim();
    if (!t) { cerrar(); continue; }
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^(#{2,3})\s+(.+)$/))) { cerrar(); out.push(m[1]!.length === 2 ? { tipo: "h2", texto: m[2]!, id: idDe(m[2]!) } : { tipo: "h3", texto: m[2]!, id: idDe(m[2]!) }); continue; }
    if (/^-{3,}$/.test(t)) { cerrar(); out.push({ tipo: "hr" }); continue; }
    if ((m = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) { cerrar(); out.push({ tipo: "img", alt: m[1]!, src: m[2]! }); continue; }
    const caja = t.match(/^(\?>|!>|>)\s?(.*)$/);
    if (caja) {
      cerrar();
      const marca = caja[1]!;
      const partes = [caja[2]!];
      while (i + 1 < lineas.length && lineas[i + 1]!.trim().startsWith(marca) && !(marca === ">" && /^[?!]>/.test(lineas[i + 1]!.trim()))) partes.push(lineas[++i]!.trim().slice(marca.length).trim());
      const texto = partes.join(" ").trim();
      out.push(marca === ">" ? { tipo: "cita", texto } : marca === "!>" ? { tipo: "dato", texto } : { tipo: "mirada", texto });
      continue;
    }
    if (/^[-*•]\s+/.test(t) || /^\d+[.)]\s+/.test(t)) {
      cerrar();
      const ordenada = /^\d/.test(t);
      const re = ordenada ? /^\d+[.)]\s+/ : /^[-*•]\s+/;
      const items = [t.replace(re, "")];
      while (i + 1 < lineas.length && re.test(lineas[i + 1]!.trim())) items.push(lineas[++i]!.trim().replace(re, ""));
      out.push(ordenada ? { tipo: "ol", items } : { tipo: "ul", items });
      continue;
    }
    parrafo.push(t);
  }
  cerrar();
  return out;
}

export type Trozo = { t: "txt"; v: string } | { t: "b"; v: Trozo[] } | { t: "i"; v: Trozo[] } | { t: "a"; v: string; href: string };

/** Negritas, cursivas y enlaces dentro de una línea. */
export function enLinea(s: string): Trozo[] {
  const out: Trozo[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let ult = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > ult) out.push({ t: "txt", v: s.slice(ult, m.index) });
    if (m[1] !== undefined) out.push({ t: "b", v: enLinea(m[1]) });
    else if (m[2] !== undefined) out.push({ t: "i", v: enLinea(m[2]) });
    else out.push({ t: "a", v: m[3]!, href: m[4]! });
    ult = re.lastIndex;
  }
  if (ult < s.length) out.push({ t: "txt", v: s.slice(ult) });
  return out;
}

export const textoPlano = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

export function enlaceSeguro(href: string): string | null {
  if (/^https?:\/\//i.test(href) || href.startsWith("/") || href.startsWith("mailto:")) return href;
  return null;
}

/** La primera cita grande (> …) del artículo: se usa como arte en las portadas sin foto. */
export function fraseDe(contenido: string): string {
  const b = analizar(contenido).find((x) => x.tipo === "cita");
  return b && "texto" in b ? textoPlano(b.texto) : "";
}

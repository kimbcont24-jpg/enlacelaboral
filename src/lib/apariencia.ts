import { supabase } from "@/integrations/supabase/client";

/**
 * Apariencia del sitio editable desde Admin → Sitio → Apariencia.
 * Se guarda como JSON en contenido_sitio (clave "apariencia").
 * Valor vacío = se deja todo como está en el código (diseño original).
 */

export type Apariencia = {
  fuenteTitulos: string; // "" = original
  fuenteTexto: string; // "" = original (Figtree)
  pesoTitulos: number; // 0 = original (800)
  pesoNegritas: number; // 0 = original (700)
  tamano: number; // 0 = original (100 %)
  espaciadoTitulos: number; // em; 0 = original
  colores: Partial<Record<ClaveColor, string>>;
};

export const CLAVE_APARIENCIA = "apariencia";
const CLAVE_LOCAL = "enlace:apariencia";

export const aparienciaOriginal: Apariencia = { fuenteTitulos: "", fuenteTexto: "", pesoTitulos: 0, pesoNegritas: 0, tamano: 0, espaciadoTitulos: 0, colores: {} };

/** Fuentes de Google Fonts disponibles. `pesos` es lo que se pide a Google (sin pedir pesos que la fuente no tiene). */
export const FUENTES: { nombre: string; tipo: string; pesos: string }[] = [
  { nombre: "Figtree", tipo: "Actual del sitio", pesos: "400;500;600;700;800;900" },
  { nombre: "Inter", tipo: "Moderna, muy legible", pesos: "400;500;600;700;800" },
  { nombre: "Manrope", tipo: "Moderna, redondeada", pesos: "400;500;600;700;800" },
  { nombre: "DM Sans", tipo: "Moderna, limpia", pesos: "400;500;600;700;800" },
  { nombre: "Plus Jakarta Sans", tipo: "Moderna, elegante", pesos: "400;500;600;700;800" },
  { nombre: "Poppins", tipo: "Geométrica, amigable", pesos: "400;500;600;700;800" },
  { nombre: "Montserrat", tipo: "Geométrica, fuerte", pesos: "400;500;600;700;800" },
  { nombre: "Outfit", tipo: "Geométrica, suave", pesos: "400;500;600;700;800" },
  { nombre: "Nunito Sans", tipo: "Redondeada, cercana", pesos: "400;500;600;700;800" },
  { nombre: "Open Sans", tipo: "Clásica, neutra", pesos: "400;500;600;700;800" },
  { nombre: "Roboto", tipo: "Clásica, neutra", pesos: "400;500;600;700;800" },
  { nombre: "Lato", tipo: "Clásica, cálida", pesos: "400;700;900" },
  { nombre: "Raleway", tipo: "Fina, distinguida", pesos: "400;500;600;700;800" },
  { nombre: "Unbounded", tipo: "Ancha, llamativa (solo titulares)", pesos: "400;500;600;700;800" },
  { nombre: "Playfair Display", tipo: "Con serifa, editorial (solo titulares)", pesos: "400;500;600;700;800" },
  { nombre: "Merriweather", tipo: "Con serifa, lectura", pesos: "400;700;900" },
];

export type ClaveColor = "primary" | "cta" | "portada" | "background" | "foreground" | "muted" | "success";

/** Colores editables, con su valor original (el del código). */
export const COLORES: { clave: ClaveColor; etiqueta: string; ayuda: string; original: string }[] = [
  { clave: "primary", etiqueta: "Azul principal", ayuda: "Logo, títulos de marca, enlaces y detalles.", original: "#0a2f5c" },
  { clave: "cta", etiqueta: "Color de los botones", ayuda: "Botones «Aplicar», «Buscar» y acciones.", original: "#1d6ff2" },
  { clave: "portada", etiqueta: "Fondo de la portada", ayuda: "La franja azul de arriba en inicio y en cada vacante.", original: "#0a2f5c" },
  { clave: "background", etiqueta: "Fondo de la página", ayuda: "El gris claro detrás de las tarjetas.", original: "#f4f6f9" },
  { clave: "foreground", etiqueta: "Color del texto", ayuda: "Texto principal.", original: "#14213a" },
  { clave: "muted", etiqueta: "Texto secundario", ayuda: "Descripciones y textos de apoyo.", original: "#556275" },
  { clave: "success", etiqueta: "Verde (salarios y confirmaciones)", ayuda: "Sueldos y mensajes de éxito.", original: "#0f7a43" },
];

const hex = (v: unknown) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : "");
const fuenteValida = (f: unknown) => (typeof f === "string" && FUENTES.some((x) => x.nombre === f) ? f : "");

export function limpiarApariencia(x: unknown): Apariencia {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const num = (v: unknown, min: number, max: number) => (typeof v === "number" && v >= min && v <= max ? v : 0);
  const colores: Apariencia["colores"] = {};
  const c = (o["colores"] && typeof o["colores"] === "object" ? o["colores"] : {}) as Record<string, unknown>;
  for (const { clave } of COLORES) { const v = hex(c[clave]); if (v) colores[clave] = v; }
  return {
    fuenteTitulos: fuenteValida(o["fuenteTitulos"]),
    fuenteTexto: fuenteValida(o["fuenteTexto"]),
    pesoTitulos: num(o["pesoTitulos"], 400, 900),
    pesoNegritas: num(o["pesoNegritas"], 400, 900),
    tamano: num(o["tamano"], 85, 120),
    espaciadoTitulos: typeof o["espaciadoTitulos"] === "number" && Math.abs(o["espaciadoTitulos"]) <= 0.1 ? o["espaciadoTitulos"] : 0,
    colores,
  };
}

export const esOriginal = (a: Apariencia) => JSON.stringify(limpiarApariencia(a)) === JSON.stringify(aparienciaOriginal);

const familia = (f: string) => `"${f}", ui-sans-serif, system-ui, sans-serif`;

/** Enlace de Google Fonts solo para las fuentes elegidas que no carga ya el sitio. */
export function urlFuentes(a: Apariencia): string {
  const elegidas = [...new Set([a.fuenteTitulos, a.fuenteTexto].filter((f) => f && f !== "Figtree"))];
  if (!elegidas.length) return "";
  const partes = elegidas.map((f) => `family=${f.replace(/ /g, "+")}:wght@${FUENTES.find((x) => x.nombre === f)!.pesos}`);
  return `https://fonts.googleapis.com/css2?${partes.join("&")}&display=swap`;
}

/** CSS que se aplica encima del diseño. Solo incluye lo que se cambió. */
export function cssApariencia(a: Apariencia): string {
  const r: string[] = [];
  const vars: string[] = [];
  const col = a.colores;
  if (col.primary) vars.push(`--primary:${col.primary}`);
  if (col.cta) vars.push(`--cta:${col.cta}`, `--accent:${col.cta}`, `--ring:${col.cta}`, `--cta-hover:color-mix(in srgb, ${col.cta} 86%, #000)`, `--btn-a:color-mix(in srgb, ${col.cta} 85%, #fff)`, `--btn-c:color-mix(in srgb, ${col.cta} 86%, #000)`);
  if (col.portada) vars.push(`--portada-a:${col.portada}`, `--portada-b:color-mix(in srgb, ${col.portada} 88%, #fff)`, `--portada-c:color-mix(in srgb, ${col.portada} 72%, #2b7cff)`);
  if (col.background) vars.push(`--background:${col.background}`);
  if (col.foreground) vars.push(`--foreground:${col.foreground}`, `--secondary-foreground:${col.foreground}`);
  if (col.muted) vars.push(`--muted-foreground:${col.muted}`);
  if (col.success) vars.push(`--success:${col.success}`);
  if (vars.length) r.push(`:root{${vars.join(";")}}`);

  if (a.fuenteTexto) r.push(`body,.font-sans,.font-mono{font-family:${familia(a.fuenteTexto)}}`);
  if (a.fuenteTitulos) r.push(`h1,h2,h3,h4,h5,h6,.font-display{font-family:${familia(a.fuenteTitulos)}}`);
  // El logotipo no cambia nunca.
  if (a.fuenteTexto || a.fuenteTitulos) r.push(`.logo-nombre{font-family:"Figtree", ui-sans-serif, system-ui, sans-serif}`);
  if (a.pesoTitulos) r.push(`.font-extrabold,.font-black:not(.logo-nombre),h1,h2,h3{font-weight:${a.pesoTitulos}}`);
  if (a.pesoNegritas) r.push(`.font-bold,.btn-aplicar{font-weight:${a.pesoNegritas}}`);
  if (a.espaciadoTitulos) r.push(`h1,h2,h3,.font-display{letter-spacing:${a.espaciadoTitulos}em}`);
  if (a.tamano && a.tamano !== 100) r.push(`html:not([class*="a11y-letra"]){font-size:${a.tamano}%}`);
  return r.join("\n");
}

/** Aplica la apariencia en la página (sin recargar). */
export function aplicarApariencia(a: Apariencia) {
  if (typeof document === "undefined") return;
  const url = urlFuentes(a);
  let link = document.getElementById("apariencia-fuentes") as HTMLLinkElement | null;
  if (url) {
    if (!link) { link = document.createElement("link"); link.id = "apariencia-fuentes"; link.rel = "stylesheet"; document.head.appendChild(link); }
    if (link.href !== url) link.href = url;
  } else link?.remove();
  let style = document.getElementById("apariencia-css") as HTMLStyleElement | null;
  if (!style) { style = document.createElement("style"); style.id = "apariencia-css"; document.head.appendChild(style); }
  style.textContent = cssApariencia(a);
}

export function guardarLocal(a: Apariencia) {
  try { if (esOriginal(a)) localStorage.removeItem(CLAVE_LOCAL); else localStorage.setItem(CLAVE_LOCAL, JSON.stringify({ url: urlFuentes(a), css: cssApariencia(a) })); } catch { /* sin almacenamiento */ }
}

/** Script que corre antes de pintar: aplica la última apariencia guardada para que no parpadee. */
export const scriptApariencia = `try{var a=JSON.parse(localStorage.getItem(${JSON.stringify(CLAVE_LOCAL)})||"null");if(a){if(a.url){var l=document.createElement("link");l.id="apariencia-fuentes";l.rel="stylesheet";l.href=a.url;document.head.appendChild(l)}var s=document.createElement("style");s.id="apariencia-css";s.textContent=a.css;document.head.appendChild(s)}}catch(e){}`;

export async function leerApariencia(): Promise<Apariencia> {
  const { data } = await supabase.from("contenido_sitio").select("valor").eq("clave", CLAVE_APARIENCIA).maybeSingle();
  if (!data?.valor?.trim()) return aparienciaOriginal;
  try { return limpiarApariencia(JSON.parse(data.valor)); } catch { return aparienciaOriginal; }
}

/** Al abrir el sitio: trae la apariencia guardada, la aplica y la recuerda para la próxima visita. */
export async function iniciarApariencia() {
  try {
    const a = await leerApariencia();
    aplicarApariencia(a);
    guardarLocal(a);
  } catch { /* sin conexión: queda la última conocida */ }
}

export async function guardarApariencia(a: Apariencia) {
  const limpia = limpiarApariencia(a);
  const { error } = await supabase.from("contenido_sitio").upsert({ clave: CLAVE_APARIENCIA, valor: esOriginal(limpia) ? "" : JSON.stringify(limpia), updated_at: new Date().toISOString() });
  if (!error) guardarLocal(limpia);
  return error;
}

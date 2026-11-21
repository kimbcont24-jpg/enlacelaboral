/**
 * Generador de flyers de vacantes. Todo se arma en el navegador de quien lo usa:
 * sin IA, sin servidor y sin guardar nada en la base de datos.
 */
import type { Compromiso } from "@/lib/inclusion";

export type Datos = {
  cabecera: string;
  empresa: string;
  logo: string | null;
  foto: string | null;
  puesto: string;
  cantidad: string;
  ubicacion: string;
  modalidad: string;
  jornada: string;
  horario: string;
  salMin: string;
  salMax: string;
  periodo: string;
  beneficios: string[];
  requisitos: string[];
  funciones: string[];
  compromisos: Compromiso[];
  correo: string;
  whatsapp: string;
  enlace: string;
  extraAplicar: string;
  fechaLimite: string;
};

export type Mostrar = {
  logo: boolean;
  foto: boolean;
  funciones: boolean;
  beneficios: boolean;
  compromisos: boolean;
  qr: boolean;
  antiestafa: boolean;
  marca: boolean;
};

export type Diseno = {
  plantilla: PlantillaId;
  formato: FormatoId;
  paleta: string;
  fuente: string;
  textura: Textura;
  marcaPri: string;
  marcaAcc: string;
  mostrar: Mostrar;
};

// ---------- Formatos (todos de 1080 px de ancho) ----------
export type FormatoId = "post" | "ig" | "cuadrado" | "historia" | "carta";
export const FORMATOS: { id: FormatoId; nombre: string; uso: string; w: number; h: number; escala: number }[] = [
  { id: "post", nombre: "Post vertical", uso: "Instagram, Facebook y LinkedIn (4:5)", w: 1080, h: 1350, escala: 1 },
  { id: "ig", nombre: "Instagram 3:4", uso: "Se ve completo en la cuadrícula del perfil", w: 1080, h: 1440, escala: 1 },
  { id: "cuadrado", nombre: "Cuadrado", uso: "Facebook, LinkedIn y grupos (1:1)", w: 1080, h: 1080, escala: 1 },
  { id: "historia", nombre: "Historia / Estado", uso: "Historias de Instagram y estados de WhatsApp (9:16)", w: 1080, h: 1920, escala: 1 },
  { id: "carta", nombre: "Hoja carta", uso: "Para imprimir y pegar en mural o vitrina", w: 1080, h: 1398, escala: 2.5 },
];

// ---------- Paletas (cuidadas a mano, con buen contraste) ----------
export type Paleta = { id: string; nombre: string; bg: string; ink: string; pri: string; onPri: string; acc: string; onAcc: string; soft: string; muted: string };
export const PALETAS: Paleta[] = [
  { id: "marino", nombre: "Marino", bg: "#ffffff", ink: "#0a2f5c", pri: "#0a2f5c", onPri: "#ffffff", acc: "#1d6ff2", onAcc: "#ffffff", soft: "#eef4fd", muted: "#4a5f7d" },
  { id: "caribe", nombre: "Caribe", bg: "#fbf8f2", ink: "#0d3b3e", pri: "#0f6b6b", onPri: "#ffffff", acc: "#f2994a", onAcc: "#2b1600", soft: "#e4f0ec", muted: "#47676a" },
  { id: "bosque", nombre: "Bosque", bg: "#f5f7f2", ink: "#16301e", pri: "#1f4d2f", onPri: "#ffffff", acc: "#d9b44a", onAcc: "#231a00", soft: "#e2eadb", muted: "#4d6353" },
  { id: "coral", nombre: "Coral", bg: "#fff6f3", ink: "#3b1220", pri: "#d9483f", onPri: "#ffffff", acc: "#3b1220", onAcc: "#ffffff", soft: "#ffe2db", muted: "#7a4a52" },
  { id: "ciruela", nombre: "Ciruela", bg: "#f8f3f8", ink: "#2a1230", pri: "#5b2a6e", onPri: "#ffffff", acc: "#f0b429", onAcc: "#2a1a00", soft: "#ede1f0", muted: "#6a5370" },
  { id: "mostaza", nombre: "Mostaza", bg: "#fffaf0", ink: "#1d1d1b", pri: "#f2b705", onPri: "#1d1d1b", acc: "#1d1d1b", onAcc: "#ffffff", soft: "#fbeec4", muted: "#5b5648" },
  { id: "cielo", nombre: "Cielo", bg: "#f5f9ff", ink: "#0b2545", pri: "#2f6fe4", onPri: "#ffffff", acc: "#0b2545", onAcc: "#ffffff", soft: "#dde8fd", muted: "#48607f" },
  { id: "salud", nombre: "Salud", bg: "#f3fbfa", ink: "#073b3a", pri: "#0f8f87", onPri: "#ffffff", acc: "#ff8a65", onAcc: "#2b0e00", soft: "#d6f1ee", muted: "#3f6a68" },
  { id: "terracota", nombre: "Terracota", bg: "#f8f1ea", ink: "#3a1f14", pri: "#a94b2a", onPri: "#ffffff", acc: "#2f5d50", onAcc: "#ffffff", soft: "#efdccc", muted: "#715244" },
  { id: "grafito", nombre: "Grafito", bg: "#ffffff", ink: "#1b1b1b", pri: "#262626", onPri: "#ffffff", acc: "#ffcf3f", onAcc: "#1b1b1b", soft: "#f0f0ee", muted: "#5e5e5a" },
  { id: "tinta", nombre: "Blanco y negro", bg: "#ffffff", ink: "#111111", pri: "#111111", onPri: "#ffffff", acc: "#e4002b", onAcc: "#ffffff", soft: "#f2f2f2", muted: "#555555" },
  { id: "marca", nombre: "Mi marca", bg: "#ffffff", ink: "#1b1b1b", pri: "#0a2f5c", onPri: "#ffffff", acc: "#1d6ff2", onAcc: "#ffffff", soft: "#f2f4f7", muted: "#555555" },
];

// ---------- Tipografías (Google Fonts, solo en esta página) ----------
export type Fuente = { id: string; nombre: string; titulo: string; texto: string; peso: number; mayus?: boolean; espacio?: string; ajuste?: number };
export const FUENTES: Fuente[] = [
  { id: "moderna", nombre: "Moderna", titulo: "Unbounded", texto: "Figtree", peso: 700, espacio: "-0.02em", ajuste: 0.86 },
  { id: "corporativa", nombre: "Corporativa", titulo: "Manrope", texto: "Manrope", peso: 800, espacio: "-0.03em" },
  { id: "fuerte", nombre: "Fuerte", titulo: "Archivo Black", texto: "Archivo", peso: 400, espacio: "-0.025em", ajuste: 0.92 },
  { id: "condensada", nombre: "Condensada", titulo: "Bebas Neue", texto: "Barlow", peso: 400, mayus: true, espacio: "0.005em", ajuste: 1.28 },
  { id: "editorial", nombre: "Editorial", titulo: "Fraunces", texto: "DM Sans", peso: 700, espacio: "-0.02em" },
  { id: "elegante", nombre: "Elegante", titulo: "Playfair Display", texto: "Source Sans 3", peso: 800, espacio: "-0.01em" },
  { id: "amigable", nombre: "Amigable", titulo: "Baloo 2", texto: "Nunito", peso: 800, espacio: "-0.01em", ajuste: 1.04 },
  { id: "tecnica", nombre: "Técnica", titulo: "Space Grotesk", texto: "Space Grotesk", peso: 700, espacio: "-0.03em" },
];
/** Pesos de cada familia: los mismos para mostrar en pantalla y para incrustar en el PNG. */
export const ESPEC_FUENTES: Record<string, string> = {
  Unbounded: "Unbounded:wght@700;800",
  Figtree: "Figtree:wght@400;500;600;700;800",
  Manrope: "Manrope:wght@400;500;600;700;800",
  "Archivo Black": "Archivo+Black",
  Archivo: "Archivo:wght@400;500;600;700;800",
  "Bebas Neue": "Bebas+Neue",
  Barlow: "Barlow:wght@400;500;600;700;800",
  Fraunces: "Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600",
  "DM Sans": "DM+Sans:wght@400;500;600;700;800",
  "Playfair Display": "Playfair+Display:ital,wght@0,700;0,800;1,600",
  "Source Sans 3": "Source+Sans+3:wght@400;500;600;700;800",
  "Baloo 2": "Baloo+2:wght@600;700;800",
  Nunito: "Nunito:wght@400;500;600;700;800",
  "Space Grotesk": "Space+Grotesk:wght@400;500;600;700",
};
export const urlFuentes = (familias: string[]) =>
  `https://fonts.googleapis.com/css2?${[...new Set(familias)].map((f) => `family=${ESPEC_FUENTES[f] ?? f.replace(/ /g, "+")}`).join("&")}&display=swap`;
export const GOOGLE_FONTS = urlFuentes(Object.keys(ESPEC_FUENTES).filter((f) => f !== "Unbounded" && f !== "Figtree"));

const cacheFuentes = new Map<string, Promise<string>>();
/**
 * CSS con las fuentes del flyer incrustadas (solo el juego «latin», que trae tildes, ñ, ¿ y ¡).
 * Así el PNG sale con la letra correcta y no hay que bajar todas las fuentes de la página.
 */
export function cssFuentes(f: Fuente): Promise<string> {
  const clave = f.id;
  const hecho = cacheFuentes.get(clave);
  if (hecho) return hecho;
  const p = (async () => {
    const css = await (await fetch(urlFuentes([f.titulo, f.texto]))).text();
    const bloques = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)].filter((m) => m[1] === "latin").map((m) => m[2]);
    const lista = bloques.length ? bloques : [...css.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0]);
    const conDatos = await Promise.all(lista.map(async (b) => {
      const url = b.match(/url\((['"]?)([^)'"]+)\1\)/)?.[2];
      if (!url) return b;
      const blob = await (await fetch(url)).blob();
      const datos = await new Promise<string>((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result)); fr.readAsDataURL(blob); });
      return b.replace(url, datos);
    }));
    return conDatos.join("\n");
  })();
  p.catch(() => cacheFuentes.delete(clave));
  cacheFuentes.set(clave, p);
  return p;
}

export type Textura = "ninguna" | "puntos" | "lineas" | "cuadricula" | "ondas";
export const TEXTURAS: { id: Textura; nombre: string }[] = [
  { id: "ninguna", nombre: "Lisa" },
  { id: "puntos", nombre: "Puntos" },
  { id: "lineas", nombre: "Líneas" },
  { id: "cuadricula", nombre: "Cuadrícula" },
  { id: "ondas", nombre: "Ondas" },
];

// ---------- Plantillas ----------
export type PlantillaId = "bloque" | "editorial" | "ticket" | "afiche" | "lateral" | "minimal" | "arco" | "industrial" | "suave" | "lista" | "marco" | "enlace";
export const PLANTILLAS: { id: PlantillaId; nombre: string; ideal: string; paleta: string; fuente: string; foto?: boolean }[] = [
  { id: "bloque", nombre: "Bloque", ideal: "Cualquier puesto. Clara y directa.", paleta: "marino", fuente: "corporativa" },
  { id: "editorial", nombre: "Editorial", ideal: "Oficina, ventas, marketing. Admite foto.", paleta: "tinta", fuente: "editorial", foto: true },
  { id: "ticket", nombre: "Boleto", ideal: "Restaurantes, tiendas, eventos.", paleta: "coral", fuente: "amigable" },
  { id: "afiche", nombre: "Afiche", ideal: "Llamar la atención en el mural o en redes.", paleta: "mostaza", fuente: "condensada" },
  { id: "lateral", nombre: "Franja", ideal: "Administrativos y servicio al cliente.", paleta: "cielo", fuente: "moderna" },
  { id: "minimal", nombre: "Mínima", ideal: "Banca, finanzas, puestos gerenciales.", paleta: "grafito", fuente: "corporativa" },
  { id: "arco", nombre: "Arco", ideal: "Hoteles, belleza, educación. Admite foto.", paleta: "terracota", fuente: "elegante", foto: true },
  { id: "industrial", nombre: "Industrial", ideal: "Manufactura, almacén, logística, construcción.", paleta: "grafito", fuente: "fuerte" },
  { id: "suave", nombre: "Cercana", ideal: "Salud, educación, atención al público.", paleta: "salud", fuente: "amigable" },
  { id: "lista", nombre: "Lista", ideal: "Cuando los requisitos son lo importante.", paleta: "bosque", fuente: "tecnica" },
  { id: "marco", nombre: "Marco", ideal: "Formal: gobierno, colegios, clínicas.", paleta: "ciruela", fuente: "elegante" },
  { id: "enlace", nombre: "Enlace", ideal: "Con la línea gráfica de Enlace Laboral.", paleta: "marino", fuente: "moderna" },
];

export const CABECERAS = ["Estamos contratando", "Únete a nuestro equipo", "Vacante disponible", "Te estamos buscando", "Oportunidad de empleo", "Buscamos talento"];
export const MODALIDADES = ["Presencial", "Híbrido", "Remoto"];
export const JORNADAS = ["Tiempo completo", "Medio tiempo", "Por turnos", "Fines de semana", "Pasantía", "Temporal"];
export const PERIODOS = ["al mes", "quincenal", "por hora", "semanal", "por proyecto"];
export const BENEFICIOS = ["Seguro médico", "Seguro complementario", "Bonificación", "Comisiones", "Incentivos por metas", "Transporte", "Almuerzo", "Horario flexible", "Capacitación", "Crecimiento interno", "Días libres rotativos", "Uniformes", "Trabajo desde casa", "Pago de horas extra"];
export const UBICACIONES = ["Distrito Nacional", "Santo Domingo Este", "Santo Domingo Norte", "Santo Domingo Oeste", "Santiago", "La Vega", "San Cristóbal", "Puerto Plata", "La Romana", "Punta Cana", "San Pedro de Macorís", "La Altagracia", "Moca", "San Francisco de Macorís", "Bonao", "Baní", "Higüey", "Azua", "Barahona", "Samaná", "Nagua", "Mao", "Montecristi", "Toda la República"];

export const DATOS_EJEMPLO: Datos = {
  cabecera: "Estamos contratando",
  empresa: "Tu Empresa",
  logo: null,
  foto: null,
  puesto: "Representante de servicio al cliente",
  cantidad: "3 posiciones",
  ubicacion: "Santo Domingo Este",
  modalidad: "Presencial",
  jornada: "Tiempo completo",
  horario: "Lunes a viernes, 8:00 a. m. a 5:00 p. m.",
  salMin: "28000",
  salMax: "32000",
  periodo: "al mes",
  beneficios: ["Seguro médico", "Bonificación", "Capacitación"],
  requisitos: ["Bachiller terminado", "Buena comunicación oral y escrita", "Manejo básico de computadora"],
  funciones: ["Atender llamadas y mensajes de la clientela", "Registrar casos y darles seguimiento"],
  compromisos: ["primer-empleo"],
  correo: "empleos@tuempresa.com",
  whatsapp: "8095550100",
  enlace: "",
  extraAplicar: "",
  fechaLimite: "",
};

export const DISENO_INICIAL: Diseno = {
  plantilla: "bloque",
  formato: "post",
  paleta: "marino",
  fuente: "corporativa",
  textura: "ninguna",
  marcaPri: "#0a2f5c",
  marcaAcc: "#1d6ff2",
  mostrar: { logo: true, foto: true, funciones: true, beneficios: true, compromisos: true, qr: true, antiestafa: true, marca: true },
};

// ---------- Ayudas de texto ----------
const miles = (s: string) => {
  const n = Number(String(s).replace(/[^\d.]/g, ""));
  return n > 0 ? Math.round(n).toLocaleString("en-US") : "";
};

export function salarioTexto(d: Pick<Datos, "salMin" | "salMax" | "periodo">): string {
  const a = miles(d.salMin);
  const b = miles(d.salMax);
  if (!a && !b) return "";
  const rango = a && b && a !== b ? `RD$${a} – ${b}` : `RD$${a || b}`;
  return `${rango} ${d.periodo}`.trim();
}

/** Número dominicano listo para wa.me (809/829/849 → 1 + 10 dígitos). */
export function whatsappNumero(t: string): string {
  const n = t.replace(/\D/g, "");
  if (n.length === 10 && /^8[024]9/.test(n)) return `1${n}`;
  return n;
}
export function whatsappBonito(t: string): string {
  const n = t.replace(/\D/g, "").replace(/^1(?=8[024]9\d{7}$)/, "");
  return n.length === 10 ? `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6)}` : t.trim();
}
export const enlaceBonito = (u: string) => {
  const t = u.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/[?#].*$/, "").replace(/\/$/, "");
  // Un enlace a una vacante de Enlace Laboral se muestra corto: el código QR lleva directo a ella.
  return /^enlacelaboralrd\.com\/vacantes\/[\w-]{8,}/i.test(t) ? "enlacelaboralrd.com" : t;
};

/** A dónde lleva el código QR: el enlace si hay; si no, el WhatsApp con un mensaje listo. */
export function destinoQR(d: Datos): string {
  if (d.enlace.trim()) return /^https?:\/\//i.test(d.enlace.trim()) ? d.enlace.trim() : `https://${d.enlace.trim()}`;
  if (d.whatsapp.replace(/\D/g, "").length >= 10) {
    const msg = `Hola, me interesa la vacante de ${d.puesto || "su empresa"}${d.empresa ? ` en ${d.empresa}` : ""}.`;
    return `https://wa.me/${whatsappNumero(d.whatsapp)}?text=${encodeURIComponent(msg)}`;
  }
  if (d.correo.includes("@")) return `mailto:${d.correo.trim()}?subject=${encodeURIComponent(`Aplicación: ${d.puesto}`)}`;
  return "";
}

export function fechaBonita(iso: string): string {
  if (!iso) return "";
  const f = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(f.getTime())) return "";
  return f.toLocaleDateString("es-DO", { day: "numeric", month: "long" });
}

export const limpiar = (l: string[]) => l.map((x) => x.trim()).filter(Boolean);

/** Paleta final: «Mi marca» se arma con los dos colores elegidos. */
export function paletaDe(dis: Pick<Diseno, "paleta" | "marcaPri" | "marcaAcc">): Paleta {
  const p = PALETAS.find((x) => x.id === dis.paleta) ?? PALETAS[0];
  if (p.id !== "marca") return p;
  const pri = dis.marcaPri;
  const acc = dis.marcaAcc;
  const ink = luminancia(pri) < 0.18 ? pri : mezclar(pri, "#000000", 0.72);
  return {
    ...p,
    pri,
    onPri: textoSobre(pri),
    acc,
    onAcc: textoSobre(acc),
    ink,
    soft: mezclar(pri, "#ffffff", 0.9),
    muted: mezclar(ink, "#ffffff", 0.35),
  };
}

// ---------- Color ----------
const hexRgb = (h: string): [number, number, number] => {
  const s = h.replace("#", "");
  const f = s.length === 3 ? s.split("").map((c) => c + c).join("") : s.padEnd(6, "0");
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
};
const rgbHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
export function luminancia(h: string): number {
  const [r, g, b] = hexRgb(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
export const textoSobre = (h: string) => (contraste(h, "#ffffff") >= contraste(h, "#111111") ? "#ffffff" : "#111111");
export function mezclar(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexRgb(a);
  const [r2, g2, b2] = hexRgb(b);
  return rgbHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/** Saca los dos colores principales del logo (sin blancos, negros ni transparencias). */
export async function coloresDelLogo(src: string): Promise<[string, string] | null> {
  const img = new Image();
  img.src = src;
  await img.decode().catch(() => null);
  if (!img.naturalWidth) return null;
  const c = document.createElement("canvas");
  const t = 64;
  c.width = t;
  c.height = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * t));
  const x = c.getContext("2d");
  if (!x) return null;
  x.drawImage(img, 0, 0, c.width, c.height);
  const px = x.getImageData(0, 0, c.width, c.height).data;
  const cubos = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b, a] = [px[i], px[i + 1], px[i + 2], px[i + 3]];
    if (a < 200) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 235 && min > 225) continue; // blanco
    if (max < 25) continue; // negro
    const k = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const e = cubos.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n += 1 + (max - min) / 40; // pesa más lo que tiene color
    e.r += r; e.g += g; e.b += b;
    cubos.set(k, e);
  }
  const lista = [...cubos.values()].sort((m, n) => n.n - m.n).map((e) => {
    const cnt = Math.max(1, Math.round(e.n));
    return rgbHex(e.r / cnt, e.g / cnt, e.b / cnt);
  });
  if (!lista.length) return null;
  const pri = lista[0];
  const acc = lista.find((h) => contraste(h, pri) > 2.2) ?? mezclar(pri, luminancia(pri) > 0.3 ? "#000000" : "#ffffff", 0.55);
  return [pri, acc];
}

/** Lee una imagen subida, la achica (para que el flyer pese poco) y la devuelve como data URL. Nada sale del navegador. */
export function leerImagen(file: File, max = 1400): Promise<string> {
  return new Promise((ok, mal) => {
    const fr = new FileReader();
    fr.onerror = () => mal(new Error("No se pudo leer la imagen"));
    fr.onload = async () => {
      const src = String(fr.result);
      if (file.type === "image/svg+xml") return ok(src);
      const img = new Image();
      img.src = src;
      try { await img.decode(); } catch { return ok(src); }
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      const png = file.type === "image/png" || file.type === "image/webp";
      ok(c.toDataURL(png ? "image/png" : "image/jpeg", 0.9));
    };
    fr.readAsDataURL(file);
  });
}

// ---------- Textos para publicar ----------
export function textoPublicacion(d: Datos, red: "redes" | "whatsapp"): string {
  const b = red === "whatsapp" ? (s: string) => `*${s}*` : (s: string) => s;
  const sal = salarioTexto(d);
  const req = limpiar(d.requisitos);
  const ben = limpiar(d.beneficios);
  const datos = [d.ubicacion, d.modalidad, d.jornada].filter(Boolean).join(" · ");
  const aplicar = [
    d.correo.trim() && `CV a ${d.correo.trim()}`,
    d.whatsapp.replace(/\D/g, "").length >= 10 && `WhatsApp ${whatsappBonito(d.whatsapp)}`,
    d.enlace.trim() && enlaceBonito(d.enlace),
    d.extraAplicar.trim(),
  ].filter(Boolean).join(" · ");
  const lineas = [
    `${b(`${d.puesto || "Vacante"}${d.empresa ? ` en ${d.empresa}` : ""}`)}${d.cantidad ? ` (${d.cantidad})` : ""}`,
    datos && `📍 ${datos}`,
    d.horario && `🕘 ${d.horario}`,
    sal && `💰 ${sal}`,
    req.length > 0 && `✅ Requisitos: ${req.join("; ")}`,
    ben.length > 0 && `🎁 Ofrecemos: ${ben.join(", ")}`,
    aplicar && `📩 Cómo aplicar: ${aplicar}`,
    d.fechaLimite && `🗓 Recibimos aplicaciones hasta el ${fechaBonita(d.fechaLimite)}.`,
    "",
    "Aplicar es gratis. Nunca pagues por un empleo.",
  ];
  if (red === "redes") {
    const lugar = d.ubicacion.replace(/\s+/g, "").normalize("NFD").replace(/[̀-ͯ]/g, "");
    lineas.push("", `#EmpleoRD #VacantesRD #TrabajoRD${lugar && lugar !== "TodalaRepublica" ? ` #Empleo${lugar}` : ""}`);
  }
  return lineas.filter((l) => l !== false && l !== undefined).join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Texto alternativo para lectores de pantalla (personas ciegas o con baja visión). */
export function textoAlternativo(d: Datos): string {
  const sal = salarioTexto(d);
  const req = limpiar(d.requisitos);
  return [
    `Flyer de vacante. ${d.empresa || "La empresa"} busca ${d.puesto || "personal"}${d.ubicacion ? ` en ${d.ubicacion}` : ""}.`,
    [d.modalidad, d.jornada].filter(Boolean).join(", ") + (d.horario ? `, ${d.horario}.` : "."),
    sal && `Salario: ${sal}.`,
    req.length > 0 && `Requisitos: ${req.join("; ")}.`,
    d.correo.trim() && `Envía tu CV a ${d.correo.trim()}.`,
    d.whatsapp.replace(/\D/g, "").length >= 10 && `WhatsApp: ${whatsappBonito(d.whatsapp)}.`,
  ].filter(Boolean).join(" ").replace(/\s+\./g, ".").trim();
}

export const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "vacante";

// ---------- Desde el panel de empresa: «Crear flyer de esta vacante» ----------
const CLAVE_DESDE = "enlace:flyer:desde";
export type DesdeVacante = { datos: Partial<Datos>; logoUrl?: string; fotoUrl?: string; vacante: string };

/** Guarda los datos de la vacante para que el generador los abra ya llenos (solo en esta pestaña). */
export function prepararDesdeVacante(x: DesdeVacante) {
  try { sessionStorage.setItem(CLAVE_DESDE, JSON.stringify(x)); } catch { /* sin almacenamiento */ }
}
export function tomarDesdeVacante(): DesdeVacante | null {
  try {
    const t = sessionStorage.getItem(CLAVE_DESDE);
    if (!t) return null;
    sessionStorage.removeItem(CLAVE_DESDE);
    return JSON.parse(t) as DesdeVacante;
  } catch { return null; }
}
/** Baja una imagen pública (logo o foto de la empresa) y la deja como data URL para el PNG. */
export async function imagenDeUrl(url: string, max = 1400): Promise<string | null> {
  try {
    const blob = await (await fetch(url)).blob();
    if (!blob.type.startsWith("image/")) return null;
    return await leerImagen(new File([blob], "img", { type: blob.type }), max);
  } catch { return null; }
}

import { leer, type Borrador } from "@/lib/extraer";
import { senalesRiesgo } from "@/lib/antiestafa";

/** Lector de texto de imágenes. Todo corre en el navegador y los archivos del lector están en /ocr (sin depender de otros sitios). */
export type Modo = "auto" | "flyer";
/** Cómo se divide la página: 3 = automático, 6 = un bloque (tarjetas de WhatsApp, documentos), 11 = texto suelto (flyers). */
export type Psm = "3" | "6" | "11";

export type Lectura = { texto: string; confianza: number };

export type Lector = {
  leer: (img: HTMLCanvasElement, modo: Modo, onProgreso: (n: number) => void) => Promise<string>;
  leerPsm: (img: HTMLCanvasElement, psm: Psm, onProgreso: (n: number) => void) => Promise<Lectura>;
  cerrar: () => Promise<void>;
};

type PalabraOCR = { text: string; confidence: number };
type LineaOCR = { words?: PalabraOCR[]; text?: string };

/** Quita al inicio de cada línea las «palabras» cortas y poco seguras: casi siempre son un emoji leído como letras («ES», «JA», «dr»). */
function sinBasuraInicial(lineas: LineaOCR[] | undefined, crudo: string): string {
  if (!lineas || lineas.length === 0) return crudo;
  const salida: string[] = [];
  for (const l of lineas) {
    const ws = [...(l.words ?? [])];
    if (ws.length === 0) { if (l.text) salida.push(l.text.replace(/\n$/, "")); continue; }
    const esBasura = (w: PalabraOCR, sig: PalabraOCR) => {
      const t = w.text.replace(/[^\p{L}\p{N}]/gu, "");
      if (/^\d+$/.test(t)) return t.length === 1 && w.confidence < 65 && sig.confidence >= 85;
      return t.length <= 3 && w.confidence < 88 && sig.confidence >= 88;
    };
    while (ws.length >= 2 && esBasura(ws[0]!, ws[1]!)) ws.shift();
    // línea entera de símbolos o de palabras muy dudosas (pero se conservan correos y teléfonos aunque salgan flojos)
    const linea = ws.map((w) => w.text).join(" ");
    const fuertes = ws.filter((w) => w.confidence >= 30 && /[\p{L}\p{N}]{3,}/u.test(w.text));
    if (fuertes.length === 0 && !/@|\.(?:com|do|net|org)\b|\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/i.test(linea)) continue;
    salida.push(ws.map((w) => w.text).join(" "));
  }
  return salida.join("\n");
}

export async function crearLector(): Promise<Lector> {
  const { createWorker } = await import("tesseract.js");
  let avance: (n: number) => void = () => undefined;
  const worker = await createWorker("spa", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/core",
    langPath: "/ocr/lang",
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") avance(m.progress);
    },
  });
  async function leerPsm(img: HTMLCanvasElement, psm: Psm, onProgreso: (n: number) => void): Promise<Lectura> {
    avance = onProgreso;
    await worker.setParameters({ tessedit_pageseg_mode: psm as never });
    const { data } = await worker.recognize(img);
    const d = data as unknown as { text: string; confidence: number; lines?: LineaOCR[] };
    return { texto: sinBasuraInicial(d.lines, d.text), confianza: d.confidence ?? 0 };
  }
  return {
    leerPsm,
    async leer(img, modo, onProgreso) {
      return (await leerPsm(img, modo === "flyer" ? "11" : "3", onProgreso)).texto;
    },
    async cerrar() {
      await worker.terminate();
    },
  };
}

function cargarImagen(file: Blob): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error("imagen no válida")); };
    img.src = url;
  });
}

function dibujar(img: HTMLImageElement, escala: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * escala));
  c.height = Math.max(1, Math.round(img.naturalHeight * escala));
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/** Escala de grises, contraste y, si el fondo es oscuro, invierte los colores. Mejora mucho la lectura de flyers. */
function prepararParaLeer(img: HTMLImageElement): HTMLCanvasElement {
  const lado = Math.max(img.naturalWidth, img.naturalHeight);
  const escala = lado < 1400 ? Math.min(2.5, 1800 / lado) : lado > 2800 ? 2800 / lado : 1;
  const c = dibujar(img, escala);
  const g = c.getContext("2d", { willReadFrequently: true })!;
  const d = g.getImageData(0, 0, c.width, c.height);
  const px = d.data;
  const hist = new Array<number>(256).fill(0);
  let suma = 0;
  for (let i = 0; i < px.length; i += 4) {
    const y = Math.round(0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!);
    px[i] = px[i + 1] = px[i + 2] = y;
    hist[y]!++;
    suma += y;
  }
  const total = px.length / 4;
  const media = suma / total;
  let acc = 0, lo = 0, hi = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]!; if (acc >= total * 0.02) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]!; if (acc >= total * 0.02) { hi = v; break; } }
  const rango = Math.max(40, hi - lo);
  const invertir = media < 110;
  for (let i = 0; i < px.length; i += 4) {
    let y = Math.min(255, Math.max(0, ((px[i]! - lo) / rango) * 255));
    if (invertir) y = 255 - y;
    px[i] = px[i + 1] = px[i + 2] = y;
  }
  g.putImageData(d, 0, 0);
  return c;
}

/** Versión liviana para guardar y mostrar en la vacante (máx. 1400 px, JPEG). */
async function aJpeg(img: HTMLImageElement): Promise<Blob> {
  const lado = Math.max(img.naturalWidth, img.naturalHeight);
  const c = dibujar(img, lado > 1400 ? 1400 / lado : 1);
  return new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error("no se pudo comprimir"))), "image/jpeg", 0.82));
}

export async function prepararFoto(file: File): Promise<{ lectura: HTMLCanvasElement; subir: Blob }> {
  const img = await cargarImagen(file);
  return { lectura: prepararParaLeer(img), subir: await aJpeg(img) };
}

const CONTACTO_RE = /[\w.+-]+@[\w-]+\.[\w.]+|\bRD\$|\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/gi;

/** Puntaje de una lectura: seguridad del lector, cantidad de texto y si aparecen datos de contacto o sueldo. */
function puntaje(l: Lectura): number {
  const largo = l.texto.replace(/\s+/g, "").length;
  if (largo < 20) return 0;
  const datos = Math.min(3, (l.texto.match(CONTACTO_RE) ?? []).length);
  return l.confianza * Math.sqrt(Math.min(largo, 600)) * (1 + datos * 0.08);
}

export type ResultadoFoto = { texto: string; modo: Psm; confianza: number; intentos: number };

/**
 * Lee una foto con varios intentos y se queda con el mejor: primero como un bloque (lo más común: capturas de
 * WhatsApp y documentos), y si sale pobre prueba la división automática y la de texto suelto (flyers).
 */
export async function leerFoto(lector: Lector, lectura: HTMLCanvasElement, onProgreso: (n: number) => void = () => undefined, todo = false): Promise<ResultadoFoto> {
  const orden: Psm[] = ["6", "3", "11"];
  let mejor: { l: Lectura; psm: Psm } | null = null;
  let intentos = 0;
  for (const psm of orden) {
    const l = await lector.leerPsm(lectura, psm, (n) => onProgreso((intentos + n) / orden.length));
    intentos++;
    if (!mejor || puntaje(l) > puntaje(mejor.l)) mejor = { l, psm };
    // suficientemente buena: no gastar más tiempo
    if (!todo && mejor.l.confianza >= 82 && puntaje(mejor.l) > 0 && (mejor.l.texto.match(CONTACTO_RE) ?? []).length >= 1) break;
  }
  return { texto: mejor!.l.texto, modo: mejor!.psm, confianza: Math.round(mejor!.l.confianza), intentos };
}

/** Limpia los errores típicos de la lectura: viñetas raras, barras, símbolos sueltos. */
export function limpiarOCR(texto: string): string {
  return texto
    .replace(/\r/g, "")
    .split("\n")
    .flatMap((l) => (l.split(/\s[|¦]\s/).length >= 3 ? l.split(/\s[|¦]\s/) : [l]))
    .map((l) => l
      .replace(/^\s*[\[(]\s*[>»›~=+*-]*\s*[\])]\s*/, "• ")
      .replace(/^\s*[>»›~|¢©®°·.]+\s+/, "• ")
      .replace(/[|¦]/g, " ")
      .replace(/[“”]/g, '"')
      .replace(/\s{2,}/g, " ")
      .trim())
    .filter((l) => l.length > 1 && /[\p{L}\p{N}]/u.test(l) && !/^[^\p{L}\p{N}]+$/u.test(l))
    .join("\n");
}

const CORREO = /[\w.+-]+@[\w-]+\.[\w.]+/;
const DOM = "[a-z0-9-]{2,30}(?:\\.(?:com|net|org|edu|gob|gov|info|do|es))+";

/** Si el lector confundió la @ con otra letra («rrhhQempresa.com», «rrhhéempresa.com.do», «ventas (O gmail.com»), la repara y lo avisa. */
export function repararContacto(texto: string): { texto: string; reparado: string } {
  if (CORREO.test(texto)) return { texto, reparado: "" };
  const reglas: RegExp[] = [
    // pegado: la @ salió como Q, O, é, © dentro de la misma palabra
    new RegExp(`\\b([a-z0-9][a-z0-9._-]{1,40}?)[A-Z©éÓØ&](?=${DOM}\\b)`),
    // con espacio y/o paréntesis: «ferreteria(O gmail.com», «talento OO datalabrd.com»
    new RegExp(`\\b([a-z0-9][a-z0-9._-]{1,40})\\s*[(\\[{]\\s*[OoQq0©éÓØ&@]{0,2}\\s*[)\\]}]?\\s*(${DOM})\\b`),
    new RegExp(`\\b([a-z0-9][a-z0-9._-]{1,40})\\s+[OQ0©éÓØ&@]{1,2}\\s+(${DOM})\\b`),
    // espacio y la @ pegada al dominio: «empleos Ogrupo.com.do»
    new RegExp(`\\b([a-z0-9][a-z0-9._-]{1,40})\\s+[OQ©Ø&](${DOM})\\b`),
    // la que ya existía: Q, q, ©, ( pegados
    new RegExp(`\\b([a-z0-9][a-z0-9._-]{1,40})\\s?[Qq©(]\\s?(${DOM})\\b`, "i"),
  ];
  for (let i = 0; i < reglas.length; i++) {
    const m = texto.match(reglas[i]!);
    if (!m) continue;
    let correo: string;
    if (i === 0) {
      const resto = texto.slice((m.index ?? 0) + m[0].length).match(new RegExp(`^${DOM}`));
      if (!resto) continue;
      correo = `${m[1]}@${resto[0]}`;
      return { texto: texto.replace(m[0] + resto[0], correo.toLowerCase()), reparado: correo.toLowerCase() };
    }
    correo = `${m[1]}@${m[2]}`.toLowerCase();
    return { texto: texto.replace(m[0], correo), reparado: correo };
  }
  return { texto, reparado: "" };
}

export const AVISO_CORREO = "Posible correo mal leído:";

export type Analisis = { b: Borrador; avisos: string[]; riesgo: string[]; texto: string; dudas: (keyof Borrador)[]; varias: Borrador[] };

export function analizarTexto(crudo: string): Analisis {
  const limpio = limpiarOCR(crudo);
  const { texto, reparado } = repararContacto(limpio);
  const { b, dudas, varias, avisos: avisosLectura } = leer(texto);
  const avisos: string[] = [];
  if (reparado) avisos.push(`Corregí el correo a ${reparado}. Confírmalo con la imagen.`);
  else if (!CORREO.test(texto)) {
    const raro = texto.match(/(?<![\w@/.-])(?!www\.)[a-z0-9][a-z0-9._-]{4,}\.(?:com\.do|com|do|net|org)\b/i);
    if (raro) avisos.push(`${AVISO_CORREO} «${raro[0]}». Míralo en la imagen y escribe el correo bien.`);
  }
  if (CORREO.test(texto) || /\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/.test(texto)) avisos.push("Compara el correo y el teléfono con la imagen: las letras chicas a veces se leen mal.");
  if (!b.titulo) avisos.push("No pude detectar el puesto.");
  if (!b.empresa) avisos.push("No se vio el nombre de la empresa.");
  if (!b.aplicar) avisos.push("No encontré cómo aplicar (correo, WhatsApp o enlace).");
  if (!b.salarioMin && !avisosLectura.some((a) => /sueldo|pago/i.test(a))) avisos.push("No dice el salario. Se publicará como «Salario no publicado».");
  avisos.push(...avisosLectura);
  return { b, avisos, riesgo: senalesRiesgo(texto, !!b.aplicar), texto, dudas, varias };
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** ¿Ya hay una vacante igual publicada? Compara puesto y empresa. */
export function esRepetida(b: Pick<Borrador, "titulo" | "empresa">, existentes: { titulo: string; empresa: string }[]): boolean {
  const t = norm(b.titulo);
  if (!t) return false;
  const e = norm(b.empresa);
  return existentes.some((x) => norm(x.titulo) === t && (!e || !norm(x.empresa) || norm(x.empresa).includes("no indicada") || norm(x.empresa) === e));
}

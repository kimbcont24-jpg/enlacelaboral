import { extraer, type Borrador } from "@/lib/extraer";
import { senalesRiesgo } from "@/lib/antiestafa";

/** Lector de texto de imágenes. Todo corre en el navegador y los archivos del lector están en /ocr (sin depender de otros sitios). */
export type Modo = "auto" | "flyer";

export type Lector = {
  leer: (img: HTMLCanvasElement, modo: Modo, onProgreso: (n: number) => void) => Promise<string>;
  cerrar: () => Promise<void>;
};

export async function crearLector(): Promise<Lector> {
  const { createWorker, PSM } = await import("tesseract.js");
  let avance: (n: number) => void = () => undefined;
  const worker = await createWorker("spa", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/core",
    langPath: "/ocr/lang",
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") avance(m.progress);
    },
  });
  return {
    async leer(img, modo, onProgreso) {
      avance = onProgreso;
      await worker.setParameters({ tessedit_pageseg_mode: modo === "flyer" ? PSM.SPARSE_TEXT : PSM.AUTO });
      const { data } = await worker.recognize(img);
      return data.text;
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

/** Limpia los errores típicos de la lectura: viñetas raras, barras, símbolos sueltos. */
export function limpiarOCR(texto: string): string {
  return texto
    .replace(/\r/g, "")
    .split("\n")
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

/** Si el lector confundió la @ con otra letra (por ejemplo «rrhhQempresa.com»), la repara y lo avisa. */
export function repararContacto(texto: string): { texto: string; reparado: string } {
  if (CORREO.test(texto)) return { texto, reparado: "" };
  const m = texto.match(/\b([a-z0-9][a-z0-9._-]{1,40})\s?[Qq©(]([a-z0-9-]{2,30}\.(?:com\.do|com|do|net|org|edu\.do|gob\.do|gov\.do))\b/i);
  if (!m) return { texto, reparado: "" };
  const correo = `${m[1]}@${m[2]}`.toLowerCase();
  return { texto: texto.replace(m[0], correo), reparado: correo };
}

export const AVISO_CORREO = "Posible correo mal leído:";

export type Analisis = { b: Borrador; avisos: string[]; riesgo: string[]; texto: string };

export function analizarTexto(crudo: string): Analisis {
  const limpio = limpiarOCR(crudo);
  const { texto, reparado } = repararContacto(limpio);
  const b = extraer(texto);
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
  if (!b.salarioMin) avisos.push("No dice el salario. Se publicará como «Salario no publicado».");
  return { b, avisos, riesgo: senalesRiesgo(texto, !!b.aplicar), texto };
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** ¿Ya hay una vacante igual publicada? Compara puesto y empresa. */
export function esRepetida(b: Pick<Borrador, "titulo" | "empresa">, existentes: { titulo: string; empresa: string }[]): boolean {
  const t = norm(b.titulo);
  if (!t) return false;
  const e = norm(b.empresa);
  return existentes.some((x) => norm(x.titulo) === t && (!e || !norm(x.empresa) || norm(x.empresa).includes("no indicada") || norm(x.empresa) === e));
}

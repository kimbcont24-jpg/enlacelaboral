import { CANAL_WHATSAPP, SITIO, type Vacante } from "@/lib/vacantes";

/** Piezas para redes: se dibujan en el navegador con las vacantes reales. No inventan datos. */
export type Formato = { id: "post" | "historia"; nombre: string; w: number; h: number };
export const FORMATOS: Formato[] = [
  { id: "post", nombre: "Carrusel (Instagram / Facebook)", w: 1080, h: 1350 },
  { id: "historia", nombre: "Historia (Instagram / WhatsApp)", w: 1080, h: 1920 },
];

const AZUL = "#0a2f5c";
const AZUL2 = "#14498c";
const CTA = "#1d6ff2";
const ORO = "#ffd84d";
const VERDE = "#0f7a43";
const FUENTE = '"Figtree", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

const sinEmpresa = (v: Vacante) => v.empresa === "Empresa no indicada";

function lienzo(f: Formato): { c: HTMLCanvasElement; x: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = f.w;
  c.height = f.h;
  const x = c.getContext("2d")!;
  x.textBaseline = "alphabetic";
  return { c, x };
}

function fondo(x: CanvasRenderingContext2D, f: Formato, oscuro = true) {
  if (oscuro) {
    const g = x.createLinearGradient(0, 0, f.w, f.h);
    g.addColorStop(0, AZUL);
    g.addColorStop(1, AZUL2);
    x.fillStyle = g;
  } else x.fillStyle = "#f4f6fa";
  x.fillRect(0, 0, f.w, f.h);
  if (oscuro) {
    x.fillStyle = "rgba(255,255,255,0.05)";
    x.beginPath(); x.arc(f.w - 60, 120, 320, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(-80, f.h - 80, 280, 0, Math.PI * 2); x.fill();
  }
}

function marca(x: CanvasRenderingContext2D, f: Formato, oscuro: boolean) {
  x.fillStyle = oscuro ? "#fff" : AZUL;
  x.font = `800 44px ${FUENTE}`;
  x.textAlign = "left";
  x.fillText("Enlace", 70, 110);
  const w = x.measureText("Enlace ").width;
  x.fillStyle = oscuro ? ORO : CTA;
  x.fillText("Laboral", 70 + w, 110);
  x.textAlign = "right";
  x.fillStyle = oscuro ? "rgba(255,255,255,0.75)" : "#5b6b82";
  x.font = `600 30px ${FUENTE}`;
  x.fillText("Empleos en RD 🇩🇴", f.w - 70, 108);
  x.textAlign = "left";
}

/** Parte un texto en líneas que quepan en el ancho. Devuelve las líneas (máx. maxLineas, con «…» si se corta). */
export function partir(x: CanvasRenderingContext2D, texto: string, ancho: number, maxLineas: number): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let l = "";
  for (let i = 0; i < palabras.length; i++) {
    const prueba = l ? `${l} ${palabras[i]}` : palabras[i]!;
    if (x.measureText(prueba).width <= ancho || !l) l = prueba;
    else {
      out.push(l);
      l = palabras[i]!;
      if (out.length === maxLineas) break;
    }
  }
  if (out.length < maxLineas && l) out.push(l);
  if (out.length === maxLineas && palabras.join(" ") !== out.join(" ")) {
    let u = out[maxLineas - 1]!;
    while (u.length > 1 && x.measureText(`${u}…`).width > ancho) u = u.slice(0, -1);
    out[maxLineas - 1] = `${u.replace(/[ ,.;:]+$/, "")}…`;
  }
  return out;
}

function pastilla(x: CanvasRenderingContext2D, texto: string, px: number, py: number, fondoC: string, color: string): number {
  x.font = `700 32px ${FUENTE}`;
  const w = x.measureText(texto).width + 44;
  x.fillStyle = fondoC;
  x.beginPath(); x.roundRect(px, py - 44, w, 64, 32); x.fill();
  x.fillStyle = color;
  x.fillText(texto, px + 22, py);
  return w;
}

export type DatosPortada = { total: number; conSalario: number; titulo?: string };

export function dibujarPortada(f: Formato, d: DatosPortada): HTMLCanvasElement {
  const { c, x } = lienzo(f);
  fondo(x, f);
  marca(x, f, true);
  const y0 = f.h * 0.36;
  x.fillStyle = ORO;
  x.font = `800 40px ${FUENTE}`;
  x.fillText("NUEVAS VACANTES", 70, y0 - 90);
  x.fillStyle = "#fff";
  x.font = `800 ${f === FORMATOS[1] ? 150 : 140}px ${FUENTE}`;
  const lineas = d.titulo ? partir(x, d.titulo, f.w - 140, 3) : [`${d.total} vacantes`, "para ti"];
  lineas.forEach((l, i) => x.fillText(l, 70, y0 + 40 + i * 160));
  const yb = y0 + 40 + lineas.length * 160 + 20;
  x.font = `600 46px ${FUENTE}`;
  x.fillStyle = "rgba(255,255,255,0.9)";
  const sub = d.conSalario > 0 ? `${d.conSalario} con salario visible. Aplica gratis.` : "Aplica gratis, sin intermediarios.";
  partir(x, sub, f.w - 140, 2).forEach((l, i) => x.fillText(l, 70, yb + i * 60));
  x.font = `700 38px ${FUENTE}`;
  x.fillStyle = ORO;
  x.fillText("Desliza  →", 70, f.h - 110);
  return c;
}

export function dibujarVacante(f: Formato, v: Vacante, n: number, total: number): HTMLCanvasElement {
  const { c, x } = lienzo(f);
  fondo(x, f, false);
  // tarjeta
  const m = 50;
  const alto = f.h - 480;
  x.fillStyle = "#fff";
  x.shadowColor = "rgba(10,47,92,0.12)"; x.shadowBlur = 40; x.shadowOffsetY = 12;
  x.beginPath(); x.roundRect(m, 170, f.w - m * 2, alto, 44); x.fill();
  x.shadowColor = "transparent"; x.shadowBlur = 0; x.shadowOffsetY = 0;
  marca(x, f, false);
  const px = m + 50;
  const an = f.w - px * 2;
  let y = 290;
  x.fillStyle = "#6b7a90";
  x.font = `700 30px ${FUENTE}`;
  x.fillText(`${n} de ${total}`, px, y);
  y += 80;
  x.fillStyle = AZUL;
  x.font = `800 74px ${FUENTE}`;
  const t = partir(x, v.titulo, an, 3);
  t.forEach((l, i) => x.fillText(l, px, y + i * 84));
  y += t.length * 84 + 10;
  if (!sinEmpresa(v)) {
    x.fillStyle = "#33455f";
    x.font = `600 44px ${FUENTE}`;
    const e = partir(x, v.empresa, an, 1);
    x.fillText(e[0]!, px, y + 30);
    y += 70;
  }
  y += 30;
  // salario
  if (v.salarioMin > 0) {
    x.fillStyle = "#e7f6ee";
    x.beginPath(); x.roundRect(px, y, an, 120, 24); x.fill();
    x.fillStyle = VERDE;
    x.font = `800 ${v.salario.length > 22 ? 48 : 58}px ${FUENTE}`;
    x.fillText(v.salario, px + 32, y + 82);
  } else {
    x.fillStyle = "#eef1f6";
    x.beginPath(); x.roundRect(px, y, an, 100, 24); x.fill();
    x.fillStyle = "#6b7a90";
    x.font = `700 40px ${FUENTE}`;
    x.fillText("Salario no publicado", px + 32, y + 66);
  }
  y += (v.salarioMin > 0 ? 120 : 100) + 50;
  // datos
  let xx = px;
  for (const txt of [v.provincia.replace(/\s*\(.*?\)\s*/g, ""), v.modalidad, v.tipo]) {
    const w = pastilla(x, txt, xx, y + 30, "#eaf1ff", AZUL);
    xx += w + 14;
    if (xx > f.w - px - 150) { xx = px; y += 80; }
  }
  y += 100;
  // requisitos
  const reqs = v.requisitos.filter(Boolean).slice(0, f.id === "historia" ? 4 : 3);
  if (reqs.length) {
    x.fillStyle = "#6b7a90";
    x.font = `800 28px ${FUENTE}`;
    x.fillText("REQUISITOS", px, y);
    y += 30;
    x.font = `600 38px ${FUENTE}`;
    for (const r of reqs) {
      const ls = partir(x, r, an - 56, 2);
      x.fillStyle = CTA;
      x.fillText("✓", px, y + 48);
      x.fillStyle = "#1f2d42";
      ls.forEach((l, i) => x.fillText(l, px + 56, y + 48 + i * 48));
      y += ls.length * 48 + 22;
    }
  }
  // botón
  const by = f.h - 270;
  x.fillStyle = CTA;
  x.beginPath(); x.roundRect(m, by, f.w - m * 2, 120, 60); x.fill();
  x.fillStyle = "#fff";
  x.textAlign = "center";
  x.font = `800 46px ${FUENTE}`;
  x.fillText("Aplica gratis en enlace-rd.vercel.app", f.w / 2, by + 77);
  x.textAlign = "left";
  x.fillStyle = "#6b7a90";
  x.font = `600 28px ${FUENTE}`;
  x.textAlign = "center";
  x.fillText("Nunca pagues para ser contratado", f.w / 2, f.h - 100);
  x.textAlign = "left";
  return c;
}

export function dibujarCierre(f: Formato): HTMLCanvasElement {
  const { c, x } = lienzo(f);
  fondo(x, f);
  marca(x, f, true);
  x.fillStyle = "#fff";
  x.font = `800 112px ${FUENTE}`;
  const y0 = f.h * 0.34;
  ["Guárdalo y", "compártelo con", "alguien que", "busca empleo"].forEach((l, i) => x.fillText(l, 70, y0 + i * 130));
  const y1 = y0 + 4 * 130 + 40;
  x.fillStyle = ORO;
  x.font = `700 44px ${FUENTE}`;
  x.fillText("Más vacantes cada día:", 70, y1);
  x.fillStyle = "#fff";
  x.font = `800 56px ${FUENTE}`;
  x.fillText("enlace-rd.vercel.app", 70, y1 + 80);
  x.fillStyle = "rgba(255,255,255,0.85)";
  x.font = `600 38px ${FUENTE}`;
  x.fillText("Canal de WhatsApp: Enlace Laboral", 70, y1 + 150);
  return c;
}

export type Pieza = { nombre: string; url: string; blob: Blob };

function aPieza(c: HTMLCanvasElement, nombre: string): Promise<Pieza> {
  return new Promise((ok, mal) => c.toBlob((b) => (b ? ok({ nombre, blob: b, url: URL.createObjectURL(b) }) : mal(new Error("no se pudo crear la imagen"))), "image/png"));
}

const slug = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

export async function crearCarrusel(f: Formato, vacantes: Vacante[], titulo?: string): Promise<Pieza[]> {
  try { await document.fonts.load(`800 40px ${FUENTE}`); await document.fonts.load(`600 40px ${FUENTE}`); } catch { /* usa la letra de respaldo */ }
  const lista = [
    aPieza(dibujarPortada(f, { total: vacantes.length, conSalario: vacantes.filter((v) => v.salarioMin > 0).length, titulo }), "01-portada.png"),
    ...vacantes.map((v, i) => aPieza(dibujarVacante(f, v, i + 1, vacantes.length), `${String(i + 2).padStart(2, "0")}-${slug(v.titulo) || "vacante"}.png`)),
    aPieza(dibujarCierre(f), `${String(vacantes.length + 2).padStart(2, "0")}-cierre.png`),
  ];
  return Promise.all(lista);
}

/* ---------- textos ---------- */
const HASH_BASE = ["#EmpleosRD", "#VacantesRD", "#TrabajoRD", "#EmpleoDominicana", "#BuscoTrabajo", "#OfertasDeEmpleo"];
const quitaAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");
const hashDe = (t: string) => `#${quitaAcentos(t).replace(/\(.*?\)/g, "").replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).map((p) => p[0]!.toUpperCase() + p.slice(1)).join("")}`;

export function hashtags(vacantes: Vacante[]): string {
  const extra = new Set<string>();
  for (const v of vacantes) {
    const p = hashDe(v.provincia);
    if (p.length > 3 && p.length < 24) extra.add(`#Empleos${p.slice(1)}`);
    const a = hashDe(v.area);
    if (a.length > 3 && a.length < 26) extra.add(`#${a.slice(1)}RD`);
  }
  return [...HASH_BASE, ...[...extra].slice(0, 6)].join(" ");
}

const lineaCorta = (v: Vacante) => `• ${v.titulo}${sinEmpresa(v) ? "" : ` — ${v.empresa}`} · ${v.provincia.replace(/\s*\(.*?\)\s*/g, "")}${v.salarioMin > 0 ? ` · ${v.salario}` : ""}`;

export type Gancho = "dato" | "ubicacion" | "guardar";
export const GANCHOS: { id: Gancho; nombre: string }[] = [
  { id: "dato", nombre: "Con el conteo" },
  { id: "ubicacion", nombre: "Por zona" },
  { id: "guardar", nombre: "Para guardar y compartir" },
];

function gancho(g: Gancho, vacantes: Vacante[]): string {
  const n = vacantes.length;
  const con = vacantes.filter((v) => v.salarioMin > 0).length;
  const conteo = new Map<string, number>();
  vacantes.forEach((v) => { const p = v.provincia.replace(/\s*\(.*?\)\s*/g, ""); conteo.set(p, (conteo.get(p) ?? 0) + 1); });
  const top = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "RD";
  if (g === "ubicacion") return `¿Buscas trabajo en ${top}? Mira estas ${n} vacantes 👇`;
  if (g === "guardar") return `📌 Guarda esta publicación y compártela con alguien que busca empleo.`;
  return `💼 ${n} vacante${n === 1 ? "" : "s"} en RD${con > 0 ? ` (${con} con salario visible)` : ""} 👇`;
}

export function textoRedes(vacantes: Vacante[], g: Gancho): string {
  return [
    gancho(g, vacantes),
    "",
    ...vacantes.map(lineaCorta),
    "",
    "✅ Aplicar es gratis. Nunca pagues para ser contratado.",
    `🔗 Todas las vacantes: ${SITIO}`,
    `📲 Canal de WhatsApp: ${CANAL_WHATSAPP}`,
    "",
    "💬 ¿Conoces a alguien que busca trabajo? Etiquétalo.",
    "",
    hashtags(vacantes),
  ].join("\n");
}

export function textoCanal(vacantes: Vacante[], g: Gancho): string {
  return [
    `*${gancho(g, vacantes).replace(/ 👇$/, "")}*`,
    "",
    ...vacantes.map((v) => `${lineaCorta(v)}\n${SITIO}/vacantes/${v.id}`),
    "",
    "Aplicar es gratis.",
  ].join("\n");
}

/* ---------- zip sin compresión ---------- */
const TABLA = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (d: Uint8Array) => { let c = 0xffffffff; for (let i = 0; i < d.length; i++) c = TABLA[(c ^ d[i]!) & 0xff]! ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

export async function crearZip(piezas: Pieza[]): Promise<Blob> {
  const enc = new TextEncoder();
  const partes: BlobPart[] = [];
  const central: Uint8Array[] = [];
  let pos = 0;
  for (const p of piezas) {
    const datos = new Uint8Array(await p.blob.arrayBuffer());
    const nombre = enc.encode(p.nombre);
    const c = crc(datos);
    const cab = new DataView(new ArrayBuffer(30));
    cab.setUint32(0, 0x04034b50, true); cab.setUint16(4, 20, true); cab.setUint16(6, 0x0800, true);
    cab.setUint32(14, c, true); cab.setUint32(18, datos.length, true); cab.setUint32(22, datos.length, true); cab.setUint16(26, nombre.length, true);
    partes.push(cab.buffer, nombre, datos);
    const ce = new DataView(new ArrayBuffer(46));
    ce.setUint32(0, 0x02014b50, true); ce.setUint16(4, 20, true); ce.setUint16(6, 20, true); ce.setUint16(8, 0x0800, true);
    ce.setUint32(16, c, true); ce.setUint32(20, datos.length, true); ce.setUint32(24, datos.length, true); ce.setUint16(28, nombre.length, true); ce.setUint32(42, pos, true);
    const fila = new Uint8Array(46 + nombre.length);
    fila.set(new Uint8Array(ce.buffer), 0); fila.set(nombre, 46);
    central.push(fila);
    pos += 30 + nombre.length + datos.length;
  }
  const tam = central.reduce((s, f) => s + f.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, piezas.length, true); fin.setUint16(10, piezas.length, true); fin.setUint32(12, tam, true); fin.setUint32(16, pos, true);
  return new Blob([...partes, ...central.map((f) => f as BlobPart), fin.buffer], { type: "application/zip" });
}

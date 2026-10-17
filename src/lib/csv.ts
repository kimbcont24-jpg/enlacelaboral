/** Lector de CSV/TSV (pegado desde Excel o Google Sheets, o archivo .csv). Sin dependencias. */
export function leerTabla(texto: string): string[][] {
  const t = texto.replace(/^﻿/, "").replace(/\r\n?/g, "\n").trim();
  if (!t) return [];
  const primera = t.split("\n")[0] ?? "";
  const cuenta = (c: string) => primera.split(c).length - 1;
  const sep = cuenta("\t") > 0 ? "\t" : cuenta(";") > cuenta(",") ? ";" : ",";
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let comillas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i]!;
    if (comillas) {
      if (c === '"' && t[i + 1] === '"') { celda += '"'; i++; }
      else if (c === '"') comillas = false;
      else celda += c;
    } else if (c === '"') comillas = true;
    else if (c === sep) { fila.push(celda); celda = ""; }
    else if (c === "\n") { fila.push(celda); filas.push(fila); fila = []; celda = ""; }
    else celda += c;
  }
  fila.push(celda);
  filas.push(fila);
  return filas.filter((f) => f.some((x) => x.trim() !== ""));
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const COLUMNAS: Record<string, string[]> = {
  titulo: ["titulo", "puesto", "vacante", "cargo", "posicion"],
  empresa: ["empresa", "compania"],
  provincia: ["provincia", "ubicacion", "ciudad", "lugar"],
  modalidad: ["modalidad"],
  tipo: ["tipo", "tipo de empleo", "jornada"],
  experiencia: ["experiencia"],
  area: ["area", "categoria"],
  salario_min: ["salario min", "salario minimo", "salario desde", "salario", "sueldo", "sueldo minimo"],
  salario_max: ["salario max", "salario maximo", "salario hasta", "sueldo maximo"],
  descripcion: ["descripcion", "funciones", "detalle"],
  requisitos: ["requisitos", "requerimientos"],
  aplicar: ["aplicar", "como aplicar", "contacto", "correo", "email", "whatsapp", "telefono"],
};

export type TablaVacantes = { filas: Record<string, string>[]; reconocidas: string[]; ignoradas: string[]; faltan: string[] };

export function tablaAVacantes(texto: string): TablaVacantes {
  const t = leerTabla(texto);
  if (t.length < 2) return { filas: [], reconocidas: [], ignoradas: [], faltan: ["titulo", "provincia"] };
  const cab = t[0]!.map(norm);
  const mapa: (string | null)[] = cab.map((h) => Object.entries(COLUMNAS).find(([, alias]) => alias.includes(h))?.[0] ?? null);
  const reconocidas = [...new Set(mapa.filter(Boolean) as string[])];
  const ignoradas = t[0]!.filter((_, i) => !mapa[i]).filter((h) => h.trim());
  const filas = t.slice(1).map((r) => {
    const o: Record<string, string> = {};
    mapa.forEach((k, i) => { if (k && !(k in o && o[k])) o[k] = (r[i] ?? "").trim(); });
    return o;
  });
  return { filas, reconocidas, ignoradas, faltan: ["titulo", "provincia"].filter((k) => !reconocidas.includes(k)) };
}

/** Convierte un enlace normal de Google Sheets en el de descarga CSV. Si ya es CSV o no es de Sheets, lo deja igual. */
export function aCsvUrl(url: string): string {
  const u = url.trim();
  const m = u.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);
  if (!m) return u;
  if (/output=csv|format=csv/.test(u)) return u;
  const gid = u.match(/[#&?]gid=(\d+)/);
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv${gid ? `&gid=${gid[1]}` : ""}`;
}

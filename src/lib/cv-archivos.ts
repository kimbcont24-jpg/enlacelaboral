import { cvVacio, lineasLogros, type CV, type Experiencia } from "@/lib/cv";

const nombreArchivo = (cv: CV, ext: string) => `CV-${(cv.nombre.trim() || "mi-cv").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "")}.${ext}`;
function bajar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/* ───────── Word (.docx): texto real, lo leen bien los filtros de las empresas ───────── */

export async function descargarWord(cv: CV, colorHex: string) {
  const { Document, Packer, Paragraph, TextRun, BorderStyle } = await import("docx");
  const color = colorHex.replace("#", "");
  const titulo = (t: string) => new Paragraph({ spacing: { before: 240, after: 80 }, border: { bottom: { color, size: 6, style: BorderStyle.SINGLE, space: 2 } }, children: [new TextRun({ text: t.toUpperCase(), bold: true, size: 20, color, characterSpacing: 40 })] });
  const linea = (t: string, o: { bold?: boolean; size?: number; color?: string } = {}) => new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: t, size: o.size ?? 21, bold: o.bold, color: o.color })] });
  const vineta = (t: string) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 30 }, children: [new TextRun({ text: t, size: 21 })] });
  const hijos: InstanceType<typeof Paragraph>[] = [
    new Paragraph({ children: [new TextRun({ text: cv.nombre.trim() || "Tu nombre", bold: true, size: 44, color })] }),
  ];
  if (cv.puesto.trim()) hijos.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: cv.puesto.trim(), size: 26, color })] }));
  const contacto = [cv.telefono, cv.correo, cv.ciudad, cv.linkedin].map((x) => x.trim()).filter(Boolean).join("  ·  ");
  if (contacto) hijos.push(linea(contacto, { size: 19, color: "5B6678" }));
  if (cv.resumen.trim()) { hijos.push(titulo("Perfil")); hijos.push(linea(cv.resumen.trim())); }
  const exp = cv.experiencia.filter((e) => e.puesto.trim() || e.empresa.trim());
  if (exp.length) {
    hijos.push(titulo("Experiencia"));
    for (const e of exp) {
      const f = [e.desde, e.hasta || (e.desde ? "actualidad" : "")].filter(Boolean).join(" – ");
      hijos.push(new Paragraph({ spacing: { before: 100, after: 30 }, children: [new TextRun({ text: e.puesto, bold: true, size: 22 }), new TextRun({ text: e.empresa ? ` · ${e.empresa}` : "", size: 22, color: "5B6678" }), new TextRun({ text: f ? `   ${f}` : "", size: 19, color: "5B6678" })] }));
      for (const l of lineasLogros(e.logros)) hijos.push(vineta(l));
    }
  }
  const edu = cv.educacion.filter((e) => e.titulo.trim());
  if (edu.length) { hijos.push(titulo("Formación")); for (const e of edu) hijos.push(linea([e.titulo, e.centro, e.anio].filter((x) => x.trim()).join(" · "))); }
  const cur = (cv.cursos ?? []).filter((c) => c.nombre.trim());
  if (cur.length) { hijos.push(titulo("Cursos y certificaciones")); for (const c of cur) hijos.push(linea([c.nombre, c.centro, c.anio].filter((x) => x.trim()).join(" · "))); }
  if (cv.habilidades.trim()) { hijos.push(titulo("Habilidades")); hijos.push(linea(cv.habilidades.split(",").map((h) => h.trim()).filter(Boolean).join(" · "))); }
  const otros = [cv.idiomas.trim() && `Idiomas: ${cv.idiomas.trim()}`, cv.licencia.trim() && `Licencia de conducir: ${cv.licencia.trim()}`, cv.disponibilidad.trim() && `Disponibilidad: ${cv.disponibilidad.trim()}`, cv.referencias && "Referencias disponibles a solicitud."].filter(Boolean) as string[];
  if (otros.length) { hijos.push(titulo("Otros datos")); for (const o of otros) hijos.push(linea(o)); }
  const doc = new Document({ styles: { default: { document: { run: { font: "Calibri" } } } }, sections: [{ properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } }, children: hijos.map((p) => p) }] });
  bajar(await Packer.toBlob(doc), nombreArchivo(cv, "docx"));
}

/* ───────── Imagen (.png) para mandar por WhatsApp ───────── */

export async function descargarImagen(nodo: HTMLElement, cv: CV) {
  const { toPng } = await import("html-to-image");
  const url = await toPng(nodo, { pixelRatio: 2, backgroundColor: "#ffffff", style: { transform: "none", position: "static", boxShadow: "none" } });
  const blob = await (await fetch(url)).blob();
  bajar(blob, nombreArchivo(cv, "png"));
}

/* ───────── Importar un CV que la persona ya tiene ───────── */

export async function leerArchivo(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf" || file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const paginas: string[] = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 4); i++) {
      const pg = await pdf.getPage(i);
      const tc = await pg.getTextContent();
      // Junta los trozos por renglón; si hay dos columnas (diseños con barra lateral), lee primero una y luego la otra.
      type Pieza = { x: number; fin: number; t: string };
      const filas = new Map<number, Pieza[]>();
      for (const it of tc.items as { str: string; transform: number[]; width: number }[]) {
        if (!it.str) continue;
        const y = Math.round(it.transform[5]! / 3) * 3;
        if (!filas.has(y)) filas.set(y, []);
        filas.get(y)!.push({ x: it.transform[4]!, fin: it.transform[4]! + (it.width || 0), t: it.str });
      }
      const segmentos = [...filas.entries()].sort((a, b) => b[0] - a[0]).map(([y, ps]) => {
        ps.sort((a, b) => a.x - b.x);
        const segs: Pieza[] = [];
        for (const p of ps) {
          const u = segs[segs.length - 1];
          if (u && p.x - u.fin < 40) { u.t += p.x - u.fin > 1.5 && !u.t.endsWith(" ") ? ` ${p.t}` : p.t; u.fin = Math.max(u.fin, p.fin); }
          else segs.push({ ...p });
        }
        return { y, segs: segs.map((s) => ({ ...s, t: s.t.replace(/\s+/g, " ").trim() })).filter((s) => s.t) };
      });
      // ¿Dos columnas (barra lateral)? Busca un "pasillo" vertical que ningún texto cruza, con texto a ambos lados.
      const ancho = pg.getViewport({ scale: 1 }).width;
      const segs = segmentos.flatMap((f) => f.segs);
      const bins = new Array(Math.ceil(ancho / 2)).fill(0) as number[];
      for (const sg of segs) for (let x = Math.floor(sg.x / 2); x < Math.ceil(sg.fin / 2) && x < bins.length; x++) bins[x]!++;
      let corte = 0;
      for (let i = Math.floor((ancho * 0.2) / 2); i < Math.floor((ancho * 0.72) / 2); i++) {
        let j = i; while (j < bins.length && bins[j]! === 0) j++;
        if ((j - i) * 2 >= 18) {
          const xa = i * 2, xb = j * 2;
          const der = segs.filter((sg) => sg.x >= xb && sg.x < xb + 30).length, izq = segs.filter((sg) => sg.fin <= xa).length;
          if (der >= 6 && izq >= 6) { corte = (xa + xb) / 2; break; }
        }
        i = j;
      }
      if (corte) {
        const izq = segmentos.map((f) => f.segs.filter((sg) => sg.x < corte).map((sg) => sg.t).join(" ")).filter(Boolean);
        const der = segmentos.map((f) => f.segs.filter((sg) => sg.x >= corte).map((sg) => sg.t).join(" ")).filter(Boolean);
        // La columna principal (más texto) va primero, para que el nombre y el perfil queden arriba.
        const largo = (l: string[]) => l.join("").length;
        paginas.push((largo(der) > largo(izq) ? [...der, ...izq] : [...izq, ...der]).join("\n"));
      } else paginas.push(segmentos.map((f) => f.segs.map((sg) => sg.t).join(" ")).join("\n"));
    }
    return paginas.join("\n");
  }
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return r.value;
  }
  return await file.text();
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const TITULOS: [keyof typeof secciones0, RegExp][] = [
  ["resumen", /^(perfil( profesional)?|resumen( profesional)?|objetivo( profesional| laboral)?|sobre mi|acerca de mi|presentacion)\s*:?$/],
  ["experiencia", /^(experiencia( laboral| profesional)?|historial laboral|trayectoria( laboral)?|empleos anteriores)\s*:?$/],
  ["educacion", /^(educacion|formacion( academica)?|estudios( realizados)?|preparacion academica)\s*:?$/],
  ["cursos", /^(cursos( y talleres)?|certificaciones|cursos y certificaciones|talleres|capacitaciones|diplomados)\s*:?$/],
  ["habilidades", /^(habilidades|competencias|destrezas|aptitudes|conocimientos( informaticos)?|habilidades y competencias)\s*:?$/],
  ["idiomas", /^idiomas\s*:?$/],
  ["otros", /^(referencias( personales| laborales)?|datos personales|informacion adicional|otros datos|contacto|datos de contacto|informacion de contacto)\s*:?$/],
];
const secciones0 = { cabeza: [] as string[], resumen: [] as string[], experiencia: [] as string[], educacion: [] as string[], cursos: [] as string[], habilidades: [] as string[], idiomas: [] as string[], otros: [] as string[] };
const RE_ANIO = /(19|20)\d{2}/;
const limpiar = (l: string) => l.replace(/^\s*[-•*▪●◦·]\s*/, "").trim();
/** Renglones que no son contenido de la sección (referencias, iniciales sueltas, datos de otra parte). */
const util = (l: string) => l.length > 3 && !/referencias|a solicitud|disponibilidad\s*:|licencia de conducir/i.test(l) && !/^[A-ZÁÉÍÓÚÑ]{1,3}$/.test(l.trim());

/** Convierte el texto de un CV en campos. Es una ayuda: la persona revisa todo antes de usarlo. */
export function interpretarCV(texto: string): CV {
  // Guiones que algunos PDF guardan como símbolos raros.
  const crudas = texto.replace(/[\ue000-\uf8ff]/g, " ").replace(/[\u2011\u2012]/g, "-").replace(/\u00ad/g, "").split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  // Une renglones cortados: si empieza en minúscula, sigue la frase anterior.
  const lineas: string[] = [];
  for (const l of crudas) {
    const prev = lineas[lineas.length - 1];
    if (prev && ((/^[a-záéíóúñ(]/.test(l) && !/[.:]$/.test(prev)) || /,$/.test(prev))) lineas[lineas.length - 1] += ` ${l}`;
    else lineas.push(l);
  }
  const s = structuredClone(secciones0);
  let actual: keyof typeof s = "cabeza";
  for (const l of lineas) {
    const t = sinAcentos(l).replace(/[^a-zñ ]/g, "").trim();
    const junto = t.replace(/ /g, "");
    const hit = l.length < 60 ? TITULOS.find(([, re]) => re.test(t) || new RegExp(re.source.replace(/ /g, "\\s?")).test(junto)) : undefined;
    if (hit) { actual = hit[0]; continue; }
    s[actual].push(l);
  }
  const todo = lineas.join("\n");
  const correo = todo.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/)?.[0] ?? "";
  const telRaw = todo.match(/(\+?1[^\d\n]{0,3})?\(?(809|829|849)\)?[^\d\n]{0,3}\d{3}[^\d\n]{0,3}\d{4}/)?.[0] ?? "";
  const tel = telRaw.replace(/\D/g, "").slice(-10);
  const telefono = tel.length === 10 ? `${tel.slice(0, 3)}-${tel.slice(3, 6)}-${tel.slice(6)}` : "";
  const linkedin = todo.match(/linkedin\.com\/in\/[\w-]+/i)?.[0] ?? "";
  const cabeza = s.cabeza.filter((l) => !l.includes("@") && !/\d{3}.*\d{4}/.test(l) && !/linkedin/i.test(l));
  const nombre = cabeza.find((l) => l.split(" ").length >= 2 && l.split(" ").length <= 5 && !/\d/.test(l) && !/curriculum|vitae|hoja de vida/i.test(l)) ?? "";
  const despues = cabeza.slice(cabeza.indexOf(nombre) + 1);
  const puesto = despues.find((l) => l.length > 3 && l.length < 50 && /[a-záéíóúñ]/.test(l) && !/\d/.test(l) && !/,/.test(l)) ?? "";
  const ciudad = todo.match(/\b(Santo Domingo( Este| Norte| Oeste)?|Distrito Nacional|Santiago|La Romana|Punta Cana|Puerto Plata|San Crist[oó]bal|La Vega|San Pedro de Macor[ií]s|Hig[uü]ey|Moca|San Francisco de Macor[ií]s|Ban[ií]|Bávaro|Bavaro|Azua|Bonao)\b/i)?.[0] ?? "";

  // Experiencia: un renglón con año abre un trabajo nuevo; lo demás son logros.
  const exp: Experiencia[] = [];
  let cur: Experiencia | null = null;
  for (const raw of s.experiencia) {
    const l = limpiar(raw);
    const esViñeta = /^\s*[-•*▪●◦]/.test(raw);
    if (!esViñeta && (RE_ANIO.test(l) || (!cur && l.length < 70))) {
      const anios = l.match(/((ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z.]*\s*)?(19|20)\d{2}/gi) ?? [];
      const actualidad = /actual|presente|la fecha/i.test(l);
      const sinFechas = l.replace(/((ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z.]*\s*)?(19|20)\d{2}/gi, "").replace(/actualidad|presente|a la fecha|hasta|desde|[()–-]+\s*$/gi, "").replace(/[\s|·,–-]+$/, "").trim();
      const partes = sinFechas.replace(/[\s–-]+$/, "").split(/\s+[|·–-]\s+|\s+en\s+|,\s*/).map((x) => x.trim()).filter(Boolean);
      if (cur && !cur.desde && anios.length && !partes.length) { cur.desde = anios[0] ?? ""; cur.hasta = actualidad ? "" : anios[1] ?? ""; continue; }
      cur = { puesto: partes[0] ?? "", empresa: partes[1] ?? "", desde: anios[0] ?? "", hasta: actualidad ? "" : anios[1] ?? "", logros: "" };
      exp.push(cur);
    } else if (cur) {
      if (!cur.empresa && !esViñeta && l.length < 50 && !/[.]$/.test(l) && !cur.logros) cur.empresa = l;
      else cur.logros = [cur.logros, l].filter(Boolean).join("\n");
    }
  }
  const edu = s.educacion.map(limpiar).filter(util).slice(0, 6).map((l) => {
    const anio = l.match(RE_ANIO)?.[0] ?? "";
    const [titulo = "", centro = ""] = l.replace(RE_ANIO, "").replace(/[()–-]+\s*$/, "").split(/\s+[|·–-]\s+|,\s*/).map((x) => x.trim());
    return { titulo, centro, anio };
  });
  const cursos = s.cursos.map(limpiar).filter(util).slice(0, 8).map((l) => {
    const anio = l.match(RE_ANIO)?.[0] ?? "";
    const [nombre = "", centro = ""] = l.replace(RE_ANIO, "").replace(/[()–-]+\s*$/, "").split(/\s+[|·–-]\s+|,\s*/).map((x) => x.trim());
    return { nombre, centro, anio };
  });
  const habilidades = s.habilidades.filter(util).flatMap((l) => limpiar(l).split(/[,;•·|]/)).map((h) => h.trim()).filter((h) => h.length > 1 && h.length < 45).slice(0, 15).join(", ");
  const idiomas = s.idiomas.filter(util).flatMap((l) => limpiar(l).split(/[,;•·|]/)).map((h) => h.trim()).filter(Boolean).slice(0, 5).join(", ");

  return {
    ...cvVacio,
    nombre, puesto, telefono, correo, ciudad, linkedin,
    // Sin título de perfil: los renglones largos de arriba (después del nombre) suelen serlo.
    resumen: (s.resumen.length ? s.resumen.map(limpiar) : despues.filter((l) => l.length >= 50)).join(" ").slice(0, 700),
    experiencia: exp.length ? exp.slice(0, 8) : cvVacio.experiencia,
    educacion: edu.length ? edu : cvVacio.educacion,
    cursos, habilidades, idiomas,
    disponibilidad: lineas.find((l) => /^disponibilidad\s*:/i.test(l))?.replace(/^disponibilidad\s*:\s*/i, "").slice(0, 120) ?? "",
    licencia: lineas.find((l) => /licencia de conducir\s*:/i.test(l))?.replace(/^.*licencia de conducir\s*:\s*/i, "").slice(0, 40) ?? "",
  };
}

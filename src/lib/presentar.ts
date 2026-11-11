import type { Vacante } from "@/lib/vacantes";

/**
 * Presentador de vacantes: convierte el texto corrido de una vacante (muchas veces un solo párrafo
 * del tipo «Funciones: a; b; c. Ofrece… Postular no tiene costo.») en secciones claras.
 * Solo reacomoda lo que ya dice la vacante: no inventa nada.
 */
export type Presentacion = {
  resumen: string[];
  lista: string[];
  funciones: string[];
  imprescindibles: string[];
  /** Cualidades cortas («Orden», «Trabajo en equipo»): se muestran como etiquetas, no como requisitos. */
  cualidades: string[];
  suman: string[];
  ofrece: string[];
  notas: string[];
  salarioTexto: string;
  gestor: string;
  gratis: boolean;
};

const mayus = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const limpiar = (s: string) => mayus(s.trim().replace(/^[-•*▪●✓✔·]\s*/, "").replace(/\s*[.;,]+$/, "").trim());

/** Parte por un separador sin cortar lo que va entre paréntesis. */
function partir(texto: string, sep: RegExp): string[] {
  const out: string[] = [];
  let nivel = 0;
  let actual = "";
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]!;
    if (ch === "(") nivel++;
    if (ch === ")") nivel = Math.max(0, nivel - 1);
    if (nivel === 0) {
      const m = texto.slice(i).match(sep);
      if (m && m.index === 0) { out.push(actual); actual = ""; i += m[0].length - 1; continue; }
    }
    actual += ch;
  }
  out.push(actual);
  return out.map(limpiar).filter((x) => x.length > 1);
}

/** Lista con «;» o, si no hay, con comas y la última «y». */
function items(texto: string): string[] {
  if (texto.includes(";")) return partir(texto, /^;\s*/);
  const partes = partir(texto, /^,(?!\d)\s*/);
  // «a, b y c»: solo se separa la última «y», y solo si ambos lados son frases (no «elaborar y actualizar»).
  const ult = partes.pop() ?? "";
  const y = partir(ult, /^\s+y\s+(?=[a-záéíóúñ])/i);
  const ok = y.length === 2 && y.every((x) => x.split(/\s+/).length >= 2);
  return [...partes, ...(ok ? y : [limpiar(ult)])].filter((x) => x.length > 1);
}

function oraciones(texto: string): string[] {
  return texto.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡"«(])/).map((s) => s.trim()).filter(Boolean);
}

const RE_GESTOR = /^vacante gestionada por\s+([^.]+?)(?:\s+para\s+(.+?))?\.?$/i;
const RE_GRATIS = /(postular|aplicar|el proceso)[^.]*(no tiene costo|es gratis|gratuit)|no (te )?cobramos/i;
const RE_FUNC = /^(funciones|responsabilidades|tareas|lo que har[aá]s|actividades)\s*(principales)?\s*:\s*(.*)$/i;
const RE_SUMA = /^(suma|suman|deseable|valoramos|es un plus|plus|se valora)\s*:\s*(.*)$/i;
const RE_OFRECE = /^(te ofrecemos|ofrecemos|se ofrece|ofrecen|ofrece|beneficios)\s*:?\s*(.*)$/i;
const RE_SALARIO = /^salario(\s+publicado[^:]*)?\s*:\s*(.*)$/i;
const RE_NOTA = /^(horario|ubicaci[oó]n|lugar|jornada|disponibilidad|nota|importante)\b/i;

type Cubo = "funciones" | "suman" | "ofrece" | "requisitos" | "lista";
function cuboDe(titulo: string): Cubo {
  const t = titulo.toLowerCase();
  if (/funci|responsab|tarea|actividad|har[aá]s/.test(t)) return "funciones";
  if (/requisit|perfil|requer|buscamos|necesitas/.test(t)) return "requisitos";
  if (/benefic|ofrec/.test(t)) return "ofrece";
  if (/deseable|suma|plus|valora/.test(t)) return "suman";
  return "lista";
}

const RE_DESEABLE = /^(deseable(mente)?|preferible(mente)?|valorable|se valoran?|plus|suma|es un plus)\b[:\s]*/i;

const ENTIDADES: Record<string, string> = { aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ", uuml: "ü", amp: "&", quot: '"', nbsp: " ", iquest: "¿", iexcl: "¡" };
const entidades = (t: string) => t.replace(/&#0*149;/g, "•").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&([a-zA-Z]+);/g, (m, n) => ENTIDADES[n] ?? m);
/** Viñetas que el lector de imágenes confunde con una «e» o una «Q». */
const sinVinetaFalsa = (t: string) => t.replace(/^(?:e|Q|o|°|»)\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/, "");
const CABECERAS = "funciones|responsabilidades|requisitos|requerimientos|perfil|ofrecemos|beneficios|te ofrecemos|deseable|competencias";
const PREPOSICION_FINAL = /\s(de|del|la|las|el|los|y|en|a|con|para|por|según|o)$/i;

/** Limpia el texto que llega del robot o de un flyer: entidades, líneas cortadas, viñetas en línea y la coletilla del portal. */
function normalizar(texto: string): string {
  let t = entidades(texto || "").replace(/\r/g, "");
  // La coletilla del recolector («Publicada por la empresa en el portal X…») ya se muestra en «Fuente».
  t = t.replace(/\s*-?Requerimientos-[\s\S]*$/i, "").replace(/\s*Publicada (?:el \d{4}-\d{2}-\d{2}\s*)?(?:por la empresa )?(?:en el portal|el \d)[\s\S]*$/i, "");
  // «Funciones: - a. - b. Requisitos: - c» → líneas.
  t = t.replace(new RegExp(`\\s*\\b(${CABECERAS})\\s*:\\s*(?=-\\s)`, "gi"), (_, c: string) => `\n${mayus(c)}:\n`);
  if ((t.match(/\s-\s*[A-ZÁÉÍÓÚÑ¿¡]/g) ?? []).length >= 3) t = t.replace(/\s+-\s*(?=[A-ZÁÉÍÓÚÑ¿¡])/g, "\n- ");
  // Líneas cortadas a la mitad (PDF o imagen): se vuelven a unir.
  const lineas = t.split("\n");
  const out: string[] = [];
  for (const raw of lineas) {
    const l = sinVinetaFalsa(raw.trim());
    const prev = out[out.length - 1];
    if (prev !== undefined && l && prev.trim() && !/[.:;!?]$/.test(prev.trim()) && !/^(?:[-•*▪●✓✔·]|\d+[.)])\s/.test(l) && (/^[a-záéíóúñ(]/.test(l) || PREPOSICION_FINAL.test(prev.trim()))) {
      out[out.length - 1] = `${prev.trim()} ${l}`;
    } else out.push(l);
  }
  return out.join("\n");
}

/** Une requisitos que el lector partió en dos («…según normas de la» + «DGII»). */
function unirPartidos(reqs: string[]): string[] {
  const out: string[] = [];
  for (const raw of reqs) {
    const r = sinVinetaFalsa(entidades(raw).trim()).replace(/^\d+[.)]\s+/, "").replace(/^[-•*▪●·]\s*/, "");
    if (!r) continue;
    const prev = out[out.length - 1];
    if (prev && !/[.:;!?]$/.test(prev) && (/^[a-záéíóúñ(]/.test(r) || PREPOSICION_FINAL.test(prev))) out[out.length - 1] = `${prev} ${r}`;
    else out.push(r);
  }
  return out;
}

const RE_REQ_DURO = /^(educaci|bachiller|licenci|t[eé]cnic|grado|estudiante|experiencia|m[ií]nimo|manejo|dominio|conocimiento|disponibilidad|ingl[eé]s|residir|residente|veh[ií]culo|carro|motor|excel|office|word)/i;
const BASURA = /^(condiciones laborales|informaci[oó]n no disponible|modalidad|trabajo presencial|empresa verificada|publicado|publicada|requisitos|beneficios|c[oó]mo aplicar\b.*)$/i;

export function presentar(job: Pick<Vacante, "descripcion" | "requisitos" | "salarioMin">): Presentacion {
  const p: Presentacion = { resumen: [], lista: [], funciones: [], imprescindibles: [], cualidades: [], suman: [], ofrece: [], notas: [], salarioTexto: "", gestor: "", gratis: false };
  const extraReq: string[] = [];
  let cubo: Cubo | null = null;

  const oracion = (o: string) => {
    let s = o.trim();
    if (!s) return;
    let m: RegExpMatchArray | null;
    if ((m = s.match(RE_GESTOR))) { p.gestor = m[1]!.trim(); if (m[2]) p.resumen.push(mayus(`Para ${m[2].trim().replace(/\.$/, "")}.`)); return; }
    if (RE_GRATIS.test(s)) { p.gratis = true; return; }
    if ((m = s.match(RE_FUNC))) { p.funciones.push(...items(m[3]!)); return; }
    if ((m = s.match(RE_SUMA))) { p.suman.push(...items(m[2]!)); return; }
    if ((m = s.match(RE_SALARIO))) { if (job.salarioMin <= 0) p.salarioTexto = limpiar(m[2]!); return; }
    // «Ubicación por confirmar» suele venir pegada al final de otra oración.
    if (/ubicaci[oó]n por confirmar/i.test(s)) {
      const lugar = s.match(/ubicaci[oó]n por confirmar\s*(\(([^)]+)\))?/i);
      p.notas.push(lugar?.[2] ? `La dirección exacta se confirma en el proceso (${lugar[2]}).` : "La dirección exacta se confirma en el proceso.");
      s = s.replace(/ubicaci[oó]n por confirmar\s*(\([^)]*\))?\.?/i, "").trim();
      if (!s) return;
    }
    if ((m = s.match(RE_OFRECE)) && m[2]) { p.ofrece.push(...items(m[2])); return; }
    if (/^(ofrece|se ofrece)/i.test(s) || (/beneficios de ley|salario competitivo/i.test(s) && s.length < 160 && !/busca|contrata|solicita/i.test(s))) {
      p.ofrece.push(...items(s.replace(/^(ofrecemos|se ofrece|ofrece)\s*/i, "")));
      return;
    }
    if (RE_NOTA.test(s) && s.length < 160) { p.notas.push(mayus(s.replace(/\.$/, "")) + "."); return; }
    p.resumen.push(s);
  };

  for (const raw of normalizar(job.descripcion).split(/\n/)) {
    const l = raw.trim();
    if (!l) continue;
    const vineta = l.match(/^(?:[-•*▪●✓✔·]|\d+[.)])\s+(.*)$/);
    const titulo = l.match(/^([^:.]{3,40}):\s*$/);
    if (titulo) { cubo = cuboDe(titulo[1]!); continue; }
    if (vineta) {
      const x = limpiar(vineta[1]!);
      const c = cubo ?? "lista";
      if (c === "requisitos") extraReq.push(x);
      else if (c === "lista") p.lista.push(x);
      else p[c].push(x);
      continue;
    }
    cubo = null;
    oraciones(l).forEach(oracion);
  }

  const vistos = new Set<string>();
  const clave = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  let cuboReq: Cubo | "nota" | null = null;
  for (const r0 of unirPartidos([...job.requisitos, ...extraReq])) {
    const r = r0.replace(/[\s.;,]+$/, "").trim();
    const cab = r.match(/^([^:]{3,40}):$/);
    if (cab) { cuboReq = cuboDe(cab[1]!); continue; }
    if (BASURA.test(r) || r.length < 3) continue;
    const k = clave(r);
    if (!k || vistos.has(k)) continue;
    vistos.add(k);
    if (/^nota\s*:/i.test(r)) { p.notas.push(mayus(r.replace(/^nota\s*:\s*/i, "")) + "."); continue; }
    if (cuboReq === "ofrece") { p.ofrece.push(limpiar(r)); continue; }
    if (cuboReq === "funciones") { p.funciones.push(limpiar(r)); continue; }
    if (RE_DESEABLE.test(r) || /^se valora/i.test(r)) p.suman.push(limpiar(r.replace(RE_DESEABLE, "").replace(/^se valoran?\s*/i, "")));
    else if (r.split(/\s+/).length <= 3 && !/\d/.test(r) && !/[,(]/.test(r) && !RE_REQ_DURO.test(r)) p.cualidades.push(mayus(r));
    else p.imprescindibles.push(mayus(r));
  }
  // Si casi todo son cualidades, se dejan como requisitos para que la lista no quede vacía.
  if (!p.imprescindibles.length && p.cualidades.length) { p.imprescindibles = p.cualidades; p.cualidades = []; }
  p.funciones = [...new Set(p.funciones)];
  // «Puesto para X: tarea a, tarea b, tarea c…» → una idea corta + la lista de tareas.
  if (!p.funciones.length) {
    for (let i = 0; i < p.resumen.length; i++) {
      const m = p.resumen[i]!.match(/^([^:]{15,}?):\s+(.+)$/);
      if (!m) continue;
      const lista = items(m[2]!.replace(/\.$/, ""));
      if (lista.length < 3) continue;
      p.resumen[i] = `${m[1]!.trim()}.`;
      p.funciones = lista;
      break;
    }
  }
  const RE_COMO = /^(o\s+)?(ven|env[ií]a|escr[ií]be|llama|aplica|post[uú]late|presenta|pasa por|acude|dir[ií]gete)\b/i;
  p.notas.push(...p.ofrece.filter((x) => RE_COMO.test(x)).map((x) => mayus(x.replace(/^o\s+/i, "")) + "."));
  p.ofrece = [...new Set(p.ofrece.filter((x) => !RE_COMO.test(x)))];
  p.suman = [...new Set(p.suman)];
  return p;
}

/** Nombre de la empresa para mostrar (las confidenciales se dicen claro). */
export function nombreEmpresa(empresa: string): string {
  if (!empresa || empresa === "Empresa no indicada" || /^(…|\.\.\.)|confidencial/i.test(empresa)) return "Empresa confidencial";
  return empresa;
}
export const empresaOculta = (empresa: string) => nombreEmpresa(empresa) === "Empresa confidencial";

/** Primera idea de la vacante, para tarjetas y la portada de la página. */
export function lema(job: Pick<Vacante, "descripcion" | "requisitos" | "salarioMin">, max = 180): string {
  const r = presentar(job).resumen.find((s) => !/^para /i.test(s)) ?? "";
  if (r.length <= max) return r;
  const corte = r.slice(0, max);
  return corte.slice(0, corte.lastIndexOf(" ")).replace(/[,;:]$/, "") + "…";
}

export type TipoBeneficio = "dinero" | "ley" | "bono" | "formacion" | "crecimiento" | "transporte" | "comida" | "horario" | "otro";
export function tipoBeneficio(b: string): TipoBeneficio {
  const t = b.toLowerCase();
  if (/salari|sueldo|comisi|incentiv/.test(t)) return "dinero";
  if (/ley|ars|afp|seguro|tss|prestaci/.test(t)) return "ley";
  if (/regal|bono|bonific|propina/.test(t)) return "bono";
  if (/capacit|formaci|entrenamiento|aprendiz|curso/.test(t)) return "formacion";
  if (/desarroll|crecimiento|estabil|carrera|ascen/.test(t)) return "crecimiento";
  if (/transport|ruta|combustible|veh[ií]culo/.test(t)) return "transporte";
  if (/comida|almuerzo|aliment|comedor|dormida/.test(t)) return "comida";
  if (/horario|flexib|remoto|casa|libre/.test(t)) return "horario";
  return "otro";
}

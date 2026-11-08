import { lineasLogros, type CV } from "@/lib/cv";

/**
 * Asistente de redacción sin inventar datos: reordena lo que la persona escribió para que suene profesional
 * (verbo de acción en pasado, sin muletillas) y le pide el número que falta con [corchetes].
 */

const IRREGULARES: Record<string, string> = {
  hacer: "hice", poner: "puse", tener: "tuve", conducir: "conduje", traducir: "traduje", producir: "produje", ir: "fui", dar: "di", ver: "vi", ser: "fui", estar: "estuve", decir: "dije", traer: "traje", saber: "supe", querer: "quise", poder: "pude", reducir: "reduje", introducir: "introduje", mantener: "mantuve", obtener: "obtuve", contener: "contuve", proponer: "propuse", componer: "compuse", disponer: "dispuse", atraer: "atraje", satisfacer: "satisfice", deshacer: "deshice", elegir: "elegí", construir: "construí", distribuir: "distribuí", incluir: "incluí", contribuir: "contribuí", leer: "leí", oír: "oí",
};
const ACENTO: Record<string, string> = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };

/** "vender" → "vendí", "organizar" → "organicé", "cargar" → "cargué", "atender" → "atendí". */
export function pasado(inf: string): string {
  const v = inf.toLowerCase();
  if (IRREGULARES[v]) return IRREGULARES[v]!;
  if (v.endsWith("ar")) {
    const r = v.slice(0, -2);
    if (r.endsWith("c")) return `${r.slice(0, -1)}qué`;
    if (r.endsWith("g")) return `${r}ué`;
    if (r.endsWith("z")) return `${r.slice(0, -1)}cé`;
    return `${r}é`;
  }
  if (v.endsWith("er") || v.endsWith("ir")) return `${v.slice(0, -2)}í`;
  return v;
}
/** "atendía" → "atendí", "llevaba" → "llevé", "atendiendo" → "atendí". */
function aPasado(palabra: string): string | null {
  const w = palabra.toLowerCase();
  if (/^[a-záéíóúñ]+aba$/.test(w)) { const inf = `${w.slice(0, -3)}ar`; return pasado(inf); }
  if (/^[a-záéíóúñ]+ía$/.test(w) && w.length > 4) { const r = w.slice(0, -2); return IRREGULARES[`${r}er`] ?? `${r}í`; }
  if (/^[a-záéíóúñ]+ando$/.test(w)) return pasado(`${w.slice(0, -4)}ar`);
  if (/^[a-záéíóúñ]+(iendo|yendo)$/.test(w)) { const r = w.replace(/(iendo|yendo)$/, ""); return IRREGULARES[`${r}er`] ?? IRREGULARES[`${r}ir`] ?? `${r}í`; }
  if (/^[a-záéíóúñ]+(ar|er|ir)$/.test(w) && w.length > 3) return pasado(w);
  return null;
}
const mayus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const punto = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);
const MULETILLAS = /\b(diferentes|diversas|diversos|varias|varios|todo tipo de|entre otras( cosas)?|etc\.?|y demás|cosas como)\s*/gi;

export type Mejora = { texto: string; razon: string };

export function mejorarLogro(original: string): Mejora[] {
  let t = original.trim().replace(/\s+/g, " ").replace(/^[-•*]\s*/, "");
  if (t.length < 4) return [];
  const sinMuletillas = t.replace(MULETILLAS, "").replace(/\s+([,.])/g, "$1").replace(/\s{2,}/g, " ").trim();
  const out: Mejora[] = [];
  // 1) Quita «encargado de», «responsable de», «me encargaba de», «mis funciones eran»…
  const re = /^(yo\s+)?((era|fui|estaba)\s+)?((el|la)\s+)?(encargad[oa]s?|responsable|me encargaba|me encargué|mis funciones eran|mi función era|funciones:|tareas:|ayudaba|apoyaba|me dedicaba)\s+(de|a|en|:)?\s*/i;
  let base = sinMuletillas;
  const m = base.match(re);
  if (m) base = base.slice(m[0].length);
  const [primera = "", ...resto] = base.split(" ");
  const conv = aPasado(primera.replace(/[,.:;]$/, ""));
  if (conv) out.push({ texto: punto(mayus([conv, ...resto].join(" "))), razon: "Empieza con un verbo de acción en pasado" });
  else if (m) out.push({ texto: punto(mayus(`me encargué de ${base}`)), razon: "Más directo, en primera persona" });
  else if (sinMuletillas !== t) out.push({ texto: punto(mayus(sinMuletillas)), razon: "Sin palabras de relleno" });
  const mejor = out[0]?.texto ?? punto(mayus(sinMuletillas));
  // 2) Pide el número que hace creíble el logro (sin inventarlo).
  if (!/\d/.test(mejor)) {
    const sinP = mejor.replace(/\.$/, "");
    if (/\b(client|llamad|pedid|factur|paciente|huésped|mesa|ticket|entrega|cobr|despach)/i.test(sinP)) out.push({ texto: `${sinP}: un promedio de [número] por día.`, razon: "Con número: cuántos por día" });
    else if (/\b(venta|vend)/i.test(sinP)) out.push({ texto: `${sinP}, cumpliendo la meta [número] de [número] meses.`, razon: "Con número: metas cumplidas" });
    else if (/\b(caja|cuadre)/i.test(sinP)) out.push({ texto: `${sinP}, sin diferencias durante [número] meses.`, razon: "Con número: cuánto tiempo sin errores" });
    else if (/\b(inventario|producto|almac|mercanc)/i.test(sinP)) out.push({ texto: `${sinP}, con más de [número] productos.`, razon: "Con número: cuánto manejabas" });
    out.push({ texto: `${sinP}, logrando [resultado: más ventas, menos errores, menos tiempo].`, razon: "Con el resultado que lograste" });
  }
  t = mejor;
  return out.filter((x, i, a) => x.texto !== original.trim() && a.findIndex((y) => y.texto === x.texto) === i).slice(0, 3);
}

/** Años de experiencia contando desde el primer año que aparece. */
function anios(cv: CV): number {
  const ys = cv.experiencia.map((e) => Number(e.desde.match(/(19|20)\d{2}/)?.[0])).filter((y) => y > 1970);
  if (!ys.length) return 0;
  return Math.max(0, new Date().getFullYear() - Math.min(...ys));
}

/** Arma un perfil con SOLO los datos del CV. Lo que falta va entre [corchetes]. */
export function perfilDesdeDatos(cv: CV): string[] {
  const puesto = cv.puesto.trim() || cv.experiencia.find((e) => e.puesto.trim())?.puesto.trim() || "[puesto]";
  const a = anios(cv);
  const hab = cv.habilidades.split(",").map((h) => h.trim()).filter(Boolean);
  const top = hab.slice(0, 3).map((h) => (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(h) ? h.charAt(0).toLowerCase() + h.slice(1) : h));
  const lista = (l: string[]) => l.length < 2 ? l.join("") : `${l.slice(0, -1).join(", ")} ${/^(i|hi)/i.test(l[l.length - 1]!) ? "e" : "y"} ${l[l.length - 1]}`;
  const empresas = cv.experiencia.map((e) => e.empresa.trim()).filter(Boolean).slice(0, 2);
  const logro = cv.experiencia.flatMap((e) => lineasLogros(e.logros)).find((l) => /\d/.test(l) && !/\[/.test(l));
  const ingles = /ingl[eé]s\s*\((avanzado|intermedio|nativo)/i.exec(cv.idiomas)?.[1];
  const tiempo = a >= 1 ? `${a} ${a === 1 ? "año" : "años"} de experiencia` : "experiencia";
  const exp = cv.experiencia.some((e) => e.puesto.trim());
  const ops: string[] = [];
  ops.push([
    exp ? `${mayus(puesto)} con ${tiempo}${empresas.length ? ` en empresas como ${empresas.join(" y ")}` : ""}.` : `${mayus(puesto)} con muchas ganas de aprender y empezar a trabajar.`,
    top.length ? `Domino ${lista(top)}.` : "",
    ingles ? `Inglés ${ingles.toLowerCase()}.` : "",
    `Busco crecer como ${puesto.toLowerCase()} en una empresa donde pueda aportar desde el primer día.`,
  ].filter(Boolean).join(" "));
  if (logro) ops.push(`${mayus(puesto)} con resultados comprobables: ${logro.charAt(0).toLowerCase()}${logro.slice(1).replace(/\.$/, "")}.${top.length ? ` Domino ${lista(top)}.` : ""}${a >= 1 ? ` ${mayus(tiempo)}.` : ""}`);
  return ops;
}

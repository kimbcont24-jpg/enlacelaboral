/**
 * Revisión de lenguaje inclusivo para flyers de vacantes. Son reglas fijas (sin IA):
 * - «Excluye»: frases que dejan fuera a personas por motivos que no son del trabajo (Código de Trabajo, Principio VII).
 *   Vienen de `revisarDiscriminacion` (la misma revisión que usan las vacantes del sitio) más algunas propias del flyer.
 * - «Lenguaje»: masculino genérico que se puede cambiar por una forma que invite a cualquier persona.
 * - «Claridad»: detalles que hacen que menos gente aplique o que generen dudas.
 */
import { revisarDiscriminacion } from "@/lib/inclusion";
import { limpiar, salarioTexto, type Datos } from "@/lib/flyers";

export type TipoSug = "excluye" | "lenguaje" | "claridad";
export type Sugerencia = { id: string; tipo: TipoSug; campo: string; frase: string; cambio: string | null; motivo: string };

const EXTRA_EXCLUYE: { re: RegExp; motivo: string }[] = [
  { re: /\bsin\s+tatuajes?\b|\bsin\s+piercings?\b/gi, motivo: "Excluye por apariencia. Si hay una norma de uniforme, explícala en la entrevista." },
  { re: /\bse[ñn]oritas?\b/gi, motivo: "«Señorita» pide una mujer joven y soltera: excluye por sexo, edad y estado civil." },
  { re: /\b(?:caballeros?|damas?)\s+para\b/gi, motivo: "Pide un sexo para el puesto." },
  { re: /\b(?:buen|buena)\s+f[íi]sico\b|\bbien\s+parecid[oa]\b|\batractiv[oa]\b/gi, motivo: "Pide un rasgo físico que no es del trabajo." },
];

const CUIDADO: { re: RegExp; cambio: string | null; motivo: string }[] = [
  { re: /\bexcelente\s+presentaci[óo]n(?:\s+personal)?\b|\bpresentaci[óo]n\s+personal\b/gi, cambio: "trato amable", motivo: "Suena a exigir una apariencia. Mejor pide lo que se ve en el trabajo: el trato." },
  { re: /\bque\s+viva\s+cerca\b|\bresidir\s+cerca\b|\bvivir\s+(?:en\s+la\s+zona|cerca)\b|\bresidente\s+en\s+la\s+zona\b/gi, cambio: null, motivo: "Pedir que viva cerca deja fuera a gente que sí puede llegar. Mejor di dónde queda y si hay transporte." },
  { re: /\bnacionalidad\s+dominicana\b|\bdominican[oa]\s+de\s+nacimiento\b/gi, cambio: "documentos al día para trabajar en RD", motivo: "Si la ley no lo exige para este puesto, pedir nacionalidad excluye. Basta con documentos al día." },
  { re: /\bsalario\s+(?:competitivo|atractivo|a\s+convenir|seg[úu]n\s+experiencia)\b|\bsueldo\s+(?:competitivo|atractivo|a\s+convenir)\b|\bexcelente\s+salario\b/gi, cambio: null, motivo: "No dice cuánto. Pon el rango en «Salario»: es lo primero que pregunta casi todo candidato." },
  { re: /\bexperiencia\s+m[íi]nima\s+de\s+(?:[5-9]|\d{2})\s+años\b|\b(?:[5-9]|\d{2})\s+años\s+de\s+experiencia\s+m[íi]nim[oa]\b/gi, cambio: null, motivo: "Muchos años de experiencia como mínimo reduce mucho quién aplica. ¿El puesto de verdad lo necesita?" },
];

// Frases con masculino genérico → forma que incluye a todas las personas (de la más larga a la más corta).
const FRASES: [RegExp, string][] = [
  [/\bel\s+candidato\s+ideal\b/gi, "la persona ideal"],
  [/\blos\s+candidatos\s+interesados\b/gi, "las personas interesadas"],
  [/\blos\s+candidatos\b/gi, "las personas candidatas"],
  [/\bel\s+candidato\b/gi, "la persona candidata"],
  [/\bcandidatos\b/gi, "personas candidatas"],
  [/\blos\s+interesados\b/gi, "las personas interesadas"],
  [/\binteresados\b/gi, "personas interesadas"],
  [/\blos\s+aspirantes\b/gi, "las personas aspirantes"],
  [/\blos\s+seleccionados\b/gi, "las personas seleccionadas"],
  [/\blos\s+trabajadores\b/gi, "el personal"],
  [/\blos\s+empleados\b/gi, "el personal"],
  [/\bnuestros\s+colaboradores\b/gi, "nuestro equipo"],
  [/\blos\s+clientes\b/gi, "la clientela"],
  [/\bclientes\b/gi, "clientela"],
  [/\blos\s+usuarios\b/gi, "las personas usuarias"],
  [/\blos\s+pacientes\b/gi, "cada paciente"],
  [/\blos\s+ni[ñn]os\b/gi, "la niñez"],
  [/\blos\s+alumnos\b/gi, "el alumnado"],
  [/\blos\s+estudiantes\b/gi, "el estudiantado"],
  [/\b(?:licenciad[oa]|graduad[oa]|egresad[oa]|titulad[oa])\s+(?:en|de)\b/gi, "título en"],
  [/\bproactiv[oa]\b/gi, "con iniciativa"],
  [/\borganizad[oa]\b/gi, "con buena organización"],
  [/\bcomprometid[oa]\b/gi, "con compromiso"],
  [/\bdin[áa]mic[oa]\b/gi, "con energía"],
  [/\bhonest[oa]\b/gi, "con honestidad"],
  [/\bmotivad[oa]\b/gi, "con motivación"],
  [/\bcreativ[oa]\b/gi, "con creatividad"],
  [/\bcomunicativ[oa]\b/gi, "con buena comunicación"],
  [/\bordenad[oa]\b/gi, "con orden"],
  [/\borientad[oa]\s+a\b/gi, "con enfoque en"],
  [/\benfocad[oa]\s+en\b/gi, "con enfoque en"],
  [/\batent[oa]\b/gi, "con trato atento"],
  [/\bcapacitad[oa]\s+(?:en|para)\b/gi, "con formación en"],
];

// Puestos: masculino → «/a»; femenino que se usa como si el puesto fuera de mujeres → «o/a».
const MASC = ["vendedor", "cajero", "mensajero", "contador", "supervisor", "coordinador", "operario", "cocinero", "camarero", "mesero", "encargado", "técnico", "tecnico", "ingeniero", "diseñador", "programador", "desarrollador", "enfermero", "promotor", "cobrador", "despachador", "empacador", "digitador", "administrador", "director", "secretario", "asesor", "gestor", "ejecutivo", "abogado", "médico", "medico", "psicólogo", "psicologo", "farmacéutico", "barbero", "conductor", "repartidor", "bodeguero", "almacenero", "limpiador", "jardinero", "pintor", "plomero", "mecánico", "mecanico", "soldador", "carpintero", "maestro", "profesor", "tutor", "entrenador", "instructor", "teleoperador", "operador", "inspector", "auditor", "tesorero", "portero", "niñero", "empleado", "jefe", "químico", "biólogo", "odontólogo", "veterinario", "arquitecto", "traductor", "redactor", "editor", "fotógrafo", "productor", "locutor", "investigador", "peluquero", "doméstico", "ayudante de cocinero", "chef de partida"];
const FEM = ["secretaria", "niñera", "camarera", "cajera", "enfermera", "doméstica", "mesera", "maestra", "cocinera", "empacadora", "operaria", "promotora", "vendedora", "limpiadora", "costurera", "peluquera", "recamarera", "conserja", "asistenta", "digitadora", "anfitriona", "dependienta"];

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const conCaso = (original: string, nuevo: string) => (original.charAt(0) === original.charAt(0).toUpperCase() && original.charAt(0) !== original.charAt(0).toLowerCase() ? capital(nuevo) : nuevo);

function inclusivoPuesto(p: string): { frase: string; cambio: string } | null {
  if (/\/\s*a\b|\(a\)|\bo\s*\/\s*a\b|\bpersona\b/i.test(p)) return null;
  const palabras = p.match(/[\p{L}]+/gu) ?? [];
  for (const w of palabras) {
    const l = w.toLowerCase();
    if (MASC.includes(l) && l !== "jefe") return { frase: w, cambio: `${w}/a` };
    if (l === "jefe") return { frase: w, cambio: `${w}/a` };
    if (FEM.includes(l)) {
      const base = l.endsWith("ora") ? l.slice(0, -1) : l.endsWith("enta") ? l.slice(0, -1) + "e" : l.slice(0, -1) + "o";
      const masc = conCaso(w, base);
      const forma = l.endsWith("ora") ? `${masc}/a` : l.endsWith("enta") ? `${masc}` : `${masc}/a`;
      return { frase: w, cambio: forma };
    }
  }
  return null;
}

/** Revisa todo el flyer y devuelve lo que excluye, lo que se puede decir de forma inclusiva y lo que falta para que sea claro. */
export function revisarFlyer(d: Datos): Sugerencia[] {
  const out: Sugerencia[] = [];
  const campos: [string, string][] = [
    ["puesto", d.puesto],
    ["cabecera", d.cabecera],
    ...d.requisitos.map((t, i) => [`requisitos.${i}`, t] as [string, string]),
    ...d.funciones.map((t, i) => [`funciones.${i}`, t] as [string, string]),
    ...d.beneficios.map((t, i) => [`beneficios.${i}`, t] as [string, string]),
    ["extraAplicar", d.extraAplicar],
  ];
  const vistos = new Set<string>();
  const add = (s: Omit<Sugerencia, "id">) => {
    const id = `${s.tipo}|${s.campo}|${s.frase.toLowerCase()}`;
    if (vistos.has(id)) return;
    vistos.add(id);
    out.push({ ...s, id });
  };

  for (const [campo, texto] of campos) {
    if (!texto?.trim()) continue;
    for (const h of revisarDiscriminacion(texto)) add({ tipo: "excluye", campo, frase: h.frase, cambio: "", motivo: h.motivo });
    for (const r of EXTRA_EXCLUYE) for (const m of texto.matchAll(r.re)) add({ tipo: "excluye", campo, frase: m[0], cambio: "", motivo: r.motivo });
    for (const r of CUIDADO) for (const m of texto.matchAll(r.re)) add({ tipo: "claridad", campo, frase: m[0], cambio: r.cambio === null ? null : conCaso(m[0], r.cambio), motivo: r.motivo });
    const ocupado: [number, number][] = [];
    for (const [re, nuevo] of FRASES) {
      for (const m of texto.matchAll(re)) {
        const ini = m.index ?? 0;
        const fin = ini + m[0].length;
        if (ocupado.some(([a, b]) => ini < b && fin > a)) continue;
        ocupado.push([ini, fin]);
        add({ tipo: "lenguaje", campo, frase: m[0], cambio: conCaso(m[0], nuevo), motivo: "Así se siente invitada cualquier persona, no solo los hombres." });
      }
    }
  }

  const p = inclusivoPuesto(d.puesto);
  if (p) add({ tipo: "lenguaje", campo: "puesto", frase: p.frase, cambio: p.cambio, motivo: "Un puesto en masculino o en femenino hace que la mitad de la gente piense que no es para ella." });

  // Claridad general
  if (!salarioTexto(d)) add({ tipo: "claridad", campo: "salMin", frase: "Sin salario", cambio: null, motivo: "Las vacantes sin salario generan dudas y mensajes de «¿cuánto pagan?». Pon al menos un rango." });
  const req = limpiar(d.requisitos);
  if (req.length > 5) add({ tipo: "claridad", campo: "requisitos", frase: `${req.length} requisitos`, cambio: null, motivo: "Muchas personas solo aplican si cumplen todo. Deja los 3 a 5 indispensables." });
  if (!d.correo.trim() && d.whatsapp.replace(/\D/g, "").length < 10 && !d.enlace.trim() && !d.extraAplicar.trim()) add({ tipo: "claridad", campo: "correo", frase: "Sin forma de aplicar", cambio: null, motivo: "Indica cómo aplicar: correo, WhatsApp, enlace o dirección." });
  for (const [i, r] of req.entries()) if (r.length > 70) add({ tipo: "claridad", campo: `requisitos.${i}`, frase: r.slice(0, 28) + "…", cambio: null, motivo: "Este requisito es largo para un flyer. Dilo en pocas palabras." });
  return out;
}

/** Cambia la frase por la sugerencia en el campo indicado. */
export function aplicarSugerencia(d: Datos, s: Sugerencia): Datos {
  if (s.cambio === null) return d;
  const reemplazar = (t: string) => {
    const i = t.toLowerCase().indexOf(s.frase.toLowerCase());
    if (i < 0) return t;
    let resto = t.slice(i + s.frase.length);
    if (s.tipo === "excluye") resto = resto.replace(/^\s*(?:años|de edad)\b/i, "");
    let nuevo = t.slice(0, i) + s.cambio + resto;
    // Si se borró una frase completa, se limpian espacios y signos sueltos.
    nuevo = nuevo.replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").replace(/^[\s,;:.y]+|[\s,;:]+$/g, "");
    return i === 0 && nuevo ? capital(nuevo) : nuevo;
  };
  const [campo, idx] = s.campo.split(".");
  if (idx !== undefined && (campo === "requisitos" || campo === "funciones" || campo === "beneficios")) {
    const lista = [...d[campo]];
    lista[Number(idx)] = reemplazar(lista[Number(idx)] ?? "");
    // Si de la línea queda casi nada (p. ej. «años»), se borra completa.
    return { ...d, [campo]: s.tipo === "excluye" ? lista.filter((x, j) => j !== Number(idx) || x.replace(/[^\p{L}]/gu, "").length >= 6) : lista };
  }
  if (campo === "puesto" || campo === "cabecera" || campo === "extraAplicar") return { ...d, [campo]: reemplazar(d[campo]) };
  return d;
}

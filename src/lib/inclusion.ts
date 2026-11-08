/** Empleo para todas las personas: compromisos de inclusión de las vacantes y revisión de palabras que excluyen. */

export const COMPROMISOS = [
  { id: "primer-empleo", corto: "Primer empleo", t: "Primer empleo bienvenido", d: "No pedimos experiencia previa: enseñamos el trabajo." },
  { id: "discapacidad", corto: "Inclusiva", t: "Inclusiva para personas con discapacidad", d: "Adaptamos la entrevista y el puesto cuando hace falta." },
  { id: "toda-edad", corto: "Toda edad", t: "Sin límite de edad", d: "Valoramos la experiencia a cualquier edad." },
  { id: "estudiantes", corto: "Para estudiantes", t: "Horario compatible con estudios", d: "Ideal si estudias en la universidad o en INFOTEP." },
  { id: "horario-flexible", corto: "Horario flexible", t: "Horario flexible para madres y padres", d: "Acordamos horarios que funcionen con tu familia." },
] as const;
export type Compromiso = (typeof COMPROMISOS)[number]["id"];

export const etiquetaCompromiso = (id: Compromiso) => `incl:${id}`;
export const compromisosDe = (categorias: string[]): (typeof COMPROMISOS)[number][] => COMPROMISOS.filter((c) => categorias.includes(etiquetaCompromiso(c.id)));
/** Las etiquetas internas no se muestran como texto suelto. */
export const sinEtiquetasInternas = (categorias: string[]) => categorias.filter((c) => !c.startsWith("incl:"));

type Hallazgo = { frase: string; motivo: string };

// Código de Trabajo, Principio VII: se prohíbe la discriminación por sexo, edad, raza, color, ascendencia nacional,
// origen social, opinión política, militancia sindical o creencia religiosa. Aquí se marcan las formas más comunes en avisos.
const REGLAS: { re: RegExp; motivo: string }[] = [
  { re: /\b(?:edad|edades)\s*(?:de|entre|:)?\s*\d{2}\s*(?:a|y|-|–|hasta)\s*\d{2}\b/gi, motivo: "Pide un rango de edad." },
  { re: /\b(?:entre|de)\s+\d{2}\s*(?:a|y|-|–)\s*\d{2}\s+años(?!\s+de\s+experiencia)/gi, motivo: "Pide un rango de edad." },
  { re: /\b(?:menor(?:es)?|no mayor(?:es)?)\s+de\s+\d{2}\s+años(?!\s+de\s+experiencia)/gi, motivo: "Pone un límite de edad." },
  // «Mayor de 18» es la edad legal para trabajar y no se marca; un mínimo más alto sí excluye.
  { re: /\bmayor(?:es)?\s+de\s+(?:19|[2-9]\d)\s+años(?!\s+de\s+experiencia)/gi, motivo: "Pone un límite de edad." },
  { re: /\b(?:sexo|género)\s*:?\s*(?:masculino|femenino)\b/gi, motivo: "Pide un sexo." },
  { re: /\bpreferiblemente\s+(?:hombre|mujer|masculino|femenin[oa]|joven|soltera?o?)\b/gi, motivo: "Prefiere a un sexo, edad o estado civil." },
  { re: /\b(?:solo|sólo|únicamente)\s+(?:hombres|mujeres|damas|caballeros|jóvenes)\b/gi, motivo: "Excluye por sexo o edad." },
  { re: /\b(?:conserje|chofer|mensajero|vendedor|vendedora|cajero|cajera|recepcionista|camarera|camarero|secretaria|operario|operaria)\s+(?:masculino|femenina|femenino)\b/gi, motivo: "Pide un sexo para el puesto." },
  { re: /\bbuena\s+presencia\b/gi, motivo: "«Buena presencia» suele usarse para excluir por apariencia." },
  { re: /\b(?:foto|fotograf[íi]a)\s+(?:reciente|actual|tipo carnet|de rostro|de cuerpo)/gi, motivo: "Pide foto: no hace falta para decidir." },
  { re: /\b(?:estado civil|solter[oa]s?|casad[oa]s?|sin hijos)\b/gi, motivo: "Pregunta por estado civil o hijos." },
  { re: /\b(?:estatura|peso|talla|complexi[óo]n|tez|color de piel)\b/gi, motivo: "Pide rasgos físicos que no son del trabajo." },
  { re: /\b(?:religi[óo]n|cristian[oa]|cat[óo]lic[oa]|evang[ée]lic[oa])\b/gi, motivo: "Pide una creencia religiosa." },
  { re: /\b(?:sin\s+discapacidad|sin\s+limitaciones\s+f[íi]sicas|perfecto\s+estado\s+de\s+salud)\b/gi, motivo: "Excluye a personas con discapacidad." },
];

/** Busca en el aviso frases que excluyen a personas por motivos que no son del trabajo. */
export function revisarDiscriminacion(texto: string): Hallazgo[] {
  const out: Hallazgo[] = [];
  const vistos = new Set<string>();
  for (const { re, motivo } of REGLAS) {
    for (const m of texto.matchAll(re)) {
      const frase = m[0].trim();
      const k = frase.toLowerCase();
      if (vistos.has(k) || [...vistos].some((v) => v.includes(k) || k.includes(v))) continue;
      vistos.add(k);
      out.push({ frase, motivo });
    }
  }
  return out;
}

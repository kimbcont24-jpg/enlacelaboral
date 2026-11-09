/** Empleo para todas las personas: compromisos de inclusión de las vacantes y revisión de palabras que excluyen. */

export const COMPROMISOS = [
  { id: "primer-empleo", corto: "Primer empleo", t: "Primer empleo bienvenido", d: "No pedimos experiencia previa: enseñamos el trabajo." },
  { id: "discapacidad", corto: "Inclusiva", t: "Inclusiva para personas con discapacidad", d: "Adaptamos la entrevista y el puesto cuando hace falta." },
  { id: "estudiantes", corto: "Para estudiantes", t: "Horario compatible con estudios", d: "Ideal si estudias en la universidad o en INFOTEP." },
  { id: "horario-flexible", corto: "Horario flexible", t: "Horario flexible para madres y padres", d: "Acordamos horarios que funcionen con tu familia." },
] as const;
export type Compromiso = (typeof COMPROMISOS)[number]["id"];

export const etiquetaCompromiso = (id: Compromiso) => `incl:${id}`;
export const compromisosDe = (categorias: string[]): (typeof COMPROMISOS)[number][] => COMPROMISOS.filter((c) => categorias.includes(etiquetaCompromiso(c.id)));
/** Las etiquetas internas no se muestran como texto suelto. */
export const sinEtiquetasInternas = (categorias: string[]) => categorias.filter((c) => !c.startsWith("incl:"));

export type Hallazgo = { frase: string; motivo: string };

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
  { re: /\bedad\s+(?:m[áa]xima|m[íi]nima|l[íi]mite|requerida|ideal|preferible)\b/gi, motivo: "Pide una edad." },
  { re: /\b(?:cv|curr[íi]cul(?:um|o)|hoja\s+de\s+vida)\s+(?:con|y|más)\s+foto(?:graf[íi]a)?\b/gi, motivo: "Pide CV con foto: no hace falta para decidir." },
  { re: /\b(?:env[íi]a(?:r)?|adjunta(?:r)?|anexa(?:r)?|inclu(?:ir|ye|ya)|acompa[ñn]ad[oa]\s+de)\s+(?:una\s+|tu\s+|su\s+)?foto(?:graf[íi]a)?\b/gi, motivo: "Pide foto: no hace falta para decidir." },
  { re: /\b(?:hombres?|mujeres?|damas?|caballeros?)\s+(?:preferiblemente|solamente|únicamente)\b/gi, motivo: "Excluye por sexo." },
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

/** Revisa una vacante completa (título, descripción y requisitos). */
export function revisarVacante(v: { titulo: string; descripcion?: string; requisitos?: string[] | string }): Hallazgo[] {
  const req = Array.isArray(v.requisitos) ? v.requisitos.join("\n") : (v.requisitos ?? "");
  return revisarDiscriminacion(`${v.titulo}\n${v.descripcion ?? ""}\n${req}`);
}

// ---------- Caminos de «Empleo para todas las personas» ----------
// No se crean caminos por edad, sexo u otra condición personal: eso también sería separar a la gente.
// Solo por el tipo de puesto (sin experiencia, pasantía, horario) o por compromisos que la ley promueve (discapacidad).
// Una sola regla para contar y para filtrar: lo que dice el número es lo que sale en la lista.

type JobCamino = { titulo: string; experiencia: string; tipo: string; modalidad: string; categorias: string[]; descripcion?: string; requisitos?: string[] };

/**
 * ¿La vacante sirve para este camino?
 * - Siempre cuenta si la empresa marcó el compromiso.
 * - Primer empleo: no pide experiencia. Estudiantes: pasantía o medio tiempo.
 * - Horario flexible: medio tiempo o desde casa.
 * - Discapacidad: solo si la empresa lo marcó (no se adivina).
 */
export function enCamino(j: JobCamino, id: string): boolean {
  if (j.categorias.includes(`incl:${id}`)) return true;
  switch (id) {
    case "primer-empleo": return j.experiencia === "Sin experiencia";
    case "estudiantes": return j.tipo === "Pasantía" || j.tipo === "Medio tiempo";
    case "horario-flexible": return j.tipo === "Medio tiempo" || j.modalidad === "Remoto";
    default: return false;
  }
}

/** Preguntas de filtro: la empresa pregunta lo indispensable y ve al instante quién cumple. */
export type Pregunta = { id: string; texto: string; tipo: "si_no" | "texto"; esperada?: "si" | "no" };
export type Respuesta = { id: string; texto: string; respuesta: string; ok: boolean | null };

export const SUGERIDAS: Omit<Pregunta, "id">[] = [
  { texto: "¿Puedes empezar en las próximas dos semanas?", tipo: "si_no", esperada: "si" },
  { texto: "¿Vives en la provincia del trabajo o puedes llegar todos los días?", tipo: "si_no", esperada: "si" },
  { texto: "¿Tienes disponibilidad para trabajar fines de semana?", tipo: "si_no", esperada: "si" },
  { texto: "¿Tienes licencia de conducir vigente?", tipo: "si_no", esperada: "si" },
  { texto: "¿Terminaste el bachillerato?", tipo: "si_no", esperada: "si" },
  { texto: "¿Cuánto esperas ganar al mes?", tipo: "texto" },
];

export const nuevaId = () => Math.random().toString(36).slice(2, 8);

export function leerPreguntas(x: unknown): Pregunta[] {
  if (!Array.isArray(x)) return [];
  return x.filter((p): p is Pregunta => !!p && typeof p === "object" && typeof (p as Pregunta).texto === "string" && ((p as Pregunta).tipo === "si_no" || (p as Pregunta).tipo === "texto")).slice(0, 3);
}

export function leerRespuestas(x: unknown): Respuesta[] {
  if (!Array.isArray(x)) return [];
  return x.filter((r): r is Respuesta => !!r && typeof r === "object" && typeof (r as Respuesta).respuesta === "string").slice(0, 3);
}

export function responder(ps: Pregunta[], valores: Record<string, string>): Respuesta[] {
  return ps.map((p) => {
    const v = (valores[p.id] ?? "").trim().slice(0, 300);
    return { id: p.id, texto: p.texto, respuesta: v, ok: p.tipo === "si_no" && p.esperada ? v === p.esperada : null };
  });
}

/** Cuántas respuestas de sí/no coinciden con lo que la empresa busca. null si no hay nada que comparar. */
export function cumple(rs: Respuesta[]): { ok: number; total: number } | null {
  const medibles = rs.filter((r) => r.ok !== null);
  return medibles.length ? { ok: medibles.filter((r) => r.ok).length, total: medibles.length } : null;
}

export const textoRespuesta = (r: Respuesta) => (r.respuesta === "si" ? "Sí" : r.respuesta === "no" ? "No" : r.respuesta || "Sin respuesta");

import { useEffect, useState } from "react";
import { esInsignia, textoInsignias, type Insignia } from "./insignias-datos";

/** CV del candidato. Vive solo en su navegador (localStorage); nunca se sube a ningún servidor salvo que él lo incluya al aplicar. */
export type Experiencia = { puesto: string; empresa: string; desde: string; hasta: string; logros: string };
export type Educacion = { titulo: string; centro: string; anio: string };
export type Curso = { nombre: string; centro: string; anio: string };
export type CV = {
  nombre: string; puesto: string; telefono: string; correo: string; ciudad: string;
  resumen: string;
  experiencia: Experiencia[];
  educacion: Educacion[];
  habilidades: string;
  idiomas: string;
  /** Cursos y certificaciones (INFOTEP, diplomados, en línea…). */
  cursos: Curso[];
  linkedin: string;
  /** Ej.: Categoría 2. Vacío = no se muestra. */
  licencia: string;
  /** Ej.: Inmediata, turnos rotativos, fines de semana. */
  disponibilidad: string;
  /** Muestra «Referencias disponibles a solicitud». */
  referencias: boolean;
  /** Para quien empieza: estudios antes que experiencia. */
  formacionPrimero?: boolean;
  /** Habilidades verificadas por Perfila (insignias ganadas en /insignias). */
  insignias?: Insignia[];
};

export const cvVacio: CV = { nombre: "", puesto: "", telefono: "", correo: "", ciudad: "", resumen: "", experiencia: [{ puesto: "", empresa: "", desde: "", hasta: "", logros: "" }], educacion: [{ titulo: "", centro: "", anio: "" }], habilidades: "", idiomas: "", cursos: [], linkedin: "", licencia: "", disponibilidad: "", referencias: true };

const CLAVE = "enlace-cv";

export function leerCV(): CV | null {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return null;
    const cv = JSON.parse(raw) as Partial<CV>;
    return { ...cvVacio, ...cv, experiencia: cv.experiencia?.length ? cv.experiencia : cvVacio.experiencia, educacion: cv.educacion?.length ? cv.educacion : cvVacio.educacion, cursos: Array.isArray(cv.cursos) ? cv.cursos : [] };
  } catch {
    return null;
  }
}

export const CV_EDITADO = "enlace-cv-editado";
export const EVENTO_CV = "enlace-cv-cambio";
export const EVENTO_CV_REMOTO = "enlace-cv-remoto";

export function guardarCV(cv: CV) {
  try {
    const nuevo = JSON.stringify(cv);
    if (localStorage.getItem(CLAVE) === nuevo) return;
    localStorage.setItem(CLAVE, nuevo);
    localStorage.setItem(CV_EDITADO, new Date().toISOString());
  } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new Event(EVENTO_CV));
}

/** Escribe el CV que llegó de la cuenta (sin marcarlo como editado aquí). */
export function aplicarCVRemoto(cv: CV, editado: string) {
  try { localStorage.setItem(CLAVE, JSON.stringify(cv)); localStorage.setItem(CV_EDITADO, editado); } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new Event(EVENTO_CV_REMOTO));
}

export function useCV() {
  const [cv, setCV] = useState<CV>(cvVacio);
  const [cargado, setCargado] = useState(false);
  useEffect(() => {
    const g = leerCV(); if (g) setCV(g); setCargado(true);
    const remoto = () => { const r = leerCV(); if (r) setCV(r); };
    window.addEventListener(EVENTO_CV_REMOTO, remoto);
    return () => window.removeEventListener(EVENTO_CV_REMOTO, remoto);
  }, []);
  useEffect(() => { if (cargado) guardarCV(cv); }, [cv, cargado]);
  return { cv, setCV, cargado };
}

export function cvCompleto(cv: CV | null): cv is CV {
  return !!cv && cv.nombre.trim().length > 1 && (cv.telefono.trim().length > 5 || cv.correo.trim().length > 5);
}

/** Versión en texto plano, para pegarla en una aplicación o en WhatsApp. */
/** Logros escritos uno por línea (con o sin viñeta). */
export const lineasLogros = (t: string) => t.split(/\n+/).map((l) => l.replace(/^\s*[-•*▪●]\s*/, "").trim()).filter(Boolean);

export function textoCV(cv: CV): string {
  const exp = cv.experiencia.filter((e) => e.puesto.trim()).map((e) => `• ${e.puesto}${e.empresa ? ` en ${e.empresa}` : ""}${e.desde || e.hasta ? ` (${[e.desde, e.hasta || "actualidad"].filter(Boolean).join(" – ")})` : ""}${lineasLogros(e.logros).map((l) => `\n  - ${l}`).join("")}`);
  const edu = cv.educacion.filter((e) => e.titulo.trim()).map((e) => `• ${e.titulo}${e.centro ? `, ${e.centro}` : ""}${e.anio ? ` (${e.anio})` : ""}`);
  const cur = (cv.cursos ?? []).filter((c) => c.nombre.trim()).map((c) => `• ${c.nombre}${c.centro ? `, ${c.centro}` : ""}${c.anio ? ` (${c.anio})` : ""}`);
  return [
    `${cv.nombre}${cv.puesto ? ` · ${cv.puesto}` : ""}`,
    [cv.telefono, cv.correo, cv.ciudad, cv.linkedin].filter(Boolean).join(" · "),
    cv.resumen ? `\n${cv.resumen}` : "",
    exp.length ? `\nExperiencia\n${exp.join("\n")}` : "",
    edu.length ? `\nFormación\n${edu.join("\n")}` : "",
    cur.length ? `\nCursos\n${cur.join("\n")}` : "",
    cv.habilidades ? `\nHabilidades: ${cv.habilidades}` : "",
    cv.idiomas ? `Idiomas: ${cv.idiomas}` : "",
    cv.licencia ? `Licencia de conducir: ${cv.licencia}` : "",
    cv.disponibilidad ? `Disponibilidad: ${cv.disponibilidad}` : "",
    textoInsignias((cv.insignias ?? []).filter(esInsignia)),
  ].filter((x) => x !== "").join("\n").trim();
}

/** Qué tan listo está el CV y qué le falta, en orden de importancia. */
export function progresoCV(cv: CV | null): { pct: number; faltan: { t: string; tip: string }[] } {
  const c = cv ?? cvVacio;
  const exp = c.experiencia.filter((e) => e.puesto.trim());
  const checks: [boolean, string, string][] = [
    [c.nombre.trim().length > 3, "Tu nombre", "Escribe tu nombre completo."],
    [c.telefono.trim().length > 6 || c.correo.includes("@"), "Cómo contactarte", "Pon tu WhatsApp o tu correo."],
    [c.puesto.trim().length > 2, "Puesto que buscas", "Di qué trabajo buscas: así te recomendamos vacantes."],
    [c.resumen.trim().length > 40, "Sobre ti", "Dos o tres líneas con lo que sabes hacer."],
    [exp.length > 0, "Experiencia", "Agrega tu último trabajo, pasantía o voluntariado."],
    [exp.some((e) => e.logros.trim().length > 25), "Logros", "En tu experiencia, cuenta qué lograste, con números si puedes."],
    [c.educacion.some((e) => e.titulo.trim()), "Formación", "Agrega tu bachiller, técnico o carrera."],
    [c.habilidades.split(",").filter((h) => h.trim()).length >= 3, "Habilidades", "Escribe al menos 3 habilidades, separadas por coma."],
  ];
  const ok = checks.filter(([v]) => v).length;
  return { pct: Math.round((ok / checks.length) * 100), faltan: checks.filter(([v]) => !v).map(([, t, tip]) => ({ t, tip })) };
}

import { useEffect, useState } from "react";

/** CV del candidato. Vive solo en su navegador (localStorage); nunca se sube a ningún servidor salvo que él lo incluya al aplicar. */
export type Experiencia = { puesto: string; empresa: string; desde: string; hasta: string; logros: string };
export type Educacion = { titulo: string; centro: string; anio: string };
export type CV = {
  nombre: string; puesto: string; telefono: string; correo: string; ciudad: string;
  resumen: string;
  experiencia: Experiencia[];
  educacion: Educacion[];
  habilidades: string;
  idiomas: string;
};

export const cvVacio: CV = { nombre: "", puesto: "", telefono: "", correo: "", ciudad: "", resumen: "", experiencia: [{ puesto: "", empresa: "", desde: "", hasta: "", logros: "" }], educacion: [{ titulo: "", centro: "", anio: "" }], habilidades: "", idiomas: "" };

const CLAVE = "enlace-cv";

export function leerCV(): CV | null {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return null;
    const cv = JSON.parse(raw) as Partial<CV>;
    return { ...cvVacio, ...cv, experiencia: cv.experiencia?.length ? cv.experiencia : cvVacio.experiencia, educacion: cv.educacion?.length ? cv.educacion : cvVacio.educacion };
  } catch {
    return null;
  }
}

export function guardarCV(cv: CV) {
  try { localStorage.setItem(CLAVE, JSON.stringify(cv)); } catch { /* sin almacenamiento */ }
}

export function useCV() {
  const [cv, setCV] = useState<CV>(cvVacio);
  const [cargado, setCargado] = useState(false);
  useEffect(() => { const g = leerCV(); if (g) setCV(g); setCargado(true); }, []);
  useEffect(() => { if (cargado) guardarCV(cv); }, [cv, cargado]);
  return { cv, setCV, cargado };
}

export function cvCompleto(cv: CV | null): cv is CV {
  return !!cv && cv.nombre.trim().length > 1 && (cv.telefono.trim().length > 5 || cv.correo.trim().length > 5);
}

/** Versión en texto plano, para pegarla en una aplicación o en WhatsApp. */
export function textoCV(cv: CV): string {
  const exp = cv.experiencia.filter((e) => e.puesto.trim()).map((e) => `• ${e.puesto}${e.empresa ? ` en ${e.empresa}` : ""}${e.desde || e.hasta ? ` (${[e.desde, e.hasta || "actualidad"].filter(Boolean).join(" – ")})` : ""}${e.logros ? `\n  ${e.logros.replace(/\n+/g, " ")}` : ""}`);
  const edu = cv.educacion.filter((e) => e.titulo.trim()).map((e) => `• ${e.titulo}${e.centro ? `, ${e.centro}` : ""}${e.anio ? ` (${e.anio})` : ""}`);
  return [
    `${cv.nombre}${cv.puesto ? ` · ${cv.puesto}` : ""}`,
    [cv.telefono, cv.correo, cv.ciudad].filter(Boolean).join(" · "),
    cv.resumen ? `\n${cv.resumen}` : "",
    exp.length ? `\nExperiencia\n${exp.join("\n")}` : "",
    edu.length ? `\nFormación\n${edu.join("\n")}` : "",
    cv.habilidades ? `\nHabilidades: ${cv.habilidades}` : "",
    cv.idiomas ? `Idiomas: ${cv.idiomas}` : "",
  ].filter((x) => x !== "").join("\n").trim();
}

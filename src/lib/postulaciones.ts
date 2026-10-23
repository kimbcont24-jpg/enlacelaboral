import { useCallback, useEffect, useState } from "react";

import type { Vacante } from "@/lib/vacantes";

/** Seguimiento de postulaciones. Vive solo en el navegador de la persona (sin cuenta). */
export type EstadoPost = "aplique" | "entrevista" | "oferta" | "descartada";
export const ESTADOS: { v: EstadoPost; t: string }[] = [
  { v: "aplique", t: "Apliqué" },
  { v: "entrevista", t: "Me llamaron" },
  { v: "oferta", t: "Me ofrecieron" },
  { v: "descartada", t: "No avanzó" },
];

export type Postulacion = {
  id: string;
  titulo: string;
  empresa: string;
  provincia: string;
  via: string;
  /** Contacto de la empresa (WhatsApp, correo o enlace) para el mensaje de seguimiento. */
  aplicar: string;
  fecha: string;
  estado: EstadoPost;
};

const CLAVE = "enlace-postulaciones";
const EVENTO = "enlace-postulaciones-cambio";

function leer(): Postulacion[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? "[]") as unknown;
    return Array.isArray(v) ? (v as Postulacion[]).filter((x) => x && typeof x.id === "string") : [];
  } catch {
    return [];
  }
}
function guardar(l: Postulacion[]) {
  try { localStorage.setItem(CLAVE, JSON.stringify(l.slice(0, 300))); } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new Event(EVENTO));
}

export const diasDesde = (fecha: string) => Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 864e5));

export function usePostulaciones() {
  const [lista, setLista] = useState<Postulacion[]>([]);
  useEffect(() => {
    setLista(leer());
    const sync = () => setLista(leer());
    window.addEventListener(EVENTO, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENTO, sync); window.removeEventListener("storage", sync); };
  }, []);
  const registrar = useCallback((job: Pick<Vacante, "id" | "titulo" | "empresa" | "provincia" | "aplicar">, via: string) => {
    const actual = leer();
    if (actual.some((p) => p.id === job.id)) return;
    guardar([{ id: job.id, titulo: job.titulo, empresa: job.empresa, provincia: job.provincia, via, aplicar: job.aplicar, fecha: new Date().toISOString(), estado: "aplique" }, ...actual]);
  }, []);
  const cambiar = useCallback((id: string, estado: EstadoPost) => guardar(leer().map((p) => (p.id === id ? { ...p, estado } : p))), []);
  const quitar = useCallback((id: string) => guardar(leer().filter((p) => p.id !== id)), []);
  return { lista, yaAplico: (id: string) => lista.some((p) => p.id === id), registrar, cambiar, quitar };
}

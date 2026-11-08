import { useCallback, useEffect, useRef, useState } from "react";

import { cvVacio, type CV } from "@/lib/cv";

/**
 * Varias versiones del CV (ej.: «Para call center», «Para ventas»). La activa vive también en «enlace-cv»,
 * así el resto del sitio (aplicar, recomendaciones, nube) sigue usando un solo CV.
 */
export const K_VERSIONES = "enlace-cvs";
export const EV_VERSIONES = "enlace-cvs-cambio";
export type Version = { id: string; nombre: string; cv: CV; editado: string };
export type Versiones = { activo: string; lista: Version[] };

export function leerVersiones(): Versiones | null {
  try {
    const v = JSON.parse(localStorage.getItem(K_VERSIONES) ?? "null") as Versiones | null;
    return v && Array.isArray(v.lista) && v.lista.length ? v : null;
  } catch { return null; }
}
export function guardarVersiones(v: Versiones, avisar = true) {
  try { localStorage.setItem(K_VERSIONES, JSON.stringify(v)); } catch { /* sin almacenamiento */ }
  if (avisar) window.dispatchEvent(new Event(EV_VERSIONES));
}
const nuevoId = () => Math.random().toString(36).slice(2, 10);

export function useVersiones(cv: CV, setCV: (cv: CV) => void, cargado: boolean) {
  const [v, setV] = useState<Versiones | null>(null);
  const cambiando = useRef(false);

  useEffect(() => {
    if (!cargado) return;
    const g = leerVersiones();
    const inicial = g ?? { activo: "a", lista: [{ id: "a", nombre: "Mi CV", cv, editado: new Date().toISOString() }] };
    if (!g) guardarVersiones(inicial, false);
    setV(inicial);
    const sync = () => { const n = leerVersiones(); if (n) setV(n); };
    window.addEventListener(EV_VERSIONES, sync);
    return () => window.removeEventListener(EV_VERSIONES, sync);
  }, [cargado]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lo que se escribe queda en la versión activa.
  useEffect(() => {
    if (!v || cambiando.current) { cambiando.current = false; return; }
    const act = v.lista.find((x) => x.id === v.activo);
    if (!act || JSON.stringify(act.cv) === JSON.stringify(cv)) return;
    const t = window.setTimeout(() => {
      const n = { ...v, lista: v.lista.map((x) => (x.id === v.activo ? { ...x, cv, editado: new Date().toISOString() } : x)) };
      setV(n);
      guardarVersiones(n, false);
    }, 600);
    return () => window.clearTimeout(t);
  }, [cv, v]);

  const conGuardado = (base: Versiones): Versiones => ({ ...base, lista: base.lista.map((x) => (x.id === base.activo ? { ...x, cv, editado: new Date().toISOString() } : x)) });

  const cambiar = useCallback((id: string) => {
    if (!v || id === v.activo) return;
    const n = { ...conGuardado(v), activo: id };
    cambiando.current = true;
    setV(n); guardarVersiones(n);
    setCV(n.lista.find((x) => x.id === id)!.cv);
  }, [v, cv, setCV]); // eslint-disable-line react-hooks/exhaustive-deps

  const crear = useCallback((nombre: string, desde: "copia" | "vacio") => {
    if (!v) return;
    const id = nuevoId();
    const base = conGuardado(v);
    const nueva: Version = { id, nombre: nombre.trim() || "Nuevo CV", cv: desde === "copia" ? structuredClone(cv) : { ...cvVacio, nombre: cv.nombre, telefono: cv.telefono, correo: cv.correo, ciudad: cv.ciudad, linkedin: cv.linkedin }, editado: new Date().toISOString() };
    const n = { activo: id, lista: [...base.lista, nueva].slice(0, 8) };
    cambiando.current = true;
    setV(n); guardarVersiones(n);
    setCV(nueva.cv);
  }, [v, cv, setCV]); // eslint-disable-line react-hooks/exhaustive-deps

  const renombrar = useCallback((id: string, nombre: string) => {
    if (!v || !nombre.trim()) return;
    const n = { ...v, lista: v.lista.map((x) => (x.id === id ? { ...x, nombre: nombre.trim().slice(0, 40) } : x)) };
    setV(n); guardarVersiones(n);
  }, [v]);

  const borrar = useCallback((id: string) => {
    if (!v || v.lista.length < 2) return;
    const lista = v.lista.filter((x) => x.id !== id);
    const activo = v.activo === id ? lista[0]!.id : v.activo;
    const n = { activo, lista };
    if (v.activo === id) { cambiando.current = true; setCV(lista[0]!.cv); }
    setV(n); guardarVersiones(n);
  }, [v, setCV]);

  return { versiones: v, cambiar, crear, renombrar, borrar };
}

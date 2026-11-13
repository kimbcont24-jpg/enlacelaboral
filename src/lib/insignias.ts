/**
 * Insignias de habilidades verificadas por Perfila.
 *
 * La persona hace una prueba corta en Perfila (con el diseño de Perfila) y, al terminar, vuelve a
 * /insignias?insignia=<ref>. Enlace consulta a Perfila desde su servidor y, si logró el nivel, la
 * insignia se guarda en su CV (y viaja con su cuenta si la tiene). Una insignia suma, nunca resta:
 * si no llega al nivel, no se muestra nada y puede repetirla.
 */
import { useEffect, useState } from "react";
import { cvVacio, guardarCV, leerCV, EVENTO_CV, EVENTO_CV_REMOTO, type CV } from "./cv";
import { esInsignia, infoPrueba, type Insignia, type InfoPrueba, type PruebaInsignia, PRUEBAS } from "./insignias-datos";

export * from "./insignias-datos";

/** Prueba pedida y todavía sin resultado (solo en este navegador). */
export type Pendiente = { ref: string; prueba: PruebaInsignia; url: string; pedida: string };

const CLAVE_PEND = "enlace-insignias-pendientes";
export const EVENTO_INSIGNIAS = "enlace-insignias-cambio";

export function leerPendientes(): Pendiente[] {
  try {
    const raw = localStorage.getItem(CLAVE_PEND);
    const l = raw ? (JSON.parse(raw) as Pendiente[]) : [];
    return Array.isArray(l) ? l.filter((p) => p && typeof p.ref === "string" && infoPrueba(p.prueba)) : [];
  } catch {
    return [];
  }
}

function guardarPendientes(l: Pendiente[]) {
  try { localStorage.setItem(CLAVE_PEND, JSON.stringify(l.slice(0, 12))); } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new Event(EVENTO_INSIGNIAS));
}

export function agregarPendiente(p: Pendiente) {
  guardarPendientes([p, ...leerPendientes().filter((x) => x.ref !== p.ref && x.prueba !== p.prueba)]);
}

export function quitarPendiente(ref: string) {
  guardarPendientes(leerPendientes().filter((x) => x.ref !== ref));
}

export function insigniasDe(cv: CV | null): Insignia[] {
  const l = cv?.insignias;
  return Array.isArray(l) ? l.filter(esInsignia) : [];
}

/** Guarda la insignia en el CV: una por prueba, se queda la de mejor nivel (o la más nueva si empatan). */
export function guardarInsignia(i: Insignia) {
  const cv = leerCV() ?? cvVacio;
  const otras = insigniasDe(cv).filter((x) => x.prueba !== i.prueba);
  const previa = insigniasDe(cv).find((x) => x.prueba === i.prueba);
  const gana = previa && previa.nivel === "destacado" && i.nivel === "solido" ? previa : i;
  guardarCV({ ...cv, insignias: [...otras, gana] });
  window.dispatchEvent(new Event(EVENTO_INSIGNIAS));
  // Las pantallas con el CV abierto (Mi CV) lo vuelven a leer para no pisar la insignia.
  window.dispatchEvent(new Event(EVENTO_CV_REMOTO));
}

/** Insignias del CV y pruebas pendientes, al día con los cambios de otras pestañas o de la cuenta. */
export function useInsignias() {
  const [estado, setEstado] = useState<{ ganadas: Insignia[]; pendientes: Pendiente[]; listo: boolean }>({ ganadas: [], pendientes: [], listo: false });
  useEffect(() => {
    const leer = () => setEstado({ ganadas: insigniasDe(leerCV()), pendientes: leerPendientes(), listo: true });
    leer();
    const evs = [EVENTO_INSIGNIAS, EVENTO_CV, EVENTO_CV_REMOTO, "storage"];
    evs.forEach((e) => window.addEventListener(e, leer));
    return () => evs.forEach((e) => window.removeEventListener(e, leer));
  }, []);
  return estado;
}

/** Pruebas que más le sirven según el puesto que busca (las demás van después). */
export function ordenarPorPuesto(puesto: string): InfoPrueba[] {
  const p = puesto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (!p.trim()) return PRUEBAS;
  const peso = (x: InfoPrueba) => x.claves.filter((c) => p.includes(c)).length;
  return [...PRUEBAS].sort((a, b) => peso(b) - peso(a));
}

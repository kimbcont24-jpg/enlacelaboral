import { useCallback, useEffect, useState } from "react";

const CLAVE = "enlace-guardados";
const EVENTO = "enlace-guardados-cambio";

function leer(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? "[]") as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Vacantes guardadas en este navegador (sin cuenta). */
export function useGuardados() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(leer());
    const sync = () => setIds(leer());
    window.addEventListener(EVENTO, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENTO, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const alternar = useCallback((id: string) => {
    const actual = leer();
    const nuevo = actual.includes(id) ? actual.filter((x) => x !== id) : [id, ...actual].slice(0, 200);
    try {
      localStorage.setItem(CLAVE, JSON.stringify(nuevo));
    } catch {
      /* navegador sin almacenamiento: se mantiene solo en esta visita */
    }
    setIds(nuevo);
    window.dispatchEvent(new Event(EVENTO));
    return nuevo.includes(id);
  }, []);
  return { ids, guardada: (id: string) => ids.includes(id), alternar };
}

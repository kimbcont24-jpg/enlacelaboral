import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import { HojaCV, type Color, type Fuente, type Plantilla } from "@/components/cv/Hojas";
import type { CV } from "@/lib/cv";

type Estilo = { plantilla: Plantilla; color: Color; fuente: Fuente };

/**
 * Ajuste de la hoja a una página A4 completa.
 * - `z`: escala del contenido (letra y espacios). Sube si el CV es corto y baja un poco si se pasa por poco.
 * - `aire`: espacio extra (px) que se suma antes de cada sección para repartir lo que sobre de la página.
 */
export type Ajuste = { z: number; aire: number };
export const SIN_AJUSTE: Ajuste = { z: 1, aire: 0 };

/** Alto útil de la hoja en px de pantalla (297 mm = 1122.5 px), con un margen para no saltar a una segunda página. */
const OBJETIVO = 1114;
const Z_MIN = 0.86;
const Z_MAX = 1.2;
const AIRE_MAX = 90;

function aplicar(w: HTMLElement, a: Ajuste) {
  w.style.zoom = String(a.z);
  w.style.width = `calc(210mm / ${a.z})`;
  w.style.setProperty("--aire", `${a.aire}px`);
}

/** Busca la escala más grande con la que el CV cabe en una página y reparte el espacio que sobre entre las secciones. */
function calcular(w: HTMLElement): Ajuste | null {
  const hoja = w.querySelector<HTMLElement>(".cv-hoja");
  if (!hoja) return null;
  const alto = () => hoja.getBoundingClientRect().height;

  aplicar(w, SIN_AJUSTE);
  if (alto() < 60) return null; // oculto (por ejemplo, al imprimir)

  aplicar(w, { z: Z_MIN, aire: 0 });
  if (alto() > OBJETIVO) return SIN_AJUSTE; // muy largo: se deja normal y sigue en otra página

  let bajo = Z_MIN, alto_ = Z_MAX;
  aplicar(w, { z: Z_MAX, aire: 0 });
  if (alto() <= OBJETIVO) bajo = Z_MAX;
  else {
    for (let i = 0; i < 9; i++) {
      const medio = (bajo + alto_) / 2;
      aplicar(w, { z: medio, aire: 0 });
      if (alto() <= OBJETIVO) bajo = medio; else alto_ = medio;
    }
  }
  const z = Math.round(bajo * 1000) / 1000;
  aplicar(w, { z, aire: 0 });
  const sobra = OBJETIVO - alto();
  const filas = new Set([...hoja.querySelectorAll("section")].map((s) => Math.round(s.getBoundingClientRect().top))).size;
  let aire = filas > 0 && sobra > 4 ? Math.min(AIRE_MAX, sobra / z / filas) : 0;
  if (aire > 0) {
    aplicar(w, { z, aire });
    if (alto() > OBJETIVO) aire = Math.max(0, aire - (alto() - OBJETIVO) / z / filas - 0.5);
  }
  return { z, aire: Math.round(aire * 10) / 10 };
}

/** Mide el CV en una copia oculta y devuelve el ajuste para llenar la página. */
export function useAjuste(cv: CV, estilo: Estilo) {
  const ref = useRef<HTMLDivElement>(null);
  const [ajuste, setAjuste] = useState<Ajuste>(SIN_AJUSTE);
  const medir = useCallback(() => {
    const w = ref.current;
    if (!w) return;
    const a = calcular(w);
    if (!a) return;
    setAjuste((p) => (Math.abs(p.z - a.z) < 0.002 && Math.abs(p.aire - a.aire) < 0.5 ? p : a));
  }, []);
  useLayoutEffect(() => { medir(); }, [cv, estilo, medir]);
  useEffect(() => {
    let vivo = true;
    void document.fonts?.ready.then(() => { if (vivo) medir(); });
    return () => { vivo = false; };
  }, [medir]);
  const medidor = (
    <div aria-hidden="true" className="cv-medidor no-print">
      <div ref={ref} className="cv-ajuste"><HojaCV cv={cv} plantilla={estilo.plantilla} color={estilo.color} fuente={estilo.fuente} /></div>
    </div>
  );
  return { ajuste, medidor };
}

/** La hoja tal como sale en el PDF: A4 completa, con el ajuste aplicado. */
export function HojaPagina({ cv, estilo, ajuste }: { cv: CV; estilo: Estilo; ajuste: Ajuste }) {
  const s = { zoom: ajuste.z, width: `calc(210mm / ${ajuste.z})`, "--z": ajuste.z, "--aire": `${ajuste.aire}px` } as CSSProperties;
  return (
    <div className="cv-ajuste cv-pagina-llena" style={s}>
      <HojaCV cv={cv} plantilla={estilo.plantilla} color={estilo.color} fuente={estilo.fuente} />
    </div>
  );
}

import { useEffect, useRef } from "react";

import { LogoHorizontal } from "@/components/site/Logo";

/**
 * Entrada de la página: el logo se arma (persona + maletín), se enlazan con una onda y el logo viaja
 * hasta su lugar en el encabezado mientras el fondo azul se disuelve.
 *
 * - Solo en la portada y una vez por sesión del navegador (ver `scriptEntrada`). Con ?intro=1 se vuelve a ver.
 * - No se muestra si la persona pidió menos movimiento.
 * - Las animaciones son CSS puro (arrancan antes de que cargue el JavaScript); este componente solo
 *   hace el viaje final y limpia. Si algo falla, un CSS de seguridad la quita a los 6 s.
 * - Tocar la pantalla la salta.
 */
export const scriptEntrada = `(function(){try{var d=document.documentElement;var forzar=/[?&]intro(=|&|$)/.test(location.search);if(location.pathname==="/"&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&(forzar||!sessionStorage.getItem("el_entrada"))){d.setAttribute("data-entrada","1")}}catch(e){}})();`;

export function EntradaLogo() {
  const raiz = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    if (html.getAttribute("data-entrada") !== "1") return;
    const el = raiz.current;
    const lockup = logo.current;
    if (!el || !lockup) return;

    let terminado = false;
    let viajando = false;

    const limpiar = () => {
      if (terminado) return;
      terminado = true;
      try { sessionStorage.setItem("el_entrada", "1"); } catch { /* sin almacenamiento: no pasa nada */ }
      html.removeAttribute("data-entrada");
    };

    const viajar = () => {
      if (terminado || viajando) return;
      viajando = true;
      const destino = document.querySelector<HTMLElement>("[data-logo-header]");
      const desde = lockup.getBoundingClientRect();
      const hasta = destino?.getBoundingClientRect();
      const fondo = el.querySelector<HTMLElement>(".entrada-fondo");
      const lema = el.querySelector<HTMLElement>(".entrada-lema");
      if (!hasta || hasta.width === 0 || !fondo) { limpiar(); return; }

      lema?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" });
      // Los colores del logo pasan de "sobre azul" a "sobre blanco" (transición en styles.css).
      lockup.removeAttribute("data-invertido");
      lockup.style.transformOrigin = "0 0";
      const mover = lockup.animate(
        [
          { transform: "translate(0px, 0px) scale(1)" },
          { transform: `translate(${hasta.left - desde.left}px, ${hasta.top - desde.top}px) scale(${hasta.width / desde.width})` },
        ],
        { duration: 950, delay: 120, easing: "cubic-bezier(0.65, 0, 0.2, 1)", fill: "forwards" },
      );
      fondo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: 330, easing: "ease-out", fill: "forwards" });
      void mover.finished.then(limpiar, limpiar);
    };

    // Esperamos a que termine de armarse el logo (las animaciones "e-…" del CSS) y la dejamos respirar un momento.
    const armado = el.getAnimations({ subtree: true }).filter((a) => "animationName" in a && String((a as CSSAnimation).animationName).startsWith("e-"));
    let tiempo: number | undefined;
    void Promise.all(armado.map((a) => a.finished.catch(() => undefined))).then(() => { tiempo = window.setTimeout(viajar, 380); });

    const saltar = () => viajar();
    el.addEventListener("pointerdown", saltar);
    return () => { el.removeEventListener("pointerdown", saltar); window.clearTimeout(tiempo); };
  }, []);

  return (
    <div ref={raiz} className="entrada" aria-hidden="true">
      <div className="entrada-fondo" />
      <div className="entrada-centro">
        <LogoHorizontal refLogo={logo} invertido anillo className="entrada-logo" />
        <p className="entrada-lema">Conecta talento con oportunidades reales</p>
      </div>
    </div>
  );
}

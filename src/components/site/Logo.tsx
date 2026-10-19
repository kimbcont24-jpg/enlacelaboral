import type { Ref } from "react";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import {
  LOGO_BROCHE,
  LOGO_BROCHE_CENTRO,
  LOGO_CABEZA,
  LOGO_CUERPO,
  LOGO_MALETIN,
  LOGO_VIEWBOX,
} from "@/components/site/logo-paths";

/**
 * Símbolo de Enlace Laboral: una persona (azul profundo) enlazada a un maletín (azul eléctrico).
 * Los colores salen de variables CSS (ver styles.css) para poder cambiarlos con animación.
 * `anillo` agrega la onda que se ve en la entrada, cuando persona y maletín quedan enlazados.
 */
export function LogoMarca({ className, invertido = false, anillo = false }: { className?: string; invertido?: boolean; anillo?: boolean }) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      aria-hidden="true"
      focusable="false"
      overflow="visible"
      data-invertido={invertido ? "" : undefined}
      className={cn("logo-marca", className)}
    >
      <path className="p-persona p-cabeza" d={LOGO_CABEZA} />
      <path className="p-persona p-cuerpo" d={LOGO_CUERPO} />
      <path className="p-maletin p-case" d={LOGO_MALETIN} />
      <path className="p-maletin p-broche" d={LOGO_BROCHE} />
      {anillo && <circle className="p-anillo" cx={LOGO_BROCHE_CENTRO.x} cy={LOGO_BROCHE_CENTRO.y} r="64" fill="none" strokeWidth="9" />}
    </svg>
  );
}

/** Símbolo + nombre. El tamaño sale del font-size del contenedor (todo va en em), así escala parejo. */
export const LogoHorizontal = ({ className, invertido = false, anillo = false, refLogo, datosCabecera = false }: { className?: string; invertido?: boolean; anillo?: boolean; refLogo?: Ref<HTMLSpanElement>; datosCabecera?: boolean }) => (
  <span
    ref={refLogo}
    data-invertido={invertido ? "" : undefined}
    data-logo-header={datosCabecera ? "" : undefined}
    className={cn("logo-lockup inline-flex items-center gap-[0.42em] whitespace-nowrap leading-none", className)}
  >
    <LogoMarca className="h-[1.62em] w-auto shrink-0" anillo={anillo} />
    <span className="logo-nombre font-black tracking-[-0.03em]">
      <span className="logo-palabra"><span className="logo-t1">Enlace</span></span>{" "}
      <span className="logo-palabra"><span className="logo-t2">Laboral</span></span>
    </span>
  </span>
);

export function Logo({ className, invertido = false, cabecera = false, tamano = "text-[22px] sm:text-[28px]" }: { className?: string; invertido?: boolean; cabecera?: boolean; tamano?: string }) {
  return (
    <Link to="/" className={cn("logo-link inline-flex items-center", className)} aria-label="Enlace Laboral, inicio">
      <LogoHorizontal className={tamano} invertido={invertido} datosCabecera={cabecera} />
    </Link>
  );
}

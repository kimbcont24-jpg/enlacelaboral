import { useId } from "react";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/**
 * Marca de Enlace Laboral: dos eslabones entrelazados.
 * El azul es la persona que busca empleo; el rojo, la empresa o institución que contrata.
 * Se cruzan por arriba y por abajo, como en una cadena real: quedan enlazados.
 */
export function LogoMarca({ className, invertido = false }: { className?: string; invertido?: boolean }) {
  const id = useId().replace(/:/g, "");
  const azul = invertido ? "#ffffff" : "#002d62";
  const rojo = invertido ? "#ff4057" : "#ce1126";
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Enlace Laboral" className={className}>
      <defs>
        <clipPath id={`cruce-${id}`}><rect x="0" y="32" width="64" height="32" /></clipPath>
      </defs>
      <g transform="rotate(-35 32 32)">
        <ellipse cx="26" cy="32" rx="13" ry="8" fill="none" stroke={azul} strokeWidth="5.6" />
        <ellipse cx="38" cy="32" rx="13" ry="8" fill="none" stroke={rojo} strokeWidth="5.6" />
        <ellipse cx="26" cy="32" rx="13" ry="8" fill="none" stroke={azul} strokeWidth="5.6" clipPath={`url(#cruce-${id})`} />
      </g>
    </svg>
  );
}

export function Logo({ className, invertido = false }: { className?: string; invertido?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-1.5", className)} aria-label="Enlace Laboral, inicio">
      <LogoMarca className="size-12 -my-1" invertido={invertido} />
      <span className={cn("text-[22px] font-extrabold leading-none tracking-tight", invertido ? "text-white" : "text-primary")}>
        Enlace <span className={invertido ? "text-[#ff4057]" : "text-cta"}>Laboral</span>
      </span>
    </Link>
  );
}

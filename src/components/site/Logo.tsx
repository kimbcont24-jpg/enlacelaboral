import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/**
 * Marca de Enlace RD: una "E" en azul dominicano con un punto rojo.
 * El punto es el enlace: el lugar donde la persona y la empresa se encuentran.
 */
export function LogoMarca({ className, invertido = false }: { className?: string; invertido?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" role="img" aria-label="Enlace RD" className={className}>
      <rect x="1" y="1" width="38" height="38" rx="10" fill={invertido ? "#ffffff" : "#002d62"} />
      <path d="M13 12.5h14M13 20h9M13 27.5h14M13 12.5v15" stroke={invertido ? "#002d62" : "#ffffff"} strokeWidth="3.8" strokeLinecap="round" fill="none" />
      <circle cx="28.5" cy="20" r="3.4" fill="#ce1126" />
    </svg>
  );
}

export function Logo({ className, invertido = false }: { className?: string; invertido?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label="Enlace RD, inicio">
      <LogoMarca className="size-9" invertido={invertido} />
      <span className={cn("text-[22px] font-extrabold leading-none tracking-tight", invertido ? "text-white" : "text-primary")}>
        enlace<span className="text-cta">RD</span>
      </span>
    </Link>
  );
}

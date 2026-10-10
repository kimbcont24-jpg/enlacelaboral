import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/**
 * Marca de Enlace RD: dos anillos entrelazados.
 * El anillo azul mar representa a las personas; el mango, a empresas e instituciones.
 * Se cruzan por arriba y por abajo, como un eslabón real: ninguno sostiene al otro solo.
 */
export function LogoMarca({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 32" role="img" aria-label="Enlace RD" className={className}>
      <defs>
        <clipPath id="enlace-cruce"><circle cx="20" cy="23.48" r="4" /></clipPath>
      </defs>
      <circle cx="15" cy="16" r="9" fill="none" stroke="#f5a524" strokeWidth="4.2" />
      <circle cx="25" cy="16" r="9" fill="none" stroke="#0a7a8c" strokeWidth="4.2" />
      {/* El mango vuelve a pasar por encima en el cruce de abajo: los anillos quedan enlazados */}
      <circle cx="15" cy="16" r="9" fill="none" stroke="#f5a524" strokeWidth="4.2" clipPath="url(#enlace-cruce)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)} aria-label="Enlace RD, inicio">
      <LogoMarca className="h-8 w-10" />
      <span className="flex flex-col leading-none">
        <span className="text-xl font-extrabold tracking-tight text-foreground">enlace<span className="text-primary">rd</span></span>
        <span className="mt-0.5 hidden text-[11px] font-semibold text-muted-foreground sm:block">conecta talento y empresas</span>
      </span>
    </Link>
  );
}

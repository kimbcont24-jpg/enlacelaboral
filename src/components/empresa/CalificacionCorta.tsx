import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

import { useCalificaciones } from "@/lib/opiniones";

/** «4.3 ★ · 12 opiniones» (desde 5 opiniones) o «Ver opiniones de la empresa», con enlace al perfil. */
export function CalificacionCorta({ slug, claro = true }: { slug: string; claro?: boolean }) {
  const { data } = useCalificaciones([slug]);
  const c = data?.[slug];
  return (
    <Link to="/empresa/$id" params={{ id: slug }} hash="calificaciones" className={`mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline ${claro ? "text-white/85" : "text-muted-foreground"}`}>
      <Star className="size-4 text-[#f5a700]" fill="currentColor" strokeWidth={0} />
      {c ? <><b className={claro ? "text-white" : "text-foreground"}>{c.promedio.toFixed(1)}</b> · {c.total} opiniones</> : "Ver opiniones de la empresa"}
    </Link>
  );
}

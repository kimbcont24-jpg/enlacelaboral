import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarcaPerfila, Medalla } from "@/components/insignias/Sello";
import { PRUEBAS, useInsignias } from "@/lib/insignias";

/** Tarjeta corta (colores de Perfila) para invitar a ganar insignias desde Mi CV y Mi búsqueda. */
export function PromoInsignias({ className = "" }: { className?: string }) {
  const { ganadas, pendientes } = useInsignias();
  const faltan = PRUEBAS.length - ganadas.length;
  return (
    <Link to="/insignias" className={`group relative flex items-center gap-4 overflow-hidden rounded-[1.4rem] bg-[#06004b] p-5 text-white transition hover:-translate-y-0.5 ${className}`} style={{ fontFamily: "Manrope, Figtree, system-ui, sans-serif" }}>
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, #5B39F9, transparent 70%)" }} />
      <span className="relative flex -space-x-3">
        {(ganadas.length ? ganadas.slice(0, 3).map((g) => <Medalla key={g.ref} prueba={g.prueba} nivel={g.nivel} size={46} />) : PRUEBAS.slice(0, 3).map((p) => <Medalla key={p.id} prueba={p.id} size={46} />))}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-xs font-bold text-[#f9c400]"><MarcaPerfila size={16} /> Verificadas por Perfila</span>
        <span className="mt-0.5 block text-[17px] font-extrabold leading-tight">
          {ganadas.length ? `Tienes ${ganadas.length} ${ganadas.length === 1 ? "insignia" : "insignias"} en tu CV` : "Demuestra lo que sabes hacer"}
        </span>
        <span className="block text-sm text-white/75">
          {pendientes.length ? "Tienes una prueba en curso: termínala y mira tu resultado." : ganadas.length ? (faltan > 0 ? `Te ${faltan === 1 ? "falta 1" : `faltan ${faltan}`} por ganar.` : "Las tienes todas. ¡Bien!") : "Pruebas de 10 a 15 minutos. Si logras el nivel, sale en tu CV."}
        </span>
      </span>
      <ArrowRight className="relative size-5 shrink-0 transition group-hover:translate-x-1" />
    </Link>
  );
}

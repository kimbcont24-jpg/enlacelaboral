import { Link } from "@tanstack/react-router";
import { ArrowRight, Gift } from "lucide-react";

/** Franja de temporada: del 1 de noviembre al 20 de diciembre invita a calcular la regalía pascual. */
export function RegaliaBanda() {
  const hoy = new Date();
  const m = hoy.getMonth();
  if (!(m === 10 || (m === 11 && hoy.getDate() <= 20))) return null;
  const faltan = Math.ceil((new Date(hoy.getFullYear(), 11, 20).getTime() - new Date(hoy.getFullYear(), m, hoy.getDate()).getTime()) / 864e5);
  return (
    <section className="px-4 pt-8 sm:px-6" aria-label="Regalía pascual">
      <Link to="/herramientas/regalia-pascual" className="group mx-auto flex max-w-6xl flex-wrap items-center gap-4 rounded-3xl bg-[#ffd84d] p-5 text-[#3d2f00] transition-transform hover:-translate-y-0.5 sm:flex-nowrap sm:p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#3d2f00] text-[#ffd84d]"><Gift className="size-6" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-auto">
          <span className="block font-display text-xl font-extrabold leading-tight">¿Cuánto te toca de regalía pascual?</span>
          <span className="block text-[15px]">{faltan > 0 ? `Faltan ${faltan} ${faltan === 1 ? "día" : "días"} para el 20 de diciembre.` : "Hoy es el último día para pagarla."} Calcula tu doble sueldo en segundos, gratis.</span>
        </span>
        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#3d2f00] px-4 py-2.5 text-sm font-bold text-[#ffd84d] sm:w-auto">Calcular <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
      </Link>
    </section>
  );
}

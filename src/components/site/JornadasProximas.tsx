import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";

import { faltan, organizadorDe, useJornadas } from "@/lib/jornadas";

/** Franja en la portada: aparece solo cuando hay ferias de empleo próximas. */
export function JornadasProximas() {
  const { data } = useJornadas();
  if (!data?.length) return null;
  return (
    <section className="px-4 pb-12 sm:px-6" aria-label="Ferias de empleo próximas">
      <div className="mx-auto max-w-6xl rounded-3xl bg-[#0a2f5c] p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="flex items-center gap-2 text-sm font-semibold text-[#8ec1ff]"><CalendarDays className="size-4" /> Ferias de empleo</p><h2 className="mt-1 font-display text-2xl font-extrabold">Ferias de empleo cerca de ti</h2></div>
          <Link to="/jornadas" className="text-sm font-bold text-white underline-offset-4 hover:underline">Ver el mapa de ferias</Link>
        </div>
        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {data.slice(0, 3).map((j) => (
            <li key={j.id}><Link to="/jornadas/$id" params={{ id: j.id }} className="block h-full rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/10 hover:bg-white/[0.12]">
              <span className="rounded-full bg-[#ffd84d] px-2 py-0.5 text-[11px] font-extrabold text-[#3d2f00]">{faltan(j.fecha)}</span>
              <p className="mt-2 font-extrabold leading-snug">{j.titulo}</p>
              <p className="mt-1 text-sm text-white/75">{organizadorDe(j)}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-white/70"><MapPin className="size-3.5" /> {j.lugar}, {j.provincia}</p>
            </Link></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

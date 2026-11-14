import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Landmark } from "lucide-react";

import { CONCURSA_URL, esSectorPublico } from "@/lib/colecciones";
import type { Vacante } from "@/lib/vacantes";

/** Banda del sector público en la portada: plazas del Estado y cómo aplicar por Concursa. */
export function SectorPublicoBanda({ jobs }: { jobs: Vacante[] }) {
  const { total, nuevas } = useMemo(() => {
    const semana = Date.now() - 7 * 864e5;
    const l = jobs.filter(esSectorPublico);
    return { total: l.length, nuevas: l.filter((j) => new Date(j.creado).getTime() >= semana).length };
  }, [jobs]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0a2f5c] text-white shadow-lg">
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-[#c8102e]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-[#1d6ff2]/30 blur-2xl" />
      <Landmark aria-hidden="true" className="pointer-events-none absolute -bottom-6 right-4 size-40 text-white/[0.06] sm:right-10" />
      <div className="relative flex flex-col gap-5 p-6 sm:p-7 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-white/20">
            <Landmark className="size-3.5" aria-hidden="true" /> Sector público
          </span>
          <h3 className="mt-3 text-xl font-extrabold leading-tight sm:text-2xl">Empleos en el Estado dominicano</h3>
          <p className="mt-1.5 text-sm text-white/80 sm:text-base">Ministerios, ayuntamientos, hospitales y empresas públicas. Te explicamos cómo aplicar por Concursa, el portal oficial de concursos del MAP.</p>
          <p className="mt-3 text-sm font-semibold text-white/90">
            {total > 0 ? <><b className="text-2xl font-extrabold text-white">{total}</b> {total === 1 ? "vacante abierta" : "vacantes abiertas"}{nuevas > 0 && <span className="ml-2 rounded-full bg-[#c8102e] px-2 py-0.5 text-xs font-bold">+{nuevas} esta semana</span>}</> : "Ahora mismo no hay plazas abiertas aquí: entra, mira cómo aplicar y activa tu alerta."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <Link to="/empleos/$slug" params={{ slug: "sector-publico" }} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 font-bold text-[#0a2f5c] shadow transition-transform hover:-translate-y-0.5">
            Ver empleos del Estado <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <a href={CONCURSA_URL} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-5 font-bold text-white ring-1 ring-white/30 transition-colors hover:bg-white/20">
            Ir a Concursa <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}

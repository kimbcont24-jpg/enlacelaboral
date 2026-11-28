import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { directorioEmpresas } from "@/lib/directorio-empresas";
import { useVacantes } from "@/lib/vacantes";

/**
 * Prueba social para empresas: nombres reales de quienes tienen vacantes abiertas en Enlace este mes.
 * Primero las aliadas (publican directo con nosotros), luego las que más contratan. Sin consultoras.
 * Si los datos todavía no llegan, no se muestra nada (nunca cifras en cero).
 */
export function EmpresasQueContratan() {
  const { jobs } = useVacantes();
  const { lista, total } = useMemo(() => {
    const filas = directorioEmpresas(jobs).filter((f) => !f.recluta);
    // Aliadas que contratan seguido (2+ vacantes) primero; luego las que más contratan, que son las más conocidas.
    const aliadas = filas.filter((f) => f.aliada && f.vacantes >= 2).sort((a, b) => b.vacantes - a.vacantes).slice(0, 6);
    const grandes = [...filas].sort((a, b) => b.vacantes - a.vacantes);
    // Sin repetir la misma empresa escrita distinto («Chiller Service» / «Chillerservice»).
    const vistas = new Set<string>();
    const lista = [...aliadas, ...grandes].filter((f) => {
      const k = f.nombre.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "").replace(/(srl|sas|sa|inc)$/, "");
      if (vistas.has(k)) return false;
      vistas.add(k);
      return true;
    }).slice(0, 16);
    return { lista, total: filas.length };
  }, [jobs]);
  if (lista.length < 6) return null;

  return (
    <section aria-labelledby="t-contratan" className="border-b border-border px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Ya publican aquí</p>
            <h2 id="t-contratan" className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-[1.75rem]">
              {total.toLocaleString("es-DO")} empresas e instituciones tienen vacantes abiertas este mes
            </h2>
          </div>
          <Link to="/empresas-contratando" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-primary hover:underline">Verlas todas <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {lista.map((f) => (
            <li key={f.slug}>
              <Link to="/empresa/$id" params={{ id: f.slug }} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5 transition-colors hover:border-primary">
                <EmpresaAvatar nombre={f.nombre} className="size-9 shrink-0 text-base" />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-bold">{f.nombre}</span>
                  <span className="block text-xs text-muted-foreground">{f.vacantes} {f.vacantes === 1 ? "vacante" : "vacantes"}{f.aliada ? " · publica directo" : ""}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { BotonGuardar, ClaridadPill } from "@/components/site/JobCard";
import { useApply } from "@/components/site/apply-context";
import { esNueva } from "@/lib/claridad";
import type { Vacante } from "@/lib/vacantes";

/** Tarjeta compacta para cuadrículas (portada). */
export function VacanteTarjeta({ job }: { job: Vacante }) {
  const aplicar = useApply();
  const etiqueta = job.modalidad === "Remoto" ? "Desde casa" : job.tipo;
  return (
    <article className={`flex flex-col rounded-2xl border bg-surface p-5 transition-shadow hover:shadow-[var(--shadow-lift)] ${job.destacada ? "border-primary/50" : "border-border"}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-primary">{etiqueta}</span>
        {job.destacada && <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-white">Destacada</span>}
        {esNueva(job) && <span className="rounded-md bg-cta/10 px-2 py-0.5 text-xs font-bold text-cta">Nueva</span>}
      </div>
      <Link to="/vacantes/$id" params={{ id: job.id }} className="mt-3 text-lg font-bold leading-snug hover:text-primary hover:underline">{job.titulo}</Link>
      <p className="mt-1 text-sm text-muted-foreground">{job.empresa}</p>
      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" aria-hidden="true" /> {job.provincia} · {job.publicado}</p>
      <p className={`mt-3 text-base font-extrabold ${job.salarioMin > 0 ? "text-success" : "text-muted-foreground"}`}>{job.salario}</p>
      <ClaridadPill job={job} className="mt-2 self-start" />
      <div className="mt-auto flex gap-2 pt-4">
        <button onClick={() => aplicar(job)} className="btn-aplicar flex-1 rounded-xl py-2.5 text-base">Aplicar</button>
        <BotonGuardar id={job.id} />
      </div>
    </article>
  );
}

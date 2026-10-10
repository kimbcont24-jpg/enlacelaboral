import { Link } from "@tanstack/react-router";
import { Banknote, Bookmark, Briefcase, Building2, Clock, MapPin, Monitor } from "lucide-react";

import { AdminAcciones } from "@/components/site/AdminAcciones";
import { useApply } from "@/components/site/apply-context";
import { claridad, esNueva } from "@/lib/claridad";
import { useGuardados } from "@/lib/guardados";
import type { Vacante } from "@/lib/vacantes";

export function ClaridadPill({ job, className = "" }: { job: Vacante; className?: string }) {
  const c = claridad(job);
  const tono = c.nivel === "Alta" ? "bg-success/10 text-success" : c.nivel === "Media" ? "bg-cta/15 text-[#8a5200]" : "bg-muted text-muted-foreground";
  return (
    <span title={`Tiene: ${c.tiene.join(", ") || "poca información"}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tono} ${className}`}>
      <span aria-hidden="true" className="flex gap-0.5">{Array.from({ length: c.total }, (_, i) => <span key={i} className={`h-2.5 w-1 rounded-full ${i < c.puntos ? "bg-current" : "bg-current opacity-20"}`} />)}</span>
      Claridad {c.nivel.toLowerCase()}
    </span>
  );
}

export function BotonGuardar({ id, grande = false }: { id: string; grande?: boolean }) {
  const { guardada, alternar } = useGuardados();
  const si = guardada(id);
  return (
    <button
      type="button"
      onClick={() => alternar(id)}
      aria-pressed={si}
      aria-label={si ? "Quitar de guardadas" : "Guardar vacante"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border font-semibold transition-colors ${grande ? "w-full py-3 text-sm" : "size-10"} ${si ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
    >
      <Bookmark className={`size-4 ${si ? "fill-current" : ""}`} aria-hidden="true" />
      {grande && (si ? "Guardada" : "Guardar para después")}
    </button>
  );
}

export function JobCard({ job }: { job: Vacante }) {
  const aplicar = useApply();
  const nueva = esNueva(job);
  return (
    <article className={`rounded-2xl border bg-surface p-5 transition-colors hover:border-primary/50 ${job.destacada ? "border-primary/60" : "border-border"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {(job.destacada || nueva) && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {job.destacada && <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">Destacada</span>}
              {nueva && <span className="rounded-full bg-cta px-2.5 py-0.5 text-xs font-bold text-cta-foreground">Nueva</span>}
            </div>
          )}
          <Link to="/vacantes/$id" params={{ id: job.id }} className="text-lg font-bold leading-snug hover:text-primary">{job.titulo}</Link>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><Building2 className="size-4 shrink-0" aria-hidden="true" /> {job.empresa}</p>
          <p className={`mt-2 flex items-center gap-1.5 text-base font-bold ${job.salarioMin > 0 ? "text-success" : "text-muted-foreground"}`}><Banknote className="size-4 shrink-0" aria-hidden="true" /> {job.salario}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 shrink-0" aria-hidden="true" /> {job.provincia}</span>
            <span className="inline-flex items-center gap-1.5"><Monitor className="size-4 shrink-0" aria-hidden="true" /> {job.modalidad}</span>
            <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4 shrink-0" aria-hidden="true" /> {job.tipo}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4 shrink-0" aria-hidden="true" /> {job.publicado}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ClaridadPill job={job} />
            <span className="text-xs text-muted-foreground">Fuente: {job.fuente}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-stretch gap-2 sm:w-48 sm:flex-col">
          <button onClick={() => aplicar(job)} className="btn-aplicar flex-1 rounded-xl px-5 py-3 text-center text-base">Aplicar</button>
          <div className="flex gap-2">
            <Link to="/vacantes/$id" params={{ id: job.id }} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold hover:border-primary hover:text-primary">Ver detalles</Link>
            <BotonGuardar id={job.id} />
          </div>
        </div>
      </div>
      <AdminAcciones job={job} />
    </article>
  );
}

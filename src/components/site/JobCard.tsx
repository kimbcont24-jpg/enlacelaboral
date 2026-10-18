import { Link } from "@tanstack/react-router";
import { Bookmark, Briefcase, Clock, MapPin, Monitor } from "lucide-react";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { AdminAcciones } from "@/components/site/AdminAcciones";
import { useApply } from "@/components/site/apply-context";
import { claridad, diasRestantes, esNueva, nivelDe, venceTexto } from "@/lib/claridad";
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
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border font-semibold transition-colors ${grande ? "h-11 w-full text-sm" : "size-10"} ${si ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
    >
      <Bookmark className={`size-4 ${si ? "fill-current" : ""}`} aria-hidden="true" />
      {grande && (si ? "Guardada" : "Guardar")}
    </button>
  );
}

export function JobCard({ job }: { job: Vacante }) {
  const aplicar = useApply();
  const nueva = esNueva(job);
  const pronto = diasRestantes(job) <= 5;
  const conSueldo = job.salarioMin > 0;
  return (
    <article className={`group relative rounded-2xl border bg-surface p-4 transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-[var(--shadow-soft)] sm:p-5 ${job.destacada ? "border-primary/50 border-t-4 border-t-[#ffd84d]" : "border-border"}`}>
      <div className="flex items-start gap-3.5">
        <EmpresaAvatar nombre={job.empresa} className="size-12 text-xl" />
        <div className="min-w-0 flex-1">
          <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${job.destacada || nueva ? "mb-1.5" : ""}`}>
            {job.destacada && <span className="rounded-full bg-[#ffd84d] px-2 py-0.5 text-[11px] font-extrabold text-[#3d2f00]">Destacada</span>}
            {nueva && <span className="rounded-full bg-cta px-2 py-0.5 text-[11px] font-bold text-cta-foreground">Nueva</span>}
          </div>
          <h3 className="text-lg font-extrabold leading-snug">
            <Link to="/vacantes/$id" params={{ id: job.id }} className="text-balance after:absolute after:inset-0 after:rounded-2xl group-hover:text-primary">{job.titulo}</Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{job.empresa}</p>
        </div>
      </div>

      <p className="mt-3.5 flex items-baseline gap-1.5">
        <span className={conSueldo ? "text-xl font-extrabold tabular-nums text-success" : "text-sm font-bold text-muted-foreground"}>{job.salario}</span>
        {conSueldo && <span className="text-xs font-semibold text-muted-foreground">al mes</span>}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 shrink-0" aria-hidden="true" /> {job.provincia}</span>
        <span className="inline-flex items-center gap-1.5"><Monitor className="size-4 shrink-0" aria-hidden="true" /> {job.modalidad}</span>
        <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4 shrink-0" aria-hidden="true" /> {job.tipo}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <ClaridadPill job={job} />
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">{nivelDe(job)}</span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" aria-hidden="true" /> {job.publicado}</span>
        <span className={`text-xs ${pronto ? "font-bold text-destructive" : "text-muted-foreground"}`}>{venceTexto(job)}</span>
      </div>

      <div className="relative z-10 mt-4 flex items-stretch gap-2 border-t border-border pt-4">
        <button onClick={() => aplicar(job)} className="btn-aplicar h-11 flex-1 rounded-xl px-5 text-base sm:max-w-[14rem]">Aplicar</button>
        <Link to="/vacantes/$id" params={{ id: job.id }} className="hidden h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:border-primary hover:text-primary sm:inline-flex">Ver detalles</Link>
        <div className="[&_button]:size-11"><BotonGuardar id={job.id} /></div>
        <span className="ml-auto hidden min-w-0 items-center truncate text-xs text-muted-foreground md:inline-flex">Fuente: {job.fuente}</span>
      </div>
      <div className="relative z-10"><AdminAcciones job={job} /></div>
    </article>
  );
}

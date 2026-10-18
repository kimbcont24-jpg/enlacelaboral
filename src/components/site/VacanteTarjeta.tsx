import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { BotonGuardar, ClaridadPill } from "@/components/site/JobCard";
import { useApply } from "@/components/site/apply-context";
import { diasRestantes, esNueva, venceTexto } from "@/lib/claridad";
import type { Vacante } from "@/lib/vacantes";

/** Tarjeta compacta para cuadrículas (portada). */
export function VacanteTarjeta({ job }: { job: Vacante }) {
  const aplicar = useApply();
  const etiqueta = job.modalidad === "Remoto" ? "Desde casa" : job.tipo;
  const conSueldo = job.salarioMin > 0;
  return (
    <article className={`group lift relative flex flex-col rounded-2xl border bg-surface p-5 ${job.destacada ? "border-t-4 border-primary/40 border-t-[#ffd84d]" : "border-border"}`}>
      <div className="flex items-start gap-3">
        <EmpresaAvatar nombre={job.empresa} className="size-11 text-lg" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold leading-snug">
            <Link to="/vacantes/$id" params={{ id: job.id }} className="text-balance after:absolute after:inset-0 after:rounded-2xl group-hover:text-primary">{job.titulo}</Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{job.empresa}</p>
        </div>
      </div>
      <p className="mt-4 flex items-baseline gap-1.5">
        <span className={`text-xl font-extrabold tabular-nums ${conSueldo ? "text-success" : "text-sm font-bold text-muted-foreground"}`}>{job.salario}</span>
        {conSueldo && <span className="text-xs font-semibold text-muted-foreground">al mes</span>}
      </p>
      <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5 shrink-0" aria-hidden="true" /> {job.provincia}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-primary">{etiqueta}</span>
        {job.destacada && <span className="rounded-md bg-[#ffd84d] px-2 py-0.5 text-xs font-extrabold text-[#3d2f00]">Destacada</span>}
        {esNueva(job) && <span className="rounded-md bg-cta px-2 py-0.5 text-xs font-bold text-cta-foreground">Nueva</span>}
        {diasRestantes(job) <= 5 && <span className="text-xs font-bold text-destructive">{venceTexto(job)}</span>}
      </div>
      <ClaridadPill job={job} className="mt-3 self-start" />
      <div className="relative z-10 mt-auto flex gap-2 pt-4">
        <button onClick={() => aplicar(job)} className="btn-aplicar h-11 flex-1 rounded-xl text-base">Aplicar</button>
        <div className="[&_button]:size-11"><BotonGuardar id={job.id} /></div>
      </div>
    </article>
  );
}

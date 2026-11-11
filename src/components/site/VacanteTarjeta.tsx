import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { BotonGuardar, ClaridadPill } from "@/components/site/JobCard";
import { InclusionPills } from "@/components/site/InclusionPills";
import { useApply } from "@/components/site/apply-context";
import { diasRestantes, esNueva, venceTexto } from "@/lib/claridad";
import { viaAplicar } from "@/lib/mensajes";
import type { Vacante } from "@/lib/vacantes";
import { nombreEmpresa } from "@/lib/presentar";

/** Tarjeta compacta para cuadrículas (portada). */
export function VacanteTarjeta({ job }: { job: Vacante }) {
  const aplicar = useApply();
  const etiqueta = job.modalidad === "Remoto" ? "Desde casa" : job.tipo;
  const conSueldo = job.salarioMin > 0;
  return (
    <article className={`group lift relative flex flex-col overflow-hidden rounded-3xl border bg-surface p-5 ${job.destacada ? "border-[#e8c22e]/60" : "border-border"}`}>
      {job.destacada && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ffd84d] to-[#ffb020]" />}
      <div className="flex items-start gap-3">
        <EmpresaAvatar nombre={job.empresa} className="size-11 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-muted-foreground">{nombreEmpresa(job.empresa)}</p>
          <h3 className="mt-0.5 text-[1.05rem] font-extrabold leading-[1.25] tracking-[-0.01em]">
            <Link to="/vacantes/$id" params={{ id: job.id }} className="text-balance after:absolute after:inset-0 after:rounded-3xl group-hover:text-[#1557c4]">{job.titulo}</Link>
          </h3>
        </div>
      </div>
      {conSueldo && (
<p className="mt-4 flex items-baseline gap-1.5">
        <span className="font-display text-[1.2rem] font-bold tracking-tight tabular-nums text-success">{job.salario}</span>
        {conSueldo && <span className="text-xs font-semibold text-muted-foreground">al mes</span>}
      </p>
)}
      <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5 shrink-0" aria-hidden="true" /> {job.provincia}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-primary">{etiqueta}</span>
        {job.destacada && <span className="rounded-md bg-[#ffd84d] px-2 py-0.5 text-xs font-extrabold text-[#3d2f00]">Destacada</span>}
        {esNueva(job) && <span className="rounded-md bg-cta px-2 py-0.5 text-xs font-bold text-cta-foreground">Nueva</span>}
        {diasRestantes(job) <= 5 && <span className="text-xs font-bold text-destructive">{venceTexto(job)}</span>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <ClaridadPill job={job} />
        <InclusionPills categorias={job.categorias} />
        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">{viaAplicar(job).texto}</span>
      </div>
      <div className="relative z-10 mt-auto flex gap-2 pt-4">
        <button onClick={() => aplicar(job)} className="btn-aplicar h-11 flex-1 rounded-xl text-base">Aplicar</button>
        <div className="[&_button]:size-11"><BotonGuardar id={job.id} /></div>
      </div>
    </article>
  );
}

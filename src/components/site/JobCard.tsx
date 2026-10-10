import { Link } from "@tanstack/react-router";
import { Banknote, Briefcase, Building2, Clock, MapPin, Monitor } from "lucide-react";

import { AdminAcciones } from "@/components/site/AdminAcciones";
import { useApply } from "@/components/site/apply-context";
import type { Vacante } from "@/lib/vacantes";

export function JobCard({ job }: { job: Vacante }) {
  const aplicar = useApply();
  return (
    <article className={`rounded-2xl border bg-surface p-5 transition-colors hover:border-primary/50 ${job.destacada ? "border-primary/60" : "border-border"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {job.destacada && <span className="mb-1.5 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">Destacada</span>}
          <Link to="/vacantes/$id" params={{ id: job.id }} className="text-lg font-bold leading-snug hover:text-primary">{job.titulo}</Link>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><Building2 className="size-4 shrink-0" /> {job.empresa}</p>
          <p className={`mt-2 flex items-center gap-1.5 text-base font-bold ${job.salarioMin > 0 ? "text-success" : "text-muted-foreground"}`}><Banknote className="size-4 shrink-0" /> {job.salario}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 shrink-0" /> {job.provincia}</span>
            <span className="inline-flex items-center gap-1.5"><Monitor className="size-4 shrink-0" /> {job.modalidad}</span>
            <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4 shrink-0" /> {job.tipo}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4 shrink-0" /> {job.publicado}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Fuente: {job.fuente}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:w-44">
          <Link to="/vacantes/$id" params={{ id: job.id }} className="rounded-xl bg-primary px-5 py-3 text-center text-sm font-bold text-primary-foreground hover:brightness-110">Ver vacante</Link>
          <button onClick={() => aplicar(job)} className="rounded-xl border border-border px-5 py-2.5 text-center text-sm font-semibold hover:border-primary hover:text-primary">Cómo aplicar</button>
        </div>
      </div>
      <AdminAcciones job={job} />
    </article>
  );
}

import { InclusionPills } from "@/components/site/InclusionPills";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, Briefcase, Clock, MapPin, Monitor } from "lucide-react";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { AdminAcciones } from "@/components/site/AdminAcciones";
import { useApply } from "@/components/site/apply-context";
import { claridad, diasRestantes, esNueva, nivelDe, venceTexto } from "@/lib/claridad";
import { useGuardados } from "@/lib/guardados";
import { viaAplicar } from "@/lib/mensajes";
import { usePostulaciones } from "@/lib/postulaciones";
import type { Vacante } from "@/lib/vacantes";
import { lema, nombreEmpresa } from "@/lib/presentar";

export function ClaridadPill({ job, className = "" }: { job: Vacante; className?: string }) {
  const c = claridad(job);
  if (c.puntos === c.total) return <SelloClara className={className} />;
  const tono = c.nivel === "Alta" ? "bg-success/10 text-success" : c.nivel === "Media" ? "bg-cta/15 text-[#8a5200]" : "bg-muted text-muted-foreground";
  return (
    <span title={`Tiene: ${c.tiene.join(", ") || "poca información"}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tono} ${className}`}>
      <span aria-hidden="true" className="flex gap-0.5">{Array.from({ length: c.total }, (_, i) => <span key={i} className={`h-2.5 w-1 rounded-full ${i < c.puntos ? "bg-current" : "bg-current opacity-20"}`} />)}</span>
      Claridad {c.nivel.toLowerCase()}
    </span>
  );
}

/** Sello para las vacantes 6/6. Dice que la información está completa, no que la empresa sea buena. */
export function SelloClara({ className = "", grande = false }: { className?: string; grande?: boolean }) {
  return (
    <span title="Vacante clara: trae salario, empresa, requisitos, funciones, cómo aplicar y fuente (6 de 6). Mide la información, no la empresa." className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0a7a4b] to-[#12a05f] font-extrabold text-white shadow-[0_2px_8px_-2px_rgb(18_160_95/0.5)] ${grande ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs"} ${className}`}>
      <BadgeCheck className={grande ? "size-4" : "size-3.5"} aria-hidden="true" /> Vacante clara 6/6
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
  const via = viaAplicar(job);
  const { yaAplico } = usePostulaciones();
  const resumen = lema(job, 150);
  return (
    <article className={`group relative overflow-hidden rounded-3xl border bg-surface p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-[#1d6ff2]/40 hover:shadow-[var(--shadow-lift)] ${job.destacada ? "border-[#e8c22e]/60" : "border-border"}`}>
      {job.destacada && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ffd84d] to-[#ffb020]" />}
      <div className="flex items-start gap-3.5">
        <EmpresaAvatar nombre={job.empresa} className="size-12 text-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-muted-foreground">{nombreEmpresa(job.empresa)}</p>
          <h3 className="mt-0.5 text-[1.15rem] font-extrabold leading-[1.25] tracking-[-0.01em]">
            <Link to="/vacantes/$id" params={{ id: job.id }} className="text-balance after:absolute after:inset-0 after:rounded-3xl group-hover:text-[#1557c4]">{job.titulo}</Link>
          </h3>
        </div>
      </div>

      {(job.destacada || nueva || yaAplico(job.id)) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {job.destacada && <span className="rounded-full bg-[#ffd84d] px-2.5 py-0.5 text-[11px] font-extrabold text-[#3d2f00]">Destacada</span>}
          {nueva && <span className="rounded-full bg-cta px-2.5 py-0.5 text-[11px] font-bold text-cta-foreground">Nueva</span>}
          {yaAplico(job.id) && <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold text-success">Ya aplicaste</span>}
        </div>
      )}

      {conSueldo && (
        <p className="mt-3.5 flex items-baseline gap-1.5">
          <span className="font-display text-[1.3rem] font-bold tracking-tight tabular-nums text-success">{job.salario}</span>
          <span className="text-xs font-semibold text-muted-foreground">al mes</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-foreground/75">
        <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> {job.provincia}</span>
        <span className="inline-flex items-center gap-1.5"><Monitor className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> {job.modalidad === "Remoto" ? "Desde casa" : job.modalidad}</span>
        <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> {job.tipo}</span>
      </div>

      {resumen && <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-muted-foreground">{resumen}</p>}

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        <ClaridadPill job={job} />
        <InclusionPills categorias={job.categorias} />
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">{nivelDe(job)}</span>
        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">{via.texto}</span>
      </div>

      <div className="relative z-10 mt-4 flex items-center gap-2 border-t border-border pt-4">
        <button onClick={() => aplicar(job)} className="btn-aplicar h-11 flex-1 rounded-xl px-5 text-base sm:max-w-[14rem]">Aplicar</button>
        <Link to="/vacantes/$id" params={{ id: job.id }} className="hidden h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:border-primary hover:text-primary sm:inline-flex">Ver detalles</Link>
        <div className="[&_button]:size-11"><BotonGuardar id={job.id} /></div>
        <span className="ml-auto flex shrink-0 flex-col items-end text-right text-xs leading-tight text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden="true" /> {job.publicado}</span>
          <span className={pronto ? "mt-0.5 font-bold text-destructive" : "mt-0.5"}>{venceTexto(job)}</span>
        </span>
      </div>
      <div className="relative z-10"><AdminAcciones job={job} /></div>
    </article>
  );
}

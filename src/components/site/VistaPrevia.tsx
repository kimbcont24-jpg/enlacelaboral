import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Briefcase, Check, Clock, GraduationCap, MapPin, Monitor } from "lucide-react";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { BotonGuardar, ClaridadPill } from "@/components/site/JobCard";
import { CompartirBoton } from "@/components/site/CompartirBoton";
import { useApply } from "@/components/site/apply-context";
import { diasRestantes, esNueva, venceTexto } from "@/lib/claridad";
import { viaAplicar } from "@/lib/mensajes";
import { usePostulaciones } from "@/lib/postulaciones";
import type { Vacante } from "@/lib/vacantes";

/** Fila compacta del listado en computadora: al tocarla se ve la vacante al lado. */
export function FilaVacante({ job, activa, onElegir }: { job: Vacante; activa: boolean; onElegir: () => void }) {
  const { yaAplico } = usePostulaciones();
  return (
    <button type="button" onClick={onElegir} aria-pressed={activa} className={`group relative w-full rounded-2xl border bg-surface p-4 text-left transition-[border-color,box-shadow] ${activa ? "border-[#1d6ff2] shadow-[0_0_0_3px_rgb(29_111_242/0.15)]" : "border-border hover:border-[#1d6ff2]/50"}`}>
      {job.destacada && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#ffd84d]" />}
      <span className="flex items-start gap-3">
        <EmpresaAvatar nombre={job.empresa} className="size-11 text-lg" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            {job.destacada && <span className="rounded-full bg-[#ffd84d] px-2 py-0.5 text-[10px] font-extrabold text-[#3d2f00]">Destacada</span>}
            {esNueva(job) && <span className="rounded-full bg-cta px-2 py-0.5 text-[10px] font-bold text-cta-foreground">Nueva</span>}
            {yaAplico(job.id) && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">Ya aplicaste</span>}
          </span>
          <span className={`mt-0.5 block text-[15px] font-extrabold leading-snug ${activa ? "text-[#1557c4]" : "group-hover:text-[#1557c4]"}`}>{job.titulo}</span>
          <span className="block truncate text-sm text-muted-foreground">{job.empresa}</span>
          {job.salarioMin > 0 && <span className="mt-1.5 block text-base font-extrabold tabular-nums text-success">{job.salario} <span className="text-xs font-semibold text-muted-foreground">al mes</span></span>}
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {job.provincia}</span>
            <span>{job.modalidad === "Remoto" ? "Desde casa" : job.modalidad}</span>
            <span>{job.publicado}</span>
          </span>
        </span>
      </span>
    </button>
  );
}

/** La vacante elegida, a la derecha del listado (solo en computadora). */
export function VistaPrevia({ job }: { job: Vacante }) {
  const aplicar = useApply();
  const via = viaAplicar(job);
  const pronto = diasRestantes(job) <= 5;
  const lineas = job.descripcion.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return (
    <article key={job.id} className="vista-entra flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-soft)]" aria-label={`Vacante: ${job.titulo}`}>
      <header className="border-b border-border p-6">
        <div className="flex items-start gap-4">
          <EmpresaAvatar nombre={job.empresa} className="size-14 text-2xl" />
          <div className="min-w-0 flex-1">
            <h2 className="text-balance text-xl font-extrabold leading-tight">{job.titulo}</h2>
            <p className="mt-1 text-muted-foreground">{job.empresa}</p>
          </div>
        </div>
        {job.salarioMin > 0 && <p className="mt-4 font-display text-[1.65rem] font-extrabold leading-none tracking-tight text-success">{job.salario} <span className="font-sans text-sm font-semibold text-muted-foreground">al mes</span></p>}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {[{ I: MapPin, t: job.provincia }, { I: Monitor, t: job.modalidad }, { I: Briefcase, t: job.tipo }, { I: GraduationCap, t: job.experiencia }].map(({ I, t }) => <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 font-semibold"><I className="size-4 text-muted-foreground" />{t}</span>)}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={() => aplicar(job)} className="btn-aplicar h-12 flex-1 rounded-xl text-base">Aplicar</button>
          <div className="[&_button]:size-12"><BotonGuardar id={job.id} /></div>
          <CompartirBoton job={job} solo className="size-12" />
        </div>
        <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span>{via.texto}</span><span className="inline-flex items-center gap-1"><Clock className="size-3" /> {job.publicado}</span><span className={pronto ? "font-bold text-destructive" : ""}>{venceTexto(job)}</span></p>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <ClaridadPill job={job} />
        {job.requisitos.length > 0 && (
          <section className="mt-5">
            <h3 className="font-extrabold">Lo que piden</h3>
            <ul className="mt-3 space-y-2.5">
              {job.requisitos.slice(0, 12).map((r) => <li key={r} className="flex items-start gap-2.5 text-[15px] leading-snug"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/12 text-success"><Check className="size-3.5" strokeWidth={3} /></span><span className="min-w-0 [overflow-wrap:anywhere]">{r}</span></li>)}
            </ul>
          </section>
        )}
        {lineas.length > 0 && (
          <section className="mt-6">
            <h3 className="font-extrabold">Sobre el puesto</h3>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-foreground/85">{lineas.slice(0, 14).map((l, i) => <p key={i} className="[overflow-wrap:anywhere]">{l.replace(/^[-•*▪●✓✔]\s+/, "• ")}</p>)}</div>
          </section>
        )}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
          <span className="truncate text-muted-foreground">Fuente: {job.fuente}</span>
          <Link to="/vacantes/$id" params={{ id: job.id }} className="inline-flex shrink-0 items-center gap-1 font-bold text-[#1557c4] hover:underline">Ver página completa <ArrowUpRight className="size-4" /></Link>
        </div>
      </div>
    </article>
  );
}

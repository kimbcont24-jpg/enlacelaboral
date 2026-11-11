import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Briefcase, Check, Clock, Gift, GraduationCap, Info, MapPin, Monitor, Plus, ShieldCheck, Target } from "lucide-react";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { BotonGuardar, ClaridadPill } from "@/components/site/JobCard";
import { InclusionPills } from "@/components/site/InclusionPills";
import { CompartirBoton } from "@/components/site/CompartirBoton";
import { useApply } from "@/components/site/apply-context";
import { diasRestantes, esNueva, venceTexto } from "@/lib/claridad";
import { viaAplicar } from "@/lib/mensajes";
import { usePostulaciones } from "@/lib/postulaciones";
import type { Vacante } from "@/lib/vacantes";
import { registrarVista } from "@/lib/vistas";
import { nombreEmpresa, presentar } from "@/lib/presentar";

/** Fila compacta del listado en computadora: al tocarla se ve la vacante al lado. */
export function FilaVacante({ job, activa, onElegir }: { job: Vacante; activa: boolean; onElegir: () => void }) {
  const { yaAplico } = usePostulaciones();
  return (
    <button type="button" onClick={() => { registrarVista(job.id, job.estado); onElegir(); }} aria-pressed={activa} className={`group relative w-full rounded-2xl border bg-surface p-4 text-left transition-[border-color,box-shadow] ${activa ? "border-[#1d6ff2] shadow-[0_0_0_3px_rgb(29_111_242/0.15)]" : "border-border hover:border-[#1d6ff2]/50"}`}>
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
          <span className="block truncate text-sm text-muted-foreground">{nombreEmpresa(job.empresa)}</span>
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
  const p = presentar(job);
  const H = ({ I, t }: { I: typeof Target; t: string }) => <h3 className="flex items-center gap-2 text-[1.05rem] font-extrabold"><span className="grid size-7 place-items-center rounded-lg bg-[#e6efff] text-[#1557c4]"><I className="size-4" aria-hidden="true" /></span>{t}</h3>;
  return (
    <article key={job.id} className="vista-entra flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-[var(--shadow-soft)]" aria-label={`Vacante: ${job.titulo}`}>
      <header className="hero-dark shrink-0 p-6">
        <div className="flex items-center gap-3.5">
          <EmpresaAvatar nombre={job.empresa} claro className="size-12 text-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-white">{nombreEmpresa(job.empresa)}</p>
            <p className="text-sm text-white/70">Publicada {job.publicado}</p>
          </div>
        </div>
        <h2 className="mt-4 text-balance text-[1.6rem] font-extrabold leading-[1.12] tracking-[-0.02em]">{job.titulo}</h2>
        {job.salarioMin > 0 && <p className="mt-3 font-display text-[1.5rem] font-bold leading-none tracking-tight text-[#7ff0b8]">{job.salario} <span className="font-sans text-sm font-semibold text-white/70">al mes</span></p>}
        <div className="mt-4 flex flex-wrap gap-1.5 text-sm">
          {[{ I: MapPin, t: job.provincia }, { I: Monitor, t: job.modalidad === "Remoto" ? "Desde casa" : job.modalidad }, { I: Briefcase, t: job.tipo }, { I: GraduationCap, t: job.experiencia }].map(({ I, t }) => <span key={t} className="vidrio inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-white"><I className="size-4 text-[#8ec1ff]" />{t}</span>)}
        </div>
      </header>
      <div className="shrink-0 border-b border-border p-5">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => aplicar(job)} className="btn-aplicar h-12 flex-1 rounded-xl text-base">Aplicar</button>
          <div className="[&_button]:size-12"><BotonGuardar id={job.id} /></div>
          <CompartirBoton job={job} solo className="size-12" />
        </div>
        <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5" /> Gratis · {via.texto}</span><span className="inline-flex items-center gap-1"><Clock className="size-3" /> {job.publicado}</span><span className={pronto ? "font-bold text-destructive" : ""}>{venceTexto(job)}</span></p>
      </div>
      <div className="flex-1 space-y-7 overflow-y-auto p-6">
        <div className="flex flex-wrap gap-1.5"><ClaridadPill job={job} /><InclusionPills categorias={job.categorias} max={5} /></div>
        {(p.resumen.length > 0 || p.lista.length > 0) && (
          <div className="space-y-3 text-[15px] leading-relaxed text-foreground/85">
            {p.resumen.slice(0, 3).map((t, i) => <p key={i} className="[overflow-wrap:anywhere]">{t}</p>)}
            {p.lista.length > 0 && <ul className="space-y-1.5">{p.lista.slice(0, 8).map((x) => <li key={x} className="flex gap-2.5"><span className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-[#1d6ff2]" />{x}</li>)}</ul>}
          </div>
        )}
        {p.notas.length > 0 && <p className="flex gap-2 rounded-xl bg-[#f2f7ff] p-3 text-sm leading-snug"><Info className="mt-0.5 size-4 shrink-0 text-[#1557c4]" />{p.notas.join(" ")}</p>}
        {p.funciones.length > 0 && (
          <section>
            <H I={Target} t="Lo que harás" />
            <ol className="mt-3 space-y-2">{p.funciones.slice(0, 8).map((f, i) => <li key={f} className="flex gap-3 text-[15px] leading-snug"><span className="font-display text-xs font-bold text-[#1d6ff2]">{String(i + 1).padStart(2, "0")}</span><span className="min-w-0 [overflow-wrap:anywhere]">{f}</span></li>)}</ol>
          </section>
        )}
        {p.imprescindibles.length > 0 && (
          <section>
            <H I={Check} t="Lo que piden" />
            <ul className="mt-3 space-y-2.5">
              {p.imprescindibles.slice(0, 12).map((r) => <li key={r} className="flex items-start gap-2.5 text-[15px] leading-snug"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/12 text-success"><Check className="size-3.5" strokeWidth={3} /></span><span className="min-w-0 [overflow-wrap:anywhere]">{r}</span></li>)}
            </ul>
          </section>
        )}
        {p.cualidades.length > 0 && <div className="flex flex-wrap gap-1.5">{p.cualidades.map((c) => <span key={c} className="rounded-full bg-[#e8f0ff] px-3 py-1 text-xs font-semibold text-[#0f3f8c]">{c}</span>)}</div>}
        {p.suman.length > 0 && <div className="flex flex-wrap gap-1.5">{p.suman.map((s) => <span key={s} className="inline-flex items-center gap-1 rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-semibold text-[#6b4a00] ring-1 ring-[#d99400]/25"><Plus className="size-3" strokeWidth={3} />{s}</span>)}</div>}
        {p.ofrece.length > 0 && (
          <section>
            <H I={Gift} t="Lo que ofrecen" />
            <div className="mt-3 flex flex-wrap gap-1.5">{p.ofrece.map((b) => <span key={b} className="rounded-full bg-success/10 px-3 py-1.5 text-sm font-semibold text-success">{b}</span>)}</div>
          </section>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
          <span className="truncate text-muted-foreground">Fuente: {job.fuente}</span>
          <Link to="/vacantes/$id" params={{ id: job.id }} className="inline-flex shrink-0 items-center gap-1 font-bold text-[#1557c4] hover:underline">Ver página completa <ArrowUpRight className="size-4" /></Link>
        </div>
      </div>
    </article>
  );
}

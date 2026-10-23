import { Link } from "@tanstack/react-router";

import { useApply } from "@/components/site/apply-context";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { SearchBar } from "@/components/site/SearchBar";
import { esNueva } from "@/lib/claridad";
import { textosPorDefecto, useContenido } from "@/lib/contenido";
import { CANAL_WHATSAPP, type Vacante } from "@/lib/vacantes";
import { BadgeCheck, Banknote, UserRoundCheck } from "lucide-react";

const populares = ["Recepcionista", "Cajero", "Call center", "Asistente administrativo", "Ventas", "Chofer"];

type Props = { puesto: string; provincia: string; onPuesto: (v: string) => void; onProvincia: (v: string) => void; onBuscar: () => void; total: number; provincias: number; jobs?: Vacante[] };

/** Vacante real que se muestra en la tarjeta de la portada: la destacada o, si no hay, la más reciente. */
function elegirTarjeta(jobs: Vacante[]): Vacante | undefined {
  return jobs.find((j) => j.destacada) ?? jobs[0];
}

function TarjetaPortada({ job }: { job: Vacante }) {
  const aplicar = useApply();
  const conSueldo = job.salarioMin > 0;
  return (
    <div className="entra w-full max-w-[19rem] rotate-[2.5deg] rounded-3xl border-t-[6px] border-t-[#ffd84d] bg-surface p-5 text-foreground shadow-[0_34px_60px_-26px_rgba(0,0,0,0.75)] [animation-delay:240ms]">
      {esNueva(job) && <span className="mb-3 inline-block rounded-full bg-cta px-2.5 py-0.5 text-xs font-bold text-cta-foreground">Nueva</span>}
      <div className="flex items-center gap-3">
        <EmpresaAvatar nombre={job.empresa} className="size-11 text-lg" />
        <div className="min-w-0">
          <Link to="/vacantes/$id" params={{ id: job.id }} className="block text-base font-extrabold leading-snug hover:text-primary">{job.titulo}</Link>
          <p className="truncate text-sm text-muted-foreground">{job.empresa}</p>
        </div>
      </div>
      {conSueldo ? (
        <div className="mt-4">
          <p className="font-display text-[1.6rem] font-extrabold leading-none tracking-tight text-success">{job.salario.split(" - ")[0]}</p>
          <p className="mt-1.5 text-sm font-bold text-success">{job.salario.includes(" - ") ? `a ${job.salario.split(" - ")[1]}` : ""}<span className="font-semibold text-muted-foreground">{job.salario.includes(" - ") ? " al mes" : "al mes"}</span></p>
        </div>
      ) : (
        <p className="mt-4 text-base font-bold text-muted-foreground">{job.salario}</p>
      )}
      <p className="mt-1.5 text-sm text-muted-foreground">{job.provincia} · {job.modalidad}</p>
      <button onClick={() => aplicar(job)} className="btn-aplicar mt-4 h-12 w-full rounded-full text-base">Aplicar</button>
    </div>
  );
}

export function Hero({ puesto, provincia, onPuesto, onProvincia, onBuscar, total, provincias, jobs = [] }: Props) {
  const tarjeta = elegirTarjeta(jobs);
  const t = useContenido();
  // Textos de versiones anteriores guardados en el panel: se reemplazan por los nuevos.
  const viejo = (v: string) => v.startsWith("Encuentra tu próximo empleo") || v.startsWith("Conectamos talento con oportunidades reales") || v.startsWith("Tu enlace con el empleo");
  const titulo = viejo(t.hero_titulo) ? textosPorDefecto.hero_titulo : t.hero_titulo;
  const subtitulo = viejo(t.hero_subtitulo) || t.hero_subtitulo.startsWith("Reunimos vacantes") ? textosPorDefecto.hero_subtitulo : t.hero_subtitulo;

  return (
    <header className="hero-dark px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-14">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-cta sm:size-[24rem] lg:-right-28 lg:-top-32 lg:size-[28rem]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-6 hidden h-28 w-52 rounded-t-full bg-[#ffd84d] md:block lg:right-24 lg:h-40 lg:w-72" />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
        <h1 className="entra max-w-2xl text-balance font-display text-[1.9rem] font-extrabold leading-[1.14] tracking-[-0.03em] sm:text-[2rem] md:text-[2.35rem]">{titulo}</h1>
        <p className="entra mt-4 max-w-xl text-lg text-white/85 [animation-delay:80ms]">{subtitulo}</p>

        <div className="entra mt-7 [animation-delay:160ms] [&_button]:rounded-full md:[&_form]:rounded-full md:[&_form]:pl-5 [&_form]:rounded-[1.75rem] [&_form]:border-transparent [&_form]:text-foreground [&_form]:shadow-[0_20px_50px_-20px_rgba(0,0,0,.6)]">
          <SearchBar puesto={puesto} provincia={provincia} onPuesto={onPuesto} onProvincia={onProvincia} onSubmit={onBuscar} ctaLabel="Buscar" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-white/75">Búsquedas populares:</span>
          {populares.map((p) => (
            <Link key={p} to="/vacantes" search={{ q: p }} className="rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-white/25">{p}</Link>
          ))}
          <Link to="/empleos/$slug" params={{ slug: "remoto" }} className="rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-white/25">Desde casa</Link>
          <Link to="/vacantes" search={{ experiencia: "Sin experiencia" }} className="rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-white/25">Primer empleo</Link>
          <Link to="/descubrir" className="rounded-full bg-[#ffd84d] px-3.5 py-1.5 text-sm font-extrabold text-[#3d2f00] hover:bg-[#ffe27a]">Descubrir deslizando</Link>
        </div>

        </div>
        {tarjeta && <div className="hidden justify-center lg:flex"><TarjetaPortada job={tarjeta} /></div>}
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/15 pt-6 lg:pr-80">
          <ul className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-white/90">
            <li className="flex items-center gap-2"><Banknote className="size-4 text-[#8ec1ff]" aria-hidden="true" /> Salario visible cuando la empresa lo indica</li>
            <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-[#8ec1ff]" aria-hidden="true" /> Aplicar es gratis</li>
            <li className="flex items-center gap-2"><UserRoundCheck className="size-4 text-[#8ec1ff]" aria-hidden="true" /> Sin cuenta ni contraseña</li>
            {total > 0 && <li className="flex items-center gap-2 text-white/75">{total} {total === 1 ? "vacante activa" : "vacantes activas"}{provincias > 0 ? ` · ${provincias} ${provincias === 1 ? "provincia" : "provincias"}` : ""}</li>}
          </ul>
          <a href={CANAL_WHATSAPP} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#1fa855] px-4 py-2 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(31,168,85,.9)] hover:bg-[#178c46]">Únete al canal de WhatsApp</a>
        </div>
      </div>
    </header>
  );
}

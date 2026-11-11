import { Link } from "@tanstack/react-router";
import { nombreEmpresa } from "@/lib/presentar";

import { useApply } from "@/components/site/apply-context";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { SearchBar } from "@/components/site/SearchBar";
import { esNueva } from "@/lib/claridad";
import { textosPorDefecto, useContenido } from "@/lib/contenido";
import { CANAL_WHATSAPP, type Vacante } from "@/lib/vacantes";
import { BadgeCheck, Banknote, UserRoundCheck } from "lucide-react";

const populares = ["Recepcionista", "Cajero", "Call center", "Asistente administrativo", "Ventas", "Chofer"];

type Props = { puesto: string; provincia: string; onPuesto: (v: string) => void; onProvincia: (v: string) => void; onBuscar: () => void; total: number; provincias: number; jobs?: Vacante[] };

/** Vacantes reales para la portada: primero las destacadas y las que dicen el salario. */
function elegirTarjetas(jobs: Vacante[]): Vacante[] {
  const conSueldo = jobs.filter((j) => j.salarioMin > 0);
  const orden = [...conSueldo.filter((j) => j.destacada), ...conSueldo.filter((j) => !j.destacada), ...jobs.filter((j) => j.salarioMin <= 0)];
  const vistas = new Set<string>();
  return orden.filter((j) => (vistas.has(j.empresa) ? false : (vistas.add(j.empresa), true))).slice(0, 3);
}

function TarjetaPortada({ job }: { job: Vacante }) {
  const aplicar = useApply();
  const conSueldo = job.salarioMin > 0;
  return (
    <div className="w-full rounded-3xl border-t-[6px] border-t-[#ffd84d] bg-surface p-5 text-foreground shadow-[0_34px_60px_-26px_rgba(0,0,0,0.75)]">
      {esNueva(job) && <span className="mb-3 inline-block rounded-full bg-cta px-2.5 py-0.5 text-xs font-bold text-cta-foreground">Nueva</span>}
      <div className="flex items-center gap-3">
        <EmpresaAvatar nombre={job.empresa} className="size-11 text-lg" />
        <div className="min-w-0">
          <Link to="/vacantes/$id" params={{ id: job.id }} className="block text-base font-extrabold leading-snug hover:text-primary">{job.titulo}</Link>
          <p className="truncate text-sm text-muted-foreground">{nombreEmpresa(job.empresa)}</p>
        </div>
      </div>
      {conSueldo && (
        <div className="mt-4">
          <p className="font-display text-[1.6rem] font-extrabold leading-none tracking-tight text-success">{job.salario.split(" - ")[0]}</p>
          <p className="mt-1.5 text-sm font-bold text-success">{job.salario.includes(" - ") ? `a ${job.salario.split(" - ")[1]}` : ""}<span className="font-semibold text-muted-foreground">{job.salario.includes(" - ") ? " al mes" : "al mes"}</span></p>
        </div>
      )}
      <p className="mt-1.5 text-sm text-muted-foreground">{job.provincia} · {job.modalidad}</p>
      <button onClick={() => aplicar(job)} className="btn-aplicar mt-4 h-12 w-full rounded-full text-base">Aplicar</button>
    </div>
  );
}

export function Hero({ puesto, provincia, onPuesto, onProvincia, onBuscar, total, provincias, jobs = [] }: Props) {
  const tarjetas = elegirTarjetas(jobs);
  const t = useContenido();
  // Textos de versiones anteriores guardados en el panel: se reemplazan por los nuevos.
  const viejo = (v: string) => v.startsWith("Encuentra tu próximo empleo") || v.startsWith("Conectamos talento con oportunidades reales") || v.startsWith("Tu enlace con el empleo");
  const titulo = viejo(t.hero_titulo) ? textosPorDefecto.hero_titulo : t.hero_titulo;
  const subtitulo = viejo(t.hero_subtitulo) || t.hero_subtitulo.startsWith("Reunimos vacantes") ? textosPorDefecto.hero_subtitulo : t.hero_subtitulo;

  return (
    <header className="hero-dark px-4 pb-16 pt-10 sm:pb-12 sm:px-6 md:pb-16 md:pt-14">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-1/2 hidden size-[34rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(29_111_242/.55)_0%,rgb(29_111_242/0)_65%)] lg:block" />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0">
        <h1 className="entra max-w-2xl text-balance font-display text-[1.9rem] font-extrabold leading-[1.14] tracking-[-0.03em] sm:text-[2rem] md:text-[2.35rem]">{titulo}</h1>
        <p className="entra mt-4 max-w-xl text-lg text-white/85 [animation-delay:80ms]">{subtitulo}</p>

        <div className="entra mt-7 [animation-delay:160ms] [&_button]:rounded-full md:[&_form]:rounded-full md:[&_form]:pl-5 [&_form]:rounded-[1.75rem] [&_form]:border-transparent [&_form]:text-foreground [&_form]:shadow-[0_20px_50px_-20px_rgba(0,0,0,.6)]">
          <SearchBar puesto={puesto} provincia={provincia} onPuesto={onPuesto} onProvincia={onProvincia} onSubmit={onBuscar} ctaLabel="Buscar" />
        </div>

        <p className="mt-5 text-sm text-white/75 md:hidden">Búsquedas populares:</p>
        <div className="-mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:mt-5 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden [&>a]:shrink-0 [&>a]:whitespace-nowrap">
          <span className="mr-1 hidden text-sm text-white/75 md:inline">Búsquedas populares:</span>
          {populares.map((p) => (
            <Link key={p} to="/vacantes" search={{ q: p }} className="rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-white/25">{p}</Link>
          ))}
          <Link to="/empleos/$slug" params={{ slug: "remoto" }} className="rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-white/25">Desde casa</Link>
          <Link to="/vacantes" search={{ experiencia: "Sin experiencia" }} className="rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-white/25">Primer empleo</Link>
          <Link to="/descubrir" className="order-first rounded-full bg-[#ffd84d] px-3.5 py-1.5 md:order-none text-sm font-extrabold text-[#3d2f00] hover:bg-[#ffe27a]">Descubrir deslizando</Link>
        </div>

        </div>
        {tarjetas.length > 0 && (
          <div className="relative hidden h-[22rem] lg:block" aria-label="Vacantes recientes">
            {tarjetas.slice(1).reverse().map((j, i, arr) => {
              const pos = arr.length - i; // 2 = la de más atrás
              return (
                <div key={j.id} aria-hidden="true" className="absolute inset-x-0 top-6 origin-bottom" style={{ transform: `translate(${pos === 2 ? -38 : 30}px, ${pos * -16}px) rotate(${pos === 2 ? -8 : 6}deg) scale(${1 - pos * 0.05})` }}>
                  <div className="entra pointer-events-none" style={{ animationDelay: `${120 + i * 80}ms` }}><div className={pos === 2 ? "opacity-60" : "opacity-85"}><TarjetaPortada job={j} /></div></div>
                </div>
              );
            })}
            <div className="absolute inset-x-0 top-8 rotate-[1.5deg]"><div className="entra [animation-delay:300ms]"><TarjetaPortada job={tarjetas[0]!} /></div></div>
          </div>
        )}
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/15 pt-6">
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

import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Accessibility, ArrowRight, Clock, GraduationCap, HeartHandshake, ShieldCheck, Sprout } from "lucide-react";

import { LOGO_BROCHE, LOGO_CABEZA, LOGO_CUERPO, LOGO_MALETIN, LOGO_VIEWBOX } from "@/components/site/logo-paths";
import { enCamino } from "@/lib/inclusion";
import { useVacantes } from "@/lib/vacantes";

const CAMINOS = [
  { id: "primer-empleo", I: Sprout, t: "Mi primer empleo", d: "Sin pedir experiencia", c: "#7ee2a8" },
  { id: "estudiantes", I: GraduationCap, t: "Estudiantes", d: "Pasantías y medio tiempo", c: "#8ec1ff" },
  { id: "horario-flexible", I: Clock, t: "Horario flexible", d: "Medio tiempo o desde casa", c: "#f9a8d4" },
  { id: "discapacidad", I: Accessibility, t: "Con discapacidad", d: "Empresas comprometidas", c: "#c4b5fd" },
] as const;

/**
 * Franja de la portada: caminos para quienes más cuesta conseguir empleo.
 * Degradado de marca, tarjetas de vidrio y, abajo, la marca de agua de Enlace Laboral.
 */
export function EmpleoParaTodosBanda() {
  const { jobs, cargando } = useVacantes();
  const cuenta = useMemo(() => Object.fromEntries(CAMINOS.map((c) => [c.id, jobs.filter((j) => enCamino(j, c.id)).length])), [jobs]);

  return (
    <section className="px-4 pb-12 sm:px-6" aria-labelledby="t-para-todos">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] bg-[linear-gradient(120deg,#0a2f5c_0%,#0f4aa8_48%,#0f7a43_120%)] px-5 pb-20 pt-9 text-white shadow-[0_40px_80px_-40px_rgb(10_47_92/0.75)] sm:px-10 sm:pb-36 sm:pt-12">
        {/* Luces y trama */}
        <span aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-[#1d6ff2]/40 blur-3xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-[#7ee2a8]/20 blur-3xl" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />

        {/* Símbolo grande de fondo */}
        <svg aria-hidden="true" viewBox={LOGO_VIEWBOX} className="pointer-events-none absolute -right-16 top-6 hidden w-[26rem] opacity-[0.06] lg:block">
          <path d={LOGO_CABEZA} fill="#fff" /><path d={LOGO_CUERPO} fill="#fff" /><path d={LOGO_MALETIN} fill="#fff" /><path d={LOGO_BROCHE} fill="#fff" />
        </svg>

        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-[#7ee2a8] ring-1 ring-white/20 backdrop-blur"><HeartHandshake className="size-4" aria-hidden="true" /> Cero discriminación</p>
            <h2 id="t-para-todos" className="mt-4 text-balance font-display text-[1.9rem] font-extrabold leading-[1.1] sm:text-[2.4rem]">Empleo para <span className="bg-gradient-to-r from-[#ffd84d] to-[#7ee2a8] bg-clip-text text-transparent">todas las personas</span></h2>
            <p className="mt-3 max-w-md text-white/85">Aquí está prohibido pedir edad, sexo, foto o CV con foto. Elige tu camino y encuentra vacantes pensadas para ti.</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-[#7ee2a8]" aria-hidden="true" /> Revisamos cada aviso</span>
              <Link to="/empleo-para-todos" className="inline-flex items-center gap-1 font-bold text-white hover:underline">Conoce el programa <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-3">
            {CAMINOS.map(({ id, I, t, d, c }) => {
              const n = cuenta[id] ?? 0;
              return (
                <li key={id}>
                  <Link to="/empleo-para-todos" hash={id}
                    className="group flex h-full flex-col rounded-3xl border border-white/20 bg-white/[0.08] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.15)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/[0.14] sm:p-5">
                    <span className="grid size-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20" style={{ color: c }}><I className="size-5" aria-hidden="true" /></span>
                    <span className="mt-3 text-[15px] font-extrabold leading-snug sm:text-base">{t}</span>
                    <span className="mt-0.5 text-xs text-white/70 sm:text-sm">{d}</span>
                    <span className="mt-auto flex items-center justify-between pt-3 text-xs font-bold" style={{ color: c }}>
                      {id === "discapacidad" ? "Ver opciones" : cargando ? "Contando…" : `${n} ${n === 1 ? "vacante" : "vacantes"}`}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Marca de agua abajo */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 select-none text-center leading-none">
          <p className="translate-y-[18%] whitespace-nowrap font-display text-[12.5vw] font-extrabold tracking-tight text-white/[0.08] sm:text-[8.5rem]">ENLACE LABORAL</p>
          <p className="absolute inset-x-0 bottom-3 whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.28em] text-white/40 sm:bottom-5 sm:text-xs sm:tracking-[0.5em]">Conecta talento con oportunidades reales</p>
        </div>
      </div>
    </section>
  );
}

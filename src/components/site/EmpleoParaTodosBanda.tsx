import { Link } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useMemo, useRef } from "react";
import { Accessibility, ArrowRight, Brain, Clock, GraduationCap, HeartHandshake, ShieldCheck, Sprout } from "lucide-react";

import { LOGO_BROCHE, LOGO_CABEZA, LOGO_CUERPO, LOGO_MALETIN, LOGO_VIEWBOX } from "@/components/site/logo-paths";
import { enCamino } from "@/lib/inclusion";
import { useVacantes } from "@/lib/vacantes";

const CAMINOS = [
  { id: "primer-empleo", I: Sprout, t: "Mi primer empleo", d: "Sin pedir experiencia", c: "#7ee2a8" },
  { id: "estudiantes", I: GraduationCap, t: "Estudiantes", d: "Pasantías y medio tiempo", c: "#8ec1ff" },
  { id: "horario-flexible", I: Clock, t: "Horario flexible", d: "Medio tiempo o desde casa", c: "#f9a8d4" },
  { id: "discapacidad", I: Accessibility, t: "Con discapacidad", d: "Empresas comprometidas", c: "#c4b5fd" },
  { id: "neurodivergencia", I: Brain, t: "Neurodivergentes", d: "Autismo, TDAH, dislexia", c: "#7dd3e0" },
] as const;

/**
 * Franja de la portada: caminos para quienes más cuesta conseguir empleo.
 * Degradado de marca, tarjetas con su color y, abajo, el nombre «ENLACE LABORAL» completo.
 * Todo el movimiento sale de dos números que se calculan al bajar: --p (recorrido) y --e (entrada).
 */
export function EmpleoParaTodosBanda() {
  const { jobs, cargando } = useVacantes();
  const cuenta = useMemo(() => Object.fromEntries(CAMINOS.map((c) => [c.id, jobs.filter((j) => enCamino(j, c.id)).length])), [jobs]);
  const ref = useRef<HTMLElement>(null);
  const marca = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // El nombre siempre cabe entero: se mide una vez y se ajusta al ancho de la franja.
    const ajustar = () => {
      const m = marca.current;
      if (!m) return;
      m.style.fontSize = "100px";
      const ancho = m.offsetWidth || 1;
      const meta = el.clientWidth * (el.clientWidth < 640 ? 0.9 : 0.86);
      m.style.fontSize = `${Math.min(210, (100 * meta) / ancho).toFixed(1)}px`;
    };

    let raf = 0;
    let antes = "";
    const medir = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      const e = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.8)));
      const clave = `${p.toFixed(3)}|${e.toFixed(3)}`;
      if (clave === antes) return;
      antes = clave;
      el.style.setProperty("--p", p.toFixed(3));
      el.style.setProperty("--e", e.toFixed(3));
    };
    const pedir = () => { if (!raf) raf = requestAnimationFrame(medir); };
    const alCambiarTamano = () => { ajustar(); pedir(); };

    ajustar();
    document.fonts?.ready.then(ajustar).catch(() => {});
    window.addEventListener("resize", alCambiarTamano);
    if (!quieto) { medir(); window.addEventListener("scroll", pedir, { passive: true }); }
    return () => { window.removeEventListener("scroll", pedir); window.removeEventListener("resize", alCambiarTamano); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Luz que sigue al cursor dentro de cada tarjeta (solo donde hay ratón).
  const seguirCursor = (ev: React.PointerEvent<HTMLUListElement>) => {
    if (ev.pointerType !== "mouse") return;
    const carta = (ev.target as HTMLElement).closest<HTMLElement>(".ept-carta");
    if (!carta) return;
    const r = carta.getBoundingClientRect();
    carta.style.setProperty("--mx", `${ev.clientX - r.left}px`);
    carta.style.setProperty("--my", `${ev.clientY - r.top}px`);
  };

  return (
    <section ref={ref} aria-labelledby="t-para-todos" style={{ "--p": 0.5, "--e": 1 } as React.CSSProperties}
      className="ept-banda relative mb-12 mt-10 overflow-hidden px-4 pb-8 pt-20 text-white sm:px-6 sm:pb-12 sm:pt-28">
      {/* Degradado de marca que se desplaza con el scroll */}
      <span aria-hidden="true" className="ept-banda-fondo absolute inset-0" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />

      {/* Símbolo grande que se mueve más lento (parallax) */}
      <svg aria-hidden="true" viewBox={LOGO_VIEWBOX} className="ept-banda-simbolo pointer-events-none absolute left-1/2 top-[42%] w-[30rem] max-w-[90vw] opacity-[0.07]">
        <path d={LOGO_CABEZA} fill="#fff" /><path d={LOGO_CUERPO} fill="#fff" /><path d={LOGO_MALETIN} fill="#fff" /><path d={LOGO_BROCHE} fill="#fff" />
      </svg>

      <div className="relative mx-auto max-w-6xl">
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.15fr]">
          <div className="ept-banda-texto">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-[#7ee2a8] ring-1 ring-white/20"><HeartHandshake className="size-4" aria-hidden="true" /> Cero discriminación</p>
            <h2 id="t-para-todos" className="mt-4 text-balance font-display text-[1.9rem] font-extrabold leading-[1.1] sm:text-[2.4rem]">Empleo para <span className="bg-gradient-to-r from-[#ffd84d] to-[#7ee2a8] bg-clip-text text-transparent">todas las personas</span></h2>
            <p className="mt-3 max-w-md text-white/90">Aquí está prohibido pedir edad, sexo, foto o CV con foto. Elige tu camino y encuentra vacantes pensadas para ti.</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-[#7ee2a8]" aria-hidden="true" /> Revisamos cada aviso</span>
              <Link to="/empleo-para-todos" className="inline-flex items-center gap-1 rounded-full font-bold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Conoce el programa <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-3" onPointerMove={seguirCursor}>
            {CAMINOS.map(({ id, I, t, d, c }, i) => {
              const n = cuenta[id] ?? 0;
              const ancha = i === CAMINOS.length - 1;
              return (
                <li key={id} className={`ept-carta-sube ${ancha ? "col-span-2" : ""}`} style={{ "--i": i } as React.CSSProperties}>
                  <Link to="/empleo-para-todos" hash={id} style={{ "--c": c } as React.CSSProperties}
                    className={`ept-carta group relative flex h-full overflow-hidden rounded-3xl p-4 sm:p-5 ${ancha ? "flex-col sm:flex-row sm:items-center sm:gap-4" : "flex-col"}`}>
                    <span className="ept-carta-icono grid size-11 shrink-0 place-items-center rounded-2xl"><I className="size-5" aria-hidden="true" /></span>
                    <span className={`flex min-w-0 flex-col ${ancha ? "mt-3 sm:mt-0 sm:flex-1" : "mt-3"}`}>
                      <span className="text-[15px] font-extrabold leading-snug sm:text-base">{t}</span>
                      <span className="mt-0.5 text-xs text-white/80 sm:text-sm">{d}</span>
                    </span>
                    <span className={`flex items-center justify-between gap-3 text-xs font-bold sm:text-[13px] ${ancha ? "mt-auto pt-3 sm:mt-0 sm:pt-0" : "mt-auto pt-3"}`} style={{ color: c }}>
                      {id === "discapacidad" || id === "neurodivergencia" ? "Ver opciones" : cargando ? "Ver vacantes" : `${n} ${n === 1 ? "vacante" : "vacantes"}`}
                      <span className="ept-carta-flecha grid size-8 shrink-0 place-items-center rounded-full"><ArrowRight className="size-4" aria-hidden="true" /></span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* El nombre completo, con una luz que lo recorre mientras bajas */}
      <div aria-hidden="true" className="ept-banda-marca pointer-events-none relative mt-12 select-none text-center sm:mt-16">
        <p ref={marca} className="ept-banda-nombre inline-block whitespace-nowrap font-display font-extrabold leading-[0.9] tracking-tight">ENLACE LABORAL</p>
        <p className="mt-3 whitespace-nowrap text-[8.5px] font-bold uppercase tracking-[0.1em] text-white/75 sm:mt-4 sm:text-xs sm:tracking-[0.5em]">Cero discriminación · Empleo para todas las personas</p>
      </div>
    </section>
  );
}

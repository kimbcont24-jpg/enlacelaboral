import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { useMemo } from "react";

import { faltan, OFICINAS_EMPLEO, organizadorDe, ubicacion, useJornadas, type Jornada } from "@/lib/jornadas";
import { proyectar, RD_MAPA } from "@/lib/rd-mapa";

const HUB = proyectar(18.4861, -69.9312); // Enlace, en Santo Domingo
const CIUDADES: [number, number][] = [[19.4517, -70.697], [18.62, -68.45], [19.7934, -70.6884], [18.2085, -71.1008], [18.4273, -68.9728]];
const PUNTOS = RD_MAPA.puntos.filter((_, i) => i % 2 === 0);

const limpiar = (t: string) => t.replace(/^Feria de empleo:\s*/i, "");
const dia = (iso: string) => new Date(iso).toLocaleDateString("es-DO", { day: "numeric" });
const mes = (iso: string) => new Date(iso).toLocaleDateString("es-DO", { month: "short" }).replace(".", "");

/**
 * Ferias de empleo en la portada, en una sola pieza: nace del azul de «Empleo para todas las personas»
 * (un hilo de luz baja desde la banda), a la izquierda el país con faros donde hay ferias y,
 * a la derecha, la próxima feria destacada y las siguientes en una línea de tiempo.
 */
export function FeriasConectadas() {
  const { data } = useJornadas();
  const ferias = data ?? [];
  const [proxima, ...resto] = ferias;
  const siguientes = resto.slice(0, 3);

  const faros = useMemo(() => {
    const desdeFerias = ferias.flatMap((j) => { const u = ubicacion(j); return u ? [proyectar(u[0], u[1])] : []; });
    const base = desdeFerias.length ? desdeFerias : [...CIUDADES, ...OFICINAS_EMPLEO.slice(2).map((o) => o.pos)].map(([la, ln]) => proyectar(la, ln));
    return base.slice(0, 7);
  }, [ferias]);

  return (
    <section aria-labelledby="t-ferias" className="relative z-10 -mt-16 px-4 pb-14 sm:-mt-[4.5rem] sm:px-6">
      {/* Hilo de luz que baja desde la banda azul hasta las ferias */}
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-7 w-px -translate-x-1/2 -translate-y-full bg-gradient-to-b from-transparent via-[#8ec1ff]/70 to-[#ffd84d]" />

      <div className="ferias-unidas relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] p-[1.5px] shadow-[0_40px_80px_-40px_rgba(6,26,54,.85)]">
        {/* Borde de luz que gira, discreto */}
        <span aria-hidden="true" className="faro-borde absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 opacity-60" />

        <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] bg-[linear-gradient(170deg,#0f4aa8_0%,#0a2f5c_38%,#071f40_70%,#061a36_100%)] text-white">
          {/* Misma textura de puntos y resplandor de la banda: así se leen como una sola cosa */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
          <span aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-[#1d6ff2]/35 blur-3xl" />
          {/* Nodo donde llega el hilo */}
          <span aria-hidden="true" className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffd84d] shadow-[0_0_0_5px_rgb(255_216_77/.2),0_0_18px_4px_rgb(255_216_77/.55)]" />

          <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[0.95fr_1.25fr] lg:gap-10 lg:p-10">
            {/* ---------- Izquierda: el país encendido ---------- */}
            <div className="flex flex-col">
              <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#ffd84d]">
                <span className="relative flex size-2"><span className="absolute inset-0 animate-ping rounded-full bg-[#ffd84d] opacity-75" /><span className="relative size-2 rounded-full bg-[#ffd84d]" /></span>
                Ferias de empleo
                {ferias.length > 0 && <span className="rounded-full bg-[#ffd84d] px-2 py-px text-[10px] tracking-normal text-[#3d2f00]">{ferias.length} {ferias.length === 1 ? "próxima" : "próximas"}</span>}
              </p>
              <h2 id="t-ferias" className="mt-2 text-balance font-display text-[1.7rem] font-extrabold leading-[1.1] sm:text-[2.1rem]">
                Ferias de empleo <span className="bg-gradient-to-r from-[#ffd84d] to-[#8ec1ff] bg-clip-text text-transparent">cerca de ti</span>
              </h2>
              <p className="mt-2 max-w-sm text-sm text-white/75">Fechas, lugares y qué llevar. Cada punto de luz es una feria en el país.</p>

              <Link to="/jornadas" aria-label="Ver el mapa de ferias de empleo" className="group relative mt-5 block overflow-hidden rounded-3xl bg-[radial-gradient(80%_80%_at_50%_45%,#123d7a_0%,#0a2f5c_55%,#061a36_100%)] ring-1 ring-white/10 transition hover:ring-[#ffd84d]/40">
                <span aria-hidden="true" className="faro-destello pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <svg aria-hidden="true" viewBox="160 25 810 565" className="relative h-auto w-full">
                  <g className="faro-puntos">
                    {PUNTOS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4.2} fill="#8ec1ff" opacity={0.45} />)}
                  </g>
                  {faros.map(([x, y], i) => (
                    <path key={`l${i}`} d={`M${HUB[0]},${HUB[1]} Q${(HUB[0] + x) / 2},${Math.min(HUB[1], y) - 70} ${x},${y}`} fill="none" stroke="#ffd84d" strokeWidth={3} strokeLinecap="round" className="ml-linea" opacity={0.7} />
                  ))}
                  {faros.map(([x, y], i) => (
                    <g key={`f${i}`}>
                      <circle cx={x} cy={y} r={10} fill="none" stroke="#ffd84d" strokeWidth={3} className="ml-onda" style={{ animationDelay: `${i * 0.35}s` }} />
                      <circle cx={x} cy={y} r={9} fill="#ffd84d" className="ml-late" style={{ animationDelay: `${i * 0.35}s` }} />
                    </g>
                  ))}
                  <circle cx={HUB[0]} cy={HUB[1]} r={13} fill="#ffffff" />
                  <circle cx={HUB[0]} cy={HUB[1]} r={13} fill="none" stroke="#ffffff" strokeWidth={3} className="ml-onda" />
                </svg>
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#061a36]/80 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15 backdrop-blur">
                  Ver el mapa de ferias <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </div>

            {/* ---------- Derecha: próxima feria + línea de tiempo ---------- */}
            <div className="flex flex-col justify-center">
              {proxima ? (
                <>
                  <Destacada j={proxima} />
                  {siguientes.length > 0 && (
                    <div className="mt-6">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/55">Después</p>
                      <ol className="relative mt-3 space-y-2 before:absolute before:bottom-6 before:left-[1.6rem] before:top-6 before:w-px before:bg-gradient-to-b before:from-[#ffd84d]/70 before:via-[#8ec1ff]/40 before:to-transparent">
                        {siguientes.map((j) => (
                          <li key={j.id}>
                            <Link to="/jornadas/$id" params={{ id: j.id }} className="group relative flex items-center gap-4 rounded-2xl p-2 pr-3 transition hover:bg-white/[0.07]">
                              <span className="relative grid size-[3.2rem] shrink-0 place-items-center rounded-2xl bg-[#061a36] text-center ring-1 ring-white/15 group-hover:ring-[#ffd84d]/50">
                                <span className="leading-none"><span className="block font-display text-lg font-extrabold">{dia(j.fecha)}</span><span className="block text-[10px] font-bold uppercase tracking-wider text-[#8ec1ff]">{mes(j.fecha)}</span></span>
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="line-clamp-2 block font-bold leading-snug">{limpiar(j.titulo)}</span>
                                <span className="mt-0.5 line-clamp-1 flex items-center gap-1 text-xs text-white/65"><MapPin className="size-3 shrink-0" aria-hidden="true" /> {organizadorDe(j)} · {j.provincia}</span>
                              </span>
                              <span className="hidden shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-[#ffd84d] sm:inline">{faltan(j.fecha)}</span>
                            </Link>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10">
                  <p className="font-display text-xl font-extrabold">¿Dónde hay ferias de empleo?</p>
                  <p className="mt-1 text-sm text-white/75">Mapa en vivo con fechas y lugares. Te avisamos cuando haya una cerca.</p>
                  <Link to="/jornadas" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ffd84d] px-5 py-2.5 text-sm font-extrabold text-[#3d2f00]">Ver el mapa <ArrowRight className="size-4" aria-hidden="true" /></Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Destacada({ j }: { j: Jornada }) {
  return (
    <Link to="/jornadas/$id" params={{ id: j.id }} className="group relative block overflow-hidden rounded-3xl bg-white/[0.08] p-5 ring-1 ring-white/15 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.12] hover:ring-[#ffd84d]/50 sm:p-6">
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#ffd84d]/15 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <span className="grid size-[4.2rem] shrink-0 place-items-center rounded-2xl bg-[#ffd84d] text-center text-[#3d2f00] shadow-[0_0_0_6px_rgb(255_216_77/.15)]">
          <span className="leading-none"><span className="block font-display text-2xl font-extrabold">{dia(j.fecha)}</span><span className="block text-[11px] font-extrabold uppercase tracking-wider">{mes(j.fecha)}</span></span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#ffd84d]">
            <CalendarDays className="size-3.5" aria-hidden="true" /> Próxima feria
            <span className="rounded-full bg-white/15 px-2 py-px text-[10px] tracking-normal text-white">{faltan(j.fecha)}</span>
          </p>
          <p className="mt-1.5 line-clamp-2 font-display text-lg font-extrabold leading-snug sm:text-xl">{limpiar(j.titulo)}</p>
          <p className="mt-1 text-sm text-white/80">{organizadorDe(j)}</p>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-white/65"><MapPin className="mt-px size-3.5 shrink-0" aria-hidden="true" /> <span className="line-clamp-2">{j.lugar}, {j.provincia}</span></p>
        </div>
        <span aria-hidden="true" className="hidden size-10 shrink-0 place-items-center self-center rounded-full bg-[#ffd84d] text-[#3d2f00] transition-transform duration-300 group-hover:translate-x-1 sm:grid">
          <ArrowRight className="size-5" />
        </span>
      </div>
    </Link>
  );
}

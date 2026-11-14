import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";

import { faltan, OFICINAS_EMPLEO, organizadorDe, ubicacion, useJornadas } from "@/lib/jornadas";
import { proyectar, RD_MAPA } from "@/lib/rd-mapa";

const HUB = proyectar(18.4861, -69.9312); // Enlace, en Santo Domingo
// Si todavía no hay ferias próximas, el mapa enciende las ciudades donde suele haberlas.
const CIUDADES: [number, number][] = [[19.4517, -70.697], [18.62, -68.45], [19.7934, -70.6884], [18.2085, -71.1008], [18.4273, -68.9728]];
// Un punto de cada dos: el mapa se reconoce igual y pesa la mitad.
const PUNTOS = RD_MAPA.puntos.filter((_, i) => i % 2 === 0);

/**
 * Acceso de la portada a las Ferias de empleo: el país en puntos de luz, faros que laten
 * donde hay ferias y líneas que salen de Enlace hacia cada una. Borde de luz que gira.
 */
export function FeriasFaro({ className = "" }: { className?: string }) {
  const { data } = useJornadas();
  const ferias = data ?? [];
  const proxima = ferias[0];

  const faros = useMemo(() => {
    const desdeFerias = ferias.flatMap((j) => { const u = ubicacion(j); return u ? [proyectar(u[0], u[1])] : []; });
    const base = desdeFerias.length ? desdeFerias : [...CIUDADES, ...OFICINAS_EMPLEO.slice(2).map((o) => o.pos)].map(([la, ln]) => proyectar(la, ln));
    return base.slice(0, 6);
  }, [ferias]);

  const titulo = proxima ? proxima.titulo.replace(/^Feria de empleo:\s*/i, "") : "¿Dónde hay ferias de empleo?";
  const detalle = proxima
    ? `${faltan(proxima.fecha)} · ${proxima.provincia} · ${organizadorDe(proxima)}`
    : "Mapa en vivo con fechas y lugares. Te avisamos cuando haya una cerca.";

  return (
    <Link to="/jornadas" aria-label={proxima ? `Ferias de empleo. Próxima: ${titulo}, ${detalle}` : "Ver las ferias de empleo en el mapa"}
      className={`faro-ferias group relative block max-w-xl overflow-hidden rounded-[1.4rem] p-[1.5px] shadow-[0_24px_50px_-24px_rgba(0,0,0,.8)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd84d]/60 ${className}`}>
      {/* Borde de luz que gira */}
      <span aria-hidden="true" className="faro-borde absolute left-1/2 top-1/2 -z-0 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2" />
      <span className="relative flex items-center gap-3 rounded-[1.32rem] bg-[#061a36]/95 p-2.5 pr-4 sm:gap-4 sm:p-3 sm:pr-5">
        {/* Destello que cruza */}
        <span aria-hidden="true" className="faro-destello pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Mini mapa de luz */}
        <span aria-hidden="true" className="relative grid h-[4.6rem] w-[6.6rem] shrink-0 place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(80%_80%_at_50%_45%,#123d7a_0%,#0a2f5c_55%,#061a36_100%)] ring-1 ring-white/10 sm:h-[5.2rem] sm:w-[7.6rem]">
          <svg viewBox="160 25 810 565" className="h-full w-full">
            <g className="faro-puntos">
              {PUNTOS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4.8} fill="#8ec1ff" opacity={0.5} />)}
            </g>
            {faros.map(([x, y], i) => (
              <path key={`l${i}`} d={`M${HUB[0]},${HUB[1]} Q${(HUB[0] + x) / 2},${Math.min(HUB[1], y) - 70} ${x},${y}`} fill="none" stroke="#ffd84d" strokeWidth={5} strokeLinecap="round" className="ml-linea" opacity={0.75} />
            ))}
            {faros.map(([x, y], i) => (
              <g key={`f${i}`}>
                <circle cx={x} cy={y} r={13} fill="none" stroke="#ffd84d" strokeWidth={5} className="ml-onda" style={{ animationDelay: `${i * 0.35}s` }} />
                <circle cx={x} cy={y} r={12} fill="#ffd84d" className="ml-late" style={{ animationDelay: `${i * 0.35}s` }} />
              </g>
            ))}
            <circle cx={HUB[0]} cy={HUB[1]} r={17} fill="#ffffff" />
            <circle cx={HUB[0]} cy={HUB[1]} r={17} fill="none" stroke="#ffffff" strokeWidth={5} className="ml-onda" />
          </svg>
        </span>

        <span className="relative min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#ffd84d]">
            <span className="relative flex size-2"><span className="absolute inset-0 animate-ping rounded-full bg-[#ffd84d] opacity-75" /><span className="relative size-2 rounded-full bg-[#ffd84d]" /></span>
            Ferias de empleo
            {ferias.length > 0 && <span className="rounded-full bg-[#ffd84d] px-2 py-px text-[10px] tracking-normal text-[#3d2f00]">{ferias.length} {ferias.length === 1 ? "próxima" : "próximas"}</span>}
          </span>
          <span className="mt-1 line-clamp-2 block font-display text-[1.02rem] font-extrabold leading-snug text-white sm:text-lg">{proxima ? `Próxima: ${titulo}` : titulo}</span>
          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-white/75">{detalle}</span>
        </span>

        <span aria-hidden="true" className="relative grid size-10 shrink-0 place-items-center rounded-full bg-[#ffd84d] text-[#3d2f00] shadow-[0_0_0_6px_rgb(255_216_77/.15)] transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110">
          <ArrowRight className="size-5" />
        </span>
      </span>
    </Link>
  );
}

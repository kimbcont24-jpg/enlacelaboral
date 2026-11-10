import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, MapPin, Minimize2, X } from "lucide-react";

import { LOGO_BROCHE, LOGO_CABEZA, LOGO_CUERPO, LOGO_MALETIN, LOGO_VIEWBOX } from "@/components/site/logo-paths";
import { cuandoJornada, diaNum, faltan, mesCorto, OFICINAS_EMPLEO, organizadorDe, ubicacion, type Jornada } from "@/lib/jornadas";
import { proyectar, RD_MAPA } from "@/lib/rd-mapa";

const { ancho: W, alto: H } = RD_MAPA;
const HUB = proyectar(18.4861, -69.9312); // Enlace, en Santo Domingo
const CIUDADES: [string, number, number][] = [
  ["Santo Domingo", 18.4861, -69.9312], ["Santiago", 19.4517, -70.697], ["Punta Cana", 18.58, -68.4], ["Puerto Plata", 19.7934, -70.6884],
  ["La Romana", 18.4273, -68.9728], ["Barahona", 18.2085, -71.1008], ["San Juan", 18.8059, -71.2296], ["Samaná", 19.2058, -69.3369], ["Monte Cristi", 19.8473, -71.6458],
];

type Punto = { j: Jornada; x: number; y: number; estado: "proxima" | "hoy" | "pasada" };

/**
 * Mapa de luz de República Dominicana: el país en puntos, cada feria es un faro
 * enlazado al logo de Enlace con una línea animada. Al elegir una feria el mapa
 * se acerca y abre su tarjeta. No depende de servicios de mapas externos.
 */
export function MapaFerias({ ferias, activa, onElegir, oficinas = true, className = "" }: { ferias: Jornada[]; activa?: string | null; onElegir?: (id: string) => void; oficinas?: boolean; className?: string }) {
  const puntos = useMemo<Punto[]>(() => ferias.flatMap((j) => {
    const u = ubicacion(j);
    if (!u) return [];
    const [x, y] = proyectar(u[0], u[1]);
    return [{ j, x, y, estado: j.pasada ? "pasada" : faltan(j.fecha) === "Hoy" ? "hoy" : "proxima" } as Punto];
  }), [ferias]);

  const sola = puntos.length === 1 && !oficinas;
  const [hover, setHover] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  useEffect(() => { if (activa) setZoom(activa); }, [activa]);
  useEffect(() => { if (sola) setZoom(puntos[0]!.j.id); }, [sola, puntos]);
  const sel = hover ?? zoom;
  const elegido = puntos.find((p) => p.j.id === sel);
  const enfocado = puntos.find((p) => p.j.id === zoom);

  // Brillo de los puntos del mapa alrededor de cada feria.
  const calor = useMemo(() => RD_MAPA.puntos.map(([x, y]) => {
    let c = 0;
    for (const p of puntos) { if (p.estado === "pasada") continue; const d = Math.hypot(x - p.x, y - p.y); if (d < 70) c = Math.max(c, 1 - d / 70); }
    return c;
  }), [puntos]);

  // Acercamiento
  const s = enfocado ? (sola ? 2.6 : 2.2) : 1;
  const tx = enfocado ? W / 2 - enfocado.x * s : 0, ty = enfocado ? H / 2 - enfocado.y * s : 0;
  const pantalla = (x: number, y: number) => [((x * s + tx) / W) * 100, ((y * s + ty) / H) * 100] as const;

  // Inclinación 3D suave con el ratón
  const caja = useRef<HTMLDivElement>(null);
  // En pantallas pequeñas, faros, fechas y nombres se dibujan más grandes para que se lean.
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = caja.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const o = new ResizeObserver(([e]) => { const w = e?.contentRect.width ?? 1000; setK(Math.min(2.4, Math.max(1, 640 / w))); });
    o.observe(el);
    return () => o.disconnect();
  }, []);
  const t = k / s;
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const mover = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !caja.current) return;
    const r = caja.current.getBoundingClientRect();
    setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -5, y: ((e.clientX - r.left) / r.width - 0.5) * 7 });
  };

  const movil = k > 1.3;
  return (
    <div>
    <div ref={caja} onPointerMove={mover} onPointerLeave={() => { setTilt({ x: 0, y: 0 }); if (!movil) setHover(null); }}
      className={`mapa-luz relative isolate overflow-hidden rounded-2xl ${className}`} role="region" aria-label="Mapa de ferias de empleo en República Dominicana">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_50%_45%,#123d7a_0%,#0a2f5c_45%,#061a36_100%)]" />
      <div aria-hidden="true" className="mapa-rejilla absolute inset-0 -z-10 opacity-40" />
      <div className="absolute inset-0 grid place-items-center [perspective:1200px]">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full transition-transform duration-300 ease-out" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
          <defs>
            <radialGradient id="ml-faro"><stop offset="0%" stopColor="#ffd84d" stopOpacity=".9" /><stop offset="100%" stopColor="#ffd84d" stopOpacity="0" /></radialGradient>
            <radialGradient id="ml-faro-azul"><stop offset="0%" stopColor="#5aa2ff" stopOpacity=".9" /><stop offset="100%" stopColor="#5aa2ff" stopOpacity="0" /></radialGradient>
            <linearGradient id="ml-isla" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#1d6ff2" stopOpacity=".22" /><stop offset="100%" stopColor="#7ee2a8" stopOpacity=".12" /></linearGradient>
            <linearGradient id="ml-scan" x1="0" x2="1"><stop offset="0%" stopColor="#8ec1ff" stopOpacity="0" /><stop offset="50%" stopColor="#8ec1ff" stopOpacity=".16" /><stop offset="100%" stopColor="#8ec1ff" stopOpacity="0" /></linearGradient>
            <filter id="ml-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <g style={{ transform: `translate(${tx}px, ${ty}px) scale(${s})`, transition: "transform .9s cubic-bezier(.2,.7,.2,1)" }}>
            <path d={RD_MAPA.haiti} fill="#ffffff" fillOpacity=".03" stroke="#ffffff" strokeOpacity=".1" strokeWidth={1 / s} />
            <path d={RD_MAPA.contorno} fill="url(#ml-isla)" stroke="#8ec1ff" strokeOpacity=".55" strokeWidth={1.4 / s} filter="url(#ml-glow)" />
            {RD_MAPA.puntos.map(([x, y], i) => {
              const c = calor[i]!;
              return <circle key={i} cx={x} cy={y} r={c > 0 ? 2.4 + c * 1.6 : 2.1} fill={c > 0 ? "#ffd84d" : "#8ec1ff"} fillOpacity={c > 0 ? 0.35 + c * 0.6 : 0.32}
                className={i % 7 === 0 ? "ml-titila" : undefined} style={i % 7 === 0 ? { animationDelay: `${(i * 37) % 5000}ms` } : undefined} />;
            })}
            <rect className="ml-scan" x="-200" y="0" width="200" height={H} fill="url(#ml-scan)" />

            {CIUDADES.map(([n, la, lo]) => { const [x, y] = proyectar(la, lo); return <text key={n} x={x + 7 * t} y={y - 6 * t} fontSize={(11 * k) / Math.sqrt(s)} fill="#ffffff" fillOpacity=".45" fontWeight="600" className="pointer-events-none select-none">{n}</text>; })}

            {/* Líneas de enlace: del logo a cada feria */}
            {puntos.map((p) => {
              const mx = (HUB[0] + p.x) / 2, my = Math.min(HUB[1], p.y) - Math.hypot(p.x - HUB[0], p.y - HUB[1]) * 0.28;
              const on = sel === p.j.id;
              return <path key={`l-${p.j.id}`} d={`M${HUB[0]},${HUB[1]} Q${mx},${my} ${p.x},${p.y}`} fill="none"
                stroke={p.estado === "pasada" ? "#9aa7b8" : on ? "#ffd84d" : "#5aa2ff"} strokeOpacity={p.estado === "pasada" ? 0.35 : on ? 1 : 0.7} strokeWidth={(on ? 2.6 : 1.6) / s}
                className={p.estado === "pasada" ? "ml-linea-quieta" : "ml-linea"} />;
            })}

            {oficinas && OFICINAS_EMPLEO.map((o) => { const [x, y] = proyectar(o.pos[0], o.pos[1]); return (
              <g key={o.nombre} transform={`translate(${x},${y})`}>
                <title>{`${o.nombre} · ${o.direccion} (abierta todo el año)`}</title>
                <rect x={-5 * t} y={-5 * t} width={10 * t} height={10 * t} transform="rotate(45)" fill="#ffd84d" stroke="#061a36" strokeWidth={1.5 * t} />
              </g>
            ); })}

            {/* Logo de Enlace en el centro de la red */}
            <g transform={`translate(${HUB[0]},${HUB[1]})`} className="pointer-events-none">
              <circle r={26 * t} fill="url(#ml-faro-azul)" className="ml-late" />
              <circle r={15 * t} fill="#ffffff" />
              <svg x={-11 * t} y={-9 * t} width={22 * t} height={18 * t} viewBox={LOGO_VIEWBOX}>
                <path d={LOGO_CABEZA} fill="#0a2f5c" /><path d={LOGO_CUERPO} fill="#0a2f5c" /><path d={LOGO_MALETIN} fill="#1d6ff2" /><path d={LOGO_BROCHE} fill="#1d6ff2" />
              </svg>
            </g>

            {/* Faros de las ferias */}
            {puntos.map((p) => {
              const on = sel === p.j.id;
              const color = p.estado === "pasada" ? "#9aa7b8" : p.estado === "hoy" ? "#34c77b" : "#ffd84d";
              return (
                <g key={p.j.id} transform={`translate(${p.x},${p.y})`} className="cursor-pointer outline-none" tabIndex={0} role="button"
                  aria-label={`${p.j.titulo}, ${cuandoJornada(p.j)}, ${p.j.lugar}, ${p.j.provincia}`}
                  onPointerEnter={() => setHover(p.j.id)} onFocus={() => setHover(p.j.id)} onBlur={() => setHover(null)}
                  onClick={() => { setZoom(p.j.id); onElegir?.(p.j.id); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setZoom(p.j.id); onElegir?.(p.j.id); } }}>
                  {p.estado !== "pasada" && <circle r={34 * t} fill="url(#ml-faro)" className="ml-late" />}
                  <circle r={(on ? 11 : 8) * t} fill={color} stroke="#061a36" strokeWidth={2.5 * t} style={{ transition: "r .2s" }} />
                  {p.estado !== "pasada" && <circle r={8 * t} fill="none" stroke={color} strokeWidth={2 * t} className="ml-onda" />}
                  <g transform={`translate(0,${-22 * t}) scale(${1 * t})`}>
                    <rect x="-22" y="-13" width="44" height="22" rx="7" fill={p.estado === "pasada" ? "#5d6b7e" : "#ffffff"} />
                    <text y="2.5" textAnchor="middle" fontSize="11" fontWeight="800" fill={p.estado === "pasada" ? "#ffffff" : "#0a2f5c"}>{diaNum(p.j.fecha)} {mesCorto(p.j.fecha).toUpperCase()}</text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Tarjeta de la feria elegida (en escritorio, sobre el mapa) */}
      {elegido && !movil && (() => {
        const [px, py] = pantalla(elegido.x, elegido.y);
        const arriba = py > 45;
        return (
          <div className="vista-entra pointer-events-auto absolute z-10 w-[min(260px,78%)] rounded-2xl bg-white p-4 text-foreground shadow-[0_24px_50px_-18px_rgb(0_0_0/.6)]"
            style={{ left: `clamp(8px, calc(${px}% - 130px), calc(100% - min(260px,78%) - 8px))`, top: arriba ? undefined : `calc(${py}% + 22px)`, bottom: arriba ? `calc(${100 - py}% + 40px)` : undefined }}
            onPointerEnter={() => setHover(elegido.j.id)}>
            <button type="button" aria-label="Cerrar" onClick={() => { setHover(null); setZoom(null); }} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary"><X className="size-4" /></button>
            <p className={`text-[11px] font-extrabold uppercase tracking-wide ${elegido.estado === "pasada" ? "text-muted-foreground" : "text-[#1d6ff2]"}`}>{elegido.estado === "pasada" ? "Ya pasó" : faltan(elegido.j.fecha)}</p>
            <p className="mt-1 pr-6 font-extrabold leading-snug">{elegido.j.titulo}</p>
            <p className="text-sm font-semibold text-muted-foreground">{organizadorDe(elegido.j)}</p>
            <p className="mt-2 flex items-start gap-1.5 text-xs first-letter:uppercase"><CalendarDays className="mt-0.5 size-3.5 shrink-0 text-[#1d6ff2]" />{cuandoJornada(elegido.j)}</p>
            <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0 text-[#1d6ff2]" />{elegido.j.lugar}, {elegido.j.provincia}</p>
            {elegido.j.vacantes ? <p className="mt-1.5 text-xs font-bold text-success">{elegido.j.vacantes.toLocaleString("es-DO")} vacantes</p> : null}
            {!sola && <Link to="/jornadas/$id" params={{ id: elegido.j.id }} className="btn-aplicar mt-3 inline-flex h-9 items-center rounded-lg px-3.5 text-sm">Ver la feria</Link>}
          </div>
        );
      })()}

      {enfocado && !sola && (
        <button type="button" onClick={() => { setZoom(null); setHover(null); }} className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#0a2f5c] shadow backdrop-blur hover:bg-white">
          <Minimize2 className="size-3.5" /> Ver todo el país
        </button>
      )}
      {!puntos.length && (
        <p className="absolute inset-x-0 bottom-4 text-center text-sm font-semibold text-white/80">Aún no hay ferias en el mapa. Los rombos amarillos son las oficinas de empleo, abiertas todo el año.</p>
      )}
    </div>
    {/* En celular, la tarjeta va debajo del mapa */}
    {elegido && movil && !sola && (
      <div className="vista-entra relative mt-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
        <button type="button" aria-label="Cerrar" onClick={() => { setHover(null); setZoom(null); }} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary"><X className="size-4" /></button>
        <p className={`text-[11px] font-extrabold uppercase tracking-wide ${elegido.estado === "pasada" ? "text-muted-foreground" : "text-[#1d6ff2]"}`}>{elegido.estado === "pasada" ? "Ya pasó" : faltan(elegido.j.fecha)}</p>
        <p className="mt-1 pr-8 font-extrabold leading-snug">{elegido.j.titulo}</p>
        <p className="text-sm font-semibold text-muted-foreground">{organizadorDe(elegido.j)}</p>
        <p className="mt-2 flex items-start gap-1.5 text-sm first-letter:uppercase"><CalendarDays className="mt-0.5 size-4 shrink-0 text-[#1d6ff2]" />{cuandoJornada(elegido.j)}</p>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-[#1d6ff2]" />{elegido.j.lugar}, {elegido.j.provincia}</p>
        <Link to="/jornadas/$id" params={{ id: elegido.j.id }} className="btn-aplicar mt-3 inline-flex h-10 items-center rounded-xl px-4 text-sm">Ver la feria</Link>
      </div>
    )}
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, Download, Scale, Share2, ShoppingBasket, Sparkles, Wallet } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { salarioNeto } from "@/lib/calculos";
import {
  CANASTA, HORAS_MES, MINIMOS, MINIMO_GRANDE, MIN_RANGO, pesos, pesosCortos, posicion, resumir,
  type Observacion,
} from "@/lib/radar-salarial";

const AZUL = "#1d6ff2";
const NAVY = "#0a2f5c";
const ORO = "#ffd84d";

const sinMovimiento = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Número que sube hasta su valor la primera vez que aparece en pantalla. */
export function Contador({ valor, formato = (n: number) => Math.round(n).toLocaleString("es-DO"), ms = 1200 }: { valor: number; formato?: (n: number) => string; ms?: number }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const actual = useRef(0);
  const visto = useRef(false);
  useEffect(() => {
    if (sinMovimiento()) { actual.current = valor; setV(valor); return; }
    let raf = 0;
    const el = ref.current;
    // Sube (o baja) desde el número que ya se ve, no desde cero.
    const correr = () => {
      visto.current = true;
      const t0 = performance.now(), desde = actual.current;
      const paso = (t: number) => {
        const p = Math.min(1, (t - t0) / ms);
        actual.current = desde + (valor - desde) * (1 - Math.pow(1 - p, 3));
        setV(actual.current);
        if (p < 1) raf = requestAnimationFrame(paso);
      };
      raf = requestAnimationFrame(paso);
    };
    if (visto.current || !el || typeof IntersectionObserver === "undefined") { correr(); return () => cancelAnimationFrame(raf); }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { correr(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [valor, ms]);
  return <span ref={ref} className="tabular-nums">{formato(v)}</span>;
}

/** 100 puntos: los encendidos son las vacantes que dicen cuánto pagan. */
export function Transparencia({ de100 }: { de100: number }) {
  const [listo, setListo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setListo(true), 300); return () => clearTimeout(t); }, []);
  return (
    <div className="grid grid-cols-10 gap-1" role="img" aria-label={`${de100} de cada 100 vacantes publican el salario`}>
      {Array.from({ length: 100 }, (_, i) => (
        <span key={i} className={`aspect-square rounded-full transition-all duration-500 ${listo && i < de100 ? "scale-110 bg-[#ffd84d] shadow-[0_0_10px_#ffd84d]" : "bg-white/15"}`} style={{ transitionDelay: `${i * 12}ms` }} />
      ))}
    </div>
  );
}

// ---------------- Mapa de salarios ----------------

type Punto = { o: Observacion; x: number; y: number };

/** Cada punto es una vacante real, ubicada según su salario (escala logarítmica). */
export function MapaSalarios({ obs, resaltar, etiquetaResaltado, miSalario }: { obs: Observacion[]; resaltar?: (o: Observacion) => boolean; etiquetaResaltado?: string; miSalario?: number }) {
  const caja = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(0);
  const [activo, setActivo] = useState<Punto | null>(null);
  useLayoutEffect(() => {
    const el = caja.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAncho(el.clientWidth));
    ro.observe(el);
    setAncho(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const movil = ancho < 640;
  const r = movil ? 5 : 7;
  const pad = movil ? 14 : 28;
  const maxV = Math.max(...obs.map((o) => o.valor), miSalario ?? 0, CANASTA.nacional);
  const lo = 14_000, hi = Math.max(80_000, maxV * 1.08);
  const x = (v: number) => pad + ((Math.log(Math.max(v, lo)) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * (ancho - pad * 2);

  const { puntos, alto } = useMemo(() => {
    if (!ancho) return { puntos: [] as Punto[], alto: 160 };
    const colocados: Punto[] = [];
    const d = r * 2 + 2;
    for (const o of [...obs].sort((a, b) => a.valor - b.valor)) {
      const px = x(o.valor);
      for (let k = 0; k < 400; k++) {
        const y = k === 0 ? 0 : Math.ceil(k / 2) * (d * 0.9) * (k % 2 ? -1 : 1);
        if (!colocados.some((p) => Math.abs(p.x - px) < d && Math.hypot(p.x - px, p.y - y) < d)) { colocados.push({ o, x: px, y }); break; }
      }
    }
    const extension = Math.max(40, ...colocados.map((p) => Math.abs(p.y))) + r + 8;
    return { puntos: colocados, alto: extension * 2 + 40 };
  }, [obs, ancho]); // eslint-disable-line react-hooks/exhaustive-deps

  const centro = alto / 2 + 10;
  const ticks = [15_000, 20_000, 30_000, 50_000, 75_000, 100_000, 150_000, 250_000].filter((t) => t >= lo && t <= hi && (!movil || t !== 75_000));
  const referencias = [
    { v: MINIMO_GRANDE, t: "Mínimo gran empresa", c: "#0f7a45" },
    { v: CANASTA.nacional, t: "Canasta familiar", c: "#b4232c" },
    ...(miSalario ? [{ v: miSalario, t: "Tu salario", c: "#7a5a00" }] : []),
  ];
  const hayResaltado = !!resaltar;

  return (
    <figure className="relative">
      <div ref={caja} className="relative w-full" onMouseLeave={() => setActivo(null)}>
        {ancho > 0 && (
          <svg width={ancho} height={alto + 26} role="img" aria-label={`${obs.length} salarios publicados, cada punto es una vacante`} className="block overflow-visible">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={6} y2={alto + 4} stroke="var(--border)" strokeDasharray="2 4" />
                <text x={x(t)} y={alto + 20} textAnchor="middle" className="fill-muted-foreground text-[11px] tabular-nums">{pesosCortos(t).replace("RD$", "")}</text>
              </g>
            ))}
            {referencias.map((ref, i) => (
              <g key={ref.t}>
                <line x1={x(ref.v)} x2={x(ref.v)} y1={20 + i * 0} y2={alto + 4} stroke={ref.c} strokeWidth={2} strokeDasharray={ref.t === "Tu salario" ? "6 4" : undefined} />
              </g>
            ))}
            {puntos.map((p) => {
              const on = !hayResaltado || resaltar!(p.o);
              const sel = activo?.o.id === p.o.id;
              return (
                <circle
                  key={p.o.id}
                  cx={p.x}
                  cy={centro + p.y}
                  r={sel ? r + 3 : r}
                  fill={on ? (p.o.fuente === "texto" ? "#5b8fe8" : AZUL) : "var(--muted-foreground)"}
                  fillOpacity={on ? 0.9 : 0.18}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  className="cursor-pointer transition-[r] duration-150"
                  onMouseEnter={() => setActivo(p)}
                  onClick={() => setActivo(p)}
                />
              );
            })}
          </svg>
        )}
        {/* Etiquetas de las líneas de referencia, en HTML para que no choquen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0">
          {referencias.map((ref, i) => ancho > 0 && (
            <span key={ref.t} className="absolute whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white shadow" style={{ background: ref.c, top: i * 22 - 8, left: Math.min(Math.max(x(ref.v), 50), ancho - 50), transform: "translateX(-50%)" }}>
              {ref.t} {pesosCortos(ref.v)}
            </span>
          ))}
        </div>
        {activo && (
          <div className="absolute z-10 w-64 max-w-[85vw] rounded-2xl border border-border bg-surface p-3 text-sm shadow-xl" style={{ left: Math.min(Math.max(activo.x - 128, 0), Math.max(0, ancho - 256)), top: Math.min(centro + activo.y + 14, alto - 20) }}>
            <p className="font-extrabold leading-snug">{activo.o.titulo}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{activo.o.area} · {activo.o.provincia}</p>
            <p className="mt-1.5 text-lg font-extrabold tabular-nums">{activo.o.salarioMax ? `${pesos(activo.o.salarioMin)} – ${pesos(activo.o.salarioMax)}` : pesos(activo.o.salarioMin)}</p>
            {activo.o.fuente === "texto" && <p className="text-xs text-muted-foreground">Monto tomado del texto de la vacante</p>}
            <Link to="/vacantes/$id" params={{ id: activo.o.id }} className="pointer-events-auto mt-2 inline-flex items-center gap-1 font-bold text-primary hover:underline">Ver la vacante <ArrowRight className="size-3.5" /></Link>
          </div>
        )}
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#1d6ff2]" /> {etiquetaResaltado ?? "Cada punto es una vacante"}</span>
        {hayResaltado && <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-muted-foreground/30" /> Las demás vacantes</span>}
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-0.5 bg-[#0f7a45]" /> Salario mínimo de una gran empresa</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-0.5 bg-[#b4232c]" /> Canasta familiar nacional (un hogar)</span>
        <span>Toca un punto para ver la vacante</span>
      </figcaption>
    </figure>
  );
}

// ---------------- Termómetro de tu salario ----------------

const RAPIDOS = [18_000, 25_000, 30_000, 40_000, 60_000];

export function Termometro({ salario, onSalario, comparables, etiqueta }: { salario: number; onSalario: (n: number) => void; comparables: Observacion[]; etiqueta: string }) {
  const [txt, setTxt] = useState(salario ? salario.toLocaleString("es-DO") : "");
  const r = useMemo(() => resumir(comparables), [comparables]);
  const conPosicion = !!r && r.n >= MIN_RANGO;
  const de10 = salario && r && conPosicion ? posicion(salario, r) : null;
  const neto = salario ? salarioNeto(salario) : null;
  const canasta = salario ? salario / CANASTA.nacional : 0;

  const cambiar = (v: string) => {
    const n = Math.min(2_000_000, Number(v.replace(/\D/g, "")) || 0);
    setTxt(n ? n.toLocaleString("es-DO") : "");
    onSalario(n);
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_30px_60px_-40px_rgb(10_47_92/0.5)]">
      <div className="hero-dark relative px-5 py-7 text-white sm:px-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ffd84d]"><Sparkles className="size-3.5" aria-hidden="true" /> Termómetro salarial</p>
        <h2 id="termometro" className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">¿Tu salario está bien pagado?</h2>
        <p className="mt-1 max-w-xl text-white/75">Escribe tu salario o el que te ofrecieron. Lo comparamos con lo que se publica, con la ley y con lo que cuesta vivir.</p>
        <label className="mt-5 flex h-16 max-w-md items-center gap-2 rounded-2xl bg-white px-4 text-foreground focus-within:ring-4 focus-within:ring-[#ffd84d]/60">
          <span className="text-lg font-extrabold text-muted-foreground">RD$</span>
          <span className="sr-only">Salario mensual bruto</span>
          <input inputMode="numeric" autoComplete="off" value={txt} onChange={(e) => cambiar(e.target.value)} placeholder="35,000" className="h-full w-full bg-transparent text-2xl font-extrabold tabular-nums outline-none placeholder:text-muted-foreground/50" />
          <span className="shrink-0 text-sm text-muted-foreground">al mes</span>
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {RAPIDOS.map((n) => <button key={n} type="button" onClick={() => cambiar(String(n))} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/20">{pesosCortos(n)}</button>)}
        </div>
      </div>

      {!salario ? (
        <p className="px-5 py-8 text-center text-muted-foreground sm:px-8">Escribe un monto para ver tu resultado.</p>
      ) : (
        <div className="grid gap-px bg-border sm:grid-cols-2" aria-live="polite">
          {/* 1. Frente al mercado publicado */}
          <div className="bg-surface p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Frente a lo que se publica</p>
            {de10 !== null ? (
              <>
                <Medidor de10={de10} />
                <p className="-mt-2 text-center text-lg font-extrabold leading-snug">Paga más que <span className="text-primary">{de10} de cada 10</span> {etiqueta}</p>
                <p className="mt-1 text-center text-xs text-muted-foreground">Comparado con {r!.n} vacantes · mediana {pesos(r!.mediana)}</p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Todavía hay pocas vacantes con salario para comparar {etiqueta} ({r?.n ?? 0}). Quita el filtro o busca un puesto más general.</p>
            )}
          </div>

          {/* 2. Frente a la ley */}
          <div className="bg-surface p-5 sm:p-7">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Scale className="size-3.5" aria-hidden="true" /> Frente al salario mínimo</p>
            <EscaleraMinimos salario={salario} />
          </div>

          {/* 3. Lo que te llega */}
          <div className="bg-surface p-5 sm:p-7">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Wallet className="size-3.5" aria-hidden="true" /> Lo que te llega al bolsillo</p>
            <p className="mt-3 text-4xl font-extrabold tracking-tight tabular-nums text-[#0f7a45]"><Contador valor={neto!.neto} formato={pesos} ms={700} /></p>
            <p className="text-sm text-muted-foreground">al mes · {pesos(neto!.neto / 2)} por quincena</p>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <span className="bg-[#0f7a45]" style={{ width: `${neto!.porcentaje * 100}%` }} />
              <span className="bg-[#e0a800]" style={{ width: `${((neto!.afp + neto!.sfs) / salario) * 100}%` }} />
              <span className="bg-[#b4232c]" style={{ width: `${(neto!.isr / salario) * 100}%` }} />
            </div>
            <ul className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <li><span className="block font-bold tabular-nums">{pesos(neto!.afp)}</span><span className="text-muted-foreground">AFP</span></li>
              <li><span className="block font-bold tabular-nums">{pesos(neto!.sfs)}</span><span className="text-muted-foreground">SFS</span></li>
              <li><span className="block font-bold tabular-nums">{pesos(neto!.isr)}</span><span className="text-muted-foreground">ISR</span></li>
            </ul>
            <p className="mt-3 text-sm">Equivale a <b className="tabular-nums">{pesos(salario / HORAS_MES)}</b> por hora trabajada <span className="text-muted-foreground">(jornada de 44 horas)</span>.</p>
            <Link to="/herramientas/salario-neto" search={{ bruto: salario }} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"><Calculator className="size-4" /> Ver el cálculo completo</Link>
          </div>

          {/* 4. Costo de vida */}
          <div className="bg-surface p-5 sm:p-7">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground"><ShoppingBasket className="size-3.5" aria-hidden="true" /> Frente al costo de vida</p>
            <p className="mt-3 text-4xl font-extrabold tracking-tight tabular-nums"><Contador valor={canasta * 100} formato={(n) => `${Math.round(n)}%`} ms={700} /></p>
            <p className="text-sm text-muted-foreground">de la canasta familiar nacional ({pesos(CANASTA.nacional)})</p>
            <div className="relative mt-4 h-3 rounded-full bg-muted" aria-hidden="true">
              <span className={`absolute inset-y-0 left-0 rounded-full ${canasta >= 1 ? "bg-[#0f7a45]" : "bg-[#e0a800]"}`} style={{ width: `${Math.min(100, canasta * 100)}%` }} />
            </div>
            <p className="mt-3 text-sm">{canasta >= 1 ? "Este salario solo cubre el gasto completo de un hogar promedio." : `Para cubrir la canasta de un hogar haría falta ${canasta >= 0.5 ? "un segundo ingreso" : "más de un ingreso adicional"}.`} En el Gran Santo Domingo la canasta sube a {pesos(CANASTA.ozama)} ({Math.round((salario / CANASTA.ozama) * 100)}%).</p>
            <p className="mt-2 text-xs text-muted-foreground">La canasta es el gasto de un hogar completo, no de una persona. Banco Central, {CANASTA.mesNacional}.</p>
          </div>
        </div>
      )}

      {!!salario && <Compartir de10={de10} canasta={canasta} etiqueta={etiqueta} />}
    </div>
  );
}

/** Medio círculo que se llena según cuántas vacantes de cada 10 pagan menos. */
function Medidor({ de10 }: { de10: number }) {
  const [p, setP] = useState(0);
  useEffect(() => { const t = setTimeout(() => setP(de10 / 10), 60); return () => clearTimeout(t); }, [de10]);
  const R = 80, L = Math.PI * R;
  const ang = Math.PI * (1 - p);
  return (
    <svg viewBox="0 0 200 120" className="mx-auto mt-2 w-full max-w-[240px]" aria-hidden="true">
      <defs><linearGradient id="medidor" x1="0" x2="1"><stop offset="0" stopColor="#e0a800" /><stop offset="1" stopColor={AZUL} /></linearGradient></defs>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--muted)" strokeWidth={16} strokeLinecap="round" />
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#medidor)" strokeWidth={16} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} style={{ transition: sinMovimiento() ? undefined : "stroke-dashoffset 900ms cubic-bezier(.16,1,.3,1)" }} />
      <circle cx={100 + R * Math.cos(ang)} cy={100 - R * Math.sin(ang)} r={9} fill={NAVY} stroke="white" strokeWidth={3} style={{ transition: sinMovimiento() ? undefined : "all 900ms cubic-bezier(.16,1,.3,1)" }} />
      <text x={100} y={92} textAnchor="middle" className="fill-foreground text-[34px] font-extrabold">{de10}/10</text>
    </svg>
  );
}

function EscaleraMinimos({ salario }: { salario: number }) {
  const cumple = MINIMOS.filter((m) => salario >= m.v);
  const top = MINIMOS[MINIMOS.length - 1]!.v;
  const pct = ((salario - top) / top) * 100;
  const mensaje = salario >= top
    ? <>Está <b>{Math.round(pct)}% por encima</b> del salario mínimo más alto del sector privado (gran empresa).</>
    : cumple.length === 0
      ? <><b>Está por debajo de todos los salarios mínimos.</b> Si es un empleo formal de tiempo completo, pregunta antes de aceptar.</>
      : <>Cumple el mínimo de una <b>{cumple[cumple.length - 1]!.t.toLowerCase()}</b>, pero no el de una {MINIMOS[cumple.length]!.t.toLowerCase()}. Pregunta qué tamaño tiene la empresa.</>;
  return (
    <>
      <ol className="mt-4 space-y-1.5">
        {[...MINIMOS].reverse().map((m) => {
          const ok = salario >= m.v;
          return (
            <li key={m.t} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${ok ? "bg-[#dcf5e8] text-[#0b5a33]" : "bg-muted text-muted-foreground"}`}>
              <span className="font-semibold">{ok ? "✓" : "·"} {m.t}</span>
              <span className="tabular-nums">{pesos(m.v)}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm">{mensaje}</p>
      <p className="mt-1 text-xs text-muted-foreground">Sector privado no sectorizado, vigente desde febrero 2026 (Resolución CNS-01-2025). Zonas francas, hoteles y otros sectores tienen tarifas propias.</p>
    </>
  );
}

// ---------------- Tarjeta para compartir ----------------

function Compartir({ de10, canasta, etiqueta }: { de10: number | null; canasta: number; etiqueta: string }) {
  const [estado, setEstado] = useState<"" | "creando" | "listo">("");
  const titulo = de10 !== null ? `${de10} de cada 10` : `${Math.round(canasta * 100)}%`;
  const linea = de10 !== null ? `Mi salario paga más que ${de10} de cada 10 ${etiqueta}.` : `Mi salario cubre el ${Math.round(canasta * 100)}% de la canasta familiar.`;

  const crear = async () => {
    setEstado("creando");
    const blob = await tarjeta(titulo, de10 !== null ? `vacantes publicadas pagan menos que mi salario` : "de la canasta familiar cubre mi salario");
    const archivo = new File([blob], "mi-radar-salarial.png", { type: "image/png" });
    const url = `${window.location.origin}/salarios`;
    const texto = `${linea} ¿Y el tuyo? Compáralo gratis en el Radar salarial de Enlace Laboral: ${url}`;
    try {
      if (navigator.canShare?.({ files: [archivo] })) { await navigator.share({ files: [archivo], text: texto }); setEstado("listo"); return; }
    } catch { /* la persona canceló */ setEstado(""); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = archivo.name;
    a.click();
    setEstado("listo");
  };
  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${linea} ¿Y el tuyo? Compáralo gratis: ${window.location.origin}/salarios`)}`, "_blank", "noopener");

  return (
    <div className="flex flex-col items-start gap-3 border-t border-border bg-[#fff8dc] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <p className="text-sm text-[#5c4700]"><b>Comparte tu resultado sin decir cuánto ganas.</b> La tarjeta solo muestra tu posición, nunca el monto.</p>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={() => void crear()} disabled={estado === "creando"} className="inline-flex items-center gap-2 rounded-xl bg-[#0a2f5c] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#123f78] disabled:opacity-60">
          {estado === "creando" ? "Creando…" : <><Download className="size-4" aria-hidden="true" /> Tarjeta para historias</>}
        </button>
        <button type="button" onClick={whatsapp} className="inline-flex items-center gap-2 rounded-xl bg-[#1fa855] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#178a45]"><Share2 className="size-4" aria-hidden="true" /> WhatsApp</button>
      </div>
    </div>
  );
}

/** Imagen 1080×1920 para estados e historias. */
async function tarjeta(grande: string, texto: string): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1920;
  const g = c.getContext("2d")!;
  const fuente = getComputedStyle(document.body).fontFamily || "sans-serif";
  const fondo = g.createLinearGradient(0, 0, 1080, 1920);
  fondo.addColorStop(0, "#07213f"); fondo.addColorStop(1, "#0f4aa8");
  g.fillStyle = fondo; g.fillRect(0, 0, 1080, 1920);
  // ondas de radar
  g.strokeStyle = "rgba(255,216,77,.18)"; g.lineWidth = 3;
  for (const rr of [220, 380, 540, 700]) { g.beginPath(); g.arc(900, 360, rr, 0, Math.PI * 2); g.stroke(); }
  // puntos
  for (let i = 0; i < 60; i++) { g.fillStyle = i % 7 === 0 ? ORO : "rgba(255,255,255,.25)"; g.beginPath(); g.arc(120 + ((i * 97) % 840), 1380 + ((i * 53) % 260), i % 7 === 0 ? 12 : 9, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = ORO; g.font = `800 44px ${fuente}`; g.fillText("RADAR SALARIAL DOMINICANO", 90, 260);
  g.fillStyle = "#fff"; g.font = `800 230px ${fuente}`; g.fillText(grande, 80, 760);
  g.font = `700 64px ${fuente}`;
  envolver(g, texto, 90, 880, 900, 80);
  g.fillStyle = "rgba(255,255,255,.75)"; g.font = `500 46px ${fuente}`;
  envolver(g, "¿Y el tuyo? Compáralo gratis con los salarios reales que publican las empresas.", 90, 1180, 900, 62);
  g.fillStyle = ORO; g.beginPath(); g.roundRect(90, 1700, 900, 120, 60); g.fill();
  g.fillStyle = NAVY; g.font = `800 50px ${fuente}`; g.textAlign = "center";
  g.fillText("enlace-rd.vercel.app/salarios", 540, 1778);
  return new Promise((ok) => c.toBlob((b) => ok(b!), "image/png"));
}

function envolver(g: CanvasRenderingContext2D, texto: string, x: number, y: number, max: number, alto: number) {
  let linea = "";
  for (const p of texto.split(" ")) {
    const prueba = linea ? `${linea} ${p}` : p;
    if (g.measureText(prueba).width > max && linea) { g.fillText(linea, x, y); linea = p; y += alto; } else linea = prueba;
  }
  if (linea) g.fillText(linea, x, y);
}

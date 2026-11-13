import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Brain, Check, Copy, Eye, Lock, MapPin, MessageCircleQuestion, Mic, Sparkles, TrendingUp, Wifi } from "lucide-react";
import { toast } from "sonner";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { Estrellas } from "@/components/empresa/Estrellas";
import { CATEGORIAS, useCalificaciones, type OpinionesEmpresa } from "@/lib/opiniones";
import { preguntasParaHacer, type Radiografia } from "@/lib/perfil-empresa";
import { pesosCortos, pesos } from "@/lib/radar-salarial";
import { proyectar, RD_MAPA } from "@/lib/rd-mapa";

// ── Utilidades de movimiento ─────────────────────────────────────────

/** Se activa la primera vez que el elemento entra en pantalla. */
export function useVisto<T extends Element>(umbral = 0.25) {
  const ref = useRef<T>(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setVisto(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setVisto(true); io.disconnect(); } }, { threshold: umbral });
    io.observe(el);
    return () => io.disconnect();
  }, [umbral]);
  return [ref, visto] as const;
}

/** Número que cuenta hasta su valor cuando aparece. */
export function Contador({ a, sufijo = "", ms = 1100 }: { a: number; sufijo?: string; ms?: number }) {
  const [ref, visto] = useVisto<HTMLSpanElement>(0.4);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!visto) return;
    let raf = 0; const t0 = performance.now();
    const paso = (t: number) => { const p = Math.min(1, (t - t0) / ms); setN(Math.round(a * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(paso); };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [visto, a, ms]);
  return <span ref={ref} className="tabular-nums">{visto ? n : a}{sufijo}</span>;
}

/** Bloque que entra suave al bajar. Sale visible del servidor; solo se oculta lo que está más abajo de la pantalla. */
export function Aparece({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [oculto, setOculto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setOculto(true);
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setOculto(false); io.disconnect(); } }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <section id={id} ref={ref} className={`scroll-mt-32 transition-[opacity,transform] duration-700 ease-out ${oculto ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"} ${className}`}>{children}</section>;
}

function Titulo({ chip, t, d, I }: { chip: string; t: string; d?: string; I: typeof Eye }) {
  return (
    <div className="mb-5">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-[#1d6ff2]/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1557c4]"><I className="size-3.5" /> {chip}</p>
      <h2 className="mt-2 font-display text-xl font-bold tracking-tight md:text-2xl">{t}</h2>
      {d && <p className="mt-1.5 max-w-2xl text-[15px] text-muted-foreground">{d}</p>}
    </div>
  );
}

const tarjeta = "rounded-3xl border border-border bg-surface p-6 md:p-7";

// ── Índice de transparencia ──────────────────────────────────────────

const tonoDe = (n: number) => (n >= 80 ? { c: "#0f7a43", t: "Muy clara" } : n >= 60 ? { c: "#1d6ff2", t: "Clara" } : n >= 40 ? { c: "#f5a700", t: "A medias" } : { c: "#c2410c", t: "Poco clara" });

export function Anillo({ valor, size = 148, grosor = 14, children }: { valor: number; size?: number; grosor?: number; children?: ReactNode }) {
  const [ref, visto] = useVisto<SVGSVGElement>(0.4);
  const r = (size - grosor) / 2, c = 2 * Math.PI * r, { c: color } = tonoDe(valor);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7ebf2" strokeWidth={grosor} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={visto ? c * (1 - valor / 100) : c} style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1)" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Transparencia({ r, nombre }: { r: Radiografia; nombre: string }) {
  const t = r.transparencia;
  if (!t) return null;
  const tono = tonoDe(t.puntaje);
  const criterios = [...t.criterios].sort((a, b) => b.pct - a.pct);
  return (
    <Aparece id="transparencia" className={tarjeta}>
      <Titulo I={Eye} chip="Índice de transparencia Enlace" t="¿Qué tan claras son sus vacantes?" d="Medimos si cada vacante dice el sueldo, los requisitos, las funciones y cómo aplicar. Saber lo que te espera baja la ansiedad de aplicar a ciegas." />
      <div className="grid items-center gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col items-center">
          <Anillo valor={t.puntaje}>
            <div><p className="font-display text-4xl font-bold leading-none" style={{ color: tono.c }}><Contador a={t.puntaje} /></p><p className="mt-1 text-xs font-bold text-muted-foreground">de 100</p></div>
          </Anillo>
          <p className="mt-3 rounded-full px-3 py-1 text-sm font-extrabold" style={{ color: tono.c, backgroundColor: `${tono.c}14` }}>{tono.t}</p>
        </div>
        <div>
          {t.percentil != null && (
            <p className="mb-4 rounded-2xl bg-[#0a2f5c] p-4 text-[15px] text-white">
              {t.percentil >= 50
                ? <>Las vacantes de {nombre} son <b className="text-[#ffd166]">más claras que las del {t.percentil}%</b> de las {t.empresas} empresas que publican en Enlace.</>
                : <>El {100 - t.percentil}% de las {t.empresas} empresas en Enlace publica vacantes más completas. <span className="text-white/75">Si te llaman, pregunta lo que falta.</span></>}
            </p>
          )}
          <ul className="space-y-2.5">
            {criterios.map((c) => (
              <li key={c.t} className="grid grid-cols-[minmax(0,1fr)_7rem_2.75rem] items-center gap-3 text-sm">
                <span className="flex items-center gap-1.5 font-semibold">{c.pct === 100 ? <Check className="size-4 shrink-0 text-[#0f7a43]" /> : <span className="size-4 shrink-0" />}{c.t}</span>
                <span className="h-2 overflow-hidden rounded-full bg-[#e7ebf2]"><Barra pct={c.pct} color={c.pct >= 70 ? "#0f7a43" : c.pct >= 40 ? "#f5a700" : "#c2410c"} /></span>
                <span className="text-right text-xs font-bold tabular-nums text-muted-foreground">{c.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Aparece>
  );
}

function Barra({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const [ref, visto] = useVisto<HTMLSpanElement>(0.3);
  return <span ref={ref} className="block h-full rounded-full" style={{ width: visto ? `${pct}%` : "0%", backgroundColor: color, transition: `width 1s cubic-bezier(.16,1,.3,1) ${delay}ms` }} />;
}

// ── Lo que paga ──────────────────────────────────────────────────────

export function Salarios({ r }: { r: Radiografia }) {
  if (!r.total) return null;
  const s = r.salarios;
  if (!s.length) {
    return (
      <Aparece id="salarios" className={tarjeta}>
        <Titulo I={TrendingUp} chip="Lo que paga" t="Todavía no publica sueldos" d="Ninguna de sus vacantes abiertas dice cuánto paga. Te dejamos lo que suelen pagar puestos parecidos en el Radar salarial." />
        <Link to="/salarios" className="inline-flex items-center gap-1.5 font-bold text-[#1557c4] hover:underline">Ver el Radar salarial <ArrowRight className="size-4" /></Link>
      </Aparece>
    );
  }
  const tope = Math.max(...s.map((x) => Math.max(x.max ?? x.min, x.mercado ?? 0))) * 1.08;
  const x = (n: number) => `${(n / tope) * 100}%`;
  return (
    <Aparece id="salarios" className={tarjeta}>
      <Titulo I={TrendingUp} chip="Lo que paga" t="Sus sueldos frente al mercado" d="Cada barra es el rango que publicó la empresa. El punto es lo que pagan puestos parecidos en otras vacantes de Enlace." />
      {r.conMercado >= 2 && (
        <p className="mb-5 flex items-center gap-3 rounded-2xl bg-[#0f7a43]/[0.07] p-4 text-[15px]">
          <span className="font-display text-2xl font-bold text-[#0f7a43]">{r.sobreMercado}/{r.conMercado}</span>
          <span>puestos pagan <b>igual o más</b> que la mitad de las vacantes parecidas.</span>
        </p>
      )}
      <ul className="space-y-4">
        {s.map((p, i) => (
          <li key={p.id}>
            <div className="flex items-baseline justify-between gap-3 text-sm"><Link to="/vacantes/$id" params={{ id: p.id }} className="min-w-0 truncate font-bold hover:underline">{p.titulo}</Link><span className="shrink-0 font-extrabold tabular-nums">{p.max ? `${pesosCortos(p.min)}–${pesosCortos(p.max)}` : pesos(p.min)}</span></div>
            <div className="relative mt-2 h-3 rounded-full bg-[#eef2f8]">
              <SalarioBarra left={x(p.min)} width={p.max ? `${((p.max - p.min) / tope) * 100}%` : "0.6rem"} delay={i * 80} />
              {p.mercado && <span title={`Mercado: ${pesos(p.mercado)} (${p.nMercado} vacantes)`} className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#0a2f5c] shadow" style={{ left: x(p.mercado) }} />}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-5 rounded-full bg-gradient-to-r from-[#1d6ff2] to-[#4fa3ff]" /> Lo que ofrece la empresa</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#0a2f5c]" /> Mediana de puestos parecidos</span>
        <Link to="/salarios" className="font-bold text-[#1557c4] hover:underline">Radar salarial →</Link>
      </p>
    </Aparece>
  );
}

function SalarioBarra({ left, width, delay }: { left: string; width: string; delay: number }) {
  const [ref, visto] = useVisto<HTMLSpanElement>(0.3);
  return <span ref={ref} className="absolute inset-y-0 min-w-[0.6rem] origin-left rounded-full bg-gradient-to-r from-[#1d6ff2] to-[#4fa3ff]" style={{ left, width, transform: visto ? "scaleX(1)" : "scaleX(0)", transition: `transform .9s cubic-bezier(.16,1,.3,1) ${delay}ms` }} />;
}

// ── Mapa: dónde contrata ─────────────────────────────────────────────

export function MapaContrata({ r }: { r: Radiografia }) {
  const [sel, setSel] = useState<string | null>(null);
  // En el celular el mapa se ve pequeño: burbujas y números más grandes para que se lean.
  const [k, setK] = useState(1);
  useEffect(() => { const f = () => setK(window.innerWidth < 640 ? 1.7 : 1); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  if (!r.provincias.length && !r.remoto) return null;
  const W = RD_MAPA.ancho;
  const pts = r.provincias.map((p) => { const [x, y] = proyectar(p.lat, p.lng); return { ...p, x, y }; }).sort((a, b) => b.n - a.n); // las pequeñas quedan encima
  const maxN = Math.max(1, ...pts.map((p) => p.n));
  const calor = RD_MAPA.puntos.map(([x, y]) => { let c = 0; for (const p of pts) { const d = Math.hypot(x - p.x, y - p.y); const rad = 55 + (p.n / maxN) * 60; if (d < rad) c = Math.max(c, 1 - d / rad); } return c; });
  const activo = pts.find((p) => p.nombre === sel);
  const VX = 180, VY = 20, VW = W - 180, VH = 450; // solo República Dominicana
  return (
    <Aparece id="mapa" className="overflow-hidden rounded-3xl bg-[#071d3a] p-6 text-white md:p-7">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#8ec1ff]"><MapPin className="size-3.5" /> Dónde contrata</p>
      <h2 className="mt-2 font-display text-xl font-bold tracking-tight md:text-2xl">{r.provincias.length === 1 ? `Contrata en ${r.provincias[0]!.nombre.replace(/\s*\(.*\)/, "")}` : `Contrata en ${r.provincias.length} provincias`}</h2>
      <div className="relative mt-4">
        <svg viewBox={`${VX} ${VY} ${VW} ${VH}`} className="w-full" role="img" aria-label={`Mapa con las provincias donde contrata: ${r.provincias.map((p) => `${p.nombre} (${p.n})`).join(", ")}`}>
          <path d={RD_MAPA.contorno} fill="#0d2a52" opacity=".55" />
          {RD_MAPA.puntos.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.2 + calor[i]! * 2.2} fill={calor[i]! > 0 ? "#4fa3ff" : "#ffffff"} opacity={calor[i]! > 0 ? 0.25 + calor[i]! * 0.75 : 0.09} />)}
          {pts.map((p) => {
            const rr = (15 + (p.n / maxN) * 14) * k;
            return (
              <g key={p.nombre} className="cursor-pointer" onMouseEnter={() => setSel(p.nombre)} onMouseLeave={() => setSel(null)} onClick={() => setSel(p.nombre)}>
                <circle cx={p.x} cy={p.y} r={rr} fill="#ffd166" opacity=".25"><animate attributeName="r" values={`${rr};${rr * 2.1};${rr}`} dur="2.8s" repeatCount="indefinite" /><animate attributeName="opacity" values=".35;0;.35" dur="2.8s" repeatCount="indefinite" /></circle>
                <circle cx={p.x} cy={p.y} r={rr} fill="#ffd166" stroke="#071d3a" strokeWidth="3" />
                <text x={p.x} y={p.y + 7 * k} textAnchor="middle" fontSize={19 * k} fontWeight="800" fill="#071d3a">{p.n}</text>
              </g>
            );
          })}
        </svg>
        {activo && (
          <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#0a2f5c] shadow-xl" style={{ left: `${((activo.x - VX) / VW) * 100}%`, top: `${((activo.y - VY) / VH) * 100 - 6}%` }}>
            {activo.nombre}: {activo.n} {activo.n === 1 ? "vacante" : "vacantes"}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {r.provincias.map((p) => <span key={p.nombre} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{p.nombre} · {p.n}</span>)}
        {r.remoto > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#ffd166] px-3 py-1 text-xs font-extrabold text-[#071d3a]"><Wifi className="size-3.5" /> {r.remoto} remota{r.remoto === 1 ? "" : "s"}</span>}
      </div>
    </Aparece>
  );
}

// ── ADN de sus vacantes ──────────────────────────────────────────────

export function ADN({ r }: { r: Radiografia }) {
  if (!r.total) return null;
  const maxSem = Math.max(1, ...r.semanas);
  const pctSinExp = Math.round((r.sinExperiencia / r.total) * 100);
  const COL = ["#1d6ff2", "#0f7a43", "#f5a700", "#5b2a86", "#0b6e7a", "#a1274a"];
  return (
    <Aparece id="adn" className={tarjeta}>
      <Titulo I={Sparkles} chip="ADN de sus vacantes" t="A quién busca y cómo contrata" d="Lo que tienen en común sus vacantes de los últimos 30 días." />
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-sm font-bold">Áreas donde más contrata</p>
          <div className="mt-3 flex h-4 overflow-hidden rounded-full">
            {r.areas.map((a, i) => <span key={a.t} title={`${a.t}: ${a.n}`} style={{ width: `${(a.n / r.total) * 100}%`, backgroundColor: COL[i % COL.length] }} />)}
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {r.areas.map((a, i) => <li key={a.t} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: COL[i % COL.length] }} /><span className="flex-1">{a.t}</span><b className="tabular-nums">{a.n}</b></li>)}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold">Ritmo de publicación</p>
          <div className="mt-3 flex h-28 items-end gap-2.5">
            {r.semanas.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-xs font-extrabold tabular-nums">{n}</span>
                <Columna pct={(n / maxSem) * 100} actual={i === 3} delay={i * 90} />
                <span className="text-[11px] font-semibold text-muted-foreground">{i === 3 ? "Esta sem." : `Hace ${3 - i}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-secondary/60 p-4"><p className="text-xs font-semibold text-muted-foreground">Sin experiencia</p><p className="mt-1 font-display text-2xl font-bold"><Contador a={pctSinExp} sufijo="%" /></p><p className="text-xs text-muted-foreground">{pctSinExp >= 30 ? "Abre puertas al primer empleo" : "Suele pedir experiencia"}</p></div>
        <div className="rounded-2xl bg-secondary/60 p-4"><p className="text-xs font-semibold text-muted-foreground">Nivel más buscado</p><p className="mt-1 text-lg font-extrabold leading-tight">{r.niveles[0]?.t ?? "–"}</p><p className="text-xs text-muted-foreground">{r.niveles.slice(1, 3).map((n) => n.t).join(" · ")}</p></div>
        <div className="rounded-2xl bg-secondary/60 p-4"><p className="text-xs font-semibold text-muted-foreground">Modalidad</p><p className="mt-1 text-lg font-extrabold leading-tight">{r.modalidades[0]?.t ?? "–"}</p><p className="text-xs text-muted-foreground">{r.modalidades.map((m) => `${m.t} ${Math.round((m.n / r.total) * 100)}%`).join(" · ")}</p></div>
      </div>

      {r.habilidades.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-bold">Lo que más pide</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.habilidades.map((h, i) => (
              <span key={h.t} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-semibold" style={{ backgroundColor: i < 3 ? "#1d6ff214" : undefined, borderColor: i < 3 ? "#1d6ff255" : undefined }}>
                {h.t}<span className="rounded-full bg-[#0a2f5c] px-1.5 text-[11px] font-extrabold text-white">{h.n}</span>
              </span>
            ))}
          </div>
          {r.habilidades.some((h) => /Excel|Office|Servicio|caja/i.test(h.t)) && (
            <Link to="/insignias" className="mt-4 flex items-center gap-3 rounded-2xl border border-[#5B39F9]/25 bg-[#5B39F9]/[0.06] p-4 text-sm hover:bg-[#5B39F9]/10">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#5B39F9] text-white"><Brain className="size-5" /></span>
              <span className="flex-1"><b>Demuéstralo antes de aplicar.</b> Saca tu insignia verificada con Perfila y sale en tu CV.</span>
              <ArrowRight className="size-4 text-[#5B39F9]" />
            </Link>
          )}
        </div>
      )}
    </Aparece>
  );
}

function Columna({ pct, actual, delay }: { pct: number; actual: boolean; delay: number }) {
  const [ref, visto] = useVisto<HTMLSpanElement>(0.3);
  return (
    <span ref={ref} className="flex h-20 w-full items-end">
      <span className={`w-full rounded-t-lg ${actual ? "bg-gradient-to-t from-[#1d6ff2] to-[#4fa3ff]" : "bg-[#c9d6ea]"}`} style={{ height: visto ? `${Math.max(6, pct)}%` : "0%", transition: `height .9s cubic-bezier(.16,1,.3,1) ${delay}ms` }} />
    </span>
  );
}

// ── Clima laboral (radar) ────────────────────────────────────────────

export function Clima({ o, onOpinar }: { o: OpinionesEmpresa | undefined; onOpinar: () => void }) {
  const res = o?.resumen.trabajo;
  const cats = CATEGORIAS.trabajo;
  const valores = res?.categorias ? cats.map((c) => res.categorias?.[c.k] ?? null) : null;
  const listo = !!valores && valores.filter((x) => x != null).length >= 3;
  const total = res?.total ?? 0, faltan = Math.max(0, 5 - total);
  const demo = [4.2, 3.4, 3.9, 4.5, 3.1, 4.0];
  const vals = listo ? valores!.map((x) => x ?? 0) : demo;
  const N = cats.length, C = 150, R = 100;
  const CORTO: Record<string, string> = { pago: "Pago a tiempo", tss: "Ley y TSS", horario: "Horario", trato: "Trato", crecimiento: "Crecimiento", ambiente: "Ambiente" };
  const punto = (i: number, v: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / N, rr = (Math.max(0, v - 1) / 4) * R; return [C + rr * Math.cos(a), C + rr * Math.sin(a)] as const; };
  const [ref, visto] = useVisto<SVGSVGElement>(0.3);
  const poly = vals.map((v, i) => punto(i, visto ? v : 1).join(",")).join(" ");
  const mejor = listo ? cats.map((c, i) => ({ t: c.t, v: valores![i] })).filter((x) => x.v != null).sort((a, b) => b.v! - a.v!) : [];
  return (
    <Aparece id="clima" className={tarjeta}>
      <Titulo I={Brain} chip="Clima laboral" t="Cómo se siente trabajar aquí" d="El perfil que dibujan quienes trabajan o trabajaron en la empresa, en seis aspectos que pesan en tu bienestar." />
      <div className="grid items-center gap-6 md:grid-cols-[300px_minmax(0,1fr)]">
        <div className="relative mx-auto w-full max-w-[300px]">
          <svg ref={ref} viewBox="-45 -5 390 310" className={`w-full ${listo ? "" : "blur-[3px]"}`} aria-hidden={!listo} role={listo ? "img" : undefined} aria-label={listo ? mejor.map((m) => `${m.t}: ${m.v!.toFixed(1)}`).join(", ") : undefined}>
            {[1, 2, 3, 4].map((k) => <polygon key={k} points={cats.map((_, i) => punto(i, 1 + k).join(",")).join(" ")} fill="none" stroke="#dbe3ef" strokeWidth="1" />)}
            {cats.map((_, i) => { const [x, y] = punto(i, 5); return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="#dbe3ef" />; })}
            <polygon points={poly} fill="#1d6ff2" fillOpacity=".22" stroke="#1d6ff2" strokeWidth="2.5" strokeLinejoin="round" style={{ transition: "all 1.2s cubic-bezier(.16,1,.3,1)" }} />
            {vals.map((v, i) => { const [x, y] = punto(i, visto ? v : 1); return <circle key={i} cx={x} cy={y} r="4.5" fill="#fff" stroke="#1d6ff2" strokeWidth="2.5" style={{ transition: "all 1.2s cubic-bezier(.16,1,.3,1)" }} />; })}
            {cats.map((c, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / N; const x = C + (R + 14) * Math.cos(a), y = C + (R + 16) * Math.sin(a); return <text key={c.k} x={x} y={y} textAnchor={Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end"} dominantBaseline="middle" fontSize="13" fontWeight="700" fill="#4a5568">{CORTO[c.k] ?? c.t}</text>; })}
          </svg>
          {!listo && <div className="absolute inset-0 grid place-items-center"><span className="grid size-14 place-items-center rounded-full bg-white shadow-lg"><Lock className="size-6 text-[#0a2f5c]" /></span></div>}
        </div>
        {listo ? (
          <div>
            <p className="text-sm font-bold text-[#0f7a43]">Lo mejor valorado</p>
            <p className="text-lg font-extrabold">{mejor[0]!.t} · {mejor[0]!.v!.toFixed(1)}</p>
            <p className="mt-3 text-sm font-bold text-[#b45309]">Lo que más le cuesta</p>
            <p className="text-lg font-extrabold">{mejor[mejor.length - 1]!.t} · {mejor[mejor.length - 1]!.v!.toFixed(1)}</p>
            <p className="mt-3 text-sm text-muted-foreground">De 1 a 5, según {total} opiniones verificadas.</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-extrabold">{faltan > 0 ? `Se desbloquea con ${faltan} ${faltan === 1 ? "opinión más" : "opiniones más"}` : "Falta que califiquen los aspectos"}</p>
            <p className="mt-1 text-[15px] text-muted-foreground">Esperamos a tener al menos 5 opiniones para que el retrato sea justo. Tu experiencia puede ser la que lo complete.</p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e7ebf2]"><Barra pct={(Math.min(total, 5) / 5) * 100} color="#1d6ff2" /></div>
            <p className="mt-1.5 text-xs font-bold text-muted-foreground">{Math.min(total, 5)} de 5 opiniones</p>
            <button type="button" onClick={onOpinar} className="btn-aplicar mt-4 inline-flex h-11 items-center gap-2 rounded-full px-5">Contar cómo es trabajar aquí</button>
          </div>
        )}
      </div>
    </Aparece>
  );
}

// ── Prepárate para aplicar ───────────────────────────────────────────

export function Preparate({ r, o, nombre }: { r: Radiografia; o: OpinionesEmpresa | undefined; nombre: string }) {
  const qs = preguntasParaHacer(r, o);
  const [abierta, setAbierta] = useState<number | null>(0);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(`Preguntas para mi entrevista en ${nombre}:\n\n${qs.map((q, i) => `${i + 1}. ${q.p}`).join("\n")}\n\nDe Enlace Laboral`); toast.success("Preguntas copiadas: pégalas en tus notas"); } catch { /* sin portapapeles */ }
  };
  return (
    <Aparece id="preparate" className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#fff8e6] via-surface to-[#eef5ff] p-6 md:p-7">
      <div aria-hidden="true" className="absolute -right-16 -top-16 size-56 rounded-full bg-[#f5a700] opacity-15 blur-3xl" />
      <Titulo I={MessageCircleQuestion} chip="Prepárate para tu entrevista" t={`Lo que te conviene preguntarle a ${nombre}`} d="La entrevista es de ida y vuelta. Preguntar con seguridad te da información y le muestra a la empresa que vas en serio." />
      <ol className="relative space-y-2">
        {qs.map((q, i) => (
          <li key={q.p} className="rounded-2xl border border-border bg-white/80 backdrop-blur">
            <button type="button" onClick={() => setAbierta(abierta === i ? null : i)} aria-expanded={abierta === i} className="flex w-full items-center gap-3 p-4 text-left">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#0a2f5c] font-display text-sm font-bold text-white">{i + 1}</span>
              <span className="flex-1 font-bold">{q.p}</span>
            </button>
            {abierta === i && <p className="-mt-1 px-4 pb-4 pl-[3.75rem] text-sm text-muted-foreground">Por qué: {q.por}</p>}
          </li>
        ))}
      </ol>
      <div className="relative mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => void copiar()} className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white px-5 font-bold hover:bg-secondary"><Copy className="size-4" /> Copiar preguntas</button>
        <Link to="/cv" search={{ h: "entrevista" }} className="btn-aplicar inline-flex h-11 items-center gap-2 rounded-full px-5"><Mic className="size-4" /> Practicar mi entrevista</Link>
      </div>
    </Aparece>
  );
}

// ── Empresas parecidas ───────────────────────────────────────────────

export function Parecidas({ r }: { r: Radiografia }) {
  const { data: cal } = useCalificaciones(r.parecidas.map((p) => p.slug));
  if (!r.parecidas.length) return null;
  return (
    <Aparece id="parecidas">
      <h2 className="font-display text-xl font-bold tracking-tight">Empresas que contratan en lo mismo</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {r.parecidas.map((p) => {
          const c = cal?.[p.slug];
          const tono = tonoDe(p.claridad);
          return (
            <Link key={p.slug} to="/empresa/$id" params={{ id: p.slug }} className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <EmpresaAvatar nombre={p.nombre} className="size-12 text-xl" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold group-hover:underline">{p.nombre}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {p.total} {p.total === 1 ? "vacante" : "vacantes"}
                  {c ? <span className="inline-flex items-center gap-1"><Estrellas valor={c.promedio} size={11} /> {c.promedio.toFixed(1)}</span> : null}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-center rounded-2xl px-3 py-1.5 leading-none" style={{ color: tono.c, backgroundColor: `${tono.c}14` }} title="Índice de transparencia de sus vacantes"><b className="text-base font-extrabold">{p.claridad}</b><span className="mt-0.5 text-[10px] font-bold">claridad</span></span>
            </Link>
          );
        })}
      </div>
    </Aparece>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import {
  ArrowRight, BadgeCheck, Briefcase, Building2, Calculator, Clock, Cpu, Crown, Factory, HeartPulse, Headphones, LayoutGrid, List,
  MapPin, Palmtree, Search, Settings, Share2, Sparkles, TrendingUp, Truck, Users, Utensils, Wallet, Wrench, X,
} from "lucide-react";
import { toast } from "sonner";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { provincias } from "@/lib/data";
import { directorioEmpresas, FILTROS, letraDe, ORDENES, ordenar, pasaFiltro, sinAcentos, type FilaDirectorio } from "@/lib/directorio-empresas";
import { NOMBRE_SELLO } from "@/lib/motivar-empresas";
import { fetchPublicadas, hace, SITIO } from "@/lib/vacantes";

type Busqueda = { q?: string; area?: string; provincia?: string; f?: string; orden?: string; vista?: string; letra?: string };
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined);
const PROVINCIAS = provincias.slice(1).map((p) => p.replace(/\s*\(.*?\)\s*/g, "").trim()).filter((p) => !/^remoto/i.test(p));
const LETRAS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];
const POR_PAGINA = 36;
const money = (n: number) => `RD$${n.toLocaleString("es-DO")}`;

const ICONO_AREA: [RegExp, typeof Briefcase, string][] = [
  [/salud|enfermer|m[eé]dic/i, HeartPulse, "#e11d48"],
  [/hotel|turismo/i, Palmtree, "#0891b2"],
  [/gastronom|cocina|restaur/i, Utensils, "#ea580c"],
  [/tecnolog|sistemas|inform/i, Cpu, "#7c3aed"],
  [/venta|comercial/i, TrendingUp, "#16a34a"],
  [/servicio al cliente|atenci[oó]n/i, Headphones, "#0284c7"],
  [/log[ií]stica|almac|transport/i, Truck, "#ca8a04"],
  [/producci[oó]n|manufactura|planta/i, Factory, "#475569"],
  [/contab|finanz/i, Calculator, "#0f766e"],
  [/recursos humanos|gesti[oó]n humana/i, Users, "#db2777"],
  [/operaci/i, Settings, "#4f46e5"],
  [/manten|t[eé]cnic|limpieza|servicios generales/i, Wrench, "#b45309"],
];
const iconoArea = (a: string) => ICONO_AREA.find(([r]) => r.test(a)) ?? ([/./, Briefcase, "#1d6ff2"] as const);

export const Route = createFileRoute("/empresas-contratando")({
  validateSearch: (s: Record<string, unknown>): Busqueda => ({
    q: str(s["q"]), area: str(s["area"]), provincia: str(s["provincia"]), f: str(s["f"]), orden: str(s["orden"]), vista: str(s["vista"]),
    letra: (() => { const l = str(s["letra"])?.toUpperCase(); return l && LETRAS.includes(l) ? l : undefined; })(),
  }),
  loader: async () => {
    const jobs = await fetchPublicadas().catch(() => []);
    const filas = directorioEmpresas(jobs);
    return {
      filas,
      vacantes: filas.reduce((s, f) => s + f.vacantes, 0),
      nuevas: filas.filter((f) => f.nuevas > 0).length,
      conSueldo: filas.filter((f) => f.conSueldo > 0).length,
    };
  },
  head: ({ loaderData }) => {
    const n = loaderData?.filas.length ?? 0;
    const title = `${n ? `${n} empresas` : "Empresas"} contratando en República Dominicana | Enlace Laboral`;
    const desc = "Directorio de las empresas dominicanas con vacantes abiertas hoy en Enlace Laboral. Búscalas por nombre, letra, área o provincia y mira cuáles dicen el sueldo.";
    return {
      meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }],
      links: [{ rel: "canonical", href: `${SITIO}/empresas-contratando` }],
    };
  },
  component: Directorio,
});

/* ───────── Efectos: aparecer al bajar, motor de scroll y número que cuenta ───────── */

function useEfectos(raiz: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = raiz.current;
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("dir-anim");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    const observar = () => root.querySelectorAll(".dir-reveal:not(.is-in)").forEach((el) => io.observe(el));
    observar();
    const mo = new MutationObserver(observar);
    mo.observe(root, { childList: true, subtree: true });

    let raf = 0;
    const draw = () => {
      raf = 0;
      const vh = innerHeight;
      for (const el of root.querySelectorAll<HTMLElement>("[data-scrub]")) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        el.style.setProperty("--p", Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.7))).toFixed(3));
      }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(draw); };
    draw();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { io.disconnect(); mo.disconnect(); removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, [raiz]);
}

function Cuenta({ n }: { n: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.textContent = "0";
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => { const k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(n * (1 - (1 - k) ** 3)).toLocaleString("es-DO"); if (k < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); el.textContent = n.toLocaleString("es-DO"); };
  }, [n]);
  return <span ref={ref}>{n.toLocaleString("es-DO")}</span>;
}

const inclinar = (e: RPointerEvent<HTMLElement>) => {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget, r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--ry", `${(x - 0.5) * 7}deg`); el.style.setProperty("--rx", `${(0.5 - y) * 7}deg`);
  el.style.setProperty("--gx", `${x * 100}%`); el.style.setProperty("--gy", `${y * 100}%`);
};
const soltar = (e: RPointerEvent<HTMLElement>) => { e.currentTarget.style.setProperty("--rx", "0deg"); e.currentTarget.style.setProperty("--ry", "0deg"); };

/* ───────── Página ───────── */

function Directorio() {
  const d = Route.useLoaderData();
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/empresas-contratando" });
  const raiz = useRef<HTMLDivElement>(null);
  const portada = useRef<HTMLElement>(null);
  const directorio = useRef<HTMLElement>(null);
  const [texto, setTexto] = useState(s.q ?? "");
  const [visibles, setVisibles] = useState(POR_PAGINA);
  useEfectos(raiz);

  const orden = s.orden ?? (s.letra ? "az" : "vacantes");
  const vista = s.vista === "lista" ? "lista" : "tarjetas";
  const filtro = s.f ?? "";

  const poner = (cambios: Partial<Busqueda>, bajar = false) => {
    setVisibles(POR_PAGINA);
    void navigate({ search: (prev: Busqueda) => { const n = { ...prev, ...cambios }; for (const k of Object.keys(n) as (keyof Busqueda)[]) if (!n[k]) delete n[k]; return n; }, replace: true, resetScroll: false });
    if (bajar) requestAnimationFrame(() => directorio.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  useEffect(() => {
    const t = setTimeout(() => { if ((s.q ?? "") !== texto.trim()) poner({ q: texto.trim() || undefined }); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  // Profundidad con el cursor en la portada (solo con mouse).
  const mover = (e: RPointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || !portada.current) return;
    const r = portada.current.getBoundingClientRect();
    portada.current.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    portada.current.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };

  const areasTodas = useMemo(() => { const m = new Map<string, number>(); for (const f of d.filas) for (const a of f.areas) m.set(a, (m.get(a) ?? 0) + 1); return [...m.entries()].filter(([a]) => a && a !== "Otros").sort((a, b) => b[1] - a[1]); }, [d.filas]);
  const conteoProv = useMemo(() => { const m = new Map<string, number>(); for (const f of d.filas) for (const p of f.provincias) m.set(p, (m.get(p) ?? 0) + 1); return m; }, [d.filas]);
  const conteoFiltro = useMemo(() => Object.fromEntries(FILTROS.map((x) => [x.id, d.filas.filter((f) => pasaFiltro(f, x.id)).length])), [d.filas]);
  const top = useMemo(() => ordenar(d.filas, "vacantes").slice(0, 8), [d.filas]);
  const recientes = useMemo(() => ordenar(d.filas.filter((f) => f.nuevas > 0), "recientes").slice(0, 24), [d.filas]);

  // Todo menos la letra: así el índice A–Z sabe cuántas hay en cada letra con los demás filtros puestos.
  const sinLetra = useMemo(() => {
    const q = sinAcentos(texto.trim());
    return d.filas.filter((f) =>
      pasaFiltro(f, filtro)
      && (!s.area || f.areas.includes(s.area))
      && (!s.provincia || f.provincias.includes(s.provincia))
      && (!q || sinAcentos(`${f.nombre} ${f.puestos.join(" ")} ${f.areas.join(" ")}`).includes(q)),
    );
  }, [d.filas, texto, filtro, s.area, s.provincia]);
  const porLetra = useMemo(() => { const m = new Map<string, number>(); for (const f of sinLetra) { const l = letraDe(f.nombre); m.set(l, (m.get(l) ?? 0) + 1); } return m; }, [sinLetra]);
  const resultado = useMemo(() => ordenar(s.letra ? sinLetra.filter((f) => letraDe(f.nombre) === s.letra) : sinLetra, orden), [sinLetra, s.letra, orden]);

  const hayFiltros = Boolean(texto.trim() || filtro || s.area || s.provincia || s.letra);
  const elegirLetra = (l: string) => poner({ letra: s.letra === l ? undefined : l }, true);
  const limpiar = () => { setTexto(""); setVisibles(POR_PAGINA); void navigate({ search: (p: Busqueda) => (p.vista ? { vista: p.vista } : {}), replace: true, resetScroll: false }); };

  const compartir = async () => {
    const url = typeof window !== "undefined" ? window.location.href : `${SITIO}/empresas-contratando`;
    const t = `Estas son las ${d.filas.length} empresas que están contratando ahora en República Dominicana.`;
    try {
      if (navigator.share) await navigator.share({ title: "Empresas contratando | Enlace Laboral", text: t, url });
      else { await navigator.clipboard.writeText(`${t} ${url}`); toast.success("Enlace copiado"); }
    } catch { /* cancelado */ }
  };

  const mostradas = resultado.slice(0, visibles);
  const claveRejilla = `${s.letra ?? ""}|${filtro}|${s.area ?? ""}|${s.provincia ?? ""}|${orden}|${vista}|${s.q ?? ""}`;

  return (
    <div ref={raiz} className="min-h-screen overflow-x-clip bg-[#f3f6fb] text-foreground">
      <Header />

      {/* 1. PORTADA — entrada en cascada, manchas de luz, números que cuentan y constelación con profundidad */}
      <section ref={portada} onPointerMove={mover} className="relative overflow-hidden bg-[#071f3d] text-white">
        <div aria-hidden="true" className="dir-blob absolute -left-32 -top-32 size-[28rem] rounded-full bg-[#1d6ff2] opacity-50 blur-[110px]" />
        <div aria-hidden="true" className="dir-blob absolute -bottom-40 right-[-6rem] size-[30rem] rounded-full bg-[#14b8a6] opacity-30 blur-[110px] [animation-delay:-6s]" />
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <nav aria-label="Ruta" className="dir-up text-sm text-white/60"><Link to="/" className="hover:text-white">Inicio</Link> › <span className="text-white/90">Empresas</span></nav>
            <p className="dir-up mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider ring-1 ring-white/15 [animation-delay:.08s]">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#4ade80] opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-[#4ade80]" /></span>
              En vivo: vacantes de hoy
            </p>
            <h1 className="dir-up mt-4 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl [animation-delay:.16s]">
              Empresas que están <span className="bg-gradient-to-r from-[#ffd84d] via-[#7dd3fc] to-[#5eead4] bg-clip-text text-transparent">contratando ahora</span>
            </h1>
            <p className="dir-up mt-4 max-w-xl text-lg text-white/80 [animation-delay:.26s]">Encuentra la empresa donde te ves trabajando, mira qué está buscando y aplica directo. Enfocar tu energía donde sí hay oportunidades baja la ansiedad de buscar empleo.</p>

            <label className="dir-up mt-7 flex h-14 max-w-xl items-center gap-3 rounded-2xl bg-white px-4 text-foreground shadow-[0_20px_45px_-20px_rgb(0_0_0/0.7)] ring-2 ring-transparent focus-within:ring-[#ffd84d] [animation-delay:.36s]">
              <Search className="size-5 shrink-0 text-[#1557c4]" aria-hidden="true" />
              <span className="sr-only">Buscar empresa</span>
              <input value={texto} onChange={(e) => { setTexto(e.target.value); setVisibles(POR_PAGINA); }} onKeyDown={(e) => { if (e.key === "Enter") directorio.current?.scrollIntoView({ behavior: "smooth" }); }} placeholder="Busca por empresa, puesto o área…" className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" type="search" autoComplete="off" enterKeyHint="search" />
              {texto && <button type="button" onClick={() => setTexto("")} aria-label="Borrar búsqueda" className="grid size-8 place-items-center rounded-full hover:bg-secondary"><X className="size-4" /></button>}
            </label>

            <dl className="dir-up mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4 [animation-delay:.46s]">
              {([[d.filas.length, "empresas", ""], [d.vacantes, "vacantes", ""], [d.nuevas, "nuevas esta semana", "nuevas"], [d.conSueldo, "dicen el sueldo", "sueldo"]] as const).map(([n, t, f]) => (
                <button key={t} type="button" disabled={!f} onClick={() => f && poner({ f: filtro === f ? undefined : f }, true)} className={`rounded-2xl px-4 py-3 text-left ring-1 ring-white/10 backdrop-blur transition-colors ${f ? "hover:bg-white/20" : "cursor-default"} ${filtro && filtro === f ? "bg-white text-[#0a2f5c]" : "bg-white/[0.08]"}`}>
                  <dd className="font-display text-2xl font-bold tabular-nums md:text-3xl"><Cuenta n={n} /></dd>
                  <dt className={`text-xs font-semibold ${filtro && filtro === f ? "text-[#0a2f5c]/70" : "text-white/70"}`}>{t}</dt>
                </button>
              ))}
            </dl>
          </div>

          {/* Constelación: las que más contratan orbitando alrededor del total de vacantes */}
          {top.length >= 4 && (
            <div aria-label="Las empresas con más vacantes" className="relative mx-auto hidden aspect-square w-full max-w-[30rem] lg:block">
              <div className="dir-depth absolute inset-0">
                <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 size-full">
                  <g className="dir-orbit" style={{ transformOrigin: "50px 50px" }}>
                    <circle cx="50" cy="50" r="38" fill="none" stroke="white" strokeOpacity=".18" strokeWidth=".3" strokeDasharray="1 1.6" />
                  </g>
                  <circle cx="50" cy="50" r="24" fill="none" stroke="white" strokeOpacity=".1" strokeWidth=".3" />
                </svg>
                <div className="absolute left-1/2 top-1/2 grid size-40 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/[0.07] text-center ring-1 ring-white/15 backdrop-blur">
                  <div>
                    <p className="font-display text-5xl font-bold tabular-nums"><Cuenta n={d.vacantes} /></p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/70">vacantes abiertas</p>
                  </div>
                </div>
                {top.map((f, i) => {
                  const a = (i / top.length) * Math.PI * 2 - Math.PI / 2;
                  const style = { left: `${50 + Math.cos(a) * 38}%`, top: `${50 + Math.sin(a) * 38}%`, animationDelay: `${0.5 + i * 0.12}s, ${1.2 + i * 0.4}s` } as CSSProperties;
                  return (
                    <Link key={f.slug} to="/empresa/$id" params={{ id: f.slug }} style={{ left: style.left, top: style.top }} className="group absolute -translate-x-1/2 -translate-y-1/2" title={`${f.nombre}: ${f.vacantes} vacantes`}>
                      <span className="dir-pop relative block" style={{ animationDelay: style.animationDelay }}>
                        <EmpresaAvatar nombre={f.nombre} claro className="size-14 text-2xl ring-4 ring-white/10 transition-transform group-hover:scale-110" />
                        <span className="absolute -right-2 -top-2 rounded-full bg-[#ffd84d] px-1.5 py-0.5 text-[11px] font-extrabold tabular-nums text-[#0a2f5c] shadow">{f.vacantes}</span>
                      </span>
                      <span className="pointer-events-none absolute left-1/2 top-full mt-2 w-28 -translate-x-1/2 truncate rounded-lg bg-[#0a2f5c]/80 px-2 py-1 text-center text-[11px] font-bold text-white/90 ring-1 ring-white/10 backdrop-blur transition-colors group-hover:bg-white group-hover:text-[#0a2f5c]">{f.nombre}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. CINTA — las que publicaron esta semana pasan sin parar (se pausa con el cursor) */}
      {recientes.length > 3 && (
        <section aria-label="Empresas que publicaron esta semana" className="border-b border-border bg-white py-4">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6">
            <p className="hidden shrink-0 text-xs font-extrabold uppercase tracking-wider text-[#166534] sm:block"><span className="mr-1.5 inline-block size-2 rounded-full bg-[#16a34a]" />Publicaron<br />esta semana</p>
            <div className="dir-marquee min-w-0 flex-1">
              <ul>
                {[...recientes, ...recientes].map((f, i) => (
                  <li key={`${f.slug}-${i}`} aria-hidden={i >= recientes.length || undefined} className="pr-3">
                    <Link to="/empresa/$id" params={{ id: f.slug }} tabIndex={i >= recientes.length ? -1 : undefined} className="flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-[#f7f9fc] py-1.5 pl-1.5 pr-3.5 text-sm font-semibold hover:border-[#16a34a] hover:text-[#166534]">
                      <EmpresaAvatar nombre={f.nombre} className="size-7 rounded-full text-xs" />
                      {f.nombre}
                      <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-extrabold text-[#166534]">+{f.nuevas}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 3. PODIO — las 3 que más contratan; las cartas se reparten al bajar */}
      {top.length >= 3 && !hayFiltros && (
        <section aria-labelledby="t-podio" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <div className="dir-reveal flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#d97706]">Las que más contratan</p>
              <h2 id="t-podio" className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">Donde hay más puertas abiertas hoy</h2>
            </div>
            <button type="button" onClick={() => poner({ orden: undefined }, true)} className="text-sm font-bold text-[#1557c4] hover:underline">Ver el directorio completo ↓</button>
          </div>
          <ol data-scrub className="dir-deal mt-6 grid gap-4 md:grid-cols-3">
            {top.slice(0, 3).map((f, i) => {
              const medalla = ["#f5a700", "#94a3b8", "#c2783a"][i]!;
              return (
                <li key={f.slug} style={{ "--k": i - 1, zIndex: i === 1 ? 2 : 1 } as CSSProperties} className="relative">
                  <Link to="/empresa/$id" params={{ id: f.slug }} className="group relative block h-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a2f5c] to-[#123f78] p-6 text-white shadow-[0_30px_60px_-30px_rgb(10_47_92/0.8)]">
                    <span aria-hidden="true" className="absolute -right-6 -top-10 font-display text-[9rem] font-bold leading-none text-white/[0.06]">{i + 1}</span>
                    <div className="relative flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full font-display font-extrabold text-[#0a2f5c]" style={{ background: medalla }}>{i === 0 ? <Crown className="size-5" /> : i + 1}</span>
                      <EmpresaAvatar nombre={f.nombre} claro className="size-12 text-xl" />
                    </div>
                    <h3 className="relative mt-4 line-clamp-2 font-display text-xl font-bold">{f.nombre}</h3>
                    <p className="relative mt-1 text-sm text-white/70">{f.areas.slice(0, 2).join(" · ")}{f.provincias[0] ? ` · ${f.provincias[0]}` : ""}</p>
                    <p className="relative mt-5 flex items-baseline gap-2"><span className="font-display text-5xl font-bold tabular-nums">{f.vacantes}</span><span className="text-sm font-semibold text-white/70">vacantes abiertas</span></p>
                    <p className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#ffd84d] group-hover:underline">Conocer la empresa <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></p>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* 4. MOSAICO DE ÁREAS — cortina de color que se levanta; un clic filtra el directorio */}
      {areasTodas.length > 3 && (
        <section aria-labelledby="t-areas" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <div className="dir-reveal">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#1557c4]">Explora por área</p>
            <h2 id="t-areas" className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">¿En qué te ves trabajando?</h2>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {areasTodas.slice(0, 12).map(([a, n], i) => {
              const [, Icono, color] = iconoArea(a);
              const activa = s.area === a;
              return (
                <li key={a} style={{ "--c": color, "--d": `${(i % 6) * 70}ms` } as CSSProperties} className="dir-reveal dir-wipe rounded-2xl">
                  <button type="button" onClick={() => poner({ area: activa ? undefined : a }, true)} aria-pressed={activa}
                    className={`group flex h-full w-full flex-col items-start rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${activa ? "border-transparent text-white" : "border-border bg-white hover:shadow-[0_18px_30px_-22px_rgb(10_47_92/0.6)]"}`}
                    style={activa ? { background: color } : undefined}>
                    <span className="grid size-10 place-items-center rounded-xl transition-transform group-hover:rotate-[-8deg] group-hover:scale-110" style={{ background: activa ? "rgb(255 255 255 / .2)" : `${color}18`, color: activa ? "#fff" : color }}><Icono className="size-5" /></span>
                    <span className="mt-3 line-clamp-2 text-sm font-bold leading-snug">{a}</span>
                    <span className={`mt-1 text-xs font-semibold ${activa ? "text-white/80" : "text-muted-foreground"}`}>{n} {n === 1 ? "empresa" : "empresas"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 5. DIRECTORIO */}
      <section ref={directorio} id="directorio" aria-labelledby="t-dir" className="scroll-mt-16 pt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 id="t-dir" className="dir-reveal font-display text-2xl font-bold tracking-tight md:text-3xl">Todas las empresas, de la A a la Z</h2>
        </div>

        {/* Barra fija: filtros + letras */}
        <div className="sticky top-16 z-20 mt-4 overflow-x-clip border-y border-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
              {FILTROS.filter((x) => x.id === "" || conteoFiltro[x.id]).map((x) => (
                <button key={x.id || "todas"} type="button" aria-pressed={filtro === x.id} onClick={() => poner({ f: x.id || undefined })}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors ${filtro === x.id ? "border-[#1d6ff2] bg-[#1d6ff2] text-white" : "border-border bg-white hover:border-[#1d6ff2] hover:text-[#1557c4]"}`}>
                  {x.t}<span className={`text-xs tabular-nums ${filtro === x.id ? "text-white/80" : "text-muted-foreground"}`}>{conteoFiltro[x.id]}</span>
                </button>
              ))}
            </div>
            <div className="-mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              <Selector etiqueta="Área" valor={s.area ?? ""} onChange={(v) => poner({ area: v || undefined })} opciones={areasTodas.map(([a, n]) => [a, `${a} (${n})`])} todas="Todas las áreas" />
              <Selector etiqueta="Provincia" valor={s.provincia ?? ""} onChange={(v) => poner({ provincia: v || undefined })} opciones={PROVINCIAS.filter((p) => conteoProv.get(p)).map((p) => [p, `${p} (${conteoProv.get(p)})`])} todas="Todo el país" />
              <Selector etiqueta="Ordenar" valor={orden} onChange={(v) => poner({ orden: v })} opciones={ORDENES.map((o) => [o.id, o.t])} />
              <div className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-border bg-white p-1" role="group" aria-label="Forma de ver">
                <button type="button" aria-pressed={vista === "tarjetas"} onClick={() => poner({ vista: undefined })} className={`grid size-8 place-items-center rounded-full ${vista === "tarjetas" ? "bg-[#0a2f5c] text-white" : "text-muted-foreground hover:text-foreground"}`} title="Ver en tarjetas"><LayoutGrid className="size-4" /><span className="sr-only">Tarjetas</span></button>
                <button type="button" aria-pressed={vista === "lista"} onClick={() => poner({ vista: "lista" })} className={`grid size-8 place-items-center rounded-full ${vista === "lista" ? "bg-[#0a2f5c] text-white" : "text-muted-foreground hover:text-foreground"}`} title="Ver en lista"><List className="size-4" /><span className="sr-only">Lista</span></button>
              </div>
            </div>
            {/* Índice A–Z: cada letra muestra SOLO las empresas que empiezan con ella */}
            <nav aria-label="Filtrar por letra" className="-mx-4 mt-2 flex items-center gap-1 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:justify-between">
              <button type="button" onClick={() => poner({ letra: undefined })} aria-pressed={!s.letra} className={`h-8 shrink-0 rounded-lg px-2.5 text-xs font-extrabold uppercase tracking-wider ${!s.letra ? "bg-[#0a2f5c] text-white" : "bg-white text-[#0a2f5c] ring-1 ring-border hover:ring-[#1d6ff2]"}`}>Todas</button>
              {LETRAS.map((l) => {
                const n = porLetra.get(l) ?? 0;
                const activa = s.letra === l;
                return (
                  <button key={l} type="button" disabled={!n && !activa} onClick={() => elegirLetra(l)} aria-pressed={activa} title={n ? `${n} ${n === 1 ? "empresa" : "empresas"} con ${l}` : `Ninguna empresa con ${l}`}
                    className={`relative grid h-8 min-w-8 shrink-0 place-items-center rounded-lg px-1 text-sm font-bold transition-all ${activa ? "scale-110 bg-[#1d6ff2] text-white shadow-[0_8px_18px_-8px_rgb(29_111_242/0.9)]" : n ? "bg-white text-[#0a2f5c] ring-1 ring-border hover:-translate-y-0.5 hover:bg-[#1d6ff2] hover:text-white hover:ring-[#1d6ff2]" : "text-muted-foreground/35"}`}>
                    {l}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* Letra elegida: la letra gigante entra y dice cuántas hay */}
          {s.letra && (
            <div key={s.letra} className="mb-6 flex items-center gap-5 overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a2f5c] to-[#1557c4] p-5 text-white sm:p-6">
              <span className="dir-letra font-display text-7xl font-bold leading-none text-transparent sm:text-8xl" style={{ WebkitTextStroke: "2px #ffd84d" }}>{s.letra}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-bold sm:text-2xl">{resultado.length} {resultado.length === 1 ? "empresa empieza" : "empresas empiezan"} con {s.letra === "#" ? "un número o símbolo" : `«${s.letra}»`}</p>
                <p className="mt-1 text-sm text-white/75">{resultado.reduce((t, f) => t + f.vacantes, 0).toLocaleString("es-DO")} vacantes abiertas entre todas.</p>
              </div>
              <button type="button" onClick={() => poner({ letra: undefined })} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-4 text-sm font-bold ring-1 ring-white/30 hover:bg-white/25"><X className="size-4" /> <span className="hidden sm:inline">Ver todas</span></button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3" aria-live="polite">
            <p className="text-sm text-muted-foreground"><strong className="text-foreground">{resultado.length.toLocaleString("es-DO")}</strong> {resultado.length === 1 ? "empresa" : "empresas"}{hayFiltros ? " con esos filtros" : " con vacantes abiertas"}</p>
            <div className="flex items-center gap-2">
              {hayFiltros && <button type="button" onClick={limpiar} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-sm font-semibold hover:border-[#c8102e] hover:text-[#c8102e]"><X className="size-4" /> Quitar filtros</button>}
              <button type="button" onClick={() => void compartir()} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-sm font-semibold hover:border-[#1d6ff2] hover:text-[#1557c4]"><Share2 className="size-4" /> Compartir</button>
            </div>
          </div>

          <div className="mt-5">
            {resultado.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center">
                <Building2 className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 font-extrabold">No encontramos empresas con esa búsqueda</p>
                <p className="mt-1 text-muted-foreground">Prueba con otra palabra o quita algún filtro. También puedes <Link to="/vacantes" search={texto ? { q: texto } : {}} className="font-semibold text-[#1557c4] underline">buscar entre todas las vacantes</Link>.</p>
                {hayFiltros && <button type="button" onClick={limpiar} className="mt-5 inline-flex h-11 items-center rounded-full bg-[#0a2f5c] px-5 font-bold text-white">Ver todas las empresas</button>}
              </div>
            ) : vista === "lista" ? (
              <div key={claveRejilla} className="overflow-hidden rounded-3xl border border-border bg-white">
                <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_7rem_8rem] gap-4 border-b border-border bg-[#f7f9fc] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-muted-foreground md:grid">
                  <span>Empresa</span><span>Áreas</span><span>Provincias</span><span className="text-right">Vacantes</span><span className="text-right">Última</span>
                </div>
                <ul className="divide-y divide-border">{mostradas.map((f, i) => <FilaLista key={f.slug} f={f} i={i % POR_PAGINA} />)}</ul>
              </div>
            ) : (
              <ul key={claveRejilla} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mostradas.map((f, i) => <Tarjeta key={f.slug} f={f} i={i % POR_PAGINA} />)}
              </ul>
            )}

            {resultado.length > visibles && (
              <div className="mt-8 text-center">
                <button type="button" onClick={() => setVisibles((v) => v + POR_PAGINA)} className="dir-btn inline-flex h-12 items-center gap-2 rounded-full bg-[#0a2f5c] px-6 font-bold text-white hover:bg-[#1557c4]">Ver más empresas <span className="text-white/70">({(resultado.length - visibles).toLocaleString("es-DO")} más)</span></button>
              </div>
            )}
          </div>

          {/* Cómo leer */}
          <section aria-labelledby="t-leer" className="dir-reveal mt-14 rounded-3xl border border-border bg-white p-6">
            <h2 id="t-leer" className="font-display text-xl font-bold">Cómo leer este directorio</h2>
            <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <li className="flex gap-3"><BadgeCheck className="mt-0.5 size-5 shrink-0 text-[#0f7a43]" /><span><strong>Publica directo:</strong> la empresa nos envió la vacante ella misma (formulario, correo o su panel).</span></li>
              <li className="flex gap-3"><Sparkles className="mt-0.5 size-5 shrink-0 text-[#d97706]" /><span><strong>Sello {NOMBRE_SELLO.toLowerCase()}:</strong> sus vacantes dicen sueldo, requisitos, funciones y cómo aplicar. <Link to="/empresas-claras" className="font-semibold text-[#1557c4] underline">Ver ranking</Link>.</span></li>
              <li className="flex gap-3"><Wallet className="mt-0.5 size-5 shrink-0 text-[#1557c4]" /><span><strong>% con sueldo:</strong> cuántas de sus vacantes dicen cuánto pagan. Saberlo antes te ahorra tiempo y ansiedad.</span></li>
              <li className="flex gap-3"><Briefcase className="mt-0.5 size-5 shrink-0 text-[#5b2a86]" /><span><strong>Recluta para otras empresas:</strong> consultoras que publican vacantes de sus clientes.</span></li>
            </ul>
          </section>
        </div>
      </section>

      {/* 6. CIERRE — zoom que se abre al llegar */}
      <section aria-labelledby="t-cierre" className="px-4 pb-16 pt-4 sm:px-6">
        <div data-scrub className="dir-zoom relative mx-auto max-w-7xl overflow-hidden bg-[#0a2f5c] px-6 py-12 text-center text-white sm:px-10 md:py-16">
          <div aria-hidden="true" className="dir-blob absolute -left-20 -top-20 size-80 rounded-full bg-[#1d6ff2] opacity-50 blur-[100px]" />
          <div aria-hidden="true" className="dir-blob absolute -bottom-24 -right-10 size-80 rounded-full bg-[#f5a700] opacity-25 blur-[100px] [animation-delay:-8s]" />
          <p className="relative text-xs font-extrabold uppercase tracking-wider text-[#8ec1ff]">¿Tu empresa no aparece?</p>
          <h2 id="t-cierre" className="relative mx-auto mt-2 max-w-2xl text-balance font-display text-3xl font-bold md:text-4xl">Publica tu vacante gratis y sal en este directorio hoy mismo</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">Cada empresa con vacantes activas aparece aquí con su perfil, sus vacantes y su sello de claridad, frente a miles de personas buscando empleo.</p>
          <Link to="/empresas" className="dir-btn btn-aplicar relative mt-7 inline-flex h-12 items-center gap-2 rounded-full px-7">Publica tu vacante <ArrowRight className="size-4" /></Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function Selector({ etiqueta, valor, onChange, opciones, todas }: { etiqueta: string; valor: string; onChange: (v: string) => void; opciones: (readonly [string, string])[]; todas?: string }) {
  return (
    <label className={`relative inline-flex h-9 shrink-0 items-center rounded-full border bg-white pl-3.5 pr-2 text-sm ${valor && todas ? "border-[#1d6ff2] text-[#1557c4]" : "border-border"}`}>
      <span className="mr-1 font-semibold text-muted-foreground">{etiqueta}:</span>
      <select value={valor} onChange={(e) => onChange(e.target.value)} className="h-full max-w-[11rem] cursor-pointer truncate bg-transparent pr-1 font-semibold outline-none">
        {todas && <option value="">{todas}</option>}
        {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}

function Insignias({ f }: { f: FilaDirectorio }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {f.nuevas > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-extrabold text-[#166534]"><span className="size-1.5 rounded-full bg-[#16a34a]" /> {f.nuevas === 1 ? "1 nueva" : `${f.nuevas} nuevas`} esta semana</span>}
      {f.aliada && <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-xs font-bold text-[#0f7a43] ring-1 ring-[#0f7a43]/20"><BadgeCheck className="size-3.5" /> Publica directo</span>}
      {f.sello && <span title={`Sello ${f.sello.t}: sus vacantes traen sueldo, requisitos, funciones y cómo aplicar.`} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold" style={{ background: f.sello.fondo, color: f.sello.color, boxShadow: `inset 0 0 0 1px ${f.sello.borde}` }}><Sparkles className="size-3.5" /> Sello {f.sello.t}</span>}
      {f.sector === "publico" && <span className="rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-xs font-bold text-[#b91c1c]">Sector público</span>}
      {f.sector === "zona-franca" && <span className="rounded-full bg-[#cffafe] px-2.5 py-0.5 text-xs font-bold text-[#0e7490]">Zona franca</span>}
      {f.recluta && <span className="rounded-full bg-[#f3e8ff] px-2.5 py-0.5 text-xs font-bold text-[#6b21a8]">Recluta para otras empresas</span>}
    </div>
  );
}

/* 5b. TARJETAS — se voltean al entrar (en cascada) y se inclinan con brillo bajo el cursor */
function Tarjeta({ f, i }: { f: FilaDirectorio; i: number }) {
  return (
    <li className="dir-flip" style={{ "--d": `${Math.min(i, 12) * 45}ms` } as CSSProperties}>
      <div onPointerMove={inclinar} onPointerLeave={soltar} className="dir-tilt group relative flex h-full flex-col rounded-3xl border border-border bg-white p-5 hover:border-[#1d6ff2]/50 hover:shadow-[0_24px_44px_-26px_rgb(10_47_92/0.55)]">
        <div className="relative flex items-start gap-3">
          <EmpresaAvatar nombre={f.nombre} className="size-12 text-xl" />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug"><Link to="/empresa/$id" params={{ id: f.slug }} className="focus:outline-none">{f.nombre}</Link></h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" /> Última vacante {hace(f.ultima)}</p>
          </div>
          <div className="shrink-0 rounded-2xl bg-[#eef4ff] px-3 py-2 text-center transition-colors group-hover:bg-[#1d6ff2]">
            <p className="font-display text-2xl font-bold leading-none text-[#1557c4] tabular-nums group-hover:text-white">{f.vacantes}</p>
            <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#1557c4]/70 group-hover:text-white/80">{f.vacantes === 1 ? "vacante" : "vacantes"}</p>
          </div>
        </div>

        <div className="relative mt-3"><Insignias f={f} /></div>

        {f.puestos.length > 0 && (
          <div className="relative mt-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Está buscando</p>
            <ul className="mt-1.5 space-y-1 text-sm">
              {f.puestos.slice(0, 3).map((p) => <li key={p} className="flex gap-2"><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[#1d6ff2]" /><span className="line-clamp-1">{p}</span></li>)}
            </ul>
          </div>
        )}

        <div className="relative mt-4 space-y-1.5 text-sm text-muted-foreground">
          {f.areas.length > 0 && <p className="flex gap-2"><Briefcase className="mt-0.5 size-4 shrink-0" /><span className="line-clamp-1">{f.areas.slice(0, 3).join(" · ")}</span></p>}
          {f.provincias.length > 0 && <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" /><span className="line-clamp-1">{f.provincias.slice(0, 3).join(" · ")}{f.provincias.length > 3 ? ` y ${f.provincias.length - 3} más` : ""}</span></p>}
        </div>

        <div className="relative mt-auto pt-4">
          <div className="flex items-center justify-between text-xs font-semibold"><span className="text-muted-foreground">Dicen el sueldo</span>{f.conSueldo > 0 ? <span className="tabular-nums">{f.conSueldo}%{f.topSueldo > 0 ? ` · desde ${money(f.topSueldo)}` : ""}</span> : <Link to="/salarios" className="text-[#1557c4] hover:underline">No lo publica · ver Radar salarial</Link>}</div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e8edf5]"><div className="dir-bar h-full rounded-full bg-gradient-to-r from-[#1d6ff2] to-[#14b8a6]" style={{ width: `${f.conSueldo}%`, "--d": `${300 + Math.min(i, 12) * 45}ms` } as CSSProperties} /></div>
        </div>

        <div className="relative mt-5 flex gap-2">
          <Link to="/empleos/$slug" params={{ slug: f.slug }} className="dir-btn inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0a2f5c] px-4 text-sm font-bold text-white hover:bg-[#1557c4]">Ver {f.vacantes === 1 ? "la vacante" : `las ${f.vacantes} vacantes`} <ArrowRight className="size-4" /></Link>
          <Link to="/empresa/$id" params={{ id: f.slug }} className="inline-flex h-10 items-center rounded-full border border-border bg-white px-4 text-sm font-semibold hover:border-[#1d6ff2] hover:text-[#1557c4]">Perfil</Link>
        </div>
      </div>
    </li>
  );
}

function FilaLista({ f, i }: { f: FilaDirectorio; i: number }) {
  return (
    <li className="dir-flip relative px-5 py-4 transition-colors hover:bg-[#f7f9fc] md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_7rem_8rem] md:items-center md:gap-4" style={{ "--d": `${Math.min(i, 14) * 30}ms` } as CSSProperties}>
      <div className="flex min-w-0 items-center gap-3">
        <EmpresaAvatar nombre={f.nombre} className="size-10 text-base" />
        <div className="min-w-0">
          <Link to="/empresa/$id" params={{ id: f.slug }} className="line-clamp-1 font-bold hover:text-[#1557c4]">{f.nombre}</Link>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {f.nuevas > 0 && <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-extrabold text-[#166534]">{f.nuevas} nueva{f.nuevas === 1 ? "" : "s"}</span>}
            {f.aliada && <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-bold text-[#0f7a43]">Publica directo</span>}
            {f.sello && <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ background: f.sello.fondo, color: f.sello.color }}>Sello {f.sello.t}</span>}
            {f.conSueldo > 0 && <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[11px] font-bold text-[#1557c4]">{f.conSueldo}% con sueldo</span>}
          </div>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-sm text-muted-foreground md:mt-0">{f.areas.slice(0, 3).join(" · ") || "—"}</p>
      <p className="line-clamp-1 text-sm text-muted-foreground">{f.provincias.slice(0, 2).join(" · ") || "—"}</p>
      <div className="mt-2 flex items-center justify-between gap-3 md:mt-0 md:contents">
        <Link to="/empleos/$slug" params={{ slug: f.slug }} className="inline-flex items-center gap-1 font-display text-lg font-bold text-[#1557c4] hover:underline md:justify-end">{f.vacantes}<span className="text-xs font-semibold md:hidden">{f.vacantes === 1 ? " vacante" : " vacantes"} →</span></Link>
        <span className="text-xs text-muted-foreground md:text-right">{hace(f.ultima)}</span>
      </div>
    </li>
  );
}

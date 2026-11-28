import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, TrendingUp } from "lucide-react";

import type { Vacante } from "@/lib/vacantes";

/**
 * Pulso del empleo hoy: cifras reales calculadas con las vacantes publicadas.
 * La transparencia como prueba, no como promesa.
 * Tarjeta flotante que se monta sobre el borde de la portada: una sola franja,
 * números que cuentan al aparecer y una mini gráfica de los últimos 7 días.
 */
const rd = (n: number) => `RD$${(n >= 1000 ? Math.round(n / 1000) * 1000 : n).toLocaleString("es-DO")}`;
// Día en hora de RD (UTC-4).
const diaRD = (d: Date) => new Date(d.getTime() - 4 * 3600e3).toISOString().slice(0, 10);
const fmt = (n: number) => Math.round(n).toLocaleString("es-DO");

/** Cuenta de 0 al valor cuando la tarjeta entra en pantalla (sin animación si la persona la desactivó). */
function useCuenta(objetivo: number, activo: boolean, ms = 1100) {
  const [v, setV] = useState(objetivo);
  useEffect(() => {
    if (!activo) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(objetivo); return; }
    let raf = 0;
    const t0 = performance.now();
    const paso = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / ms));
      setV(objetivo * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    setV(0);
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, activo, ms]);
  return v;
}

export function PulsoHoy({ jobs, className = "" }: { jobs: Vacante[]; className?: string }) {
  const c = useMemo(() => {
    if (!jobs.length) return null;
    const hoy = diaRD(new Date());
    const ayer = diaRD(new Date(Date.now() - 864e5));
    const porDia = new Map<string, number>();
    for (const j of jobs) { const d = diaRD(new Date(j.creado)); porDia.set(d, (porDia.get(d) ?? 0) + 1); }
    const nuevasHoy = porDia.get(hoy) ?? 0;
    const nuevasAyer = porDia.get(ayer) ?? 0;
    // Últimos 7 días, del más viejo a hoy.
    const dias = Array.from({ length: 7 }, (_, i) => porDia.get(diaRD(new Date(Date.now() - (6 - i) * 864e5))) ?? 0);
    const semana = jobs.filter((j) => Date.now() - new Date(j.creado).getTime() < 7 * 864e5).length;
    const salarios = jobs.filter((j) => j.salarioMin > 0).map((j) => j.salarioMin).sort((a, b) => a - b);
    const mediana = salarios.length ? salarios[Math.floor(salarios.length / 2)]! : 0;
    const empresas = new Set(jobs.map((j) => j.empresa.trim().toLowerCase()).filter(Boolean)).size;
    const provincias = new Set(jobs.map((j) => j.provincia).filter(Boolean)).size;
    return { nuevas: nuevasHoy || nuevasAyer, deHoy: nuevasHoy > 0, semana, dias, mediana, empresas, provincias, total: jobs.length };
  }, [jobs]);

  const ref = useRef<HTMLElement>(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setVisto(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setVisto(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    // Respaldo: si el observador no avisa, se anima igual.
    const t = setTimeout(() => setVisto(true), 1500);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [c]);

  const nNuevas = useCuenta(c?.nuevas ?? 0, visto);
  const nSemana = useCuenta(c?.semana ?? 0, visto);
  const nEmpresas = useCuenta(c?.empresas ?? 0, visto);
  const nSalario = useCuenta(c?.mediana ?? 0, visto);
  if (!c) return null;

  const max = Math.max(1, ...c.dias);
  const fecha = new Date().toLocaleDateString("es-DO", { day: "numeric", month: "short", timeZone: "America/Santo_Domingo" }).replace(".", "");
  const num = "font-display text-xl font-extrabold leading-none tracking-tight tabular-nums sm:text-2xl lg:text-[2rem]";
  const celda = "relative flex flex-col justify-center px-2 py-3 text-center lg:px-5 lg:py-4 lg:text-left";
  const lab = "mt-1 text-[11px] font-bold leading-tight text-foreground sm:text-xs lg:mt-1.5 lg:text-[13px]";
  const det = "mt-0.5 hidden text-[11px] text-muted-foreground lg:block";

  return (
    <section ref={ref} aria-label="Pulso del empleo hoy" className={`relative z-10 -mt-9 px-4 sm:-mt-10 sm:px-6 md:-mt-12 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <div className="entra overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_24px_48px_-20px_rgba(10,47,92,.45),0_2px_6px_rgba(10,47,92,.08)] lg:grid lg:grid-cols-[176px_repeat(4,minmax(0,1fr))]">
          {/* Sello EN VIVO */}
          <div className="hero-dark flex items-center justify-between gap-3 px-4 py-2 lg:flex-col lg:items-start lg:justify-center lg:gap-1.5 lg:px-5 lg:py-4">
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-white ring-1 ring-white/20">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#3ee08a] opacity-70" /><span className="relative inline-flex size-2 rounded-full bg-[#3ee08a]" /></span>
              En vivo
            </span>
            <p className="flex-1 whitespace-nowrap text-[13px] font-extrabold leading-tight text-white sm:text-sm lg:flex-none lg:whitespace-normal lg:text-base">El pulso del<br className="hidden lg:block" /> empleo hoy</p>
            <p className="hidden shrink-0 whitespace-nowrap text-[11px] font-semibold capitalize text-white/65 min-[370px]:block">{fecha}</p>
          </div>

          <div className="grid grid-cols-3 lg:contents">
            {/* Nuevas hoy */}
            <div className={`${celda} border-r border-border`}>
              <p className={`${num} text-primary`}>{fmt(nNuevas)}</p>
              <p className={lab}><span className="lg:hidden">{c.deHoy ? "nuevas hoy" : "nuevas ayer"}</span><span className="hidden lg:inline">{c.deHoy ? "vacantes nuevas hoy" : "vacantes nuevas ayer"}</span></p>
              <p className={det}>de {fmt(c.total)} abiertas</p>
            </div>

            {/* 7 días + mini gráfica (solo en pantallas grandes) */}
            <div className={`${celda} border-r border-border`}>
              <div className="flex items-end justify-center gap-2 lg:justify-between">
                <p className={`${num} text-primary`}>{fmt(nSemana)}</p>
                <div className="hidden h-8 shrink-0 items-end gap-[3px] lg:flex" aria-hidden="true">
                  {c.dias.map((d, i) => (
                    <span key={i} className={`block w-[6px] rounded-sm transition-[height] duration-700 ease-out ${i === 6 ? "bg-cta" : "bg-cta/30"}`} style={{ height: visto ? `${Math.max(12, (d / max) * 100)}%` : "12%", transitionDelay: `${i * 60}ms` }} />
                  ))}
                </div>
              </div>
              <p className={lab}><span className="lg:hidden">en 7 días</span><span className="hidden lg:inline">nuevas en 7 días</span></p>
              <p className={det}>Llegan todos los días</p>
            </div>

            {/* Empresas */}
            <div className={`${celda} lg:border-r lg:border-border`}>
              <p className={`${num} text-primary`}>{fmt(nEmpresas)}</p>
              <p className={lab}><span className="lg:hidden">empresas</span><span className="hidden lg:inline">empresas contratando</span></p>
              <p className={det}>en {c.provincias} provincias</p>
            </div>

            {/* Salario → radar: franja completa en el celular, casilla en pantallas grandes */}
            <Link to="/salarios" className="group col-span-3 flex items-center justify-between gap-3 border-t border-border bg-success/[.07] px-4 py-2.5 transition-colors hover:bg-success/[.13] lg:col-span-1 lg:flex-col lg:items-start lg:justify-center lg:gap-0 lg:border-t-0 lg:px-5 lg:py-4">
              <div className="flex items-baseline gap-2 lg:block">
                <p className="font-display text-lg font-extrabold leading-none tracking-tight tabular-nums text-success sm:text-xl lg:text-[2rem]">{c.mediana ? rd(nSalario) : "—"}</p>
                <p className="flex items-center gap-1 whitespace-nowrap text-[11px] font-bold leading-tight min-[370px]:text-xs lg:mt-1.5 lg:text-[13px]"><TrendingUp className="hidden size-3.5 text-success lg:block" aria-hidden="true" /> salario más común</p>
              </div>
              <p className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-success group-hover:underline lg:mt-0.5 lg:text-[11px]"><span className="hidden min-[370px]:inline lg:hidden">Radar</span><span className="hidden lg:inline">Ver radar salarial</span> <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 lg:size-3" aria-hidden="true" /></p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

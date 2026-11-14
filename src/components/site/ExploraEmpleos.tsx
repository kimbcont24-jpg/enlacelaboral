import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, Briefcase, Calculator, ChevronDown, ExternalLink, Factory, Headphones, HeartPulse, Hotel, House, Landmark, Languages, Laptop, MapPin, Settings, Sprout, TrendingUp, Users, Wallet, Warehouse } from "lucide-react";

import { areas } from "@/lib/data";
import { CONCURSA_URL, contarColecciones, type ColeccionId } from "@/lib/colecciones";
import { slug } from "@/lib/empleos";
import type { Vacante } from "@/lib/vacantes";
import { cn } from "@/lib/utils";

const iconos: Record<string, typeof Briefcase> = { "Administración": Briefcase, "Recursos Humanos": Users, Ventas: TrendingUp, "Tecnología": Laptop, Operaciones: Settings, "Contabilidad y Finanzas": Calculator, "Producción": Factory, "Logística": Boxes, "Servicio al Cliente": Headphones, Salud: HeartPulse, "Hotelería y Turismo": Hotel };

/** Un color por área: se reconoce de un vistazo y se repite en el ícono, la barra y el borde al pasar. */
const colores: Record<string, string> = { Ventas: "#e11d48", "Logística": "#0e7490", "Hotelería y Turismo": "#0891b2", "Contabilidad y Finanzas": "#15803d", Operaciones: "#475569", "Producción": "#b45309", "Administración": "#1d4ed8", "Servicio al Cliente": "#7c3aed", Salud: "#dc2626", "Tecnología": "#0f4aa8", "Recursos Humanos": "#be185d" };

const iconoColeccion: Record<ColeccionId, typeof Briefcase> = { "sector-publico": Landmark, "zonas-francas": Warehouse, remoto: House, "sin-experiencia": Sprout, "con-salario": Wallet, bilingues: Languages };

const slugProvincia = (p: string) => slug(p.replace(/\s*\(.*?\)\s*/g, "").replace("Remoto desde RD", "Remoto"));
const plural = (n: number) => `${n} ${n === 1 ? "vacante" : "vacantes"}`;

/**
 * Explorar empleos en tres niveles:
 * 1) Sector público, destacado aparte (la gente lo busca por su nombre y suele no saber cómo aplicar).
 * 2) Colecciones que cruzan áreas: zonas francas, desde casa, sin experiencia, con salario, bilingües.
 * 3) Pestañas por área (con color, peso relativo y nuevas de la semana) y por provincia.
 * En el celular las tarjetas se deslizan de lado en vez de apilarse.
 */
export function ExploraEmpleos({ jobs, provincias }: { jobs: Vacante[]; provincias: [string, number][] }) {
  const [vista, setVista] = useState<"area" | "provincia">("area");
  const [todas, setTodas] = useState(false);

  const cols = useMemo(() => contarColecciones(jobs), [jobs]);
  const publico = cols.find((c) => c.id === "sector-publico")!;
  const resto = cols.filter((c) => c.id !== "sector-publico");

  const porArea = useMemo(() => {
    const semana = Date.now() - 7 * 864e5;
    const m = new Map<string, { total: number; nuevas: number }>();
    for (const j of jobs) {
      const x = m.get(j.area) ?? { total: 0, nuevas: 0 };
      x.total++;
      if (new Date(j.creado).getTime() >= semana) x.nuevas++;
      m.set(j.area, x);
    }
    return areas.map((a) => ({ area: a, ...(m.get(a) ?? { total: 0, nuevas: 0 }) })).sort((x, y) => y.total - x.total);
  }, [jobs]);
  const maxArea = Math.max(1, ...porArea.map((a) => a.total));

  const LIMITE = 10;
  const visibles = todas ? provincias : provincias.slice(0, LIMITE);
  const maxProv = Math.max(1, ...provincias.map(([, n]) => n));

  return (
    <section className="cv-auto px-4 py-10 sm:px-6 sm:py-12" aria-labelledby="explora-titulo">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">Explora</p>
        <h2 id="explora-titulo" className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Encuentra empleo a tu manera</h2>
        <p className="mt-1 text-muted-foreground">Por tipo de oportunidad, por área o por provincia.</p>

        {/* 1. Sector público */}
        <div className="relative mt-6 overflow-hidden rounded-3xl bg-[#0a2f5c] text-white shadow-lg">
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-[#c8102e]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-[#1d6ff2]/30 blur-2xl" />
          <Landmark aria-hidden="true" className="pointer-events-none absolute -bottom-6 right-4 size-40 text-white/[0.06] sm:right-10" />
          <div className="relative flex flex-col gap-5 p-6 sm:p-7 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-white/20">
                <Landmark className="size-3.5" aria-hidden="true" /> Sector público
              </span>
              <h3 className="mt-3 text-xl font-extrabold leading-tight sm:text-2xl">Empleos en el Estado dominicano</h3>
              <p className="mt-1.5 text-sm text-white/80 sm:text-base">Ministerios, ayuntamientos, hospitales y empresas públicas. Te explicamos cómo aplicar por Concursa, el portal oficial de concursos del MAP.</p>
              <p className="mt-3 text-sm font-semibold text-white/90">
                {publico.total > 0 ? <><b className="text-2xl font-extrabold text-white">{publico.total}</b> {publico.total === 1 ? "vacante abierta" : "vacantes abiertas"}{publico.nuevas > 0 && <span className="ml-2 rounded-full bg-[#c8102e] px-2 py-0.5 text-xs font-bold">+{publico.nuevas} esta semana</span>}</> : "Ahora mismo no hay plazas abiertas aquí: entra, mira cómo aplicar y activa tu alerta."}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2.5">
              <Link to="/empleos/$slug" params={{ slug: publico.slug }} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 font-bold text-[#0a2f5c] shadow transition-transform hover:-translate-y-0.5">
                Ver empleos del Estado <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a href={CONCURSA_URL} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-5 font-bold text-white ring-1 ring-white/30 transition-colors hover:bg-white/20">
                Ir a Concursa <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* 2. Colecciones */}
        <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          <ul className="grid auto-cols-[15rem] grid-flow-col gap-3 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-3 lg:grid-cols-5">
            {resto.map((c) => {
              const Icono = iconoColeccion[c.id];
              return (
                <li key={c.id}>
                  <Link to="/empleos/$slug" params={{ slug: c.slug }} style={{ "--c": c.color } as React.CSSProperties} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--c)] hover:shadow-md">
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-[var(--c)] opacity-80" />
                    <div className="flex items-start justify-between gap-2">
                      <span className="grid size-10 place-items-center rounded-xl text-white shadow-sm" style={{ background: c.color }}><Icono className="size-5" aria-hidden="true" /></span>
                      {c.nuevas > 0 && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold" style={{ color: c.color }}>+{c.nuevas} nuevas</span>}
                    </div>
                    <p className="mt-3 font-extrabold leading-tight">{c.nombre}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{c.frase}</p>
                    <p className="mt-auto pt-3 text-sm font-bold" style={{ color: c.color }}>{plural(c.total)} <ArrowRight className="inline size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 3. Por área / por provincia */}
        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="text-xl font-extrabold tracking-tight md:text-2xl">Empleos por {vista === "area" ? "área" : "provincia"}</h3>
          <div role="tablist" aria-label="Explorar por" className="grid grid-cols-2 rounded-full bg-secondary p-1 text-sm font-bold sm:w-64">
            {(["area", "provincia"] as const).map((v) => (
              <button key={v} type="button" role="tab" aria-selected={vista === v} onClick={() => setVista(v)} className={cn("rounded-full py-2 transition-colors", vista === v ? "bg-primary text-white shadow" : "text-muted-foreground")}>
                {v === "area" ? "Por área" : "Por provincia"}
              </button>
            ))}
          </div>
        </div>

        {vista === "area" ? (
          <div className="-mx-4 mt-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            <div className="grid auto-cols-[13.5rem] grid-flow-col grid-rows-2 gap-2.5 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-3 sm:grid-rows-none lg:grid-cols-4">
              {porArea.map(({ area, total, nuevas }, i) => {
                const Icono = iconos[area] ?? Briefcase;
                const color = colores[area] ?? "#0a2f5c";
                return (
                  <Link key={area} to="/empleos/$slug" params={{ slug: slug(area) }} style={{ "--c": color } as React.CSSProperties} className="group rounded-2xl border border-border bg-surface px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-[var(--c)] hover:shadow-md">
                    <span className="flex items-center gap-2.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl transition-colors" style={{ background: `${color}1a`, color }}><Icono className="size-5" aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] font-bold sm:text-sm">{area}</span>
                          {i === 0 && total > 0 && <span className="shrink-0 rounded-full px-1.5 py-px text-[10px] font-extrabold uppercase text-white" style={{ background: color }}>Top</span>}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          {plural(total)}
                          {nuevas > 0 && <span className="font-bold" style={{ color }}>· +{nuevas} esta semana</span>}
                        </span>
                      </span>
                    </span>
                    <span aria-hidden="true" className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-secondary">
                      <span className="block h-full rounded-full transition-all group-hover:opacity-100" style={{ width: `${Math.max(4, Math.round((total / maxArea) * 100))}%`, background: color, opacity: 0.75 }} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <div className="flex flex-wrap gap-2">
              {visibles.map(([p, n]) => (
                <Link key={p} to="/empleos/$slug" params={{ slug: slugProvincia(p) }} className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-border bg-surface py-1.5 pl-2.5 pr-3 text-[13px] font-semibold transition-colors hover:border-primary hover:text-primary sm:text-sm">
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-primary/[0.07]" style={{ width: `${Math.round((n / maxProv) * 100)}%` }} />
                  <MapPin className="relative size-3.5 text-primary" aria-hidden="true" /> <span className="relative">{p}</span>
                  <span className="relative rounded-full bg-secondary px-1.5 text-[11px] font-bold text-muted-foreground">{n}</span>
                </Link>
              ))}
            </div>
            {provincias.length > LIMITE && (
              <button type="button" onClick={() => setTodas((x) => !x)} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
                {todas ? "Ver menos" : `Ver las ${provincias.length} provincias`}
                <ChevronDown className={cn("size-4 transition-transform", todas && "rotate-180")} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

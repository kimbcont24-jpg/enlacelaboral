import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Boxes, Briefcase, Calculator, ChevronDown, Factory, Headphones, HeartPulse, Hotel, Laptop, MapPin, Settings, TrendingUp, Users } from "lucide-react";

import { SectorPublicoBanda } from "@/components/site/SectorPublicoBanda";
import { areas } from "@/lib/data";
import { slug } from "@/lib/empleos";
import type { Vacante } from "@/lib/vacantes";
import { cn } from "@/lib/utils";

const iconos: Record<string, typeof Briefcase> = { "Administración": Briefcase, "Recursos Humanos": Users, Ventas: TrendingUp, "Tecnología": Laptop, Operaciones: Settings, "Contabilidad y Finanzas": Calculator, "Producción": Factory, "Logística": Boxes, "Servicio al Cliente": Headphones, Salud: HeartPulse, "Hotelería y Turismo": Hotel };

const slugProvincia = (p: string) => slug(p.replace(/\s*\(.*?\)\s*/g, "").replace("Remoto desde RD", "Remoto"));

/**
 * Áreas y provincias en una sola sección con dos pestañas.
 * En el celular las áreas se deslizan de lado (dos filas) en vez de apilarse hacia abajo.
 */
export function ExploraEmpleos({ jobs, provincias }: { jobs: Vacante[]; provincias: [string, number][] }) {
  const [vista, setVista] = useState<"area" | "provincia">("area");
  const [todas, setTodas] = useState(false);

  const porArea = useMemo(() => {
    const m = new Map<string, number>();
    for (const j of jobs) m.set(j.area, (m.get(j.area) ?? 0) + 1);
    return areas.map((a) => [a, m.get(a) ?? 0] as const).sort((x, y) => y[1] - x[1]);
  }, [jobs]);

  const LIMITE = 10;
  const visibles = todas ? provincias : provincias.slice(0, LIMITE);

  return (
    <section className="cv-auto px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10"><SectorPublicoBanda jobs={jobs} /></div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Explora</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Empleos por {vista === "area" ? "área" : "provincia"}</h2>
          </div>
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
            <div className="grid auto-cols-[12.25rem] grid-flow-col grid-rows-2 gap-2.5 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-3 sm:grid-rows-none lg:grid-cols-4">
              {porArea.map(([area, total]) => {
                const Icono = iconos[area] ?? Briefcase;
                return (
                  <Link key={area} to="/empleos/$slug" params={{ slug: slug(area) }} className="group flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-2.5 transition-colors hover:border-primary">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white"><Icono className="size-[1.1rem]" /></span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[13px] font-bold sm:text-sm">{area}</span>
                      <span className="block text-xs text-muted-foreground">{total} {total === 1 ? "vacante" : "vacantes"}</span>
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
                <Link key={p} to="/empleos/$slug" params={{ slug: slugProvincia(p) }} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1.5 pl-2.5 pr-3 text-[13px] font-semibold transition-colors hover:border-primary hover:text-primary sm:text-sm">
                  <MapPin className="size-3.5 text-primary" aria-hidden="true" /> {p}
                  <span className="rounded-full bg-secondary px-1.5 text-[11px] font-bold text-muted-foreground">{n}</span>
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
        <Link to="/explorar" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">Ver el mapa completo del empleo en RD →</Link>
      </div>
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import { Boxes, Briefcase, Calculator, Factory, HeartPulse, Hotel, Laptop, Headphones, Settings, TrendingUp, Users } from "lucide-react";

import { areas } from "@/lib/data";
import type { Vacante } from "@/lib/vacantes";

const iconos: Record<string, typeof Briefcase> = { "Administración": Briefcase, "Recursos Humanos": Users, Ventas: TrendingUp, "Tecnología": Laptop, Operaciones: Settings, "Contabilidad y Finanzas": Calculator, "Producción": Factory, "Logística": Boxes, "Servicio al Cliente": Headphones, Salud: HeartPulse, "Hotelería y Turismo": Hotel };

export function AreasGrid({ jobs }: { jobs: Vacante[] }) {
  return (
    <section className="border-t border-border px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-bold tracking-tight">Explora empleos por área</h2>
        <p className="mt-1 text-sm text-muted-foreground">Elige tu área y mira las vacantes disponibles.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {areas.map((area) => {
            const Icono = iconos[area] ?? Briefcase;
            const total = jobs.filter((j) => j.area === area).length;
            return (
              <Link key={area} to="/vacantes" search={{ area }} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/60">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icono className="size-5" /></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{area}</span>
                  <span className="block text-xs text-muted-foreground">{total} {total === 1 ? "vacante" : "vacantes"}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

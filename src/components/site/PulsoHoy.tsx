import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, Building2, GraduationCap, Sparkles } from "lucide-react";

import type { Vacante } from "@/lib/vacantes";

/**
 * Pulso del empleo hoy: cifras reales calculadas con las vacantes publicadas.
 * La transparencia como prueba, no como promesa.
 */
const rd = (n: number) => `RD$${(n >= 1000 ? Math.round(n / 1000) * 1000 : n).toLocaleString("es-DO")}`;
// Día en hora de RD (UTC-4).
const diaRD = (d: Date) => new Date(d.getTime() - 4 * 3600e3).toISOString().slice(0, 10);

export function PulsoHoy({ jobs, className = "" }: { jobs: Vacante[]; className?: string }) {
  const c = useMemo(() => {
    if (!jobs.length) return null;
    const hoy = diaRD(new Date());
    const ayer = diaRD(new Date(Date.now() - 864e5));
    const nuevasHoy = jobs.filter((j) => diaRD(new Date(j.creado)) === hoy).length;
    const nuevasAyer = jobs.filter((j) => diaRD(new Date(j.creado)) === ayer).length;
    const conSalario = jobs.filter((j) => j.salarioMin > 0);
    const sinExperiencia = jobs.filter((j) => j.experiencia === "Sin experiencia").length;
    const salarios = conSalario.map((j) => j.salarioMin).sort((a, b) => a - b);
    const mediana = salarios.length ? salarios[Math.floor(salarios.length / 2)]! : 0;
    const empresas = new Set(jobs.map((j) => j.empresa.trim().toLowerCase()).filter(Boolean)).size;
    return { nuevas: nuevasHoy || nuevasAyer, deHoy: nuevasHoy > 0, sinExperiencia, mediana, empresas, total: jobs.length };
  }, [jobs]);
  if (!c) return null;

  const cifras = [
    { I: Sparkles, n: c.nuevas.toLocaleString("es-DO"), t: c.deHoy ? "vacantes nuevas hoy" : "vacantes nuevas ayer", d: c.total >= 1000 ? "Más de 1,000 abiertas" : `${c.total.toLocaleString("es-DO")} abiertas en total` },
    { I: GraduationCap, n: c.sinExperiencia.toLocaleString("es-DO"), t: "no piden experiencia", d: "Ideales para tu primer empleo", to: "Sin experiencia" },
    { I: Building2, n: c.empresas.toLocaleString("es-DO"), t: "empresas contratando", d: "De todo el país" },
    { I: Activity, n: c.mediana ? rd(c.mediana) : "—", t: "salario más común", d: "Mensual, entre las que lo publican" },
  ];

  return (
    <section aria-label="Pulso del empleo hoy" className={`px-4 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-extrabold"><span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" /><span className="relative inline-flex size-2.5 rounded-full bg-success" /></span> El pulso del empleo hoy</p>
          <Link to="/salarios" className="text-sm font-bold text-primary hover:underline">Ver el radar salarial</Link>
        </div>
        <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-surface lg:grid-cols-4">
          {cifras.map(({ I, n, t, d, to }, i) => (
            <Cifra key={t} to={to} className={`p-4 sm:p-5 ${i % 2 === 0 ? "border-r border-border" : ""} ${i < 2 ? "border-b border-border lg:border-b-0" : ""} ${i === 1 ? "lg:border-r" : ""}`}>
              <p className="flex items-center gap-2"><I className="size-4 text-primary" aria-hidden="true" /><span className="font-display text-2xl font-extrabold tabular-nums sm:text-3xl">{n}</span></p>
              <p className="mt-1 text-sm font-bold">{t}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{d}</p>
            </Cifra>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cifra({ to, className, children }: { to?: string; className: string; children: React.ReactNode }) {
  if (!to) return <div className={className}>{children}</div>;
  return <Link to="/vacantes" search={{ experiencia: to }} className={`${className} transition-colors hover:bg-secondary/60`}>{children}</Link>;
}

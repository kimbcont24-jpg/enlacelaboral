import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, Loader2, UserRound } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { VacanteTarjeta } from "@/components/site/VacanteTarjeta";
import { AlertaForm } from "@/components/site/AlertaForm";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";
import { Hero } from "@/components/site/Hero";
import { AreasGrid } from "@/components/site/AreasGrid";
import { filtrarJobs, filtrosVacios, type Filtros } from "@/components/site/Filtros";
import { consejos } from "@/lib/data";
import { useContenido } from "@/lib/contenido";
import { useVacantes } from "@/lib/vacantes";
import { slug } from "@/lib/empleos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Empleos en República Dominicana | Enlace Laboral" },
      { name: "description", content: "Busca empleo en República Dominicana. Vacantes de todo el país en un solo lugar, con la fuente original visible." },
    ],
  }),
  component: Home,
});

const TODAS = "Toda República Dominicana";

function Home() {
  const navigate = useNavigate();
  const t = useContenido();
  const { jobs, cargando } = useVacantes();
  const [puesto, setPuesto] = useState("");
  const [provincia, setProvincia] = useState(TODAS);
  const [filtros, setFiltros] = useState<Filtros>(filtrosVacios);
  const resultados = useMemo(() => filtrarJobs(jobs, filtros), [jobs, filtros]);
  const recientes = resultados.slice(0, 6);

  const buscar = () =>
    navigate({
      to: "/vacantes",
      search: {
        q: puesto || undefined,
        provincia: provincia === TODAS ? filtros.provincia || undefined : provincia,
        area: filtros.area || undefined,
        modalidad: filtros.modalidad || undefined,
        tipo: filtros.tipo || undefined,
        experiencia: filtros.experiencia || undefined,
        salarioMin: filtros.salarioMin || undefined,
      },
    });

  const provinciasConVacantes = useMemo(() => {
    const m = new Map<string, number>();
    for (const j of jobs) m.set(j.provincia, (m.get(j.provincia) ?? 0) + 1);
    return [...m.entries()].sort((x, y) => y[1] - x[1]);
  }, [jobs]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero puesto={puesto} provincia={provincia} onPuesto={setPuesto} onProvincia={setProvincia} onBuscar={() => void buscar()} total={jobs.length} provincias={provinciasConVacantes.length} />

      <section className="border-b border-border bg-surface px-4 py-6 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          <div className="flex items-start gap-4 rounded-2xl bg-secondary p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-white"><UserRound className="size-5" aria-hidden="true" /></span>
            <div>
              <p className="font-bold">¿Buscas empleo?</p>
              <p className="mt-1 text-sm text-muted-foreground">Busca, mira el salario y los requisitos, y aplica gratis. ¿Sin CV? <Link to="/cv" className="font-semibold text-primary underline">Créalo gratis en 5 minutos</Link>.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl bg-secondary p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cta text-white"><Building2 className="size-5" aria-hidden="true" /></span>
            <div>
              <p className="font-bold">¿Eres empresa o institución?</p>
              <p className="mt-1 text-sm text-muted-foreground">Publica tus vacantes gratis y llega a candidatos de todo el país. <Link to="/empresas" className="font-semibold text-primary underline">Publicar vacante</Link></p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Empleos recientes</h2>
            <p className="mt-1 text-muted-foreground">Las últimas vacantes publicadas en Enlace Laboral.</p>
          </div>
          <Link to="/vacantes" className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white">Ver todos los empleos <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cargando && (<div className="col-span-full flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Cargando vacantes…</div>)}
          {!cargando && recientes.map((job) => (<VacanteTarjeta key={job.id} job={job} />))}
          {!cargando && recientes.length === 0 && (<div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Estamos cargando nuevas vacantes. Vuelve pronto.</div>)}
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6"><div className="mx-auto grid max-w-6xl gap-4"><CanalWhatsApp /><AlertaForm /></div></section>

      <AreasGrid jobs={jobs} />

      {provinciasConVacantes.length > 0 && (
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Empleos por provincia</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {provinciasConVacantes.map(([p, n]) => (
                <Link key={p} to="/empleos/$slug" params={{ slug: slug(p.replace(/\s*\(.*?\)\s*/g, "").replace("Remoto desde RD", "Remoto")) }} className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary">{p} <span className="text-muted-foreground">({n})</span></Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border bg-surface px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-4">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Consejos para tu búsqueda</h2>
            <div className="mt-5 rounded-2xl border-l-4 border-cta bg-secondary p-5">
              <p className="leading-relaxed">“{t.especialista_cita}”</p>
              <p className="mt-2 text-sm text-muted-foreground">{t.especialista_firma}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-8">
            {consejos.slice(0, 4).map((c) => (
              <Link key={c.titulo} to="/recursos" className="block rounded-2xl border border-border bg-background p-5 hover:border-primary/60">
                <span className="text-xs font-bold text-cta">{c.categoria} · {c.minutos} min de lectura</span>
                <h3 className="mt-1 font-bold leading-snug">{c.titulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.resumen}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl bg-primary p-8 text-white md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-xl">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{t.reclutadores_titulo}</h2>
            <p className="mt-2 text-white/80">Publicar vacantes es gratis. Envíanos tu vacante y la publicamos para candidatos de todo el país.</p>
          </div>
          <Link to="/empresas" className="btn-aplicar rounded-xl px-7 py-3.5 text-center text-lg">Publicar vacante gratis</Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { JobCard } from "@/components/site/JobCard";
import { Hero } from "@/components/site/Hero";
import { AreasGrid } from "@/components/site/AreasGrid";
import { RedInstitucional } from "@/components/site/Ecosistema";
import { filtrarJobs, filtrosVacios, type Filtros } from "@/components/site/Filtros";
import { consejos } from "@/lib/data";
import { useContenido } from "@/lib/contenido";
import { useVacantes } from "@/lib/vacantes";

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero puesto={puesto} provincia={provincia} onPuesto={setPuesto} onProvincia={setProvincia} onBuscar={() => void buscar()} filtros={filtros} onFiltros={setFiltros} total={jobs.length} />
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Vacantes recientes</h2>
          <Link to="/vacantes" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold hover:border-primary hover:text-primary">Ver todas <ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-6 space-y-4">
          {cargando && (<div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Cargando vacantes…</div>)}
          {!cargando && recientes.map((job) => (<JobCard key={job.id} job={job} />))}
          {!cargando && recientes.length === 0 && (<div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{jobs.length === 0 ? "Estamos cargando nuevas vacantes. Vuelve pronto." : "No hay vacantes con esos filtros."}</div>)}
        </div>
      </section>
      <AreasGrid jobs={jobs} />
      <RedInstitucional />
      <section className="border-t border-border bg-secondary/40 px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-bold tracking-tight">Consejos para tu búsqueda</h2>
            <div className="mt-5 rounded-2xl border border-border bg-surface p-5">
              <p className="text-[15px] leading-relaxed">“{t.especialista_cita}”</p>
              <p className="mt-2 text-xs text-muted-foreground">— {t.especialista_firma}</p>
            </div>
          </div>
          <div className="grid gap-3 lg:col-span-7">
            {consejos.slice(0, 4).map((c) => (
              <Link key={c.titulo} to="/recursos" className="block rounded-2xl border border-border bg-background p-5 hover:border-primary/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">{c.categoria} · {c.minutos} min</span>
                <h3 className="mt-1 font-bold">{c.titulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.resumen}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-3xl border border-border bg-surface p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight">{t.reclutadores_titulo}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.reclutadores_texto}</p>
          </div>
          <Link to="/empresas" className="rounded-xl bg-primary px-6 py-3.5 text-center font-bold text-primary-foreground hover:brightness-110">Publicar vacante gratis</Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

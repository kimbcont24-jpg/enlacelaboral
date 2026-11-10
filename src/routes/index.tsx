import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, Loader2, Quote, UserRound } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { VacanteTarjeta } from "@/components/site/VacanteTarjeta";
import { RecibeVacantes } from "@/components/site/RecibeVacantes";
import { ExploraEmpleos } from "@/components/site/ExploraEmpleos";
import { Hero } from "@/components/site/Hero";
import { JornadasProximas } from "@/components/site/JornadasProximas";
import { EmpleoParaTodosBanda } from "@/components/site/EmpleoParaTodosBanda";
import { VentanaMarca } from "@/components/site/VentanaMarca";
import { RegaliaBanda } from "@/components/site/RegaliaBanda";
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

  const provinciasConVacantes = useMemo(() => {
    const m = new Map<string, number>();
    for (const j of jobs) m.set(j.provincia, (m.get(j.provincia) ?? 0) + 1);
    return [...m.entries()].sort((x, y) => y[1] - x[1]);
  }, [jobs]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero puesto={puesto} provincia={provincia} onPuesto={setPuesto} onProvincia={setProvincia} onBuscar={() => void buscar()} total={jobs.length} provincias={provinciasConVacantes.length} jobs={resultados} />

      <section className="border-b border-border bg-surface px-4 py-6 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          <div className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5 shadow-[var(--shadow-soft)]">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-white"><UserRound className="size-5" aria-hidden="true" /></span>
            <div>
              <p className="font-bold">¿Buscas empleo?</p>
              <p className="mt-1 text-sm text-muted-foreground">Busca, mira el salario y los requisitos, y aplica gratis. ¿Sin CV? <Link to="/cv" className="font-semibold text-primary underline">Créalo gratis en 5 minutos</Link>.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5 shadow-[var(--shadow-soft)]">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cta text-white shadow-[0_8px_16px_-8px_rgba(29,111,242,.8)]"><Building2 className="size-5" aria-hidden="true" /></span>
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
            <p className="eyebrow">Vacantes</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Empleos recientes</h2>
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

      <RegaliaBanda />
      <VentanaMarca video="https://videos.pexels.com/video-files/7692917/7692917-hd_1280_720_25fps.mp4">
        <p className="mx-auto max-w-2xl text-balance text-base font-medium leading-relaxed text-white/85 sm:text-lg">Conectamos talento con oportunidades reales en toda República Dominicana. Sin discriminación, con información clara y gratis para quien busca empleo.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/vacantes" className="inline-flex h-12 items-center rounded-xl bg-white px-6 font-bold text-[#0a2f5c] shadow-lg transition-transform hover:-translate-y-0.5">Ver empleos</Link>
          <Link to="/empresas" className="inline-flex h-12 items-center rounded-xl bg-white/15 px-6 font-bold text-white ring-1 ring-white/40 backdrop-blur transition-colors hover:bg-white/25">Publicar una vacante</Link>
        </div>
      </VentanaMarca>
      <EmpleoParaTodosBanda />
      <JornadasProximas />
      <RecibeVacantes />

      <ExploraEmpleos jobs={jobs} provincias={provinciasConVacantes} />

      <section className="cv-auto border-t border-border bg-surface py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Guías</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Consejos para tu búsqueda</h2>
            </div>
            <Link to="/recursos" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-primary">Ver todos <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <figure className="mt-4 flex gap-3 rounded-2xl bg-secondary px-4 py-3">
            <Quote className="mt-0.5 size-5 shrink-0 text-cta" aria-hidden="true" />
            <div>
              <blockquote className="text-sm leading-relaxed">{t.especialista_cita}</blockquote>
              <figcaption className="mt-1 text-xs text-muted-foreground">{t.especialista_firma}</figcaption>
            </div>
          </figure>
        </div>
        <div className="mx-auto mt-4 max-w-6xl snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-2 sm:scroll-px-6 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
          <div className="grid auto-cols-[78%] grid-flow-col gap-3 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 lg:grid-cols-4">
            {consejos.slice(0, 4).map((c) => (
              <Link key={c.titulo} to="/recursos" className="flex snap-start flex-col rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary">
                <span className="text-[11px] font-bold uppercase tracking-wide text-cta">{c.categoria} · {c.minutos} min</span>
                <h3 className="mt-1.5 text-[15px] font-bold leading-snug">{c.titulo}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{c.resumen}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="cv-auto px-4 py-8 sm:px-6 sm:py-10">
        <div className="hero-dark mx-auto flex max-w-6xl flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">{t.reclutadores_titulo}</h2>
            <p className="mt-1 text-sm text-white/80 sm:text-base">Publicar vacantes es gratis. Llega a candidatos de todo el país.</p>
          </div>
          <Link to="/empresas" className="btn-aplicar shrink-0 rounded-xl px-6 py-3 text-center">Publicar vacante gratis</Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

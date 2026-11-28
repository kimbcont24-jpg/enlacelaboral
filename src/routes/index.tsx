import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Bell, Building2, Camera, FileText, Loader2, Quote, ShieldCheck, Sparkles, UserRound, Wallet } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { VacanteTarjeta } from "@/components/site/VacanteTarjeta";
import { RecibeVacantes } from "@/components/site/RecibeVacantes";
import { ExploraEmpleos } from "@/components/site/ExploraEmpleos";
import { Hero } from "@/components/site/Hero";
import { FeriasConectadas } from "@/components/site/FeriasConectadas";
import { consejosPortada } from "@/lib/guias";
import { EmpleoParaTodosBanda } from "@/components/site/EmpleoParaTodosBanda";
import { EnlaceAnimado } from "@/components/site/EnlaceAnimado";
import { RegaliaBanda } from "@/components/site/RegaliaBanda";
import { filtrarJobs, filtrosVacios, type Filtros } from "@/components/site/Filtros";
import { useContenido } from "@/lib/contenido";
import { useVacantes } from "@/lib/vacantes";
import { PulsoHoy } from "@/components/site/PulsoHoy";
import { useAfinidades } from "@/lib/afinidad";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Empleos en República Dominicana | Enlace Laboral RD" },
      { name: "description", content: "Busca empleo en República Dominicana: vacantes reales en Santo Domingo, Santiago y todo el país, con salario visible cuando la empresa lo publica. Aplicar es gratis." },
      { property: "og:title", content: "Enlace Laboral RD · Empleos en República Dominicana" },
      { property: "og:url", content: "https://enlacelaboralrd.com/" },
    ],
    links: [{ rel: "canonical", href: "https://enlacelaboralrd.com/" }],
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
  const { perfil, mapa: afin } = useAfinidades(jobs);
  // Quien ya dijo qué busca ve primero lo suyo; los demás, lo más reciente.
  const mias = useMemo(() => [...afin.values()].sort((a, b) => b.puntos - a.puntos || b.job.creado.localeCompare(a.job.creado)).map((r) => r.job), [afin]);
  const personal = mias.length >= 3;
  const recientes = personal ? mias.slice(0, 6) : resultados.slice(0, 6);
  const nombre = perfil?.nombre.trim().split(/\s+/)[0] ?? "";

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

      <PulsoHoy jobs={jobs} className="pb-6" />


      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">{personal ? "✦ Para ti" : "Vacantes"}</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">{personal ? `${nombre ? `${nombre}, estas` : "Estas"} encajan contigo` : "Empleos recientes"}</h2>
            <p className="mt-1 text-muted-foreground">{personal ? `${mias.length} vacantes se parecen a lo que buscas${perfil?.puesto.trim() ? ` (${perfil.puesto.trim()})` : ""}. Las más parecidas primero.` : "Las últimas vacantes publicadas en Enlace Laboral."}</p>
            {!personal && !cargando && <Link to="/guardadas" search={{ ver: "parati" }} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"><Sparkles className="size-4" /> Dinos qué buscas y te mostramos las tuyas</Link>}
          </div>
          <Link to="/vacantes" className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white">{personal ? `Ver mis ${mias.length}` : "Ver todos los empleos"} <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cargando && (<div className="col-span-full flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Cargando vacantes…</div>)}
          {!cargando && recientes.map((job) => (<VacanteTarjeta key={job.id} job={job} />))}
          {!cargando && recientes.length === 0 && (<div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Estamos cargando nuevas vacantes. Vuelve pronto.</div>)}
        </div>
      </section>

      <section className="border-y border-border bg-surface px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
          {/* Candidatos: tono claro y cercano */}
          <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#cfe0fb] bg-gradient-to-br from-[#eef5ff] via-white to-[#e2edff] p-6 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-28px_rgba(10,47,92,.55)] sm:p-7">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-cta/15 blur-3xl transition-transform duration-700 group-hover:scale-125" />
            <UserRound aria-hidden="true" className="pointer-events-none absolute -bottom-6 -right-4 size-36 text-primary/[.05] transition-transform duration-500 group-hover:-rotate-6" />
            <div className="relative flex items-center gap-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:scale-105"><UserRound className="size-5" aria-hidden="true" /></span>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-cta">Para quien busca trabajo</p>
                <h2 className="text-xl font-extrabold tracking-tight text-primary sm:text-2xl">¿Buscas empleo?</h2>
              </div>
            </div>
            <p className="relative mt-4 text-[15px] leading-relaxed text-muted-foreground">Mira los requisitos, cómo aplicar y el salario cuando la empresa lo publica, <span className="font-semibold text-foreground">antes</span> de aplicar. Sin adivinanzas y sin pagar nada.</p>
            <ul className="relative mt-4 flex flex-wrap gap-2 text-xs font-bold text-primary">
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-[#cfe0fb]"><Wallet className="size-3.5 text-[#0f7a43]" aria-hidden="true" /> Filtra las que traen salario</li>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-[#cfe0fb]"><BadgeCheck className="size-3.5 text-cta" aria-hidden="true" /> Aplicas gratis</li>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-[#cfe0fb]"><FileText className="size-3.5 text-cta" aria-hidden="true" /> CV en 5 minutos</li>
            </ul>
            <div className="relative mt-auto flex flex-wrap items-center gap-2.5 pt-6">
              <Link to="/vacantes" className="group/b inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#0f4aa8]">Ver empleos <ArrowRight className="size-4 transition-transform group-hover/b:translate-x-1" aria-hidden="true" /></Link>
              <Link to="/cv" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-primary ring-1 ring-[#bcd3f7] transition hover:ring-primary">Crear mi CV gratis</Link>
            </div>
            <p className="relative mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Bell className="size-3.5 shrink-0 text-cta" aria-hidden="true" /><span><Link to="/cuenta" className="font-bold text-primary hover:underline">Crea tu cuenta</Link> y te avisamos de vacantes para ti.</span></p>
          </article>

          {/* Empresas: tono institucional, azul de marca */}
          <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a2f5c] via-[#0f4aa8] to-[#1d6ff2] p-6 text-white shadow-[0_24px_48px_-28px_rgba(10,47,92,.9)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_60px_-28px_rgba(10,47,92,1)] sm:p-7">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.08] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-16 size-64 rounded-full bg-[#8fc1ff]/25 blur-3xl transition-transform duration-700 group-hover:scale-125" />
            <Building2 aria-hidden="true" className="pointer-events-none absolute -bottom-6 -right-4 size-36 text-white/[.07] transition-transform duration-500 group-hover:rotate-6" />
            <div className="relative flex items-center gap-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-[#0a2f5c] shadow-lg ring-4 ring-white/20 transition-transform duration-300 group-hover:scale-105"><Building2 className="size-5" aria-hidden="true" /></span>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#a9d0ff]">Para empresas e instituciones</p>
                <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">¿Necesitas talento?</h2>
              </div>
            </div>
            <p className="relative mt-4 text-[15px] leading-relaxed text-white/85">Publica tus vacantes gratis y llega a candidatos de todo el país, con información clara desde el primer día.</p>
            <ul className="relative mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 ring-1 ring-white/25 backdrop-blur"><BadgeCheck className="size-3.5 text-[#a9d0ff]" aria-hidden="true" /> Publicar es gratis</li>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 ring-1 ring-white/25 backdrop-blur"><Camera className="size-3.5 text-[#a9d0ff]" aria-hidden="true" /> Sube la foto del flyer</li>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 ring-1 ring-white/25 backdrop-blur"><ShieldCheck className="size-3.5 text-[#a9d0ff]" aria-hidden="true" /> Revisamos cada vacante</li>
            </ul>
            <div className="relative mt-auto flex flex-wrap items-center gap-2.5 pt-6">
              <Link to="/empresas" className="group/b inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#0a2f5c] shadow-md transition hover:bg-[#eef5ff]">Publicar vacante <ArrowRight className="size-4 transition-transform group-hover/b:translate-x-1" aria-hidden="true" /></Link>
            </div>
            {jobs.length > 0 && (
              <p className="relative mt-3 text-xs text-white/75">Tu vacante se suma a <span className="font-bold text-white">{jobs.length.toLocaleString("es-DO")} empleos</span> que la gente ya está viendo.</p>
            )}
          </article>
        </div>
      </section>

      <RegaliaBanda />
      <EmpleoParaTodosBanda />
      <FeriasConectadas />
      <RecibeVacantes />

      <ExploraEmpleos jobs={jobs} provincias={provinciasConVacantes} />

      <EnlaceAnimado ondas className="mb-12" video="/video/apreton-1280.mp4" credito="Video: Yan Krukau · Pexels">
        <p className="mx-auto max-w-2xl text-balance text-lg font-semibold leading-relaxed text-white/90 sm:text-xl">Conectamos talento con oportunidades reales en toda República Dominicana. Sin discriminación, con información clara y gratis para quien busca empleo.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/vacantes" className="inline-flex h-12 items-center rounded-xl bg-white px-6 font-bold text-[#0a2f5c] shadow-lg transition-transform hover:-translate-y-0.5">Ver empleos</Link>
          <Link to="/empresas" className="inline-flex h-12 items-center rounded-xl bg-white/15 px-6 font-bold text-white ring-1 ring-white/40 backdrop-blur transition-colors hover:bg-white/25">Publicar una vacante</Link>
        </div>
      </EnlaceAnimado>
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
            {consejosPortada.map((c) => (
              <Link key={c.id} to="/recursos" hash={c.id} className="flex snap-start flex-col rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary">
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

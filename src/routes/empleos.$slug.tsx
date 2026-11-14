import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { AlertaForm } from "@/components/site/AlertaForm";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { JobCard } from "@/components/site/JobCard";
import { CONCURSA_GUIA, CONCURSA_URL, colecciones } from "@/lib/colecciones";
import { descripcionLanding, empresasActivas, filtrarLanding, landingsArea, landingsProvincia, resolverLanding, tituloLanding } from "@/lib/empleos";
import { fetchPublicadas, SITIO } from "@/lib/vacantes";

export const Route = createFileRoute("/empleos/$slug")({
  loader: async ({ params }) => {
    const jobs = await fetchPublicadas().catch(() => []);
    const landing = resolverLanding(params.slug, jobs);
    if (!landing) throw notFound();
    const lista = filtrarLanding(landing, jobs);
    return { landing, lista, empresas: empresasActivas(jobs).slice(0, 12) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Página no encontrada | Enlace Laboral" }, { name: "robots", content: "noindex" }] };
    const { landing, lista } = loaderData;
    const title = `${tituloLanding(landing)}${lista.length ? ` (${lista.length})` : ""} | Enlace Laboral`;
    const desc = descripcionLanding(landing, lista.length);
    return {
      meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }, ...(lista.length === 0 ? [{ name: "robots", content: "noindex, follow" }] : [])],
      links: [{ rel: "canonical", href: `${SITIO}/empleos/${landing.slug}` }],
    };
  },
  component: Empleos,
});

function Empleos() {
  const { landing, lista, empresas } = Route.useLoaderData();
  const titulo = tituloLanding(landing);
  const area = landing.tipo === "area" ? landing.nombre : "";
  const provincia = landing.tipo === "provincia" && landing.nombre !== "Remoto desde RD" ? landing.nombre : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <nav aria-label="Ruta" className="text-sm text-muted-foreground"><Link to="/" className="hover:text-primary">Inicio</Link> › <Link to="/vacantes" className="hover:text-primary">Vacantes</Link> › <span className="text-foreground">{titulo}</span></nav>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">{titulo}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{descripcionLanding(landing, lista.length)}</p>
        {landing.tipo === "empresa" && (
          <Link to="/empresa/$id" params={{ id: landing.slug }} className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-[#1557c4] hover:border-[#1d6ff2]">Ver perfil de {landing.nombre}: opiniones y calificaciones →</Link>
        )}
        {landing.slug === "sector-publico" && <ComoAplicarEstado />}

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <section className="min-w-0 lg:col-span-8" aria-label="Vacantes">
            {lista.length > 0 ? (
              <>
                <div className="space-y-4">{lista.slice(0, 40).map((job) => <JobCard key={job.id} job={job} />)}</div>
                {lista.length > 40 && <p className="mt-6 text-center text-sm text-muted-foreground">Mostrando 40 de {lista.length}. <Link to="/vacantes" className="font-semibold text-primary underline">Ver todas las vacantes</Link> y filtrar.</p>}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <p className="font-bold">Ahora mismo no hay vacantes aquí</p>
                <p className="mt-2 text-sm text-muted-foreground">Crea una alerta y te escribimos cuando salga una. Mientras, mira <Link to="/vacantes" className="font-semibold text-primary underline">todas las vacantes</Link>.</p>
              </div>
            )}
            <div className="mt-8"><AlertaForm areaInicial={area} provinciaInicial={provincia} /></div>
          </section>

          <aside className="space-y-6 lg:col-span-4">
            <CanalWhatsApp variante="tarjeta" />
            <nav className="rounded-2xl border border-border bg-surface p-5" aria-label="Empleos por tipo de oportunidad">
              <p className="font-bold">Por tipo de oportunidad</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {colecciones.map((c) => <li key={c.slug}><Link to="/empleos/$slug" params={{ slug: c.slug }} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium hover:border-primary hover:text-primary ${c.slug === landing.slug ? "border-primary bg-secondary text-primary" : "border-border"}`}><span aria-hidden="true" className="size-2 rounded-full" style={{ background: c.color }} />{c.nombre}</Link></li>)}
              </ul>
            </nav>
            <nav className="rounded-2xl border border-border bg-surface p-5" aria-label="Empleos por provincia">
              <p className="font-bold">Por provincia</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {landingsProvincia.map((l) => <li key={l.slug}><Link to="/empleos/$slug" params={{ slug: l.slug }} className={`inline-block rounded-full border px-3 py-1 text-sm font-medium hover:border-primary hover:text-primary ${l.slug === landing.slug ? "border-primary bg-secondary text-primary" : "border-border"}`}>{l.nombre.replace(/\s*\(.*?\)/, "").replace("Remoto desde RD", "Desde casa")}</Link></li>)}
              </ul>
            </nav>
            <nav className="rounded-2xl border border-border bg-surface p-5" aria-label="Empleos por área">
              <p className="font-bold">Por área</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {landingsArea.map((l) => <li key={l.slug}><Link to="/empleos/$slug" params={{ slug: l.slug }} className={`inline-block rounded-full border px-3 py-1 text-sm font-medium hover:border-primary hover:text-primary ${l.slug === landing.slug ? "border-primary bg-secondary text-primary" : "border-border"}`}>{l.nombre}</Link></li>)}
              </ul>
            </nav>
            {empresas.length > 0 && (
              <nav className="rounded-2xl border border-border bg-surface p-5" aria-label="Empresas que están contratando">
                <p className="font-bold">Empresas contratando</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {empresas.map((e) => <li key={e.slug}><Link to="/empresa/$id" params={{ id: e.slug }} className="flex justify-between gap-2 hover:text-primary"><span className="truncate">{e.nombre}</span><span className="text-muted-foreground">{e.total}</span></Link></li>)}
                </ul>
              </nav>
            )}
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/** Guía corta para entrar al Estado: casi todas las plazas se concursan por el portal Concursa del MAP. */
function ComoAplicarEstado() {
  const pasos = [
    ["Crea tu perfil en Concursa", "Es el portal oficial de concursos públicos del Ministerio de Administración Pública (MAP). Las postulaciones a concursos son solo por ahí, no en persona."],
    ["Carga tus documentos", "Cédula, títulos y certificaciones. Los avisos suelen pedir ser dominicano/a y no estar jubilado/a ni pensionado/a por el Estado."],
    ["Aplica dentro del plazo", "Cada aviso trae fechas exactas para enviar documentos. Si se pasa la fecha, el sistema ya no te deja aplicar."],
    ["Mira si es plaza o registro", "Algunos concursos cubren una vacante de inmediato; otros forman un «registro de elegibles» para plazas futuras."],
  ];
  return (
    <section aria-label="Cómo aplicar a empleos del Estado" className="relative mt-6 overflow-hidden rounded-3xl bg-[#0a2f5c] p-6 text-white sm:p-7">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-[#c8102e]" />
      <p className="text-xs font-bold uppercase tracking-wider text-white/70">Antes de aplicar</p>
      <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">Cómo entrar a trabajar en el Estado</h2>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pasos.map(([t, d], i) => (
          <li key={t} className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
            <span className="grid size-7 place-items-center rounded-full bg-[#c8102e] text-sm font-extrabold">{i + 1}</span>
            <p className="mt-2 font-bold leading-tight">{t}</p>
            <p className="mt-1 text-sm text-white/75">{d}</p>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <a href={CONCURSA_URL} target="_blank" rel="noopener" className="inline-flex h-11 items-center rounded-xl bg-white px-5 font-bold text-[#0a2f5c]">Ir a Concursa (MAP)</a>
        <a href={CONCURSA_GUIA} target="_blank" rel="noopener" className="inline-flex h-11 items-center rounded-xl bg-white/10 px-5 font-bold ring-1 ring-white/30 hover:bg-white/20">Guía oficial para ciudadanos (PDF)</a>
      </div>
      <p className="mt-4 text-xs text-white/60">Nadie puede cobrarte por «conseguirte» una plaza pública. Si alguien te pide dinero, no es un proceso oficial.</p>
    </section>
  );
}

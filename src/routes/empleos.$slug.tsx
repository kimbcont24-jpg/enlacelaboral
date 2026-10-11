import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { AlertaForm } from "@/components/site/AlertaForm";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { JobCard } from "@/components/site/JobCard";
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

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <section className="min-w-0 lg:col-span-8" aria-label="Vacantes">
            {lista.length > 0 ? (
              <div className="space-y-4">{lista.map((job) => <JobCard key={job.id} job={job} />)}</div>
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
                  {empresas.map((e) => <li key={e.slug}><Link to="/empleos/$slug" params={{ slug: e.slug }} className="flex justify-between gap-2 hover:text-primary"><span className="truncate">{e.nombre}</span><span className="text-muted-foreground">{e.total}</span></Link></li>)}
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

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

import { AdminAcciones } from "@/components/site/AdminAcciones";
import { useApply } from "@/components/site/apply-context";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { fetchVacante } from "@/lib/vacantes";

export const Route = createFileRoute("/vacantes/$id")({
  loader: async ({ params }) => {
    const job = await fetchVacante(params.id);
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Vacante no disponible | Enlace Laboral" }, { name: "robots", content: "noindex" }] };
    const { job } = loaderData;
    const title = `${job.titulo} en ${job.provincia} | Enlace Laboral`;
    const desc = `${job.titulo} · ${job.empresa} · ${job.modalidad} en ${job.provincia}. ${job.salario}.`;
    return { meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }] };
  },
  component: Detalle,
});

function Detalle() {
  const { job } = Route.useLoaderData();
  const aplicar = useApply();
  const fecha = new Date(job.creado).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pb-24 pt-10 lg:grid-cols-12">
        <article className="min-w-0 lg:col-span-8">
          <Link to="/vacantes" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">← Volver a vacantes</Link>
          <AdminAcciones job={job} volverAlListado />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">{job.titulo}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{job.empresa} • {job.provincia}</p>
          <p className={`mt-4 text-2xl font-extrabold ${job.salarioMin > 0 ? "text-success" : "text-muted-foreground"}`}>{job.salario}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
            {[job.modalidad, job.tipo, `Experiencia: ${job.experiencia}`, job.area, `Publicada el ${fecha}`].map((x) => (<span key={x} className="rounded-full border border-border px-3 py-1">{x}</span>))}
          </div>
          {job.requisitos.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-bold">Requisitos</h2>
              <ul className="mt-3 space-y-2 text-muted-foreground">{job.requisitos.map((r) => (<li key={r} className="flex gap-2"><span className="text-primary">✓</span> {r}</li>))}</ul>
            </>
          )}
          {job.descripcion && (
            <>
              <h2 className="mt-10 text-xl font-bold">Detalles de la vacante</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{job.descripcion}</p>
            </>
          )}
        </article>
        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-3xl border border-border bg-surface p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Fuente original</p>
            <p className="mt-1 font-bold">{job.fuente}</p>
            {job.fuenteUrl && (<a href={job.fuenteUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Ver publicación original <ExternalLink className="size-3.5" /></a>)}
            <p className="mt-4 text-sm text-muted-foreground">Enlace RD republica esta vacante para facilitar tu búsqueda. Confirma los detalles con la empresa. Nunca pagues dinero para ser contratado.</p>
            <button onClick={() => aplicar(job)} className="grad-primary mt-5 w-full rounded-xl py-3.5 text-base font-bold text-primary-foreground">Cómo aplicar</button>
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  );
}

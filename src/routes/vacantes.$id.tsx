import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CheckCircle2, Circle, ExternalLink, Share2 } from "lucide-react";

import { AdminAcciones } from "@/components/site/AdminAcciones";
import { useApply } from "@/components/site/apply-context";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { enlaceWhatsApp, fetchVacante, jobPostingLd, useVacantes } from "@/lib/vacantes";
import { claridad } from "@/lib/claridad";
import { BotonGuardar, ClaridadPill, JobCard } from "@/components/site/JobCard";
import { AlertaForm } from "@/components/site/AlertaForm";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";

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
    const ld = jobPostingLd(job);
    const vencida = Date.now() - new Date(job.creado).getTime() > 30 * 864e5 || job.estado !== "publicada";
    return {
      meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }, { property: "og:type", content: "website" }, ...(vencida ? [{ name: "robots", content: "noindex" }] : [])],
      scripts: ld && !vencida ? [{ type: "application/ld+json", children: ld }] : [],
    };
  },
  component: Detalle,
});

function Detalle() {
  const { job } = Route.useLoaderData();
  const aplicar = useApply();
  const fecha = new Date(job.creado).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  const c = claridad(job);
  const { jobs } = useVacantes();
  const similares = jobs.filter((j) => j.id !== job.id && (j.area === job.area || j.provincia === job.provincia)).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pb-32 pt-10 lg:grid-cols-12 lg:pb-24">
        <article className="min-w-0 lg:col-span-8">
          <Link to="/vacantes" className="text-sm font-semibold text-muted-foreground hover:text-primary">← Volver a vacantes</Link>
          <AdminAcciones job={job} volverAlListado />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">{job.titulo}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{job.empresa} • {job.provincia}</p>
          <ClaridadPill job={job} className="mt-3" />
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
          <section className="mt-10 rounded-2xl border border-border bg-surface p-5" aria-labelledby="claridad-titulo">
            <h2 id="claridad-titulo" className="text-lg font-bold">Índice de claridad: {c.nivel.toLowerCase()} ({c.puntos} de {c.total})</h2>
            <p className="mt-1 text-sm text-muted-foreground">Lo medimos con lo que la vacante dice. Mientras más completa, menos sorpresas al aplicar.</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {c.tiene.map((x) => <li key={x} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-success" aria-hidden="true" /> {x}</li>)}
              {c.falta.map((x) => <li key={x} className="flex items-center gap-2 text-sm text-muted-foreground"><Circle className="size-4" aria-hidden="true" /> {x}: no lo indica</li>)}
            </ul>
          </section>
          {similares.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold">Vacantes parecidas</h2>
              <div className="mt-4 space-y-3">{similares.map((j) => <JobCard key={j.id} job={j} />)}</div>
            </section>
          )}
          <section className="mt-12"><AlertaForm areaInicial={job.area} provinciaInicial={job.provincia} /></section>
        </article>
        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-3xl border border-border bg-surface p-6">
            <p className="text-sm font-semibold text-muted-foreground">Fuente original</p>
            <p className="mt-1 font-bold">{job.fuente}</p>
            {job.fuenteUrl && (<a href={job.fuenteUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Ver publicación original <ExternalLink className="size-3.5" /></a>)}
            <p className="mt-4 text-sm text-muted-foreground">Enlace Laboral republica esta vacante para facilitar tu búsqueda. Confirma los detalles con la empresa. Nunca pagues dinero para ser contratado.</p>
            <button onClick={() => aplicar(job)} className="btn-aplicar mt-5 w-full rounded-xl py-3.5 text-lg">Aplicar a esta vacante</button>
            <div className="mt-3"><BotonGuardar id={job.id} grande /></div>
            <div className="mt-3"><CanalWhatsApp variante="boton" /></div>
            <a href={enlaceWhatsApp(job)} target="_blank" rel="noopener noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold hover:border-primary hover:text-primary"><Share2 className="size-4" /> Compartir por WhatsApp</a>
          </div>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{job.titulo}</p>
            <p className={`truncate text-xs font-semibold ${job.salarioMin > 0 ? "text-success" : "text-muted-foreground"}`}>{job.salario}</p>
          </div>
          <button onClick={() => aplicar(job)} className="btn-aplicar shrink-0 rounded-xl px-6 py-3 text-base">Aplicar</button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Briefcase, CalendarClock, CalendarDays, Calculator, ArrowLeft, Check, CheckCircle2, Circle, ExternalLink, FileText, GraduationCap, Layers, Link2, Mail, MapPin, MessageCircle, Monitor, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

import { AdminAcciones } from "@/components/site/AdminAcciones";
import { useApply } from "@/components/site/apply-context";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { enlaceAplicar, fetchVacante, jobPostingLd, SITIO, useVacantes, type Vacante } from "@/lib/vacantes";
import { claridad } from "@/lib/claridad";
import { slug } from "@/lib/empleos";
import { diasRestantes, esNueva, nivelDe, venceTexto } from "@/lib/claridad";
import { BotonGuardar, ClaridadPill, JobCard } from "@/components/site/JobCard";
import { AlertaForm } from "@/components/site/AlertaForm";
import { CompartirBoton } from "@/components/site/CompartirBoton";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";
import { ReportarVacante } from "@/components/site/ReportarVacante";

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
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc }, { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITIO}/vacantes/${job.id}` },
        { property: "og:image", content: `${SITIO}/og/vacantes/${job.id}.png` }, { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:image", content: `${SITIO}/og/vacantes/${job.id}.png` },
        ...(vencida ? [{ name: "robots", content: "noindex" }] : []),
      ],
      scripts: ld && !vencida ? [{ type: "application/ld+json", children: ld }] : [],
    };
  },
  component: Detalle,
});

type Bloque = { tipo: "p"; texto: string } | { tipo: "ul"; items: string[] };

/** Convierte el texto de la vacante en párrafos y listas, para que se lea fácil en el celular. */
function bloques(texto: string): Bloque[] {
  const out: Bloque[] = [];
  for (const raw of texto.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l) continue;
    const m = l.match(/^(?:[-•*▪●✓✔]|\d+[.)])\s+(.*)$/);
    if (m) {
      const ult = out[out.length - 1];
      if (ult?.tipo === "ul") ult.items.push(m[1]);
      else out.push({ tipo: "ul", items: [m[1]] });
    } else out.push({ tipo: "p", texto: l });
  }
  return out;
}

/** Dice con claridad qué pasa al tocar "Aplicar", según cómo recibe candidatos la empresa. */
function comoAplicar(job: Vacante): { Icono: typeof Mail; texto: string } {
  const e = enlaceAplicar(job.aplicar);
  if (!e) return { Icono: FileText, texto: "Dejas tu nombre y tu contacto en un formulario corto. Puedes incluir tu CV. No necesitas crear cuenta." };
  if (e.href.startsWith("mailto:")) return { Icono: Mail, texto: "Envías tu CV por correo a la empresa. Te mostramos a qué dirección." };
  if (e.href.includes("wa.me")) return { Icono: MessageCircle, texto: "Le escribes a la empresa por WhatsApp. Te abrimos el chat." };
  return { Icono: Link2, texto: "Sigues el enlace de la empresa para aplicar en su propio sitio." };
}

function Dato({ Icono, etiqueta, valor, alerta = false }: { Icono: typeof Mail; etiqueta: string; valor: string; alerta?: boolean }) {
  return (
    <div className="flex items-start gap-3 p-4">
      <span aria-hidden="true" className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Icono className="size-[18px]" /></span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-muted-foreground">{etiqueta}</dt>
        <dd className={`mt-0.5 text-sm font-bold leading-snug ${alerta ? "text-destructive" : ""}`}>{valor}</dd>
      </div>
    </div>
  );
}

function Sueldo({ job }: { job: Vacante }) {
  if (job.salarioMin <= 0) {
    return (
      <div>
        <p className="text-2xl font-extrabold text-muted-foreground">Salario no publicado</p>
        <p className="mt-1 text-sm text-muted-foreground">La empresa no lo indica. Pregúntalo antes de ir a una entrevista.</p>
      </div>
    );
  }
  const [min, max] = job.salario.split(" - ");
  return (
    <div>
      <p className="text-[2.5rem] font-extrabold leading-none tracking-tight text-success tabular-nums">{min}</p>
      <p className="mt-1.5 text-lg font-bold text-success tabular-nums">{max ? `a ${max}` : ""}<span className="text-sm font-semibold text-muted-foreground">{max ? " " : ""}al mes</span></p>
    </div>
  );
}

function Detalle() {
  const { job } = Route.useLoaderData();
  const aplicar = useApply();
  const fecha = new Date(job.creado).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  const c = claridad(job);
  const { jobs } = useVacantes();
  const similares = jobs.filter((j) => j.id !== job.id && (j.area === job.area || j.provincia === job.provincia)).slice(0, 3);
  const { Icono: IconoAplicar, texto: textoAplicar } = comoAplicar(job);
  const sinEmpresa = job.empresa === "Empresa no indicada";
  const urgente = diasRestantes(job) <= 5;
  const secciones = job.descripcion ? bloques(job.descripcion) : [];

  // La barra de abajo (celular) aparece solo cuando el botón grande ya no se ve.
  const botonRef = useRef<HTMLButtonElement>(null);
  const [barra, setBarra] = useState(false);
  useEffect(() => {
    const el = botonRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const o = new IntersectionObserver(([e]) => setBarra(!e.isIntersecting), { threshold: 0 });
    o.observe(el);
    return () => o.disconnect();
  }, [job.id]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="hero-dark pb-16 pt-6 lg:pb-28 lg:pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link to="/vacantes" className="inline-flex items-center gap-1.5 rounded-lg py-1 text-sm font-semibold text-white/75 hover:text-white"><ArrowLeft className="size-4" aria-hidden="true" /> Volver a vacantes</Link>
          <div className="mt-5 flex items-start gap-4 lg:max-w-[calc(66.666%-1.5rem)]">
            <EmpresaAvatar nombre={job.empresa} claro className="size-14 text-2xl sm:size-16 sm:text-3xl" />
            <div className="min-w-0">
              {(job.destacada || esNueva(job)) && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {job.destacada && <span className="rounded-full bg-[#ffd84d] px-2.5 py-0.5 text-xs font-extrabold text-[#3d2f00]">Destacada</span>}
                  {esNueva(job) && <span className="vidrio rounded-full px-2.5 py-0.5 text-xs font-bold text-white">Nueva</span>}
                </div>
              )}
              <h1 className="text-[1.75rem] font-extrabold leading-[1.15] tracking-tight text-balance sm:text-4xl lg:text-[2.6rem]">{job.titulo}</h1>
              <p className="mt-2 text-base text-white/85 sm:text-lg">
                {sinEmpresa ? job.empresa : <Link to="/empleos/$slug" params={{ slug: slug(job.empresa) }} className="font-semibold underline-offset-4 hover:underline">{job.empresa}</Link>}
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/85">
                <Link to="/empleos/$slug" params={{ slug: slug(job.provincia.replace(/\s*\(.*?\)\s*/g, "").replace("Remoto desde RD", "Remoto")) }} className="inline-flex items-center gap-1.5 hover:text-white hover:underline"><MapPin className="size-4" aria-hidden="true" /> {job.provincia}</Link>
                <span className="inline-flex items-center gap-1.5"><Monitor className="size-4" aria-hidden="true" /> {job.modalidad}</span>
                <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" aria-hidden="true" /> {job.tipo}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pb-32 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:pb-24">
        <aside className="-mt-10 lg:order-2 lg:col-span-4 lg:-mt-24">
          <div className="entra lg:sticky lg:top-20">
            <div className="rounded-3xl border border-t-[6px] border-border border-t-[#ffd84d] bg-surface shadow-[0_24px_48px_-24px_rgb(10_47_92/0.45)]">
              <div className="p-6 pb-5">
                <p className="mb-2 text-sm font-semibold text-muted-foreground">Sueldo</p>
                <Sueldo job={job} />
                {job.salarioMin > 0 && (
                  <Link to="/herramientas/salario-neto" search={{ bruto: job.salarioMin }} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><Calculator className="size-4" aria-hidden="true" /> Calcula cuánto te llega</Link>
                )}
              </div>
              <div className="relative h-0" aria-hidden="true">
                <div className="absolute inset-x-5 border-t-2 border-dashed border-border" />
                <span className="absolute -left-3 -top-3 size-6 rounded-full border-r border-border bg-background" />
                <span className="absolute -right-3 -top-3 size-6 rounded-full border-l border-border bg-background" />
              </div>
              <div className="p-6 pt-5">
                <p className="flex items-start gap-2.5 text-sm leading-snug text-muted-foreground"><IconoAplicar className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden="true" /> {textoAplicar}</p>
                <button ref={botonRef} onClick={() => aplicar(job)} className="btn-aplicar mt-4 h-14 w-full rounded-2xl text-lg">Aplicar a esta vacante</button>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1"><BotonGuardar id={job.id} grande /></div>
                  <CompartirBoton job={job} className="h-11 flex-1" />
                </div>
              </div>
            </div>
            <div className="mt-4 hidden lg:block"><CanalWhatsApp variante="boton" /></div>
          </div>
        </aside>

        <article className="min-w-0 lg:order-1 lg:col-span-8 lg:pt-10">
          <AdminAcciones job={job} volverAlListado />

          <dl className="grid grid-cols-2 divide-border overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-4 [&>div]:border-b [&>div]:border-border [&>div:nth-child(2n)]:border-l sm:[&>div:nth-child(2n)]:border-l-0 sm:[&>div:not(:nth-child(4n+1))]:border-l [&>div:nth-last-child(-n+2)]:border-b-0 sm:[&>div:nth-last-child(-n+4)]:border-b-0">
            <Dato Icono={GraduationCap} etiqueta="Experiencia" valor={job.experiencia} />
            <Dato Icono={Layers} etiqueta="Área" valor={job.area} />
            <Dato Icono={TrendingUp} etiqueta="Nivel" valor={nivelDe(job)} />
            <Dato Icono={CalendarDays} etiqueta="Publicada" valor={fecha} />
            <Dato Icono={CalendarClock} etiqueta="Vigencia" valor={venceTexto(job)} alerta={urgente} />
            <Dato Icono={Briefcase} etiqueta="Contrato" valor={job.tipo} />
            <Dato Icono={Monitor} etiqueta="Modalidad" valor={job.modalidad} />
            <Dato Icono={MapPin} etiqueta="Dónde" valor={job.provincia} />
          </dl>

          {job.requisitos.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-extrabold">Lo que piden</h2>
              <ul className="mt-4 space-y-3">
                {job.requisitos.map((r) => (
                  <li key={r} className="flex items-start gap-3 leading-snug">
                    <span aria-hidden="true" className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/12 text-success"><Check className="size-3.5" strokeWidth={3} /></span>
                    <span className="min-w-0 [overflow-wrap:anywhere]">{r}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {secciones.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-extrabold">Sobre el puesto</h2>
              <div className="mt-4 max-w-[68ch] space-y-4 text-[1.0625rem] leading-relaxed text-foreground/85">
                {secciones.map((b, i) => b.tipo === "p"
                  ? <p key={i} className="[overflow-wrap:anywhere]">{b.texto}</p>
                  : <ul key={i} className="space-y-2">{b.items.map((x, j) => <li key={j} className="flex gap-3"><span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-primary" /><span className="min-w-0 [overflow-wrap:anywhere]">{x}</span></li>)}</ul>)}
              </div>
            </section>
          )}

          {job.imagen && (
            <section className="mt-10" aria-labelledby="img-orig">
              <h2 id="img-orig" className="text-xl font-extrabold">Publicación original</h2>
              <a href={job.imagen} target="_blank" rel="noopener noreferrer" className="mt-4 block max-w-md overflow-hidden rounded-2xl border border-border bg-surface" aria-label="Abrir la imagen original en tamaño completo">
                <img src={job.imagen} alt={`Publicación original de la vacante ${job.titulo}`} loading="lazy" className="w-full object-contain" />
              </a>
              <p className="mt-2 text-sm text-muted-foreground">Toca la imagen para verla completa.</p>
            </section>
          )}

          <section className="mt-10 rounded-2xl bg-secondary/70 p-5 sm:p-6" aria-labelledby="seguro">
            <h2 id="seguro" className="flex items-center gap-2 text-lg font-extrabold"><ShieldCheck className="size-5 text-primary" aria-hidden="true" /> Antes de aplicar</h2>
            <ul className="mt-3 space-y-2 text-sm leading-snug text-foreground/85">
              <li>Una empresa seria no te cobra para contratarte. Si te piden dinero, no sigas y repórtalo.</li>
              <li>Confirma el nombre de la empresa y a quién le mandas tus datos.</li>
              <li>Enlace Laboral republica esta vacante. Los detalles finales los confirma la empresa.</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Fuente: <span className="font-semibold text-foreground">{job.fuente}</span>
              {job.fuenteUrl && (<> — <a href={job.fuenteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">ver publicación original <ExternalLink className="size-3.5" aria-hidden="true" /></a></>)}
            </p>
            <ReportarVacante id={job.id} />
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-surface p-5" aria-labelledby="claridad-titulo">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="claridad-titulo" className="flex items-center gap-2 text-lg font-extrabold"><Sparkles className="size-5 text-primary" aria-hidden="true" /> Qué tan completa está ({c.puntos} de {c.total})</h2>
              <ClaridadPill job={job} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Mientras más completa la vacante, menos sorpresas al aplicar.</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {c.tiene.map((x) => <li key={x} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" /> {x}</li>)}
              {c.falta.map((x) => <li key={x} className="flex items-center gap-2 text-sm text-muted-foreground"><Circle className="size-4 shrink-0" aria-hidden="true" /> {x}: no lo indica</li>)}
            </ul>
          </section>

          <div className="mt-8 lg:hidden"><CanalWhatsApp variante="tarjeta" /></div>

          {similares.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-extrabold">Vacantes parecidas</h2>
              <div className="mt-4 space-y-3">{similares.map((j) => <JobCard key={j.id} job={j} />)}</div>
            </section>
          )}
          <section className="mt-12"><AlertaForm areaInicial={job.area} provinciaInicial={job.provincia} /></section>
        </article>
      </div>

      <div
        aria-hidden={!barra}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(20_33_58/0.25)] backdrop-blur transition-transform duration-300 lg:hidden ${barra ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
      >
        <div className="mx-auto flex max-w-xl items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-extrabold ${job.salarioMin > 0 ? "text-success" : "text-muted-foreground"}`}>{job.salario}</p>
            <p className="truncate text-xs text-muted-foreground">{job.titulo}</p>
          </div>
          <div className="[&_button]:size-12"><BotonGuardar id={job.id} /></div>
          <button tabIndex={barra ? 0 : -1} onClick={() => aplicar(job)} className="btn-aplicar h-12 shrink-0 rounded-xl px-6 text-base">Aplicar</button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

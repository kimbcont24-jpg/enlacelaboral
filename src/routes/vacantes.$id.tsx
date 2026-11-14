import { CalificacionCorta } from "@/components/empresa/CalificacionCorta";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Briefcase, Building2, CalendarClock, CalendarDays, Calculator, ArrowLeft, CheckCircle2, ChevronRight, Circle, ExternalLink, FileText, GraduationCap, Image as ImageIcon, Layers, Link2, Mail, MapPin, MessageCircle, Monitor, Radar, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

import { AdminAcciones } from "@/components/site/AdminAcciones";
import { InclusionBloque } from "@/components/site/InclusionPills";
import { useApply } from "@/components/site/apply-context";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { enlaceAplicar, fetchVacante, jobPostingLd, SITIO, useVacantes, type Vacante } from "@/lib/vacantes";
import { claridad } from "@/lib/claridad";
import { slug } from "@/lib/empleos";
import { diasRestantes, esNueva, nivelDe, venceTexto } from "@/lib/claridad";
import { BotonGuardar, ClaridadPill } from "@/components/site/JobCard";
import { VacanteTarjeta } from "@/components/site/VacanteTarjeta";
import { senalesEmpresa, useEmpresaPublica } from "@/lib/empresa-publica";
import { AlertaForm } from "@/components/site/AlertaForm";
import { CompartirBoton } from "@/components/site/CompartirBoton";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";
import { ReportarVacante } from "@/components/site/ReportarVacante";
import { registrarVista } from "@/lib/vistas";
import { ContactoDirecto, tieneContactoDirecto } from "@/components/site/ContactoDirecto";
import { revisarVacante } from "@/lib/inclusion";
import { empresaOculta, nombreEmpresa, presentar } from "@/lib/presentar";
import { Beneficios, Funciones, Notas, PasosAplicar, Requisitos, Seccion, SeccionTitulo, Vigencia } from "@/components/site/VacanteSecciones";

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
    const desc = `${job.titulo} · ${job.empresa} · ${job.modalidad} en ${job.provincia}.${job.salario ? " " + job.salario + "." : ""}`;
    const ld = jobPostingLd(job);
    const vencida = Date.now() - new Date(job.creado).getTime() > 30 * 864e5 || job.estado !== "publicada";
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc }, { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITIO}/vacantes/${job.id}` },
        { property: "og:image", content: `${SITIO}/og/vacantes/${job.id}.png` }, { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" }, { property: "og:image:alt", content: `Vacante: ${job.titulo} · ${job.empresa} · ${job.provincia}` },
        { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:image", content: `${SITIO}/og/vacantes/${job.id}.png` },
        ...(vencida ? [{ name: "robots", content: "noindex" }] : []),
      ],
      links: [{ rel: "canonical", href: `${SITIO}/vacantes/${job.id}` }],
      scripts: ld && !vencida ? [{ type: "application/ld+json", children: ld }] : [],
    };
  },
  component: Detalle,
});

/** Párrafos cortos para leer cómodo: si un párrafo es muy largo, se parte en oraciones agrupadas. */
function parrafos(textos: string[]): string[] {
  const out: string[] = [];
  for (const t of textos) {
    if (t.length < 320) { out.push(t); continue; }
    const os = t.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/);
    let actual = "";
    for (const o of os) { if ((actual + " " + o).length > 260 && actual) { out.push(actual.trim()); actual = o; } else actual += " " + o; }
    if (actual.trim()) out.push(actual.trim());
  }
  return out;
}

/** Dice con claridad qué pasa al tocar "Aplicar", según cómo recibe candidatos la empresa. */
function comoAplicar(job: Vacante): { Icono: typeof Mail; texto: string } {
  const e = enlaceAplicar(job.aplicar);
  if (!e) return { Icono: FileText, texto: "Dejas tu nombre y tu contacto en un formulario corto. Puedes incluir tu CV. No necesitas crear cuenta." };
  if (e.href.startsWith("mailto:")) return { Icono: Mail, texto: "Envías tu CV al correo de la empresa." };
  if (e.href.includes("wa.me")) return { Icono: MessageCircle, texto: "Le escribes a la empresa por WhatsApp. Te abrimos el chat." };
  return { Icono: Link2, texto: "Sigues el enlace de la empresa para aplicar en su propio sitio." };
}

function Dato({ Icono, etiqueta, valor, alerta = false }: { Icono: typeof Mail; etiqueta: string; valor: string; alerta?: boolean }) {
  return (
    <div className="flex items-start gap-3 p-4 sm:p-5">
      <span aria-hidden="true" className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Icono className="size-[18px]" /></span>
      <div className="min-w-0">
        <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{etiqueta}</dt>
        <dd className={`mt-1 text-[15px] font-bold leading-snug ${alerta ? "text-destructive" : ""}`}>{valor}</dd>
      </div>
    </div>
  );
}

function Sueldo({ job, texto }: { job: Vacante; texto: string }) {
  if (job.salarioMin <= 0) {
    return (
      <div>
        <p className="font-display text-[1.35rem] font-bold leading-tight tracking-tight text-foreground">{texto || "No lo publicaron"}</p>
        <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{texto ? "Así lo indica la empresa." : "Pregúntalo en la entrevista. Antes, mira cuánto se paga por este puesto."}</p>
      </div>
    );
  }
  const [min, max] = job.salario.split(" - ");
  return (
    <div>
      <p className="font-display text-[2.35rem] font-bold leading-none tracking-[-0.03em] text-success tabular-nums">{min}</p>
      <p className="mt-2 text-lg font-bold text-success tabular-nums">{max ? `a ${max}` : ""}<span className="text-sm font-semibold text-muted-foreground">{max ? " " : ""}al mes</span></p>
    </div>
  );
}

function Detalle() {
  const { job } = Route.useLoaderData();
  const aplicar = useApply();
  const fecha = new Date(job.creado).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
  const c = claridad(job);
  const { jobs } = useVacantes();
  const similares = jobs.filter((j) => j.id !== job.id && (j.area === job.area || j.provincia === job.provincia)).slice(0, 4);
  const { Icono: IconoAplicar, texto: textoAplicar } = comoAplicar(job);
  const directo = tieneContactoDirecto(job);
  const exclusiones = revisarVacante(job);
  const sinEmpresa = empresaOculta(job.empresa);
  const empresa = nombreEmpresa(job.empresa);
  const urgente = diasRestantes(job) <= 5;
  const p = useMemo(() => presentar(job), [job]);
  const textos = parrafos(p.resumen);
  const lede = textos[0] && textos[0].length <= 240 && !/^para /i.test(textos[0]) ? textos[0] : "";
  const cuerpo = lede ? textos.slice(1) : textos;
  const irAplicar = () => (directo ? document.getElementById("aplicar-directo")?.scrollIntoView({ behavior: "smooth", block: "center" }) : aplicar(job));

  // Cuenta una vista por persona y sesión, para que la empresa vea cuánta gente vio su vacante.
  useEffect(() => registrarVista(job.id, job.estado), [job.id, job.estado]);

  // La barra de abajo (celular) aparece solo cuando el botón grande ya no se ve.
  const botonRef = useRef<HTMLDivElement>(null);
  const [barra, setBarra] = useState(false);
  useEffect(() => {
    const el = botonRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const o = new IntersectionObserver(([e]) => setBarra(!e.isIntersecting), { threshold: 0 });
    o.observe(el);
    return () => o.disconnect();
  }, [job.id]);

  const chips = [
    { I: MapPin, t: job.provincia },
    { I: Monitor, t: job.modalidad === "Remoto" ? "Desde casa" : job.modalidad },
    { I: Briefcase, t: job.tipo },
    { I: GraduationCap, t: job.experiencia === "Sin experiencia" ? "Sin experiencia" : `Experiencia: ${job.experiencia}` },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="hero-dark pb-20 pt-6 lg:pb-28 lg:pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-white/70">
            <Link to="/vacantes" className="inline-flex items-center gap-1.5 rounded-lg py-1 hover:text-white"><ArrowLeft className="size-4" aria-hidden="true" /> Vacantes</Link>
            <ChevronRight className="size-3.5 opacity-60" aria-hidden="true" />
            <Link to="/vacantes" search={{ area: job.area }} className="py-1 hover:text-white">{job.area}</Link>
          </nav>
          <div className="entra mt-6 lg:max-w-[calc(66.666%-1.5rem)]">
            <div className="flex items-center gap-3.5">
              <EmpresaAvatar nombre={job.empresa} claro className="size-14 text-2xl sm:size-16 sm:text-3xl" />
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-white sm:text-lg">
                  {sinEmpresa ? empresa : <Link to="/empresa/$id" params={{ id: slug(job.empresa) }} className="underline-offset-4 hover:underline">{empresa}</Link>}
                </p>
                {!sinEmpresa && <CalificacionCorta slug={slug(job.empresa)} />}
                <p className="mt-0.5 text-sm text-white/70">{p.gestor && p.gestor !== job.empresa ? `Gestionada por ${p.gestor} · ` : ""}Publicada {job.publicado}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-1.5">
              {job.destacada && <span className="rounded-full bg-[#ffd84d] px-3 py-1 text-xs font-extrabold text-[#3d2f00]">Destacada</span>}
              {esNueva(job) && <span className="rounded-full bg-[#5aa0ff] px-3 py-1 text-xs font-extrabold text-[#062048]">Nueva</span>}
              {job.salarioMin > 0 && <span className="rounded-full bg-[#2ecc85]/20 px-3 py-1 text-xs font-bold text-[#a8f0cc] ring-1 ring-[#2ecc85]/40">Salario publicado</span>}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20"><ShieldCheck className="size-3.5" aria-hidden="true" /> Aplicar es gratis</span>
            </div>
            <h1 className="mt-3 text-[2rem] font-extrabold leading-[1.08] tracking-[-0.025em] text-balance sm:text-[2.6rem] lg:text-[3.1rem]">{job.titulo}</h1>
            {lede && <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-relaxed text-white/80 sm:text-lg">{lede}</p>}
            <ul className="mt-6 flex flex-wrap gap-2">
              {chips.map(({ I, t }) => <li key={t} className="vidrio inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-white"><I className="size-4 text-[#8ec1ff]" aria-hidden="true" />{t}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-32 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:pb-24">
        <aside className="-mt-12 lg:order-2 lg:col-span-4 lg:-mt-[25rem]">
          <div className="entra lg:sticky lg:top-20">
            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-[0_30px_60px_-30px_rgb(10_47_92/0.5)]">
              <div className="h-1.5 bg-gradient-to-r from-[#ffd84d] via-[#5aa0ff] to-[#1d6ff2]" aria-hidden="true" />
              <div className="p-6 pb-5">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Sueldo mensual</p>
                <Sueldo job={job} texto={p.salarioTexto} />
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {job.salarioMin > 0 && <Link to="/herramientas/salario-neto" search={{ bruto: job.salarioMin }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><Calculator className="size-4" aria-hidden="true" /> Cuánto te llega</Link>}
                  <Link to="/salarios" search={{ q: job.titulo }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><Radar className="size-4" aria-hidden="true" /> {job.salarioMin > 0 ? "Compara" : "Cuánto se paga"}</Link>
                </div>
              </div>
              <div className="relative h-0" aria-hidden="true">
                <div className="absolute inset-x-5 border-t-2 border-dashed border-border" />
                <span className="absolute -left-3 -top-3 size-6 rounded-full border-r border-border bg-background" />
                <span className="absolute -right-3 -top-3 size-6 rounded-full border-l border-border bg-background" />
              </div>
              <div className="p-6 pt-5">
                {directo ? (
                  <>
                    <div ref={botonRef}><ContactoDirecto job={job} /></div>
                    <button onClick={() => aplicar(job)} className="mt-3 w-full rounded-xl py-2 text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                      O usa el formulario de Enlace Laboral
                    </button>
                  </>
                ) : (
                  <>
                    <div ref={botonRef}><button onClick={() => aplicar(job)} className="btn-aplicar h-14 w-full rounded-2xl text-lg">Aplicar a esta vacante</button></div>
                    <p className="mt-3 flex items-start gap-2.5 text-sm leading-snug text-muted-foreground"><IconoAplicar className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden="true" /> {textoAplicar}</p>
                  </>
                )}
                <div className="mt-4 flex gap-2">
                  <div className="flex-1"><BotonGuardar id={job.id} grande /></div>
                  <CompartirBoton job={job} className="h-11 flex-1" />
                </div>
                <div className="mt-5 border-t border-border pt-4"><Vigencia job={job} /></div>
              </div>
            </div>
            <div className="mt-4 hidden lg:block"><CanalWhatsApp variante="boton" /></div>
          </div>
        </aside>

        <article className="min-w-0 space-y-12 lg:order-1 lg:col-span-8 lg:pt-12">
          <AdminAcciones job={job} volverAlListado />
          {exclusiones.length > 0 && (
            <div role="note" className="rounded-2xl border border-[#9a6b00]/30 bg-[#fff8e1] p-4 text-sm">
              <p className="font-extrabold text-[#6b4a00]">Este aviso pide algo que no está permitido</p>
              <p className="mt-1">Menciona {exclusiones.map((x) => `«${x.frase}»`).join(", ")}. En Enlace Laboral está prohibido pedir edad, sexo, foto, estado civil o rasgos físicos, y ya le pedimos corregirlo. Si cumples con lo que pide el trabajo, aplica igual.</p>
            </div>
          )}

          <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-soft)] sm:grid-cols-4 [&>div]:border-border max-sm:[&>div:nth-child(-n+2)]:border-b max-sm:[&>div:nth-child(2n)]:border-l sm:[&>div:not(:first-child)]:border-l">
            <Dato Icono={Layers} etiqueta="Área" valor={job.area} />
            <Dato Icono={TrendingUp} etiqueta="Nivel" valor={nivelDe(job)} />
            <Dato Icono={CalendarDays} etiqueta="Publicada" valor={fecha} />
            <Dato Icono={CalendarClock} etiqueta="Vigencia" valor={venceTexto(job)} alerta={urgente} />
          </dl>

          {(cuerpo.length > 0 || p.lista.length > 0 || p.notas.length > 0) && (
            <Seccion etiqueta="sec-sobre">
              <SeccionTitulo id="sec-sobre" Icono={Building2} titulo="Sobre el puesto" />
              <div className="mt-5 max-w-[66ch] space-y-4 text-[1.0625rem] leading-[1.7] text-foreground/85 sm:text-[1.125rem]">
                {cuerpo.map((t, i) => <p key={i} className="[overflow-wrap:anywhere]">{t}</p>)}
                {p.lista.length > 0 && <ul className="space-y-2.5">{p.lista.map((x, j) => <li key={j} className="flex gap-3"><span aria-hidden="true" className="mt-[0.68em] size-1.5 shrink-0 rounded-full bg-[#1d6ff2]" /><span className="min-w-0 [overflow-wrap:anywhere]">{x}</span></li>)}</ul>}
              </div>
              {p.notas.length > 0 && <div className="mt-6 max-w-[66ch]"><Notas items={p.notas} /></div>}
            </Seccion>
          )}

          {p.funciones.length > 0 && <Funciones items={p.funciones} />}
          {(p.imprescindibles.length > 0 || p.cualidades.length > 0 || p.suman.length > 0) && <Requisitos imprescindibles={p.imprescindibles} cualidades={p.cualidades} suman={p.suman} />}
          {p.ofrece.length > 0 && <Beneficios items={p.ofrece} />}

          <PasosAplicar via={textoAplicar} directo={directo} onAplicar={irAplicar} />

          {job.imagen && (
            <Seccion etiqueta="img-orig">
              <SeccionTitulo id="img-orig" Icono={ImageIcon} titulo="Publicación original" sub="Así la publicó la empresa. Toca para verla completa." />
              <a href={job.imagen} target="_blank" rel="noopener noreferrer" className="mt-6 block max-w-md overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5" aria-label="Abrir la imagen original en tamaño completo">
                <img src={job.imagen} alt={`Publicación original de la vacante ${job.titulo}`} loading="lazy" className="w-full object-contain" />
              </a>
            </Seccion>
          )}

          <InclusionBloque categorias={job.categorias} />

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl bg-secondary/70 p-5 sm:p-6" aria-labelledby="seguro">
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

            <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6" aria-labelledby="claridad-titulo">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="claridad-titulo" className="flex items-center gap-2 text-lg font-extrabold"><Sparkles className="size-5 text-primary" aria-hidden="true" /> Qué tan completa está</h2>
                <ClaridadPill job={job} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.puntos} de {c.total}. Mientras más completa, menos sorpresas al aplicar.</p>
              {c.puntos === c.total && (
                <p className="mt-3 rounded-2xl bg-success/10 p-3 text-sm text-foreground">
                  <span className="font-extrabold text-success">Esta vacante tiene el sello «Vacante clara».</span> Trae los 6 datos que necesitas para decidir antes de aplicar. El sello mide la información publicada; no es una opinión sobre la empresa.
                </p>
              )}
              <ul className="mt-4 grid gap-2">
                {c.tiene.map((x) => <li key={x} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" /> {x}</li>)}
                {c.falta.map((x) => <li key={x} className="flex items-center gap-2 text-sm text-muted-foreground"><Circle className="size-4 shrink-0" aria-hidden="true" /> {x}: no lo indica</li>)}
              </ul>
            </section>
          </div>

          <div className="lg:hidden"><CanalWhatsApp variante="tarjeta" /></div>

          <SobreEmpresa vacanteId={job.id} />

          {similares.length > 0 && (
            <section>
              <h2 className="text-[1.3rem] font-extrabold tracking-[-0.01em] sm:text-[1.45rem]">Vacantes parecidas</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">{similares.map((j) => <VacanteTarjeta key={j.id} job={j} />)}</div>
            </section>
          )}
          <section><AlertaForm areaInicial={job.area} provinciaInicial={job.provincia} /></section>
        </article>
      </div>

      <div
        aria-hidden={!barra}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(20_33_58/0.25)] backdrop-blur transition-transform duration-300 lg:hidden ${barra ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
      >
        <div className="mx-auto flex max-w-xl items-center gap-2.5">
          <div className="min-w-0 flex-1">
            {job.salarioMin > 0 && <p className="truncate text-sm font-extrabold text-success">{job.salario}</p>}
            <p className={`truncate ${job.salarioMin > 0 ? "text-xs" : "text-sm font-bold"} text-muted-foreground`}>{job.titulo}</p>
          </div>
          <div className="[&_button]:size-12"><BotonGuardar id={job.id} /></div>
          <button tabIndex={barra ? 0 : -1} onClick={irAplicar} className="btn-aplicar h-12 shrink-0 rounded-xl px-6 text-base">{directo ? "Cómo aplicar" : "Aplicar"}</button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/** Para vacantes publicadas por una empresa con cuenta: quién es y sus otras vacantes. */
function SobreEmpresa({ vacanteId }: { vacanteId: string }) {
  const { data: e } = useEmpresaPublica({ vacante: vacanteId });
  if (!e) return null;
  return (
    <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <EmpresaAvatar nombre={e.nombre} className="size-12 text-xl" />
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-extrabold">{e.nombre}{e.verificada && <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-xs font-bold text-success"><BadgeCheck className="size-3.5" /> Verificada</span>}</h2>
          <p className="text-sm text-muted-foreground">{[e.sector, e.provincia].filter(Boolean).join(" · ") || "Publicada por la empresa"}</p>
        </div>
      </div>
      {senalesEmpresa(e).length > 0 && <ul className="mt-4 flex flex-wrap gap-2">{senalesEmpresa(e).map((t) => <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-[#1d6ff2]/10 px-3 py-1 text-xs font-bold text-[#1557c4]"><CheckCircle2 className="size-3.5" /> {t}</li>)}</ul>}
      {e.descripcion && <p className="mt-4 line-clamp-4 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{e.descripcion}</p>}
      <Link to="/empresa/$id" params={{ id: e.id }} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#1557c4] hover:underline">{e.activas > 1 ? `Ver sus ${e.activas} vacantes` : "Ver la página de la empresa"}</Link>
    </section>
  );
}

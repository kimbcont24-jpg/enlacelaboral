import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Bell, BellRing, Briefcase, CheckCircle2, ChevronDown, Globe, MapPin, PenLine, Share2, ShieldCheck, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

import { Calificaciones } from "@/components/empresa/Calificaciones";
import { Estrellas } from "@/components/empresa/Estrellas";
import { ADN, Aparece, Clima, Contador, MapaContrata, Parecidas, Preparate, Salarios, Transparencia } from "@/components/empresa/Radiografia";
import { Opinar } from "@/components/empresa/Opinar";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { VacanteTarjeta } from "@/components/site/VacanteTarjeta";
import { supabase } from "@/integrations/supabase/client";
import { slug as slugDe } from "@/lib/empleos";
import { senalesEmpresa, sitioSeguro, type EmpresaPublica } from "@/lib/empresa-publica";
import { cargarOpiniones, general, useOpiniones, type OpinionesEmpresa, type TipoOpinion } from "@/lib/opiniones";
import { colorEmpresa, haceDias, radiografia, useSeguirEmpresa, type Radiografia } from "@/lib/perfil-empresa";
import { fetchPublicadas, rowToVacante, SELECT, SITIO, type Vacante, type VacanteRow } from "@/lib/vacantes";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Datos = { slug: string; nombre: string; cuenta: EmpresaPublica | null; vacantes: Vacante[]; opiniones: OpinionesEmpresa | null; rx: Radiografia };

/**
 * Perfil de empresa: /empresa/<id> (empresa con cuenta) o /empresa/<slug> (cualquier empresa con vacantes en Enlace).
 * Datos, vacantes abiertas y calificaciones (proceso de selección y trabajar aquí).
 */
export const Route = createFileRoute("/empresa/$id")({
  loader: async ({ params }): Promise<Datos> => {
    const id = params.id.toLowerCase();
    let cuenta: EmpresaPublica | null = null;
    let vacantes: Vacante[] = [];
    let nombre = "";
    const todas = await fetchPublicadas().catch(() => [] as Vacante[]);
    if (UUID.test(id)) {
      const { data } = await supabase.rpc("empresa_publica", { p_empresa: id, p_vacante: null });
      cuenta = ((data ?? []) as EmpresaPublica[])[0] ?? null;
      if (!cuenta) throw notFound();
      nombre = cuenta.nombre;
      const { data: v } = await supabase.from("vacantes").select(SELECT).eq("empresa_id", id).eq("estado", "publicada").gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()).order("created_at", { ascending: false }).limit(60);
      vacantes = ((v ?? []) as unknown as VacanteRow[]).map(rowToVacante);
    } else {
      if (!/^[a-z0-9-]{2,120}$/.test(id)) throw notFound();
      vacantes = todas.filter((j) => j.empresa !== "Empresa no indicada" && slugDe(j.empresa) === id);
      nombre = vacantes[0]?.empresa ?? "";
      if (!nombre) {
        const { data } = await supabase.rpc("empresa_por_slug" as never, { p_slug: id } as never);
        nombre = typeof data === "string" ? data : "";
      }
      if (!nombre || /confidencial|^empresa no indicada$/i.test(nombre)) throw notFound();
    }
    const slug = slugDe(nombre);
    const opiniones = await cargarOpiniones(slug).catch(() => null);
    return { slug, nombre, cuenta, vacantes, opiniones, rx: radiografia(nombre, vacantes, todas) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Empresa | Enlace Laboral" }, { name: "robots", content: "noindex" }] };
    const { nombre, vacantes, opiniones, slug } = loaderData;
    const g = general(opiniones ?? undefined);
    const title = `${nombre}: opiniones, calificaciones y empleos | Enlace Laboral`;
    const desc = `${g.promedio != null ? `${nombre} tiene ${g.promedio.toFixed(1)} de 5 estrellas en ${g.total} opiniones. ` : `Opiniones sobre ${nombre} y su proceso de selección. `}${vacantes.length ? `${vacantes.length} ${vacantes.length === 1 ? "vacante abierta" : "vacantes abiertas"} en República Dominicana.` : "Mira sus vacantes en Enlace Laboral."}`;
    const ld = g.promedio != null ? {
      "@context": "https://schema.org", "@type": "EmployerAggregateRating",
      itemReviewed: { "@type": "Organization", name: nombre }, ratingValue: g.promedio, ratingCount: g.total, bestRating: 5, worstRating: 1,
    } : null;
    return {
      meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }],
      links: [{ rel: "canonical", href: `${SITIO}/empresa/${slug}` }],
      scripts: ld ? [{ type: "application/ld+json", children: JSON.stringify(ld) }] : [],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">No encontramos esta empresa</h1>
        <p className="mt-2 text-muted-foreground">Puede que el enlace esté incompleto o que ya no tenga vacantes.</p>
        <Link to="/vacantes" className="btn-aplicar mt-6 inline-grid h-12 place-items-center rounded-xl px-6">Ver todas las vacantes</Link>
      </main>
      <Footer />
    </div>
  ),
  component: PerfilEmpresa,
});

const SECCIONES: [string, string][] = [["sobre", "Resumen"], ["vacantes", "Vacantes"], ["transparencia", "Transparencia"], ["salarios", "Lo que paga"], ["clima", "Clima"], ["calificaciones", "Opiniones"], ["preparate", "Entrevista"]];

function PerfilEmpresa() {
  const d = Route.useLoaderData();
  const { data: opiniones } = useOpiniones(d.slug, d.opiniones ?? undefined);
  const [opinar, setOpinar] = useState<TipoOpinion | null>(null);
  const [todas, setTodas] = useState(false);
  const g = general(opiniones);
  const e = d.cuenta;
  const web = sitioSeguro(e?.sitio_web ?? null);
  const v = d.vacantes;
  const rx = d.rx;
  const color = colorEmpresa(d.nombre);
  const seguir = useSeguirEmpresa(d.slug, d.nombre);
  const activa = useSeccionActiva(SECCIONES.map(([id]) => id));

  // Vacantes nuevas desde la última visita (solo si la sigue en este navegador).
  const nuevas = useMemo(() => new Set(seguir.sigue && seguir.visto ? v.filter((x) => x.creado > seguir.visto!).map((x) => x.id) : []), [seguir.sigue, seguir.visto, v]);
  const ordenadas = useMemo(() => [...v].sort((a, b) => Number(nuevas.has(b.id)) - Number(nuevas.has(a.id))), [v, nuevas]);
  const visibles = todas ? ordenadas : ordenadas.slice(0, 6);

  const pctSueldo = v.length ? Math.round((rx.conSalario / v.length) * 100) : 0;
  const ultima = haceDias(rx.ultima);
  const contratando = rx.ultima != null && Date.now() - new Date(rx.ultima).getTime() < 7 * 864e5;
  const provincias = rx.provincias.map((p) => p.nombre);

  const compartir = async () => {
    const url = `${SITIO}/empresa/${d.slug}`;
    const texto = `${d.nombre} en Enlace Laboral: ${v.length ? `${v.length} ${v.length === 1 ? "vacante abierta" : "vacantes abiertas"}, ` : ""}opiniones y qué tan claras son sus vacantes.`;
    try {
      if (navigator.share) await navigator.share({ title: d.nombre, text: texto, url });
      else { await navigator.clipboard.writeText(`${texto} ${url}`); toast.success("Enlace copiado"); }
    } catch { /* cancelado */ }
  };
  const alternarSeguir = () => {
    const ahora = seguir.alternar();
    toast.success(ahora ? `Sigues a ${d.nombre}` : `Dejaste de seguir a ${d.nombre}`, { description: ahora ? "Cuando vuelvas te marcamos las vacantes nuevas. Se guarda en este celular o computadora." : undefined });
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-foreground">
      <Header />
      {/* Portada con el color de la empresa */}
      <div className="relative h-44 overflow-hidden sm:h-60" style={{ backgroundColor: "#0a2f5c" }}>
        <div aria-hidden="true" className="absolute -left-24 -top-32 size-[28rem] rounded-full opacity-70 blur-3xl animate-[flota_14s_ease-in-out_infinite]" style={{ backgroundColor: color }} />
        <div aria-hidden="true" className="absolute -right-10 top-0 size-80 rounded-full bg-[#1d6ff2] opacity-50 blur-3xl animate-[flota_18s_ease-in-out_infinite_reverse]" />
        <div aria-hidden="true" className="absolute -bottom-36 left-1/3 size-80 rounded-full bg-[#f5a700] opacity-25 blur-3xl" />
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <p aria-hidden="true" className="absolute -bottom-6 right-4 select-none whitespace-nowrap font-display text-[5rem] font-bold leading-none text-white/[0.06] sm:text-[8rem]">{d.nombre}</p>
      </div>

      <main className="mx-auto -mt-20 max-w-6xl px-4 pb-28 sm:-mt-24 sm:px-6 lg:pb-16">
        {/* Tarjeta principal */}
        <section className="relative rounded-3xl border border-white/60 bg-surface/95 p-5 shadow-[0_30px_60px_-35px_rgb(10_47_92/0.55)] backdrop-blur sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="relative -mt-16 w-fit sm:-mt-24">
              <div className="rounded-[1.75rem] bg-white p-2 shadow-xl"><EmpresaAvatar nombre={d.nombre} className="size-20 text-4xl sm:size-28 sm:text-6xl" /></div>
              {contratando && <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#0f7a43] px-2.5 py-1 text-[11px] font-extrabold text-white shadow-lg"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-white" /></span> Contratando</span>}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2.5 font-display text-[1.6rem] font-bold leading-tight tracking-tight md:text-[2.3rem]">
                {d.nombre}
                {e?.verificada && <span className="inline-flex items-center gap-1 rounded-full bg-[#0f7a43]/10 px-2.5 py-1 font-sans text-xs font-bold text-[#0f7a43]"><BadgeCheck className="size-4" /> Verificada</span>}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {e?.sector && <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" /> {e.sector}</span>}
                {(e?.provincia || provincias[0]) && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {e?.provincia ?? provincias[0]}{provincias.length > 1 ? ` y ${provincias.length - 1} más` : ""}</span>}
                {web && <a href={web} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 hover:underline"><Globe className="size-4" /> {new URL(web).hostname.replace(/^www\./, "")}</a>}
                {ultima && <span className="inline-flex items-center gap-1.5"><Sparkles className="size-4" /> Última vacante {ultima}</span>}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                {g.promedio != null ? (
                  <a href="#calificaciones" className="inline-flex items-center gap-2 font-bold"><span className="text-lg">{g.promedio.toFixed(1)}</span><Estrellas valor={g.promedio} /><span className="text-sm font-semibold text-muted-foreground">({g.total} opiniones)</span></a>
                ) : (
                  <a href="#calificaciones" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground"><Star className="size-4 text-[#f5a700]" fill="currentColor" strokeWidth={0} /> {g.total ? `${g.total} ${g.total === 1 ? "opinión" : "opiniones"}` : "Sin opiniones todavía"}</a>
                )}
                <span className="text-border">·</span>
                <button type="button" onClick={() => setOpinar("trabajo")} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1557c4] hover:underline"><PenLine className="size-4" /> Calificar empresa</button>
              </div>
            </div>
            <div className="hidden gap-2 sm:flex sm:self-start">
              <button type="button" onClick={() => void compartir()} aria-label="Compartir" className="grid size-11 place-items-center rounded-full border border-border hover:bg-secondary"><Share2 className="size-4" /></button>
              <BotonSeguir sigue={seguir.sigue} onClick={alternarSeguir} />
            </div>
          </div>

          {/* Cifras clave */}
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            <Cifra t="Vacantes abiertas" href="#vacantes"><Contador a={v.length} /></Cifra>
            <Cifra t="Índice de transparencia" href="#transparencia">{rx.transparencia ? <><Contador a={rx.transparencia.puntaje} /><span className="text-base text-muted-foreground">/100</span></> : "–"}</Cifra>
            <Cifra t="Publican el sueldo" href="#salarios">{v.length ? <Contador a={pctSueldo} sufijo="%" /> : "–"}</Cifra>
            <Cifra t={g.promedio != null ? `${g.total} opiniones` : "Calificación"} href="#calificaciones">{g.promedio != null ? <span className="inline-flex items-center gap-1.5">{g.promedio.toFixed(1)}<Star className="size-5 text-[#f5a700]" fill="currentColor" strokeWidth={0} /></span> : <span className="text-base text-muted-foreground">Sé la primera</span>}</Cifra>
          </dl>

          <nav className="sticky top-16 z-20 -mx-5 mt-5 -mb-2 flex gap-1 overflow-x-auto bg-surface/95 px-5 py-2 text-sm font-bold backdrop-blur [scrollbar-width:none] sm:-mx-7 sm:px-7" aria-label="Secciones">
            {SECCIONES.map(([id, t]) => (
              <a key={id} href={`#${id}`} aria-current={activa === id ? "true" : undefined}
                className={`shrink-0 rounded-full px-4 py-2 transition-colors ${activa === id ? "bg-[#0a2f5c] text-white" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>{t}{id === "vacantes" ? ` (${v.length})` : ""}</a>
            ))}
          </nav>
        </section>

        {seguir.sigue && nuevas.size > 0 && (
          <a href="#vacantes" className="mt-4 flex items-center gap-3 rounded-2xl bg-[#0f7a43] p-4 font-bold text-white shadow-lg entra">
            <BellRing className="size-5 shrink-0" /> {nuevas.size} {nuevas.size === 1 ? "vacante nueva" : "vacantes nuevas"} desde tu última visita
          </a>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-6">
            {/* Sobre */}
            <Aparece id="sobre" className="rounded-3xl border border-border bg-surface p-6 md:p-7">
              <h2 className="font-display text-xl font-bold tracking-tight">Sobre {d.nombre}</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{e?.descripcion?.trim() || resumenAuto(d.nombre, rx)}</p>
              {rx.areas.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{rx.areas.map((a) => <span key={a.t} className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{a.t}</span>)}</div>}
              {e && senalesEmpresa(e).length > 0 && (
                <ul className="mt-4 space-y-1.5 text-sm">{senalesEmpresa(e).map((t) => <li key={t} className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-[#0f7a43]" /> {t}</li>)}</ul>
              )}
            </Aparece>

            {/* Vacantes */}
            <Aparece id="vacantes">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="font-display text-xl font-bold tracking-tight">{v.length ? `${v.length} ${v.length === 1 ? "vacante abierta" : "vacantes abiertas"}` : "Sin vacantes abiertas ahora"}</h2>
                {v.length > 0 && !seguir.sigue && <button type="button" onClick={alternarSeguir} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1557c4] hover:underline"><Bell className="size-4" /> Avísame de las nuevas</button>}
              </div>
              {v.length === 0 ? (
                <div className="mt-3 rounded-3xl border border-dashed border-border bg-surface p-6">
                  <p className="text-muted-foreground">Ahora mismo no tiene vacantes abiertas en Enlace.</p>
                  <button type="button" onClick={alternarSeguir} className="btn-aplicar mt-4 inline-flex h-11 items-center gap-2 rounded-full px-5"><Bell className="size-4" /> {seguir.sigue ? "Ya la sigues" : "Seguir a esta empresa"}</button>
                </div>
              ) : (
                <>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {visibles.map((x) => (
                      <div key={x.id} className="relative">
                        {nuevas.has(x.id) && <span className="absolute -top-2 left-4 z-10 rounded-full bg-[#0f7a43] px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow">Nueva para ti</span>}
                        <VacanteTarjeta job={x} />
                      </div>
                    ))}
                  </div>
                  {ordenadas.length > 6 && (
                    <button type="button" onClick={() => setTodas(!todas)} className="mx-auto mt-4 flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-5 font-bold hover:bg-secondary">
                      {todas ? "Ver menos" : `Ver las ${ordenadas.length} vacantes`} <ChevronDown className={`size-4 transition-transform ${todas ? "rotate-180" : ""}`} />
                    </button>
                  )}
                </>
              )}
            </Aparece>

            <Transparencia r={rx} nombre={d.nombre} />
            <Salarios r={rx} />
            <MapaContrata r={rx} />
            <ADN r={rx} />
            <Clima o={opiniones} onOpinar={() => setOpinar("trabajo")} />

            {/* Calificaciones */}
            <div className="rounded-3xl border border-border bg-surface p-6 md:p-7">
              <Calificaciones datos={opiniones} nombre={d.nombre} onOpinar={setOpinar} />
            </div>

            <Preparate r={rx} o={opiniones} nombre={d.nombre} />
            <Parecidas r={rx} />
          </div>

          <aside className="hidden h-fit space-y-4 lg:sticky lg:top-36 lg:block">
            <div className="relative overflow-hidden rounded-3xl bg-[#0a2f5c] p-6 text-white">
              <div aria-hidden="true" className="absolute -right-12 -top-12 size-40 rounded-full opacity-60 blur-2xl" style={{ backgroundColor: color }} />
              <p className="relative text-lg font-extrabold leading-tight">¿Aplicaste o trabajaste en {d.nombre}?</p>
              <p className="relative mt-2 text-sm text-white/80">Tu opinión ayuda a otra persona a decidir. Nunca mostramos tu nombre.</p>
              <div className="relative mt-4 grid gap-2">
                <button type="button" onClick={() => setOpinar("trabajo")} className="h-11 rounded-full bg-white font-bold text-[#0a2f5c] hover:bg-white/90">Opinar de trabajar aquí</button>
                <button type="button" onClick={() => setOpinar("proceso")} className="h-11 rounded-full border border-white/40 font-bold hover:bg-white/10">Opinar del proceso de selección</button>
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-surface p-5">
              <p className="font-extrabold">No te pierdas sus vacantes</p>
              <p className="mt-1 text-sm text-muted-foreground">Síguela y, cuando vuelvas, te marcamos lo nuevo.</p>
              <div className="mt-3"><BotonSeguir sigue={seguir.sigue} onClick={alternarSeguir} ancho /></div>
            </div>
            <div className="flex gap-3 rounded-3xl border border-border bg-surface p-5 text-sm text-muted-foreground">
              <ShieldCheck className="size-5 shrink-0 text-[#0f7a43]" />
              <p>{e?.verificada ? "Verificamos que esta empresa existe con su RNC y un contacto real." : "Revisamos cada vacante de esta empresa antes de publicarla."} Aplicar es gratis: ninguna empresa seria te cobra por contratarte.</p>
            </div>
          </aside>
        </div>
      </main>

      {/* Barra fija en el celular */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-surface/95 p-3 backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <button type="button" onClick={() => void compartir()} aria-label="Compartir" className="grid size-12 shrink-0 place-items-center rounded-full border border-border"><Share2 className="size-4" /></button>
        <BotonSeguir sigue={seguir.sigue} onClick={alternarSeguir} compacto />
        {v.length > 0
          ? <a href="#vacantes" className="btn-aplicar inline-flex h-12 flex-1 items-center justify-center rounded-full px-4">Ver {v.length} {v.length === 1 ? "vacante" : "vacantes"}</a>
          : <button type="button" onClick={() => setOpinar("trabajo")} className="btn-aplicar inline-flex h-12 flex-1 items-center justify-center rounded-full px-4">Calificar empresa</button>}
      </div>

      <Footer />
      {opinar && <Opinar slug={d.slug} nombre={d.nombre} tipoInicial={opinar} onCerrar={() => setOpinar(null)} />}
    </div>
  );
}

function resumenAuto(nombre: string, r: Radiografia): string {
  if (!r.total) return `${nombre} ha publicado vacantes en Enlace Laboral. Aquí ves lo que opinan las personas que aplicaron o trabajaron ahí.`;
  const areas = r.areas.slice(0, 2).map((a) => a.t.toLowerCase()).join(" y ");
  const donde = r.provincias.slice(0, 2).map((p) => p.nombre.replace(/\s*\(.*\)/, "")).join(" y ");
  return `${nombre} busca talento sobre todo en ${areas}${donde ? `, en ${donde}` : ""}. En los últimos 30 días publicó ${r.total} ${r.total === 1 ? "vacante" : "vacantes"} en Enlace Laboral${r.sinExperiencia ? `, ${r.sinExperiencia} sin pedir experiencia` : ""}. Abajo ves qué tan claras son, cuánto pagan y lo que opinan quienes aplicaron o trabajaron ahí.`;
}

function Cifra({ t, href, children }: { t: string; href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="group bg-surface p-4 transition-colors hover:bg-[#f7f9fd]">
      <dd className="font-display text-2xl font-bold leading-none md:text-[1.7rem]">{children}</dd>
      <dt className="mt-1.5 text-xs font-semibold text-muted-foreground group-hover:text-foreground">{t}</dt>
    </a>
  );
}

function BotonSeguir({ sigue, onClick, ancho = false, compacto = false }: { sigue: boolean; onClick: () => void; ancho?: boolean; compacto?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={sigue}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all ${compacto ? "h-12 px-4" : "h-11 px-5"} ${ancho ? "w-full" : ""} ${sigue ? "border border-[#0f7a43]/30 bg-[#0f7a43]/10 text-[#0f7a43]" : "border border-[#0a2f5c] bg-[#0a2f5c] text-white hover:bg-[#0d3a70]"}`}>
      {sigue ? <BellRing className="size-4" /> : <Bell className="size-4" />} {sigue ? "Siguiendo" : "Seguir"}
    </button>
  );
}

/** Qué sección se está leyendo, para resaltarla en la barra. */
function useSeccionActiva(ids: string[]) {
  const [activa, setActiva] = useState(ids[0] ?? "");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const vis = new Map<string, number>();
    const io = new IntersectionObserver((es) => {
      for (const x of es) vis.set(x.target.id, x.isIntersecting ? x.boundingClientRect.top : Infinity);
      const top = [...vis.entries()].filter(([, y]) => y !== Infinity).sort((a, b) => Math.abs(a[1] - 140) - Math.abs(b[1] - 140))[0];
      if (top) setActiva(top[0]);
    }, { rootMargin: "-130px 0px -55% 0px" });
    for (const id of ids) { const el = document.getElementById(id); if (el) io.observe(el); }
    return () => io.disconnect();
  }, [ids.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  return activa;
}

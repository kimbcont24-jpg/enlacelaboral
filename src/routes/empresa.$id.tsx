import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Banknote, Briefcase, CheckCircle2, Globe, MapPin, PenLine, Share2, Star } from "lucide-react";
import { toast } from "sonner";

import { Calificaciones } from "@/components/empresa/Calificaciones";
import { Estrellas } from "@/components/empresa/Estrellas";
import { Opinar } from "@/components/empresa/Opinar";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { VacanteTarjeta } from "@/components/site/VacanteTarjeta";
import { supabase } from "@/integrations/supabase/client";
import { slug as slugDe } from "@/lib/empleos";
import { senalesEmpresa, sitioSeguro, type EmpresaPublica } from "@/lib/empresa-publica";
import { cargarOpiniones, general, useOpiniones, type OpinionesEmpresa, type TipoOpinion } from "@/lib/opiniones";
import { fetchPublicadas, rowToVacante, SELECT, SITIO, type Vacante, type VacanteRow } from "@/lib/vacantes";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Datos = { slug: string; nombre: string; cuenta: EmpresaPublica | null; vacantes: Vacante[]; opiniones: OpinionesEmpresa | null };

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
    if (UUID.test(id)) {
      const { data } = await supabase.rpc("empresa_publica", { p_empresa: id, p_vacante: null });
      cuenta = ((data ?? []) as EmpresaPublica[])[0] ?? null;
      if (!cuenta) throw notFound();
      nombre = cuenta.nombre;
      const { data: v } = await supabase.from("vacantes").select(SELECT).eq("empresa_id", id).eq("estado", "publicada").gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()).order("created_at", { ascending: false }).limit(60);
      vacantes = ((v ?? []) as unknown as VacanteRow[]).map(rowToVacante);
    } else {
      if (!/^[a-z0-9-]{2,120}$/.test(id)) throw notFound();
      const jobs = await fetchPublicadas().catch(() => [] as Vacante[]);
      vacantes = jobs.filter((j) => j.empresa !== "Empresa no indicada" && slugDe(j.empresa) === id);
      nombre = vacantes[0]?.empresa ?? "";
      if (!nombre) {
        const { data } = await supabase.rpc("empresa_por_slug" as never, { p_slug: id } as never);
        nombre = typeof data === "string" ? data : "";
      }
      if (!nombre || /confidencial|^empresa no indicada$/i.test(nombre)) throw notFound();
    }
    const slug = slugDe(nombre);
    const opiniones = await cargarOpiniones(slug).catch(() => null);
    return { slug, nombre, cuenta, vacantes, opiniones };
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

function PerfilEmpresa() {
  const d = Route.useLoaderData();
  const { data: opiniones } = useOpiniones(d.slug, d.opiniones ?? undefined);
  const [opinar, setOpinar] = useState<TipoOpinion | null>(null);
  const g = general(opiniones);
  const e = d.cuenta;
  const web = sitioSeguro(e?.sitio_web ?? null);
  const v = d.vacantes;

  // Datos que Enlace sabe de sus vacantes: transparencia real, sin inventar.
  const conSalario = v.filter((x) => x.salarioMin > 0).length;
  const provincias = [...new Set(v.map((x) => x.provincia))].slice(0, 4);
  const areas = [...new Set(v.map((x) => x.area))].slice(0, 4);

  const compartir = async () => {
    const url = `${SITIO}/empresa/${d.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: d.nombre, url });
      else { await navigator.clipboard.writeText(url); toast.success("Enlace copiado"); }
    } catch { /* cancelado */ }
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-foreground">
      <Header />
      {/* Portada */}
      <div className="relative h-36 overflow-hidden bg-[#0a2f5c] sm:h-48">
        <div aria-hidden="true" className="absolute -left-20 -top-24 size-80 rounded-full bg-[#1d6ff2] opacity-40 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-28 right-10 size-80 rounded-full bg-[#f5a700] opacity-25 blur-3xl" />
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
      </div>

      <main className="mx-auto -mt-16 max-w-6xl px-4 pb-16 sm:-mt-20 sm:px-6">
        {/* Tarjeta principal */}
        <section className="relative rounded-3xl border border-border bg-surface p-5 shadow-[0_20px_50px_-30px_rgb(10_47_92/0.45)] sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="-mt-14 w-fit rounded-3xl bg-white p-2 shadow-lg sm:-mt-20"><EmpresaAvatar nombre={d.nombre} className="size-20 text-4xl sm:size-24 sm:text-5xl" /></div>
            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2.5 font-display text-[1.7rem] font-extrabold leading-tight tracking-tight md:text-[2.2rem]">
                {d.nombre}
                {e?.verificada && <span className="inline-flex items-center gap-1 rounded-full bg-[#0f7a43]/10 px-2.5 py-1 font-sans text-xs font-bold text-[#0f7a43]"><BadgeCheck className="size-4" /> Verificada</span>}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {e?.sector && <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" /> {e.sector}</span>}
                {(e?.provincia || provincias[0]) && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {e?.provincia ?? provincias[0]}</span>}
                {web && <a href={web} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 hover:underline"><Globe className="size-4" /> {new URL(web).hostname.replace(/^www\./, "")}</a>}
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
            <div className="flex gap-2 sm:self-start">
              <button type="button" onClick={() => void compartir()} aria-label="Compartir" className="grid size-11 place-items-center rounded-full border border-border hover:bg-secondary"><Share2 className="size-4" /></button>
              {v.length > 0 && <a href="#vacantes" className="btn-aplicar inline-flex h-11 items-center rounded-full px-5">Ver {v.length} {v.length === 1 ? "vacante" : "vacantes"}</a>}
            </div>
          </div>

          <nav className="sticky top-16 z-10 mt-6 -mb-1 flex gap-1 overflow-x-auto border-t border-border pt-3 text-sm font-bold" aria-label="Secciones">
            {[["#sobre", "Sobre la empresa"], ["#calificaciones", "Calificaciones"], ["#vacantes", `Vacantes (${v.length})`]].map(([h, t]) => (
              <a key={h} href={h} className="shrink-0 rounded-full px-4 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground">{t}</a>
            ))}
          </nav>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-6">
            {/* Sobre */}
            <section id="sobre" className="scroll-mt-24 rounded-3xl border border-border bg-surface p-6">
              <h2 className="text-xl font-extrabold">Sobre {d.nombre}</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{e?.descripcion?.trim() || `${d.nombre} publica sus vacantes en Enlace Laboral. Aquí ves sus vacantes abiertas y lo que opinan las personas que aplicaron o trabajaron ahí.`}</p>
              <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                <Dato Icono={Briefcase} t="Vacantes abiertas" v={String(v.length)} />
                <Dato Icono={Banknote} t="Publican el sueldo" v={v.length ? `${Math.round((conSalario / v.length) * 100)}%` : "–"} sub={v.length ? `${conSalario} de ${v.length}` : undefined} />
                <Dato Icono={MapPin} t="Dónde contrata" v={provincias.join(", ") || "–"} />
              </dl>
              {areas.length > 0 && <p className="mt-4 text-sm text-muted-foreground"><b className="text-foreground">Áreas:</b> {areas.join(" · ")}</p>}
              {e && senalesEmpresa(e).length > 0 && (
                <ul className="mt-4 space-y-1.5 text-sm">{senalesEmpresa(e).map((t) => <li key={t} className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-[#0f7a43]" /> {t}</li>)}</ul>
              )}
            </section>

            {/* Calificaciones */}
            <div className="rounded-3xl border border-border bg-surface p-6">
              <Calificaciones datos={opiniones} nombre={d.nombre} onOpinar={setOpinar} />
            </div>

            {/* Vacantes */}
            <section id="vacantes" className="scroll-mt-24">
              <h2 className="text-xl font-extrabold">{v.length ? `${v.length} ${v.length === 1 ? "vacante abierta" : "vacantes abiertas"}` : "Sin vacantes abiertas ahora"}</h2>
              {v.length === 0 ? <p className="mt-2 text-muted-foreground">Vuelve pronto o crea una alerta para enterarte cuando publique.</p> : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">{v.map((x) => <VacanteTarjeta key={x.id} job={x} />)}</div>
              )}
            </section>
          </div>

          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="rounded-3xl bg-[#0a2f5c] p-6 text-white">
              <p className="text-lg font-extrabold leading-tight">¿Aplicaste o trabajaste en {d.nombre}?</p>
              <p className="mt-2 text-sm text-white/80">Tu opinión ayuda a otra persona a decidir. Nunca mostramos tu nombre.</p>
              <div className="mt-4 grid gap-2">
                <button type="button" onClick={() => setOpinar("trabajo")} className="h-11 rounded-full bg-white font-bold text-[#0a2f5c] hover:bg-white/90">Opinar de trabajar aquí</button>
                <button type="button" onClick={() => setOpinar("proceso")} className="h-11 rounded-full border border-white/40 font-bold hover:bg-white/10">Opinar del proceso de selección</button>
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-surface p-5 text-sm text-muted-foreground">
              {e?.verificada ? "Verificamos que esta empresa existe con su RNC y un contacto real." : "Revisamos cada vacante de esta empresa antes de publicarla."} Aplicar es gratis: ninguna empresa seria te cobra por contratarte.
            </div>
          </aside>
        </div>
      </main>
      <Footer />
      {opinar && <Opinar slug={d.slug} nombre={d.nombre} tipoInicial={opinar} onCerrar={() => setOpinar(null)} />}
    </div>
  );
}

function Dato({ Icono, t, v, sub }: { Icono: typeof Briefcase; t: string; v: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-4">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Icono className="size-3.5" /> {t}</dt>
      <dd className="mt-1 text-lg font-extrabold leading-tight">{v}{sub && <span className="ml-1.5 text-xs font-semibold text-muted-foreground">{sub}</span>}</dd>
    </div>
  );
}

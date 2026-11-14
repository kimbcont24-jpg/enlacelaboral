import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock, Copy, FileText, Linkedin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Contenido } from "@/components/blog/Contenido";
import { Etiqueta, Tapa } from "@/components/blog/Tapa";
import { BLOG, analizar, articuloPorSlug, articulosPublicados, categoria, fechaLarga, fraseDe, minutosLectura, textoPlano, type Articulo } from "@/lib/blog";
import { SITIO } from "@/lib/vacantes";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const [articulo, todos] = await Promise.all([articuloPorSlug(params.slug), articulosPublicados(24)]);
    if (!articulo) throw notFound();
    const otros = todos.filter((a) => a.id !== articulo.id);
    const relacionados = [...otros.filter((a) => a.categoria === articulo.categoria), ...otros.filter((a) => a.categoria !== articulo.categoria)].slice(0, 3);
    return { articulo, relacionados };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: `Artículo no disponible | ${BLOG.nombre}` }, { name: "robots", content: "noindex" }] };
    const a = loaderData.articulo;
    const url = `${SITIO}/blog/${a.slug}`;
    const desc = textoPlano(a.bajada || a.contenido).slice(0, 160);
    const img = `${SITIO}/og/blog/${a.slug}.png`;
    const ld = JSON.stringify({
      "@context": "https://schema.org", "@type": "BlogPosting", headline: a.titulo, description: desc, image: img,
      datePublished: a.publicado_at, dateModified: a.updated_at, inLanguage: "es-DO", mainEntityOfPage: url,
      author: { "@type": "Person", name: a.autor }, publisher: { "@type": "Organization", name: "Enlace Laboral", url: SITIO },
    });
    return {
      meta: [
        { title: `${a.titulo} | ${BLOG.nombre} · Enlace Laboral` }, { name: "description", content: desc },
        { property: "og:title", content: a.titulo }, { property: "og:description", content: desc }, { property: "og:type", content: "article" },
        { property: "og:url", content: url }, { property: "og:image", content: img }, { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" }, { name: "twitter:image", content: img }, { property: "article:published_time", content: a.publicado_at ?? "" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: ld }],
    };
  },
  component: Lector,
});

function Progreso({ color }: { color: string }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const f = () => { const el = document.getElementById("cuerpo"); if (!el) return; const r = el.getBoundingClientRect(); const total = r.height - window.innerHeight * 0.6; setP(Math.min(1, Math.max(0, -r.top / Math.max(total, 1)))); };
    f();
    window.addEventListener("scroll", f, { passive: true });
    window.addEventListener("resize", f);
    return () => { window.removeEventListener("scroll", f); window.removeEventListener("resize", f); };
  }, []);
  return <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent"><div className="h-full origin-left" style={{ transform: `scaleX(${p})`, background: `linear-gradient(90deg, #1d6ff2, ${color})` }} /></div>;
}

function Compartir({ a, vertical = false }: { a: Articulo; vertical?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  const url = `${SITIO}/blog/${a.slug}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${a.titulo}\n${url}`)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const copiar = async () => {
    try { await navigator.clipboard.writeText(url); setCopiado(true); toast.success("Enlace copiado"); setTimeout(() => setCopiado(false), 2000); } catch { toast.error("No se pudo copiar"); }
  };
  const b = "grid size-11 place-items-center rounded-full bg-surface text-[#0a2f5c] ring-1 ring-border transition hover:-translate-y-0.5 hover:ring-[#1d6ff2]";
  return (
    <div className={`flex gap-2 ${vertical ? "flex-col" : ""}`}>
      <a href={wa} target="_blank" rel="noopener noreferrer" className={b} aria-label="Compartir por WhatsApp"><MessageCircle className="size-5" /></a>
      <a href={li} target="_blank" rel="noopener noreferrer" className={b} aria-label="Compartir en LinkedIn"><Linkedin className="size-5" /></a>
      <button type="button" onClick={() => void copiar()} className={b} aria-label="Copiar enlace">{copiado ? <Check className="size-5 text-success" /> : <Copy className="size-5" />}</button>
    </div>
  );
}

function Lector() {
  const { articulo: a, relacionados } = Route.useLoaderData();
  const c = categoria(a.categoria);
  const bloques = useMemo(() => analizar(a.contenido), [a.contenido]);
  const indice = bloques.filter((b): b is Extract<typeof b, { tipo: "h2" }> => b.tipo === "h2");
  const [activo, setActivo] = useState<string>("");
  useEffect(() => {
    if (!indice.length) return;
    const obs = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setActivo(e.target.id); }, { rootMargin: "-20% 0px -70% 0px" });
    for (const h of indice) { const el = document.getElementById(h.id); if (el) obs.observe(el); }
    return () => obs.disconnect();
  }, [indice]);
  const min = minutosLectura(a.contenido);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Progreso color={c.color} />
      <Header />

      <article>
        <header className="relative isolate overflow-hidden bg-[#06162e] px-4 pb-40 pt-10 text-white sm:px-6 md:pb-52 md:pt-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-32 top-0 size-[30rem] rounded-full blur-[130px]" style={{ background: `${c.color}55` }} />
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 46px, #8ec1ff 46px 47px)" }} />
          </div>
          <div className="mx-auto max-w-4xl blog-entra">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"><ArrowLeft className="size-4" /> {BLOG.nombre}</Link>
            <div className="mt-6"><Etiqueta cat={a.categoria} claro /></div>
            <h1 className="mt-5 text-balance font-display text-[2.2rem] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[2.9rem] md:text-[3.7rem]">{a.titulo}</h1>
            {a.bajada && <p className="mt-6 max-w-3xl text-balance text-lg leading-relaxed text-white/80 md:text-[1.35rem]">{textoPlano(a.bajada)}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1d6ff2] to-[#8ec1ff] font-display text-sm font-extrabold text-[#06162e]">{a.autor.split(/\s+/).map((p) => p[0]).slice(0, 2).join("")}</span>
                <div>
                  <p className="font-bold">{a.autor}</p>
                  <p className="text-sm text-white/65">{[a.autor_cargo, fechaLarga(a.publicado_at)].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/15"><Clock className="size-4" aria-hidden="true" /> {min} min de lectura</span>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto -mt-32 max-w-5xl px-4 sm:px-6 md:-mt-40">
          <Tapa titulo={a.titulo} cat={a.categoria} portada={a.portada} frase={fraseDe(a.contenido)} grande variante={2} className="aspect-[16/9] rounded-[2rem] shadow-[0_50px_100px_-50px_rgb(6_22_46/0.9)] md:aspect-[21/9]" />
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[200px_minmax(0,42rem)_1fr] lg:pt-16">
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-8">
              {indice.length > 1 && (
                <nav aria-label="En este artículo">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-muted-foreground">En este artículo</p>
                  <ol className="mt-3 space-y-1 border-l border-border">
                    {indice.map((h) => (
                      <li key={h.id}><a href={`#${h.id}`} className={`-ml-px block border-l-2 py-1.5 pl-3 text-sm leading-snug transition ${activo === h.id ? "font-bold text-[#0a2f5c]" : "border-transparent text-muted-foreground hover:text-foreground"}`} style={activo === h.id ? { borderColor: c.color } : undefined}>{textoPlano(h.texto)}</a></li>
                    ))}
                  </ol>
                </nav>
              )}
              <div><p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-muted-foreground">Compartir</p><Compartir a={a} /></div>
            </div>
          </aside>

          <div id="cuerpo" className="min-w-0">
            <Contenido bloques={bloques} color={c.color} />

            {a.etiquetas.length > 0 && (
              <div className="mt-12 flex flex-wrap gap-2">{a.etiquetas.map((t) => <span key={t} className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-muted-foreground ring-1 ring-border">#{t}</span>)}</div>
            )}

            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-border bg-surface p-6">
              <div><p className="font-extrabold text-[#0a2f5c]">¿Le puede servir a alguien?</p><p className="text-sm text-muted-foreground">Compártelo con quien esté buscando empleo.</p></div>
              <Compartir a={a} />
            </div>

            <div className="mt-6 flex gap-4 rounded-[1.75rem] bg-[#f3f7fd] p-6 ring-1 ring-[#1d6ff2]/15">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#0a2f5c] font-display text-base font-extrabold text-white">{a.autor.split(/\s+/).map((p) => p[0]).slice(0, 2).join("")}</span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1557c4]">Escrito por</p>
                <p className="mt-1 text-lg font-extrabold text-[#0a2f5c]">{a.autor}</p>
                {a.autor_cargo && <p className="text-sm text-muted-foreground">{a.autor_cargo}</p>}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Siguiente paso */}
      <section className="px-4 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 overflow-hidden rounded-[2rem] bg-[#0a2f5c] p-8 text-white md:grid-cols-[1fr_auto_auto] md:items-center md:p-10">
          <div><p className="font-display text-2xl font-extrabold">Del artículo a la acción</p><p className="mt-1 text-white/75">Vacantes revisadas en todo el país y un CV gratis que puedes armar en minutos.</p></div>
          <Link to="/vacantes" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-bold text-[#0a2f5c] hover:bg-[#e8eef6]">Ver vacantes <ArrowRight className="size-4" /></Link>
          <Link to="/cv" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 font-bold ring-1 ring-white/30 hover:bg-white/10"><FileText className="size-4" /> Armar mi CV</Link>
        </div>
      </section>

      {relacionados.length > 0 && (
        <section aria-labelledby="sigue" className="px-4 pb-20 pt-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end justify-between gap-3">
              <h2 id="sigue" className="font-display text-[1.7rem] font-extrabold tracking-tight text-[#0a2f5c]">Sigue leyendo</h2>
              <Link to="/blog" className="text-sm font-bold text-[#1557c4] hover:underline">Ver todo el blog</Link>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {relacionados.map((r, i) => (
                <Link key={r.id} to="/blog/$slug" params={{ slug: r.slug }} className="group overflow-hidden rounded-[1.75rem] border border-border bg-surface transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-36px_rgb(10_47_92/0.55)]">
                  <Tapa titulo={r.titulo} cat={r.categoria} portada={r.portada} frase={fraseDe(r.contenido)} variante={i} className="aspect-[16/10]" />
                  <div className="p-5">
                    <Etiqueta cat={r.categoria} />
                    <p className="mt-3 text-lg font-extrabold leading-snug text-[#0a2f5c] group-hover:text-[#1557c4]">{r.titulo}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{minutosLectura(r.contenido)} min de lectura</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
}

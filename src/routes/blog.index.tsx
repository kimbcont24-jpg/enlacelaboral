import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Clock, Feather, Search, X } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";
import { Etiqueta, Tapa } from "@/components/blog/Tapa";
import { BLOG, CATEGORIAS, articulosPublicados, categoria, fechaLarga, fraseDe, minutosLectura, textoPlano, type Articulo, type Categoria } from "@/lib/blog";
import { SITIO } from "@/lib/vacantes";

export const Route = createFileRoute("/blog/")({
  loader: async () => ({ articulos: await articulosPublicados() }),
  head: () => ({
    meta: [
      { title: `${BLOG.nombre} · Blog de empleo y Gestión Humana en RD | Enlace Laboral` },
      { name: "description", content: BLOG.descripcion },
      { property: "og:title", content: `${BLOG.nombre} · ${BLOG.lema}` },
      { property: "og:description", content: BLOG.descripcion },
      { property: "og:url", content: `${SITIO}/blog` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITIO}/blog` }],
  }),
  component: BlogInicio,
});

const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Meta({ a, claro = false }: { a: Articulo; claro?: boolean }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] ${claro ? "text-white/70" : "text-muted-foreground"}`}>
      <span className="font-semibold">{a.autor}</span>
      <span aria-hidden="true">·</span>
      <span>{fechaLarga(a.publicado_at)}</span>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden="true" />{minutosLectura(a.contenido)} min</span>
    </p>
  );
}

function Tarjeta({ a, i }: { a: Articulo; i: number }) {
  return (
    <Link to="/blog/$slug" params={{ slug: a.slug }} className="group blog-entra flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-surface transition hover:-translate-y-1 hover:border-transparent hover:shadow-[0_30px_60px_-36px_rgb(10_47_92/0.55)]" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
      <Tapa titulo={a.titulo} cat={a.categoria} portada={a.portada} frase={fraseDe(a.contenido)} variante={i} className="aspect-[16/10] transition duration-500 group-hover:scale-[1.015]" />
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <Etiqueta cat={a.categoria} className="self-start" />
        <h3 className="mt-3 text-balance text-[1.28rem] font-extrabold leading-snug tracking-tight text-[#0a2f5c] group-hover:text-[#1557c4]">{a.titulo}</h3>
        {a.bajada && <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">{textoPlano(a.bajada)}</p>}
        <div className="mt-auto pt-5"><Meta a={a} /></div>
      </div>
    </Link>
  );
}

function BlogInicio() {
  const { articulos } = Route.useLoaderData();
  const [tema, setTema] = useState<Categoria | "todos">("todos");
  const [q, setQ] = useState("");

  const portada = useMemo(() => articulos.find((a) => a.destacado) ?? articulos[0], [articulos]);
  const lista = useMemo(() => {
    const b = sinTildes(q.trim());
    return articulos.filter((a) => (tema === "todos" || a.categoria === tema) && (!b || sinTildes(`${a.titulo} ${a.bajada} ${a.contenido} ${a.etiquetas.join(" ")}`).includes(b)));
  }, [articulos, tema, q]);
  const filtrando = tema !== "todos" || !!q.trim();
  const resto = filtrando ? lista : lista.filter((a) => a.id !== portada?.id);
  const conteo = (c: Categoria) => articulos.filter((a) => a.categoria === c).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Portada */}
      <header className="relative isolate overflow-hidden bg-[#06162e] px-4 pb-16 pt-12 text-white sm:px-6 md:pb-24 md:pt-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 top-10 size-[34rem] rounded-full bg-[#1d6ff2]/25 blur-[120px]" />
          <div className="absolute -right-32 -top-20 size-[28rem] rounded-full bg-[#6d28d9]/20 blur-[120px]" />
          {/* renglones de libreta */}
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 46px, #8ec1ff 46px 47px)" }} />
        </div>
        <div className="mx-auto grid max-w-7xl items-end gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div className="blog-entra">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90 ring-1 ring-white/15"><Feather className="size-4 text-[#8ec1ff]" aria-hidden="true" /> {BLOG.lema}</p>
            <h1 className="mt-6 font-display text-[3.4rem] font-extrabold leading-[0.92] tracking-[-0.03em] sm:text-[4.6rem] md:text-[6rem]">
              Entre<br />
              <span className="relative inline-block">
                líneas
                <span aria-hidden="true" className="absolute -bottom-5 left-0 right-0 flex flex-col gap-1.5 md:-bottom-7 md:gap-2">
                  <span className="h-[5px] w-full rounded-full bg-[#1d6ff2] md:h-[7px]" />
                  <span className="h-[5px] w-2/3 rounded-full bg-[#8ec1ff] md:h-[7px]" />
                </span>
              </span>
            </h1>
            <p className="mt-10 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">Lo que pasa detrás de una vacante, contado desde Gestión Humana. Reclutamiento por dentro, la parte emocional de buscar trabajo, tus derechos en RD y la tecnología que está cambiando la forma de contratar.</p>
            <label className="mt-8 flex max-w-lg items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 text-[#0a2f5c] shadow-[0_20px_50px_-20px_rgb(0_0_0/0.6)]">
              <Search className="size-5 shrink-0 text-[#5b6b80]" aria-hidden="true" />
              <span className="sr-only">Buscar en el blog</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca: entrevista, rechazo, salario, IA…" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#5b6b80]" />
              {q && <button type="button" onClick={() => setQ("")} aria-label="Borrar búsqueda"><X className="size-4" /></button>}
            </label>
          </div>

          {portada && !filtrando && (
            <Link to="/blog/$slug" params={{ slug: portada.slug }} className="group blog-entra relative block overflow-hidden rounded-[2rem] ring-1 ring-white/15 shadow-[0_40px_90px_-40px_rgb(0_0_0/0.85)]" style={{ animationDelay: "120ms" }}>
              <Tapa titulo={portada.titulo} cat={portada.categoria} portada={portada.portada} conTexto variante={1} className="aspect-[4/5] transition duration-700 group-hover:scale-[1.02] sm:aspect-[5/4] lg:aspect-[4/5] xl:aspect-[5/5]" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06162e] via-[#06162e]/80 to-transparent p-6 pt-24 md:p-8 md:pt-32">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#8ec1ff]">Para leer hoy</p>
                <Etiqueta cat={portada.categoria} claro className="mt-3" />
                <h2 className="mt-3 text-balance font-display text-[1.6rem] font-extrabold leading-[1.1] tracking-tight md:text-[2.1rem]">{portada.titulo}</h2>
                {portada.bajada && <p className="mt-3 line-clamp-2 text-white/80">{textoPlano(portada.bajada)}</p>}
                <div className="mt-4 flex items-center justify-between gap-3"><Meta a={portada} claro /><span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#0a2f5c] transition group-hover:rotate-45"><ArrowUpRight className="size-5" /></span></div>
              </div>
            </Link>
          )}
        </div>
      </header>

      {/* Temas */}
      <nav aria-label="Temas del blog" className="sticky top-16 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 [scrollbar-width:none]">
          <button type="button" aria-pressed={tema === "todos"} onClick={() => setTema("todos")} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${tema === "todos" ? "bg-[#0a2f5c] text-white" : "bg-surface ring-1 ring-border hover:ring-[#1d6ff2]"}`}>Todo</button>
          {CATEGORIAS.map((c) => {
            const activo = tema === c.id;
            return (
              <button key={c.id} type="button" aria-pressed={activo} onClick={() => setTema(activo ? "todos" : c.id)} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${activo ? "text-white" : "bg-surface ring-1 ring-border hover:ring-[var(--c)]"}`} style={{ "--c": c.color, ...(activo ? { background: c.color } : {}) } as React.CSSProperties}>
                <span className="size-2 rounded-full" style={{ background: activo ? "#fff" : c.color }} />{c.t}{conteo(c.id) > 0 && <span className={`text-xs ${activo ? "text-white/80" : "text-muted-foreground"}`}>{conteo(c.id)}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="px-4 pb-20 pt-10 sm:px-6 md:pt-14">
        <div className="mx-auto max-w-7xl">
          {articulos.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-[2rem] border border-dashed border-border bg-surface p-10 text-center">
              <Feather className="mx-auto size-10 text-[#1d6ff2]" aria-hidden="true" />
              <h2 className="mt-4 font-display text-2xl font-extrabold text-[#0a2f5c]">Los primeros artículos vienen en camino</h2>
              <p className="mt-2 text-muted-foreground">Mientras tanto, revisa las guías cortas para tu búsqueda de empleo.</p>
              <Link to="/recursos" className="btn-aplicar mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm">Ver guías <ArrowRight className="size-4" /></Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#1d6ff2]">{filtrando ? "Resultados" : "Lo más reciente"}</p>
                  <h2 className="mt-1 font-display text-[1.8rem] font-extrabold tracking-tight text-[#0a2f5c] md:text-[2.3rem]">{tema !== "todos" ? categoria(tema).t : q.trim() ? `«${q.trim()}»` : "Para leer con calma"}</h2>
                  {tema !== "todos" && <p className="mt-1 text-muted-foreground">{categoria(tema).d}</p>}
                </div>
                <p className="text-sm text-muted-foreground">{lista.length} {lista.length === 1 ? "artículo" : "artículos"}</p>
              </div>
              {resto.length === 0 ? (
                <p className="mt-10 rounded-2xl bg-surface p-8 text-center text-muted-foreground ring-1 ring-border">{filtrando ? "No hay artículos con esa búsqueda todavía." : "Por ahora solo está el artículo de portada. Pronto habrá más."}</p>
              ) : (
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{resto.map((a, i) => <Tarjeta key={a.id} a={a} i={i} />)}</div>
              )}
            </>
          )}

          {/* Quién escribe */}
          <section aria-labelledby="quien" className="relative mt-20 overflow-hidden rounded-[2rem] bg-[#0a2f5c] p-8 text-white md:p-12">
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-96 rounded-[999px] border-[40px] border-white/[0.05]" />
            <div className="relative grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
              <span className="grid size-24 place-items-center rounded-[1.75rem] bg-gradient-to-br from-[#1d6ff2] to-[#8ec1ff] font-display text-3xl font-extrabold text-[#06162e] md:size-28">KC</span>
              <div>
                <p id="quien" className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#8ec1ff]">Quién escribe</p>
                <p className="mt-2 font-display text-[1.6rem] font-extrabold leading-tight md:text-[2rem]">Kimberly Contreras</p>
                <p className="mt-3 max-w-3xl text-lg leading-relaxed text-white/80">Psicóloga organizacional con diez años en Gestión Humana, en reclutamiento y selección de puestos operativos hasta gerenciales. Escribe aquí sobre lo que ve todos los días del otro lado del proceso, y sobre cómo los datos y la IA pueden ayudar sin quitarle el lugar al criterio humano.</p>
              </div>
            </div>
          </section>

          {/* Cierre */}
          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] border border-border bg-surface p-8">
              <p className="font-display text-xl font-extrabold text-[#0a2f5c]">¿Ya estás buscando?</p>
              <p className="mt-2 text-muted-foreground">Vacantes revisadas, con salario cuando la empresa lo comparte. Aplicar es gratis.</p>
              <Link to="/vacantes" className="btn-aplicar mt-5 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm">Ver vacantes <ArrowRight className="size-4" /></Link>
            </div>
            <div className="rounded-[2rem] border border-border bg-surface p-8">
              <p className="font-display text-xl font-extrabold text-[#0a2f5c]">Recibe lo nuevo por WhatsApp</p>
              <p className="mt-2 mb-5 text-muted-foreground">Vacantes y artículos nuevos en el canal de Enlace Laboral.</p>
              <CanalWhatsApp variante="boton" />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

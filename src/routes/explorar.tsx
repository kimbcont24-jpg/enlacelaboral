import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { colecciones } from "@/lib/colecciones";
import { areas, nivelesExperiencia } from "@/lib/data";
import { empresasActivas, slug } from "@/lib/empleos";
import { fetchPublicadas, SITIO, type Vacante } from "@/lib/vacantes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explorar")({
  loader: async () => ({ jobs: await fetchPublicadas().catch(() => [] as Vacante[]) }),
  head: () => ({
    meta: [
      { title: "Mapa del empleo en RD: vacantes por área, sector y provincia | Enlace Laboral" },
      { name: "description", content: "Mira en vivo dónde está el empleo en República Dominicana: qué áreas contratan más, en qué provincias, cuántas vacantes son sin experiencia, del sector público o con salario visible." },
      { property: "og:title", content: "Mapa del empleo en República Dominicana · Enlace Laboral" },
      { property: "og:description", content: "Las vacantes activas clasificadas por área, tipo de oportunidad, provincia y nivel." },
    ],
    links: [{ rel: "canonical", href: `${SITIO}/explorar` }],
  }),
  component: Explorar,
});

/* ───────── Datos ───────── */

type Grupo = { key: string; nombre: string; slug: string | null; jobs: Vacante[] };
type Lente = "area" | "oportunidad" | "provincia" | "nivel";

const LENTES: { id: Lente; label: string; pregunta: string }[] = [
  { id: "area", label: "Área", pregunta: "¿Qué áreas están contratando más?" },
  { id: "oportunidad", label: "Tipo de oportunidad", pregunta: "¿Qué clase de oportunidad buscas?" },
  { id: "provincia", label: "Provincia", pregunta: "¿Dónde está el empleo?" },
  { id: "nivel", label: "Experiencia", pregunta: "¿Cuánta experiencia piden?" },
];

const nombreProv = (p: string) => p.replace(/\s*\(.*?\)\s*/g, "").replace("Remoto desde RD", "Desde casa");
const slugProv = (p: string) => slug(p.replace(/\s*\(.*?\)\s*/g, "").replace("Remoto desde RD", "Remoto"));

function agrupar(jobs: Vacante[], lente: Lente): Grupo[] {
  if (lente === "area") return areas.map((a) => ({ key: a, nombre: a, slug: slug(a), jobs: jobs.filter((j) => j.area === a) }));
  if (lente === "oportunidad") return colecciones.map((c) => ({ key: c.id, nombre: c.nombre, slug: c.slug, jobs: jobs.filter(c.enColeccion) }));
  if (lente === "nivel") return nivelesExperiencia.map((n) => ({ key: n, nombre: n, slug: n === "Sin experiencia" ? "sin-experiencia" : null, jobs: jobs.filter((j) => j.experiencia === n) }));
  const m = new Map<string, { p: string; l: Vacante[] }>();
  for (const j of jobs) {
    if (!j.provincia || j.provincia === "Toda República Dominicana") continue;
    const k = nombreProv(j.provincia);
    const x = m.get(k) ?? { p: j.provincia, l: [] };
    x.l.push(j);
    m.set(k, x);
  }
  const orden = [...m].map(([k, x]) => [k, x.p, x.l] as const).sort((a, b) => b[2].length - a[2].length);
  const top = orden.slice(0, 11).map(([k, p, l]) => ({ key: k, nombre: k, slug: slugProv(p), jobs: [...l] }));
  const resto = orden.slice(11).flatMap(([, , l]) => l);
  return resto.length ? [...top, { key: "otras", nombre: `Otras ${orden.length - 11} provincias`, slug: null, jobs: resto }] : top;
}

const semana = () => Date.now() - 7 * 864e5;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

function resumen(g: Grupo) {
  const s = semana();
  const sueldos = g.jobs.filter((j) => j.salarioMin > 0).map((j) => (j.salarioMax ? (j.salarioMin + j.salarioMax) / 2 : j.salarioMin)).sort((a, b) => a - b);
  const mediana = sueldos.length >= 3 ? sueldos[Math.floor(sueldos.length / 2)] : null;
  return {
    nuevas: g.jobs.filter((j) => new Date(j.creado).getTime() >= s).length,
    conSalario: pct(sueldos.length, g.jobs.length),
    mediana,
    sinExp: pct(g.jobs.filter((j) => j.experiencia === "Sin experiencia").length, g.jobs.length),
    empresas: empresasActivas(g.jobs).slice(0, 4),
    recientes: [...g.jobs].sort((a, b) => b.creado.localeCompare(a.creado)).slice(0, 4),
  };
}

/* ───────── Treemap (squarified) ───────── */

type Rect = { x: number; y: number; w: number; h: number };
function squarify(valores: number[], caja: Rect): Rect[] {
  const total = valores.reduce((a, b) => a + b, 0);
  if (!total) return valores.map(() => ({ x: 0, y: 0, w: 0, h: 0 }));
  const area = valores.map((v) => (v / total) * caja.w * caja.h);
  const out: Rect[] = new Array(valores.length);
  let { x, y, w, h } = caja;
  let i = 0;
  const peor = (fila: number[], lado: number) => {
    const s = fila.reduce((a, b) => a + b, 0);
    return Math.max(...fila.map((r) => Math.max((lado * lado * r) / (s * s), (s * s) / (lado * lado * r))));
  };
  while (i < area.length) {
    const lado = Math.min(w, h);
    const fila = [area[i]];
    let j = i + 1;
    while (j < area.length && peor([...fila, area[j]], lado) <= peor(fila, lado)) fila.push(area[j++]);
    const s = fila.reduce((a, b) => a + b, 0);
    if (w >= h) {
      const ancho = s / h;
      let yy = y;
      fila.forEach((r, k) => { out[i + k] = { x, y: yy, w: ancho, h: r / ancho }; yy += r / ancho; });
      x += ancho; w -= ancho;
    } else {
      const alto = s / w;
      let xx = x;
      fila.forEach((r, k) => { out[i + k] = { x: xx, y, w: r / alto, h: alto }; xx += r / alto; });
      y += alto; h -= alto;
    }
    i = j;
  }
  return out;
}

/** Un solo tono (el azul de la marca) que se aclara según el tamaño: ordena sin llenar la pantalla de colores. */
const tono = (rank: number, n: number) => {
  const t = n <= 1 ? 0 : rank / (n - 1);
  const l = 21 + t * 40; // de azul noche a azul medio
  return `hsl(213 ${80 - t * 25}% ${l}%)`;
};

function Mosaico({ grupos, activo, onElegir, W, H, className }: { grupos: Grupo[]; activo: string; onElegir: (k: string) => void; W: number; H: number; className?: string }) {
  const visibles = grupos.filter((g) => g.jobs.length > 0).sort((a, b) => b.jobs.length - a.jobs.length);
  const total = visibles.reduce((a, g) => a + g.jobs.length, 0);
  const rects = squarify(visibles.map((g) => g.jobs.length), { x: 0, y: 0, w: W, h: H });
  return (
    <div className={cn("relative w-full overflow-hidden rounded-3xl bg-[#071f3d]", className)} style={{ aspectRatio: `${W} / ${H}` }}>
      {visibles.map((g, i) => {
        const r = rects[i];
        const grande = r.w > W * 0.16 && r.h > H * 0.16;
        const mini = r.w < W * 0.09 || r.h < H * 0.09;
        const conNombre = !mini && r.w > W * 0.12 && r.h > H * 0.15;
        const sel = g.key === activo;
        return (
          <button
            key={g.key}
            type="button"
            onClick={() => onElegir(g.key)}
            aria-pressed={sel}
            aria-label={`${g.nombre}: ${g.jobs.length} vacantes`}
            title={`${g.nombre}: ${g.jobs.length}`}
            className="mosaico-tile group absolute p-[3px] text-left focus:outline-none"
            style={{ left: `${(r.x / W) * 100}%`, top: `${(r.y / H) * 100}%`, width: `${(r.w / W) * 100}%`, height: `${(r.h / H) * 100}%`, animationDelay: `${i * 35}ms` }}
          >
            <span
              className={cn("flex h-full w-full flex-col justify-between overflow-hidden rounded-[14px] text-white transition-all duration-300", sel ? "ring-2 ring-white ring-offset-0 brightness-110" : "group-hover:brightness-125 group-focus-visible:ring-2 group-focus-visible:ring-white")}
              style={{ background: tono(i, visibles.length), padding: mini ? "6px 8px" : grande ? "18px 20px" : "10px 12px" }}
            >
              {conNombre ? <span className={cn("line-clamp-2 min-w-0 font-bold leading-tight [overflow-wrap:anywhere]", grande ? "text-lg sm:text-xl" : "text-[13px]")}>{g.nombre}</span> : <span className="sr-only">{g.nombre}</span>}
              <span className="leading-none">
                <span className={cn("font-extrabold tabular-nums tracking-tight", grande ? "text-4xl sm:text-5xl" : mini ? "text-sm" : "text-2xl")}>{g.jobs.length}</span>
                {grande && <span className="ml-2 text-sm font-semibold text-white/70">{pct(g.jobs.length, total)}%</span>}
              </span>
            </span>
          </button>
        );
      })}
      {visibles.length === 0 && <p className="absolute inset-0 grid place-items-center text-sm text-white/70">Cargando vacantes…</p>}
    </div>
  );
}

/** En el celular el mosaico queda muy apretado: la misma información como ranking de barras. */
function Barras({ grupos, activo, onElegir }: { grupos: Grupo[]; activo: string; onElegir: (k: string) => void }) {
  const visibles = grupos.filter((g) => g.jobs.length > 0).sort((a, b) => b.jobs.length - a.jobs.length);
  const max = Math.max(1, ...visibles.map((g) => g.jobs.length));
  return (
    <ol className="space-y-1.5 sm:hidden">
      {visibles.map((g, i) => {
        const sel = g.key === activo;
        return (
          <li key={g.key} className="mosaico-tile" style={{ animationDelay: `${i * 30}ms` }}>
            <button type="button" onClick={() => onElegir(g.key)} aria-pressed={sel} className={cn("relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left text-sm transition-colors", sel ? "bg-[#0a2f5c] text-white" : "bg-secondary/70")}>
              <span aria-hidden="true" className="absolute inset-y-0 left-0 rounded-xl" style={{ width: `${(g.jobs.length / max) * 100}%`, background: sel ? "rgba(255,255,255,.12)" : tono(i, visibles.length), opacity: sel ? 1 : 0.16 }} />
              <span className="relative flex min-w-0 items-center gap-2.5"><span className={cn("w-5 text-xs font-bold tabular-nums", sel ? "text-white/60" : "text-muted-foreground")}>{i + 1}</span><span className="truncate font-semibold">{g.nombre}</span></span>
              <span className="relative font-extrabold tabular-nums">{g.jobs.length}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ───────── Página ───────── */

function Explorar() {
  const { jobs } = Route.useLoaderData();
  const [lente, setLente] = useState<Lente>("area");
  const grupos = useMemo(() => agrupar(jobs, lente), [jobs, lente]);
  const mayor = useMemo(() => [...grupos].sort((a, b) => b.jobs.length - a.jobs.length)[0]?.key ?? "", [grupos]);
  const [elegido, setElegido] = useState<string | null>(null);
  const activo = grupos.find((g) => g.key === elegido) ? (elegido as string) : mayor;
  const g = grupos.find((x) => x.key === activo);
  const r = g ? resumen(g) : null;

  const s = semana();
  const totales = {
    vacantes: jobs.length,
    empresas: empresasActivas(jobs).length,
    nuevas: jobs.filter((j) => new Date(j.creado).getTime() >= s).length,
    salario: pct(jobs.filter((j) => j.salarioMin > 0).length, jobs.length),
  };
  const lenteInfo = LENTES.find((l) => l.id === lente)!;
  const cambiar = (l: Lente) => { setLente(l); setElegido(null); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Portada */}
      <section className="relative overflow-hidden bg-[#0a2f5c] px-4 pb-24 pt-12 text-white sm:px-6 sm:pt-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7fb2ff]">Mapa del empleo</p>
          <h1 className="mt-2 max-w-3xl text-balance text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">Así se mueve el empleo en República Dominicana</h1>
          <p className="mt-3 max-w-2xl text-white/75 sm:text-lg">Todas las vacantes activas en Enlace, clasificadas en vivo. Toca un bloque y mira quién contrata, cuánto pagan y qué salió esta semana.</p>
          <dl className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
            {[
              [totales.vacantes.toLocaleString("es-DO"), "vacantes activas"],
              [totales.empresas.toLocaleString("es-DO"), "empresas contratando"],
              [`+${totales.nuevas.toLocaleString("es-DO")}`, "nuevas esta semana"],
              [`${totales.salario}%`, "con salario visible"],
            ].map(([n, t]) => (
              <div key={t} className="bg-[#0a2f5c] px-5 py-4">
                <dt className="sr-only">{t}</dt>
                <dd className="text-3xl font-extrabold tabular-nums tracking-tight sm:text-4xl">{n}</dd>
                <dd className="mt-0.5 text-sm text-white/65">{t}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Mosaico + detalle */}
      <section className="relative -mt-14 px-4 sm:px-6" aria-labelledby="mosaico-titulo">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-border bg-surface p-4 shadow-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 id="mosaico-titulo" className="text-xl font-extrabold tracking-tight sm:text-2xl">{lenteInfo.pregunta}</h2>
            <div role="tablist" aria-label="Clasificar por" className="-mx-1 flex gap-1 overflow-x-auto rounded-full bg-secondary p-1 text-sm font-bold [scrollbar-width:none]">
              {LENTES.map((l) => (
                <button key={l.id} type="button" role="tab" aria-selected={lente === l.id} onClick={() => cambiar(l.id)} className={cn("shrink-0 rounded-full px-4 py-2 transition-colors", lente === l.id ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground")}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          {lente === "oportunidad" && <p className="mt-2 text-xs text-muted-foreground">Una misma vacante puede estar en varios tipos (por ejemplo, sin experiencia y con salario visible).</p>}

          <div className="mt-5 grid gap-5 lg:grid-cols-12">
            <div key={lente} className="min-w-0 lg:col-span-8">
              <Mosaico grupos={grupos} activo={activo} onElegir={setElegido} W={1000} H={700} className="hidden sm:block" />
              <Barras grupos={grupos} activo={activo} onElegir={setElegido} />
            </div>

            {/* Detalle del bloque elegido */}
            <aside className="min-w-0 lg:col-span-4" aria-live="polite">
              {g && r && (
                <div key={g.key} className="flex h-full flex-col rounded-3xl border border-border p-5 [animation:entra-arriba_.35s_ease-out]">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{lenteInfo.label}</p>
                  <h3 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight">{g.nombre}</h3>
                  <p className="mt-1 text-sm text-muted-foreground"><b className="text-foreground">{g.jobs.length}</b> {g.jobs.length === 1 ? "vacante" : "vacantes"}{r.nuevas > 0 && <> · <b className="text-[#1d6ff2]">+{r.nuevas}</b> esta semana</>}</p>

                  {g.jobs.length > 0 ? (
                    <>
                      <dl className="mt-5 grid grid-cols-3 divide-x divide-border rounded-2xl bg-secondary/60 py-3 text-center">
                        <div className="px-2"><dd className="text-lg font-extrabold tabular-nums">{r.conSalario}%</dd><dt className="text-[11px] leading-tight text-muted-foreground">con salario</dt></div>
                        <div className="px-2"><dd className="text-lg font-extrabold tabular-nums">{r.sinExp}%</dd><dt className="text-[11px] leading-tight text-muted-foreground">sin experiencia</dt></div>
                        <div className="px-2"><dd className="text-lg font-extrabold tabular-nums">{r.mediana ? `$${Math.round(r.mediana / 1000)}k` : "—"}</dd><dt className="text-[11px] leading-tight text-muted-foreground">sueldo típico</dt></div>
                      </dl>

                      {r.empresas.length > 0 && (
                        <div className="mt-5">
                          <p className="text-sm font-bold">Quién contrata</p>
                          <ul className="mt-2 space-y-1.5 text-sm">
                            {r.empresas.map((e) => (
                              <li key={e.slug}><Link to="/empresa/$id" params={{ id: e.slug }} className="flex justify-between gap-3 hover:text-primary"><span className="truncate">{e.nombre}</span><span className="tabular-nums text-muted-foreground">{e.total}</span></Link></li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-5">
                        <p className="text-sm font-bold">Lo más reciente</p>
                        <ul className="mt-2 divide-y divide-border">
                          {r.recientes.map((j) => (
                            <li key={j.id}>
                              <Link to="/vacantes/$id" params={{ id: j.id }} className="group flex items-start justify-between gap-2 py-2">
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold group-hover:text-primary">{j.titulo}</span>
                                  <span className="block truncate text-xs text-muted-foreground">{j.empresa} · {nombreProv(j.provincia)}</span>
                                </span>
                                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">Ahora mismo no hay vacantes aquí. Activa una alerta en su página y te avisamos.</p>
                  )}

                  <div className="mt-auto pt-5">
                    {g.slug ? (
                      <Link to="/empleos/$slug" params={{ slug: g.slug }} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white transition-transform hover:-translate-y-0.5">Ver {g.jobs.length > 0 ? `las ${g.jobs.length} vacantes` : "la página"} <ArrowRight className="size-4" aria-hidden="true" /></Link>
                    ) : (
                      <Link to="/vacantes" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white">Ver y filtrar vacantes <ArrowRight className="size-4" aria-hidden="true" /></Link>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* Índice completo, sobrio */}
      <section className="px-4 py-14 sm:px-6" aria-labelledby="indice-titulo">
        <div className="mx-auto max-w-6xl">
          <h2 id="indice-titulo" className="text-xl font-extrabold tracking-tight sm:text-2xl">Todas las clasificaciones</h2>
          <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {(["oportunidad", "area", "provincia"] as const).map((l) => (
              <div key={l}>
                <p className="border-b border-border pb-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{LENTES.find((x) => x.id === l)!.label}</p>
                <ul className="mt-1">
                  {agrupar(jobs, l).filter((x) => x.slug).sort((a, b) => b.jobs.length - a.jobs.length).map((x) => (
                    <li key={x.key}>
                      <Link to="/empleos/$slug" params={{ slug: x.slug! }} className="flex items-baseline justify-between gap-3 border-b border-dashed border-border py-2.5 text-sm hover:text-primary">
                        <span className="font-semibold">{x.nombre}</span>
                        <span className="tabular-nums text-muted-foreground">{x.jobs.length}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

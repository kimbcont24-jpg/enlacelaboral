import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Search, X } from "lucide-react";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { provincias } from "@/lib/data";
import { directorioEmpresas, letraDe, ordenar, pasaFiltro, sinAcentos, type FilaDirectorio } from "@/lib/directorio-empresas";
import { fetchPublicadas, hace, SITIO } from "@/lib/vacantes";

type Busqueda = { q?: string; area?: string; provincia?: string; f?: string; orden?: string; letra?: string };
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined);
const PROVINCIAS = provincias.slice(1).map((p) => p.replace(/\s*\(.*?\)\s*/g, "").trim()).filter((p) => !/^remoto/i.test(p));
const LETRAS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];
const POR_PAGINA = 36;
/** Solo los filtros que más usa quien busca empleo. */
const FILTROS_RAPIDOS = [
  { id: "nuevas", t: "Nuevas esta semana" },
  { id: "sueldo", t: "Dicen el sueldo" },
  { id: "sin-experiencia", t: "Primer empleo" },
  { id: "remoto", t: "Desde casa" },
] as const;

export const Route = createFileRoute("/empresas-contratando")({
  validateSearch: (s: Record<string, unknown>): Busqueda => ({
    q: str(s["q"]), area: str(s["area"]), provincia: str(s["provincia"]), f: str(s["f"]), orden: str(s["orden"]),
    letra: (() => { const l = str(s["letra"])?.toUpperCase(); return l && LETRAS.includes(l) ? l : undefined; })(),
  }),
  loader: async () => {
    const jobs = await fetchPublicadas().catch(() => []);
    const filas = directorioEmpresas(jobs);
    return { filas, vacantes: filas.reduce((s, f) => s + f.vacantes, 0) };
  },
  head: ({ loaderData }) => {
    const n = loaderData?.filas.length ?? 0;
    const title = `${n ? `${n} empresas` : "Empresas"} contratando en República Dominicana | Enlace Laboral`;
    const desc = "Directorio de las empresas dominicanas con vacantes abiertas hoy en Enlace Laboral. Búscalas por nombre, letra, área o provincia.";
    return {
      meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }],
      links: [{ rel: "canonical", href: `${SITIO}/empresas-contratando` }],
    };
  },
  component: Directorio,
});

function Directorio() {
  const d = Route.useLoaderData();
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/empresas-contratando" });
  const lista = useRef<HTMLElement>(null);
  const [texto, setTexto] = useState(s.q ?? "");
  const [visibles, setVisibles] = useState(POR_PAGINA);

  const orden = s.orden ?? (s.letra ? "az" : "vacantes");
  const filtro = s.f ?? "";

  const poner = (cambios: Partial<Busqueda>, subir = false) => {
    setVisibles(POR_PAGINA);
    void navigate({ search: (prev: Busqueda) => { const n = { ...prev, ...cambios }; for (const k of Object.keys(n) as (keyof Busqueda)[]) if (!n[k]) delete n[k]; return n; }, replace: true, resetScroll: false });
    if (subir && lista.current && lista.current.getBoundingClientRect().top < 220) requestAnimationFrame(() => lista.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  useEffect(() => {
    const t = setTimeout(() => { if ((s.q ?? "") !== texto.trim()) poner({ q: texto.trim() || undefined }); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const areas = useMemo(() => { const m = new Map<string, number>(); for (const f of d.filas) for (const a of f.areas) m.set(a, (m.get(a) ?? 0) + 1); return [...m.entries()].filter(([a]) => a && a !== "Otros").sort((a, b) => b[1] - a[1]); }, [d.filas]);
  const conteoProv = useMemo(() => { const m = new Map<string, number>(); for (const f of d.filas) for (const p of f.provincias) m.set(p, (m.get(p) ?? 0) + 1); return m; }, [d.filas]);

  // Todo menos la letra: así el índice A–Z sabe qué letras tienen empresas con los demás filtros puestos.
  const sinLetra = useMemo(() => {
    const q = sinAcentos(texto.trim());
    return d.filas.filter((f) =>
      pasaFiltro(f, filtro)
      && (!s.area || f.areas.includes(s.area))
      && (!s.provincia || f.provincias.includes(s.provincia))
      && (!q || sinAcentos(`${f.nombre} ${f.puestos.join(" ")} ${f.areas.join(" ")}`).includes(q)),
    );
  }, [d.filas, texto, filtro, s.area, s.provincia]);
  const porLetra = useMemo(() => { const m = new Map<string, number>(); for (const f of sinLetra) { const l = letraDe(f.nombre); m.set(l, (m.get(l) ?? 0) + 1); } return m; }, [sinLetra]);
  const resultado = useMemo(() => ordenar(s.letra ? sinLetra.filter((f) => letraDe(f.nombre) === s.letra) : sinLetra, orden), [sinLetra, s.letra, orden]);

  const hayFiltros = Boolean(texto.trim() || filtro || s.area || s.provincia || s.letra);
  const limpiar = () => { setTexto(""); setVisibles(POR_PAGINA); void navigate({ search: {}, replace: true, resetScroll: false }); };
  const mostradas = resultado.slice(0, visibles);
  const clave = `${s.letra ?? ""}|${filtro}|${s.area ?? ""}|${s.provincia ?? ""}|${orden}|${s.q ?? ""}`;

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f6f8fb] text-foreground">
      <Header />

      {/* Portada sencilla */}
      <section className="bg-[#0a2f5c] text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 md:py-16">
          <p className="text-sm font-semibold text-white/60">Directorio de empresas</p>
          <h1 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight md:text-5xl">Empresas que están contratando</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/75">Busca la empresa donde te gustaría trabajar y mira sus vacantes abiertas.</p>
          <label className="mx-auto mt-7 flex h-13 max-w-xl items-center gap-3 rounded-full bg-white px-5 text-foreground shadow-lg">
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Buscar empresa</span>
            <input value={texto} onChange={(e) => { setTexto(e.target.value); setVisibles(POR_PAGINA); }} placeholder="Nombre de la empresa o puesto" className="h-13 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" type="search" autoComplete="off" enterKeyHint="search" />
            {texto && <button type="button" onClick={() => setTexto("")} aria-label="Borrar búsqueda" className="grid size-8 place-items-center rounded-full hover:bg-secondary"><X className="size-4" /></button>}
          </label>
          <p className="mt-5 text-sm text-white/65"><strong className="text-white">{d.filas.length.toLocaleString("es-DO")}</strong> empresas · <strong className="text-white">{d.vacantes.toLocaleString("es-DO")}</strong> vacantes abiertas</p>
        </div>
      </section>

      {/* Letras y filtros */}
      <div className="sticky top-16 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <nav aria-label="Filtrar por letra" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:justify-between">
            <button type="button" onClick={() => poner({ letra: undefined }, true)} aria-pressed={!s.letra} className={`h-9 shrink-0 rounded-full px-3.5 text-sm font-semibold ${!s.letra ? "bg-[#0a2f5c] text-white" : "text-[#0a2f5c] hover:bg-secondary"}`}>Todas</button>
            {LETRAS.map((l) => {
              const n = porLetra.get(l) ?? 0;
              const activa = s.letra === l;
              return (
                <button key={l} type="button" disabled={!n && !activa} onClick={() => poner({ letra: activa ? undefined : l }, true)} aria-pressed={activa} title={n ? `${n} ${n === 1 ? "empresa" : "empresas"}` : undefined}
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors ${activa ? "bg-[#1d6ff2] text-white" : n ? "text-[#0a2f5c] hover:bg-secondary" : "text-muted-foreground/30"}`}>
                  {l}
                </button>
              );
            })}
          </nav>
          <div className="-mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {FILTROS_RAPIDOS.map((x) => (
              <button key={x.id} type="button" aria-pressed={filtro === x.id} onClick={() => poner({ f: filtro === x.id ? undefined : x.id }, true)}
                className={`h-8 shrink-0 rounded-full border px-3.5 text-sm transition-colors ${filtro === x.id ? "border-[#0a2f5c] bg-[#0a2f5c] font-semibold text-white" : "border-border bg-white text-foreground/80 hover:border-[#0a2f5c]"}`}>
                {x.t}
              </button>
            ))}
            <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
            <Selector valor={s.area ?? ""} onChange={(v) => poner({ area: v || undefined }, true)} opciones={areas.map(([a]) => [a, a])} todas="Todas las áreas" etiqueta="Área" />
            <Selector valor={s.provincia ?? ""} onChange={(v) => poner({ provincia: v || undefined }, true)} opciones={PROVINCIAS.filter((p) => conteoProv.get(p)).map((p) => [p, p])} todas="Todo el país" etiqueta="Provincia" />
          </div>
        </div>
      </div>

      <main ref={lista} className="mx-auto max-w-6xl scroll-mt-56 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3" aria-live="polite">
          <h2 className="font-display text-xl font-bold">
            {s.letra ? <>Empresas con <span className="text-[#1d6ff2]">{s.letra === "#" ? "número o símbolo" : s.letra}</span></> : "Todas las empresas"}
            <span className="ml-2 text-base font-normal text-muted-foreground">{resultado.length.toLocaleString("es-DO")}</span>
          </h2>
          {hayFiltros && <button type="button" onClick={limpiar} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><X className="size-4" /> Quitar filtros</button>}
        </div>

        {resultado.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-white p-10 text-center">
            <p className="font-semibold">No encontramos empresas con esa búsqueda.</p>
            <p className="mt-1 text-sm text-muted-foreground">Prueba con otra palabra o <button type="button" onClick={limpiar} className="font-semibold text-[#1557c4] underline">mira todas las empresas</button>.</p>
          </div>
        ) : (
          <ul key={clave} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mostradas.map((f, i) => <Tarjeta key={f.slug} f={f} i={i % POR_PAGINA} />)}
          </ul>
        )}

        {resultado.length > visibles && (
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setVisibles((v) => v + POR_PAGINA)} className="h-11 rounded-full border border-border bg-white px-6 text-sm font-semibold hover:border-[#0a2f5c]">Ver más empresas ({(resultado.length - visibles).toLocaleString("es-DO")})</button>
          </div>
        )}

        <div className="mt-14 flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-6 text-center ring-1 ring-border sm:flex-row sm:text-left">
          <div>
            <p className="font-display text-lg font-bold">¿Tu empresa no aparece?</p>
            <p className="text-sm text-muted-foreground">Publica tu vacante gratis y sale en este directorio.</p>
          </div>
          <Link to="/empresas" className="btn-aplicar inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-6">Publica tu vacante <ArrowRight className="size-4" /></Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Selector({ etiqueta, valor, onChange, opciones, todas }: { etiqueta: string; valor: string; onChange: (v: string) => void; opciones: (readonly [string, string])[]; todas?: string }) {
  return (
    <label className={`inline-flex h-8 shrink-0 items-center rounded-full border bg-white px-3 text-sm ${valor && todas ? "border-[#0a2f5c] font-semibold" : "border-border text-foreground/80"}`}>
      <span className="sr-only">{etiqueta}</span>
      <select value={valor} onChange={(e) => onChange(e.target.value)} className="h-full max-w-[10rem] cursor-pointer truncate bg-transparent outline-none">
        {todas && <option value="">{todas}</option>}
        {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}

function Tarjeta({ f, i }: { f: FilaDirectorio; i: number }) {
  const lugar = [f.provincias[0], f.areas[0]].filter(Boolean).join(" · ");
  const puestos = f.puestos.slice(0, 2).join(", ") + (f.vacantes > 2 && f.puestos.length ? "…" : "");
  return (
    <li className="dir-entra min-w-0" style={{ "--d": `${Math.min(i, 12) * 30}ms` } as CSSProperties}>
      <Link to="/empleos/$slug" params={{ slug: f.slug }} className="group flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgb(10_47_92/0.45)] hover:ring-[#1d6ff2]/40">
        <div className="flex items-center gap-3">
          <EmpresaAvatar nombre={f.nombre} className="size-11 rounded-xl text-lg" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-tight">{f.nombre}</h3>
            {lugar && <p className="mt-0.5 truncate text-sm text-muted-foreground">{lugar}</p>}
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold leading-none text-[#1557c4]">{f.vacantes}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{f.vacantes === 1 ? "vacante" : "vacantes"}</p>
          </div>
        </div>
        {puestos && <p className="mt-4 line-clamp-2 text-sm text-foreground/75">{puestos}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs">
          {f.nuevas > 0
            ? <span className="inline-flex items-center gap-1.5 font-semibold text-[#15803d]"><span className="size-1.5 rounded-full bg-[#22c55e]" />{f.nuevas === 1 ? "1 nueva" : `${f.nuevas} nuevas`} esta semana</span>
            : <span className="text-muted-foreground">Última {hace(f.ultima)}</span>}
          <span className="inline-flex items-center gap-1 font-semibold text-[#1557c4]">Ver vacantes <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
        </div>
      </Link>
    </li>
  );
}

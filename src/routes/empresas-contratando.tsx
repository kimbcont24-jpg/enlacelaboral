import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Briefcase, Building2, Clock, LayoutGrid, List, MapPin, Search, Share2, Sparkles, Wallet, X } from "lucide-react";
import { toast } from "sonner";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { areas, provincias } from "@/lib/data";
import { directorioEmpresas, FILTROS, letraDe, ORDENES, ordenar, pasaFiltro, sinAcentos, type FilaDirectorio } from "@/lib/directorio-empresas";
import { NOMBRE_SELLO } from "@/lib/motivar-empresas";
import { fetchPublicadas, hace, SITIO } from "@/lib/vacantes";

type Busqueda = { q?: string; area?: string; provincia?: string; f?: string; orden?: string; vista?: string };
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined);
const PROVINCIAS = provincias.slice(1).map((p) => p.replace(/\s*\(.*?\)\s*/g, "").trim()).filter((p) => !/^remoto/i.test(p));
const LETRAS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];
const POR_PAGINA = 36;
const money = (n: number) => `RD$${n.toLocaleString("es-DO")}`;

export const Route = createFileRoute("/empresas-contratando")({
  validateSearch: (s: Record<string, unknown>): Busqueda => ({ q: str(s["q"]), area: str(s["area"]), provincia: str(s["provincia"]), f: str(s["f"]), orden: str(s["orden"]), vista: str(s["vista"]) }),
  loader: async () => {
    const jobs = await fetchPublicadas().catch(() => []);
    const filas = directorioEmpresas(jobs);
    const vacantes = filas.reduce((s, f) => s + f.vacantes, 0);
    return {
      filas,
      vacantes,
      nuevas: filas.filter((f) => f.nuevas > 0).length,
      conSueldo: filas.filter((f) => f.conSueldo > 0).length,
    };
  },
  head: ({ loaderData }) => {
    const n = loaderData?.filas.length ?? 0;
    const title = `${n ? `${n} empresas` : "Empresas"} contratando en República Dominicana | Enlace Laboral`;
    const desc = `Directorio de las empresas dominicanas con vacantes abiertas hoy en Enlace Laboral. Búscalas por nombre, área o provincia y mira cuáles dicen el sueldo.`;
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
  const [texto, setTexto] = useState(s.q ?? "");
  const [visibles, setVisibles] = useState(POR_PAGINA);

  const orden = s.orden ?? "vacantes";
  const vista = s.vista === "lista" ? "lista" : "tarjetas";
  const filtro = s.f ?? "";

  const poner = (cambios: Partial<Busqueda>) => {
    setVisibles(POR_PAGINA);
    void navigate({ search: (prev: Busqueda) => { const n = { ...prev, ...cambios }; for (const k of Object.keys(n) as (keyof Busqueda)[]) if (!n[k]) delete n[k]; return n; }, replace: true, resetScroll: false });
  };

  // La búsqueda por texto se aplica mientras escribes y se guarda en el enlace al pausar.
  useEffect(() => {
    const t = setTimeout(() => { if ((s.q ?? "") !== texto.trim()) poner({ q: texto.trim() || undefined }); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const conteoArea = useMemo(() => { const m = new Map<string, number>(); for (const f of d.filas) for (const a of f.areas) m.set(a, (m.get(a) ?? 0) + 1); return m; }, [d.filas]);
  const conteoProv = useMemo(() => { const m = new Map<string, number>(); for (const f of d.filas) for (const p of f.provincias) m.set(p, (m.get(p) ?? 0) + 1); return m; }, [d.filas]);
  const conteoFiltro = useMemo(() => Object.fromEntries(FILTROS.map((x) => [x.id, d.filas.filter((f) => pasaFiltro(f, x.id)).length])), [d.filas]);

  const resultado = useMemo(() => {
    const q = sinAcentos(texto.trim());
    const filas = d.filas.filter((f) =>
      pasaFiltro(f, filtro)
      && (!s.area || f.areas.includes(s.area))
      && (!s.provincia || f.provincias.includes(s.provincia))
      && (!q || sinAcentos(`${f.nombre} ${f.puestos.join(" ")} ${f.areas.join(" ")}`).includes(q)),
    );
    return ordenar(filas, orden);
  }, [d.filas, texto, filtro, s.area, s.provincia, orden]);

  const letrasConEmpresas = useMemo(() => new Set(resultado.map((f) => letraDe(f.nombre))), [resultado]);
  const hayFiltros = Boolean(texto.trim() || filtro || s.area || s.provincia);

  const irALetra = (l: string) => {
    if (orden !== "az") poner({ orden: "az" });
    const i = ordenar(resultado, "az").findIndex((f) => letraDe(f.nombre) === l);
    if (i < 0) return;
    setVisibles((v) => Math.max(v, i + POR_PAGINA));
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`letra-${l}`)?.scrollIntoView({ behavior: "smooth", block: "start" })));
  };

  const limpiar = () => { setTexto(""); setVisibles(POR_PAGINA); void navigate({ search: (p: Busqueda) => (p.vista ? { vista: p.vista } : {}), replace: true, resetScroll: false }); };

  const compartir = async () => {
    const url = typeof window !== "undefined" ? window.location.href : `${SITIO}/empresas-contratando`;
    const t = `Estas son las ${d.filas.length} empresas que están contratando ahora en República Dominicana.`;
    try {
      if (navigator.share) await navigator.share({ title: "Empresas contratando | Enlace Laboral", text: t, url });
      else { await navigator.clipboard.writeText(`${t} ${url}`); toast.success("Enlace copiado"); }
    } catch { /* cancelado */ }
  };

  const mostradas = resultado.slice(0, visibles);
  let letraPrevia = "";

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f3f6fb] text-foreground">
      <Header />

      {/* Portada */}
      <section className="relative overflow-hidden bg-[#0a2f5c] text-white">
        <div aria-hidden="true" className="absolute -left-24 -top-24 size-96 rounded-full bg-[#1d6ff2] opacity-50 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 right-0 size-96 rounded-full bg-[#14b8a6] opacity-25 blur-3xl" />
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
          <nav aria-label="Ruta" className="text-sm text-white/60"><Link to="/" className="hover:text-white">Inicio</Link> › <span className="text-white/90">Empresas contratando</span></nav>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#4ade80] opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-[#4ade80]" /></span> Actualizado con las vacantes de hoy</p>
          <h1 className="mt-3 max-w-3xl text-balance font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">Empresas que están contratando ahora</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">Busca la empresa donde te gustaría trabajar, mira cuántas vacantes tiene abiertas y aplica directo. Saber quién está contratando te ayuda a enfocar tu energía donde sí hay oportunidades.</p>

          <label className="mt-7 flex h-14 max-w-2xl items-center gap-3 rounded-2xl bg-white px-4 text-foreground shadow-[0_20px_45px_-20px_rgb(0_0_0/0.6)] ring-2 ring-transparent focus-within:ring-[#ffd84d]">
            <Search className="size-5 shrink-0 text-[#1557c4]" aria-hidden="true" />
            <span className="sr-only">Buscar empresa</span>
            <input value={texto} onChange={(e) => { setTexto(e.target.value); setVisibles(POR_PAGINA); }} placeholder="Busca por empresa, puesto o área…" className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" type="search" autoComplete="off" enterKeyHint="search" />
            {texto && <button type="button" onClick={() => setTexto("")} aria-label="Borrar búsqueda" className="grid size-8 place-items-center rounded-full hover:bg-secondary"><X className="size-4" /></button>}
          </label>

          <dl className="mt-6 flex flex-wrap gap-3">
            {([[d.filas.length, "empresas contratando", ""], [d.vacantes, "vacantes abiertas", ""], [d.nuevas, "publicaron esta semana", "nuevas"], [d.conSueldo, "dicen el sueldo", "sueldo"]] as const).map(([n, t, f]) => (
              <button key={t} type="button" disabled={!f} onClick={() => f && poner({ f: filtro === f ? undefined : f })} className={`rounded-2xl px-4 py-3 text-left backdrop-blur transition-colors ${f ? "hover:bg-white/20" : "cursor-default"} ${filtro && filtro === f ? "bg-white text-[#0a2f5c]" : "bg-white/10"}`}>
                <dd className="font-display text-2xl font-bold tabular-nums">{n.toLocaleString("es-DO")}</dd>
                <dt className={`text-xs font-semibold ${filtro && filtro === f ? "text-[#0a2f5c]/70" : "text-white/70"}`}>{t}</dt>
              </button>
            ))}
          </dl>
        </div>
      </section>

      {/* Barra de filtros fija */}
      <div className="sticky top-16 z-20 overflow-x-clip border-b border-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {FILTROS.filter((x) => x.id === "" || conteoFiltro[x.id]).map((x) => (
              <button key={x.id || "todas"} type="button" aria-pressed={filtro === x.id} onClick={() => poner({ f: x.id || undefined })}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors ${filtro === x.id ? "border-[#1d6ff2] bg-[#1d6ff2] text-white" : "border-border bg-white hover:border-[#1d6ff2] hover:text-[#1557c4]"}`}>
                {x.t}<span className={`text-xs tabular-nums ${filtro === x.id ? "text-white/80" : "text-muted-foreground"}`}>{conteoFiltro[x.id]}</span>
              </button>
            ))}
          </div>
          <div className="-mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <Selector etiqueta="Área" valor={s.area ?? ""} onChange={(v) => poner({ area: v || undefined })} opciones={areas.filter((a) => conteoArea.get(a)).map((a) => [a, `${a} (${conteoArea.get(a)})`])} todas="Todas las áreas" />
            <Selector etiqueta="Provincia" valor={s.provincia ?? ""} onChange={(v) => poner({ provincia: v || undefined })} opciones={PROVINCIAS.filter((p) => conteoProv.get(p)).map((p) => [p, `${p} (${conteoProv.get(p)})`])} todas="Todo el país" />
            <Selector etiqueta="Ordenar" valor={orden} onChange={(v) => poner({ orden: v === "vacantes" ? undefined : v })} opciones={ORDENES.map((o) => [o.id, o.t])} />
            <div className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-border bg-white p-1" role="group" aria-label="Forma de ver">
              <button type="button" aria-pressed={vista === "tarjetas"} onClick={() => poner({ vista: undefined })} className={`grid size-8 place-items-center rounded-full ${vista === "tarjetas" ? "bg-[#0a2f5c] text-white" : "text-muted-foreground hover:text-foreground"}`} title="Ver en tarjetas"><LayoutGrid className="size-4" /><span className="sr-only">Tarjetas</span></button>
              <button type="button" aria-pressed={vista === "lista"} onClick={() => poner({ vista: "lista" })} className={`grid size-8 place-items-center rounded-full ${vista === "lista" ? "bg-[#0a2f5c] text-white" : "text-muted-foreground hover:text-foreground"}`} title="Ver en lista"><List className="size-4" /><span className="sr-only">Lista</span></button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Índice A–Z */}
        <nav aria-label="Ir a la letra" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {LETRAS.map((l) => {
            const hay = letrasConEmpresas.has(l);
            return <button key={l} type="button" disabled={!hay} onClick={() => irALetra(l)} className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold ${hay ? "bg-white text-[#0a2f5c] ring-1 ring-border hover:bg-[#1d6ff2] hover:text-white hover:ring-[#1d6ff2]" : "text-muted-foreground/40"}`}>{l}</button>;
          })}
        </nav>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3" aria-live="polite">
          <p className="text-sm text-muted-foreground"><strong className="text-foreground">{resultado.length.toLocaleString("es-DO")}</strong> {resultado.length === 1 ? "empresa" : "empresas"}{hayFiltros ? " con esos filtros" : " con vacantes abiertas"}</p>
          <div className="flex items-center gap-2">
            {hayFiltros && <button type="button" onClick={limpiar} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-sm font-semibold hover:border-[#c8102e] hover:text-[#c8102e]"><X className="size-4" /> Quitar filtros</button>}
            <button type="button" onClick={() => void compartir()} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-sm font-semibold hover:border-[#1d6ff2] hover:text-[#1557c4]"><Share2 className="size-4" /> Compartir</button>
          </div>
        </div>

        <div className="mt-5">
          {resultado.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center">
              <Building2 className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 font-extrabold">No encontramos empresas con esa búsqueda</p>
              <p className="mt-1 text-muted-foreground">Prueba con otra palabra o quita algún filtro. También puedes <Link to="/vacantes" search={texto ? { q: texto } : {}} className="font-semibold text-[#1557c4] underline">buscar entre todas las vacantes</Link>.</p>
              {hayFiltros && <button type="button" onClick={limpiar} className="mt-5 inline-flex h-11 items-center rounded-full bg-[#0a2f5c] px-5 font-bold text-white">Ver todas las empresas</button>}
            </div>
          ) : vista === "lista" ? (
            <div className="overflow-hidden rounded-3xl border border-border bg-white">
              <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_7rem_8rem] gap-4 border-b border-border bg-[#f7f9fc] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-muted-foreground md:grid">
                <span>Empresa</span><span>Áreas</span><span>Provincias</span><span className="text-right">Vacantes</span><span className="text-right">Última</span>
              </div>
              <ul className="divide-y divide-border">
                {mostradas.map((f) => {
                  const l = letraDe(f.nombre);
                  const ancla = orden === "az" && l !== letraPrevia ? l : "";
                  letraPrevia = l;
                  return <FilaLista key={f.slug} f={f} ancla={ancla} />;
                })}
              </ul>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mostradas.map((f) => {
                const l = letraDe(f.nombre);
                const ancla = orden === "az" && l !== letraPrevia ? l : "";
                letraPrevia = l;
                return <Tarjeta key={f.slug} f={f} ancla={ancla} />;
              })}
            </ul>
          )}

          {resultado.length > visibles && (
            <div className="mt-8 text-center">
              <button type="button" onClick={() => setVisibles((v) => v + POR_PAGINA)} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#0a2f5c] px-6 font-bold text-white hover:bg-[#1557c4]">Ver más empresas <span className="text-white/70">({(resultado.length - visibles).toLocaleString("es-DO")} más)</span></button>
            </div>
          )}
        </div>

        {/* Leyenda y llamada a empresas */}
        <section className="mt-12 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-border bg-white p-6">
            <h2 className="font-display text-xl font-bold">Cómo leer este directorio</h2>
            <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <li className="flex gap-3"><BadgeCheck className="mt-0.5 size-5 shrink-0 text-[#0f7a43]" /><span><strong>Publica directo:</strong> la empresa nos envió la vacante ella misma (formulario, correo o su panel).</span></li>
              <li className="flex gap-3"><Sparkles className="mt-0.5 size-5 shrink-0 text-[#d97706]" /><span><strong>Sello {NOMBRE_SELLO.toLowerCase()}:</strong> sus vacantes dicen sueldo, requisitos, funciones y cómo aplicar. <Link to="/empresas-claras" className="font-semibold text-[#1557c4] underline">Ver ranking</Link>.</span></li>
              <li className="flex gap-3"><Wallet className="mt-0.5 size-5 shrink-0 text-[#1557c4]" /><span><strong>% con sueldo:</strong> cuántas de sus vacantes dicen cuánto pagan. Aplicar sabiendo el sueldo te ahorra tiempo y ansiedad.</span></li>
              <li className="flex gap-3"><Briefcase className="mt-0.5 size-5 shrink-0 text-[#5b2a86]" /><span><strong>Recluta para otras empresas:</strong> consultoras que publican vacantes de sus clientes.</span></li>
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-[#0a2f5c] p-6 text-white">
            <div aria-hidden="true" className="absolute -right-16 -top-16 size-56 rounded-full bg-[#1d6ff2] opacity-50 blur-3xl" />
            <p className="relative text-xs font-extrabold uppercase tracking-wider text-[#8ec1ff]">¿Tu empresa no aparece?</p>
            <h2 className="relative mt-1 font-display text-2xl font-bold">Publica tu vacante gratis y sal en este directorio hoy mismo</h2>
            <p className="relative mt-2 text-white/80">Cada empresa con vacantes activas aparece aquí con su perfil, sus vacantes y su sello de claridad.</p>
            <Link to="/empresas" className="btn-aplicar relative mt-5 inline-flex h-12 items-center gap-2 rounded-full px-6">Publicar vacante gratis <ArrowRight className="size-4" /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Selector({ etiqueta, valor, onChange, opciones, todas }: { etiqueta: string; valor: string; onChange: (v: string) => void; opciones: (readonly [string, string])[]; todas?: string }) {
  return (
    <label className={`relative inline-flex h-9 shrink-0 items-center rounded-full border bg-white pl-3.5 pr-2 text-sm ${valor && todas ? "border-[#1d6ff2] text-[#1557c4]" : "border-border"}`}>
      <span className="mr-1 font-semibold text-muted-foreground">{etiqueta}:</span>
      <select value={valor} onChange={(e) => onChange(e.target.value)} className="h-full max-w-[11rem] cursor-pointer truncate bg-transparent pr-1 font-semibold outline-none">
        {todas && <option value="">{todas}</option>}
        {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}

function Insignias({ f }: { f: FilaDirectorio }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {f.nuevas > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-extrabold text-[#166534]"><span className="size-1.5 rounded-full bg-[#16a34a]" /> {f.nuevas === 1 ? "1 nueva" : `${f.nuevas} nuevas`} esta semana</span>}
      {f.aliada && <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-xs font-bold text-[#0f7a43] ring-1 ring-[#0f7a43]/20"><BadgeCheck className="size-3.5" /> Publica directo</span>}
      {f.sello && <span title={`Sello ${f.sello.t}: sus vacantes traen sueldo, requisitos, funciones y cómo aplicar.`} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold" style={{ background: f.sello.fondo, color: f.sello.color, boxShadow: `inset 0 0 0 1px ${f.sello.borde}` }}><Sparkles className="size-3.5" /> Sello {f.sello.t}</span>}
      {f.sector === "publico" && <span className="rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-xs font-bold text-[#b91c1c]">Sector público</span>}
      {f.sector === "zona-franca" && <span className="rounded-full bg-[#cffafe] px-2.5 py-0.5 text-xs font-bold text-[#0e7490]">Zona franca</span>}
      {f.recluta && <span className="rounded-full bg-[#f3e8ff] px-2.5 py-0.5 text-xs font-bold text-[#6b21a8]">Recluta para otras empresas</span>}
    </div>
  );
}

function Tarjeta({ f, ancla }: { f: FilaDirectorio; ancla: string }) {
  return (
    <li id={ancla ? `letra-${ancla}` : undefined} className="group relative flex scroll-mt-60 flex-col rounded-3xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#1d6ff2]/50 hover:shadow-[0_20px_40px_-24px_rgb(10_47_92/0.45)]">
      <div className="flex items-start gap-3">
        <EmpresaAvatar nombre={f.nombre} className="size-12 text-xl" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug"><Link to="/empresa/$id" params={{ id: f.slug }} className="after:absolute after:inset-0 after:rounded-3xl focus:outline-none">{f.nombre}</Link></h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" /> Última vacante {hace(f.ultima)}</p>
        </div>
        <div className="shrink-0 rounded-2xl bg-[#eef4ff] px-3 py-2 text-center">
          <p className="font-display text-2xl font-bold leading-none text-[#1557c4] tabular-nums">{f.vacantes}</p>
          <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#1557c4]/70">{f.vacantes === 1 ? "vacante" : "vacantes"}</p>
        </div>
      </div>

      <div className="mt-3"><Insignias f={f} /></div>

      {f.puestos.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Está buscando</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {f.puestos.slice(0, 3).map((p) => <li key={p} className="flex gap-2"><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[#1d6ff2]" /><span className="line-clamp-1">{p}</span></li>)}
          </ul>
        </div>
      )}

      <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        {f.areas.length > 0 && <p className="flex gap-2"><Briefcase className="mt-0.5 size-4 shrink-0" /><span className="line-clamp-1">{f.areas.slice(0, 3).join(" · ")}</span></p>}
        {f.provincias.length > 0 && <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" /><span className="line-clamp-1">{f.provincias.slice(0, 3).join(" · ")}{f.provincias.length > 3 ? ` y ${f.provincias.length - 3} más` : ""}</span></p>}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold"><span className="text-muted-foreground">Dicen el sueldo</span>{f.conSueldo > 0 ? <span className="tabular-nums">{f.conSueldo}%{f.topSueldo > 0 ? ` · desde ${money(f.topSueldo)}` : ""}</span> : <Link to="/salarios" className="relative z-10 text-[#1557c4] hover:underline">No lo publica · ver Radar salarial</Link>}</div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e8edf5]"><div className="h-full rounded-full bg-gradient-to-r from-[#1d6ff2] to-[#14b8a6]" style={{ width: `${f.conSueldo}%` }} /></div>
      </div>

      <div className="relative z-10 mt-5 flex gap-2 pt-1">
        <Link to="/empleos/$slug" params={{ slug: f.slug }} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0a2f5c] px-4 text-sm font-bold text-white hover:bg-[#1557c4]">Ver {f.vacantes === 1 ? "la vacante" : `las ${f.vacantes} vacantes`} <ArrowRight className="size-4" /></Link>
        <Link to="/empresa/$id" params={{ id: f.slug }} className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-semibold hover:border-[#1d6ff2] hover:text-[#1557c4]">Perfil</Link>
      </div>
    </li>
  );
}

function FilaLista({ f, ancla }: { f: FilaDirectorio; ancla: string }) {
  return (
    <li id={ancla ? `letra-${ancla}` : undefined} className="relative scroll-mt-60 px-5 py-4 transition-colors hover:bg-[#f7f9fc] md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_7rem_8rem] md:items-center md:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <EmpresaAvatar nombre={f.nombre} className="size-10 text-base" />
        <div className="min-w-0">
          <Link to="/empresa/$id" params={{ id: f.slug }} className="line-clamp-1 font-bold hover:text-[#1557c4]">{f.nombre}</Link>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {f.nuevas > 0 && <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-extrabold text-[#166534]">{f.nuevas} nueva{f.nuevas === 1 ? "" : "s"}</span>}
            {f.aliada && <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-bold text-[#0f7a43]">Publica directo</span>}
            {f.sello && <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ background: f.sello.fondo, color: f.sello.color }}>Sello {f.sello.t}</span>}
            {f.conSueldo > 0 && <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[11px] font-bold text-[#1557c4]">{f.conSueldo}% con sueldo</span>}
          </div>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-sm text-muted-foreground md:mt-0">{f.areas.slice(0, 3).join(" · ") || "—"}</p>
      <p className="line-clamp-1 text-sm text-muted-foreground">{f.provincias.slice(0, 2).join(" · ") || "—"}</p>
      <div className="mt-2 flex items-center justify-between gap-3 md:mt-0 md:contents">
        <Link to="/empleos/$slug" params={{ slug: f.slug }} className="inline-flex items-center gap-1 font-display text-lg font-bold text-[#1557c4] hover:underline md:justify-end">{f.vacantes}<span className="text-xs font-semibold md:hidden">{f.vacantes === 1 ? " vacante" : " vacantes"} →</span></Link>
        <span className="text-xs text-muted-foreground md:text-right">{hace(f.ultima)}</span>
      </div>
    </li>
  );
}

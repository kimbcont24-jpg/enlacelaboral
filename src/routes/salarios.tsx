import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Calculator, Info, Radar, Search, Share2, Sparkles, X } from "lucide-react";

import { Contador, MapaSalarios, Termometro, Transparencia } from "@/components/salarios/Piezas";
import { useEffect, useMemo, useState } from "react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { areas, nivelesExperiencia, provincias } from "@/lib/data";
import {
  MESES, MIN_AMPLIA, MIN_CALCULO, MIN_RANGO, MIN_RANKING, TEXTO_NIVEL,
  CANASTA, FUENTES_RADAR, agrupar, filtrar, porArea, pesos, pesosCortos, resumir, useObservaciones,
  type Filtro, type Observacion, type Resumen,
} from "@/lib/radar-salarial";
import { SITIO } from "@/lib/vacantes";

type Search = { q?: string; area?: string; provincia?: string; experiencia?: string; todas?: boolean };
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined);

export const Route = createFileRoute("/salarios")({
  validateSearch: (s: Record<string, unknown>): Search => ({ q: str(s["q"]), area: str(s["area"]), provincia: str(s["provincia"]), experiencia: str(s["experiencia"]), todas: s["todas"] === true || s["todas"] === "1" ? true : undefined }),
  head: () => ({
    meta: [
      { title: "Radar salarial RD: cuánto pagan las vacantes por puesto | Enlace Laboral" },
      { name: "description", content: "¿Cuánto gana un auxiliar de contabilidad o un analista de recursos humanos en República Dominicana? Salarios publicados en vacantes reales, por puesto, área y provincia, con la cantidad de vacantes detrás de cada cifra." },
      { property: "og:title", content: "Radar salarial dominicano · Enlace Laboral" },
      { property: "og:description", content: "Lo que ofrecen las vacantes publicadas, por puesto, área y provincia. Sin inventar promedios." },
    ],
    links: [{ rel: "canonical", href: `${SITIO}/salarios` }],
  }),
  component: RadarSalarial,
});

const EJEMPLOS = ["Auxiliar de contabilidad", "Analista de recursos humanos", "Servicio al cliente", "Vendedor"];
const selectCls = "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary";

function RadarSalarial() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/salarios" });
  const { obs, total, conSalario, cargando, error } = useObservaciones();
  const [miSalario, setMiSalario] = useState(0);
  const [texto, setTexto] = useState(s.q ?? "");

  // La búsqueda queda en el enlace (para compartirla), sin llenar el historial.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((s.q ?? "") !== texto.trim()) void navigate({ search: (p) => ({ ...p, q: texto.trim() || undefined }), replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [texto]); // eslint-disable-line react-hooks/exhaustive-deps

  const poner = (cambio: Partial<Search>) => void navigate({ search: (p) => ({ ...p, ...cambio }), replace: true });
  const filtro: Filtro = { q: texto.trim() || undefined, area: s.area, provincia: s.provincia, experiencia: s.experiencia, todas: s.todas };
  const base = useMemo(() => filtrar(obs, { ...filtro, q: undefined }), [obs, s.area, s.provincia, s.experiencia, s.todas]); // eslint-disable-line react-hooks/exhaustive-deps
  const encontradas = useMemo(() => (filtro.q ? filtrar(base, { q: filtro.q, todas: true }) : []), [base, filtro.q]);
  const grupos = useMemo(() => agrupar(base), [base]);
  const ranking = useMemo(() => grupos.filter((g) => g.resumen.n >= MIN_RANKING).sort((a, b) => b.resumen.mediana - a.resumen.mediana).slice(0, 10), [grupos]);
  const sugerencias = useMemo(() => [...grupos].sort((a, b) => b.resumen.n - a.resumen.n).filter((g) => g.resumen.n >= MIN_CALCULO).slice(0, 4).map((g) => g.nombre), [grupos]);
  const tablaAreas = useMemo(() => porArea(base), [base]);
  const ultima = obs.reduce((m, o) => (o.fecha > m ? o.fecha : m), "");
  const hayFiltros = !!(s.area || s.provincia || s.experiencia);

  const idsBusqueda = useMemo(() => new Set(encontradas.map((o) => o.id)), [encontradas]);
  const porBusqueda = !!filtro.q && encontradas.length >= MIN_RANGO;
  const comparables = porBusqueda ? encontradas : base;
  const etiquetaComp = porBusqueda ? `vacantes de “${filtro.q}”` : hayFiltros ? "vacantes con tus filtros" : "vacantes publicadas en el país";
  const general = useMemo(() => resumir(base), [base]);
  const de100 = total ? Math.max(1, Math.round((conSalario / total) * 100)) : 0;

  const chips = [...new Set([...EJEMPLOS.slice(0, 2), ...sugerencias])].slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ---------- Encabezado + buscador ---------- */}
      <section className="relative overflow-hidden bg-[#0a2f5c] text-white">
        <RadarFondo />
        <div className="relative mx-auto max-w-5xl px-6 pb-10 pt-12 md:pb-14 md:pt-16">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#ffd84d]"><Radar className="size-3.5" aria-hidden="true" /> Radar salarial dominicano</p>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-extrabold tracking-tight md:text-6xl">¿Cuánto pagan <span className="text-[#ffd84d]">de verdad?</span></h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">Explora los salarios que las empresas publican en sus vacantes, por puesto, área y provincia. Siempre te decimos cuántas vacantes hay detrás de cada cifra.</p>

          <label className="mt-8 flex h-14 items-center gap-3 rounded-2xl bg-white px-4 text-foreground shadow-[0_20px_40px_-20px_rgba(0,0,0,.5)] focus-within:ring-4 focus-within:ring-[#ffd84d]/60">
            <Search className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="sr-only">Puesto</span>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="¿Cuánto gana un… auxiliar de contabilidad?" className="h-full w-full bg-transparent text-base outline-none placeholder:text-muted-foreground" autoComplete="off" enterKeyHint="search" />
            {texto && <button type="button" onClick={() => setTexto("")} aria-label="Borrar búsqueda" className="grid size-8 place-items-center rounded-full hover:bg-muted"><X className="size-4" /></button>}
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((c) => (
              <button key={c} type="button" onClick={() => setTexto(c)} className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20">{c}</button>
            ))}
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <select aria-label="Área" value={s.area ?? ""} onChange={(e) => poner({ area: e.target.value || undefined })} className={`${selectCls} text-foreground`}>
              <option value="">Todas las áreas</option>
              {areas.map((a) => <option key={a}>{a}</option>)}
            </select>
            <select aria-label="Provincia" value={s.provincia ?? ""} onChange={(e) => poner({ provincia: e.target.value || undefined })} className={`${selectCls} text-foreground`}>
              <option value="">Todo el país</option>
              {provincias.slice(1).map((p) => <option key={p}>{p}</option>)}
            </select>
            <select aria-label="Experiencia" value={s.experiencia ?? ""} onChange={(e) => poner({ experiencia: e.target.value || undefined })} className={`${selectCls} text-foreground`}>
              <option value="">Cualquier experiencia</option>
              {nivelesExperiencia.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
            <input type="checkbox" checked={!!s.todas} onChange={(e) => poner({ todas: e.target.checked || undefined })} className="size-4 accent-[#ffd84d]" />
            Incluir medio tiempo y pasantías <span className="text-white/50">(por defecto comparamos solo tiempo completo)</span>
          </label>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/[0.07] p-5 ring-1 ring-white/10 backdrop-blur sm:col-span-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[#ffd84d]">Índice de transparencia</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight">{cargando ? "…" : <><Contador valor={de100} /> <span className="text-xl text-white/70">de cada 100</span></>}</p>
              <p className="mt-1 text-sm text-white/70">vacantes dicen cuánto pagan</p>
              <div className="mt-4 max-w-[220px]">{!cargando && <Transparencia de100={de100} />}</div>
            </div>
            <div className="rounded-3xl bg-white/[0.07] p-5 ring-1 ring-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-[#ffd84d]">Salarios reales</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight">{cargando ? "…" : <Contador valor={obs.length} />}</p>
              <p className="mt-1 text-sm text-white/70">publicados por empresas en los últimos {MESES} meses{ultima ? `. El último, el ${new Date(ultima).toLocaleDateString("es-DO", { day: "numeric", month: "long" })}` : ""}.</p>
            </div>
            <div className="rounded-3xl bg-white/[0.07] p-5 ring-1 ring-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-[#ffd84d]">Salario mediano publicado</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight">{cargando || !general ? "…" : <Contador valor={general.mediana} formato={pesos} />}</p>
              <p className="mt-1 text-sm text-white/70">{general ? `La mitad de las vacantes ofrece menos y la otra mitad más${hayFiltros ? ", con tus filtros" : ""}.` : ""}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-14 px-6 py-12">
        {error && <Aviso>No pudimos cargar los salarios ahora mismo. Intenta de nuevo en unos minutos.</Aviso>}
        {cargando && <div className="h-64 animate-pulse rounded-3xl bg-muted" aria-label="Cargando" />}

        {!cargando && !error && (
          <>
            {filtro.q && <Resultado consulta={filtro.q} obs={encontradas} hayFiltros={hayFiltros} />}

            <section aria-labelledby="termometro">
              <Termometro salario={miSalario} onSalario={setMiSalario} comparables={comparables} etiqueta={etiquetaComp} />
            </section>

            <section aria-labelledby="mapa">
              <Encabezado id="mapa" etiqueta="El mapa" titulo="Todos los salarios publicados, uno por uno" texto={filtro.q ? `En azul, las vacantes de “${filtro.q}”. Cada punto es una vacante real: tócalo para verla.` : "Cada punto es una vacante real con su salario. Las líneas marcan el salario mínimo de una gran empresa y lo que cuesta la canasta de un hogar."} />
              <div className="mt-8 rounded-3xl border border-border bg-surface px-3 pb-5 pt-12 sm:px-6">
                {base.length ? <MapaSalarios obs={base} resaltar={filtro.q ? (o) => idsBusqueda.has(o.id) : undefined} etiquetaResaltado={filtro.q ? `Vacantes de “${filtro.q}”` : undefined} miSalario={miSalario || undefined} /> : <p className="py-8 text-center text-muted-foreground">Sin salarios con estos filtros.</p>}
              </div>
              {general && <p className="mt-3 text-sm text-muted-foreground"><b className="text-foreground">{Math.round((base.filter((o) => o.valor < CANASTA.nacional).length / base.length) * 100)}%</b> de estas vacantes ofrece menos de lo que cuesta la canasta familiar de un hogar.</p>}
            </section>

            {/* ---------- Ranking ---------- */}
            <section aria-labelledby="ranking">
              <Encabezado id="ranking" etiqueta="Puestos" titulo="¿Qué puestos ofrecen mejores salarios?" texto={`Ordenados por salario mediano publicado. Solo entran puestos con ${MIN_RANKING} vacantes o más${hayFiltros ? " con los filtros que elegiste" : ""}.`} />
              {ranking.length ? (
                <ol className="mt-6 space-y-2">
                  {ranking.map((g, i) => <FilaRanking key={g.clave} pos={i + 1} nombre={g.nombre} r={g.resumen} techo={ranking[0]!.resumen.max} onClick={() => { setTexto(g.nombre); window.scrollTo({ top: 0, behavior: "smooth" }); }} />)}
                </ol>
              ) : (
                <SinRanking base={base} />
              )}
            </section>

            {/* ---------- Por área ---------- */}
            <section aria-labelledby="areas">
              <Encabezado id="areas" etiqueta="Áreas" titulo="Salarios publicados por área" texto="El rango típico es donde cae la mitad de las vacantes del área. Con pocas vacantes no damos cifra." />
              <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr><th className="px-4 py-3">Área</th><th className="px-4 py-3">Mediana</th><th className="hidden px-4 py-3 sm:table-cell">Rango típico</th><th className="px-4 py-3 text-right">Vacantes</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tablaAreas.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Sin salarios con estos filtros.</td></tr>}
                    {tablaAreas.map(({ area, resumen: r }) => (
                      <tr key={area}>
                        <td className="px-4 py-3 font-semibold"><button type="button" onClick={() => poner({ area })} className="text-left hover:text-primary hover:underline">{area}</button></td>
                        <td className="px-4 py-3 font-bold tabular-nums">{r.n >= MIN_RANKING ? pesos(r.mediana) : <span className="font-normal text-muted-foreground">Pocos datos</span>}</td>
                        <td className="hidden px-4 py-3 tabular-nums text-muted-foreground sm:table-cell">{r.n >= MIN_RANGO ? `${pesos(r.p25)} – ${pesos(r.p75)}` : "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{r.n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <Metodo />

        <section className="rounded-3xl bg-[#0a2f5c] p-8 text-white md:p-10">
          <Sparkles className="size-7 text-[#ffd84d]" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">¿Tu empresa está contratando?</h2>
          <p className="mt-2 max-w-2xl text-white/80">Cada vacante con salario hace este radar más útil para todo el país. Publicar en Enlace Laboral es gratis, y las vacantes con salario visible suelen generar menos dudas antes de aplicar.</p>
          <Link to="/empresas" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#ffd84d] px-5 py-3 font-extrabold text-[#0a2f5c] transition hover:-translate-y-0.5">Publicar vacante con salario <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}

// ---------- Resultado de una búsqueda ----------

function Resultado({ consulta, obs, hayFiltros }: { consulta: string; obs: Observacion[]; hayFiltros: boolean }) {
  const r = resumir(obs);
  const nombres = useMemo(() => agrupar(obs).sort((a, b) => b.resumen.n - a.resumen.n), [obs]);
  const titulo = consulta.charAt(0).toUpperCase() + consulta.slice(1);

  if (!r) {
    return (
      <section className="rounded-3xl border border-dashed border-border bg-surface p-8 text-center" aria-live="polite">
        <p className="text-lg font-bold">Todavía no hay vacantes con salario para “{consulta}”{hayFiltros ? " con estos filtros" : ""}.</p>
        <p className="mt-2 text-muted-foreground">Prueba con otra forma de decirlo (por ejemplo “contable” en vez de “contabilidad”) o quita algún filtro.</p>
        <Link to="/vacantes" search={{ q: consulta }} className="mt-4 inline-flex items-center gap-1.5 font-bold text-primary hover:underline">Ver vacantes de {consulta} <ArrowRight className="size-4" /></Link>
      </section>
    );
  }

  const nivel = TEXTO_NIVEL[r.nivel];
  const conRango = r.n >= MIN_RANGO;
  const compartir = () => {
    const linea = r.n >= MIN_CALCULO ? `${titulo}: salario mediano publicado ${pesos(r.mediana)} (${r.n} vacantes).` : `${titulo}: mira los salarios publicados.`;
    const url = typeof window !== "undefined" ? window.location.href : `${SITIO}/salarios`;
    const msg = `${linea}\nRadar salarial de Enlace Laboral:\n${url}`;
    if (navigator.share) { void navigator.share({ text: msg }).catch(() => undefined); return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 md:p-8" aria-live="polite" aria-label={`Salarios de ${consulta}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Salarios publicados para</p>
          <h2 className="text-3xl font-extrabold tracking-tight">{titulo}</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${nivel.tono}`} title={nivel.d}>{nivel.t} · {r.n} {r.n === 1 ? "vacante" : "vacantes"}</span>
      </div>

      {r.n < MIN_CALCULO ? (
        <>
          <p className="mt-4 max-w-2xl text-muted-foreground">{nivel.d}</p>
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
            {obs.map((o, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span><span className="font-semibold">{o.titulo}</span> <span className="text-sm text-muted-foreground">· {o.provincia} · {new Date(o.fecha).toLocaleDateString("es-DO", { month: "short", year: "numeric" })}</span></span>
                <span className="font-bold tabular-nums">{o.salarioMax ? `${pesos(o.salarioMin)} – ${pesos(o.salarioMax)}` : pesos(o.salarioMin)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Dato rotulo="Salario mediano" valor={pesos(r.mediana)} nota="La mitad ofrece menos y la mitad más" fuerte />
            {conRango
              ? <Dato rotulo="Rango típico" valor={`${pesosCortos(r.p25)} – ${pesosCortos(r.p75)}`} nota="Donde cae la mitad de las vacantes" />
              : <Dato rotulo="Lo más bajo y lo más alto" valor={`${pesosCortos(r.min)} – ${pesosCortos(r.max)}`} nota="Muestra pequeña: sin rango típico" />}
            <Dato rotulo="Vacantes analizadas" valor={String(r.n)} nota={`Últimos ${MESES} meses`} />
          </div>

          <p className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${nivel.tono}`}><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {nivel.d}</p>
          {r.n >= MIN_RANKING && <a href="#termometro" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">¿Te ofrecieron un salario para este puesto? Compáralo en el termómetro <ArrowRight className="size-4" /></a>}
        </>
      )}

      {nombres.length > 1 && (
        <p className="mt-5 text-sm text-muted-foreground">Incluye: {nombres.slice(0, 6).map((g) => `${g.nombre} (${g.resumen.n})`).join(", ")}{nombres.length > 6 ? "…" : ""}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
        <Link to="/vacantes" search={{ q: consulta }} className="inline-flex items-center gap-1.5 text-primary hover:underline">Ver vacantes abiertas <ArrowRight className="size-4" /></Link>
        {r.n >= MIN_CALCULO && <Link to="/herramientas/salario-neto" search={{ bruto: r.mediana }} className="inline-flex items-center gap-1.5 text-primary hover:underline"><Calculator className="size-4" /> ¿Cuánto te llega de {pesos(r.mediana)}?</Link>}
        <button type="button" onClick={compartir} className="inline-flex items-center gap-1.5 text-primary hover:underline"><Share2 className="size-4" /> Compartir</button>
      </div>
    </section>
  );
}

// ---------- Ranking ----------

function FilaRanking({ pos, nombre, r, techo, onClick }: { pos: number; nombre: string; r: Resumen; techo: number; onClick: () => void }) {
  const w = (v: number) => `${Math.min(100, (v / techo) * 100)}%`;
  const desde = r.n >= MIN_RANGO ? r.p25 : r.min, hasta = r.n >= MIN_RANGO ? r.p75 : r.max;
  return (
    <li>
      <button type="button" onClick={onClick} className="group grid w-full grid-cols-[1.25rem_1fr_auto] items-center gap-3 sm:grid-cols-[2rem_1fr_auto] rounded-2xl border border-border bg-surface px-4 py-3 text-left transition hover:border-primary">
        <span className="font-mono text-sm font-bold text-muted-foreground">{pos}</span>
        <span className="min-w-0">
          <span className="block text-[15px] font-bold leading-tight group-hover:text-primary sm:truncate">{nombre}</span>
          <span className="relative mt-2 block h-2 rounded-full bg-muted" aria-hidden="true">
            <span className="absolute h-2 rounded-full bg-[#1d6ff2]/30" style={{ left: w(desde), width: `calc(${w(hasta)} - ${w(desde)})` }} />
            <span className="absolute -top-1 h-4 w-1 rounded bg-[#e0a800]" style={{ left: w(r.mediana) }} />
          </span>
        </span>
        <span className="text-right">
          <span className="block text-sm font-extrabold tabular-nums sm:text-base">{pesos(r.mediana)}</span>
          <span className="block text-xs text-muted-foreground">{r.n} vacantes{r.n < MIN_RANGO ? " · muestra pequeña" : ""}</span>
        </span>
      </button>
    </li>
  );
}

function SinRanking({ base }: { base: Observacion[] }) {
  const top = [...base].sort((a, b) => b.valor - a.valor).slice(0, 5);
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-border bg-surface p-6">
      <p className="font-bold">Aún no hay puestos con {MIN_RANKING} vacantes o más para armar un ranking justo.</p>
      <p className="mt-1 text-sm text-muted-foreground">Mientras se acumulan datos, estas son las ofertas individuales con el salario publicado más alto. No son promedios.</p>
      {top.length > 0 && (
        <ul className="mt-4 divide-y divide-border">
          {top.map((o, i) => <li key={i} className="flex flex-wrap justify-between gap-2 py-2.5"><span><span className="font-semibold">{o.titulo}</span> <span className="text-sm text-muted-foreground">· {o.provincia}</span></span><span className="font-bold tabular-nums">{o.salarioMax ? `${pesos(o.salarioMin)} – ${pesos(o.salarioMax)}` : pesos(o.salarioMin)}</span></li>)}
        </ul>
      )}
    </div>
  );
}

// ---------- Metodología ----------

function Metodo() {
  const reglas = [
    { n: `Menos de ${MIN_CALCULO} vacantes`, t: "No calculamos nada. Mostramos cada oferta tal como se publicó." },
    { n: `${MIN_CALCULO} a ${MIN_RANGO - 1} vacantes`, t: "Mediana y valores extremos, marcados como muestra pequeña." },
    { n: `${MIN_RANGO} a ${MIN_AMPLIA - 1} vacantes`, t: "Agregamos el rango típico y la comparación de tu oferta." },
    { n: `${MIN_AMPLIA} o más`, t: "Muestra amplia: el patrón ya es bastante estable." },
  ];
  return (
    <section aria-labelledby="metodo" className="rounded-3xl border border-border bg-surface p-6 md:p-8">
      <Encabezado id="metodo" etiqueta="Transparencia" titulo="Cómo leer el radar" texto="Esto no es una encuesta del mercado laboral dominicano. Es lo que dicen las vacantes que se publican en Enlace Laboral." />
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <ul className="space-y-3 text-sm">
          <li><b>De dónde salen los datos.</b> De vacantes publicadas en los últimos {MESES} meses que dicen cuánto pagan. Las que no publican salario no entran.</li>
          <li><b>Usamos la mediana, no el promedio.</b> Un solo salario muy alto puede inflar un promedio. La mediana es el punto del medio: la mitad ofrece menos y la mitad más.</li>
          <li><b>Si la ficha no trae el salario pero el texto sí</b> (por ejemplo «Salario publicado en el flyer: RD$27,987»), lo tomamos del texto. Descartamos montos en dólares, por hora o por día; los quincenales y semanales se pasan a mensual.</li>
          <li><b>Si la vacante da un rango</b> (por ejemplo RD$30,000 – RD$40,000), usamos el punto medio.</li>
          <li><b>Comparamos parecidos.</b> Por defecto solo tiempo completo; medio tiempo y pasantías se incluyen si lo eliges. Una misma vacante publicada dos veces cuenta una sola vez.</li>
          <li><b>Es salario bruto ofrecido</b>, antes de AFP, SFS e ISR, y sin incluir comisiones o bonos que no estén en la cifra publicada.</li>
        </ul>
        <div>
          <p className="text-sm font-bold">Cuánto mostramos según la cantidad de vacantes</p>
          <ul className="mt-3 space-y-2">
            {reglas.map((r) => <li key={r.n} className="rounded-xl bg-muted px-4 py-2.5 text-sm"><b className="tabular-nums">{r.n}:</b> {r.t}</li>)}
          </ul>
          <p className="mt-5 text-sm font-bold">Cifras oficiales de referencia</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {FUENTES_RADAR.map((f) => <li key={f.url}><a href={f.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{f.nombre}</a></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ---------- Piezas pequeñas ----------

function Encabezado({ id, etiqueta, titulo, texto }: { id: string; etiqueta: string; titulo: string; texto: string }) {
  return (
    <header>
      <p className="font-mono text-[11px] uppercase tracking-widest text-primary">{etiqueta}</p>
      <h2 id={id} className="mt-1 text-2xl font-extrabold md:text-3xl">{titulo}</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">{texto}</p>
    </header>
  );
}

function Dato({ rotulo, valor, nota, fuerte }: { rotulo: string; valor: string; nota: string; fuerte?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${fuerte ? "bg-[#0a2f5c] text-white" : "bg-muted"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${fuerte ? "text-[#ffd84d]" : "text-muted-foreground"}`}>{rotulo}</p>
      <p className={`mt-1 font-extrabold tabular-nums ${valor.length > 12 ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"}`}>{valor}</p>
      <p className={`mt-1 text-xs ${fuerte ? "text-white/70" : "text-muted-foreground"}`}>{nota}</p>
    </div>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{children}</p>;
}

/** Ondas de radar de fondo. Se quedan quietas si la persona pidió menos movimiento. */
function RadarFondo() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-[520px] opacity-30 md:right-0" viewBox="0 0 400 400">
      {[60, 110, 160, 200].map((r) => <circle key={r} cx={200} cy={200} r={r} fill="none" stroke="#ffd84d" strokeOpacity={0.35} />)}
      <g className="motion-safe:animate-[spin_8s_linear_infinite]" style={{ transformOrigin: "200px 200px" }}>
        <path d="M200 200 L200 0 A200 200 0 0 1 341 59 Z" fill="url(#barrido)" />
      </g>
      <defs><linearGradient id="barrido" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffd84d" stopOpacity="0" /><stop offset="1" stopColor="#ffd84d" stopOpacity="0.5" /></linearGradient></defs>
      {[[260, 90], [120, 140], [300, 250], [170, 300]].map(([cx, cy]) => <circle key={`${cx}`} cx={cx} cy={cy} r={4} fill="#ffd84d" />)}
    </svg>
  );
}

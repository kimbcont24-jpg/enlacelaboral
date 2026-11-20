import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { JobCard } from "@/components/site/JobCard";
import { FilaVacante, VistaPrevia } from "@/components/site/VistaPrevia";
import { SearchBar } from "@/components/site/SearchBar";
import { FiltrosRapidos, filtrarJobs, filtrosVacios, type Filtros } from "@/components/site/Filtros";
import { useVacantes } from "@/lib/vacantes";
import { AlertaForm } from "@/components/site/AlertaForm";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";
import { claridad, esClara } from "@/lib/claridad";
import { tienePerfil, useAfinidades } from "@/lib/afinidad";

type Search = { q?: string; provincia?: string; area?: string; modalidad?: string; tipo?: string; experiencia?: string; salarioMin?: string; incl?: string };

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/vacantes/")({
  validateSearch: (s: Record<string, unknown>): Search => ({ q: str(s["q"]), provincia: str(s["provincia"]), area: str(s["area"]), modalidad: str(s["modalidad"]), tipo: str(s["tipo"]), experiencia: str(s["experiencia"]), salarioMin: str(s["salarioMin"]), incl: str(s["incl"]) }),
  head: () => ({ meta: [{ title: "Vacantes en República Dominicana | Enlace Laboral" }, { name: "description", content: "Busca vacantes en toda República Dominicana. Filtra por área, ubicación, salario y modalidad." }], links: [{ rel: "canonical", href: "https://enlacelaboralrd.com/vacantes" }] }),
  component: Vacantes,
});

const TODAS = "Toda República Dominicana";

function Vacantes() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { jobs, cargando, error, reintentar } = useVacantes();
  const [puesto, setPuesto] = useState(search.q ?? "");
  const [provinciaBuscador, setProvinciaBuscador] = useState(search.provincia ?? TODAS);
  const [filtros, setFiltros] = useState<Filtros>({ ...filtrosVacios, area: search.area ?? "", provincia: search.provincia ?? "", modalidad: search.modalidad ?? "", tipo: search.tipo ?? "", experiencia: search.experiencia ?? "", salarioMin: search.salarioMin ?? "", incl: search.incl ?? "", fecha: "", conSalario: "" });
  const [orden, setOrden] = useState<"reciente" | "salario" | "claridad" | "parati">("reciente");
  const [query, setQuery] = useState(search.q ?? "");
  const [visibles, setVisibles] = useState(30);
  const [elegida, setElegida] = useState<string | null>(null);

  useEffect(() => {
    setFiltros((f) => ({ ...f, area: search.area ?? f.area, provincia: search.provincia ?? f.provincia, modalidad: search.modalidad ?? f.modalidad, experiencia: search.experiencia ?? f.experiencia }));
  }, [search.area, search.provincia, search.modalidad, search.experiencia]);

  const { perfil, mapa: afin } = useAfinidades(jobs);
  const conPerfil = tienePerfil(perfil);
  const resultados = useMemo(() => {
    const list = filtrarJobs(jobs, filtros, query);
    if (orden === "parati") return [...list].sort((a, b) => (afin.get(b.id)?.puntos ?? 0) - (afin.get(a.id)?.puntos ?? 0) || b.creado.localeCompare(a.creado));
    if (orden === "salario") return [...list].sort((a, b) => b.salarioMin - a.salarioMin);
    if (orden === "claridad") return [...list].sort((a, b) => claridad(b).puntos - claridad(a).puntos);
    // Más recientes: dentro del mismo día, las vacantes claras 6/6 salen primero (premio a la transparencia).
    const dia = (iso: string) => new Date(new Date(iso).getTime() - 4 * 3600e3).toISOString().slice(0, 10);
    return [...list].sort((a, b) => Number(!!b.destacada) - Number(!!a.destacada) || dia(b.creado).localeCompare(dia(a.creado)) || Number(esClara(b)) - Number(esClara(a)));
  }, [jobs, filtros, query, orden, afin]);

  // Al cambiar filtros, búsqueda u orden se vuelve a las primeras 30.
  useEffect(() => { setVisibles(30); setElegida(null); }, [filtros, query, orden]);
  const vista = resultados.find((j) => j.id === elegida) ?? resultados[0];
  const paraMi = resultados.filter((j) => afin.has(j.id)).length;
  const hayFiltros = !!query || Object.values(filtros).some(Boolean);
  const limpiar = () => { setPuesto(""); setQuery(""); setProvinciaBuscador(TODAS); setFiltros(filtrosVacios); void navigate({ to: "/vacantes", search: {} }); };
  const sugeridas = useMemo(() => [...afin.values()].sort((a, b) => b.puntos - a.puntos).slice(0, 3).map((r) => r.job), [afin]);

  const buscar = () => {
    setQuery(puesto);
    const prov = provinciaBuscador === TODAS ? "" : provinciaBuscador;
    setFiltros((f) => ({ ...f, provincia: prov }));
    void navigate({ to: "/vacantes", search: { q: puesto || undefined, provincia: prov || undefined } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 md:pt-10">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Vacantes disponibles</h1>
        <div className="mt-5"><SearchBar puesto={puesto} provincia={provinciaBuscador} onPuesto={setPuesto} onProvincia={setProvinciaBuscador} onSubmit={buscar} /></div>
        <FiltrosRapidos value={filtros} onChange={setFiltros} className="mt-4" />
        {!cargando && conPerfil && paraMi > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#1d6ff2]/25 bg-[#1d6ff2]/[0.05] px-4 py-3 text-sm">
            <Sparkles className="size-5 shrink-0 text-[#1557c4]" />
            <p className="min-w-0 flex-1"><b>{paraMi} {paraMi === 1 ? "vacante encaja" : "vacantes encajan"} contigo</b> <span className="text-muted-foreground">según lo que buscas{perfil.puesto.trim() ? ` (${perfil.puesto.trim()})` : ""}. Las marcamos con ✦.</span></p>
            {orden !== "parati" ? <button type="button" onClick={() => setOrden("parati")} className="h-9 shrink-0 rounded-xl bg-[#1d6ff2] px-4 font-bold text-white hover:bg-[#155fd4]">Verlas primero</button>
              : <Link to="/guardadas" search={{ ver: "parati" }} className="shrink-0 font-semibold text-[#1557c4] hover:underline">Cambiar lo que busco</Link>}
          </div>
        )}
        {!cargando && !conPerfil && jobs.length > 0 && (
          <Link to="/guardadas" search={{ ver: "parati" }} className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-[#1d6ff2]/40 px-4 py-3 text-sm hover:border-[#1d6ff2]">
            <Sparkles className="size-5 shrink-0 text-[#1557c4]" />
            <span className="min-w-0 flex-1"><b>¿Quieres ver primero las que encajan contigo?</b> <span className="text-muted-foreground">Dinos qué buscas en 3 toques y las marcamos.</span></span>
            <span className="shrink-0 font-bold text-[#1557c4]">Empezar</span>
          </Link>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b md:mt-8 border-border pb-4">
          <p className="text-sm text-muted-foreground"><span className="font-bold text-foreground">{resultados.length}</span> {resultados.length === 1 ? "vacante" : "vacantes"}</p>
          <select value={orden} onChange={(e) => setOrden(e.target.value as "reciente" | "salario" | "claridad" | "parati")} aria-label="Ordenar" className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium">
            {conPerfil && <option value="parati">Más parecidas a mí</option>}
            <option value="reciente">Más recientes</option>
            <option value="salario">Mayor salario</option>
            <option value="claridad">Más completas primero</option>
          </select>
        </div>
        {error && !cargando && jobs.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="font-bold">No pudimos traer las vacantes en este momento</p>
            <p className="mt-2 text-sm text-muted-foreground">Es algo de nuestro lado, no de tu conexión. Intenta de nuevo en unos minutos.</p>
            <button type="button" onClick={reintentar} className="btn-aplicar mt-5 rounded-xl px-5 py-3 text-sm">Intentar de nuevo</button>
          </div>
        )}
        {cargando && (<div className="mt-6 flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Cargando vacantes…</div>)}
        {!cargando && resultados.length > 0 && (
          <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
            {/* Celular y tableta: tarjetas completas */}
            <div className="space-y-4 lg:hidden">{resultados.slice(0, visibles).map((job) => (<JobCard key={job.id} job={job} />))}</div>
            {/* Computadora: lista a la izquierda y la vacante al lado */}
            <div className="hidden space-y-2.5 lg:block">{resultados.slice(0, visibles).map((job) => (<FilaVacante key={job.id} job={job} activa={vista?.id === job.id} onElegir={() => setElegida(job.id)} />))}</div>
            <div className="sticky top-24 hidden lg:block">{vista && <VistaPrevia job={vista} />}</div>
          </div>
        )}
        <div className="mt-6 space-y-4">
          {!cargando && resultados.length > visibles && (
            <button type="button" onClick={() => setVisibles((v) => v + 30)} className="mx-auto flex h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 text-sm font-bold text-primary hover:border-primary lg:mx-0 lg:w-[26rem] xl:w-[28rem]">Ver {Math.min(30, resultados.length - visibles)} más ({resultados.length - visibles} sin mostrar)</button>
          )}
          {!cargando && !error && resultados.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center sm:p-12">
              <p className="font-bold">No encontramos vacantes{query ? ` de «${query}»` : ""} con esos filtros</p>
              <p className="mt-2 text-sm text-muted-foreground">Prueba con otra palabra (por ejemplo «ventas» en vez de «vendedor de tienda»), otra ubicación, o crea una alerta abajo y te avisamos cuando salga.</p>
              {hayFiltros && <button type="button" onClick={limpiar} className="btn-aplicar mt-5 rounded-xl px-5 py-3 text-sm">Ver todas las vacantes ({jobs.length})</button>}
              {sugeridas.length > 0 && (
                <div className="mt-8 text-left">
                  <p className="mb-3 flex items-center gap-2 text-sm font-extrabold"><Sparkles className="size-4 text-[#1557c4]" /> Mientras, estas encajan contigo:</p>
                  <div className="grid gap-4 md:grid-cols-3">{sugeridas.map((job) => <JobCard key={job.id} job={job} />)}</div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-10 grid gap-4"><CanalWhatsApp /><AlertaForm areaInicial={filtros.area} provinciaInicial={filtros.provincia} /></div>
      </div>
      <Footer />
    </div>
  );
}

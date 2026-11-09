import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { JobCard } from "@/components/site/JobCard";
import { FilaVacante, VistaPrevia } from "@/components/site/VistaPrevia";
import { SearchBar } from "@/components/site/SearchBar";
import { FiltrosRapidos, filtrarJobs, filtrosVacios, type Filtros } from "@/components/site/Filtros";
import { useVacantes } from "@/lib/vacantes";
import { AlertaForm } from "@/components/site/AlertaForm";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";
import { claridad } from "@/lib/claridad";

type Search = { q?: string; provincia?: string; area?: string; modalidad?: string; tipo?: string; experiencia?: string; salarioMin?: string; incl?: string };

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/vacantes/")({
  validateSearch: (s: Record<string, unknown>): Search => ({ q: str(s["q"]), provincia: str(s["provincia"]), area: str(s["area"]), modalidad: str(s["modalidad"]), tipo: str(s["tipo"]), experiencia: str(s["experiencia"]), salarioMin: str(s["salarioMin"]), incl: str(s["incl"]) }),
  head: () => ({ meta: [{ title: "Vacantes en República Dominicana | Enlace Laboral" }, { name: "description", content: "Busca vacantes en toda República Dominicana. Filtra por área, ubicación, salario y modalidad." }] }),
  component: Vacantes,
});

const TODAS = "Toda República Dominicana";

function Vacantes() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { jobs, cargando } = useVacantes();
  const [puesto, setPuesto] = useState(search.q ?? "");
  const [provinciaBuscador, setProvinciaBuscador] = useState(search.provincia ?? TODAS);
  const [filtros, setFiltros] = useState<Filtros>({ ...filtrosVacios, area: search.area ?? "", provincia: search.provincia ?? "", modalidad: search.modalidad ?? "", tipo: search.tipo ?? "", experiencia: search.experiencia ?? "", salarioMin: search.salarioMin ?? "", incl: search.incl ?? "", fecha: "", conSalario: "" });
  const [orden, setOrden] = useState<"reciente" | "salario" | "claridad">("reciente");
  const [query, setQuery] = useState(search.q ?? "");
  const [visibles, setVisibles] = useState(30);
  const [elegida, setElegida] = useState<string | null>(null);

  useEffect(() => {
    setFiltros((f) => ({ ...f, area: search.area ?? f.area, provincia: search.provincia ?? f.provincia, modalidad: search.modalidad ?? f.modalidad, experiencia: search.experiencia ?? f.experiencia }));
  }, [search.area, search.provincia, search.modalidad, search.experiencia]);

  const resultados = useMemo(() => {
    const list = filtrarJobs(jobs, filtros, query);
    if (orden === "salario") return [...list].sort((a, b) => b.salarioMin - a.salarioMin);
    if (orden === "claridad") return [...list].sort((a, b) => claridad(b).puntos - claridad(a).puntos);
    return list;
  }, [jobs, filtros, query, orden]);

  // Al cambiar filtros, búsqueda u orden se vuelve a las primeras 30.
  useEffect(() => { setVisibles(30); setElegida(null); }, [filtros, query, orden]);
  const vista = resultados.find((j) => j.id === elegida) ?? resultados[0];

  const buscar = () => {
    setQuery(puesto);
    const prov = provinciaBuscador === TODAS ? "" : provinciaBuscador;
    setFiltros((f) => ({ ...f, provincia: prov }));
    void navigate({ to: "/vacantes", search: { q: puesto || undefined, provincia: prov || undefined } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Vacantes disponibles</h1>
        <div className="mt-5"><SearchBar puesto={puesto} provincia={provinciaBuscador} onPuesto={setPuesto} onProvincia={setProvinciaBuscador} onSubmit={buscar} /></div>
        <FiltrosRapidos value={filtros} onChange={setFiltros} className="mt-4" />
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <p className="text-sm text-muted-foreground"><span className="font-bold text-foreground">{resultados.length}</span> {resultados.length === 1 ? "vacante" : "vacantes"}</p>
          <select value={orden} onChange={(e) => setOrden(e.target.value as "reciente" | "salario" | "claridad")} aria-label="Ordenar" className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium">
            <option value="reciente">Más recientes</option>
            <option value="salario">Mayor salario</option>
            <option value="claridad">Más completas primero</option>
          </select>
        </div>
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
          {!cargando && resultados.length === 0 && (<div className="rounded-2xl border border-dashed border-border p-12 text-center"><p className="font-bold">No encontramos vacantes con esos filtros</p><p className="mt-2 text-sm text-muted-foreground">Prueba con otra ubicación o limpia los filtros. O crea una alerta y te avisamos cuando salga una.</p></div>)}
        </div>
        <div className="mt-10 grid gap-4"><CanalWhatsApp /><AlertaForm areaInicial={filtros.area} provinciaInicial={filtros.provincia} /></div>
      </div>
      <Footer />
    </div>
  );
}

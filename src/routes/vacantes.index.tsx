import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { JobCard } from "@/components/site/JobCard";
import { SearchBar } from "@/components/site/SearchBar";
import { FiltrosRapidos, filtrarJobs, filtrosVacios, type Filtros } from "@/components/site/Filtros";
import { useVacantes } from "@/lib/vacantes";

type Search = { q?: string; provincia?: string; area?: string; modalidad?: string; tipo?: string; experiencia?: string; salarioMin?: string };

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/vacantes/")({
  validateSearch: (s: Record<string, unknown>): Search => ({ q: str(s["q"]), provincia: str(s["provincia"]), area: str(s["area"]), modalidad: str(s["modalidad"]), tipo: str(s["tipo"]), experiencia: str(s["experiencia"]), salarioMin: str(s["salarioMin"]) }),
  head: () => ({ meta: [{ title: "Vacantes en RD | Enlace Laboral" }, { name: "description", content: "Busca vacantes en toda República Dominicana. Filtra por área, ubicación, salario y modalidad." }] }),
  component: Vacantes,
});

const TODAS = "Toda República Dominicana";

function Vacantes() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { jobs, cargando } = useVacantes();
  const [puesto, setPuesto] = useState(search.q ?? "");
  const [provinciaBuscador, setProvinciaBuscador] = useState(search.provincia ?? TODAS);
  const [filtros, setFiltros] = useState<Filtros>({ ...filtrosVacios, area: search.area ?? "", provincia: search.provincia ?? "", modalidad: search.modalidad ?? "", tipo: search.tipo ?? "", experiencia: search.experiencia ?? "", salarioMin: search.salarioMin ?? "" });
  const [orden, setOrden] = useState<"reciente" | "salario">("reciente");
  const [query, setQuery] = useState(search.q ?? "");

  useEffect(() => {
    if (search.area !== undefined) setFiltros((f) => ({ ...f, area: search.area ?? "" }));
  }, [search.area]);

  const resultados = useMemo(() => {
    const list = filtrarJobs(jobs, filtros, query);
    return orden === "salario" ? [...list].sort((a, b) => b.salarioMin - a.salarioMin) : list;
  }, [jobs, filtros, query, orden]);

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
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Vacantes disponibles</h1>
        <div className="mt-5"><SearchBar puesto={puesto} provincia={provinciaBuscador} onPuesto={setPuesto} onProvincia={setProvinciaBuscador} onSubmit={buscar} /></div>
        <FiltrosRapidos value={filtros} onChange={setFiltros} className="mt-4" />
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <p className="text-sm text-muted-foreground"><span className="font-bold text-foreground">{resultados.length}</span> {resultados.length === 1 ? "vacante" : "vacantes"}</p>
          <select value={orden} onChange={(e) => setOrden(e.target.value as "reciente" | "salario")} aria-label="Ordenar" className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium">
            <option value="reciente">Más recientes</option>
            <option value="salario">Mayor salario</option>
          </select>
        </div>
        <div className="mt-6 space-y-4">
          {cargando && (<div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Cargando vacantes…</div>)}
          {!cargando && resultados.map((job) => (<JobCard key={job.id} job={job} />))}
          {!cargando && resultados.length === 0 && (<div className="rounded-2xl border border-dashed border-border p-12 text-center"><p className="font-bold">No encontramos vacantes con esos filtros</p><p className="mt-2 text-sm text-muted-foreground">Prueba con otra ubicación o limpia los filtros.</p></div>)}
        </div>
      </div>
      <Footer />
    </div>
  );
}

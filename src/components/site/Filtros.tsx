import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { NIVELES, nivelDe } from "@/lib/claridad";
import { areas, modalidades, nivelesExperiencia, provincias, rangosSalario, tiposEmpleo } from "@/lib/data";

export type Filtros = { area: string; provincia: string; salarioMin: string; modalidad: string; experiencia: string; tipo: string; fecha: string; conSalario: string; nivel: string };

export const filtrosVacios: Filtros = { area: "", provincia: "", salarioMin: "", modalidad: "", experiencia: "", tipo: "", fecha: "", conSalario: "", nivel: "" };

const fechas = [{ value: "1", label: "Hoy" }, { value: "3", label: "Últimos 3 días" }, { value: "7", label: "Última semana" }];

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} className={activo ? "rounded-full border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" : "rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"}>
      {children}
    </button>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={value !== "" ? "min-w-0 rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary" : "min-w-0 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/50"}>
      <option value="">{label}</option>
      {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

export function FiltrosRapidos({ value, onChange, className = "" }: { value: Filtros; onChange: (f: Filtros) => void; className?: string }) {
  const set = (k: keyof Filtros) => (v: string) => onChange({ ...value, [k]: v });
  const hayFiltros = Object.values(value).some((v) => v !== "");
  const [mas, setMas] = useState(false);
  const activos = [value.area, value.provincia, value.salarioMin, value.tipo, value.fecha, value.nivel].filter(Boolean).length;
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Atajos">
        <Chip activo={value.fecha === "1"} onClick={() => set("fecha")(value.fecha === "1" ? "" : "1")}>Publicadas hoy</Chip>
        <Chip activo={value.conSalario === "si"} onClick={() => set("conSalario")(value.conSalario === "si" ? "" : "si")}>Con salario visible</Chip>
        <Chip activo={value.nivel === "Primer empleo"} onClick={() => set("nivel")(value.nivel === "Primer empleo" ? "" : "Primer empleo")}>Primer empleo</Chip>
        <Chip activo={value.modalidad === "Remoto"} onClick={() => set("modalidad")(value.modalidad === "Remoto" ? "" : "Remoto")}>Desde casa</Chip>
      </div>
      <button type="button" onClick={() => setMas((m) => !m)} aria-expanded={mas} className="mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary md:hidden">
        <SlidersHorizontal className="size-4" aria-hidden="true" /> {mas ? "Ocultar filtros" : `Más filtros${activos ? ` (${activos})` : ""}`}
      </button>
      <div className={`${mas ? "flex" : "hidden"} flex-wrap items-center justify-center gap-2 md:flex`}>
      <Select label="Área" value={value.area} onChange={set("area")} options={areas.map((a) => ({ value: a, label: a }))} />
      <Select label="Ubicación" value={value.provincia} onChange={set("provincia")} options={provincias.slice(1).map((p) => ({ value: p, label: p }))} />
      <Select label="Salario" value={value.salarioMin} onChange={set("salarioMin")} options={rangosSalario.map((r) => ({ value: String(r.min), label: r.label }))} />
      <Select label="Modalidad" value={value.modalidad} onChange={set("modalidad")} options={modalidades.map((m) => ({ value: m, label: m }))} />
      <Select label="Nivel profesional" value={value.nivel} onChange={set("nivel")} options={NIVELES.map((n) => ({ value: n, label: n }))} />
      <Select label="Experiencia" value={value.experiencia} onChange={set("experiencia")} options={nivelesExperiencia.map((n) => ({ value: n, label: n }))} />
      <Select label="Tipo de empleo" value={value.tipo} onChange={set("tipo")} options={tiposEmpleo.map((t) => ({ value: t, label: t }))} />
      <Select label="Fecha de publicación" value={value.fecha} onChange={set("fecha")} options={fechas} />
      {hayFiltros && (<button type="button" onClick={() => onChange(filtrosVacios)} className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-primary hover:underline">Limpiar filtros</button>)}
      </div>
    </div>
  );
}

export function filtrarJobs<T extends { area: string; provincia: string; modalidad: string; experiencia: string; tipo: string; salarioMin: number; titulo: string; empresa: string; categorias: string[]; creado: string }>(jobs: T[], f: Filtros, q = "") {
  const query = q.trim().toLowerCase();
  return jobs.filter((j) => {
    if (query && !`${j.titulo} ${j.empresa} ${j.area} ${j.categorias.join(" ")}`.toLowerCase().includes(query)) return false;
    if (f.area && j.area !== f.area) return false;
    if (f.provincia && j.provincia !== f.provincia) return false;
    if (f.modalidad && j.modalidad !== f.modalidad) return false;
    if (f.experiencia && j.experiencia !== f.experiencia) return false;
    if (f.nivel && nivelDe(j) !== f.nivel) return false;
    if (f.tipo && j.tipo !== f.tipo) return false;
    if (f.salarioMin && j.salarioMin < Number(f.salarioMin)) return false;
    if (f.conSalario && j.salarioMin <= 0) return false;
    if (f.fecha && Date.now() - new Date(j.creado).getTime() > Number(f.fecha) * 864e5) return false;
    return true;
  });
}

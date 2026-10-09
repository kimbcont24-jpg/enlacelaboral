import { areas, modalidades, nivelesExperiencia, provincias, rangosSalario, tiposEmpleo } from "@/lib/data";

export type Filtros = { area: string; provincia: string; salarioMin: string; modalidad: string; experiencia: string; tipo: string };

export const filtrosVacios: Filtros = { area: "", provincia: "", salarioMin: "", modalidad: "", experiencia: "", tipo: "" };

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
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Select label="Área" value={value.area} onChange={set("area")} options={areas.map((a) => ({ value: a, label: a }))} />
      <Select label="Ubicación" value={value.provincia} onChange={set("provincia")} options={provincias.slice(1).map((p) => ({ value: p, label: p }))} />
      <Select label="Salario" value={value.salarioMin} onChange={set("salarioMin")} options={rangosSalario.map((r) => ({ value: String(r.min), label: r.label }))} />
      <Select label="Modalidad" value={value.modalidad} onChange={set("modalidad")} options={modalidades.map((m) => ({ value: m, label: m }))} />
      <Select label="Experiencia" value={value.experiencia} onChange={set("experiencia")} options={nivelesExperiencia.map((n) => ({ value: n, label: n }))} />
      <Select label="Tipo de empleo" value={value.tipo} onChange={set("tipo")} options={tiposEmpleo.map((t) => ({ value: t, label: t }))} />
      {hayFiltros && (<button type="button" onClick={() => onChange(filtrosVacios)} className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-primary hover:underline">Limpiar filtros</button>)}
    </div>
  );
}

export function filtrarJobs<T extends { area: string; provincia: string; modalidad: string; experiencia: string; tipo: string; salarioMin: number; titulo: string; empresa: string; categorias: string[] }>(jobs: T[], f: Filtros, q = "") {
  const query = q.trim().toLowerCase();
  return jobs.filter((j) => {
    if (query && !`${j.titulo} ${j.empresa} ${j.area} ${j.categorias.join(" ")}`.toLowerCase().includes(query)) return false;
    if (f.area && j.area !== f.area) return false;
    if (f.provincia && j.provincia !== f.provincia) return false;
    if (f.modalidad && j.modalidad !== f.modalidad) return false;
    if (f.experiencia && j.experiencia !== f.experiencia) return false;
    if (f.tipo && j.tipo !== f.tipo) return false;
    if (f.salarioMin && j.salarioMin < Number(f.salarioMin)) return false;
    return true;
  });
}

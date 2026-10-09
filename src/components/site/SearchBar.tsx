import { MapPin, Search } from "lucide-react";

import { provincias } from "@/lib/data";

type Props = { puesto: string; provincia: string; onPuesto: (v: string) => void; onProvincia: (v: string) => void; onSubmit?: () => void; ctaLabel?: string };

export function SearchBar({ puesto, provincia, onPuesto, onProvincia, onSubmit, ctaLabel = "Buscar empleo" }: Props) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-2.5 shadow-[var(--shadow-soft)] md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
        <Search className="size-5 shrink-0 text-muted-foreground" />
        <input value={puesto} onChange={(e) => onPuesto(e.target.value)} placeholder="Puesto, área o palabra clave" aria-label="Puesto, área o palabra clave" className="w-full min-w-0 bg-transparent text-base outline-none md:text-lg" />
      </div>
      <div className="hidden h-8 w-px bg-border md:block" />
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
        <MapPin className="size-5 shrink-0 text-muted-foreground" />
        <select value={provincia} onChange={(e) => onProvincia(e.target.value)} aria-label="Ubicación" className="w-full min-w-0 bg-transparent text-base outline-none md:text-lg">
          {provincias.map((p) => (<option key={p}>{p}</option>))}
        </select>
      </div>
      <button type="submit" className="shrink-0 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground hover:brightness-110">{ctaLabel}</button>
    </form>
  );
}

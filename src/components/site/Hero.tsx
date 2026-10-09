import { CheckCircle2, FileSearch, Search, Send, Sparkles } from "lucide-react";

import { SearchBar } from "@/components/site/SearchBar";
import { FiltrosRapidos, type Filtros } from "@/components/site/Filtros";
import { textosPorDefecto, useContenido } from "@/lib/contenido";

const pasos = [
  { icono: Search, titulo: "Busca", texto: "Filtra por área, provincia, salario o modalidad." },
  { icono: FileSearch, titulo: "Revisa la vacante", texto: "Requisitos, salario si lo publican y la fuente original." },
  { icono: Send, titulo: "Aplica gratis", texto: "Te llevamos al contacto de la empresa o envías tus datos aquí mismo." },
];

type Props = { puesto: string; provincia: string; onPuesto: (v: string) => void; onProvincia: (v: string) => void; onBuscar: () => void; filtros: Filtros; onFiltros: (f: Filtros) => void; total: number };

export function Hero({ puesto, provincia, onPuesto, onProvincia, onBuscar, filtros, onFiltros, total }: Props) {
  const t = useContenido();
  return (
    <header className="relative overflow-hidden border-b border-border bg-gradient-to-b from-secondary/60 via-background to-background px-6 pb-10 pt-10 md:pt-14">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary"><Sparkles className="size-4" /> {t.hero_badge}</span>
            <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              {t.hero_titulo === textosPorDefecto.hero_titulo ? (<>Encuentra tu próximo empleo <span className="text-muted-foreground">en</span> <span className="text-primary">República Dominicana</span></>) : t.hero_titulo}
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground md:text-lg">{t.hero_subtitulo}</p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
              {["Aplicar es gratis", "Fuente original visible", "Vacantes de todo el país"].map((x) => (<li key={x} className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle2 className="size-4 text-success" /> {x}</li>))}
            </ul>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)] md:p-8">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Cómo funciona</p>
            <ol className="mt-5 space-y-5">
              {pasos.map((p, i) => (
                <li key={p.titulo} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <p.icono className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-bold"><span className="text-muted-foreground">{i + 1}.</span> {p.titulo}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="mt-10 rounded-3xl border border-border bg-surface/80 p-2 shadow-[var(--shadow-lift)]">
          <SearchBar puesto={puesto} provincia={provincia} onPuesto={onPuesto} onProvincia={onProvincia} onSubmit={onBuscar} ctaLabel="Buscar empleo" />
        </div>
        <FiltrosRapidos value={filtros} onChange={onFiltros} className="mt-4 justify-center" />
        {total > 0 && (<p className="mt-5 text-center text-sm text-muted-foreground"><span className="font-bold text-foreground">{total}</span> {total === 1 ? "vacante disponible" : "vacantes disponibles"} · aplicar es gratis</p>)}
      </div>
    </header>
  );
}

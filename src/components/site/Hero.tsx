import { Building2, CheckCircle2, GraduationCap, Landmark, Search, UserRound, Users } from "lucide-react";

import { SearchBar } from "@/components/site/SearchBar";
import { FiltrosRapidos, type Filtros } from "@/components/site/Filtros";
import { LogoMarca } from "@/components/site/Logo";
import { textosPorDefecto, useContenido } from "@/lib/contenido";

const personas = [
  { icono: UserRound, texto: "Buscas tu primer empleo" },
  { icono: Users, texto: "Tienes experiencia" },
  { icono: Search, texto: "Quieres cambiar de trabajo" },
];

const organizaciones = [
  { icono: Building2, texto: "Empresas" },
  { icono: GraduationCap, texto: "Universidades y centros técnicos" },
  { icono: Landmark, texto: "Instituciones y ferias de empleo" },
];

type Props = { puesto: string; provincia: string; onPuesto: (v: string) => void; onProvincia: (v: string) => void; onBuscar: () => void; filtros: Filtros; onFiltros: (f: Filtros) => void; total: number };

function Lado({ titulo, items, color }: { titulo: string; items: typeof personas; color: "mango" | "mar" }) {
  const tono = color === "mango" ? "bg-cta/15 text-[#9a5b00]" : "bg-primary/10 text-primary";
  return (
    <div>
      <p className="text-sm font-bold text-foreground">{titulo}</p>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.texto} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium">
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tono}`}><i.icono className="size-4" aria-hidden="true" /></span>
            {i.texto}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Diagrama() {
  return (
    <div className="rounded-3xl bg-secondary p-5 sm:p-6" aria-label="Cómo conecta Enlace RD">
            <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
              <Lado titulo="Personas" items={personas} color="mango" />
              <div className="flex flex-row items-center justify-center gap-2 sm:flex-col">
                <span className="hidden h-8 w-px bg-border sm:block" />
                <LogoMarca className="h-12 w-16" />
                <span className="hidden h-8 w-px bg-border sm:block" />
              </div>
              <Lado titulo="Empresas e instituciones" items={organizaciones} color="mar" />
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">Nosotros hacemos el enlace: reunimos las vacantes y te llevamos directo a quien contrata.</p>
          </div>
  );
}

export function Hero({ puesto, provincia, onPuesto, onProvincia, onBuscar, filtros, onFiltros, total }: Props) {
  const t = useContenido();
  const titulo = t.hero_titulo === textosPorDefecto.hero_titulo ? "Tu enlace con el empleo en República Dominicana" : t.hero_titulo;
  return (
    <header className="border-b border-border bg-surface px-4 pb-10 pt-8 sm:px-6 md:pt-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight md:text-[3.4rem]">{titulo}</h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">{t.hero_subtitulo}</p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              {["Aplicar es gratis", "Siempre ves la fuente original", "Vacantes de todo el país"].map((x) => (
                <li key={x} className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" aria-hidden="true" /> {x}</li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block"><Diagrama /></div>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-background p-2 shadow-[var(--shadow-soft)]">
          <SearchBar puesto={puesto} provincia={provincia} onPuesto={onPuesto} onProvincia={onProvincia} onSubmit={onBuscar} ctaLabel="Buscar empleo" />
        </div>
        <FiltrosRapidos value={filtros} onChange={onFiltros} className="mt-4 justify-center" />
        <div className="mt-8 lg:hidden"><Diagrama /></div>
        {total > 0 && (<p className="mt-5 text-center text-sm text-muted-foreground"><span className="font-bold text-foreground">{total}</span> {total === 1 ? "vacante disponible" : "vacantes disponibles"} · aplicar es gratis</p>)}
      </div>
    </header>
  );
}

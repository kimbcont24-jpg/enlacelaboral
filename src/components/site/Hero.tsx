import { Link } from "@tanstack/react-router";

import { SearchBar } from "@/components/site/SearchBar";
import { textosPorDefecto, useContenido } from "@/lib/contenido";
import { CANAL_WHATSAPP } from "@/lib/vacantes";

const populares = ["Recepcionista", "Cajero", "Call center", "Asistente administrativo", "Ventas", "Chofer"];

type Props = { puesto: string; provincia: string; onPuesto: (v: string) => void; onProvincia: (v: string) => void; onBuscar: () => void; total: number; provincias: number };

export function Hero({ puesto, provincia, onPuesto, onProvincia, onBuscar, total, provincias }: Props) {
  const t = useContenido();
  // Textos de versiones anteriores guardados en el panel: se reemplazan por los nuevos.
  const viejo = (v: string) => v.startsWith("Encuentra tu próximo empleo") || v.startsWith("Conectamos talento con oportunidades reales") || v.startsWith("Tu enlace con el empleo");
  const titulo = viejo(t.hero_titulo) ? textosPorDefecto.hero_titulo : t.hero_titulo;
  const subtitulo = viejo(t.hero_subtitulo) || t.hero_subtitulo.startsWith("Reunimos vacantes") ? textosPorDefecto.hero_subtitulo : t.hero_subtitulo;

  return (
    <header className="bg-primary px-4 pb-12 pt-10 text-white sm:px-6 md:pb-16 md:pt-14">
      <div className="mx-auto max-w-6xl">
        <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight md:text-[3.25rem]">{titulo}</h1>
        <p className="mt-3 max-w-2xl text-lg text-white/85">{subtitulo}</p>

        <div className="mt-7 max-w-4xl [&_form]:border-transparent [&_form]:text-foreground">
          <SearchBar puesto={puesto} provincia={provincia} onPuesto={onPuesto} onProvincia={onProvincia} onSubmit={onBuscar} ctaLabel="Buscar" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-white/75">Búsquedas populares:</span>
          {populares.map((p) => (
            <Link key={p} to="/vacantes" search={{ q: p }} className="rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-white/20">{p}</Link>
          ))}
          <Link to="/vacantes" search={{ modalidad: "Remoto" }} className="rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-white/20">Desde casa</Link>
          <Link to="/vacantes" search={{ experiencia: "Sin experiencia" }} className="rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-white/20">Primer empleo</Link>
        </div>

        <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-6">
          {total > 0 && (
            <div><dt className="text-sm text-white/70">Vacantes activas</dt><dd className="text-2xl font-extrabold">{total}</dd></div>
          )}
          {provincias > 0 && (
            <div><dt className="text-sm text-white/70">Provincias con vacantes</dt><dd className="text-2xl font-extrabold">{provincias}</dd></div>
          )}
          <div><dt className="text-sm text-white/70">Costo para aplicar</dt><dd className="text-2xl font-extrabold">Gratis</dd></div>
          <div className="flex items-end"><a href={CANAL_WHATSAPP} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#1fa855] px-4 py-2 text-sm font-bold text-white hover:bg-[#178c46]">Únete al canal de WhatsApp</a></div>
        </dl>
      </div>
    </header>
  );
}

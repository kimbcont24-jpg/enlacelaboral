import { Link } from "@tanstack/react-router";

import { SearchBar } from "@/components/site/SearchBar";
import { textosPorDefecto, useContenido } from "@/lib/contenido";
import { CANAL_WHATSAPP } from "@/lib/vacantes";
import { BadgeCheck, Banknote, UserRoundCheck } from "lucide-react";

const populares = ["Recepcionista", "Cajero", "Call center", "Asistente administrativo", "Ventas", "Chofer"];

type Props = { puesto: string; provincia: string; onPuesto: (v: string) => void; onProvincia: (v: string) => void; onBuscar: () => void; total: number; provincias: number };

export function Hero({ puesto, provincia, onPuesto, onProvincia, onBuscar, total, provincias }: Props) {
  const t = useContenido();
  // Textos de versiones anteriores guardados en el panel: se reemplazan por los nuevos.
  const viejo = (v: string) => v.startsWith("Encuentra tu próximo empleo") || v.startsWith("Conectamos talento con oportunidades reales") || v.startsWith("Tu enlace con el empleo");
  const titulo = viejo(t.hero_titulo) ? textosPorDefecto.hero_titulo : t.hero_titulo;
  const subtitulo = viejo(t.hero_subtitulo) || t.hero_subtitulo.startsWith("Reunimos vacantes") ? textosPorDefecto.hero_subtitulo : t.hero_subtitulo;

  return (
    <header className="hero-dark px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-14">
      <div className="mx-auto max-w-6xl">
        <h1 className="entra max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight md:text-[3.4rem]">{titulo}</h1>
        <p className="entra mt-3 max-w-2xl text-lg text-white/85 [animation-delay:80ms]">{subtitulo}</p>

        <div className="entra mt-7 max-w-4xl [animation-delay:160ms] [&_form]:border-transparent [&_form]:text-foreground [&_form]:shadow-[0_20px_50px_-20px_rgba(0,0,0,.6)]">
          <SearchBar puesto={puesto} provincia={provincia} onPuesto={onPuesto} onProvincia={onProvincia} onSubmit={onBuscar} ctaLabel="Buscar" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-white/75">Búsquedas populares:</span>
          {populares.map((p) => (
            <Link key={p} to="/vacantes" search={{ q: p }} className="vidrio rounded-full px-3.5 py-1.5 text-sm font-medium text-white hover:bg-white/20">{p}</Link>
          ))}
          <Link to="/empleos/$slug" params={{ slug: "remoto" }} className="vidrio rounded-full px-3.5 py-1.5 text-sm font-medium text-white hover:bg-white/20">Desde casa</Link>
          <Link to="/vacantes" search={{ experiencia: "Sin experiencia" }} className="vidrio rounded-full px-3.5 py-1.5 text-sm font-medium text-white hover:bg-white/20">Primer empleo</Link>
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/15 pt-6">
          <ul className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-white/90">
            <li className="flex items-center gap-2"><Banknote className="size-4 text-[#8ec1ff]" aria-hidden="true" /> Salario visible cuando la empresa lo indica</li>
            <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-[#8ec1ff]" aria-hidden="true" /> Aplicar es gratis</li>
            <li className="flex items-center gap-2"><UserRoundCheck className="size-4 text-[#8ec1ff]" aria-hidden="true" /> Sin cuenta ni contraseña</li>
            {total > 0 && <li className="flex items-center gap-2 text-white/75">{total} {total === 1 ? "vacante activa" : "vacantes activas"}{provincias > 0 ? ` · ${provincias} ${provincias === 1 ? "provincia" : "provincias"}` : ""}</li>}
          </ul>
          <a href={CANAL_WHATSAPP} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#1fa855] px-4 py-2 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(31,168,85,.9)] hover:bg-[#178c46]">Únete al canal de WhatsApp</a>
        </div>
      </div>
    </header>
  );
}

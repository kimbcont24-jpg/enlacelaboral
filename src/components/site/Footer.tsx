import { Link } from "@tanstack/react-router";

import { Logo, LogoMarca } from "@/components/site/Logo";
import { landingsArea, landingsProvincia } from "@/lib/empleos";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";
import { PAGINAS_LEGALES } from "@/lib/legal";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#07213f] px-4 pb-28 pt-14 sm:pb-10 text-white sm:px-6">
      <LogoMarca invertido className="pointer-events-none absolute -bottom-16 -right-24 h-60 w-auto opacity-[0.05] sm:h-72" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 md:gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Logo invertido tamano="text-[26px]" />
          <p className="mt-4 max-w-xs text-sm text-white/70">Reunimos vacantes de empresas, portales e instituciones de República Dominicana. Aplicar siempre es gratis.</p>
          <div className="mt-4 max-w-xs"><CanalWhatsApp variante="boton" /></div>
          <p className="mt-4 max-w-xs rounded-xl bg-white/8 p-3 text-sm text-white/85"><strong>Cuídate:</strong> ninguna empresa seria te cobra por entrevistarte o contratarte. <Link to="/seguridad" className="font-semibold inline-block py-1.5 sm:py-0 text-[#ffd84d] underline">Cómo evitar estafas</Link></p>
        </div>
        <nav aria-label="Empleos por provincia">
          <p className="text-sm font-bold text-white">Empleos por provincia</p>
          <ul className="mt-2 space-y-0.5 text-sm text-white/65 md:mt-3 md:space-y-2">
            {landingsProvincia.slice(0, 7).map((l) => <li key={l.slug}><Link to="/empleos/$slug" params={{ slug: l.slug }} className="block py-1.5 hover:text-white md:inline md:py-0">{l.nombre.replace(/\s*\(.*?\)/, "")}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Empleos por área">
          <p className="text-sm font-bold text-white">Empleos por área</p>
          <ul className="mt-2 space-y-0.5 text-sm text-white/65 md:mt-3 md:space-y-2">
            {landingsArea.slice(0, 7).map((l) => <li key={l.slug}><Link to="/empleos/$slug" params={{ slug: l.slug }} className="block py-1.5 hover:text-white md:inline md:py-0">{l.nombre}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Enlace Laboral" className="col-span-2 md:col-span-1">
          <p className="text-sm font-bold text-white">Enlace Laboral</p>
          <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-0.5 text-sm text-white/65 md:mt-3 md:block md:space-y-2">
            <li><Link to="/vacantes" className="block py-1.5 hover:text-white md:inline md:py-0">Todas las vacantes</Link></li>
            <li><Link to="/vacantes" search={{ experiencia: "Sin experiencia" }} className="block py-1.5 hover:text-white md:inline md:py-0">Primer empleo</Link></li>
            <li><Link to="/vacantes" search={{ modalidad: "Remoto" }} className="block py-1.5 hover:text-white md:inline md:py-0">Trabajo desde casa</Link></li>
            <li><Link to="/guardadas" className="block py-1.5 hover:text-white md:inline md:py-0">Mi búsqueda</Link></li>
            <li><Link to="/empleo-para-todos" className="block py-1.5 hover:text-white md:inline md:py-0">Empleo para todas las personas</Link></li>
            <li><Link to="/jornadas" className="block py-1.5 hover:text-white md:inline md:py-0">Ferias de empleo</Link></li>
            <li><Link to="/alianzas" className="block py-1.5 hover:text-white md:inline md:py-0">Alianzas: universidades y fundaciones</Link></li>
            <li><Link to="/empresas" className="block py-1.5 hover:text-white md:inline md:py-0">Publicar una vacante</Link></li>
            <li><Link to="/recursos" className="block py-1.5 hover:text-white md:inline md:py-0">Consejos y guías</Link></li>
            <li><Link to="/salarios" className="block py-1.5 hover:text-white md:inline md:py-0">Radar salarial: cuánto pagan los puestos</Link></li>
            <li><Link to="/herramientas/regalia-pascual" className="block py-1.5 hover:text-white md:inline md:py-0">Calculadora de regalía pascual</Link></li>
            <li><Link to="/herramientas/salario-neto" className="block py-1.5 hover:text-white md:inline md:py-0">Calculadora de salario neto</Link></li>
            <li><Link to="/herramientas/liquidacion" className="block py-1.5 hover:text-white md:inline md:py-0">Calculadora de liquidación</Link></li>
            <li><Link to="/herramientas/comparar-ofertas" className="block py-1.5 hover:text-white md:inline md:py-0">Comparador de ofertas</Link></li>
            <li><Link to="/herramientas/brujula" className="block py-1.5 hover:text-white md:inline md:py-0">Brújula del primer empleo</Link></li>
            <li><Link to="/insignias" className="block py-1.5 hover:text-white md:inline md:py-0">Insignias de habilidades (Perfila)</Link></li>
            <li><Link to="/herramientas/verificar-oferta" className="block py-1.5 hover:text-white md:inline md:py-0">Verificador de estafas</Link></li>
          </ul>
        </nav>
      </div>
      <p className="relative mx-auto mt-10 flex max-w-7xl sm:pr-20 flex-wrap justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/50"><span>© 2026 Enlace Laboral. Hecho en República Dominicana. Fundado por <a href="https://kimberlycontreras.vercel.app/sobre-kimberly-contreras" target="_blank" rel="noopener" className="font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline">Kimberly Contreras</a>.</span><span className="flex flex-wrap gap-x-4 gap-y-1"><Link to="/legal" className="font-semibold inline-block py-1.5 sm:py-0 text-white/80 hover:text-white">Confianza y legal</Link>{PAGINAS_LEGALES.map((p) => <Link key={p.to} to={p.to} className="font-semibold inline-block py-1.5 sm:py-0 hover:text-white">{p.t}</Link>)}</span></p>
    </footer>
  );
}

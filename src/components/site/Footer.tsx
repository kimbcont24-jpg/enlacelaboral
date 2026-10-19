import { Link } from "@tanstack/react-router";

import { Logo, LogoMarca } from "@/components/site/Logo";
import { landingsArea, landingsProvincia } from "@/lib/empleos";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#07213f] px-4 pb-10 pt-14 text-white sm:px-6">
      <LogoMarca invertido className="pointer-events-none absolute -bottom-16 -right-24 h-60 w-auto opacity-[0.05] sm:h-72" />
      <div className="relative mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo invertido tamano="text-[26px]" />
          <p className="mt-4 max-w-xs text-sm text-white/70">Reunimos vacantes de empresas, portales e instituciones de República Dominicana. Aplicar siempre es gratis.</p>
          <div className="mt-4 max-w-xs"><CanalWhatsApp variante="boton" /></div>
          <p className="mt-4 max-w-xs rounded-xl bg-white/8 p-3 text-sm text-white/85"><strong>Cuídate:</strong> ninguna empresa seria te cobra por entrevistarte o contratarte.</p>
        </div>
        <nav aria-label="Empleos por provincia">
          <p className="text-sm font-bold text-white">Empleos por provincia</p>
          <ul className="mt-3 space-y-2 text-sm text-white/65">
            {landingsProvincia.slice(0, 7).map((l) => <li key={l.slug}><Link to="/empleos/$slug" params={{ slug: l.slug }} className="hover:text-white">{l.nombre.replace(/\s*\(.*?\)/, "")}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Empleos por área">
          <p className="text-sm font-bold text-white">Empleos por área</p>
          <ul className="mt-3 space-y-2 text-sm text-white/65">
            {landingsArea.slice(0, 7).map((l) => <li key={l.slug}><Link to="/empleos/$slug" params={{ slug: l.slug }} className="hover:text-white">{l.nombre}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Enlace Laboral">
          <p className="text-sm font-bold text-white">Enlace Laboral</p>
          <ul className="mt-3 space-y-2 text-sm text-white/65">
            <li><Link to="/vacantes" className="hover:text-white">Todas las vacantes</Link></li>
            <li><Link to="/vacantes" search={{ experiencia: "Sin experiencia" }} className="hover:text-white">Primer empleo</Link></li>
            <li><Link to="/vacantes" search={{ modalidad: "Remoto" }} className="hover:text-white">Trabajo desde casa</Link></li>
            <li><Link to="/guardadas" className="hover:text-white">Mis guardadas</Link></li>
            <li><Link to="/empresas" className="hover:text-white">Publicar una vacante</Link></li>
            <li><Link to="/recursos" className="hover:text-white">Consejos y guías</Link></li>
            <li><Link to="/herramientas/salario-neto" className="hover:text-white">Calculadora de salario neto</Link></li>
            <li><Link to="/herramientas/liquidacion" className="hover:text-white">Calculadora de liquidación</Link></li>
          </ul>
        </nav>
      </div>
      <p className="relative mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-xs text-white/50">© 2026 Enlace Laboral · Hecho en República Dominicana</p>
    </footer>
  );
}

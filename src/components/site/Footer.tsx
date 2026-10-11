import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/site/Logo";
import { landingsArea, landingsProvincia } from "@/lib/empleos";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface px-4 pb-10 pt-12 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">Reunimos vacantes de empresas, portales e instituciones de República Dominicana. Aplicar siempre es gratis.</p>
          <div className="mt-4 max-w-xs"><CanalWhatsApp variante="boton" /></div>
          <p className="mt-4 max-w-xs rounded-xl bg-secondary p-3 text-sm"><strong>Cuídate:</strong> ninguna empresa seria te cobra por entrevistarte o contratarte.</p>
        </div>
        <nav aria-label="Empleos por provincia">
          <p className="text-sm font-bold">Empleos por provincia</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {landingsProvincia.slice(0, 7).map((l) => <li key={l.slug}><Link to="/empleos/$slug" params={{ slug: l.slug }} className="hover:text-primary">{l.nombre.replace(/\s*\(.*?\)/, "")}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Empleos por área">
          <p className="text-sm font-bold">Empleos por área</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {landingsArea.slice(0, 7).map((l) => <li key={l.slug}><Link to="/empleos/$slug" params={{ slug: l.slug }} className="hover:text-primary">{l.nombre}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Enlace Laboral">
          <p className="text-sm font-bold">Enlace Laboral</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/vacantes" className="hover:text-primary">Todas las vacantes</Link></li>
            <li><Link to="/vacantes" search={{ experiencia: "Sin experiencia" }} className="hover:text-primary">Primer empleo</Link></li>
            <li><Link to="/vacantes" search={{ modalidad: "Remoto" }} className="hover:text-primary">Trabajo desde casa</Link></li>
            <li><Link to="/guardadas" className="hover:text-primary">Mis guardadas</Link></li>
            <li><Link to="/empresas" className="hover:text-primary">Publicar una vacante</Link></li>
            <li><Link to="/recursos" className="hover:text-primary">Consejos y guías</Link></li>
          </ul>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-7xl border-t border-border pt-6 text-xs text-muted-foreground">© 2026 Enlace Laboral · Hecho en República Dominicana</p>
    </footer>
  );
}

import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/site/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <Logo />
        <div className="flex gap-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Link to="/vacantes" className="hover:text-primary">Vacantes</Link>
          <Link to="/empresas" className="hover:text-primary">Empresas</Link>
          <Link to="/recursos" className="hover:text-primary">Recursos</Link>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 · Hecho con orgullo en República Dominicana</p>
      </div>
    </footer>
  );
}

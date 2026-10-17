import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/site/Logo";
import { useEsAdmin } from "@/components/site/AdminAcciones";
import { useGuardados } from "@/lib/guardados";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/vacantes", label: "Empleos" },
  { to: "/empresas", label: "Empresas" },
  { to: "/recursos", label: "Consejos" },
  { to: "/cv", label: "Mi CV" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const admin = useEsAdmin();
  const { ids } = useGuardados();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={cn("sticky top-0 z-50 flex items-center justify-between gap-3 border-b px-4 transition-all duration-500 sm:px-6", scrolled ? "border-border/80 bg-surface/85 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md" : "border-transparent bg-surface py-4")}>
      <Logo />
      <div className="hidden items-center gap-7 text-[15px] font-semibold md:flex">
        {nav.map((item) => (
          <Link key={item.to} to={item.to} className="transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}>{item.label}</Link>
        ))}
        <Link to="/guardadas" className="inline-flex items-center gap-1.5 transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}><Bookmark className="size-4" aria-hidden="true" /> Guardadas{ids.length > 0 && <span className="rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">{ids.length}</span>}</Link>
        {admin ? (
          <Link to="/admin" className="rounded-full bg-foreground px-5 py-2 text-background hover:bg-primary">Mi panel</Link>
        ) : (
          <Link to="/empresas" className="btn-aplicar rounded-full px-5 py-2.5">Publicar vacante</Link>
        )}
      </div>
      <div className="flex items-center gap-2 md:hidden">
      <Link to="/guardadas" aria-label="Vacantes guardadas" className="relative grid size-10 place-items-center rounded-full border border-border"><Bookmark className="size-4" />{ids.length > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{ids.length}</span>}</Link>
      {admin ? (
        <Link to="/admin" className="rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background md:hidden">Mi panel</Link>
      ) : (
        <Link to="/vacantes" className="whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground md:hidden">Empleos</Link>
      )}
      </div>
    </nav>
  );
}

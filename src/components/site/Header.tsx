import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/site/Logo";
import { useEsAdmin } from "@/components/site/AdminAcciones";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/vacantes", label: "Vacantes" },
  { to: "/empresas", label: "Para Empresas" },
  { to: "/recursos", label: "Recursos" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const admin = useEsAdmin();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={cn("sticky top-0 z-50 flex items-center justify-between gap-3 border-b px-4 transition-all duration-500 sm:px-6", scrolled ? "border-border bg-background/85 py-3 shadow-[var(--shadow-soft)] backdrop-blur-xl" : "border-transparent bg-background/40 py-5 backdrop-blur-md")}>
      <Logo />
      <div className="hidden items-center gap-8 text-sm font-medium md:flex">
        {nav.map((item) => (
          <Link key={item.to} to={item.to} className="transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}>{item.label}</Link>
        ))}
        {admin ? (
          <Link to="/admin" className="rounded-full bg-foreground px-5 py-2 text-background hover:bg-primary">Mi panel</Link>
        ) : (
          <Link to="/empresas" className="rounded-full bg-foreground px-5 py-2 text-background transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary">Publicar Vacante</Link>
        )}
      </div>
      {admin ? (
        <Link to="/admin" className="rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background md:hidden">Mi panel</Link>
      ) : (
        <Link to="/vacantes" className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground md:hidden">Ver vacantes</Link>
      )}
    </nav>
  );
}

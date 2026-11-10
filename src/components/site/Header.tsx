import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";

import { AvisoGlobal } from "@/components/site/AvisoGlobal";
import { Logo } from "@/components/site/Logo";
import { useEsAdmin } from "@/components/site/AdminAcciones";
import { useGuardados } from "@/lib/guardados";
import { ArrowRight, Bookmark, ChevronDown, Menu, Search, X } from "lucide-react";
import { useTotalVacantes } from "@/lib/vacantes";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const PRINCIPALES: string[] = ["/vacantes", "/alianzas", "/empresas", "/cv"];
const nav = [
  { to: "/vacantes", label: "Empleos" },
  { to: "/alianzas", label: "Alianzas" },
  { to: "/empleo-para-todos", label: "Empleo para todos" },
  { to: "/descubrir", label: "Descubrir" },
  { to: "/empresas", label: "Empresas" },
  { to: "/recursos", label: "Consejos" },
  { to: "/cv", label: "Mi CV" },
  { to: "/impulso", label: "Impulso" },
  { to: "/herramientas", label: "Herramientas" },
  { to: "/jornadas", label: "Ferias de empleo" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const admin = useEsAdmin();
  // Empresas con sesión abierta van directo a su panel.
  const [conSesion, setConSesion] = useState(false);
  useEffect(() => {
    // Solo las empresas ven "Mi panel"; un candidato con cuenta sigue viendo el sitio normal.
    const revisar = async (uid: string | undefined) => {
      if (!uid) return setConSesion(false);
      const { data: dueno } = await supabase.rpc("mi_dueno"); const count = dueno ? 1 : 0;
      setConSesion(!!count);
    };
    void supabase.auth.getSession().then(({ data }) => revisar(data.session?.user.id));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { void revisar(s?.user.id); });
    return () => data.subscription.unsubscribe();
  }, []);
  const { ids } = useGuardados();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [menu, setMenu] = useState(false);
  const total = useTotalVacantes();
  const { pathname } = useLocation();
  const enVacantes = pathname === "/vacantes" || pathname === "/vacantes/";
  // Celular: la franja de empleos se esconde al bajar y vuelve al subir (no estorba al leer).
  const [franja, setFranja] = useState(true);
  useEffect(() => {
    let ultimo = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 120 || y < ultimo - 6) setFranja(true);
      else if (y > ultimo + 6) setFranja(false);
      ultimo = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    const fuera = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest("nav")) setMenu(false); };
    document.addEventListener("keydown", tecla);
    document.addEventListener("pointerdown", fuera);
    return () => { document.removeEventListener("keydown", tecla); document.removeEventListener("pointerdown", fuera); };
  }, [menu]);
  const cuenta = admin ? { to: "/admin" as const, t: "Mi panel" } : conSesion ? { to: "/panel" as const, t: "Mi panel" } : null;

  return (
    <>
    <AvisoGlobal />
    <nav className={cn("sticky top-0 z-50 flex flex-wrap items-center justify-between gap-x-3 border-b px-4 transition-all duration-500 sm:px-6", scrolled || menu ? "border-border/80 bg-surface/90 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md" : "border-transparent bg-surface py-4")}>
      <Logo cabecera />
      <div className="hidden items-center gap-1 whitespace-nowrap text-[15px] font-semibold lg:flex">
        {nav.filter((item) => PRINCIPALES.includes(item.to)).map((item) => (
          item.to === "/vacantes" ? (
            // «Empleos» es la puerta principal del sitio: destaca sin competir con «Publicar vacante».
            <Link key={item.to} to={item.to} className="mr-1 inline-flex items-center gap-1.5 rounded-full bg-[#1d6ff2]/10 px-3.5 py-2 font-bold text-[#1557c4] ring-1 ring-[#1d6ff2]/30 transition-all hover:bg-[#1d6ff2]/15 hover:ring-[#1d6ff2]/50 xl:px-4" activeProps={{ className: "!bg-[#1d6ff2] !text-white !ring-[#1d6ff2]" }}>
              <Search className="size-4" aria-hidden="true" /> {item.label}
              {total !== null && total > 0 && <span className="ml-0.5 rounded-full bg-[#1d6ff2] px-2 py-0.5 text-[11px] font-bold tabular-nums leading-none text-white in-data-[status=active]:bg-white in-data-[status=active]:text-[#1557c4]">{total.toLocaleString("es-DO")}</span>}
            </Link>
          ) : (
          <Link key={item.to} to={item.to} className="rounded-full px-3 py-2 transition-colors hover:bg-secondary hover:text-primary xl:px-3.5" activeProps={{ className: "bg-secondary text-primary" }}>{item.label}</Link>
          )
        ))}
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full px-3 py-2 transition-colors hover:bg-secondary hover:text-primary [&::-webkit-details-marker]:hidden">Más <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
          <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-surface py-1.5 shadow-xl">
            {nav.filter((item) => !PRINCIPALES.includes(item.to)).map((item) => <Link key={item.to} to={item.to} onClick={(e) => (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open")} className="block px-4 py-2.5 hover:bg-secondary hover:text-primary" activeProps={{ className: "text-primary" }}>{item.label}</Link>)}
          </div>
        </details>
        <Link to="/guardadas" aria-label="Mi búsqueda: guardadas y aplicaciones" title="Mi búsqueda" className="relative ml-1 grid size-10 place-items-center rounded-full transition-colors hover:bg-secondary hover:text-primary" activeProps={{ className: "bg-secondary text-primary" }}><Bookmark className="size-[18px]" aria-hidden="true" />{ids.length > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{ids.length}</span>}</Link>
        {cuenta ? (
          <Link to={cuenta.to} className="ml-2 rounded-full bg-foreground px-5 py-2.5 text-background hover:bg-primary">{cuenta.t}</Link>
        ) : (
          <Link to="/empresas" className="btn-aplicar ml-2 rounded-full px-5 py-2.5">Publicar vacante</Link>
        )}
      </div>
      <div className="flex items-center gap-2 lg:hidden">
        <Link to="/guardadas" aria-label="Vacantes guardadas" className="relative grid size-10 place-items-center rounded-full border border-border"><Bookmark className="size-4" />{ids.length > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{ids.length}</span>}</Link>
        <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="menu-movil" aria-label={menu ? "Cerrar menú" : "Abrir menú"} className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
          {menu ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {!enVacantes && !menu && (
        <div className={cn("basis-full overflow-hidden transition-all duration-300 lg:hidden", franja ? "mt-2.5 max-h-14 opacity-100" : "mt-0 max-h-0 opacity-0")} aria-hidden={!franja}>
          <Link to="/vacantes" tabIndex={franja ? 0 : -1} className="flex h-11 items-center gap-2.5 rounded-xl border border-[#1d6ff2]/30 bg-[#1d6ff2]/[0.07] pl-3.5 pr-1.5 text-[15px] font-semibold text-[#1557c4] active:scale-[0.99]">
            <Search className="size-[18px] shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{total ? <>Ver <strong className="font-extrabold">{total.toLocaleString("es-DO")}</strong> empleos abiertos</> : "Buscar empleos"}</span>
            <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#1d6ff2] px-3 text-sm font-bold text-white">Ver <ArrowRight className="size-3.5" aria-hidden="true" /></span>
          </Link>
        </div>
      )}
      {menu && (
        <>
          <div id="menu-movil" className="menu-baja absolute inset-x-0 top-full z-50 border-b border-border bg-surface px-4 pb-5 pt-2 shadow-xl sm:px-6 lg:hidden">
            <Link to="/guardadas" onClick={() => setMenu(false)} className="mb-2 flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 font-bold text-primary"><Bookmark className="size-4" /> Mi búsqueda <span className="ml-auto text-xs font-semibold text-muted-foreground">guardadas y aplicaciones</span></Link>
            <ul className="grid grid-cols-2 gap-1.5">
              {nav.map((item) => (
                <li key={item.to}>{item.to === "/vacantes" ? (
                  <Link to={item.to} onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-xl bg-[#1d6ff2]/10 px-4 py-3 text-[15px] font-bold text-[#1557c4] ring-1 ring-[#1d6ff2]/30" activeProps={{ className: "!bg-[#1d6ff2] !text-white" }}><Search className="size-4" aria-hidden="true" /> {item.label}{total ? <span className="ml-auto text-xs font-bold tabular-nums opacity-80">{total.toLocaleString("es-DO")}</span> : null}</Link>
                ) : (
                  <Link to={item.to} onClick={() => setMenu(false)} className="block rounded-xl px-4 py-3 text-[15px] font-semibold hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary" }}>{item.label}</Link>
                )}</li>
              ))}
            </ul>
            <div className="mt-3 grid gap-2">
              {cuenta ? <Link to={cuenta.to} onClick={() => setMenu(false)} className="grid h-12 place-items-center rounded-xl bg-foreground font-bold text-background">{cuenta.t}</Link>
                : <Link to="/empresas" onClick={() => setMenu(false)} className="btn-aplicar grid h-12 place-items-center rounded-xl">Publicar vacante gratis</Link>}
            </div>
          </div>
        </>
      )}
    </nav>
    </>
  );
}

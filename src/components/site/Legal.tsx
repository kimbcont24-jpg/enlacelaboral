import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { PAGINAS_LEGALES, type RutaLegal } from "@/lib/legal";

export { PAGINAS_LEGALES };

export const LEGAL_ACTUALIZADO = "8 de noviembre de 2026";

type Punto = { I: LucideIcon; t: string; d: string };

export function PaginaLegal({ actual, etiqueta, titulo, intro, resumen, indice, children }: { actual: RutaLegal; etiqueta: string; titulo: string; intro: React.ReactNode; resumen?: Punto[]; indice: [string, string][]; children: React.ReactNode }) {
  const pagina = PAGINAS_LEGALES.find((p) => p.to === actual)!;
  const [activo, setActivo] = useState(indice[0]?.[0] ?? "");
  useEffect(() => {
    const vistos = new Map<string, number>();
    const obs = new IntersectionObserver((ents) => {
      for (const e of ents) vistos.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : Infinity);
      const primero = [...vistos.entries()].filter(([, y]) => y !== Infinity).sort((a, b) => a[1] - b[1])[0];
      if (primero) setActivo(primero[0]);
    }, { rootMargin: "-80px 0px -55% 0px" });
    indice.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [indice]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="hero-dark px-4 pb-24 pt-10 sm:px-6 md:pb-28 md:pt-14">
        <pagina.I className="pointer-events-none absolute -right-10 top-6 size-64 text-white opacity-[0.06] md:right-10 md:size-80" strokeWidth={1.2} aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <Link to="/legal" className="inline-block text-sm font-semibold text-white/70 hover:text-white">← Confianza y legal</Link>
          <br />
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90"><pagina.I className="size-4 text-[#ffd84d]" aria-hidden="true" /> {etiqueta}</p>
          <h1 className="mt-4 max-w-3xl text-balance font-display text-[2.1rem] font-extrabold leading-[1.08] tracking-tight md:text-[3rem]">{titulo}</h1>
          <div className="mt-4 max-w-2xl text-lg text-white/80">{intro}</div>
        </div>
      </header>

      <main className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {resumen && (
            <section aria-label="En 30 segundos" className="relative z-10 -mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resumen.map((p) => (
                <div key={p.t} className="rounded-2xl border border-border bg-surface p-5 shadow-[0_20px_40px_-28px_rgb(10_47_92/0.45)]">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#1d6ff2]/10 text-[#1557c4]"><p.I className="size-5" aria-hidden="true" /></span>
                  <p className="mt-3 font-extrabold leading-snug">{p.t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
                </div>
              ))}
            </section>
          )}

          <div className={`grid grid-cols-1 gap-10 lg:grid-cols-[15rem_1fr] ${resumen ? "mt-12" : "relative z-10 -mt-14"}`}>
            <nav aria-label="En esta página" className="h-fit min-w-0 rounded-2xl border border-border bg-surface p-4 lg:sticky lg:top-24">
              <p className="px-2 text-sm font-extrabold">En esta página</p>
              <ul className="mt-2 flex gap-1 overflow-x-auto pb-1 text-sm lg:block lg:space-y-0.5 lg:overflow-visible">
                {indice.map(([id, t]) => (
                  <li key={id} className="shrink-0">
                    <a href={`#${id}`} aria-current={activo === id ? "true" : undefined} className={`block whitespace-nowrap rounded-lg px-2 py-1.5 font-semibold transition-colors lg:whitespace-normal ${activo === id ? "bg-[#1d6ff2]/10 text-[#1557c4]" : "text-muted-foreground hover:text-foreground"}`}>{t}</a>
                  </li>
                ))}
              </ul>
            </nav>
            <article className="min-w-0 space-y-10 rounded-3xl border border-border bg-surface p-6 sm:p-9">{children}</article>
          </div>

          <section aria-label="Más sobre confianza" className="mt-14">
            <h2 className="font-display text-xl font-extrabold">Sigue leyendo</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PAGINAS_LEGALES.filter((p) => p.to !== actual).map((p) => (
                <li key={p.to}>
                  <Link to={p.to} className="group flex h-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-[#1d6ff2]">
                    <p.I className="mt-0.5 size-5 shrink-0 text-[#1557c4]" aria-hidden="true" />
                    <span className="min-w-0 flex-1"><span className="block font-bold">{p.t}</span><span className="block text-sm text-muted-foreground">{p.d}</span></span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function Bloque({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-display text-[1.35rem] font-extrabold tracking-tight">{titulo}</h2>
      <div className="mt-3 max-w-[68ch] space-y-3 text-[15.5px] leading-[1.7] text-foreground/85 [&_ul]:space-y-2">{children}</div>
    </section>
  );
}

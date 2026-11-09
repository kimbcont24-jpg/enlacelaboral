import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const LEGAL_ACTUALIZADO = "8 de noviembre de 2026";

/** Páginas legales: misma forma para privacidad, términos y cookies. Texto propio, en palabras sencillas. */
export function PaginaLegal({ I, etiqueta, titulo, intro, indice, children }: { I: LucideIcon; etiqueta: string; titulo: string; intro: React.ReactNode; indice: [string, string][]; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary"><I className="size-4" aria-hidden="true" /> {etiqueta}</p>
        <h1 className="mt-4 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">{titulo}</h1>
        <div className="mt-3 text-muted-foreground">{intro}</div>
        <nav aria-label="En esta página" className="mt-6 rounded-2xl border border-border bg-surface p-4 text-sm">
          <ul className="grid gap-1.5 sm:grid-cols-2">{indice.map(([id, t]) => <li key={id}><a href={`#${id}`} className="font-semibold text-primary hover:underline">{t}</a></li>)}</ul>
        </nav>
        <div className="mt-10 space-y-9">{children}</div>
        <p className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          También: <Link to="/terminos" className="font-semibold text-primary hover:underline">Términos y condiciones</Link> · <Link to="/privacidad" className="font-semibold text-primary hover:underline">Privacidad</Link> · <Link to="/cookies" className="font-semibold text-primary hover:underline">Cookies</Link> · <Link to="/contacto" className="font-semibold text-primary hover:underline">Contacto y ayuda</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}

export function Bloque({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-xl font-extrabold">{titulo}</h2>
      <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}

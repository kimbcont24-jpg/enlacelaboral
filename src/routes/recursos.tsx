import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { consejos } from "@/lib/data";

export const Route = createFileRoute("/recursos")({
  head: () => ({ meta: [{ title: "Consejos de empleo en RD | Enlace Laboral" }] }),
  component: Recursos,
});

const categorias = ["Todas", ...new Set(consejos.map((c) => c.categoria))];

function Recursos() {
  const [cat, setCat] = useState("Todas");
  const lista = cat === "Todas" ? consejos : consejos.filter((c) => c.categoria === cat);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="mx-auto max-w-7xl px-6 pb-10 pt-16">
        <h1 className="max-w-2xl text-balance text-4xl font-extrabold tracking-tight md:text-6xl">Consejos que sí <span className="text-primary">consiguen empleo.</span></h1>
      </header>
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <div className="flex flex-wrap gap-2 border-b border-border pb-6">
          {categorias.map((c) => (<button key={c} onClick={() => setCat(c)} className={cat === c ? "rounded-full bg-foreground px-4 py-1.5 text-xs font-bold uppercase text-background" : "rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-bold uppercase"}>{c}</button>))}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lista.map((c) => (
            <article key={c.titulo} className="rounded-2xl border border-border bg-surface p-6">
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{c.categoria} · {c.minutos} min</span>
              <h2 className="mt-2 text-lg font-bold">{c.titulo}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.resumen}</p>
            </article>
          ))}
        </div>
        <div className="mt-14 rounded-3xl bg-foreground p-8 text-background md:p-12">
          <h2 className="text-2xl font-extrabold">Cuídate de las estafas laborales</h2>
          <p className="mt-3 text-sm text-background/70">Nunca pagues por una entrevista o por un curso obligatorio. Pide siempre contrato escrito e inscripción en la TSS.</p>
        </div>
        <Link to="/vacantes" className="mt-10 inline-block rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground">Ver vacantes</Link>
      </div>
      <Footer />
    </div>
  );
}

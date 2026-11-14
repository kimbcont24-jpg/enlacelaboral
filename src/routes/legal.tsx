import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { PAGINAS_LEGALES } from "@/components/site/Legal";

export const Route = createFileRoute("/legal")({
  head: () => ({ meta: [{ title: "Confianza y legal | Enlace Laboral" }, { name: "description", content: "Términos, privacidad, cookies, pagos y reembolsos, empleo seguro y contacto de Enlace Laboral, en palabras sencillas." }], links: [{ rel: "canonical", href: "https://enlacelaboralrd.com/legal" }] }),
  component: Legal,
});

const PROMESAS = ["Buscar empleo es gratis", "Cero discriminación", "Empresas con RNC revisado", "No vendemos tus datos", "Sin publicidad ni rastreo"];

function Legal() {
  const [destacada, ...resto] = PAGINAS_LEGALES;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="hero-dark px-4 pb-28 pt-12 sm:px-6 md:pt-16">
        <ShieldCheck className="pointer-events-none absolute -right-8 top-8 size-72 text-white opacity-[0.06] md:right-16 md:size-96" strokeWidth={1.1} aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90"><ShieldCheck className="size-4 text-[#ffd84d]" aria-hidden="true" /> Confianza y legal</p>
          <h1 className="mt-4 max-w-3xl text-balance font-display text-[2.2rem] font-extrabold leading-[1.06] tracking-tight md:text-[3.2rem]">Reglas claras, escritas para que se entiendan</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">Todo lo que prometemos y lo que pedimos, sin letra pequeña.</p>
          <ul className="mt-7 flex flex-wrap gap-2">{PROMESAS.map((p) => <li key={p} className="rounded-full border border-white/20 px-3 py-1.5 text-sm font-semibold text-white/90">{p}</li>)}</ul>
        </div>
      </header>
      <main className="px-4 pb-16 sm:px-6">
        <div className="relative z-10 mx-auto -mt-16 grid max-w-6xl gap-4 md:grid-cols-3">
          <Link to={destacada!.to} className="group flex flex-col justify-between rounded-3xl bg-[#ffd84d] p-7 text-[#3d2f00] shadow-[0_24px_50px_-30px_rgb(10_47_92/0.6)] md:row-span-2">
            <destacada.I className="size-10" aria-hidden="true" />
            <div className="mt-10"><p className="font-display text-3xl font-extrabold leading-tight">{destacada!.t}</p><p className="mt-2 text-[15px]">{destacada!.d} Léelo antes de tu próxima entrevista.</p><span className="mt-5 inline-flex items-center gap-1 font-bold">Leer <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></span></div>
          </Link>
          {resto.map((p) => (
            <Link key={p.to} to={p.to} className="group flex flex-col rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_40px_-32px_rgb(10_47_92/0.5)] transition-colors hover:border-[#1d6ff2]">
              <div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-[#1d6ff2]/10 text-[#1557c4]"><p.I className="size-5" aria-hidden="true" /></span><ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></div>
              <p className="mt-5 text-lg font-extrabold">{p.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
            </Link>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-6xl text-sm text-muted-foreground">Nuestras reglas se basan en las leyes de la República Dominicana: Código de Trabajo, Ley 172-13 de protección de datos, Ley 358-05 del consumidor y Ley 126-02 de comercio electrónico. También tenemos un compromiso con la <Link to="/empleo-para-todos" className="font-semibold text-primary underline">inclusión y la accesibilidad</Link>.</p>
      </main>
      <Footer />
    </div>
  );
}

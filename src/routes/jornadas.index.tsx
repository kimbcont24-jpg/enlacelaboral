import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, CalendarDays, Loader2, MapPin, Users } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { cuandoJornada, faltan, useJornadas } from "@/lib/jornadas";

export const Route = createFileRoute("/jornadas/")({
  head: () => ({ meta: [{ title: "Jornadas de empleo en República Dominicana | Enlace Laboral" }, { name: "description", content: "Empresas que entrevistan en persona. Apúntate gratis, lleva tu CV y sal con una entrevista hecha." }] }),
  component: Jornadas,
});

function Jornadas() {
  const { data: lista, isLoading } = useJornadas();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="hero-dark px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-14">
        <div className="relative mx-auto max-w-6xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90"><CalendarDays className="size-4 text-[#ffd84d]" /> Jornadas de empleo</p>
          <h1 className="mt-4 max-w-2xl text-balance font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight md:text-[2.6rem]">Empresas que te entrevistan en persona, el mismo día</h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">Apúntate gratis, llega con tu CV y sal con una entrevista hecha. Te recordamos qué llevar.</p>
        </div>
      </header>
      <main className="px-4 py-10 sm:px-6"><div className="mx-auto max-w-6xl">
        {isLoading ? <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
          : !lista?.length ? (
            <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-border p-10 text-center">
              <p className="text-lg font-extrabold">No hay jornadas próximas por ahora</p>
              <p className="mt-1 text-muted-foreground">Las empresas las publican cada semana. Mientras tanto, aplica a las vacantes abiertas.</p>
              <Link to="/vacantes" className="btn-aplicar mt-5 inline-grid h-12 place-items-center rounded-xl px-6">Ver vacantes</Link>
            </div>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {lista.map((j) => {
                const lleno = j.cupo !== null && j.inscritos >= j.cupo;
                return (
                  <li key={j.id}>
                    <Link to="/jornadas/$id" params={{ id: j.id }} className="flex h-full flex-col rounded-3xl border border-border bg-surface p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[#ffd84d] px-2.5 py-1 text-xs font-extrabold text-[#3d2f00]">{faltan(j.fecha)}</span>
                        {lleno ? <span className="text-xs font-bold text-destructive">Cupo lleno</span> : j.inscritos > 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Users className="size-3.5" /> {j.inscritos} apuntados</span>}
                      </div>
                      <h2 className="mt-3 text-lg font-extrabold leading-snug">{j.titulo}</h2>
                      <p className="mt-1 flex items-center gap-2 text-sm"><EmpresaAvatar nombre={j.empresa} className="size-6 text-[11px]" /><span className="font-semibold">{j.empresa}</span>{j.verificada && <BadgeCheck className="size-4 text-success" aria-label="Verificada" />}</p>
                      <p className="mt-3 flex items-start gap-2 text-sm first-letter:uppercase"><CalendarDays className="mt-0.5 size-4 shrink-0 text-[#1557c4]" />{cuandoJornada(j)}</p>
                      <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" />{j.lugar}, {j.provincia}</p>
                      {j.puestos.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{j.puestos.slice(0, 5).map((x) => <span key={x} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">{x}</span>)}{j.puestos.length > 5 && <span className="px-1 text-xs text-muted-foreground">+{j.puestos.length - 5}</span>}</div>}
                      <span className="mt-auto pt-4 text-sm font-bold text-[#1557c4]">{lleno ? "Ver detalles" : "Apuntarme gratis"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        <p className="mt-10 text-center text-sm text-muted-foreground">¿Tu empresa hace una jornada de reclutamiento? <Link to="/empresas" className="font-bold text-primary underline-offset-4 hover:underline">Publícala gratis</Link> y recibe a los inscritos con su CV.</p>
      </div></main>
      <Footer />
    </div>
  );
}

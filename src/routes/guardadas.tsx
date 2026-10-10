import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Loader2 } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { JobCard } from "@/components/site/JobCard";
import { useGuardados } from "@/lib/guardados";
import { useVacantes } from "@/lib/vacantes";

export const Route = createFileRoute("/guardadas")({
  head: () => ({ meta: [{ title: "Vacantes guardadas | Enlace Laboral" }, { name: "robots", content: "noindex" }] }),
  component: Guardadas,
});

function Guardadas() {
  const { ids } = useGuardados();
  const { jobs, cargando } = useVacantes();
  const lista = ids.map((id) => jobs.find((j) => j.id === id)).filter((j): j is NonNullable<typeof j> => Boolean(j));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Tus vacantes guardadas</h1>
        <p className="mt-2 text-muted-foreground">Se guardan en este teléfono o computadora. No necesitas cuenta.</p>
        <div className="mt-8 space-y-4">
          {cargando && <div className="flex justify-center p-10"><Loader2 className="size-5 animate-spin text-primary" /></div>}
          {!cargando && lista.map((j) => <JobCard key={j.id} job={j} />)}
          {!cargando && lista.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <Bookmark className="mx-auto size-6 text-primary" aria-hidden="true" />
              <p className="mt-3 font-bold">Todavía no guardas ninguna vacante</p>
              <p className="mt-1 text-sm text-muted-foreground">Toca el ícono de guardar en cualquier vacante para verla aquí después.</p>
              <Link to="/vacantes" className="mt-5 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Ver vacantes</Link>
            </div>
          )}
          {!cargando && ids.length > lista.length && lista.length > 0 && (
            <p className="text-sm text-muted-foreground">Algunas vacantes que guardaste ya cerraron y no aparecen aquí.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

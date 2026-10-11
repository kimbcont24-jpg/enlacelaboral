import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/baja")({
  validateSearch: (s: Record<string, unknown>): { t?: string } => ({ t: typeof s["t"] === "string" ? (s["t"] as string) : undefined }),
  head: () => ({ meta: [{ title: "Dejar de recibir alertas | Enlace Laboral" }, { name: "robots", content: "noindex" }] }),
  component: Baja,
});

function Baja() {
  const { t } = Route.useSearch();
  const [estado, setEstado] = useState<"cargando" | "ok" | "no">("cargando");
  useEffect(() => {
    if (!t) return setEstado("no");
    void supabase.rpc("baja_alerta", { p_token: t }).then(({ data, error }) => setEstado(!error && data === "ok" ? "ok" : "no"));
  }, [t]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        {estado === "cargando" && <Loader2 className="mx-auto size-6 animate-spin text-primary" />}
        {estado === "ok" && (
          <>
            <h1 className="text-2xl font-extrabold">Listo, ya no recibirás esta alerta</h1>
            <p className="mt-3 text-muted-foreground">Si cambias de idea, puedes crear una nueva alerta cuando quieras.</p>
          </>
        )}
        {estado === "no" && (
          <>
            <h1 className="text-2xl font-extrabold">Esta alerta ya estaba desactivada</h1>
            <p className="mt-3 text-muted-foreground">No tienes que hacer nada más.</p>
          </>
        )}
        <Link to="/vacantes" className="mt-8 inline-block rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground">Ver empleos</Link>
      </main>
      <Footer />
    </div>
  );
}

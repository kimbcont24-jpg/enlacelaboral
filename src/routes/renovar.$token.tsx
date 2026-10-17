import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/renovar/$token")({
  head: () => ({ meta: [{ title: "Renovar vacante | Enlace Laboral" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Renovar,
});

function Renovar() {
  const { token } = Route.useParams();
  const [estado, setEstado] = useState<"esperando" | "enviando" | "renovada" | "cerrada" | "vencida" | "error">("esperando");
  const [titulo, setTitulo] = useState("");
  const enviar = async (cerrar: boolean) => {
    setEstado("enviando");
    const { data, error } = await supabase.rpc("renovar_vacante", { p_renov: token, p_cerrar: cerrar });
    if (error || !data) return setEstado("error");
    setTitulo(data.titulo ?? "");
    setEstado(data.accion);
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        {estado === "esperando" && (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">¿Esta vacante sigue abierta?</h1>
            <p className="mt-3 text-muted-foreground">Tu vacante está por salir de Enlace Laboral. Si todavía buscas a alguien, la dejamos 30 días más. Es gratis.</p>
            <div className="mt-8 grid gap-3">
              <button type="button" onClick={() => void enviar(false)} className="btn-aplicar rounded-xl px-6 py-3.5 text-base">Sí, sigue abierta: renovar 30 días</button>
              <button type="button" onClick={() => void enviar(true)} className="rounded-xl border border-border px-6 py-3.5 text-base font-semibold hover:border-primary hover:text-primary">Ya se cubrió: cerrarla</button>
            </div>
          </>
        )}
        {estado === "enviando" && <Loader2 className="mx-auto size-8 animate-spin text-primary" aria-label="Procesando" />}
        {estado === "renovada" && (<><CheckCircle2 className="mx-auto size-12 text-success" aria-hidden="true" /><h1 className="mt-4 text-2xl font-extrabold">¡Listo! Renovamos tu vacante por 30 días</h1>{titulo && <p className="mt-2 text-muted-foreground">{titulo}</p>}</>)}
        {estado === "cerrada" && (<><CheckCircle2 className="mx-auto size-12 text-success" aria-hidden="true" /><h1 className="mt-4 text-2xl font-extrabold">Vacante cerrada. ¡Gracias!</h1><p className="mt-2 text-muted-foreground">Esperamos que hayas encontrado a la persona ideal.</p></>)}
        {estado === "vencida" && (<><h1 className="text-2xl font-extrabold">Esta vacante ya venció o fue cerrada</h1><p className="mt-2 text-muted-foreground">Puedes publicar una nueva gratis desde la página de empresas.</p><Link to="/empresas" className="btn-aplicar mt-6 inline-block rounded-xl px-6 py-3">Publicar una vacante</Link></>)}
        {estado === "error" && (<><h1 className="text-2xl font-extrabold">Este enlace no es válido</h1><p className="mt-2 text-muted-foreground">Puede que ya se haya usado o esté incompleto.</p></>)}
      </main>
      <Footer />
    </div>
  );
}

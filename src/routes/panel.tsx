import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/panel")({
  head: () => ({ meta: [{ title: "Panel | Enlace Laboral" }, { name: "robots", content: "noindex" }] }),
  component: Panel,
});

function Panel() {
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<{ nombre: string; rnc: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) { await navigate({ to: "/auth" }); return; }
      const { data: perfil } = await supabase.from("empresas").select("nombre,rnc").eq("owner_id", userId).maybeSingle();
      setEmpresa(perfil);
      setCargando(false);
    })();
  }, [navigate]);

  const salir = async () => { await supabase.auth.signOut(); await navigate({ to: "/auth" }); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-14">
        {cargando ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border pb-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Panel</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{empresa?.nombre ?? "Tu cuenta"}</h1>
              <Link to="/empresas" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Publicar vacante</Link>
            </div>
            <Button type="button" variant="outline" onClick={() => void salir()}><LogOut /> Salir</Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

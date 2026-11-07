import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Briefcase, Globe, Loader2, MapPin } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { VacanteTarjeta } from "@/components/site/VacanteTarjeta";
import { supabase } from "@/integrations/supabase/client";
import { sitioSeguro, useEmpresaPublica } from "@/lib/empresa-publica";
import { rowToVacante, SELECT, type VacanteRow } from "@/lib/vacantes";

export const Route = createFileRoute("/empresa/$id")({
  head: () => ({ meta: [{ title: "Empresa | Enlace Laboral" }] }),
  component: PaginaEmpresa,
});

function PaginaEmpresa() {
  const { id } = Route.useParams();
  const valido = /^[0-9a-f-]{36}$/i.test(id);
  const { data: e, isLoading } = useEmpresaPublica({ empresa: valido ? id : undefined });
  const { data: vacantes = [] } = useQuery({
    queryKey: ["vacantes-empresa", id],
    enabled: !!e,
    queryFn: async () => {
      const { data } = await supabase.from("vacantes").select(SELECT).eq("empresa_id", id).eq("estado", "publicada").gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()).order("created_at", { ascending: false }).limit(60);
      return ((data ?? []) as unknown as VacanteRow[]).map(rowToVacante);
    },
  });
  const web = sitioSeguro(e?.sitio_web ?? null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      {isLoading ? (
        <div className="grid min-h-[50vh] place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : !e ? (
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-2xl font-extrabold">No encontramos esta empresa</h1>
          <p className="mt-2 text-muted-foreground">Puede que el enlace esté incompleto.</p>
          <Link to="/vacantes" className="btn-aplicar mt-6 inline-grid h-12 place-items-center rounded-xl px-6">Ver todas las vacantes</Link>
        </main>
      ) : (
        <>
          <title>{`${e.nombre}: empleos | Enlace Laboral`}</title>
          <header className="hero-dark px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-14">
            <div className="relative mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center">
              <EmpresaAvatar nombre={e.nombre} className="size-20 text-4xl" claro />
              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-3 font-display text-[1.9rem] font-extrabold leading-tight tracking-tight md:text-[2.4rem]">
                  {e.nombre}
                  {e.verificada && <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-sans text-sm font-bold text-success"><BadgeCheck className="size-4" /> Verificada</span>}
                </h1>
                <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-white/85">
                  {e.sector && <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" /> {e.sector}</span>}
                  {e.provincia && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {e.provincia}</span>}
                  {web && <a href={web} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"><Globe className="size-4" /> {new URL(web).hostname.replace(/^www\./, "")}</a>}
                </p>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <section>
                <h2 className="text-xl font-extrabold">{vacantes.length ? `${vacantes.length} ${vacantes.length === 1 ? "vacante abierta" : "vacantes abiertas"}` : "Sin vacantes abiertas ahora"}</h2>
                {vacantes.length === 0 ? <p className="mt-3 text-muted-foreground">Vuelve pronto o crea una alerta para enterarte cuando publique.</p> : (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">{vacantes.map((v) => <VacanteTarjeta key={v.id} job={v} />)}</div>
                )}
              </section>
              <aside className="h-fit space-y-4">
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <h2 className="font-extrabold">Sobre {e.nombre}</h2>
                  <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{e.descripcion?.trim() || "Esta empresa todavía no ha escrito su descripción."}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted-foreground">
                  {e.verificada ? "Verificamos que esta empresa existe con su RNC y un contacto real." : "Revisamos cada vacante de esta empresa antes de publicarla."} Aplicar es gratis: ninguna empresa seria te cobra por contratarte.
                </div>
              </aside>
            </div>
          </main>
        </>
      )}
      <Footer />
    </div>
  );
}

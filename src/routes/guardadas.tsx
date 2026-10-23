import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Check, Copy, Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { JobCard } from "@/components/site/JobCard";
import { leerCV } from "@/lib/cv";
import { useGuardados } from "@/lib/guardados";
import { mensajeSeguimiento } from "@/lib/mensajes";
import { ESTADOS, diasDesde, usePostulaciones, type Postulacion } from "@/lib/postulaciones";
import { enlaceAplicar, useVacantes } from "@/lib/vacantes";

export const Route = createFileRoute("/guardadas")({
  validateSearch: (s: Record<string, unknown>): { ver?: "postulaciones" } => (s.ver === "postulaciones" ? { ver: "postulaciones" } : {}),
  head: () => ({ meta: [{ title: "Mis vacantes | Enlace Laboral" }, { name: "robots", content: "noindex" }] }),
  component: Guardadas,
});

function Guardadas() {
  const { ver } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { ids } = useGuardados();
  const { lista: posts } = usePostulaciones();
  const { jobs, cargando } = useVacantes();
  const lista = ids.map((id) => jobs.find((j) => j.id === id)).filter((j): j is NonNullable<typeof j> => Boolean(j));
  const tab = ver === "postulaciones" ? "postulaciones" : "guardadas";
  const pestana = (clave: "guardadas" | "postulaciones", texto: string, n: number) => (
    <button type="button" role="tab" aria-selected={tab === clave} onClick={() => void navigate({ search: clave === "guardadas" ? {} : { ver: "postulaciones" }, replace: true })} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${tab === clave ? "bg-primary text-primary-foreground" : "bg-secondary text-primary hover:bg-secondary/70"}`}>
      {texto}{n > 0 && <span className="ml-1.5 opacity-80">{n}</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mis vacantes</h1>
        <p className="mt-2 text-muted-foreground">Se guardan en este teléfono o computadora. No necesitas cuenta.</p>
        <div role="tablist" className="mt-5 flex flex-wrap gap-2">
          {pestana("guardadas", "Guardadas", ids.length)}
          {pestana("postulaciones", "Mis postulaciones", posts.length)}
        </div>

        {tab === "postulaciones" ? (
          <Postulaciones posts={posts} />
        ) : (
          <div className="mt-8 space-y-4">
            {cargando && <div className="flex justify-center p-10"><Loader2 className="size-5 animate-spin text-primary" /></div>}
            {!cargando && lista.map((j) => <JobCard key={j.id} job={j} />)}
            {!cargando && lista.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <Bookmark className="mx-auto size-6 text-primary" aria-hidden="true" />
                <p className="mt-3 font-bold">Todavía no guardas ninguna vacante</p>
                <p className="mt-1 text-sm text-muted-foreground">Toca el ícono de guardar en cualquier vacante para verla aquí después.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Link to="/vacantes" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Ver vacantes</Link>
                  <Link to="/descubrir" className="rounded-xl border border-border px-5 py-3 text-sm font-bold text-primary">Descubrir deslizando</Link>
                </div>
              </div>
            )}
            {!cargando && ids.length > lista.length && lista.length > 0 && (
              <p className="text-sm text-muted-foreground">Algunas vacantes que guardaste ya cerraron y no aparecen aquí.</p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Postulaciones({ posts }: { posts: Postulacion[] }) {
  const { cambiar, quitar } = usePostulaciones();
  const [nombre, setNombre] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);
  useEffect(() => { setNombre(leerCV()?.nombre ?? ""); }, []);
  const conteo = (e: string) => posts.filter((p) => p.estado === e).length;

  if (posts.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
        <Send className="mx-auto size-6 text-primary" aria-hidden="true" />
        <p className="mt-3 font-bold">Aquí verás a dónde has aplicado</p>
        <p className="mt-1 text-sm text-muted-foreground">Cuando toques «Enviar por WhatsApp», «Enviar por correo» o «Aplicar», la anotamos aquí. Podrás marcar si te llamaron y escribir un mensaje de seguimiento con un toque.</p>
        <Link to="/vacantes" className="mt-5 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Ver vacantes</Link>
      </div>
    );
  }
  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-muted-foreground">{posts.length} {posts.length === 1 ? "postulación" : "postulaciones"} · {conteo("entrevista")} con llamada · {conteo("oferta")} con oferta</p>
      {posts.map((p) => {
        const d = diasDesde(p.fecha);
        const sinRespuesta = p.estado === "aplique" && d >= 5;
        const e = enlaceAplicar(p.aplicar);
        const msg = mensajeSeguimiento(p, nombre);
        const wa = e?.href.startsWith("https://wa.me/") ? `${e.href}?text=${encodeURIComponent(msg)}` : e?.href.startsWith("mailto:") ? `${e.href}?subject=${encodeURIComponent(`Seguimiento: ${p.titulo}`)}&body=${encodeURIComponent(msg)}` : null;
        return (
          <article key={p.id} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to="/vacantes/$id" params={{ id: p.id }} className="text-lg font-extrabold leading-snug hover:text-primary">{p.titulo}</Link>
                <p className="mt-0.5 text-sm text-muted-foreground">{p.empresa} · {p.via} · {d === 0 ? "hoy" : `hace ${d} ${d === 1 ? "día" : "días"}`}</p>
              </div>
              <button type="button" onClick={() => quitar(p.id)} aria-label={`Quitar ${p.titulo}`} className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
            </div>
            <div role="group" aria-label="Estado" className="mt-3 flex flex-wrap gap-2">
              {ESTADOS.map((s) => (
                <button key={s.v} type="button" aria-pressed={p.estado === s.v} onClick={() => cambiar(p.id, s.v)} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${p.estado === s.v ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                  {p.estado === s.v && <Check className="size-3.5" aria-hidden="true" />}{s.t}
                </button>
              ))}
            </div>
            {sinRespuesta && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-cta/10 px-3 py-2.5 text-sm">
                <span className="font-semibold text-[#8a5200]">Van {d} días sin respuesta. Un mensaje corto suele ayudar.</span>
                {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"><MessageCircle className="size-3.5" /> Escribir seguimiento</a>}
                <button type="button" onClick={() => { void navigator.clipboard?.writeText(msg).then(() => { setCopiado(p.id); setTimeout(() => setCopiado(null), 2000); }).catch(() => undefined); }} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-primary"><Copy className="size-3.5" /> {copiado === p.id ? "¡Copiado!" : "Copiar mensaje"}</button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

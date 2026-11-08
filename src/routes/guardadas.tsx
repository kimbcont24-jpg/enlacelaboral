import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, CalendarClock, CalendarPlus, Copy, FileText, Loader2, MessageCircle, Sparkles, StickyNote, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { VacanteTarjeta } from "@/components/site/VacanteTarjeta";
import { GuardarNube } from "@/components/site/GuardarNube";
import { diasRestantes } from "@/lib/claridad";
import { EVENTO_CV_REMOTO, leerCV, progresoCV, type CV } from "@/lib/cv";
import { useNube } from "@/lib/nube";
import { useGuardados } from "@/lib/guardados";
import { mensajeSeguimiento } from "@/lib/mensajes";
import { ESTADOS, diasDesde, usePostulaciones, type EstadoPost, type Postulacion } from "@/lib/postulaciones";
import { recomendar } from "@/lib/recomendar";
import { enlaceAplicar, useVacantes } from "@/lib/vacantes";

type Ver = "parati" | "postulaciones" | "guardadas";

export const Route = createFileRoute("/guardadas")({
  validateSearch: (s: Record<string, unknown>): { ver?: Ver } => (s.ver === "postulaciones" || s.ver === "guardadas" || s.ver === "parati" ? { ver: s.ver } : {}),
  head: () => ({ meta: [{ title: "Mi búsqueda de empleo | Enlace Laboral" }, { name: "robots", content: "noindex" }] }),
  component: MiBusqueda,
});

function MiBusqueda() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { ids } = useGuardados();
  const { lista: posts } = usePostulaciones();
  const { jobs, cargando } = useVacantes();
  const [cv, setCv] = useState<CV | null>(null);
  useEffect(() => {
    setCv(leerCV());
    const r = () => setCv(leerCV());
    window.addEventListener(EVENTO_CV_REMOTO, r);
    return () => window.removeEventListener(EVENTO_CV_REMOTO, r);
  }, []);
  const nube = useNube();

  const guardadas = ids.map((id) => jobs.find((j) => j.id === id)).filter((j): j is NonNullable<typeof j> => Boolean(j)).sort((a, b) => diasRestantes(a) - diasRestantes(b));
  const recomendadas = useMemo(() => recomendar(cv, jobs, new Set([...posts.map((p) => p.id)]), 8), [cv, jobs, posts]);
  const progreso = progresoCV(cv);
  const tab: Ver = search.ver ?? (posts.length ? "postulaciones" : ids.length ? "guardadas" : "parati");
  const ir = (v: Ver) => void navigate({ search: { ver: v }, replace: true });
  const cuenta = (e: EstadoPost) => posts.filter((p) => p.estado === e).length;
  const proximas = posts.filter((p) => p.estado === "entrevista" && p.entrevista && new Date(p.entrevista).getTime() > Date.now() - 3600e3).sort((a, b) => a.entrevista!.localeCompare(b.entrevista!));

  const stats: { n: number; t: string; v: Ver }[] = [
    { n: posts.length, t: "Aplicaciones", v: "postulaciones" },
    { n: cuenta("entrevista"), t: "Entrevistas", v: "postulaciones" },
    { n: cuenta("oferta"), t: "Ofertas", v: "postulaciones" },
    { n: ids.length, t: "Guardadas", v: "guardadas" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="hero-dark px-4 pb-8 pt-10 sm:px-6 md:pt-12">
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-white/70">{nube.correo ? "Guardado en tu cuenta. Igual en todos tus teléfonos." : "Se guarda en este teléfono o computadora. Sin cuenta."}</p>
          <h1 className="mt-1 font-display text-[1.8rem] font-extrabold tracking-tight md:text-[2.2rem]">{cv?.nombre.trim() ? `Hola, ${cv.nombre.trim().split(/\s+/)[0]}` : "Mi búsqueda de empleo"}</h1>
          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="grid grid-cols-2 overflow-hidden rounded-2xl bg-white/[0.07] ring-1 ring-white/10 sm:grid-cols-4">
              {stats.map((s, i) => (
                <button key={s.t} type="button" onClick={() => ir(s.v)} className={`p-4 text-left transition-colors hover:bg-white/5 sm:p-5 ${i % 2 === 0 ? "border-r border-white/10" : ""} ${i < 2 ? "border-b border-white/10 sm:border-b-0" : ""} ${i === 1 ? "sm:border-r" : ""}`}>
                  <span className="block font-display text-3xl font-extrabold tabular-nums">{s.n}</span>
                  <span className="text-sm text-white/70">{s.t}</span>
                </button>
              ))}
            </div>
            <Link to="/cv" className="group flex items-center gap-4 rounded-2xl bg-white p-4 text-foreground sm:p-5">
              <Anillo pct={progreso.pct} />
              <span className="min-w-0">
                <span className="block font-extrabold">{progreso.pct === 100 ? "Tu CV está completo" : progreso.pct ? "Completa tu CV" : "Crea tu CV gratis"}</span>
                <span className="block text-sm text-muted-foreground">{progreso.faltan[0] ? `Falta: ${progreso.faltan[0].t.toLowerCase()}` : "Listo para enviar al aplicar"}</span>
                <span className="mt-1 block text-sm font-bold text-[#1557c4] group-hover:underline">{progreso.pct ? "Abrir mi CV" : "Empezar"}</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 pb-20 pt-6 sm:px-6"><div className="mx-auto max-w-6xl">
        <GuardarNube compacto className="mb-6" />
        {proximas.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#c27803]/30 bg-[#c27803]/[0.07] p-4">
            <CalendarClock className="size-5 text-[#8a5200]" />
            <p className="min-w-0 flex-1 text-sm"><b>Próxima entrevista:</b> {proximas[0]!.titulo} en {proximas[0]!.empresa}, {new Date(proximas[0]!.entrevista!).toLocaleString("es-DO", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}</p>
            <Link to="/cv" search={{ h: "entrevista" }} className="text-sm font-bold text-[#8a5200] underline-offset-4 hover:underline">Practicar la entrevista</Link>
          </div>
        )}

        <div role="tablist" className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
          {([["parati", "Para ti", recomendadas.length], ["postulaciones", "Mis aplicaciones", posts.length], ["guardadas", "Guardadas", ids.length]] as const).map(([v, t, n]) => (
            <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => ir(v)} className={`-mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-3 text-sm font-bold sm:gap-2 sm:px-4 ${tab === v ? "border-[#1d6ff2] text-[#1557c4]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {v === "parati" && <Sparkles className="size-4" />}{t}{n > 0 && <span className={`rounded-full px-1.5 text-xs ${tab === v ? "bg-[#1d6ff2] text-white" : "bg-muted"}`}>{n}</span>}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {cargando && tab !== "postulaciones" ? <div className="flex justify-center p-10"><Loader2 className="size-5 animate-spin text-primary" /></div>
            : tab === "parati" ? <ParaTi cv={cv} recomendadas={recomendadas} />
            : tab === "postulaciones" ? <Aplicaciones posts={posts} nombre={cv?.nombre ?? ""} />
            : <Guardadas lista={guardadas} perdidas={ids.length - guardadas.length} />}
        </div>
      </div></main>
      <Footer />
    </div>
  );
}

function Anillo({ pct }: { pct: number }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <span className="relative grid size-14 shrink-0 place-items-center">
      <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90" aria-hidden="true"><circle cx="26" cy="26" r={r} fill="none" stroke="#e8eef6" strokeWidth="5" /><circle cx="26" cy="26" r={r} fill="none" stroke={pct === 100 ? "#0f7a43" : "#1d6ff2"} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} /></svg>
      <span className="text-xs font-extrabold tabular-nums">{pct}%</span>
    </span>
  );
}

function ParaTi({ cv, recomendadas }: { cv: CV | null; recomendadas: ReturnType<typeof recomendar> }) {
  if (!cv || (!cv.puesto.trim() && !cv.habilidades.trim())) {
    return (
      <div className="grid items-center gap-6 rounded-3xl border border-border bg-surface p-6 sm:p-8 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="font-display text-xl font-extrabold">Te mostramos vacantes hechas para ti</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">Escribe en tu CV el puesto que buscas y tus habilidades. Con eso buscamos entre todas las vacantes las que más se parecen a lo que sabes hacer y te las ponemos aquí.</p>
        </div>
        <Link to="/cv" className="btn-aplicar inline-flex h-12 items-center gap-2 rounded-xl px-6"><FileText className="size-4" /> Llenar mi CV</Link>
      </div>
    );
  }
  if (!recomendadas.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-8 text-center">
        <p className="font-bold">Hoy no encontramos vacantes que se parezcan a tu CV</p>
        <p className="mt-1 text-sm text-muted-foreground">Prueba agregando más habilidades o puestos anteriores en tu CV. Mientras tanto, mira todas las vacantes.</p>
        <div className="mt-5 flex justify-center gap-2"><Link to="/cv" className="rounded-xl border border-border px-5 py-3 text-sm font-bold">Editar CV</Link><Link to="/vacantes" className="btn-aplicar rounded-xl px-5 py-3 text-sm">Ver vacantes</Link></div>
      </div>
    );
  }
  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">Según lo que pusiste en tu CV{cv.puesto.trim() ? ` (${cv.puesto.trim()})` : ""}. Las más parecidas primero.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recomendadas.map(({ job, porque }) => (
          <div key={job.id} className="flex min-w-0 flex-col">
            <p className="mb-1.5 flex flex-wrap gap-1 px-1 text-xs text-muted-foreground"><span className="font-semibold">Coincide con:</span>{porque.map((x) => <span key={x} className="rounded-md bg-[#1d6ff2]/10 px-1.5 font-semibold text-[#1557c4]">{x}</span>)}</p>
            <div className="flex-1 [&>article]:h-full"><VacanteTarjeta job={job} /></div>
          </div>
        ))}
      </div>
    </>
  );
}

function Guardadas({ lista, perdidas }: { lista: ReturnType<typeof useVacantes>["jobs"]; perdidas: number }) {
  if (!lista.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center">
        <Bookmark className="mx-auto size-6 text-primary" aria-hidden="true" />
        <p className="mt-3 font-bold">Todavía no guardas ninguna vacante</p>
        <p className="mt-1 text-sm text-muted-foreground">Toca el ícono de guardar en cualquier vacante para tenerla aquí y no perderla.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2"><Link to="/vacantes" className="btn-aplicar rounded-xl px-5 py-3 text-sm">Ver vacantes</Link><Link to="/descubrir" className="rounded-xl border border-border px-5 py-3 text-sm font-bold text-primary">Descubrir deslizando</Link></div>
      </div>
    );
  }
  const pronto = lista.filter((j) => diasRestantes(j) <= 5).length;
  return (
    <>
      {pronto > 0 && <p className="mb-4 rounded-xl bg-destructive/[0.07] px-4 py-3 text-sm font-semibold text-destructive">{pronto === 1 ? "1 vacante guardada deja de verse" : `${pronto} vacantes guardadas dejan de verse`} en 5 días o menos. Aplica antes de que cierren.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{lista.map((j) => <VacanteTarjeta key={j.id} job={j} />)}</div>
      {perdidas > 0 && <p className="mt-4 text-sm text-muted-foreground">{perdidas === 1 ? "Una vacante que guardaste ya cerró" : `${perdidas} vacantes que guardaste ya cerraron`} y no aparece aquí.</p>}
    </>
  );
}

function Aplicaciones({ posts, nombre }: { posts: Postulacion[]; nombre: string }) {
  const [filtro, setFiltro] = useState<EstadoPost | "">("");
  if (!posts.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center">
        <p className="font-bold">Aquí verás a dónde has aplicado</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Cada vez que apliques desde Enlace Laboral la anotamos aquí. Podrás marcar si te llamaron, anotar la fecha de la entrevista y escribir un mensaje de seguimiento con un toque.</p>
        <Link to="/vacantes" className="btn-aplicar mt-5 inline-block rounded-xl px-5 py-3 text-sm">Ver vacantes</Link>
      </div>
    );
  }
  const orden: EstadoPost[] = ["entrevista", "oferta", "aplique", "descartada"];
  const lista = [...posts].filter((p) => !filtro || p.estado === filtro).sort((a, b) => orden.indexOf(a.estado) - orden.indexOf(b.estado) || b.fecha.localeCompare(a.fecha));
  return (
    <>
      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {[{ v: "" as const, t: "Todas", color: "#0a2f5c" }, ...ESTADOS].map((e) => {
          const n = e.v ? posts.filter((p) => p.estado === e.v).length : posts.length;
          return <button key={e.v || "todas"} type="button" aria-pressed={filtro === e.v} onClick={() => setFiltro(e.v)} className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold ${filtro === e.v ? "border-[#0a2f5c] bg-[#0a2f5c] text-white" : "border-border bg-surface"}`}>{e.v && <span className="size-2 rounded-full" style={{ backgroundColor: e.color }} />}{e.t}<span className={`rounded-full px-1.5 text-xs ${filtro === e.v ? "bg-white/20" : "bg-muted"}`}>{n}</span></button>;
        })}
      </div>
      <ul className="space-y-3">{lista.map((p) => <Aplicacion key={p.id} p={p} nombre={nombre} />)}</ul>
    </>
  );
}

const local = (iso?: string) => { if (!iso) return ""; const d = new Date(iso); const z = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`; };
const gcal = (p: Postulacion) => { const i = new Date(p.entrevista!), f = new Date(i.getTime() + 3600e3); const x = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: `Entrevista: ${p.titulo} (${p.empresa})`, dates: `${x(i)}/${x(f)}`, details: `${p.nota ?? ""}\nVacante en Enlace Laboral`.trim() }).toString()}`; };

function Aplicacion({ p, nombre }: { p: Postulacion; nombre: string }) {
  const { cambiar, editar, quitar } = usePostulaciones();
  const [nota, setNota] = useState(p.nota ?? "");
  const [abrirNota, setAbrirNota] = useState(!!p.nota);
  const d = diasDesde(p.fecha);
  const estado = ESTADOS.find((e) => e.v === p.estado)!;
  const e = enlaceAplicar(p.aplicar);
  const msg = mensajeSeguimiento(p, nombre);
  const seguir = e?.href.startsWith("https://wa.me/") ? `${e.href}?text=${encodeURIComponent(msg)}` : e?.href.startsWith("mailto:") ? `${e.href}?subject=${encodeURIComponent(`Seguimiento: ${p.titulo}`)}&body=${encodeURIComponent(msg)}` : null;
  const sinRespuesta = p.estado === "aplique" && d >= 5;

  return (
    <li className="rounded-2xl border border-border bg-surface p-4 sm:p-5" style={{ boxShadow: `inset 4px 0 0 ${estado.color}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/vacantes/$id" params={{ id: p.id }} className="text-lg font-extrabold leading-snug hover:text-primary">{p.titulo}</Link>
          <p className="mt-0.5 text-sm text-muted-foreground">{p.empresa} · aplicaste {d === 0 ? "hoy" : `hace ${d} ${d === 1 ? "día" : "días"}`} · {p.via}</p>
        </div>
        <button type="button" onClick={() => { if (confirm("¿Quitar esta aplicación de tu lista?")) quitar(p.id); }} aria-label={`Quitar ${p.titulo}`} className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="size-4" /></button>
      </div>

      <div><div role="group" aria-label="Cómo va" className="mt-3 inline-flex flex-wrap gap-1 rounded-xl bg-background p-1">
        {ESTADOS.map((s) => (
          <button key={s.v} type="button" aria-pressed={p.estado === s.v} onClick={() => cambiar(p.id, s.v)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${p.estado === s.v ? "bg-surface shadow-sm" : "text-muted-foreground hover:text-foreground"}`} style={p.estado === s.v ? { color: s.color } : undefined}>{s.t}</button>
        ))}
      </div></div>

      {p.estado === "entrevista" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-[#c27803]/[0.07] p-3 text-sm">
          <label className="flex items-center gap-2 font-semibold text-[#8a5200]"><CalendarClock className="size-4" /> Fecha:
            <input type="datetime-local" value={local(p.entrevista)} onChange={(ev) => editar(p.id, { entrevista: ev.target.value ? new Date(ev.target.value).toISOString() : undefined })} className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-foreground" />
          </label>
          {p.entrevista && <a href={gcal(p)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1.5 text-xs font-bold hover:underline"><CalendarPlus className="size-3.5" /> Guardar en mi calendario</a>}
          <Link to="/cv" search={{ h: "entrevista" }} className="ml-auto text-xs font-bold text-[#8a5200] hover:underline">Practicar la entrevista</Link>
        </div>
      )}
      {p.estado === "oferta" && <p className="mt-3 rounded-xl bg-success/[0.08] p-3 text-sm text-success"><b>¡Felicidades!</b> Antes de aceptar, confirma el salario, el horario y que te inscriban en la TSS. <Link to="/herramientas/salario-neto" className="font-bold underline">Calcula cuánto te llega</Link>.</p>}

      {sinRespuesta && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-[#1d6ff2]/[0.07] px-3 py-2.5 text-sm">
          <span className="font-semibold text-[#1557c4]">Van {d} días sin respuesta. Un mensaje corto suele ayudar.</span>
          {seguir && <a href={seguir} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-[#1d6ff2] px-3 py-1.5 text-xs font-bold text-white"><MessageCircle className="size-3.5" /> Escribir seguimiento</a>}
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(msg).then(() => toast.success("Mensaje copiado")).catch(() => undefined); }} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-primary"><Copy className="size-3.5" /> Copiar mensaje</button>
        </div>
      )}

      {abrirNota ? (
        <textarea value={nota} onChange={(ev) => setNota(ev.target.value)} onBlur={() => editar(p.id, { nota: nota.trim() || undefined })} rows={2} maxLength={1000} placeholder="Con quién hablaste, qué te dijeron, qué llevar…" className="mt-3 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm" autoFocus={!p.nota} />
      ) : (
        <button type="button" onClick={() => setAbrirNota(true)} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"><StickyNote className="size-3.5" /> Agregar nota</button>
      )}
    </li>
  );
}

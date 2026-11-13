import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, CheckCircle2, Clock, Loader2, MessageCircle, RotateCcw, ShieldCheck, Smartphone, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MarcaPerfila, Medalla } from "@/components/insignias/Sello";
import { leerCV } from "@/lib/cv";
import {
  NIVEL_TXT, PERFILA, agregarPendiente, guardarInsignia, infoPrueba, leerPendientes, ordenarPorPuesto,
  quitarPendiente, useInsignias, verificarUrl, type InfoPrueba, type Insignia, type Nivel, type PruebaInsignia,
} from "@/lib/insignias";
import { consultarInsignias, insigniasActivas, pedirInsignia } from "@/lib/insignias.functions";
import { SITIO } from "@/lib/vacantes";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/insignias/")({
  validateSearch: (s: Record<string, unknown>): { insignia?: string } =>
    typeof s["insignia"] === "string" && UUID.test(s["insignia"]) ? { insignia: s["insignia"] } : {},
  head: () => ({
    meta: [
      { title: "Insignias de habilidades verificadas por Perfila | Enlace Laboral" },
      { name: "description", content: "Demuestra lo que sabes hacer con una prueba corta y gratis: servicio al cliente, Excel y Word, ortografía o caja. Si logras el nivel, tu insignia verificada sale en tu CV." },
      { property: "og:title", content: "Demuestra lo que sabes hacer · Insignias verificadas por Perfila" },
      { property: "og:description", content: "Pruebas cortas y gratis desde el celular. Tu insignia sale en tu CV y la empresa la puede verificar." },
    ],
    links: [
      { rel: "canonical", href: `${SITIO}/insignias` },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&display=swap" },
    ],
  }),
  component: PaginaInsignias,
});

const FUENTE = { fontFamily: "Manrope, Figtree, ui-sans-serif, system-ui, sans-serif" };

type Resultado = { tipo: "ganada"; insignia: Insignia } | { tipo: "sin_nivel"; prueba: PruebaInsignia } | null;

function PaginaInsignias() {
  const { insignia: refRegreso } = Route.useSearch();
  const { ganadas, pendientes, listo } = useInsignias();
  const [activas, setActivas] = useState<boolean | null>(null);
  const [elegida, setElegida] = useState<InfoPrueba | null>(null);
  const [resultado, setResultado] = useState<Resultado>(null);
  const [revisando, setRevisando] = useState(false);
  const [puesto, setPuesto] = useState("");
  const revisado = useRef(false);

  useEffect(() => {
    setPuesto(leerCV()?.puesto ?? "");
    insigniasActivas().then((r) => setActivas(r.activas)).catch(() => setActivas(false));
  }, []);

  // Al volver de Perfila (o al abrir la página con pruebas pendientes), se consulta el resultado.
  async function revisar(mostrar: boolean) {
    const refs = [...new Set([...(refRegreso ? [refRegreso] : []), ...leerPendientes().map((p) => p.ref)])].slice(0, 20);
    if (!refs.length) return;
    setRevisando(true);
    try {
      const estados = await consultarInsignias({ data: { refs } });
      let mostrado: Resultado = null;
      for (const e of estados) {
        if (e.estado === "terminada") {
          quitarPendiente(e.ref);
          if (e.nivel) {
            const ins: Insignia = { ref: e.ref, prueba: e.prueba, nivel: e.nivel, fecha: e.fecha ?? new Date().toISOString() };
            guardarInsignia(ins);
            if (!mostrado || e.ref === refRegreso) mostrado = { tipo: "ganada", insignia: ins };
          } else if (!mostrado || e.ref === refRegreso) {
            mostrado = { tipo: "sin_nivel", prueba: e.prueba };
          }
        } else if (e.estado === "vencida" || e.estado === "cancelada") {
          quitarPendiente(e.ref);
        }
      }
      if (mostrado) setResultado(mostrado);
      else if (mostrar) toast("Todavía no vemos la prueba terminada. Si ya la hiciste, espera un minuto y vuelve a revisar.");
    } catch (err) {
      if (mostrar) toast.error(err instanceof Error ? err.message : "No se pudo revisar ahora.");
    } finally {
      setRevisando(false);
    }
  }

  useEffect(() => {
    if (!listo || revisado.current) return;
    revisado.current = true;
    void revisar(false);
    if (refRegreso) window.history.replaceState(null, "", "/insignias");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo]);

  const orden = useMemo(() => ordenarPorPuesto(puesto), [puesto]);
  const ganada = (id: PruebaInsignia) => ganadas.find((g) => g.prueba === id);
  const pendiente = (id: PruebaInsignia) => pendientes.find((p) => p.prueba === id);

  return (
    <div className="min-h-screen bg-white text-[#06004b]" style={FUENTE}>
      <Header />
      <main>
        {/* Portada en los colores de Perfila */}
        <section className="relative overflow-hidden text-white" style={{ backgroundColor: PERFILA.azul }}>
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 size-[28rem] rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, #5B39F9, transparent 70%)" }} />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-0 size-[26rem] rounded-full opacity-35 blur-3xl" style={{ background: "radial-gradient(circle, #12a5a0, transparent 70%)" }} />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pb-20 md:pt-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 text-sm font-bold ring-1 ring-white/15">
                <MarcaPerfila size={24} /> Insignias de Enlace, con Perfila
              </p>
              <h1 className="mt-5 text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[58px]">
                Demuestra lo que <span className="bg-gradient-to-r from-[#ffc24b] via-[#ff8a5b] to-[#ff6f91] bg-clip-text text-transparent">sabes hacer.</span>
              </h1>
              <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-white/80">
                Un título dice lo que estudiaste. Una insignia dice lo que <b className="text-white">sabes hacer hoy</b>. Haz una prueba corta y, si logras el nivel, tu insignia verificada sale en tu CV y en cada aplicación.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
                {[
                  [Sparkles, "Gratis"],
                  [Clock, "10 a 15 minutos"],
                  [Smartphone, "Desde el celular"],
                  [ShieldCheck, "Suma, nunca resta"],
                ].map(([I, t]) => {
                  const Icono = I as typeof Clock;
                  return <span key={t as string} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5"><Icono className="size-4 text-[#f9c400]" />{t as string}</span>;
                })}
              </div>
              <a href="#pruebas" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#f9c400] px-6 text-[15px] font-extrabold text-[#06004b] transition hover:bg-[#ffd21f]">
                Elegir mi prueba <ArrowRight className="size-5" />
              </a>
            </div>
            <div className="relative mx-auto grid w-full max-w-sm grid-cols-2 gap-4" aria-hidden="true">
              {orden.map((p, i) => (
                <div key={p.id} className="rounded-[1.6rem] bg-white/[0.07] p-5 text-center ring-1 ring-white/10 backdrop-blur" style={{ transform: `translateY(${i % 2 ? 22 : 0}px) rotate(${i % 2 ? 2 : -2}deg)` }}>
                  <Medalla prueba={p.id} nivel={i === 0 ? "destacado" : "solido"} size={78} />
                  <p className="mt-3 text-sm font-extrabold leading-tight">{p.corto}</p>
                  <p className="mt-1 text-[11px] font-semibold text-white/60">Verificada por Perfila</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mis insignias y pruebas en curso */}
        {(ganadas.length > 0 || pendientes.length > 0) && (
          <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
            <div className="rounded-[1.75rem] bg-[#f4f2ff] p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#5B39F9]">Tu vitrina</p>
                  <h2 className="text-2xl font-extrabold tracking-tight">{ganadas.length ? `Tienes ${ganadas.length} ${ganadas.length === 1 ? "insignia" : "insignias"}` : "Tus pruebas en curso"}</h2>
                </div>
                {pendientes.length > 0 && (
                  <button type="button" onClick={() => revisar(true)} disabled={revisando} className="inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-[#06004b] bg-white px-4 text-sm font-bold disabled:opacity-60">
                    {revisando ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Ya terminé, revisar
                  </button>
                )}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {ganadas.map((g) => (
                  <div key={g.ref} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_10px_30px_-18px_rgb(6_0_75/0.35)]">
                    <Medalla prueba={g.prueba} nivel={g.nivel} size={52} />
                    <div className="min-w-0">
                      <p className="font-extrabold leading-tight">{infoPrueba(g.prueba)?.nombre}</p>
                      <p className="text-xs text-[#4b4680]">Nivel {NIVEL_TXT[g.nivel]}</p>
                      <a href={verificarUrl(g.ref)} className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-[#5B39F9] hover:underline"><BadgeCheck className="size-3.5" /> Ver verificación</a>
                    </div>
                  </div>
                ))}
                {pendientes.map((p) => (
                  <div key={p.ref} className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-[#c9c5e3] bg-white/60 p-4">
                    <Medalla prueba={p.prueba} size={52} apagada />
                    <div className="min-w-0">
                      <p className="font-extrabold leading-tight">{infoPrueba(p.prueba)?.nombre}</p>
                      <p className="text-xs text-[#4b4680]">En curso</p>
                      <a href={p.url} className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-[#5B39F9] hover:underline">Continuar prueba <ArrowRight className="size-3.5" /></a>
                    </div>
                  </div>
                ))}
              </div>
              {ganadas.length > 0 && (
                <p className="mt-4 text-sm text-[#4b4680]">Tus insignias ya salen en <Link to="/cv" className="font-bold text-[#5B39F9] hover:underline">tu CV</Link> y cuando incluyes tu CV al aplicar.</p>
              )}
            </div>
          </section>
        )}

        {/* Catálogo */}
        <section id="pruebas" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[44px]">Elige qué quieres demostrar</h2>
            <p className="mt-3 text-[17px] leading-relaxed text-[#4b4680]">{puesto ? <>Ordenadas según lo que buscas: <b className="text-[#06004b]">{puesto}</b>.</> : "Empieza por la que más se parezca al trabajo que buscas."}</p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {orden.map((p) => {
              const g = ganada(p.id);
              const pen = pendiente(p.id);
              return (
                <article key={p.id} className="flex flex-col rounded-[1.75rem] bg-[#f6f5fb] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-28px_rgb(6_0_75/0.45)] sm:p-7">
                  <div className="flex items-start gap-4">
                    <Medalla prueba={p.id} nivel={g?.nivel} size={70} apagada={!g} />
                    <div>
                      <h3 className="text-xl font-extrabold leading-tight">{p.nombre}</h3>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4b4680]"><Clock className="size-4" /> {p.minutos} minutos</p>
                      {g && <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#5cc28a]/15 px-2.5 py-0.5 text-xs font-extrabold text-[#1f7a4a]"><CheckCircle2 className="size-3.5" /> La tienes · {NIVEL_TXT[g.nivel]}</p>}
                    </div>
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed">{p.queMide}</p>
                  <p className="mt-2 text-sm text-[#4b4680]"><b className="text-[#06004b]">Sirve para:</b> {p.paraQuien}</p>
                  <div className="mt-auto pt-6">
                    {pen ? (
                      <a href={pen.url} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#06004b] px-6 text-[15px] font-bold text-white hover:bg-[#15106a]">Continuar mi prueba <ArrowRight className="size-5" /></a>
                    ) : activas === false ? (
                      <p className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#4b4680]">Muy pronto: estamos terminando de conectar Perfila.</p>
                    ) : (
                      <button type="button" onClick={() => setElegida(p)} disabled={activas === null} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#f9c400] px-6 text-[15px] font-extrabold text-[#06004b] transition hover:bg-[#ffd21f] disabled:opacity-60">
                        {g ? "Repetir para subir de nivel" : "Hacer la prueba"} <ArrowRight className="size-5" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="bg-[#f4f2ff]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[44px]">Así de simple</h2>
            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                ["Eliges y empiezas", "Pones tu nombre y tu correo. La prueba se abre en Perfila, en tu celular, con letra grande y sin descargar nada."],
                ["Respondes con calma", "Situaciones reales del trabajo, con reloj. Guarda tu avance solo: si se te va el internet, sigues donde ibas."],
                ["Vuelves con tu insignia", "Al terminar, Perfila le dice a Enlace tu nivel (nunca tus respuestas). Si lo lograste, tu insignia aparece en tu CV."],
              ].map(([t, d], i) => (
                <li key={t} className="rounded-[1.6rem] bg-white p-6">
                  <span className="grid size-10 place-items-center rounded-full bg-[#5B39F9] text-lg font-extrabold text-white">{i + 1}</span>
                  <h3 className="mt-4 text-lg font-extrabold">{t}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[#4b4680]">{d}</p>
                </li>
              ))}
            </ol>
            <div className="mt-8 grid gap-4 rounded-[1.6rem] bg-[#06004b] p-6 text-white sm:grid-cols-2 sm:p-8">
              <div>
                <h3 className="text-xl font-extrabold">Reglas claras</h3>
                <p className="mt-2 text-white/75">Una insignia es para abrirte puertas, no para cerrártelas.</p>
              </div>
              <ul className="space-y-2 text-[15px] text-white/90">
                {[
                  "Suma, nunca resta: si no llegas al nivel, no se muestra nada.",
                  "Dos niveles: Sólido (70 % o más) y Destacado (85 % o más).",
                  "Puedes repetir cada prueba hasta 2 veces cada 15 días.",
                  "La empresa ve tu nivel y lo puede verificar; nunca tus respuestas.",
                ].map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#f9c400]" />{x}</li>)}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {elegida && <Pedir prueba={elegida} onCerrar={() => setElegida(null)} />}
      {resultado && <Resultado r={resultado} onCerrar={() => setResultado(null)} onOtra={() => { setResultado(null); document.getElementById("pruebas")?.scrollIntoView({ behavior: "smooth" }); }} />}
    </div>
  );
}

function Pedir({ prueba, onCerrar }: { prueba: InfoPrueba; onCerrar: () => void }) {
  const cv = typeof window !== "undefined" ? leerCV() : null;
  const [nombre, setNombre] = useState(cv?.nombre ?? "");
  const [correo, setCorreo] = useState(cv?.correo ?? "");
  const [acepto, setAcepto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function empezar(e: React.FormEvent) {
    e.preventDefault();
    if (!acepto) { toast.error("Marca la casilla para seguir."); return; }
    setEnviando(true);
    try {
      const r = await pedirInsignia({ data: { prueba: prueba.id, nombre, correo, regreso: `${window.location.origin}/insignias` } });
      agregarPendiente({ ref: r.ref, prueba: prueba.id, url: r.url, pedida: new Date().toISOString() });
      window.location.href = r.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo abrir la prueba.");
      setEnviando(false);
    }
  }

  const campo = "mt-1 h-12 w-full rounded-2xl border border-[#d9d5ee] bg-white px-4 text-[16px] outline-none focus:border-[#5B39F9] focus:ring-2 focus:ring-[#5B39F9]/25";
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-[#06004b]/60 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Prueba de ${prueba.nombre}`} onClick={onCerrar}>
      <form onSubmit={empezar} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-[1.75rem] bg-white p-6 text-[#06004b] shadow-2xl sm:rounded-[1.75rem] sm:p-7" style={FUENTE}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Medalla prueba={prueba.id} size={52} />
            <div>
              <p className="text-xs font-bold text-[#5B39F9]">Prueba de Perfila · {prueba.minutos} min</p>
              <h2 className="text-xl font-extrabold leading-tight">{prueba.nombre}</h2>
            </div>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid size-9 place-items-center rounded-full hover:bg-[#f4f2ff]"><X className="size-5" /></button>
        </div>
        <label className="mt-5 block text-sm font-bold">Tu nombre<input required value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" className={campo} placeholder="Nombre y apellido" /></label>
        <label className="mt-3 block text-sm font-bold">Tu correo<input required type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="email" inputMode="email" className={campo} placeholder="tucorreo@ejemplo.com" /></label>
        <p className="mt-1.5 text-xs text-[#4b4680]">Con tu correo guardamos tu prueba por si la retomas después.</p>
        <label className="mt-4 flex items-start gap-2.5 text-sm">
          <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="mt-0.5 size-5 accent-[#5B39F9]" />
          <span>Acepto que Perfila guarde mis respuestas para calificar la prueba y que le diga a Enlace solo mi nivel. <a href={`${PERFILA.url}/legal/privacidad`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#5B39F9] underline">Privacidad de Perfila</a></span>
        </label>
        <button type="submit" disabled={enviando} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f9c400] text-[15px] font-extrabold text-[#06004b] transition hover:bg-[#ffd21f] disabled:opacity-60">
          {enviando ? <><Loader2 className="size-5 animate-spin" /> Abriendo Perfila…</> : <>Empezar en Perfila <ArrowRight className="size-5" /></>}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#4b4680]"><MarcaPerfila size={16} /> La prueba se abre en Perfila y al final vuelves aquí.</p>
      </form>
    </div>
  );
}

function Resultado({ r, onCerrar, onOtra }: { r: NonNullable<Resultado>; onCerrar: () => void; onOtra: () => void }) {
  const prueba = r.tipo === "ganada" ? r.insignia.prueba : r.prueba;
  const info = infoPrueba(prueba);
  const nivel: Nivel | undefined = r.tipo === "ganada" ? r.insignia.nivel : undefined;
  const compartir = r.tipo === "ganada"
    ? `https://wa.me/?text=${encodeURIComponent(`Gané mi insignia de ${info?.nombre} (nivel ${NIVEL_TXT[r.insignia.nivel]}) verificada por Perfila en Enlace Laboral: ${verificarUrl(r.insignia.ref)}`)}`
    : "";
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-[#06004b]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onCerrar}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] bg-[#06004b] p-7 text-center text-white shadow-2xl" style={FUENTE}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-24 mx-auto size-72 rounded-full opacity-60 blur-3xl" style={{ background: `radial-gradient(circle, ${info?.color ?? PERFILA.violeta}, transparent 70%)` }} />
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full hover:bg-white/10"><X className="size-5" /></button>
        <div className="relative">
          <div className={r.tipo === "ganada" ? "motion-safe:animate-[insignia-pop_0.9s_cubic-bezier(0.22,1,0.36,1)]" : ""}>
            <Medalla prueba={prueba} nivel={nivel} size={120} apagada={r.tipo !== "ganada"} />
          </div>
          {r.tipo === "ganada" ? (
            <>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight">¡Ganaste tu insignia!</h2>
              <p className="mt-2 text-white/80"><b className="text-white">{info?.nombre}</b> · nivel <b className="text-[#f9c400]">{NIVEL_TXT[r.insignia.nivel]}</b>. Ya está en tu CV, verificada por Perfila.</p>
              <div className="mt-6 grid gap-2">
                <Link to="/cv" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#f9c400] font-extrabold text-[#06004b] hover:bg-[#ffd21f]">Ver mi CV <ArrowRight className="size-5" /></Link>
                <a href={compartir} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-white/60 font-bold hover:bg-white/10"><MessageCircle className="size-5" /> Compartir por WhatsApp</a>
                <button type="button" onClick={onOtra} className="h-11 text-sm font-bold text-white/80 hover:text-white">Ganar otra insignia</button>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-5 text-2xl font-extrabold leading-tight">Esta vez no llegó la insignia</h2>
              <p className="mt-2 text-white/80">No pasa nada: no se muestra en ningún lado y no afecta tus aplicaciones. Ahora sabes qué esperar y puedes repetir {info ? `«${info.nombre}»` : "la prueba"} más adelante.</p>
              <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm text-white/85">Lee cada situación hasta el final antes de responder y piensa qué haría la persona más profesional del equipo.</p>
              <div className="mt-6 grid gap-2">
                <button type="button" onClick={onOtra} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#f9c400] font-extrabold text-[#06004b] hover:bg-[#ffd21f]">Probar otra insignia <ArrowRight className="size-5" /></button>
                <Link to="/vacantes" className="h-11 pt-3 text-sm font-bold text-white/80 hover:text-white">Seguir buscando empleo</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

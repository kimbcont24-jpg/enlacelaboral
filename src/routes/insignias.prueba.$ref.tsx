import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Clock, Loader2, ShieldAlert, Wifi } from "lucide-react";
import { toast } from "sonner";

import { Medalla } from "@/components/insignias/Sello";
import { LogoHorizontal } from "@/components/site/Logo";
import { NIVEL_TXT, PERFILA, infoPrueba, quitarPendiente } from "@/lib/insignias";
import { abrirPrueba, entregarPrueba, type Entrega, type PruebaAbierta } from "@/lib/insignias.functions";

/** La prueba en sí: una pregunta por pantalla, con reloj, guardado automático y control de salidas. */
export const Route = createFileRoute("/insignias/prueba/$ref")({
  head: () => ({
    meta: [
      { title: "Prueba de insignia | Enlace Laboral" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&display=swap" }],
  }),
  component: Prueba,
});

const FUENTE = { fontFamily: "Manrope, Figtree, ui-sans-serif, system-ui, sans-serif" };
type Guardado = { respuestas: Record<string, number>; salidas: number; actual: number };
const clave = (ref: string) => `enlace-prueba-${ref}`;

function leerGuardado(ref: string): Guardado {
  try {
    const g = JSON.parse(localStorage.getItem(clave(ref)) ?? "null") as Guardado | null;
    if (g && typeof g === "object" && g.respuestas) return { respuestas: g.respuestas, salidas: Number(g.salidas) || 0, actual: Number(g.actual) || 0 };
  } catch { /* sin almacenamiento */ }
  return { respuestas: {}, salidas: 0, actual: 0 };
}
function guardar(ref: string, g: Guardado) {
  try { localStorage.setItem(clave(ref), JSON.stringify(g)); } catch { /* sin almacenamiento */ }
}

const ALERTAS: Record<string, string> = {
  incompleta: "quedaron preguntas sin responder",
  muy_rapida: "se respondió demasiado rápido para leer cada situación",
  respuestas_iguales: "todas las respuestas fueron la misma opción",
  salio_de_la_prueba: "se salió de la pantalla de la prueba varias veces",
};

function Prueba() {
  const { ref } = Route.useParams();
  const [datos, setDatos] = useState<PruebaAbierta | null>(null);
  const [error, setError] = useState(false);
  const [g, setG] = useState<Guardado>({ respuestas: {}, salidas: 0, actual: 0 });
  const [restante, setRestante] = useState<number | null>(null);
  const [entregando, setEntregando] = useState(false);
  const [final, setFinal] = useState<Entrega | null>(null);
  const desfase = useRef(0);
  const entregada = useRef(false);

  const cargar = useCallback(() => {
    setError(false);
    abrirPrueba(ref)
      .then((d) => {
        if (d.estado === "en_curso") desfase.current = new Date(d.ahora).getTime() - Date.now();
        setDatos(d);
        setG(leerGuardado(ref));
      })
      .catch(() => setError(true));
  }, [ref]);
  useEffect(cargar, [cargar]);

  const enCurso = datos?.estado === "en_curso" ? datos : null;
  const total = enCurso?.preguntas.length ?? 0;

  const entregar = useCallback(async (automatica = false) => {
    if (!enCurso || entregada.current) return;
    entregada.current = true;
    setEntregando(true);
    try {
      const actual = leerGuardado(ref);
      const r = await entregarPrueba(ref, actual.respuestas, actual.salidas);
      try { localStorage.removeItem(clave(ref)); } catch { /* nada */ }
      if (r.estado === "vencida") quitarPendiente(ref);
      setFinal(r);
      window.scrollTo({ top: 0 });
    } catch (e) {
      entregada.current = false;
      toast.error(e instanceof Error ? e.message : "No se pudo entregar.");
      if (automatica) setTimeout(() => void entregar(true), 5000);
    } finally {
      setEntregando(false);
    }
  }, [enCurso, ref]);

  // Reloj con la hora del servidor.
  useEffect(() => {
    if (!enCurso || final) return;
    const limite = new Date(enCurso.limite).getTime();
    const tic = () => {
      const s = Math.max(0, Math.round((limite - (Date.now() + desfase.current)) / 1000));
      setRestante(s);
      if (s === 0) void entregar(true);
    };
    tic();
    const t = setInterval(tic, 1000);
    return () => clearInterval(t);
  }, [enCurso, final, entregar]);

  // Salir de la pantalla cuenta (copiar la pregunta y buscarla, por ejemplo). Se avisa desde la primera vez.
  useEffect(() => {
    if (!enCurso || final) return;
    const alSalir = () => {
      if (document.visibilityState !== "hidden") return;
      setG((prev) => {
        const nuevo = { ...prev, salidas: prev.salidas + 1 };
        guardar(ref, nuevo);
        setTimeout(() => toast.warning(nuevo.salidas >= 3
          ? "Cuidado: si sales de la prueba una vez más, no se podrá dar la insignia."
          : "Mantente en esta pantalla hasta terminar. Salir de la prueba cuenta en contra."), 300);
        return nuevo;
      });
    };
    document.addEventListener("visibilitychange", alSalir);
    return () => document.removeEventListener("visibilitychange", alSalir);
  }, [enCurso, final, ref]);

  function responder(id: string, opcion: number) {
    setG((prev) => {
      const nuevo = { ...prev, respuestas: { ...prev.respuestas, [id]: opcion } };
      guardar(ref, nuevo);
      return nuevo;
    });
  }
  function ir(n: number) {
    setG((prev) => {
      const nuevo = { ...prev, actual: Math.min(Math.max(n, 0), total - 1) };
      guardar(ref, nuevo);
      return nuevo;
    });
    window.scrollTo({ top: 0 });
  }

  const info = infoPrueba(enCurso?.prueba ?? (datos && "prueba" in datos ? datos.prueba ?? "" : ""));

  return (
    <div className="min-h-screen bg-[#f4f2ff] text-[#06004b]" style={FUENTE}>
      <header className="sticky top-0 z-20 border-b border-[#e3dff5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
          <LogoHorizontal className="text-[17px]" />
          {enCurso && !final && restante !== null && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-extrabold tabular-nums ${restante < 120 ? "bg-[#f2557a]/15 text-[#c2264d]" : "bg-[#f4f2ff]"}`}>
              <Clock className="size-4" /> {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {error ? (
          <Aviso icono={<Wifi className="size-11 text-[#5B39F9]" />} titulo="No pudimos cargar la prueba" texto="Revisa tu conexión. Tus respuestas siguen guardadas en este teléfono.">
            <button type="button" onClick={cargar} className="mt-5 h-12 rounded-full bg-[#06004b] px-6 font-bold text-white">Intentar de nuevo</button>
          </Aviso>
        ) : !datos ? (
          <div className="grid place-items-center py-24"><Loader2 className="size-8 animate-spin text-[#5B39F9]" /></div>
        ) : final ? (
          <Resultado ref_={ref} r={final} nombrePrueba={info?.nombre ?? "la prueba"} prueba={enCurso?.prueba} />
        ) : !enCurso ? (
          <Aviso
            icono={<ShieldAlert className="size-11 text-[#f2557a]" />}
            titulo={datos.estado === "terminada" ? "Esta prueba ya se entregó" : datos.estado === "vencida" ? "Se acabó el tiempo de esta prueba" : "No encontramos esta prueba"}
            texto={datos.estado === "terminada" ? "Mira tu resultado en la página de insignias." : datos.estado === "vencida" ? "Puedes empezarla de nuevo desde la página de insignias (hasta 2 veces cada 15 días)." : "Revisa el enlace o empieza una prueba nueva."}
          >
            <Link to="/insignias" search={datos.estado === "terminada" ? { insignia: ref } : {}} className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-[#f9c400] px-6 font-extrabold">Ir a mis insignias <ArrowRight className="size-5" /></Link>
          </Aviso>
        ) : (
          <Pregunta
            datos={enCurso} g={g} entregando={entregando}
            onResponder={responder} onIr={ir} onEntregar={() => void entregar()}
          />
        )}
      </main>
    </div>
  );
}

function Pregunta({ datos, g, entregando, onResponder, onIr, onEntregar }: {
  datos: Extract<PruebaAbierta, { estado: "en_curso" }>; g: Guardado; entregando: boolean;
  onResponder: (id: string, op: number) => void; onIr: (n: number) => void; onEntregar: () => void;
}) {
  const total = datos.preguntas.length;
  const i = Math.min(g.actual, total - 1);
  const p = datos.preguntas[i];
  const respondidas = datos.preguntas.filter((x) => g.respuestas[x.id] !== undefined).length;
  const elegida = g.respuestas[p.id];
  const ultima = i === total - 1;
  const info = infoPrueba(datos.prueba);

  return (
    <div>
      <div className="flex items-center gap-3">
        <Medalla prueba={datos.prueba} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#5B39F9]">{info?.nombre}</p>
          <p className="text-sm font-semibold text-[#4b4680]">Pregunta {i + 1} de {total} · {respondidas} respondidas</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white" aria-hidden="true">
        <div className="h-full rounded-full transition-all" style={{ width: `${(respondidas / total) * 100}%`, backgroundColor: info?.color ?? PERFILA.violeta }} />
      </div>

      <section className="mt-6 rounded-[1.6rem] bg-white p-6 shadow-[0_20px_50px_-30px_rgb(6_0_75/0.4)] sm:p-7">
        <h1 className="select-none text-[20px] font-extrabold leading-snug sm:text-[22px]">{p.enunciado}</h1>
        <div className="mt-5 grid gap-2.5" role="radiogroup" aria-label="Opciones">
          {p.opciones.map((op, n) => {
            const activa = elegida === n;
            return (
              <button
                key={n} type="button" role="radio" aria-checked={activa}
                onClick={() => onResponder(p.id, n)}
                className={`flex min-h-14 w-full select-none items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[16px] font-semibold transition ${activa ? "border-[#5B39F9] bg-[#f4f2ff]" : "border-[#e3dff5] hover:border-[#bdb5ea]"}`}
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${activa ? "bg-[#5B39F9] text-white" : "bg-[#f4f2ff] text-[#4b4680]"}`}>{"ABCD"[n]}</span>
                <span>{op}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" onClick={() => onIr(i - 1)} disabled={i === 0} className="inline-flex h-12 items-center gap-2 rounded-full px-4 font-bold text-[#4b4680] disabled:opacity-30">
          <ArrowLeft className="size-5" /> Anterior
        </button>
        {ultima ? (
          <button type="button" onClick={onEntregar} disabled={entregando || respondidas < total} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#f9c400] px-6 font-extrabold disabled:opacity-50">
            {entregando ? <><Loader2 className="size-5 animate-spin" /> Calificando…</> : <>Entregar prueba <BadgeCheck className="size-5" /></>}
          </button>
        ) : (
          <button type="button" onClick={() => onIr(i + 1)} disabled={elegida === undefined} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#06004b] px-6 font-bold text-white disabled:opacity-40">
            Siguiente <ArrowRight className="size-5" />
          </button>
        )}
      </div>
      {ultima && respondidas < total && (
        <p className="mt-3 text-center text-sm text-[#4b4680]">
          Te faltan {total - respondidas}. Toca un número para ir:{" "}
          {datos.preguntas.map((x, n) => g.respuestas[x.id] === undefined && (
            <button key={x.id} type="button" onClick={() => onIr(n)} className="mx-0.5 rounded-full bg-white px-2 font-bold text-[#5B39F9]">{n + 1}</button>
          ))}
        </p>
      )}
      <p className="mt-8 text-center text-xs text-[#4b4680]">Tu avance se guarda solo. Si se te va el internet, vuelve a abrir este enlace y sigues donde ibas.</p>
    </div>
  );
}

function Resultado({ ref_, r, nombrePrueba, prueba }: { ref_: string; r: Entrega; nombrePrueba: string; prueba?: Parameters<typeof Medalla>[0]["prueba"] }) {
  if (r.estado === "vencida") {
    return (
      <Aviso icono={<Clock className="size-11 text-[#f2557a]" />} titulo="Se acabó el tiempo" texto="La prueba se cerró antes de entregarla. Puedes intentarlo de nuevo desde la página de insignias.">
        <Link to="/insignias" className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-[#f9c400] px-6 font-extrabold">Volver a insignias <ArrowRight className="size-5" /></Link>
      </Aviso>
    );
  }
  const motivos = r.alertas.map((a) => ALERTAS[a]).filter(Boolean);
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-[#06004b] p-7 text-center text-white">
      {prueba && <Medalla prueba={prueba} nivel={r.nivel} size={110} apagada={!r.nivel} />}
      <h1 className="mt-5 text-3xl font-extrabold leading-tight">{r.nivel ? "¡Lograste tu insignia!" : "Prueba entregada"}</h1>
      <p className="mt-2 text-white/80">
        Respondiste bien <b className="text-white">{r.aciertos} de {r.total}</b> en {nombrePrueba}.
        {r.nivel ? <> Nivel <b className="text-[#f9c400]">{NIVEL_TXT[r.nivel]}</b>.</> : null}
      </p>
      {!r.nivel && (
        <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm text-white/85">
          {motivos.length
            ? `Esta vez no se puede dar la insignia porque ${motivos.join(" y ")}. No se muestra en ningún lado y puedes repetirla.`
            : "Para la insignia se necesita 70 % o más. No se muestra en ningún lado: practica y repítela más adelante."}
        </p>
      )}
      <Link to="/insignias" search={{ insignia: ref_ }} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f9c400] font-extrabold text-[#06004b]">
        {r.nivel ? "Guardar en mi CV" : "Volver a insignias"} <ArrowRight className="size-5" />
      </Link>
    </div>
  );
}

function Aviso({ icono, titulo, texto, children }: { icono: React.ReactNode; titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[1.75rem] bg-white p-8 text-center">
      <div className="mx-auto w-fit">{icono}</div>
      <h1 className="mt-4 text-2xl font-extrabold">{titulo}</h1>
      <p className="mt-2 text-[#4b4680]">{texto}</p>
      {children}
    </div>
  );
}

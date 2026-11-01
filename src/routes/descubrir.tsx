import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Bookmark, Check, Loader2, Send, SlidersHorizontal, Sparkles, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AlertaForm } from "@/components/site/AlertaForm";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useApply } from "@/components/site/apply-context";
import { ClaridadPill } from "@/components/site/JobCard";
import { areas, nivelesExperiencia, provincias } from "@/lib/data";
import { aprender, encaja, guardarPerfil, leer, leerPerfil, PERFIL_VACIO, perfilListo, type Lectura, type Perfil } from "@/lib/descubrir";
import { useGuardados } from "@/lib/guardados";
import { viaAplicar } from "@/lib/mensajes";
import { usePostulaciones } from "@/lib/postulaciones";
import { useVacantes, type Vacante } from "@/lib/vacantes";

export const Route = createFileRoute("/descubrir")({
  head: () => ({ meta: [{ title: "Descubrir: vacantes que encajan contigo | Enlace Laboral" }, { name: "description", content: "Dinos dónde estás, qué sabes hacer y cuánta experiencia tienes. Te mostramos una vacante a la vez y te decimos por qué encaja." }] }),
  component: Descubrir,
});

const CLAVE_PASADAS = "enlace-pasadas";
const leerPasadas = (): string[] => { try { const v = JSON.parse(localStorage.getItem(CLAVE_PASADAS) ?? "[]") as unknown; return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; } catch { return []; } };
const guardarPasadas = (l: string[]) => { try { localStorage.setItem(CLAVE_PASADAS, JSON.stringify(l.slice(0, 500))); } catch { /* sin almacenamiento */ } };

const UMBRAL = 90;
const SALARIOS = [0, 20000, 30000, 50000] as const;
const pesos = (n: number) => `RD$${n.toLocaleString("es-DO")}`;

function Descubrir() {
  const { jobs, cargando } = useVacantes();
  const { ids, alternar } = useGuardados();
  const { yaAplico } = usePostulaciones();
  const aplicar = useApply();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [editando, setEditando] = useState(false);
  const [pasadas, setPasadas] = useState<string[]>([]);
  const [listo, setListo] = useState(false);
  const [historial, setHistorial] = useState<{ id: string; accion: "pasar" | "guardar" }[]>([]);
  const [dx, setDx] = useState(0);
  const [volando, setVolando] = useState(false);
  const inicio = useRef<number | null>(null);
  const reducido = useRef(false);

  useEffect(() => {
    setPasadas(leerPasadas());
    const p = leerPerfil();
    setPerfil(p ?? PERFIL_VACIO);
    setEditando(!p || !perfilListo(p));
    setListo(true);
    reducido.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const aprendido = useMemo(() => aprender(jobs, ids, pasadas), [jobs, ids, pasadas]);

  const cola = useMemo(() => {
    const p = perfil ?? PERFIL_VACIO;
    const vistas = new Set([...pasadas, ...ids]);
    return jobs
      .filter((j) => !vistas.has(j.id) && !yaAplico(j.id))
      .map((job) => ({ job, lectura: leer(job, p, aprendido) }))
      .sort((a, b) => b.lectura.puntos - a.lectura.puntos || Number(b.job.destacada) - Number(a.job.destacada) || new Date(b.job.creado).getTime() - new Date(a.job.creado).getTime());
  }, [jobs, pasadas, ids, yaAplico, perfil, aprendido]);
  const actual = cola[0];
  const siguiente = cola[1];
  const encajan = useMemo(() => cola.filter((c) => encaja(c.lectura)).length, [cola]);

  const decidir = useCallback((accion: "pasar" | "guardar") => {
    if (!actual || volando) return;
    const id = actual.job.id;
    const terminar = () => {
      if (accion === "pasar") { const n = [id, ...leerPasadas()]; guardarPasadas(n); setPasadas(n); }
      else if (!ids.includes(id)) alternar(id);
      setHistorial((h) => [{ id, accion }, ...h].slice(0, 20));
      setDx(0); setVolando(false);
    };
    if (reducido.current) { terminar(); return; }
    setVolando(true);
    setDx(accion === "guardar" ? 700 : -700);
    window.setTimeout(terminar, 200);
  }, [actual, volando, ids, alternar]);

  const deshacer = () => {
    const ultimo = historial[0];
    if (!ultimo) return;
    if (ultimo.accion === "pasar") { const n = leerPasadas().filter((x) => x !== ultimo.id); guardarPasadas(n); setPasadas(n); }
    else if (ids.includes(ultimo.id)) alternar(ultimo.id);
    setHistorial((h) => h.slice(1));
  };

  const reiniciar = () => { guardarPasadas([]); setPasadas([]); setHistorial([]); };

  const onKey = (e: React.KeyboardEvent) => {
    if (editando) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); decidir("pasar"); }
    else if (e.key === "ArrowRight") { e.preventDefault(); decidir("guardar"); }
    else if (e.key === "Enter" && actual && e.target === e.currentTarget) { e.preventDefault(); aplicar(actual.job); }
  };

  const guardarYVer = (p: Perfil) => { guardarPerfil(p); setPerfil(p); setEditando(false); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-md px-4 pb-24 pt-8 sm:pt-10" onKeyDown={onKey} tabIndex={-1}>
        {(cargando || !listo || !perfil) && <div className="flex justify-center p-16"><Loader2 className="size-6 animate-spin text-primary" /></div>}

        {listo && perfil && editando && <Cuestionario inicial={perfil} total={jobs.length} onListo={guardarYVer} />}

        {listo && !cargando && perfil && !editando && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Para ti</h1>
                <p className="mt-1 text-sm text-muted-foreground">{encajan > 0 ? <><span className="font-bold text-foreground">{encajan}</span> {encajan === 1 ? "vacante encaja" : "vacantes encajan"} con lo que nos dijiste. Luego siguen las demás.</> : cola.length > 0 ? "Ninguna encaja del todo todavía; te mostramos las más cercanas." : "Ya viste todas."}</p>
              </div>
              <button type="button" onClick={() => setEditando(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-primary hover:bg-secondary"><SlidersHorizontal className="size-3.5" aria-hidden="true" /> Ajustar</button>
            </div>
            <Resumen p={perfil} />

            {actual && (
              <>
                <div className="relative mt-5 select-none">
                  {siguiente && <div aria-hidden="true" className="absolute inset-x-3 top-3 h-full rounded-3xl border border-border bg-surface opacity-70" />}
                  <div
                    key={actual.job.id}
                    role="group"
                    aria-label={`Vacante ${actual.job.titulo}`}
                    onPointerDown={(e) => { if ((e.target as HTMLElement).closest("a,button")) return; inicio.current = e.clientX; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
                    onPointerMove={(e) => { if (inicio.current !== null && !volando) setDx(e.clientX - inicio.current); }}
                    onPointerUp={() => { if (inicio.current === null) return; inicio.current = null; if (dx > UMBRAL) decidir("guardar"); else if (dx < -UMBRAL) decidir("pasar"); else setDx(0); }}
                    onPointerCancel={() => { inicio.current = null; setDx(0); }}
                    style={{ transform: `translateX(${dx}px) rotate(${dx / 28}deg)`, transition: inicio.current === null ? "transform 200ms var(--ease-out-expo, ease-out)" : "none", touchAction: "pan-y" }}
                    className="relative"
                  >
                    <Tarjeta job={actual.job} lectura={actual.lectura} onAplicar={() => aplicar(actual.job)} />
                    <span aria-hidden="true" style={{ opacity: Math.min(1, Math.max(0, dx / UMBRAL)) }} className="pointer-events-none absolute left-5 top-5 rounded-lg border-2 border-success bg-surface/90 px-3 py-1 text-sm font-extrabold text-success">GUARDAR</span>
                    <span aria-hidden="true" style={{ opacity: Math.min(1, Math.max(0, -dx / UMBRAL)) }} className="pointer-events-none absolute right-5 top-5 rounded-lg border-2 border-destructive bg-surface/90 px-3 py-1 text-sm font-extrabold text-destructive">PASAR</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-4">
                  <button type="button" onClick={deshacer} disabled={historial.length === 0} aria-label="Deshacer" className="grid size-11 place-items-center rounded-full border border-border text-muted-foreground disabled:opacity-40"><Undo2 className="size-5" /></button>
                  <button type="button" onClick={() => decidir("pasar")} aria-label="Pasar esta vacante" className="grid size-14 place-items-center rounded-full border-2 border-destructive/40 text-destructive hover:bg-destructive/10"><X className="size-6" /></button>
                  <button type="button" onClick={() => aplicar(actual.job)} className="btn-aplicar inline-flex h-14 items-center gap-2 rounded-full px-7 text-base"><Send className="size-4" /> Aplicar</button>
                  <button type="button" onClick={() => decidir("guardar")} aria-label="Guardar esta vacante" className="grid size-14 place-items-center rounded-full border-2 border-success/40 text-success hover:bg-success/10"><Bookmark className="size-6" /></button>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">{cola.length - 1} más por ver · Lo que guardas o pasas afina las siguientes.</p>
              </>
            )}

            {!actual && (
              <div className="mt-8 rounded-3xl border border-dashed border-border p-8 text-center">
                <Check className="mx-auto size-8 text-success" aria-hidden="true" />
                <p className="mt-3 text-lg font-extrabold">{jobs.length === 0 ? "Aún no hay vacantes publicadas" : "Ya viste todas las vacantes"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Cuando entren nuevas que encajen contigo, te aparecen aquí primero.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Link to="/guardadas" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Ver mis guardadas</Link>
                  {pasadas.length > 0 && <button type="button" onClick={reiniciar} className="rounded-xl border border-border px-5 py-3 text-sm font-bold text-primary">Volver a ver las que pasé</button>}
                </div>
                <div className="mt-6 text-left"><AlertaForm compacta areaInicial={perfil.areas[0] ?? ""} provinciaInicial={perfil.provincias[0] ?? ""} /></div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Resumen({ p }: { p: Perfil }) {
  const partes = [
    p.provincias.length ? (p.provincias.length > 2 ? `${p.provincias.length} provincias` : p.provincias.map((x) => x.replace(/\s*\(.*\)/, "")).join(" y ")) : "Todo el país",
    p.areas.length ? p.areas.join(", ") : "Cualquier área",
    p.experiencia || "Cualquier experiencia",
    p.salarioMin > 0 ? `Desde ${pesos(p.salarioMin)}` : null,
  ].filter(Boolean);
  return <p className="mt-3 flex flex-wrap gap-1.5">{partes.map((t) => <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-primary">{t}</span>)}</p>;
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={activo} onClick={onClick} className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${activo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground hover:border-primary/60"}`}>{children}</button>;
}

function Cuestionario({ inicial, total, onListo }: { inicial: Perfil; total: number; onListo: (p: Perfil) => void }) {
  const [p, setP] = useState<Perfil>(inicial);
  const [todas, setTodas] = useState(false);
  const alternar = (campo: "provincias" | "areas", v: string, max: number) => setP((x) => {
    const l = x[campo];
    if (l.includes(v)) return { ...x, [campo]: l.filter((y) => y !== v) };
    if (l.length >= max) return x;
    return { ...x, [campo]: [...l, v] };
  });
  const lista = todas ? provincias.slice(1) : provincias.slice(1, 10);
  return (
    <section aria-labelledby="t-cuestionario">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-[#ffd84d] px-3 py-1 text-xs font-extrabold text-[#3d2f00]"><Sparkles className="size-3.5" aria-hidden="true" /> {total} vacantes activas</p>
      <h1 id="t-cuestionario" className="mt-3 text-2xl font-extrabold tracking-tight">Tres cosas y te mostramos lo tuyo</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sin cuenta. Queda guardado en este celular y puedes cambiarlo cuando quieras.</p>

      <h2 className="mt-7 text-base font-extrabold">¿Dónde puedes trabajar? <span className="font-normal text-muted-foreground">(hasta 3)</span></h2>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {lista.map((v) => <Chip key={v} activo={p.provincias.includes(v)} onClick={() => alternar("provincias", v, 3)}>{v}</Chip>)}
        {!todas && <button type="button" onClick={() => setTodas(true)} className="px-2 text-sm font-bold text-primary hover:underline">Más provincias</button>}
      </div>

      <h2 className="mt-7 text-base font-extrabold">¿En qué área? <span className="font-normal text-muted-foreground">(hasta 3)</span></h2>
      <div className="mt-2.5 flex flex-wrap gap-2">{areas.map((a) => <Chip key={a} activo={p.areas.includes(a)} onClick={() => alternar("areas", a, 3)}>{a}</Chip>)}</div>

      <h2 className="mt-7 text-base font-extrabold">¿Cuánta experiencia tienes?</h2>
      <div className="mt-2.5 flex flex-wrap gap-2">{nivelesExperiencia.map((n) => <Chip key={n} activo={p.experiencia === n} onClick={() => setP((x) => ({ ...x, experiencia: x.experiencia === n ? "" : n }))}>{n}</Chip>)}</div>

      <h2 className="mt-7 text-base font-extrabold">¿Salario mínimo? <span className="font-normal text-muted-foreground">(opcional)</span></h2>
      <div className="mt-2.5 flex flex-wrap gap-2">{SALARIOS.map((s) => <Chip key={s} activo={p.salarioMin === s} onClick={() => setP((x) => ({ ...x, salarioMin: s }))}>{s === 0 ? "Sin mínimo" : `Desde ${pesos(s)}`}</Chip>)}</div>
      <p className="mt-2 text-xs text-muted-foreground">Las vacantes sin salario también te las mostramos; te avisamos cuando una paga menos de lo que pediste.</p>

      <button type="button" onClick={() => onListo(p)} className="btn-aplicar mt-8 w-full rounded-2xl py-4 text-base">{perfilListo(p) ? "Ver mis vacantes" : "Ver todas sin filtrar"}</button>
    </section>
  );
}

function Tarjeta({ job, lectura, onAplicar }: { job: Vacante; lectura: Lectura; onAplicar: () => void }) {
  const conSueldo = job.salarioMin > 0;
  const via = viaAplicar(job);
  const match = encaja(lectura);
  return (
    <article className={`rounded-3xl border bg-surface p-5 shadow-[var(--shadow-soft)] ${job.destacada ? "border-primary/50 border-t-4 border-t-[#ffd84d]" : "border-border"}`}>
      <div className="flex items-start gap-3.5">
        <EmpresaAvatar nombre={job.empresa} className="size-14 text-2xl" />
        <div className="min-w-0 flex-1">
          <h2 className="text-balance text-xl font-extrabold leading-snug">{job.titulo}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{job.empresa} · {job.provincia.replace(/\s*\(.*\)/, "")}</p>
        </div>
      </div>

      {conSueldo && <p className="mt-4 flex items-baseline gap-1.5"><span className="text-[1.7rem] font-extrabold leading-tight tabular-nums text-success">{job.salario}</span><span className="text-sm font-semibold text-muted-foreground">al mes</span></p>}

      {(lectura.razones.length > 0 || lectura.avisos.length > 0) && (
        <div className={`mt-4 rounded-2xl p-3.5 ${match ? "bg-success/8" : "bg-secondary"}`}>
          {lectura.razones.length > 0 && (
            <>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-success">{match ? "Encaja contigo" : "A tu favor"}</p>
              <ul className="mt-1.5 space-y-1 text-sm">{lectura.razones.map((r) => <li key={r} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" /><span>{r}</span></li>)}</ul>
            </>
          )}
          {lectura.avisos.length > 0 && (
            <ul className={`space-y-1 text-sm ${lectura.razones.length > 0 ? "mt-2.5 border-t border-border/60 pt-2.5" : ""}`}>{lectura.avisos.map((r) => <li key={r} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#b45309]" aria-hidden="true" /><span>{r}</span></li>)}</ul>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5 text-xs font-semibold text-muted-foreground">
        <span className="rounded-full bg-secondary px-2.5 py-1">{job.modalidad}</span>
        <span className="rounded-full bg-secondary px-2.5 py-1">{job.tipo}</span>
        <span className="rounded-full bg-secondary px-2.5 py-1">{job.experiencia}</span>
        <span className="rounded-full bg-secondary px-2.5 py-1">{via.texto}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2"><ClaridadPill job={job} /><span>{job.publicado}</span></span>
        <Link to="/vacantes/$id" params={{ id: job.id }} className="font-bold text-primary hover:underline">Ver completa</Link>
      </div>
      <button type="button" onClick={onAplicar} className="sr-only">Aplicar a {job.titulo}</button>
    </article>
  );
}

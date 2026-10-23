import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Briefcase, Check, Loader2, MapPin, Monitor, Send, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useApply } from "@/components/site/apply-context";
import { ClaridadPill } from "@/components/site/JobCard";
import { esNueva } from "@/lib/claridad";
import { useGuardados } from "@/lib/guardados";
import { viaAplicar } from "@/lib/mensajes";
import { usePostulaciones } from "@/lib/postulaciones";
import { useVacantes, type Vacante } from "@/lib/vacantes";

export const Route = createFileRoute("/descubrir")({
  head: () => ({ meta: [{ title: "Descubre empleos deslizando | Enlace Laboral" }, { name: "description", content: "Mira una vacante a la vez. Desliza a la derecha para guardarla o a la izquierda para pasar. Aplicar es gratis." }] }),
  component: Descubrir,
});

const CLAVE_PASADAS = "enlace-pasadas";
const leerPasadas = (): string[] => { try { const v = JSON.parse(localStorage.getItem(CLAVE_PASADAS) ?? "[]") as unknown; return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; } catch { return []; } };
const guardarPasadas = (l: string[]) => { try { localStorage.setItem(CLAVE_PASADAS, JSON.stringify(l.slice(0, 500))); } catch { /* sin almacenamiento */ } };

const UMBRAL = 90;

function Descubrir() {
  const { jobs, cargando } = useVacantes();
  const { ids, alternar } = useGuardados();
  const { yaAplico } = usePostulaciones();
  const aplicar = useApply();
  const [pasadas, setPasadas] = useState<string[]>([]);
  const [listo, setListo] = useState(false);
  const [historial, setHistorial] = useState<{ id: string; accion: "pasar" | "guardar" }[]>([]);
  const [dx, setDx] = useState(0);
  const [volando, setVolando] = useState(false);
  const inicio = useRef<number | null>(null);
  const reducido = useRef(false);

  useEffect(() => { setPasadas(leerPasadas()); setListo(true); reducido.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);

  const cola = useMemo(() => {
    const vistas = new Set([...pasadas, ...ids]);
    return jobs.filter((j) => !vistas.has(j.id) && !yaAplico(j.id)).sort((a, b) => Number(b.destacada) - Number(a.destacada) || new Date(b.creado).getTime() - new Date(a.creado).getTime());
  }, [jobs, pasadas, ids, yaAplico]);
  const actual = cola[0];
  const siguiente = cola[1];

  const decidir = useCallback((accion: "pasar" | "guardar") => {
    if (!actual || volando) return;
    const terminar = () => {
      if (accion === "pasar") { const n = [actual.id, ...leerPasadas()]; guardarPasadas(n); setPasadas(n); }
      else if (!ids.includes(actual.id)) alternar(actual.id);
      setHistorial((h) => [{ id: actual.id, accion }, ...h].slice(0, 20));
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
    if (e.key === "ArrowLeft") { e.preventDefault(); decidir("pasar"); }
    else if (e.key === "ArrowRight") { e.preventDefault(); decidir("guardar"); }
    else if (e.key === "Enter" && actual && e.target === e.currentTarget) { e.preventDefault(); aplicar(actual); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-md px-4 pb-24 pt-8 sm:pt-10" onKeyDown={onKey} tabIndex={-1}>
        <h1 className="text-2xl font-extrabold tracking-tight">Descubre empleos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Una vacante a la vez. Desliza a la derecha para guardar, a la izquierda para pasar.</p>

        {(cargando || !listo) && <div className="flex justify-center p-16"><Loader2 className="size-6 animate-spin text-primary" /></div>}

        {listo && !cargando && actual && (
          <>
            <p className="mt-4 text-center text-xs font-semibold text-muted-foreground">{cola.length} {cola.length === 1 ? "vacante por ver" : "vacantes por ver"}</p>
            <div className="relative mt-3 select-none">
              {siguiente && <div aria-hidden="true" className="absolute inset-x-3 top-3 h-full rounded-3xl border border-border bg-surface opacity-70" />}
              <div
                key={actual.id}
                role="group"
                aria-label={`Vacante ${actual.titulo}`}
                onPointerDown={(e) => { if ((e.target as HTMLElement).closest("a,button")) return; inicio.current = e.clientX; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
                onPointerMove={(e) => { if (inicio.current !== null && !volando) setDx(e.clientX - inicio.current); }}
                onPointerUp={() => { if (inicio.current === null) return; inicio.current = null; if (dx > UMBRAL) decidir("guardar"); else if (dx < -UMBRAL) decidir("pasar"); else setDx(0); }}
                onPointerCancel={() => { inicio.current = null; setDx(0); }}
                style={{ transform: `translateX(${dx}px) rotate(${dx / 28}deg)`, transition: inicio.current === null ? "transform 200ms var(--ease-out-expo, ease-out)" : "none", touchAction: "pan-y" }}
                className="relative"
              >
                <Tarjeta job={actual} onAplicar={() => aplicar(actual)} />
                <span aria-hidden="true" style={{ opacity: Math.min(1, Math.max(0, dx / UMBRAL)) }} className="pointer-events-none absolute left-5 top-5 rounded-lg border-2 border-success px-3 py-1 text-sm font-extrabold text-success">GUARDAR</span>
                <span aria-hidden="true" style={{ opacity: Math.min(1, Math.max(0, -dx / UMBRAL)) }} className="pointer-events-none absolute right-5 top-5 rounded-lg border-2 border-destructive px-3 py-1 text-sm font-extrabold text-destructive">PASAR</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button type="button" onClick={deshacer} disabled={historial.length === 0} aria-label="Deshacer" className="grid size-11 place-items-center rounded-full border border-border text-muted-foreground disabled:opacity-40"><Undo2 className="size-5" /></button>
              <button type="button" onClick={() => decidir("pasar")} aria-label="Pasar esta vacante" className="grid size-14 place-items-center rounded-full border-2 border-destructive/40 text-destructive hover:bg-destructive/10"><X className="size-6" /></button>
              <button type="button" onClick={() => aplicar(actual)} className="btn-aplicar inline-flex h-14 items-center gap-2 rounded-full px-7 text-base"><Send className="size-4" /> Aplicar</button>
              <button type="button" onClick={() => decidir("guardar")} aria-label="Guardar esta vacante" className="grid size-14 place-items-center rounded-full border-2 border-success/40 text-success hover:bg-success/10"><Bookmark className="size-6" /></button>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">También puedes usar las flechas ← → del teclado.</p>
          </>
        )}

        {listo && !cargando && !actual && (
          <div className="mt-8 rounded-3xl border border-dashed border-border p-8 text-center">
            <Check className="mx-auto size-8 text-success" aria-hidden="true" />
            <p className="mt-3 text-lg font-extrabold">{jobs.length === 0 ? "Aún no hay vacantes publicadas" : "Ya viste todas las vacantes"}</p>
            <p className="mt-1 text-sm text-muted-foreground">Cuando entren nuevas, te aparecerán aquí. Si quieres, recibe las nuevas en tu celular.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link to="/guardadas" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Ver mis guardadas</Link>
              {pasadas.length > 0 && <button type="button" onClick={reiniciar} className="rounded-xl border border-border px-5 py-3 text-sm font-bold text-primary">Volver a ver las que pasé</button>}
              <Link to="/vacantes" className="rounded-xl border border-border px-5 py-3 text-sm font-bold text-primary">Ver la lista completa</Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Tarjeta({ job, onAplicar }: { job: Vacante; onAplicar: () => void }) {
  const conSueldo = job.salarioMin > 0;
  const via = viaAplicar(job);
  return (
    <article className={`rounded-3xl border bg-surface p-5 shadow-[var(--shadow-soft)] ${job.destacada ? "border-primary/50 border-t-4 border-t-[#ffd84d]" : "border-border"}`}>
      <div className="flex items-start gap-3.5">
        <EmpresaAvatar nombre={job.empresa} className="size-14 text-2xl" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {job.destacada && <span className="rounded-full bg-[#ffd84d] px-2 py-0.5 text-[11px] font-extrabold text-[#3d2f00]">Destacada</span>}
            {esNueva(job) && <span className="rounded-full bg-cta px-2 py-0.5 text-[11px] font-bold text-cta-foreground">Nueva</span>}
          </div>
          <h2 className="text-balance text-xl font-extrabold leading-snug">{job.titulo}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{job.empresa}</p>
        </div>
      </div>
      <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
        <span className={conSueldo ? "text-[1.7rem] font-extrabold leading-tight tabular-nums text-success" : "text-base font-bold text-muted-foreground"}>{job.salario}</span>
        {conSueldo && <span className="text-sm font-semibold text-muted-foreground">al mes</span>}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" /> {job.provincia}</span>
        <span className="inline-flex items-center gap-1.5"><Monitor className="size-4" aria-hidden="true" /> {job.modalidad}</span>
        <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" aria-hidden="true" /> {job.tipo}</span>
      </div>
      {job.requisitos.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm">
          {job.requisitos.slice(0, 3).map((r) => (<li key={r} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" /><span>{r}</span></li>))}
          {job.requisitos.length > 3 && <li className="pl-6 text-xs text-muted-foreground">y {job.requisitos.length - 3} más en los detalles</li>}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ClaridadPill job={job} />
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-primary">{via.texto}</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{job.publicado} · Fuente: {job.fuente}</span>
        <Link to="/vacantes/$id" params={{ id: job.id }} className="font-bold text-primary hover:underline">Ver detalles</Link>
      </div>
      <button type="button" onClick={onAplicar} className="sr-only">Aplicar a {job.titulo}</button>
    </article>
  );
}

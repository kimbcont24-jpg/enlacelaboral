import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, Mic, Square, Target, X, XCircle } from "lucide-react";

import { CONSEJOS_DIA, GENERALES, POR_ROL, revisarRespuesta, type Pregunta } from "@/lib/entrevista";
import type { Rol } from "@/lib/cv-ayuda";

const K = "enlace-entrevista";
const leer = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(K) ?? "{}") as Record<string, string>; } catch { return {}; } };

/** Práctica de entrevista: preguntas generales y del puesto, qué buscan, cómo responder, cronómetro y revisión de la respuesta. */
export function Entrevista({ rol, onCerrar }: { rol: Rol | null; onCerrar: () => void }) {
  const preguntas: Pregunta[] = useMemo(() => [...(rol ? POR_ROL[rol.id] ?? [] : []), ...GENERALES], [rol]);
  const [i, setI] = useState(0);
  const [resp, setResp] = useState<Record<string, string>>({});
  const [segundos, setSegundos] = useState<number | null>(null);
  const reloj = useRef(0);
  useEffect(() => { setResp(leer()); }, []);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); }; document.addEventListener("keydown", t); return () => { document.removeEventListener("keydown", t); window.clearInterval(reloj.current); }; }, [onCerrar]);
  const q = preguntas[i]!;
  const texto = resp[q.id] ?? "";
  const revision = texto.trim() ? revisarRespuesta(q, texto) : [];
  const hechas = preguntas.filter((x) => (resp[x.id] ?? "").trim().split(/\s+/).length >= 15).length;
  const guardar = (v: string) => { const n = { ...resp, [q.id]: v }; setResp(n); try { localStorage.setItem(K, JSON.stringify(n)); } catch { /* sin almacenamiento */ } };
  const ir = (d: number) => { window.clearInterval(reloj.current); setSegundos(null); setI((x) => Math.min(preguntas.length - 1, Math.max(0, x + d))); };
  const cronometro = () => {
    if (segundos !== null) { window.clearInterval(reloj.current); setSegundos(null); return; }
    setSegundos(90);
    reloj.current = window.setInterval(() => setSegundos((s) => { if (s === null || s <= 1) { window.clearInterval(reloj.current); return null; } return s - 1; }), 1000);
  };

  return (
    <div className="no-print fixed inset-0 z-[70] grid place-items-end sm:place-items-center" role="dialog" aria-modal="true" aria-label="Practicar entrevista">
      <button type="button" tabIndex={-1} aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 bg-[#0a1a33]/55" />
      <div className="relative flex h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:h-[88vh] sm:rounded-3xl">
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Target className="size-5 text-[#1d6ff2]" />
          <div className="min-w-0 flex-1"><h2 className="font-display text-lg font-extrabold">Practica tu entrevista</h2><p className="text-xs text-muted-foreground">{rol ? `Preguntas para ${rol.nombre.toLowerCase()} y las que hacen en casi todas las entrevistas.` : "Las preguntas que hacen en casi todas las entrevistas."} Practicaste {hechas} de {preguntas.length}.</p></div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid size-9 place-items-center rounded-lg hover:bg-muted"><X className="size-5" /></button>
        </header>
        <div className="grid min-h-0 flex-1 md:grid-cols-[17rem_minmax(0,1fr)]">
          <nav className="hidden overflow-y-auto border-r border-border bg-background p-2 md:block" aria-label="Preguntas">
            {preguntas.map((x, j) => {
              const lista = (resp[x.id] ?? "").trim().split(/\s+/).length >= 15;
              return (
                <button key={x.id} type="button" onClick={() => { window.clearInterval(reloj.current); setSegundos(null); setI(j); }} aria-current={i === j} className={`flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] leading-snug ${i === j ? "bg-[#0a2f5c] text-white" : "hover:bg-secondary"}`}>
                  {lista ? <CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${i === j ? "text-[#8ec1ff]" : "text-success"}`} /> : <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border text-[9px] font-bold ${i === j ? "border-white/50" : "border-border text-muted-foreground"}`}>{j + 1}</span>}
                  <span className="min-w-0">{x.rol && <span className={`mb-0.5 block text-[10px] font-bold ${i === j ? "text-[#8ec1ff]" : "text-[#1557c4]"}`}>Para tu puesto</span>}{x.p}</span>
                </button>
              );
            })}
            <div className="mt-3 rounded-xl bg-surface p-3">
              <p className="text-xs font-extrabold">El día de la entrevista</p>
              <ul className="mt-2 space-y-1.5 text-[12px] text-muted-foreground">{CONSEJOS_DIA.map((c) => <li key={c} className="flex gap-1.5"><span className="mt-1.5 size-1 shrink-0 rounded-full bg-current" />{c}</li>)}</ul>
            </div>
          </nav>
          <div className="flex min-h-0 flex-col overflow-y-auto p-5 sm:p-7">
            <p className="text-sm font-semibold text-muted-foreground">Pregunta {i + 1} de {preguntas.length}{q.rol ? " · para tu puesto" : ""}</p>
            <h3 className="mt-2 text-balance font-display text-2xl font-extrabold leading-tight">«{q.p}»</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-background p-4"><p className="text-xs font-extrabold text-[#1557c4]">Qué buscan con esta pregunta</p><p className="mt-1.5 text-[14px] leading-relaxed">{q.buscan}</p></div>
              <div className="rounded-2xl bg-[#ffd84d]/15 p-4"><p className="flex items-center gap-1.5 text-xs font-extrabold text-[#6b5000]"><Lightbulb className="size-3.5" /> Cómo responder</p><p className="mt-1.5 text-[14px] leading-relaxed">{q.como}</p></div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="resp" className="text-sm font-bold">Tu respuesta</label>
              <button type="button" onClick={cronometro} className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-bold ${segundos !== null ? "bg-destructive text-white" : "border border-border hover:border-[#1d6ff2]"}`}>{segundos !== null ? <><Square className="size-3.5" /> {Math.floor(segundos / 60)}:{String(segundos % 60).padStart(2, "0")}</> : <><Mic className="size-4" /> Practicar en voz alta (1:30)</>}</button>
            </div>
            <textarea id="resp" value={texto} onChange={(e) => guardar(e.target.value)} rows={6} lang="es" spellCheck placeholder="Escríbela como la dirías. Después léela en voz alta con el cronómetro." className="mt-2 w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-[#1d6ff2] focus:ring-2 focus:ring-[#1d6ff2]/15" />
            {revision.length > 0 && (
              <ul className="mt-3 space-y-1.5">{revision.map((r) => <li key={r.texto} className="flex items-start gap-2 text-sm">{r.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-[#c27803]" />}{r.texto}</li>)}</ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Tus respuestas se guardan solo en este teléfono o computadora.</p>
            <details className="mt-4 rounded-xl bg-background p-3 md:hidden"><summary className="cursor-pointer text-sm font-bold">El día de la entrevista</summary><ul className="mt-2 space-y-1.5 text-[13px] text-muted-foreground">{CONSEJOS_DIA.map((c) => <li key={c}>• {c}</li>)}</ul></details>
            <div className="mt-auto flex items-center justify-between gap-3 pt-6">
              <button type="button" disabled={i === 0} onClick={() => ir(-1)} className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:invisible"><ChevronLeft className="size-4" /> Anterior</button>
              {i < preguntas.length - 1 ? <button type="button" onClick={() => ir(1)} className="inline-flex h-11 items-center gap-1 rounded-xl bg-[#0a2f5c] px-5 text-sm font-bold text-white">Siguiente pregunta <ChevronRight className="size-4" /></button>
                : <button type="button" onClick={onCerrar} className="btn-aplicar h-11 rounded-xl px-5 text-sm">Terminar</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

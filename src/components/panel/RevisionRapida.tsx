import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CornerDownLeft, FileText, MessageCircle, PartyPopper, SkipForward, ThumbsDown, ThumbsUp, X } from "lucide-react";

import { usePanel } from "@/components/panel/contexto";
import { Persona } from "@/components/panel/comun";
import { cumple, textoRespuesta } from "@/lib/preguntas";
import { coincidencia, partirMensaje, type Candidato } from "@/lib/panel";
import { hace } from "@/lib/vacantes";

type Decision = "si" | "no" | "luego";

/**
 * Revisión rápida: un candidato nuevo a la vez, con sus requisitos marcados ✓/✗.
 * Una sola decisión por pantalla (menos cansancio al decidir), avance visible y teclado:
 * → me interesa · ← no esta vez · espacio o ↓ después · Esc salir.
 */
export function RevisionRapida({ vacante, onCerrar }: { vacante?: string; onCerrar: () => void }) {
  const p = usePanel();
  // La lista se fija al abrir para que no salte mientras decides.
  const cola = useRef<Candidato[]>(p.candidatos.filter((c) => c.etapa === "nuevo" && (!vacante || c.vacante_id === vacante)).sort((a, b) => a.created_at.localeCompare(b.created_at)));
  const [i, setI] = useState(0);
  const [hechas, setHechas] = useState<Record<string, Decision>>({});
  const [verCV, setVerCV] = useState(false);
  const inicio = useRef(Date.now());
  const total = cola.current.length;
  const c = cola.current[i];

  const datos = useMemo(() => {
    if (!c) return null;
    const v = p.vacante(c.vacante_id);
    const m = partirMensaje(c.mensaje);
    return { v, m, k: v ? coincidencia(`${m.mensaje}\n${m.cv}`, v.requisitos) : null, f: cumple(c.respuestas ?? []) };
  }, [c, p]);

  const decidir = useCallback((d: Decision) => {
    if (!c) return;
    setHechas((h) => ({ ...h, [c.id]: d }));
    if (d === "si") void p.mover(c, "revision", { silencioso: true });
    if (d === "no") void p.mover(c, "descartado", { silencioso: true });
    setVerCV(false);
    setI((x) => x + 1);
  }, [c, p]);

  const deshacer = useCallback(() => {
    if (i === 0) return;
    const prev = cola.current[i - 1]!;
    const d = hechas[prev.id];
    if (d === "si" || d === "no") void p.mover({ ...prev, etapa: d === "si" ? "revision" : "descartado" }, "nuevo", { silencioso: true });
    setHechas((h) => { const n = { ...h }; delete n[prev.id]; return n; });
    setI((x) => x - 1);
  }, [i, hechas, p]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "Escape") onCerrar();
      else if (!c) return;
      else if (e.key === "ArrowRight") { e.preventDefault(); decidir("si"); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); decidir("no"); }
      else if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); decidir("luego"); }
      else if (e.key === "Backspace" || (e.key === "z" && (e.metaKey || e.ctrlKey))) { e.preventDefault(); deshacer(); }
    };
    window.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", tecla); document.body.style.overflow = ""; };
  }, [c, decidir, deshacer, onCerrar]);

  const interesan = cola.current.filter((x) => hechas[x.id] === "si");
  const minutos = Math.max(1, Math.round((Date.now() - inicio.current) / 60000));

  return (
    <div role="dialog" aria-modal="true" aria-label="Revisión rápida de candidatos" className="fixed inset-0 z-50 flex flex-col bg-[#0a2f5c]/95 backdrop-blur-sm">
      <header className="flex items-center gap-4 px-4 py-3 text-white sm:px-8">
        <p className="font-extrabold">Revisión rápida</p>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(i, total)}>
          <span className="block h-full rounded-full bg-[#ffd84d] transition-[width] duration-500" style={{ width: `${total ? (Math.min(i, total) / total) * 100 : 100}%` }} />
        </div>
        <p className="text-sm tabular-nums text-white/80">{Math.min(i + 1, total)} de {total}</p>
        <button type="button" onClick={onCerrar} aria-label="Salir de la revisión" className="rounded-lg p-2 hover:bg-white/10"><X className="size-5" /></button>
      </header>

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 pb-6 pt-2 sm:items-center">
        {c && datos ? (
          <article key={c.id} className="vista-entra w-full max-w-2xl overflow-hidden rounded-3xl bg-surface shadow-2xl">
            <div className="flex items-center gap-4 border-b border-border p-5 sm:p-6">
              <Persona nombre={c.nombre} className="size-14 text-lg" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-xl font-extrabold">{c.nombre}</h2>
                <p className="truncate text-sm text-muted-foreground">{datos.v?.titulo ?? "Vacante"} · aplicó {hace(c.created_at)}</p>
              </div>
              {datos.k && <span className={`shrink-0 rounded-2xl px-3 py-2 text-center ${datos.k.ok.length / datos.k.total >= 0.6 ? "bg-success/12 text-success" : "bg-secondary text-foreground"}`}><span className="block font-display text-2xl font-extrabold leading-none tabular-nums">{datos.k.ok.length}/{datos.k.total}</span><span className="text-[10px] font-bold uppercase tracking-wide">requisitos</span></span>}
            </div>

            <div className="max-h-[52vh] space-y-5 overflow-y-auto p-5 sm:p-6">
              {datos.k ? (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lo que pides vs. lo que trae</h3>
                  <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {datos.k.ok.map((r) => <li key={r} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-success" />{r}</li>)}
                    {datos.k.falta.map((r) => <li key={r} className="flex gap-2 text-sm text-muted-foreground"><X className="mt-0.5 size-4 shrink-0" />{r}</li>)}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">Lo buscamos en su CV y su mensaje; ✗ significa que no lo menciona, no que no lo tenga.</p>
                </section>
              ) : <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">{datos.m.cv || datos.m.mensaje ? "La vacante no tiene requisitos para comparar." : "No dejó CV ni mensaje. Escríbele para conocerle."}</p>}

              {(c.respuestas ?? []).length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tus preguntas{datos.f ? ` · cumple ${datos.f.ok} de ${datos.f.total}` : ""}</h3>
                  <ul className="mt-2 space-y-1.5">
                    {c.respuestas!.map((r) => <li key={r.id} className="flex gap-2 text-sm">{r.ok === null ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-border" /> : r.ok ? <Check className="mt-0.5 size-4 shrink-0 text-success" /> : <X className="mt-0.5 size-4 shrink-0 text-destructive" />}<span><span className="text-muted-foreground">{r.texto}</span> <b>{textoRespuesta(r)}</b></span></li>)}
                  </ul>
                </section>
              )}

              {datos.m.mensaje && <section><h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Su mensaje</h3><p className="mt-2 whitespace-pre-line text-sm">{datos.m.mensaje}</p></section>}

              {datos.m.cv && (
                <section>
                  <button type="button" onClick={() => setVerCV((v) => !v)} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1557c4]"><FileText className="size-4" /> {verCV ? "Ocultar CV" : "Ver CV completo"}</button>
                  {verCV && <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-secondary p-4 font-sans text-sm">{datos.m.cv}</pre>}
                </section>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-border p-3 sm:p-4">
              <button type="button" onClick={() => decidir("no")} className="flex flex-col items-center gap-1 rounded-2xl border border-border py-3 text-sm font-bold hover:border-destructive hover:text-destructive"><ThumbsDown className="size-5" /> No esta vez <kbd className="hidden text-[10px] font-normal text-muted-foreground sm:block">← flecha</kbd></button>
              <button type="button" onClick={() => decidir("luego")} className="flex flex-col items-center gap-1 rounded-2xl border border-border py-3 text-sm font-bold hover:bg-secondary"><SkipForward className="size-5" /> Después <kbd className="hidden text-[10px] font-normal text-muted-foreground sm:block">espacio</kbd></button>
              <button type="button" onClick={() => decidir("si")} className="flex flex-col items-center gap-1 rounded-2xl bg-[#1d6ff2] py-3 text-sm font-bold text-white hover:bg-[#155fd4]"><ThumbsUp className="size-5" /> Me interesa <kbd className="hidden text-[10px] font-normal text-white/70 sm:block">→ flecha</kbd></button>
            </div>
            {i > 0 && <button type="button" onClick={deshacer} className="mx-auto mb-3 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"><CornerDownLeft className="size-3.5" /> Deshacer la anterior</button>}
          </article>
        ) : (
          <div className="vista-entra w-full max-w-lg rounded-3xl bg-surface p-7 text-center shadow-2xl">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#ffd84d]/30 text-[#8a6500]"><PartyPopper className="size-8" /></span>
            <h2 className="mt-4 font-display text-2xl font-extrabold">{total ? `Revisaste ${Object.keys(hechas).length} en ${minutos === 1 ? "1 minuto" : `${minutos} minutos`}` : "No tienes candidatos nuevos"}</h2>
            <p className="mt-2 text-muted-foreground">{total ? `${interesan.length} te ${interesan.length === 1 ? "interesa" : "interesan"} y ${Object.values(hechas).filter((d) => d === "no").length} quedaron descartados.${Object.values(hechas).some((d) => d === "luego") ? " Los que dejaste para después siguen en Nuevos." : ""}` : "Cuando llegue alguien, aparece aquí."}</p>
            {interesan.length > 0 && (
              <div className="mt-6 text-left">
                <p className="text-sm font-extrabold">Escríbeles ahora, mientras están pendientes:</p>
                <ul className="mt-2 divide-y divide-border rounded-2xl border border-border">
                  {interesan.map((x) => (
                    <li key={x.id} className="flex items-center gap-3 px-3 py-2.5">
                      <Persona nombre={x.nombre} className="size-8 text-[11px]" />
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">{x.nombre}</span>
                      <button type="button" onClick={() => p.contactar({ ...x, etapa: "revision" }, "revision")} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-[#128c43] hover:bg-[#1fa855]/10"><MessageCircle className="size-4" /> Escribir</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {i > 0 && total > 0 && <button type="button" onClick={deshacer} className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-bold"><ArrowLeft className="size-4" /> Volver a la última</button>}
              <button type="button" onClick={() => { onCerrar(); p.ir("candidatos", { etapa: interesan.length ? "revision" : "", vacante: vacante ?? "" }); }} className="btn-aplicar inline-flex h-11 items-center gap-1.5 rounded-xl px-5">Ver mis candidatos <ArrowRight className="size-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

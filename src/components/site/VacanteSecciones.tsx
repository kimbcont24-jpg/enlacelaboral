import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bus, CalendarClock, Check, Clock, FileText, Gift, GraduationCap, Heart, Info, ListChecks, type LucideIcon, Plus, Send, ShieldCheck, Sparkles, Star, Target, TrendingUp, UtensilsCrossed, Wallet } from "lucide-react";

import { diasRestantes } from "@/lib/claridad";
import { tipoBeneficio, type TipoBeneficio } from "@/lib/presentar";
import type { Vacante } from "@/lib/vacantes";

/** Título de sección: ícono en un cuadro suave + título grande. Igual en todas las secciones. */
export function SeccionTitulo({ Icono, titulo, sub, id }: { Icono: LucideIcon; titulo: string; sub?: string; id?: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#e6efff] to-[#d4e4ff] text-[#1557c4] ring-1 ring-[#1d6ff2]/10"><Icono className="size-5" strokeWidth={2.2} /></span>
      <div className="min-w-0 pt-0.5">
        <h2 id={id} className="text-[1.3rem] font-extrabold leading-tight tracking-[-0.01em] sm:text-[1.45rem]">{titulo}</h2>
        {sub && <p className="mt-1 text-[15px] leading-snug text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function Seccion({ children, className = "", etiqueta }: { children: React.ReactNode; className?: string; etiqueta?: string }) {
  return <section aria-labelledby={etiqueta} className={`scroll-mt-24 ${className}`}>{children}</section>;
}

/** Lo que hará la persona: tarjetas numeradas, fáciles de leer en el celular. */
export function Funciones({ items }: { items: string[] }) {
  return (
    <Seccion etiqueta="sec-funciones">
      <SeccionTitulo id="sec-funciones" Icono={Target} titulo="Lo que harás" sub="Tu día a día en este puesto." />
      <ol className="mt-6 grid gap-2.5">
        {items.map((f, i) => (
          <li key={f} className="flex items-start gap-4 rounded-2xl border border-border bg-surface px-4 py-3.5 sm:px-5">
            <span aria-hidden="true" className="mt-px font-display text-sm font-bold tabular-nums text-[#1d6ff2]">{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0 text-[1.0625rem] leading-snug [overflow-wrap:anywhere]">{f}</span>
          </li>
        ))}
      </ol>
    </Seccion>
  );
}

/**
 * «¿Cuántos cumples?»: la persona marca los requisitos que ya tiene.
 * Mucha gente no aplica si no cumple el 100 %; este cálculo le muestra que suele bastar con la mayoría.
 * No se guarda en ningún lado.
 */
export function Requisitos({ imprescindibles, cualidades = [], suman }: { imprescindibles: string[]; cualidades?: string[]; suman: string[] }) {
  const [marcados, setMarcados] = useState<Set<number>>(new Set());
  const total = imprescindibles.length;
  const n = marcados.size;
  const pct = total ? Math.round((n / total) * 100) : 0;
  const mensaje = useMemo(() => {
    if (!total) return null;
    if (n === 0) return { tono: "neutro", texto: "Toca los que ya cumples y te decimos qué tan cerca estás." };
    if (n === total) return { tono: "ok", texto: "¡Cumples con todo! Aplica hoy mismo: las primeras aplicaciones se leen con más calma." };
    if (pct >= 60) return { tono: "ok", texto: `Cumples ${n} de ${total}. Aplica: casi nadie cumple el 100 % y las empresas lo saben. En tu CV destaca lo que sí traes.` };
    return { tono: "medio", texto: `Cumples ${n} de ${total}. Si el puesto te interesa, aplica igual y explica en tu mensaje cómo compensas lo que falta.` };
  }, [n, total, pct]);

  const alternar = (i: number) => setMarcados((s) => { const x = new Set(s); if (x.has(i)) x.delete(i); else x.add(i); return x; });

  return (
    <Seccion etiqueta="sec-requisitos">
      <SeccionTitulo id="sec-requisitos" Icono={ListChecks} titulo="Lo que piden" sub={total ? "Marca los que ya tienes. Solo lo ves tú." : undefined} />
      {total > 0 && (
        <>
          <ul className="mt-6 grid gap-2.5">
            {imprescindibles.map((r, i) => {
              const si = marcados.has(i);
              return (
                <li key={r}>
                  <button type="button" role="checkbox" aria-checked={si} onClick={() => alternar(i)} className={`flex w-full items-start gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-[background-color,border-color,box-shadow] duration-200 sm:px-5 ${si ? "border-success/40 bg-success/[0.07] shadow-[inset_0_0_0_1px_rgb(15_122_67/0.15)]" : "border-border bg-surface hover:border-[#1d6ff2]/40"}`}>
                    <span aria-hidden="true" className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors ${si ? "border-success bg-success text-white" : "border-[#b9c3d1] bg-white"}`}>{si && <Check className="size-4" strokeWidth={3.2} />}</span>
                    <span className="min-w-0 text-[1.0625rem] leading-snug [overflow-wrap:anywhere]">{r}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {mensaje && (
            <div aria-live="polite" className={`mt-4 rounded-2xl p-4 sm:p-5 ${mensaje.tono === "ok" ? "bg-success/[0.08]" : mensaje.tono === "medio" ? "bg-[#fff6e0]" : "bg-secondary/70"}`}>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={n} aria-label="Requisitos que cumples">
                  <div className={`h-full rounded-full transition-[width] duration-500 ease-out ${mensaje.tono === "medio" ? "bg-[#d99400]" : "bg-success"}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="font-display text-sm font-bold tabular-nums">{n}/{total}</span>
              </div>
              <p className="mt-2.5 text-[15px] font-semibold leading-snug">{mensaje.texto}</p>
              {n > 0 && <Link to="/cv" className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-[#1557c4] hover:underline"><FileText className="size-4" aria-hidden="true" /> Prepara tu CV gratis</Link>}
            </div>
          )}
        </>
      )}
      {cualidades.length > 0 && (
        <div className={total ? "mt-8" : "mt-6"}>
          <h3 className="flex items-center gap-2 text-base font-extrabold"><Heart className="size-4 text-[#1d6ff2]" aria-hidden="true" /> Cualidades que buscan</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {cualidades.map((c) => <li key={c} className="rounded-full bg-[#e8f0ff] px-3.5 py-2 text-[15px] font-semibold leading-tight text-[#0f3f8c]">{c}</li>)}
          </ul>
        </div>
      )}
      {suman.length > 0 && (
        <div className={total || cualidades.length ? "mt-8" : "mt-6"}>
          <h3 className="flex items-center gap-2 text-base font-extrabold"><Star className="size-4 text-[#d99400]" aria-hidden="true" /> Suman puntos <span className="font-semibold text-muted-foreground">(no son obligatorios)</span></h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {suman.map((s) => <li key={s} className="inline-flex items-center gap-1.5 rounded-full border border-[#d99400]/25 bg-[#fffaf0] px-3.5 py-2 text-[15px] font-semibold leading-tight text-[#6b4a00]"><Plus className="size-3.5 shrink-0" strokeWidth={3} aria-hidden="true" />{s}</li>)}
          </ul>
        </div>
      )}
    </Seccion>
  );
}

const ICONO_BENEFICIO: Record<TipoBeneficio, LucideIcon> = { dinero: Wallet, ley: ShieldCheck, bono: Gift, formacion: GraduationCap, crecimiento: TrendingUp, transporte: Bus, comida: UtensilsCrossed, horario: Clock, otro: Sparkles };

export function Beneficios({ items }: { items: string[] }) {
  return (
    <Seccion etiqueta="sec-ofrece">
      <SeccionTitulo id="sec-ofrece" Icono={Gift} titulo="Lo que ofrecen" sub="Según lo que publicó la empresa." />
      <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {items.map((b) => {
          const I = ICONO_BENEFICIO[tipoBeneficio(b)];
          return (
            <li key={b} className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-4">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/10 text-success"><I className="size-5" /></span>
              <span className="min-w-0 text-[1.0625rem] font-semibold leading-snug [overflow-wrap:anywhere]">{b}</span>
            </li>
          );
        })}
      </ul>
    </Seccion>
  );
}

export function Notas({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#1d6ff2]/15 bg-[#f2f7ff] p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-extrabold text-[#1557c4]"><Info className="size-4" aria-hidden="true" /> Ten en cuenta</p>
      <ul className="mt-2 space-y-1.5 text-[15px] leading-snug">{items.map((n) => <li key={n}>{n}</li>)}</ul>
    </div>
  );
}

/** Tres pasos para aplicar con calma. El último cambia según cómo recibe la empresa. */
export function PasosAplicar({ via, onAplicar, directo }: { via: string; onAplicar: () => void; directo: boolean }) {
  const pasos = [
    { I: ListChecks, t: "Revisa lo que piden", d: "Marca arriba los requisitos que cumples." },
    { I: FileText, t: "Ten tu CV listo", d: "Si no lo tienes, créalo gratis en 5 minutos.", link: true },
    { I: Send, t: "Aplica", d: via },
  ];
  return (
    <Seccion etiqueta="sec-pasos">
      <SeccionTitulo id="sec-pasos" Icono={Send} titulo="Cómo aplicar" sub="Tres pasos, sin crear cuenta." />
      <ol className="relative mt-6 grid gap-3 sm:grid-cols-3">
        {pasos.map(({ I, t, d, link }, i) => (
          <li key={t} className="relative rounded-2xl border border-border bg-surface p-5">
            <span className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-[#0a2f5c] font-display text-xs font-bold text-white">{i + 1}</span>
              <I className="size-5 text-[#1d6ff2]" aria-hidden="true" />
            </span>
            <p className="mt-3 font-extrabold leading-tight">{t}</p>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">{d}</p>
            {link && <Link to="/cv" className="mt-2 inline-flex text-sm font-bold text-[#1557c4] hover:underline">Crear mi CV</Link>}
            {i === 2 && <button type="button" onClick={onAplicar} className="mt-3 inline-flex text-sm font-bold text-[#1557c4] hover:underline">{directo ? "Ver el contacto" : "Aplicar ahora"}</button>}
          </li>
        ))}
      </ol>
    </Seccion>
  );
}

/** Barra de vigencia: cuánto le queda a la vacante (30 días desde que se publicó). */
export function Vigencia({ job }: { job: Pick<Vacante, "creado"> }) {
  const d = diasRestantes(job);
  const pct = Math.max(4, Math.min(100, (d / 30) * 100));
  const urgente = d <= 5;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground"><CalendarClock className="size-4" aria-hidden="true" /> Vigencia</span>
        <span className={`font-bold ${urgente ? "text-destructive" : ""}`}>{d <= 0 ? "Cierra hoy" : d === 1 ? "Cierra mañana" : `Quedan ${d} días`}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className={`h-full rounded-full ${urgente ? "bg-destructive" : "bg-gradient-to-r from-[#1d6ff2] to-[#5aa0ff]"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

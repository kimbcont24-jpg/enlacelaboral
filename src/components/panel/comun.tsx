import type { ReactNode } from "react";
import { Star } from "lucide-react";

import { etapaDe, iniciales } from "@/lib/panel";

const TONOS = ["#1d6ff2", "#0f7a43", "#c27803", "#7c3aed", "#0b6e7a", "#a1274a", "#0a2f5c"];

export function Persona({ nombre, className = "size-10 text-sm" }: { nombre: string; className?: string }) {
  let h = 0;
  for (const ch of nombre) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return <span aria-hidden="true" style={{ backgroundColor: TONOS[h % TONOS.length] }} className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${className}`}>{iniciales(nombre)}</span>;
}

export function EtapaPill({ etapa, className = "" }: { etapa: string; className?: string }) {
  const e = etapaDe(etapa);
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${e.tono} ${className}`}><span className="size-1.5 rounded-full" style={{ backgroundColor: e.color }} />{e.corto}</span>;
}

export function Estrellas({ valor, onCambio, tam = "size-4" }: { valor: number | null; onCambio?: (v: number | null) => void; tam?: string }) {
  const v = valor ?? 0;
  if (!onCambio) {
    if (!v) return null;
    return <span className="inline-flex items-center gap-0.5 text-[#e8a400]" aria-label={`${v} de 5 estrellas`}>{Array.from({ length: v }, (_, i) => <Star key={i} className="size-3 fill-current" />)}</span>;
  }
  return (
    <span className="inline-flex items-center" role="radiogroup" aria-label="Tu valoración">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={v === n} aria-label={`${n} de 5`} onClick={() => onCambio(v === n ? null : n)} className="p-0.5 text-[#e8a400] transition-transform hover:scale-110">
          <Star className={`${tam} ${n <= v ? "fill-current" : "fill-transparent text-muted-foreground/40"}`} />
        </button>
      ))}
    </span>
  );
}

export function Coincide({ ok, total }: { ok: number; total: number }) {
  const r = ok / total;
  const tono = r >= 0.7 ? "bg-success/12 text-success" : r >= 0.4 ? "bg-[#c27803]/12 text-[#8a5200]" : "bg-muted text-muted-foreground";
  return <span title="Requisitos de la vacante cuyas palabras aparecen en lo que envió la persona" className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${tono}`}>{ok}/{total} requisitos</span>;
}

export function Titulo({ titulo, sub, children }: { titulo: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">{titulo}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Vacio({ titulo, texto, children }: { titulo: string; texto: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-12 text-center">
      <p className="text-lg font-bold">{titulo}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{texto}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export const btnLinea = "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-50";
export const campoPanel = "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-[15px] outline-none focus:border-[#1d6ff2] focus:ring-2 focus:ring-[#1d6ff2]/20";

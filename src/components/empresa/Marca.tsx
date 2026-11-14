import { useState } from "react";
import { Gift, HeartHandshake, Sun, X } from "lucide-react";

import { Aparece } from "@/components/empresa/Radiografia";
import type { Marca } from "@/lib/motivar-empresas";

/** «Por qué trabajar aquí»: lo que la propia empresa cuenta de sí misma. Solo aparece si llenó algo. */
export function MarcaEmpleadora({ m, nombre }: { m: Marca; nombre: string }) {
  const [foto, setFoto] = useState<string | null>(null);
  const fotos = m.fotos ?? [];
  const beneficios = m.beneficios ?? [];
  if (!fotos.length && !beneficios.length && !m.cultura && !m.dia && !(m.valores ?? []).length) return null;
  return (
    <Aparece id="cultura" className="rounded-3xl border border-border bg-surface p-6 md:p-7">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-[#0f7a43]/10 px-3 py-1 text-xs font-extrabold text-[#0f7a43]"><HeartHandshake className="size-3.5" /> Lo cuenta la empresa</p>
      <h2 className="mt-2 font-display text-xl font-bold tracking-tight">Por qué trabajar en {nombre}</h2>

      {fotos.length > 0 && (
        <div className={`mt-4 grid gap-2 ${fotos.length === 1 ? "" : fotos.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
          {fotos.map((f, i) => (
            <button key={f} type="button" onClick={() => setFoto(f)} className={`group overflow-hidden rounded-2xl bg-muted ${fotos.length >= 3 && i === 0 ? "col-span-2 row-span-2 sm:col-span-1" : ""}`} aria-label={`Ver foto ${i + 1} de ${nombre}`}>
              <img src={f} alt={`Foto de ${nombre}`} loading="lazy" className="aspect-[4/3] size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}

      {(m.valores ?? []).length > 0 && <div className="mt-4 flex flex-wrap gap-2">{m.valores!.map((v) => <span key={v} className="rounded-full border border-border px-3 py-1 text-sm font-bold">{v}</span>)}</div>}

      {beneficios.length > 0 && (
        <div className="mt-5">
          <h3 className="flex items-center gap-2 text-sm font-extrabold"><Gift className="size-4 text-[#f5a700]" /> Beneficios además de los de ley</h3>
          <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">{beneficios.map((b) => <li key={b} className="flex items-center gap-2 rounded-xl bg-[#fff8e6] px-3 py-2.5 text-sm font-semibold"><span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[#f5a700]" />{b}</li>)}</ul>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {m.cultura && <div className="rounded-2xl bg-[#f3f6fb] p-4"><h3 className="flex items-center gap-2 text-sm font-extrabold"><HeartHandshake className="size-4 text-[#1d6ff2]" /> Cómo es trabajar aquí</h3><p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{m.cultura}</p></div>}
        {m.dia && <div className="rounded-2xl bg-[#f3f6fb] p-4"><h3 className="flex items-center gap-2 text-sm font-extrabold"><Sun className="size-4 text-[#f5a700]" /> Un día normal</h3><p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{m.dia}</p></div>}
      </div>

      {foto && (
        <div role="dialog" aria-modal="true" aria-label="Foto" onClick={() => setFoto(null)} className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4">
          <button type="button" onClick={() => setFoto(null)} aria-label="Cerrar" className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/15 text-white"><X className="size-5" /></button>
          <img src={foto} alt={`Foto de ${nombre}`} className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </Aparece>
  );
}

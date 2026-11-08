import { HeartHandshake } from "lucide-react";

import { compromisosDe } from "@/lib/inclusion";

/** Compromisos de inclusión de la vacante, en etiquetas cortas. */
export function InclusionPills({ categorias, max = 2 }: { categorias: string[]; max?: number }) {
  const cs = compromisosDe(categorias);
  if (!cs.length) return null;
  return (
    <>
      {cs.slice(0, max).map((c) => (
        <span key={c.id} title={c.t} className="inline-flex items-center gap-1 rounded-full bg-[#0f7a43]/10 px-2.5 py-1 text-xs font-bold text-[#0b5e33]"><HeartHandshake className="size-3.5" aria-hidden="true" />{c.corto}</span>
      ))}
      {cs.length > max && <span className="text-xs font-semibold text-[#0b5e33]">+{cs.length - max}</span>}
    </>
  );
}

/** Bloque en la página de la vacante: lo que la empresa se compromete a hacer. */
export function InclusionBloque({ categorias }: { categorias: string[] }) {
  const cs = compromisosDe(categorias);
  if (!cs.length) return null;
  return (
    <section aria-label="Compromisos de inclusión" className="mt-8 rounded-2xl border border-[#0f7a43]/25 bg-[#0f7a43]/[0.05] p-5">
      <h2 className="flex items-center gap-2 text-base font-extrabold text-[#0b5e33]"><HeartHandshake className="size-5" aria-hidden="true" /> Esta empresa se compromete</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">{cs.map((c) => <li key={c.id} className="rounded-xl bg-surface p-3 text-sm"><span className="block font-bold">{c.t}</span><span className="text-muted-foreground">{c.d}</span></li>)}</ul>
      {cs.some((c) => c.id === "discapacidad") && <p className="mt-3 text-sm text-muted-foreground">Si necesitas un ajuste para la entrevista (por ejemplo, intérprete de lengua de señas o un lugar accesible), escríbelo en tu mensaje al aplicar.</p>}
    </section>
  );
}

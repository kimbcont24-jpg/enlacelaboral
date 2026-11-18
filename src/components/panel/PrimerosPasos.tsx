import { ArrowRight, CheckCircle2, Clock3, FileImage, ShieldCheck } from "lucide-react";

import { usePanel } from "@/components/panel/contexto";
import type { Seccion } from "@/components/panel/contexto";
import { marcaDe } from "@/lib/motivar-empresas";

type Paso = { id: string; t: string; d: string; ok: boolean; espera?: boolean; ir?: Seccion; cta?: string };

/**
 * Primeros pasos de una empresa nueva: qué ya hizo, qué falta y qué estamos haciendo nosotros.
 * La verificación del RNC se explica para que nadie crea que su vacante «se perdió».
 */
export function PrimerosPasos({ compacto = false }: { compacto?: boolean }) {
  const p = usePanel();
  const e = p.empresa;
  const m = marcaDe(e.marca);
  const pasos: Paso[] = [
    { id: "cuenta", t: "Cuenta creada", d: "Tu panel ya está listo.", ok: true },
    { id: "vacante", t: "Publica tu primera vacante", d: "Gratis y sin límite. Con salario visible recibe más aplicaciones.", ok: p.vacantes.length > 0, ir: "publicar", cta: "Publicar" },
    e.verificada
      ? { id: "verif", t: "Empresa verificada", d: "Tus vacantes salen al momento con el sello de empresa verificada.", ok: true }
      : { id: "verif", t: "Verificamos tu RNC o cédula", d: "Lo revisamos nosotros, normalmente en menos de 24 horas. Mientras, puedes publicar: tu vacante sale en cuanto te verifiquemos.", ok: false, espera: true },
    { id: "logo", t: "Pon tu logo y tus beneficios", d: "Las empresas con logo y beneficios generan más confianza y reciben más candidatos.", ok: !!m.logo && (m.beneficios ?? []).length > 0, ir: "empresa", cta: "Completar" },
    { id: "equipo", t: "Invita a tu equipo (opcional)", d: "Que otra persona de RR. HH. vea los candidatos contigo.", ok: false, ir: "equipo", cta: "Invitar" },
  ];
  const obligatorios = pasos.filter((x) => x.id !== "equipo");
  const hechos = obligatorios.filter((x) => x.ok).length;
  const pct = Math.round((hechos / obligatorios.length) * 100);
  const siguiente = pasos.find((x) => !x.ok && !x.espera && x.ir);
  if (compacto && hechos === obligatorios.length) return null;

  if (compacto) {
    // Franja en el Inicio mientras falte algo.
    return (
      <button type="button" onClick={() => siguiente?.ir && p.ir(siguiente.ir)} className="flex w-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-left hover:border-[#1d6ff2]">
        <Barra pct={pct} />
        <span className="min-w-0 flex-1 text-sm"><span className="block font-extrabold">Tu empresa al {pct}%{!e.verificada ? " · verificación en curso" : ""}</span><span className="text-muted-foreground">{siguiente ? `Siguiente: ${siguiente.t.toLowerCase()}.` : "Estamos revisando tu RNC; te avisamos al terminar."}</span></span>
        {siguiente && <ArrowRight className="size-4 shrink-0 text-muted-foreground" />}
      </button>
    );
  }

  return (
    <section aria-label="Primeros pasos" className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-5 sm:px-7">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{e.contacto_nombre ? `${e.contacto_nombre.trim().split(/\s+/)[0]}, te` : "Te"} damos la bienvenida 👋</p>
          <h1 className="mt-0.5 font-display text-2xl font-extrabold tracking-tight">Pon a {e.nombre} a recibir talento</h1>
        </div>
        <div className="flex items-center gap-3"><Barra pct={pct} grande /><span className="text-sm text-muted-foreground">{hechos} de {obligatorios.length} listos</span></div>
      </div>
      <ol className="divide-y divide-border">
        {pasos.map((x, i) => (
          <li key={x.id} className={`flex items-start gap-4 px-5 py-4 sm:px-7 ${x === siguiente ? "bg-[#1d6ff2]/[0.04]" : ""}`}>
            {x.ok ? <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" /> : x.espera ? <Clock3 className="mt-0.5 size-6 shrink-0 text-[#c27803]" /> : <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 text-xs font-bold ${x === siguiente ? "border-[#1d6ff2] text-[#1d6ff2]" : "border-border text-muted-foreground"}`}>{i + 1}</span>}
            <div className="min-w-0 flex-1">
              <p className={`font-bold ${x.ok ? "text-muted-foreground line-through decoration-1" : ""}`}>{x.t}</p>
              {!x.ok && <p className="mt-0.5 text-sm text-muted-foreground">{x.d}</p>}
              {x.id === "vacante" && !x.ok && (
                <p className="mt-2 flex items-center gap-1.5 text-sm"><FileImage className="size-4 text-[#1557c4]" /> <span>¿Ya tienes el flyer? <button type="button" onClick={() => p.ir("publicar")} className="font-bold text-[#1557c4] hover:underline">Súbelo y llenamos el formulario por ti</button>.</span></p>
              )}
              {x.espera && <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#c27803]/10 px-2.5 py-1 text-xs font-bold text-[#8a5200]"><ShieldCheck className="size-3.5" /> En revisión por el equipo de Enlace</p>}
            </div>
            {!x.ok && x.ir && x.cta && <button type="button" onClick={() => p.ir(x.ir!)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold ${x === siguiente ? "btn-aplicar" : "border border-border hover:bg-secondary"}`}>{x.cta}</button>}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Barra({ pct, grande = false }: { pct: number; grande?: boolean }) {
  return (
    <span className={`relative block overflow-hidden rounded-full bg-border ${grande ? "h-2.5 w-32" : "h-2 w-16 shrink-0"}`} role="img" aria-label={`${pct}% completo`}>
      <span className="absolute inset-y-0 left-0 rounded-full bg-[#1d6ff2] transition-[width] duration-700" style={{ width: `${pct}%` }} />
    </span>
  );
}

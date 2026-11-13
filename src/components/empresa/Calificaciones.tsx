import { useState } from "react";
import { BadgeCheck, MessageSquareQuote, PenLine, ThumbsDown, ThumbsUp, Users } from "lucide-react";

import { Estrellas, Medidor } from "@/components/empresa/Estrellas";
import { CATEGORIAS, TIPOS, mesAno, type Opinion, type OpinionesEmpresa, type TipoOpinion } from "@/lib/opiniones";

/** Bloque de calificaciones del perfil de empresa: pestañas por tipo, resumen y opiniones. */
export function Calificaciones({ datos, nombre, onOpinar }: { datos: OpinionesEmpresa | undefined; nombre: string; onOpinar: (t: TipoOpinion) => void }) {
  const [tipo, setTipo] = useState<TipoOpinion>(() => (datos && datos.resumen.proceso.total > datos.resumen.trabajo.total ? "proceso" : "trabajo"));
  const r = datos?.resumen[tipo];
  const lista = (datos?.opiniones ?? []).filter((o) => o.tipo === tipo);

  return (
    <section id="calificaciones" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#1557c4]">Opiniones verificadas</p>
          <h2 className="text-2xl font-extrabold tracking-tight">Calificaciones de {nombre}</h2>
        </div>
        <button type="button" onClick={() => onOpinar(tipo)} className="btn-aplicar inline-flex h-11 items-center gap-2 rounded-full px-5"><PenLine className="size-4" /> Calificar empresa</button>
      </div>

      <div role="tablist" className="mt-5 inline-flex rounded-full bg-secondary p-1">
        {(["trabajo", "proceso"] as TipoOpinion[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tipo === t} onClick={() => setTipo(t)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${tipo === t ? "bg-white text-[#0a2f5c] shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {TIPOS[t].corto} <span className="ml-1 text-xs font-semibold text-muted-foreground">({datos?.resumen[t].total ?? 0})</span>
          </button>
        ))}
      </div>

      {r && r.promedio != null ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <div className="rounded-3xl border border-border bg-surface p-6 text-center">
            <p className="font-bold">Calificación general</p>
            <div className="mt-2 flex justify-center"><Medidor valor={r.promedio} /></div>
            <p className="mt-1 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">Basado en {r.total} opiniones</p>
            {r.estrellas && (
              <ul className="mt-4 space-y-1.5 text-left text-sm">
                {r.estrellas.map((n, i) => {
                  const pct = r.total ? Math.round((n / r.total) * 100) : 0;
                  return (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-8 shrink-0 whitespace-nowrap font-semibold">{5 - i} ★</span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#e7ebf2]"><span className="block h-full rounded-full bg-[#f5a700]" style={{ width: `${pct}%` }} /></span>
                      <span className="w-9 shrink-0 text-right text-xs text-muted-foreground">{pct}%</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="rounded-3xl border border-border bg-surface p-6">
            <p className="font-bold">Por categoría</p>
            <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {CATEGORIAS[tipo].map((c) => {
                const v = r.categorias?.[c.k];
                return (
                  <li key={c.k}>
                    <div className="flex items-baseline justify-between gap-2"><span className="text-sm font-semibold">{c.t}</span><span className="font-extrabold">{v != null ? v.toFixed(1) : "–"}</span></div>
                    <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-[#e7ebf2]"><span className="block h-full rounded-full bg-[#1d6ff2]" style={{ width: `${v != null ? ((v - 1) / 4) * 100 : 0}%` }} /></span>
                  </li>
                );
              })}
            </ul>
            {r.recomienda != null && (
              <p className="mt-6 flex items-center gap-3 rounded-2xl bg-[#0f7a43]/[0.07] p-4 text-[15px]">
                <ThumbsUp className="size-6 shrink-0 text-[#0f7a43]" />
                <span>El <b className="text-lg">{r.recomienda}%</b> {tipo === "trabajo" ? "recomienda trabajar en esta empresa" : "recomienda aplicar a esta empresa"}.</span>
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-3xl border border-dashed border-border bg-surface p-6 sm:flex-row sm:items-center">
          <Users className="size-8 shrink-0 text-[#1d6ff2]" />
          <p className="flex-1 text-[15px] text-muted-foreground">
            {r && r.total > 0 ? <>Hay <b className="text-foreground">{r.total} {r.total === 1 ? "opinión" : "opiniones"}</b>. Mostramos el promedio cuando haya al menos 5, para que sea justo con la empresa y con quien opina.</> : <>Todavía nadie ha opinado sobre {tipo === "trabajo" ? "trabajar aquí" : "su proceso de selección"}. Tu experiencia puede ayudar a otra persona a decidir.</>}
          </p>
          <button type="button" onClick={() => onOpinar(tipo)} className="shrink-0 text-sm font-bold text-[#1557c4] hover:underline">Dar mi opinión</button>
        </div>
      )}

      {lista.length > 0 && (
        <ul className="mt-6 space-y-4">
          {lista.map((o) => <TarjetaOpinion key={o.id} o={o} nombre={nombre} />)}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Cada opinión se revisa antes de publicarse. No mostramos nombres ni datos de quien opina. {tipo === "proceso" ? "Solo opinan del proceso personas que aplicaron a esta empresa desde Enlace." : "Para opinar hay que confirmar el correo."}</p>
    </section>
  );
}

function TarjetaOpinion({ o, nombre }: { o: Opinion; nombre: string }) {
  const quien = o.tipo === "proceso" ? "Persona que aplicó" : o.relacion === "actual" ? "Trabaja aquí" : o.relacion === "anterior" ? "Trabajó aquí" : "Persona que trabajó aquí";
  return (
    <li className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Estrellas valor={o.estrellas} />
        {o.titulo && <p className="font-extrabold">{o.titulo}</p>}
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span>{quien}{o.puesto ? ` · ${o.puesto}` : ""}</span>·<span>{mesAno(o.fecha)}</span>
        {o.verificada && <span className="inline-flex items-center gap-1 font-bold text-[#0f7a43]"><BadgeCheck className="size-3.5" /> Aplicó por Enlace</span>}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {o.positivo && <p className="text-[15px] leading-relaxed"><span className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#0f7a43]"><ThumbsUp className="size-3.5" /> Lo bueno</span>{o.positivo}</p>}
        {o.mejorar && <p className="text-[15px] leading-relaxed"><span className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#b45309]"><ThumbsDown className="size-3.5" /> Por mejorar</span>{o.mejorar}</p>}
      </div>
      {o.recomienda != null && <p className="mt-3 text-sm font-semibold">{o.recomienda ? "✓ La recomienda" : "✗ No la recomienda"}</p>}
      {o.respuesta && (
        <div className="mt-4 rounded-2xl bg-secondary/70 p-4 text-sm">
          <p className="flex items-center gap-1.5 font-bold"><MessageSquareQuote className="size-4 text-[#1557c4]" /> Respuesta de {nombre} {o.respuesta_fecha && <span className="font-normal text-muted-foreground">· {mesAno(o.respuesta_fecha)}</span>}</p>
          <p className="mt-1 leading-relaxed">{o.respuesta}</p>
        </div>
      )}
    </li>
  );
}

import { useMemo, useState } from "react";
import { Crown, Lock, Printer } from "lucide-react";

import { usePanel } from "@/components/panel/contexto";
import { Titulo } from "@/components/panel/comun";
import { ETAPAS, horasRespuesta, planActivo, textoHoras } from "@/lib/panel";

const ORDEN = ETAPAS.map((e) => e.id);
const llego = (etapa: string, a: string) => ORDEN.indexOf(etapa as never) >= ORDEN.indexOf(a as never) && etapa !== "descartado";

/** Informe para gerencia: lo que pasó con las vacantes en el periodo, listo para imprimir o guardar en PDF. */
export function Informe() {
  const p = usePanel();
  const pro = planActivo(p.empresa);
  const [dias, setDias] = useState(30);
  const desde = Date.now() - dias * 864e5;

  const d = useMemo(() => {
    const cs = p.candidatos.filter((c) => new Date(c.created_at).getTime() >= desde);
    const vistas = Object.values(p.vistas).reduce((a, v) => a + Object.entries(v.porDia).filter(([dia]) => new Date(`${dia}T12:00:00`).getTime() >= desde).reduce((x, [, n]) => x + n, 0), 0);
    const revisados = cs.filter((c) => c.etapa !== "nuevo").length;
    const entrevista = cs.filter((c) => llego(c.etapa, "entrevista") || (c.etapa === "descartado" && c.historial.some((h) => h.tipo === "entrevista"))).length;
    const contratados = cs.filter((c) => c.etapa === "contratado");
    const diasContratar = contratados.filter((c) => c.etapa_at).map((c) => (new Date(c.etapa_at!).getTime() - new Date(c.created_at).getTime()) / 864e5);
    const semanas = Array.from({ length: Math.ceil(dias / 7) }, (_, i) => {
      const fin = Date.now() - i * 7 * 864e5, ini = fin - 7 * 864e5;
      return cs.filter((c) => { const t = new Date(c.created_at).getTime(); return t >= ini && t < fin; }).length;
    }).reverse();
    const porVacante = p.vacantes.map((v) => {
      const suyos = cs.filter((c) => c.vacante_id === v.id);
      const vv = Object.entries(p.vistas[v.id]?.porDia ?? {}).filter(([dia]) => new Date(`${dia}T12:00:00`).getTime() >= desde).reduce((x, [, n]) => x + n, 0);
      return { v, vistas: vv, apl: suyos.length, ent: suyos.filter((c) => llego(c.etapa, "entrevista")).length, con: suyos.filter((c) => c.etapa === "contratado").length };
    }).filter((x) => x.apl || x.vistas).sort((a, b) => b.apl - a.apl);
    return { cs, vistas, revisados, entrevista, contratados: contratados.length, diasContratar: diasContratar.length ? Math.round(diasContratar.reduce((a, b) => a + b, 0) / diasContratar.length) : null, semanas, porVacante, h: horasRespuesta(cs) };
  }, [p.candidatos, p.vistas, p.vacantes, desde, dias]);

  const embudo = [
    { t: "Vieron tus vacantes", n: d.vistas },
    { t: "Aplicaron", n: d.cs.length },
    { t: "Revisaste", n: d.revisados },
    { t: "Entrevistaste", n: d.entrevista },
    { t: "Contrataste", n: d.contratados },
  ];
  const maxE = Math.max(1, ...embudo.map((e) => e.n));
  const maxS = Math.max(1, ...d.semanas);

  const contenido = (
    <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8 print:border-0 print:p-0">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Informe de reclutamiento</p>
          <h2 className="font-display text-2xl font-extrabold">{p.empresa.nombre}</h2>
        </div>
        <p className="text-sm text-muted-foreground">Últimos {dias} días · al {new Date().toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}</p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Aplicaciones", d.cs.length.toLocaleString("es-DO")],
          ["De cada 100 que vieron, aplicaron", d.vistas ? String(Math.round((d.cs.length / d.vistas) * 100)) : "—"],
          ["Tiempo para responder", d.h === null ? "—" : textoHoras(d.h)],
          ["Días hasta contratar", d.diasContratar === null ? "—" : String(d.diasContratar)],
        ].map(([t, v]) => <div key={t}><p className="font-display text-3xl font-extrabold tabular-nums">{v}</p><p className="text-xs text-muted-foreground">{t}</p></div>)}
      </div>

      <section className="mt-8" aria-label="Del interés a la contratación">
        <h3 className="text-sm font-extrabold">Del interés a la contratación</h3>
        <ul className="mt-3 space-y-2">
          {embudo.map((e, i) => (
            <li key={e.t} className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_4rem]">
              <span className="text-muted-foreground">{e.t}</span>
              <span className="h-6 overflow-hidden rounded-md bg-muted"><span className="block h-full rounded-md" style={{ width: `${Math.max(e.n ? 2 : 0, (e.n / maxE) * 100)}%`, backgroundColor: ["#9fc2fb", "#1d6ff2", "#1557c4", "#c27803", "#0f7a43"][i], printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }} /></span>
              <span className="text-right font-bold tabular-nums">{e.n.toLocaleString("es-DO")}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-label="Aplicaciones por semana">
        <h3 className="text-sm font-extrabold">Aplicaciones por semana</h3>
        <div className="mt-3 flex h-24 items-end gap-2">
          {d.semanas.map((n, i) => <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] font-bold tabular-nums text-muted-foreground">{n || ""}</span><span className="w-full rounded-t bg-[#1d6ff2]" style={{ height: `${n ? Math.max(6, (n / maxS) * 100) : 2}%`, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }} /></div>)}
        </div>
        <p className="mt-1 text-right text-[11px] text-muted-foreground">Semana actual a la derecha</p>
      </section>

      <section className="mt-8" aria-label="Por vacante">
        <h3 className="text-sm font-extrabold">Por vacante</h3>
        {d.porVacante.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Sin movimiento en este periodo.</p> : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 font-semibold">Vacante</th><th className="py-2 text-right font-semibold">Vistas</th><th className="py-2 text-right font-semibold">Aplicaron</th><th className="py-2 text-right font-semibold">%</th><th className="py-2 text-right font-semibold">Entrevistas</th><th className="py-2 text-right font-semibold">Contratados</th></tr></thead>
              <tbody>{d.porVacante.map((x) => <tr key={x.v.id} className="border-b border-border last:border-0"><td className="py-2.5 pr-3 font-semibold">{x.v.titulo}</td><td className="py-2.5 text-right tabular-nums">{x.vistas}</td><td className="py-2.5 text-right font-bold tabular-nums">{x.apl}</td><td className="py-2.5 text-right tabular-nums text-muted-foreground">{x.vistas ? `${Math.round((x.apl / x.vistas) * 100)}%` : "—"}</td><td className="py-2.5 text-right tabular-nums">{x.ent}</td><td className="py-2.5 text-right tabular-nums">{x.con}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
      <p className="mt-8 border-t border-border pt-4 text-[11px] text-muted-foreground">Generado con Enlace Laboral. Las vistas cuentan una vez por persona y visita.</p>
    </article>
  );

  return (
    <>
      <div className="print:hidden">
        <Titulo titulo="Informe" sub="Para presentarle a gerencia cómo va el reclutamiento. Imprímelo o guárdalo en PDF.">
          {pro && <button type="button" onClick={() => window.print()} className="btn-aplicar inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm"><Printer className="size-4" /> Imprimir o PDF</button>}
        </Titulo>
        <div className="mb-4 flex gap-2" role="tablist" aria-label="Periodo">
          {[30, 90].map((n) => <button key={n} type="button" role="tab" aria-selected={dias === n} onClick={() => setDias(n)} className={`h-9 rounded-full border px-3.5 text-sm font-semibold ${dias === n ? "border-[#0a2f5c] bg-[#0a2f5c] text-white" : "border-border bg-surface"}`}>Últimos {n} días</button>)}
        </div>
      </div>
      {pro ? contenido : (
        <div className="relative">
          <div aria-hidden="true" className="pointer-events-none select-none blur-[5px]">{contenido}</div>
          <div className="absolute inset-0 grid place-items-start justify-center pt-16 sm:pt-24">
            <div className="mx-4 max-w-sm rounded-2xl bg-[#0a2f5c] p-6 text-center text-white shadow-2xl">
              <Lock className="mx-auto size-6 text-[#ffd84d]" />
              <p className="mt-3 font-display text-xl font-extrabold">El informe es parte del Plan Empresa</p>
              <p className="mt-1.5 text-sm text-white/75">Tus números ya están listos detrás. {p.empresa.prueba_usada ? "Activa el plan para verlos e imprimirlos." : "Pruébalo 14 días gratis, sin tarjeta."}</p>
              <button type="button" onClick={() => p.ir("planes")} className="btn-aplicar mt-4 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm"><Crown className="size-4" /> {p.empresa.prueba_usada ? "Ver planes" : "Probar gratis"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState } from "react";
import { BadgeCheck, Check, Crown, Eye, Handshake, MessageCircle, Minus, Rocket, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
import { toast } from "sonner";

import { usePanel } from "@/components/panel/contexto";
import { campoPanel, Titulo } from "@/components/panel/comun";
import { supabase } from "@/integrations/supabase/client";
import { diasPlan, estadoVacante, MAX_DESTACADAS, planActivo } from "@/lib/panel";

const PRECIO_PLAN = 1900;
const fmt = (n: number) => `RD$${n.toLocaleString("es-DO")}`;

const FILAS: { t: string; gratis: boolean | string; pro: boolean | string }[] = [
  { t: "Vacantes publicadas", gratis: "Sin límite", pro: "Sin límite" },
  { t: "Tablero de candidatos, agenda y mensajes listos", gratis: true, pro: true },
  { t: "Cuánta gente vio cada vacante", gratis: true, pro: true },
  { t: "Invitar personas del banco de talento", gratis: "5 al mes", pro: "Sin límite" },
  { t: "Jornadas de empleo próximas", gratis: "1 a la vez", pro: "Sin límite" },
  { t: "Destacar vacantes tú mismo, sin esperar", gratis: false, pro: `Hasta ${MAX_DESTACADAS}` },
  { t: "Primero en el listado y con la etiqueta Destacada", gratis: false, pro: true },
  { t: "Tus vacantes primero en nuestro canal de WhatsApp e Instagram", gratis: false, pro: true },
  { t: "Una reclutadora revisa tus vacantes para que atraigan más gente", gratis: false, pro: true },
  { t: "Informe para gerencia, listo para imprimir o PDF", gratis: false, pro: true },
  { t: "Atención directa por WhatsApp", gratis: false, pro: true },
];

const PREGUNTAS = [
  ["¿Pierdo algo si sigo en Gratis?", "No. Publicar, recibir candidatos, el tablero, la agenda y los mensajes siguen gratis siempre. El plan es para quien quiere más visibilidad y ayuda."],
  ["¿Cómo pago?", "Por transferencia o depósito. Primero te escribimos, activamos lo que pediste y después pagas. No pedimos tarjeta en la página."],
  ["¿Qué pasa al terminar la prueba de 14 días?", "Vuelves a Gratis solo. No hay cobros automáticos. Si te gustó, nos dices y seguimos."],
  ["¿Puedo cancelar?", "Cuando quieras. No hay contrato ni permanencia. Tus vacantes y candidatos se quedan contigo."],
];

function Celda({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="mx-auto size-5 text-success" aria-label="Incluido" />;
  if (v === false) return <Minus className="mx-auto size-5 text-muted-foreground/50" aria-label="No incluido" />;
  return <span className="text-[12px] font-bold leading-tight sm:text-sm">{v}</span>;
}

export function Planes() {
  const p = usePanel();
  const e = p.empresa;
  const activo = planActivo(e);
  const quedan = diasPlan(e);
  const [cargando, setCargando] = useState(false);
  const [vacDestacar, setVacDestacar] = useState("");
  const [puesto, setPuesto] = useState("");

  const abiertas = p.vacantes.filter((v) => estadoVacante(v).id === "activa");
  const destacadas = abiertas.filter((v) => v.destacada).length;
  const pendiente = (tipo: string, vid?: string) => p.solicitudes.some((s) => s.tipo === tipo && (vid === undefined || s.vacante_id === vid) && (s.estado === "nueva" || s.estado === "contactada"));

  // Lo que Enlace ya le dio a la empresa (datos reales del panel).
  const hace30 = Date.now() - 30 * 864e5;
  const vistas30 = Object.values(p.vistas).reduce((a, v) => a + v.total, 0);
  const recibidos30 = p.candidatos.filter((c) => new Date(c.created_at).getTime() >= hace30).length;
  const contratados = p.candidatos.filter((c) => c.etapa === "contratado").length;

  const probar = async () => {
    setCargando(true);
    const { data, error } = await supabase.rpc("iniciar_prueba");
    setCargando(false);
    if (error) return void toast.error(error.message.includes("prueba_usada") ? "Ya usaste tu prueba gratis. Puedes pedir el plan cuando quieras." : "No se pudo activar la prueba. Intenta otra vez.");
    p.setEmpresa({ ...e, plan: "empresa", plan_hasta: data as string, prueba_usada: true });
    toast.success("Listo: tienes el Plan Empresa 14 días gratis. Ya puedes destacar tus vacantes.");
  };

  return (
    <>
      <Titulo titulo={activo ? "Mi plan" : "Planes y servicios"} sub="Lo que usas hoy sigue gratis. Paga solo por lo que te ayude a contratar más rápido." />

      {/* Estado del plan */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0a2f5c] p-6 text-white sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-[#1d6ff2]/30 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold">{activo ? <><Crown className="size-4 text-[#ffd84d]" /> Plan Empresa activo</> : <>Estás en Gratis</>}</p>
            <h2 className="mt-3 max-w-xl text-balance font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              {activo ? (quedan !== null ? `Te ${quedan === 1 ? "queda 1 día" : `quedan ${quedan} días`} de plan.` : "Tu plan está activo.") : "Llega a más gente y llena tus puestos más rápido."}
            </h2>
            <p className="mt-2 max-w-xl text-white/75">
              {activo ? `Tienes ${destacadas} de ${MAX_DESTACADAS} vacantes destacadas. Destácalas desde Vacantes con un toque.` : `Plan Empresa: ${fmt(PRECIO_PLAN)} al mes. Sin contrato. Pruébalo 14 días sin pagar.`}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            {activo ? (
              <>
                <button type="button" onClick={() => p.ir("vacantes")} className="btn-aplicar inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6"><Star className="size-4" /> Destacar mis vacantes</button>
                {pendiente("plan_empresa") ? <p className="text-center text-sm text-white/70">Ya pediste seguir con el plan. Te escribimos.</p>
                  : <button type="button" onClick={() => void p.pedir("plan_empresa", undefined, "Quiere seguir con el plan")} className="h-11 rounded-xl border border-white/30 px-5 text-sm font-bold hover:bg-white/10">Quiero seguir con el plan</button>}
              </>
            ) : (
              <>
                {!e.prueba_usada && <button type="button" disabled={cargando} onClick={() => void probar()} className="btn-aplicar inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6"><Rocket className="size-4" /> {cargando ? "Activando…" : "Probar 14 días gratis"}</button>}
                {pendiente("plan_empresa") ? <p className="text-center text-sm text-white/70">Pedido recibido. Te escribimos para activarlo.</p>
                  : <button type="button" onClick={() => void p.pedir("plan_empresa")} className={e.prueba_usada ? "btn-aplicar h-12 rounded-xl px-6" : "h-11 rounded-xl border border-white/30 px-5 text-sm font-bold hover:bg-white/10"}>Quiero el Plan Empresa</button>}
                {!e.prueba_usada && <p className="text-center text-xs text-white/60">Sin tarjeta. Al terminar vuelves a Gratis solo.</p>}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Lo que ya lograste */}
      <section aria-label="Lo que lograste en Enlace Laboral" className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { I: Eye, n: vistas30, t: "personas vieron tus vacantes", s: "últimos 30 días" },
          { I: Users, n: recibidos30, t: "candidatos te aplicaron", s: "últimos 30 días" },
          { I: Handshake, n: contratados, t: contratados === 1 ? "persona contratada" : "personas contratadas", s: "desde que usas el panel" },
        ].map(({ I, n, t, s }) => (
          <div key={t} className="rounded-2xl border border-border bg-surface p-3 sm:p-5">
            <I className="size-5 text-[#1d6ff2]" />
            <p className="mt-2 font-display text-2xl font-extrabold tabular-nums sm:text-3xl">{n.toLocaleString("es-DO")}</p>
            <p className="text-xs font-semibold leading-snug sm:text-sm">{t}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">{s}</p>
          </div>
        ))}
      </section>
      {recibidos30 >= 3 && !activo && <p className="mt-3 text-sm text-muted-foreground">Con el Plan Empresa, cada candidato de este mes te habría costado unos <strong className="text-foreground">{fmt(Math.round(PRECIO_PLAN / recibidos30))}</strong>. Y destacando, suelen llegar más.</p>}

      {/* Comparativa */}
      <section aria-label="Gratis y Plan Empresa" className="mt-8">
        <h2 className="text-lg font-extrabold">Qué incluye cada uno</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-[13px] sm:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-4 text-left font-semibold text-muted-foreground"><span className="sr-only">Función</span></th>
                <th className="w-[4.5rem] px-1 py-4 text-center sm:w-32 sm:px-3"><span className="block font-extrabold">Gratis</span><span className="text-[11px] font-semibold text-muted-foreground sm:text-xs">RD$0</span></th>
                <th className="w-[5.5rem] bg-[#1d6ff2]/[0.06] px-1 py-4 text-center sm:w-40 sm:px-3"><span className="inline-flex items-center gap-1 font-extrabold text-[#1557c4]"><Crown className="hidden size-4 sm:block" /> <span className="sm:hidden">Empresa</span><span className="hidden sm:inline">Plan Empresa</span></span><span className="block text-[11px] font-semibold text-muted-foreground sm:text-xs">{fmt(PRECIO_PLAN)}/mes</span></th>
              </tr>
            </thead>
            <tbody>
              {FILAS.map((f) => (
                <tr key={f.t} className="border-b border-border last:border-0">
                  <td className="px-3 py-3 sm:px-4 sm:py-3.5">{f.t}</td>
                  <td className="px-1 py-3 text-center sm:px-3"><Celda v={f.gratis} /></td>
                  <td className="bg-[#1d6ff2]/[0.06] px-1 py-3 text-center sm:px-3"><Celda v={f.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Servicios sueltos */}
      <section aria-label="Servicios por separado" className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-border bg-surface p-6">
          <span className="grid size-10 place-items-center rounded-xl bg-[#ffd84d]/30 text-[#6b5000]"><Sparkles className="size-5" /></span>
          <h3 className="mt-3 text-lg font-extrabold">Destacar una vacante</h3>
          <p className="text-2xl font-extrabold">RD$500 <span className="text-sm font-semibold text-muted-foreground">por 7 días</span></p>
          <p className="mt-2 text-sm text-muted-foreground">Sale primero en el listado con la etiqueta Destacada y la compartimos en nuestros canales. Ideal si contratas de vez en cuando.</p>
          {activo ? <p className="mt-4 rounded-xl bg-success/10 p-3 text-sm font-semibold text-success">Con tu plan ya puedes destacar sin pagar aparte.</p>
            : abiertas.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Cuando tengas una vacante publicada podrás destacarla aquí.</p> : (
              <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row">
                <select aria-label="Vacante a destacar" value={vacDestacar} onChange={(x) => setVacDestacar(x.target.value)} className={campoPanel}>
                  <option value="">Elige la vacante…</option>
                  {abiertas.filter((v) => !v.destacada).map((v) => <option key={v.id} value={v.id} disabled={pendiente("destacar", v.id)}>{v.titulo}{pendiente("destacar", v.id) ? " (pedida)" : ""}</option>)}
                </select>
                <button type="button" disabled={!vacDestacar} onClick={() => void p.pedir("destacar", vacDestacar).then((ok) => ok && setVacDestacar(""))} className="h-11 shrink-0 rounded-xl bg-[#0a2f5c] px-5 text-sm font-bold text-white disabled:opacity-40">Pedir destacado</button>
              </div>
            )}
        </div>

        <div className="flex flex-col rounded-2xl border border-border bg-surface p-6">
          <span className="grid size-10 place-items-center rounded-xl bg-[#1d6ff2]/12 text-[#1557c4]"><BadgeCheck className="size-5" /></span>
          <h3 className="mt-3 text-lg font-extrabold">Reclutamiento asistido</h3>
          <p className="text-2xl font-extrabold">RD$5,900 <span className="text-sm font-semibold text-muted-foreground">por puesto cubierto</span></p>
          <p className="mt-2 text-sm text-muted-foreground">Una reclutadora filtra, entrevista y te presenta a los mejores tres. <strong className="text-foreground">Pagas solo si contratas.</strong></p>
          {pendiente("asistido") ? <p className="mt-4 rounded-xl bg-[#1d6ff2]/10 p-3 text-sm font-semibold text-[#1557c4]">Pedido recibido. Te escribimos para conocer el puesto.</p> : (
            <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row">
              <input value={puesto} onChange={(x) => setPuesto(x.target.value)} maxLength={200} placeholder="¿Qué puesto quieres cubrir?" aria-label="Puesto a cubrir" className={campoPanel} />
              <button type="button" disabled={puesto.trim().length < 3} onClick={() => void p.pedir("asistido", undefined, `Puesto: ${puesto}`).then((ok) => ok && setPuesto(""))} className="h-11 shrink-0 rounded-xl bg-[#0a2f5c] px-5 text-sm font-bold text-white disabled:opacity-40">Quiero ayuda</button>
            </div>
          )}
        </div>
      </section>

      {/* Confianza */}
      <section aria-label="Cómo funciona el pago" className="mt-8 rounded-2xl bg-secondary/60 p-6">
        <h2 className="text-lg font-extrabold">Así de simple</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[["Lo pides aquí", "Un toque. No te pedimos tarjeta ni datos de pago."], ["Te escribimos y lo activamos", "Una persona real te contacta por WhatsApp o correo."], ["Pagas después", "Por transferencia o depósito, solo cuando ya está funcionando."]].map(([t, d], i) => (
            <li key={t} className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#0a2f5c] text-sm font-bold text-white">{i + 1}</span><span><span className="block font-bold">{t}</span><span className="text-sm text-muted-foreground">{d}</span></span></li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm font-semibold">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-success" /> Sin contrato ni permanencia</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-success" /> Sin cobros automáticos</span>
          <span className="inline-flex items-center gap-2"><MessageCircle className="size-4 text-success" /> Te atiende una persona</span>
        </div>
      </section>

      <section aria-label="Preguntas frecuentes" className="mt-8">
        <h2 className="text-lg font-extrabold">Preguntas frecuentes</h2>
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {PREGUNTAS.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-bold marker:hidden">{q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

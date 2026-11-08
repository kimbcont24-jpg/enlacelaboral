import { useMemo } from "react";
import { AlertCircle, CalendarClock, ChevronRight, Clock3, Crown, Eye, Plus } from "lucide-react";

import { usePanel } from "@/components/panel/contexto";
import { Coincide, Persona, Vacio } from "@/components/panel/comun";
import { coincidencia, diasPlan, ETAPAS, estadoVacante, planActivo, horaCorta, horasRespuesta, partirMensaje, pendientesDe, textoHoras, type Pendiente } from "@/lib/panel";

const saludo = () => { const h = new Date().getHours(); return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"; };

export function Inicio() {
  const p = usePanel();
  const { candidatos, vacantes } = p;
  const activos = candidatos.filter((c) => c.etapa !== "descartado");
  const pendientes = useMemo(() => pendientesDe(vacantes, candidatos), [vacantes, candidatos]);
  const hoy = new Date();
  const proximas = candidatos.filter((c) => c.etapa === "entrevista" && c.entrevista_at && new Date(c.entrevista_at).getTime() > hoy.getTime() - 3600e3).sort((a, b) => a.entrevista_at!.localeCompare(b.entrevista_at!)).slice(0, 4);
  const h = horasRespuesta(candidatos);
  const nuevos = candidatos.filter((c) => c.etapa === "nuevo");

  // Aplicaciones de los últimos 14 días.
  const dias = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (13 - i));
    const fin = d.getTime() + 864e5;
    return { d, n: candidatos.filter((c) => { const t = new Date(c.created_at).getTime(); return t >= d.getTime() && t < fin; }).length };
  }), [candidatos]);
  const maxDia = Math.max(1, ...dias.map((x) => x.n));
  const semana = dias.slice(7).reduce((a, b) => a + b.n, 0), semanaAntes = dias.slice(0, 7).reduce((a, b) => a + b.n, 0);
  const vistasSemana = Object.values(p.vistas).reduce((a, v) => a + v.semana, 0);
  const pro = planActivo(p.empresa);
  const quedan = diasPlan(p.empresa);
  // Sugerencia honesta: la vacante abierta con menos aplicaciones, si no está destacada.
  const floja = vacantes.filter((v) => estadoVacante(v).id === "activa" && !v.destacada).map((v) => ({ v, n: candidatos.filter((c) => c.vacante_id === v.id).length })).sort((a, b) => a.n - b.n)[0];

  // Mejores perfiles sin revisar: más requisitos encontrados primero.
  const destacados = useMemo(() => nuevos.map((c) => {
    const v = p.vacante(c.vacante_id);
    const m = partirMensaje(c.mensaje);
    return { c, k: v ? coincidencia(`${m.mensaje}\n${m.cv}`, v.requisitos) : null };
  }).filter((x) => x.k && x.k.ok.length > 0).sort((a, b) => b.k!.ok.length / b.k!.total - a.k!.ok.length / a.k!.total).slice(0, 3), [nuevos, p]);

  const resolver = (x: Pendiente) => {
    const v = vacantes.find((y) => y.id === x.vacanteId);
    if (x.tipo === "candidatos") p.ir("candidatos", { etapa: "nuevo", vacante: "" });
    else if (x.tipo === "decidir") p.ir("agenda");
    else if (x.tipo === "entrevista-hoy" && x.candidatoId) p.abrir(x.candidatoId);
    else if (v && x.tipo === "renovar") void p.accionVacante(v, "renovar");
    else if (v && x.tipo === "cerrar") void p.accionVacante(v, "cerrar");
    else if (v && x.tipo === "salario") p.editarVacante(v);
  };

  const resumen = [
    nuevos.length ? `${nuevos.length} ${nuevos.length === 1 ? "candidato nuevo" : "candidatos nuevos"}` : "",
    proximas.filter((c) => new Date(c.entrevista_at!).toDateString() === hoy.toDateString()).length ? `${proximas.filter((c) => new Date(c.entrevista_at!).toDateString() === hoy.toDateString()).length} entrevista(s) hoy` : "",
  ].filter(Boolean).join(" y ");

  if (!vacantes.length) {
    return (
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{saludo()}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight">Empecemos: publica tu primera vacante</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[["Publica gratis", "Llena un formulario corto. Te decimos qué le falta para que se entienda bien."], ["Recibe candidatos aquí", "La gente aplica en Enlace Laboral sin crear cuenta y te llega a este panel con su CV."], ["Elige y avísales", "Mueve a cada persona por etapas y escríbele por WhatsApp con un mensaje ya listo."]].map(([t, d], i) => (
            <div key={t} className="rounded-2xl border border-border bg-surface p-5">
              <span className="grid size-8 place-items-center rounded-full bg-[#1d6ff2] text-sm font-bold text-white">{i + 1}</span>
              <p className="mt-3 font-bold">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => p.ir("publicar")} className="btn-aplicar mt-6 inline-flex h-12 items-center gap-2 rounded-xl px-6"><Plus className="size-4" /> Publicar mi primera vacante</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{saludo()} · {hoy.toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-1 text-balance font-display text-2xl font-extrabold tracking-tight sm:text-[1.75rem]">{resumen ? `Hoy tienes ${resumen}.` : "Todo al día. Buen trabajo."}</h1>
      </div>

      {/* El proceso completo de un vistazo */}
      <section aria-label="Tu proceso de selección" className="overflow-hidden rounded-3xl bg-[#0a2f5c] text-white">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {ETAPAS.filter((e) => e.id !== "descartado").map((e, i) => {
            const gente = activos.filter((c) => c.etapa === e.id);
            const previo = i > 0 ? activos.filter((c) => ETAPAS.findIndex((x) => x.id === c.etapa) >= i - 1).length : 0;
            const llegan = activos.filter((c) => ETAPAS.findIndex((x) => x.id === c.etapa) >= i).length;
            return (
              <button key={e.id} type="button" onClick={() => p.ir("candidatos", { etapa: e.id, vacante: "" })} className={`group relative p-5 text-left transition-colors hover:bg-white/5 sm:p-6 ${i % 2 ? "" : "border-r border-white/10"} ${i < 2 ? "border-b border-white/10 sm:border-b-0" : ""} ${i < 3 ? "sm:border-r sm:border-white/10" : ""}`}>
                <span className="flex items-center gap-2 text-sm font-semibold text-white/70"><span className="size-2 rounded-full" style={{ backgroundColor: e.color === "#5b6b82" ? "#9fb1c9" : e.color }} />{e.label}</span>
                <span className="mt-2 block font-display text-4xl font-extrabold tabular-nums sm:text-5xl">{gente.length}</span>
                <span className="mt-3 flex h-7 items-center">
                  {gente.slice(0, 4).map((c, j) => <span key={c.id} style={{ marginLeft: j ? -8 : 0 }} className="rounded-full ring-2 ring-[#0a2f5c]"><Persona nombre={c.nombre} className="size-7 text-[10px]" /></span>)}
                  {gente.length > 4 && <span className="ml-1.5 text-xs font-semibold text-white/70">+{gente.length - 4}</span>}
                </span>
                {i > 0 && previo > 0 && <span className="absolute right-5 top-5 hidden text-xs font-semibold text-white/50 sm:block">{Math.round((llegan / previo) * 100)}% avanza</span>}
              </button>
            );
          })}
        </div>
      </section>

      {pendientes.length > 0 && (
        <section aria-label="Lo que toca hoy">
          <h2 className="mb-3 text-base font-extrabold">Lo que toca hoy</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {pendientes.slice(0, 7).map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => resolver(x)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary/50">
                  {x.urgente ? <AlertCircle className="size-5 shrink-0 text-[#c27803]" /> : x.tipo === "entrevista-hoy" ? <CalendarClock className="size-5 shrink-0 text-[#1d6ff2]" /> : <span className="size-5 shrink-0 rounded-full border-2 border-border" />}
                  <span className="min-w-0 flex-1 text-sm">{x.texto}</span>
                  <span className="hidden shrink-0 text-sm font-bold text-[#1557c4] sm:inline">{x.accion}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-3" aria-label="Aplicaciones de las últimas dos semanas">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-extrabold">Aplicaciones, últimos 14 días</h2>
            <p className="text-sm text-muted-foreground"><span className="font-bold text-foreground">{semana}</span> esta semana{semanaAntes > 0 ? ` · ${semana >= semanaAntes ? "+" : ""}${semana - semanaAntes} vs. la anterior` : ""}</p>
          </div>
          <div className="mt-5 flex h-32 items-end gap-1.5">
            {dias.map((x, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${x.d.toLocaleDateString("es-DO", { day: "numeric", month: "short" })}: ${x.n}`}>
                {x.n > 0 && <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{x.n}</span>}
                <span className={`w-full rounded-t-md ${i >= 7 ? "bg-[#1d6ff2]" : "bg-[#1d6ff2]/35"}`} style={{ height: `${x.n ? Math.max(6, (x.n / maxDia) * 100) : 2}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>{dias[0]!.d.toLocaleDateString("es-DO", { day: "numeric", month: "short" })}</span><span>Hoy</span></div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-4">
            <div><p className="text-muted-foreground">Respondes en</p><p className="mt-0.5 font-bold">{h === null ? "—" : textoHoras(h)}</p></div>
            <div><p className="text-muted-foreground">Vieron tus vacantes</p><p className="mt-0.5 font-bold tabular-nums">{vistasSemana} <span className="font-normal text-muted-foreground">esta semana</span></p></div>
            <div><p className="text-muted-foreground">Total recibidos</p><p className="mt-0.5 font-bold tabular-nums">{candidatos.length}</p></div>
            <div><p className="text-muted-foreground">Contratados</p><p className="mt-0.5 font-bold tabular-nums">{candidatos.filter((c) => c.etapa === "contratado").length}</p></div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2" aria-label="Próximas entrevistas">
          <div className="flex items-center justify-between"><h2 className="text-base font-extrabold">Próximas entrevistas</h2><button type="button" onClick={() => p.ir("agenda")} className="text-sm font-bold text-[#1557c4]">Ver agenda</button></div>
          {proximas.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No tienes entrevistas agendadas. Cuando invites a alguien, elige fecha y hora y aparece aquí.</p> : (
            <ul className="mt-3 space-y-2">
              {proximas.map((c) => (
                <li key={c.id}><button type="button" onClick={() => p.abrir(c.id)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-secondary/60">
                  <span className="w-14 shrink-0 rounded-lg bg-[#c27803]/10 py-1.5 text-center leading-tight text-[#8a5200]"><span className="block text-[10px] font-bold uppercase">{new Date(c.entrevista_at!).toLocaleDateString("es-DO", { weekday: "short" })}</span><span className="block text-lg font-extrabold">{new Date(c.entrevista_at!).getDate()}</span></span>
                  <span className="min-w-0"><span className="block truncate font-bold">{c.nombre}</span><span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" /> {horaCorta(c.entrevista_at!)} · {p.puesto(c.vacante_id)}</span></span>
                </button></li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {pro && quedan !== null && quedan <= 5 ? (
        <button type="button" onClick={() => p.ir("planes")} className="flex w-full items-center gap-4 rounded-2xl border border-[#e0b400]/50 bg-[#ffd84d]/15 p-4 text-left">
          <Crown className="size-6 shrink-0 text-[#a37f00]" />
          <span className="min-w-0 flex-1 text-sm"><span className="block font-extrabold">Tu Plan Empresa termina en {quedan === 1 ? "1 día" : `${quedan} días`}</span><span className="text-muted-foreground">Después vuelves a Gratis sin perder nada. Si quieres seguir, avísanos desde aquí.</span></span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </button>
      ) : !pro && floja && floja.n < 5 ? (
        <button type="button" onClick={() => p.ir("planes")} className="flex w-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-left hover:border-[#e0b400]">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#ffd84d]/30 text-[#6b5000]"><Eye className="size-5" /></span>
          <span className="min-w-0 flex-1 text-sm"><span className="block font-extrabold">«{floja.v.titulo}» tiene {floja.n === 0 ? "pocas aplicaciones" : `${floja.n} ${floja.n === 1 ? "aplicación" : "aplicaciones"}`}{p.vistas[floja.v.id]?.total ? ` y ${p.vistas[floja.v.id]!.total} vistas` : ""}</span><span className="text-muted-foreground">Destacada sale primero en el listado y la compartimos en nuestros canales. {p.empresa.prueba_usada ? "Desde RD$500." : "Pruébalo 14 días gratis."}</span></span>
          <span className="hidden shrink-0 text-sm font-bold text-[#1557c4] sm:inline">Ver opciones</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </button>
      ) : null}

      {destacados.length > 0 && (
        <section aria-label="Perfiles que más coinciden">
          <h2 className="mb-3 text-base font-extrabold">Sin revisar que más se acercan a lo que pides</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {destacados.map(({ c, k }) => (
              <button key={c.id} type="button" onClick={() => p.abrir(c.id)} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left hover:border-[#1d6ff2]">
                <Persona nombre={c.nombre} />
                <span className="min-w-0"><span className="block truncate font-bold">{c.nombre}</span><span className="block truncate text-xs text-muted-foreground">{p.puesto(c.vacante_id)}</span><span className="mt-1 block"><Coincide ok={k!.ok.length} total={k!.total} /></span></span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section aria-label="Cómo va cada vacante">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-extrabold">Cómo va cada vacante</h2><button type="button" onClick={() => p.ir("vacantes")} className="text-sm font-bold text-[#1557c4]">Ver todas</button></div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[34rem] text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="px-4 py-3 font-semibold">Vacante</th><th className="px-3 py-3 font-semibold">Estado</th><th className="px-3 py-3 font-semibold">Proceso</th><th className="px-3 py-3 text-right font-semibold">Vistas</th><th className="px-3 py-3 text-right font-semibold">Candidatos</th></tr></thead>
            <tbody>
              {vacantes.filter((v) => estadoVacante(v).id !== "cerrada").slice(0, 8).map((v) => {
                const suyos = candidatos.filter((c) => c.vacante_id === v.id);
                const e = estadoVacante(v);
                return (
                  <tr key={v.id} onClick={() => p.ir("candidatos", { vacante: v.id, etapa: "" })} className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="max-w-[16rem] truncate px-4 py-3 font-semibold">{v.titulo}</td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${e.tono}`}>{e.label}</span></td>
                    <td className="px-3 py-3"><Barra candidatos={suyos} /></td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{p.vistas[v.id]?.total ?? 0}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">{suyos.length}{suyos.some((c) => c.etapa === "nuevo") && <span className="ml-1.5 rounded-full bg-[#1d6ff2] px-1.5 text-[10px] text-white">{suyos.filter((c) => c.etapa === "nuevo").length}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/** Barra apilada con cuántas personas hay en cada etapa. */
export function Barra({ candidatos }: { candidatos: { etapa: string }[] }) {
  if (!candidatos.length) return <span className="text-xs text-muted-foreground">Sin candidatos aún</span>;
  return (
    <span className="flex h-2 w-32 overflow-hidden rounded-full bg-muted" role="img" aria-label={ETAPAS.map((e) => `${e.label}: ${candidatos.filter((c) => c.etapa === e.id).length}`).join(", ")}>
      {ETAPAS.map((e) => { const n = candidatos.filter((c) => c.etapa === e.id).length; return n ? <span key={e.id} style={{ width: `${(n / candidatos.length) * 100}%`, backgroundColor: e.color }} /> : null; })}
    </span>
  );
}

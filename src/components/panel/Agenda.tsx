import { CalendarPlus, MapPin } from "lucide-react";

import { usePanel } from "@/components/panel/contexto";
import { Persona, Titulo, Vacio } from "@/components/panel/comun";
import { horaCorta, type Candidato } from "@/lib/panel";

const inicioDia = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

export function Agenda() {
  const p = usePanel();
  const en = p.candidatos.filter((c) => c.etapa === "entrevista");
  const ahora = Date.now(), hoy = inicioDia(new Date());
  const conFecha = en.filter((c) => c.entrevista_at).sort((a, b) => a.entrevista_at!.localeCompare(b.entrevista_at!));
  const pasadas = conFecha.filter((c) => new Date(c.entrevista_at!).getTime() < ahora - 3600e3);
  const futuras = conFecha.filter((c) => !pasadas.includes(c));
  const sinFecha = en.filter((c) => !c.entrevista_at);

  const grupos = new Map<string, Candidato[]>();
  for (const c of futuras) {
    const d = inicioDia(new Date(c.entrevista_at!));
    const k = d === hoy ? "Hoy" : d === hoy + 864e5 ? "Mañana" : new Date(c.entrevista_at!).toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" });
    grupos.set(k, [...(grupos.get(k) ?? []), c]);
  }

  if (!en.length) {
    return (
      <>
        <Titulo titulo="Entrevistas" />
        <Vacio titulo="Tu agenda está libre" texto="Cuando invites a alguien a entrevista, eliges día y hora y le llega la invitación por WhatsApp. Aquí verás todas tus citas en orden." >
          <button type="button" onClick={() => p.ir("candidatos")} className="btn-aplicar h-11 rounded-xl px-5">Ver candidatos</button>
        </Vacio>
      </>
    );
  }

  return (
    <>
      <Titulo titulo="Entrevistas" sub={`${futuras.length} próximas${pasadas.length ? ` · ${pasadas.length} esperan tu decisión` : ""}`} />
      <div className="space-y-7">
        {pasadas.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-extrabold text-[#8a5200]">Ya entrevistadas: ¿siguen o no?</h2>
            <ul className="space-y-2">{pasadas.map((c) => <Fila key={c.id} c={c} decidir />)}</ul>
          </section>
        )}
        {[...grupos].map(([dia, cs]) => (
          <section key={dia}>
            <h2 className="mb-2 text-sm font-extrabold first-letter:uppercase">{dia}</h2>
            <ul className="space-y-2">{cs.map((c) => <Fila key={c.id} c={c} />)}</ul>
          </section>
        ))}
        {sinFecha.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-extrabold">En entrevista, sin fecha</h2>
            <ul className="space-y-2">{sinFecha.map((c) => <Fila key={c.id} c={c} />)}</ul>
          </section>
        )}
      </div>
    </>
  );
}

function Fila({ c, decidir = false }: { c: Candidato; decidir?: boolean }) {
  const p = usePanel();
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 sm:flex-nowrap">
      <span className="w-16 shrink-0 text-center">
        {c.entrevista_at ? <span className="block rounded-lg bg-[#c27803]/10 px-1 py-1.5 text-sm font-extrabold tabular-nums text-[#8a5200]">{horaCorta(c.entrevista_at)}</span> : <span className="text-xs text-muted-foreground">Sin hora</span>}
      </span>
      <button type="button" onClick={() => p.abrir(c.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <Persona nombre={c.nombre} className="size-9 text-xs" />
        <span className="min-w-0">
          <span className="block truncate font-bold">{c.nombre}</span>
          <span className="block truncate text-xs text-muted-foreground">{p.puesto(c.vacante_id)}</span>
          {c.entrevista_lugar && <span className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="size-3 shrink-0" />{c.entrevista_lugar}</span>}
        </span>
      </button>
      <span className="flex w-full gap-2 sm:w-auto">
        {decidir ? (
          <>
            <button type="button" onClick={() => void p.mover(c, "contratado")} className="h-10 flex-1 rounded-xl bg-success px-4 text-sm font-bold text-white sm:flex-none">Contratar</button>
            <button type="button" onClick={() => void p.mover(c, "descartado")} className="h-10 flex-1 rounded-xl border border-border px-4 text-sm font-bold sm:flex-none">No sigue</button>
          </>
        ) : (
          <button type="button" onClick={() => p.agendar(c)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold hover:border-primary sm:flex-none"><CalendarPlus className="size-4" /> {c.entrevista_at ? "Mover cita" : "Poner fecha"}</button>
        )}
      </span>
    </li>
  );
}

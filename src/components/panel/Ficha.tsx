import { useEffect, useRef, useState } from "react";
import { CalendarClock, CalendarPlus, Check, ChevronLeft, ChevronRight, Copy, Mail, MapPin, MessageCircle, Phone, X } from "lucide-react";
import { toast } from "sonner";

import { usePanel } from "@/components/panel/contexto";
import { Coincide, Estrellas, EtapaPill, Persona } from "@/components/panel/comun";
import { claveContacto, coincidencia, correoDe, descargarIcs, enlaceGoogleCalendar, ETAPAS, fechaLarga, horaCorta, partirMensaje, telefono, type Candidato, type Etapa } from "@/lib/panel";
import { hace } from "@/lib/vacantes";

export function Ficha({ id, onCerrar, onOtro }: { id: string; onCerrar: () => void; onOtro: (id: string) => void }) {
  const p = usePanel();
  const c = p.candidatos.find((x) => x.id === id);
  const cerrar = useRef<HTMLButtonElement>(null);
  const [nota, setNota] = useState(c?.nota ?? "");

  useEffect(() => { setNota(c?.nota ?? ""); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    cerrar.current?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", tecla); document.body.style.overflow = antes; };
  }, [onCerrar]);

  if (!c) return null;
  const v = p.vacante(c.vacante_id);
  const puesto = p.puesto(c.vacante_id);
  const m = partirMensaje(c.mensaje);
  const k = v ? coincidencia(`${m.mensaje}\n${m.cv}`, v.requisitos) : null;
  const tel = telefono(c.contacto);
  const correo = correoDe(c.contacto);
  const otras = p.candidatos.filter((x) => x.id !== c.id && claveContacto(x.contacto) === claveContacto(c.contacto));

  // Anterior / siguiente dentro de la misma vacante y etapa.
  const hermanos = p.candidatos.filter((x) => x.vacante_id === c.vacante_id && x.etapa === c.etapa);
  const i = hermanos.findIndex((x) => x.id === c.id);

  const copiar = async (t: string) => { try { await navigator.clipboard.writeText(t); toast.success("Copiado"); } catch { toast.error("No se pudo copiar"); } };
  const indice = ETAPAS.findIndex((e) => e.id === c.etapa);
  const linea = [{ t: c.created_at, texto: `Aplicó a ${puesto}` }, ...c.historial.map((h) => ({ t: h.t, texto: h.texto }))].reverse();

  const elegir = (e: Etapa) => { if (e === "entrevista" && c.etapa !== "entrevista") p.agendar(c); else void p.mover(c, e); };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label={`Ficha de ${c.nombre}`}>
      <button type="button" aria-label="Cerrar" tabIndex={-1} onClick={onCerrar} className="absolute inset-0 bg-[#0a1a33]/40 backdrop-blur-[2px]" />
      <aside className="ficha-entra relative flex h-full w-full max-w-xl flex-col bg-background shadow-2xl">
        <header className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
          <button ref={cerrar} type="button" onClick={onCerrar} aria-label="Cerrar ficha" className="grid size-9 place-items-center rounded-lg hover:bg-muted"><X className="size-5" /></button>
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{puesto}</span>
          {hermanos.length > 1 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <button type="button" disabled={i <= 0} onClick={() => onOtro(hermanos[i - 1]!.id)} aria-label="Anterior" className="grid size-8 place-items-center rounded-lg hover:bg-muted disabled:opacity-30"><ChevronLeft className="size-4" /></button>
              {i + 1} de {hermanos.length}
              <button type="button" disabled={i >= hermanos.length - 1} onClick={() => onOtro(hermanos[i + 1]!.id)} aria-label="Siguiente" className="grid size-8 place-items-center rounded-lg hover:bg-muted disabled:opacity-30"><ChevronRight className="size-4" /></button>
            </span>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          <section className="bg-surface px-5 pb-5 pt-5">
            <div className="flex items-start gap-4">
              <Persona nombre={c.nombre} className="size-14 text-lg" />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-extrabold leading-tight">{c.nombre}</h2>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><EtapaPill etapa={c.etapa} /> aplicó {hace(c.created_at)}</p>
                <div className="mt-2"><Estrellas valor={c.puntaje} tam="size-5" onCambio={(n) => void p.actualizar(c, { puntaje: n })} /></div>
              </div>
            </div>
            <button type="button" onClick={() => void copiar(c.contacto)} className="mt-4 flex w-full items-center justify-between rounded-xl border border-border px-3.5 py-2.5 text-left text-sm font-semibold hover:border-primary"><span className="break-all">{c.contacto}</span><Copy className="ml-2 size-4 shrink-0 text-muted-foreground" /></button>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {tel ? <button type="button" onClick={() => p.contactar(c)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1fa855] text-sm font-bold text-white hover:bg-[#178c46]"><MessageCircle className="size-4" /> WhatsApp</button>
                : correo ? <button type="button" onClick={() => p.contactar(c)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0a2f5c] text-sm font-bold text-white"><Mail className="size-4" /> Correo</button>
                : <span className="grid h-11 place-items-center rounded-xl bg-muted text-xs text-muted-foreground">Sin contacto</span>}
              {tel ? <a href={`tel:+${tel}`} onClick={() => { if (c.etapa === "nuevo") void p.mover(c, "revision", { silencioso: true }); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold hover:border-primary"><Phone className="size-4" /> Llamar</a> : <span />}
              <button type="button" onClick={() => p.agendar(c)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold hover:border-primary"><CalendarPlus className="size-4" /> {c.entrevista_at ? "Cambiar cita" : "Entrevista"}</button>
            </div>
          </section>

          <section className="border-y border-border bg-surface px-5 py-4" aria-label="Etapa">
            <ol className="flex items-center">
              {ETAPAS.filter((e) => e.id !== "descartado").map((e, j) => {
                const hecho = c.etapa !== "descartado" && j <= indice;
                return (
                  <li key={e.id} className="flex flex-1 items-center last:flex-none">
                    <button type="button" onClick={() => elegir(e.id)} className="group flex flex-col items-center gap-1" aria-current={c.etapa === e.id ? "step" : undefined}>
                      <span className={`grid size-8 place-items-center rounded-full border-2 text-xs font-bold transition-colors ${hecho ? "text-white" : "border-border bg-surface text-muted-foreground group-hover:border-primary"}`} style={hecho ? { backgroundColor: e.color, borderColor: e.color } : undefined}>{hecho && j < indice ? <Check className="size-4" /> : j + 1}</span>
                      <span className={`text-[11px] font-semibold ${c.etapa === e.id ? "text-foreground" : "text-muted-foreground"}`}>{e.accion}</span>
                    </button>
                    {j < 3 && <span className={`mx-1 mb-5 h-0.5 flex-1 rounded ${c.etapa !== "descartado" && j < indice ? "bg-[#1d6ff2]" : "bg-border"}`} />}
                  </li>
                );
              })}
            </ol>
            <button type="button" onClick={() => elegir(c.etapa === "descartado" ? "revision" : "descartado")} className="mt-3 text-sm font-semibold text-muted-foreground hover:text-destructive hover:underline">{c.etapa === "descartado" ? "Volver a considerar" : "Descartar a esta persona"}</button>
          </section>

          {c.entrevista_at && (
            <section className="mx-5 mt-5 rounded-2xl border border-[#c27803]/30 bg-[#c27803]/5 p-4">
              <p className="flex items-center gap-2 text-sm font-extrabold text-[#8a5200]"><CalendarClock className="size-4" /> Entrevista: {fechaLarga(c.entrevista_at)}, {horaCorta(c.entrevista_at)}</p>
              {c.entrevista_lugar && <p className="mt-1 flex items-start gap-1.5 text-sm"><MapPin className="mt-0.5 size-3.5 shrink-0" /> {c.entrevista_lugar}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
                <a href={enlaceGoogleCalendar(c, puesto) ?? "#"} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-surface px-3 py-1.5 hover:underline">Google Calendar</a>
                <button type="button" onClick={() => descargarIcs(c, puesto)} className="rounded-lg bg-surface px-3 py-1.5 hover:underline">Outlook / iPhone</button>
              </div>
            </section>
          )}

          {k && (
            <section className="px-5 pt-5" aria-label="Requisitos">
              <h3 className="flex items-center gap-2 text-sm font-extrabold">Requisitos de la vacante <Coincide ok={k.ok.length} total={k.total} /></h3>
              <p className="mt-1 text-xs text-muted-foreground">Marcamos los requisitos cuyas palabras aparecen en lo que envió. Revísalo tú: es una ayuda, no una decisión.</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {k.ok.map((r) => <li key={r} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" /> {r}</li>)}
                {k.falta.map((r) => <li key={r} className="flex items-start gap-2 text-muted-foreground"><span className="mt-1.5 size-2 shrink-0 rounded-full border border-current" /> {r}</li>)}
              </ul>
            </section>
          )}

          {m.mensaje && (
            <section className="px-5 pt-5">
              <h3 className="text-sm font-extrabold">Su mensaje</h3>
              <p className="mt-2 whitespace-pre-line rounded-xl bg-surface p-3.5 text-sm">{m.mensaje}</p>
            </section>
          )}

          <section className="px-5 pt-5">
            <h3 className="text-sm font-extrabold">CV</h3>
            {m.cv ? <Cv texto={m.cv} /> : <p className="mt-2 text-sm text-muted-foreground">Esta persona no adjuntó CV. Puedes pedírselo por WhatsApp.</p>}
          </section>

          {otras.length > 0 && (
            <section className="px-5 pt-5">
              <h3 className="text-sm font-extrabold">También aplicó a</h3>
              <ul className="mt-2 space-y-1.5">{otras.map((o) => <li key={o.id}><button type="button" onClick={() => onOtro(o.id)} className="flex w-full items-center justify-between rounded-xl bg-surface px-3.5 py-2.5 text-left text-sm hover:bg-secondary"><span className="font-semibold">{p.puesto(o.vacante_id)}</span><EtapaPill etapa={o.etapa} /></button></li>)}</ul>
            </section>
          )}

          <section className="px-5 pt-5">
            <label htmlFor="ficha-nota" className="text-sm font-extrabold">Nota privada</label>
            <textarea id="ficha-nota" value={nota} onChange={(e) => setNota(e.target.value)} onBlur={() => { if (nota.trim() !== (c.nota ?? "")) void p.actualizar(c, { nota: nota.trim() || null }).then((ok) => ok && toast.success("Nota guardada")); }} rows={3} maxLength={2000} placeholder="Solo la ves tú. Ej.: Disponible desde el lunes, pide RD$30,000." className="mt-2 w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm" />
          </section>

          <section className="px-5 pb-8 pt-5">
            <h3 className="text-sm font-extrabold">Historial</h3>
            <ol className="mt-3 space-y-3 border-l-2 border-border pl-4">
              {linea.map((h, j) => (
                <li key={j} className="relative text-sm">
                  <span className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full border-2 border-background bg-[#1d6ff2]" />
                  <span className="font-semibold">{h.texto}</span>
                  <span className="block text-xs text-muted-foreground">{new Date(h.t).toLocaleString("es-DO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}

/** Muestra el CV que arma Enlace Laboral con sus secciones separadas. */
function Cv({ texto }: { texto: string }) {
  const lineas = texto.split("\n");
  const titulos = new Set(["Experiencia", "Formación"]);
  return (
    <div className="mt-2 space-y-1 rounded-xl bg-surface p-4 text-sm">
      {lineas.map((l, i) => {
        const t = l.trim();
        if (!t) return <div key={i} className="h-2" />;
        if (i === 0) return <p key={i} className="text-base font-extrabold">{t}</p>;
        if (titulos.has(t)) return <p key={i} className="pt-2 text-xs font-extrabold text-[#1557c4]">{t}</p>;
        if (/^(Habilidades|Idiomas):/.test(t)) { const [a, ...b] = t.split(":"); return <p key={i} className="pt-1"><span className="font-bold">{a}:</span>{b.join(":")}</p>; }
        if (t.startsWith("•")) return <p key={i} className="font-semibold">{t.slice(1).trim()}</p>;
        return <p key={i} className="text-muted-foreground">{t}</p>;
      })}
    </div>
  );
}

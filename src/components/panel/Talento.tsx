import { useEffect, useState } from "react";
import { Briefcase, Car, Clock, GraduationCap, Languages, Link2, Loader2, MapPin, Search, Send, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { usePanel } from "@/components/panel/contexto";
import { campoPanel, Persona, Titulo } from "@/components/panel/comun";
import { supabase } from "@/integrations/supabase/client";
import type { Talento as Perfil } from "@/integrations/supabase/types";
import { provincias } from "@/lib/data";
import { estadoVacante, planActivo } from "@/lib/panel";

const LIMITE_GRATIS = 5;
type Enviada = { id: string; candidato_id: string; vacante_id: string; estado: string; created_at: string };

/** Banco de talento: personas que pidieron que las empresas las encuentren. La empresa las invita a aplicar; ellas deciden. */
export function Talento() {
  const p = usePanel();
  const pro = planActivo(p.empresa);
  const [q, setQ] = useState("");
  const [prov, setProv] = useState("");
  const [lista, setLista] = useState<Perfil[] | null>(null);
  const [enviadas, setEnviadas] = useState<Enviada[]>([]);
  const [invitar, setInvitar] = useState<Perfil | null>(null);
  const abiertas = p.vacantes.filter((v) => estadoVacante(v).id === "activa");
  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const usadas = enviadas.filter((e) => new Date(e.created_at) >= inicioMes).length;
  const quedan = Math.max(0, LIMITE_GRATIS - usadas);

  const buscar = async (texto = q, provincia = prov) => {
    setLista(null);
    const { data, error } = await supabase.rpc("talento_buscar", { p_q: texto.trim() || null, p_provincia: provincia || null });
    if (error) { toast.error("No se pudo buscar. Intenta otra vez."); setLista([]); return; }
    setLista(data ?? []);
  };
  const cargarEnviadas = async () => {
    const { data } = await supabase.from("invitaciones").select("id,candidato_id,vacante_id,estado,created_at").eq("owner_id", p.uid).order("created_at", { ascending: false }).limit(200);
    setEnviadas((data ?? []) as Enviada[]);
  };
  useEffect(() => { void buscar("", ""); void cargarEnviadas(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const aceptadas = enviadas.filter((e) => e.estado === "aceptada").length;

  return (
    <>
      <Titulo titulo="Buscar talento" sub="Personas que pidieron que las empresas las encuentren. Invítalas a tu vacante y ellas deciden si aplican." />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-2xl bg-[#0a2f5c] p-4 text-white sm:col-span-2">
          <Link2 className="mt-0.5 size-5 shrink-0 text-[#8ec1ff]" />
          <p className="text-sm text-white/85"><strong className="text-white">Así funciona el enlace:</strong> ves su experiencia sin sus datos de contacto. Le envías una invitación. Si acepta, aparece en tus Candidatos con su CV, teléfono o correo. Nadie recibe mensajes que no pidió.</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
          {pro ? <p><strong>Invitaciones sin límite</strong> con tu Plan Empresa.</p> : <p><strong className="text-lg tabular-nums">{quedan}</strong> de {LIMITE_GRATIS} invitaciones gratis este mes. <button type="button" onClick={() => p.ir("planes")} className="font-bold text-[#1557c4]">Sin límite con el plan</button></p>}
          {enviadas.length > 0 && <p className="mt-1 text-muted-foreground">Enviaste {enviadas.length} · {aceptadas} {aceptadas === 1 ? "aceptó" : "aceptaron"}</p>}
        </div>
      </section>

      <form onSubmit={(e) => { e.preventDefault(); void buscar(); }} className="mb-5 grid gap-2 sm:grid-cols-[1fr_14rem_auto]">
        <label className="relative">
          <span className="sr-only">Buscar por puesto o habilidad</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Puesto o habilidad: cajera, Excel, chofer…" className={`${campoPanel} pl-9`} />
        </label>
        <select value={prov} onChange={(e) => { setProv(e.target.value); void buscar(q, e.target.value); }} aria-label="Provincia" className={campoPanel}>
          <option value="">Todo el país</option>
          {provincias.filter((x) => x !== "Toda República Dominicana").map((x) => <option key={x}>{x}</option>)}
        </select>
        <button type="submit" className="h-11 rounded-xl bg-[#0a2f5c] px-5 text-sm font-bold text-white">Buscar</button>
      </form>

      {lista === null ? <div className="grid place-items-center py-16"><Loader2 className="size-6 animate-spin text-[#1d6ff2]" /></div>
        : lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="font-extrabold">{q || prov ? "Nadie coincide con esa búsqueda todavía" : "El banco de talento se está llenando"}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Cada día más personas guardan su CV en Enlace Laboral y piden que las encuentren. Mientras tanto, tus vacantes publicadas siguen recibiendo aplicaciones.</p>
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {lista.map((t) => {
              const inv = enviadas.find((e) => e.candidato_id === t.id);
              return (
                <li key={t.id} className="flex flex-col rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-start gap-3">
                    <Persona nombre={t.nombre} />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold">{t.nombre}</p>
                      <p className="truncate text-sm font-semibold text-[#1557c4]">{t.puesto || "Abierto a oportunidades"}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">{t.ciudad && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{t.ciudad}</span>}<span className="inline-flex items-center gap-1"><Clock className="size-3" />CV al día {new Date(t.actualizado).toLocaleDateString("es-DO", { day: "numeric", month: "short" })}</span></p>
                    </div>
                  </div>
                  {t.resumen && <p className="mt-3 line-clamp-3 text-sm text-foreground/85">{t.resumen}</p>}
                  {t.experiencia.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {t.experiencia.slice(0, 3).map((x, i) => <li key={i} className="flex items-start gap-2"><Briefcase className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /><span><strong>{x.puesto}</strong>{x.empresa ? ` · ${x.empresa}` : ""}{x.desde ? <span className="text-muted-foreground"> ({x.desde}–{x.hasta || "hoy"})</span> : null}</span></li>)}
                    </ul>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[12px]">
                    {t.educacion[0] && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1"><GraduationCap className="size-3" />{t.educacion[0].titulo}</span>}
                    {t.idiomas && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1"><Languages className="size-3" />{t.idiomas.slice(0, 40)}</span>}
                    {t.licencia && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1"><Car className="size-3" />Licencia {t.licencia}</span>}
                    {t.disponibilidad && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1"><Clock className="size-3" />{t.disponibilidad}</span>}
                    {t.habilidades?.split(/[,;\n]/).map((h) => h.trim()).filter(Boolean).slice(0, 4).map((h) => <span key={h} className="rounded-full border border-border px-2 py-1">{h}</span>)}
                  </div>
                  <div className="mt-auto pt-4">
                    {inv ? <p className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${inv.estado === "aceptada" ? "bg-success/10 text-success" : inv.estado === "rechazada" ? "bg-muted text-muted-foreground" : "bg-[#1d6ff2]/10 text-[#1557c4]"}`}>{inv.estado === "aceptada" ? "Aceptó: ya está en tus Candidatos" : inv.estado === "rechazada" ? "Por ahora no le interesa" : `Invitada a «${p.puesto(inv.vacante_id)}». Esperando respuesta.`}</p>
                      : <button type="button" onClick={() => (abiertas.length ? setInvitar(t) : toast.error("Publica una vacante primero para poder invitar."))} disabled={!pro && quedan === 0} className="btn-aplicar inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm disabled:opacity-50"><Send className="size-4" /> Invitar a aplicar</button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

      {invitar && <Invitar t={invitar} onCerrar={() => setInvitar(null)} onListo={() => { setInvitar(null); void cargarEnviadas(); }} />}
    </>
  );
}

function Invitar({ t, onCerrar, onListo }: { t: Perfil; onCerrar: () => void; onListo: () => void }) {
  const p = usePanel();
  const abiertas = p.vacantes.filter((v) => estadoVacante(v).id === "activa");
  const [vac, setVac] = useState(abiertas[0]?.id ?? "");
  const nombre = t.nombre.split(" ")[0];
  const [msg, setMsg] = useState(`Hola ${nombre}, vimos tu perfil en Enlace Laboral y creemos que encajas en esta vacante. Nos gustaría que apliques.`);
  const [enviando, setEnviando] = useState(false);
  const enviar = async () => {
    setEnviando(true);
    const { error } = await supabase.rpc("invitar_candidato", { p_candidato: t.id, p_vacante: vac, p_mensaje: msg });
    setEnviando(false);
    if (error) return void toast.error(error.message.includes("limite") ? "Usaste tus 5 invitaciones gratis de este mes." : error.message.includes("duplicate") || error.message.includes("unique") ? "Ya invitaste a esta persona a esa vacante." : "No se pudo enviar. Intenta otra vez.");
    toast.success(`Invitación enviada a ${nombre}. Si acepta, llega a tus Candidatos.`);
    onListo();
  };
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end sm:place-items-center" role="dialog" aria-modal="true" aria-label={`Invitar a ${t.nombre}`}>
      <button type="button" tabIndex={-1} aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 bg-[#0a1a33]/55" />
      <div className="relative w-full max-w-lg rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-sm text-muted-foreground">Invitar a aplicar</p><h2 className="text-xl font-extrabold">{t.nombre}</h2></div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid size-9 place-items-center rounded-lg hover:bg-muted"><X className="size-5" /></button>
        </div>
        <label className="mt-4 block"><span className="mb-1 block text-sm font-bold">A qué vacante</span>
          <select value={vac} onChange={(e) => setVac(e.target.value)} className={campoPanel}>{abiertas.map((v) => <option key={v.id} value={v.id}>{v.titulo}</option>)}</select>
        </label>
        <label className="mt-3 block"><span className="mb-1 block text-sm font-bold">Tu mensaje</span>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} maxLength={600} className={`${campoPanel} h-auto py-3`} />
        </label>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" /> {nombre} ve tu empresa, la vacante y tu mensaje en «Mi búsqueda». Sus datos te llegan solo si acepta.</p>
        <button type="button" disabled={!vac || enviando} onClick={() => void enviar()} className="btn-aplicar mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl">{enviando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Enviar invitación</button>
      </div>
    </div>
  );
}

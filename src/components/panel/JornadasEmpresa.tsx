import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Download, ExternalLink, Loader2, MapPin, MessageCircle, Plus, Share2, Users, X } from "lucide-react";
import { toast } from "sonner";

import { usePanel } from "@/components/panel/contexto";
import { campoPanel, Persona, Titulo, Vacio } from "@/components/panel/comun";
import { supabase } from "@/integrations/supabase/client";
import { provincias } from "@/lib/data";
import { cuandoJornada, faltan } from "@/lib/jornadas";
import { descargarCsv, partirMensaje, planActivo, telefono } from "@/lib/panel";
import { SITIO } from "@/lib/vacantes";

type Fila = { id: string; titulo: string; descripcion: string | null; fecha: string; hasta: string | null; lugar: string; provincia: string; puestos: string[]; llevar: string | null; cupo: number | null; estado: string; created_at: string };
type Inscrito = { id: string; jornada_id: string; nombre: string; contacto: string; puesto: string | null; mensaje: string | null; asistio: boolean | null; created_at: string };

const pasada = (j: Pick<Fila, "fecha" | "hasta">) => new Date(j.hasta ?? new Date(new Date(j.fecha).getTime() + 6 * 3600e3)).getTime() < Date.now();

/** Jornadas de reclutamiento: la empresa entrevista en persona a quienes se apuntan con su CV. */
export function JornadasEmpresa() {
  const p = usePanel();
  const [lista, setLista] = useState<Fila[] | null>(null);
  const [inscritos, setInscritos] = useState<Inscrito[]>([]);
  const [vista, setVista] = useState<"lista" | "nueva" | string>("lista");

  const cargar = useCallback(async () => {
    const { data } = await supabase.from("jornadas").select("*").eq("owner_id", p.uid).order("fecha", { ascending: false }).limit(100);
    const js = (data ?? []) as Fila[];
    setLista(js);
    if (js.length) {
      const { data: ins } = await supabase.from("inscripciones_jornada").select("*").in("jornada_id", js.map((j) => j.id)).order("created_at", { ascending: false }).limit(5000);
      setInscritos((ins ?? []) as Inscrito[]);
    }
  }, [p.uid]);
  useEffect(() => { void cargar(); }, [cargar]);

  if (lista === null) return <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-[#1d6ff2]" /></div>;
  if (vista === "nueva") return <NuevaJornada onListo={() => { setVista("lista"); void cargar(); }} onCancelar={() => setVista("lista")} />;
  const sel = lista.find((j) => j.id === vista);
  if (sel) return <Inscritos j={sel} filas={inscritos.filter((i) => i.jornada_id === sel.id)} onVolver={() => setVista("lista")} onCambio={(i) => setInscritos((xs) => xs.map((x) => (x.id === i.id ? i : x)))} onCancelar={async () => { await supabase.from("jornadas").update({ estado: "cancelada" }).eq("id", sel.id); toast.success("Jornada cancelada."); setVista("lista"); void cargar(); }} />;

  const proximas = lista.filter((j) => !pasada(j) && j.estado !== "cancelada");
  const pasadas = lista.filter((j) => pasada(j) || j.estado === "cancelada");
  const activas = proximas.length;
  const puedeCrear = planActivo(p.empresa) || activas < 1;

  return (
    <>
      <Titulo titulo="Jornadas de empleo" sub="Entrevista en persona a mucha gente en un solo día. Se apuntan con su CV y te llegan aquí.">
        <button type="button" onClick={() => (puedeCrear ? setVista("nueva") : toast.error("En Gratis puedes tener 1 jornada próxima. Con el Plan Empresa, sin límite."))} className="btn-aplicar inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm"><Plus className="size-4" /> Nueva jornada</button>
      </Titulo>
      {lista.length === 0 ? (
        <Vacio titulo="Organiza tu primera jornada" texto="Pon fecha, lugar y puestos. La publicamos en Enlace Laboral, la gente se apunta con su CV y tú sabes cuántos van a llegar.">
          <button type="button" onClick={() => setVista("nueva")} className="btn-aplicar h-12 rounded-xl px-6">Crear jornada</button>
        </Vacio>
      ) : (
        <div className="space-y-8">
          {[["Próximas", proximas], ["Pasadas y canceladas", pasadas]].map(([t, js]) => (js as Fila[]).length > 0 && (
            <section key={t as string}>
              <h2 className="mb-3 text-base font-extrabold">{t as string}</h2>
              <ul className="grid gap-4 lg:grid-cols-2">
                {(js as Fila[]).map((j) => {
                  const ins = inscritos.filter((i) => i.jornada_id === j.id);
                  return (
                    <li key={j.id}>
                      <button type="button" onClick={() => setVista(j.id)} className="flex w-full flex-col rounded-2xl border border-border bg-surface p-5 text-left hover:border-[#1d6ff2]">
                        <div className="flex flex-wrap items-center gap-2">
                          {j.estado === "revision" ? <span className="rounded-full bg-[#c27803]/12 px-2 py-0.5 text-[11px] font-bold text-[#8a5200]">En revisión</span> : j.estado === "cancelada" ? <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">Cancelada</span> : pasada(j) ? <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold">Terminó</span> : <span className="rounded-full bg-[#ffd84d] px-2 py-0.5 text-[11px] font-extrabold text-[#3d2f00]">{faltan(j.fecha)}</span>}
                        </div>
                        <p className="mt-2 text-lg font-extrabold leading-snug">{j.titulo}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground first-letter:uppercase"><CalendarDays className="size-4" /> {cuandoJornada(j)}</p>
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" /> {j.lugar}, {j.provincia}</p>
                        <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-sm">
                          <span className="inline-flex items-center gap-1.5 font-bold"><Users className="size-4 text-[#1d6ff2]" /> {ins.length}{j.cupo ? ` / ${j.cupo}` : ""} apuntados</span>
                          {pasada(j) && <span className="text-muted-foreground">{ins.filter((i) => i.asistio).length} asistieron</span>}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function NuevaJornada({ onListo, onCancelar }: { onListo: () => void; onCancelar: () => void }) {
  const p = usePanel();
  const manana = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
  const [f, setF] = useState({ titulo: `Jornada de empleo ${p.empresa.nombre}`, dia: manana, desde: "09:00", hasta: "13:00", lugar: "", provincia: p.empresa.provincia ?? "Distrito Nacional", puestos: p.vacantes.filter((v) => v.estado === "publicada").slice(0, 4).map((v) => v.titulo).join(", "), descripcion: "", llevar: "CV impreso, cédula y una copia de tu certificado de bachiller. Llega 15 minutos antes.", cupo: "" });
  const [guardando, setGuardando] = useState(false);
  const pon = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const fecha = new Date(`${f.dia}T${f.desde}`), hasta = f.hasta ? new Date(`${f.dia}T${f.hasta}`) : null;
    if (f.titulo.trim().length < 5) return void toast.error("Escribe un título.");
    if (f.lugar.trim().length < 3) return void toast.error("Escribe el lugar o la dirección.");
    if (fecha.getTime() < Date.now()) return void toast.error("La fecha tiene que ser en el futuro.");
    if (hasta && hasta <= fecha) return void toast.error("La hora de cierre tiene que ser después de la de inicio.");
    setGuardando(true);
    const { data, error } = await supabase.from("jornadas").insert({
      empresa_id: p.empresa.id, owner_id: p.uid, titulo: f.titulo.trim(), fecha: fecha.toISOString(), hasta: hasta?.toISOString() ?? null, lugar: f.lugar.trim(), provincia: f.provincia,
      puestos: f.puestos.split(/[,\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 15), descripcion: f.descripcion.trim() || null, llevar: f.llevar.trim() || null, cupo: Number(f.cupo) || null, estado: "publicada",
    }).select("estado").single();
    setGuardando(false);
    if (error) return void toast.error(error.message.includes("limite_jornadas") ? "En Gratis puedes tener 1 jornada próxima. Con el Plan Empresa, sin límite." : "No se pudo crear. Revisa los datos e intenta otra vez.");
    toast.success((data as { estado: string }).estado === "revision" ? "Recibida. La revisamos y sale publicada en cuanto la aprobemos." : "¡Publicada! Ya aparece en Jornadas de empleo.");
    onListo();
  };
  return (
    <>
      <button type="button" onClick={onCancelar} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Jornadas</button>
      <Titulo titulo="Nueva jornada de empleo" sub="Gratis. Sale en la página de Jornadas y la gente se apunta con su CV." />
      <form onSubmit={(e) => void guardar(e)} className="max-w-2xl space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <label className="block"><span className="mb-1 block text-sm font-bold">Título</span><input value={f.titulo} onChange={(e) => pon("titulo", e.target.value)} maxLength={140} className={campoPanel} /></label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block"><span className="mb-1 block text-sm font-bold">Día</span><input type="date" value={f.dia} min={new Date().toISOString().slice(0, 10)} onChange={(e) => pon("dia", e.target.value)} className={campoPanel} /></label>
          <label className="block"><span className="mb-1 block text-sm font-bold">Desde</span><input type="time" value={f.desde} onChange={(e) => pon("desde", e.target.value)} className={campoPanel} /></label>
          <label className="block"><span className="mb-1 block text-sm font-bold">Hasta</span><input type="time" value={f.hasta} onChange={(e) => pon("hasta", e.target.value)} className={campoPanel} /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
          <label className="block"><span className="mb-1 block text-sm font-bold">Lugar y dirección</span><input value={f.lugar} onChange={(e) => pon("lugar", e.target.value)} maxLength={200} placeholder="Ej.: Sucursal Av. Duarte #45, 2do piso" className={campoPanel} /></label>
          <label className="block"><span className="mb-1 block text-sm font-bold">Provincia</span><select value={f.provincia} onChange={(e) => pon("provincia", e.target.value)} className={campoPanel}>{provincias.filter((x) => x !== "Toda República Dominicana").map((x) => <option key={x}>{x}</option>)}</select></label>
        </div>
        <label className="block"><span className="mb-1 block text-sm font-bold">Puestos <span className="font-normal text-muted-foreground">(separados por coma)</span></span><input value={f.puestos} onChange={(e) => pon("puestos", e.target.value)} placeholder="Cajeras, Vendedores, Almacén" className={campoPanel} /></label>
        <label className="block"><span className="mb-1 block text-sm font-bold">Qué deben llevar</span><textarea value={f.llevar} onChange={(e) => pon("llevar", e.target.value)} rows={2} maxLength={500} className={`${campoPanel} h-auto py-3`} /></label>
        <label className="block"><span className="mb-1 block text-sm font-bold">Detalles <span className="font-normal text-muted-foreground">(opcional)</span></span><textarea value={f.descripcion} onChange={(e) => pon("descripcion", e.target.value)} rows={3} maxLength={3000} placeholder="Salario, beneficios, horario de los puestos, cómo será la entrevista…" className={`${campoPanel} h-auto py-3`} /></label>
        <label className="block max-w-[14rem]"><span className="mb-1 block text-sm font-bold">Cupo <span className="font-normal text-muted-foreground">(opcional)</span></span><input inputMode="numeric" value={f.cupo} onChange={(e) => pon("cupo", e.target.value.replace(/\D/g, ""))} placeholder="Sin límite" className={campoPanel} /></label>
        <button type="submit" disabled={guardando} className="btn-aplicar inline-flex h-12 items-center gap-2 rounded-xl px-8">{guardando && <Loader2 className="size-4 animate-spin" />} Publicar jornada</button>
      </form>
    </>
  );
}

function Inscritos({ j, filas, onVolver, onCambio, onCancelar }: { j: Fila; filas: Inscrito[]; onVolver: () => void; onCambio: (i: Inscrito) => void; onCancelar: () => Promise<void> }) {
  const p = usePanel();
  const [abierto, setAbierto] = useState<string | null>(null);
  const url = `${SITIO}/jornadas/${j.id}`;
  const recordatorio = (i: Inscrito) => `Hola ${i.nombre.split(" ")[0]}, te esperamos en la ${j.titulo} de ${p.empresa.nombre}: ${cuandoJornada(j)} en ${j.lugar}.${j.llevar ? ` Trae: ${j.llevar}` : ""} ¡Nos vemos!`;
  const marcar = async (i: Inscrito, v: boolean | null) => {
    const { error } = await supabase.from("inscripciones_jornada").update({ asistio: v }).eq("id", i.id);
    if (error) return void toast.error("No se pudo marcar.");
    onCambio({ ...i, asistio: v });
  };
  const fin = pasada(j);
  return (
    <>
      <button type="button" onClick={onVolver} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Jornadas</button>
      <Titulo titulo={j.titulo} sub={`${cuandoJornada(j).replace(/^./, (c) => c.toUpperCase())} · ${j.lugar}, ${j.provincia}`}>
        {filas.length > 0 && <button type="button" onClick={() => descargarCsv(`jornada-${j.fecha.slice(0, 10)}.csv`, [["Nombre", "Contacto", "Puesto", "Se apuntó", "Asistió", "CV"], ...filas.map((i) => [i.nombre, i.contacto, i.puesto ?? "", new Date(i.created_at).toLocaleString("es-DO"), i.asistio === null ? "" : i.asistio ? "Sí" : "No", partirMensaje(i.mensaje).cv])])} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-semibold"><Download className="size-4" /> Excel</button>}
      </Titulo>
      <div className="mb-5 flex flex-wrap gap-2">
        {j.estado === "publicada" && !fin && <>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${j.titulo}: ${cuandoJornada(j)} en ${j.lugar}. Apúntate gratis: ${url}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#1fa855] px-4 text-sm font-bold text-white"><Share2 className="size-4" /> Compartir por WhatsApp</a>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-semibold"><ExternalLink className="size-4" /> Ver página</a>
        </>}
        {j.estado !== "cancelada" && !fin && <button type="button" onClick={() => { if (window.confirm("¿Cancelar esta jornada? Dejará de aparecer en la página.")) void onCancelar(); }} className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-destructive">Cancelar jornada</button>}
        {j.estado === "revision" && <span className="inline-flex h-10 items-center rounded-xl bg-[#c27803]/10 px-3 text-sm font-semibold text-[#8a5200]">En revisión: sale publicada cuando la aprobemos</span>}
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
        {[["Apuntados", filas.length], ["Con CV", filas.filter((i) => partirMensaje(i.mensaje).cv).length], [fin ? "Asistieron" : "Cupo", fin ? filas.filter((i) => i.asistio).length : j.cupo ?? "Libre"]].map(([t, n]) => <div key={t as string} className="rounded-2xl border border-border bg-surface py-3"><p className="text-2xl font-extrabold tabular-nums">{n}</p><p className="text-xs text-muted-foreground">{t}</p></div>)}
      </div>
      {filas.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Aún nadie se apunta. Comparte el enlace por WhatsApp e imprime el cartel en tu local.</p> : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {filas.map((i) => {
            const m = partirMensaje(i.mensaje);
            const tel = telefono(i.contacto);
            return (
              <li key={i.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Persona nombre={i.nombre} className="size-9 text-xs" />
                  <button type="button" onClick={() => setAbierto(abierto === i.id ? null : i.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate font-bold">{i.nombre}</span>
                    <span className="block truncate text-xs text-muted-foreground">{i.puesto ?? "Sin puesto elegido"} · {i.contacto}{m.cv ? " · con CV" : ""}</span>
                  </button>
                  {fin ? (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => void marcar(i, i.asistio === true ? null : true)} aria-pressed={i.asistio === true} className={`inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-bold ${i.asistio === true ? "bg-success text-white" : "border border-border"}`}><Check className="size-3.5" /> Vino</button>
                      <button type="button" onClick={() => void marcar(i, i.asistio === false ? null : false)} aria-pressed={i.asistio === false} className={`inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-bold ${i.asistio === false ? "bg-muted-foreground text-white" : "border border-border"}`}><X className="size-3.5" /> No vino</button>
                    </div>
                  ) : tel ? <a href={`https://wa.me/${tel}?text=${encodeURIComponent(recordatorio(i))}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-[#1fa855] hover:bg-[#1fa855]/10"><MessageCircle className="size-4" /> Recordarle</a> : null}
                </div>
                {abierto === i.id && m.cv && <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-background p-3 font-sans text-[13px]">{m.cv}</pre>}
                {abierto === i.id && !m.cv && <p className="mt-2 text-sm text-muted-foreground">No envió CV. Pídele que lo lleve impreso.</p>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

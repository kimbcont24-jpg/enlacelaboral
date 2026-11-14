import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, Eye, Loader2, Mail, MessageSquareReply, Pause, Play, Plus, RefreshCw, Save, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Interruptor, Kpi, Tarjeta, campo, fechaRD, haceDesde, rotulo } from "@/components/admin/comun";
import { crm } from "@/lib/crm-empresas";
import { CuentasVista, FichaCuenta, MotorVista, Termometro } from "@/components/admin/MotorEmpresas";
import { cn } from "@/lib/utils";

/* ---------- Tipos ---------- */
type Estado = "nuevo" | "en_secuencia" | "terminado" | "respondio" | "interesado" | "registrada" | "no_interesado" | "baja" | "rebotado" | "pausado" | "excluida";
type Prospecto = {
  correo: string; dominio: string; empresa: string; contacto_nombre: string | null; cargo: string | null; provincia: string | null; sector: string | null;
  puesto_ejemplo: string | null; vacante_id: string | null; vacantes_en_enlace: number | null; ultima_vacante: string | null; fuente: string;
  dominio_ok: boolean | null; mx_revisado: string | null; estado: Estado; paso: number; ultimo_envio: string | null; proximo_envio: string | null;
  nota: string | null; creado: string; actualizado: string; n_envios: number; de_baja: boolean; cruce_nst: boolean; temperatura: number | null; enviable: boolean; tipo_correo: string; telefono: string | null;
};
type Config = { activo: boolean; limite_diario: number; dias_paso2: number; dias_paso3: number; dias_paso4: number; inicio: string; remitente: string; actualizado: string };
type Resumen = { total: number; dominio_verificado: number; por_contactar: number; en_secuencia: number; respondieron: number; registradas: number; no_interesadas: number; rebotados: number; secuencia_terminada: number; correos_enviados: number };
type Envio = { id: number; correo: string; empresa: string | null; paso: number; asunto: string | null; estado: string; error: string | null; creado: string };
type Actividad = { id: number; tipo: string; detalle: string | null; creado: string };
type Plantilla = { paso: number; nombre: string; asunto: string; html: string; asunto_sin_vacante: string | null; html_sin_vacante: string | null; actualizado: string };
type Datos = { prospectos: Prospecto[]; resumen: Resumen; config: Config; enviados_hoy: number; envios: Envio[]; hoy: string };

const ESTADOS: Record<Estado, { label: string; clase: string }> = {
  nuevo: { label: "Por contactar", clase: "bg-muted text-foreground" },
  en_secuencia: { label: "En secuencia", clase: "bg-primary/10 text-primary" },
  terminado: { label: "Secuencia terminada", clase: "bg-muted text-muted-foreground" },
  respondio: { label: "Respondió", clase: "bg-[#fff4d6] text-[#7a5600]" },
  interesado: { label: "Interesada", clase: "bg-success/15 text-success" },
  registrada: { label: "Registrada", clase: "bg-success text-white" },
  no_interesado: { label: "No interesada", clase: "bg-muted text-muted-foreground" },
  baja: { label: "Pidió baja", clase: "bg-destructive/10 text-destructive" },
  rebotado: { label: "Rebotó", clase: "bg-destructive/10 text-destructive" },
  pausado: { label: "Pausada", clase: "bg-muted text-muted-foreground" },
  excluida: { label: "Excluida", clase: "bg-muted text-muted-foreground line-through" },
};
const PASOS = ["", "Invitación", "Cómo funciona", "La publicamos por ti", "Cierre amable"];
const FILTROS: { id: string; label: string; estados: Estado[] }[] = [
  { id: "todas", label: "Todas", estados: [] },
  { id: "nuevo", label: "Por contactar", estados: ["nuevo"] },
  { id: "en_secuencia", label: "En secuencia", estados: ["en_secuencia"] },
  { id: "respuestas", label: "Respondieron", estados: ["respondio", "interesado"] },
  { id: "registrada", label: "Registradas", estados: ["registrada"] },
  { id: "cerradas", label: "Cerradas", estados: ["terminado", "no_interesado", "baja", "rebotado", "pausado", "excluida"] },
];

function Pastilla({ estado }: { estado: Estado }) {
  const e = ESTADOS[estado] ?? ESTADOS.nuevo;
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", e.clase)}>{e.label}</span>;
}

function Pasos({ paso }: { paso: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Correo ${paso} de 4`} title={paso ? `Último enviado: ${PASOS[paso]}` : "Sin correos todavía"}>
      {[1, 2, 3, 4].map((n) => <span key={n} className={cn("size-2 rounded-full", n <= paso ? "bg-primary" : "bg-border")} />)}
    </span>
  );
}

const fechaCorta = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("es-DO", { day: "numeric", month: "short" }) : "—");

/* ---------- Componente principal ---------- */
export function CrmEmpresas() {
  const [vista, setVista] = useState<"motor" | "cuentas" | "tablero" | "envios" | "correos" | "ajustes">("motor");
  const [cuentaAbierta, setCuentaAbierta] = useState<string | null>(null);
  const [segmento, setSegmento] = useState("");
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("todas");
  const [q, setQ] = useState("");
  const [abierta, setAbierta] = useState<Prospecto | null>(null);
  const [agregar, setAgregar] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setDatos(await crm<Datos>("listar"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const conteo = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILTROS) c[f.id] = f.estados.length ? (datos?.prospectos.filter((p) => f.estados.includes(p.estado)).length ?? 0) : (datos?.prospectos.length ?? 0);
    return c;
  }, [datos]);

  const lista = useMemo(() => {
    const f = FILTROS.find((x) => x.id === filtro)!;
    const t = q.trim().toLowerCase();
    return (datos?.prospectos ?? [])
      .filter((p) => !f.estados.length || f.estados.includes(p.estado))
      .filter((p) => !t || [p.empresa, p.correo, p.contacto_nombre, p.puesto_ejemplo, p.provincia].some((x) => (x ?? "").toLowerCase().includes(t)))
      .sort((a, b) => {
        const prio = (p: Prospecto) => (p.estado === "interesado" ? 0 : p.estado === "respondio" ? 1 : 2);
        return prio(a) - prio(b) || (b.ultimo_envio ?? b.actualizado).localeCompare(a.ultimo_envio ?? a.actualizado);
      });
  }, [datos, filtro, q]);

  if (cargando && !datos) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (error && !datos) return (
    <Tarjeta titulo="No pude abrir el CRM">
      <p className="text-sm text-muted-foreground">{error}</p>
      <Button className="mt-3" size="sm" onClick={() => void cargar()}><RefreshCw className="size-4" /> Reintentar</Button>
    </Tarjeta>
  );
  if (!datos) return null;
  const { resumen: r, config: c } = datos;
  const tasa = r.correos_enviados ? Math.round(((r.respondieron + r.registradas + r.no_interesadas) / Math.max(1, r.total - r.por_contactar)) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Motor de empresas</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Lee todas las vacantes de Enlace, detecta qué empresas están contratando, mide su temperatura y les escribe con el argumento que más les sirve. Los correos salen desde info@enlacelaboralrd.com de lunes a viernes a las 9:41 a. m. y la secuencia se detiene sola cuando la empresa responde.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", c.activo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
            {c.activo ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}{c.activo ? `Enviando · ${datos.enviados_hoy}/${c.limite_diario} hoy` : "En pausa"}
          </span>
          <Button size="sm" variant="ghost" onClick={() => void cargar()} disabled={cargando}><RefreshCw className={cn("size-4", cargando && "animate-spin")} /> Actualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi titulo="Contactos" valor={r.total} nota={`${r.dominio_verificado} con dominio verificado`} />
        <Kpi titulo="Por contactar" valor={r.por_contactar} onClick={() => { setVista("tablero"); setFiltro("nuevo"); }} />
        <Kpi titulo="En secuencia" valor={r.en_secuencia} onClick={() => { setVista("tablero"); setFiltro("en_secuencia"); }} />
        <Kpi titulo="Respondieron" valor={r.respondieron} tono={r.respondieron ? "bien" : "normal"} nota={r.correos_enviados ? `${tasa}% de las contactadas` : undefined} onClick={() => { setVista("tablero"); setFiltro("respuestas"); }} />
        <Kpi titulo="Registradas" valor={r.registradas} tono={r.registradas ? "bien" : "normal"} />
        <Kpi titulo="Correos enviados" valor={r.correos_enviados} nota={r.rebotados ? `${r.rebotados} rebotaron` : "sin rebotes"} tono={r.rebotados > 3 ? "ojo" : "normal"} />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3" role="group" aria-label="Secciones del CRM">
        {([["motor", "Estrategia"], ["cuentas", "Empresas"], ["tablero", "Contactos"], ["envios", "Envíos"], ["correos", "Correos de la secuencia"], ["ajustes", "Ajustes"]] as const).map(([id, label]) => (
          <Button key={id} size="sm" variant={vista === id ? "secondary" : "ghost"} className={vista === id ? "font-bold" : ""} onClick={() => setVista(id)}>{label}</Button>
        ))}
      </div>

      {vista === "motor" && <MotorVista onAbrirCuenta={setCuentaAbierta} onFiltrar={(sg) => { setSegmento(sg); setVista("cuentas"); }} />}
      {vista === "cuentas" && <CuentasVista segmentoInicial={segmento} onAbrirCuenta={setCuentaAbierta} />}
      {vista === "tablero" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {FILTROS.map((f) => (
              <button key={f.id} type="button" onClick={() => setFiltro(f.id)} className={cn("rounded-full border px-3 py-1.5 text-sm font-semibold transition", filtro === f.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary")}>
                {f.label} <span className="ml-1 tabular-nums opacity-70">{conteo[f.id]}</span>
              </button>
            ))}
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa, correo, puesto…" className={cn(campo, "mt-0 pl-9")} aria-label="Buscar en el CRM" />
            </div>
            <Button size="sm" onClick={() => setAgregar(true)}><Plus className="size-4" /> Agregar empresa</Button>
          </div>

          {lista.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No hay empresas en este filtro.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <table className="hidden w-full text-sm md:table">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-4 py-3">Empresa</th><th className="px-4 py-3">Contacto</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Correos</th><th className="px-4 py-3">Próximo</th><th className="px-4 py-3" /></tr>
                </thead>
                <tbody>
                  {lista.map((p) => (
                    <tr key={p.correo} className="cursor-pointer border-t border-border hover:bg-muted/40" onClick={() => setAbierta(p)}>
                      <td className="px-4 py-3">
                        <p className="font-bold">{p.empresa}</p>
                        <p className="text-xs text-muted-foreground">{p.puesto_ejemplo ? `Busca: ${p.puesto_ejemplo}` : p.fuente}{p.provincia ? ` · ${p.provincia}` : ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="flex items-center gap-1">{p.correo}{p.dominio_ok ? <ShieldCheck className="size-3.5 text-success" aria-label="Dominio verificado" /> : p.dominio_ok === false ? <Ban className="size-3.5 text-destructive" aria-label="Dominio sin correo" /> : null}</p>
                        {p.contacto_nombre && <p className="text-xs text-muted-foreground">{p.contacto_nombre}{p.cargo ? ` · ${p.cargo}` : ""}</p>}
                        {!p.enviable && <p className="text-[11px] font-semibold text-[#be185d]">Correo personal · sin envío automático</p>}
                      </td>
                      <td className="px-4 py-3"><Pastilla estado={p.estado} />{p.temperatura != null && <div className="mt-1"><Termometro valor={p.temperatura} /></div>}{p.cruce_nst && p.estado === "nuevo" && <p className="mt-1 text-[11px] text-muted-foreground">Espera por NST</p>}</td>
                      <td className="px-4 py-3"><Pasos paso={p.paso} /><p className="mt-1 text-xs text-muted-foreground">{p.ultimo_envio ? haceDesde(p.ultimo_envio) : "—"}</p></td>
                      <td className="px-4 py-3 text-xs">{p.proximo_envio ? `${PASOS[p.paso + 1] ?? ""} · ${fechaCorta(p.proximo_envio)}` : p.estado === "nuevo" && p.dominio_ok ? "En cola" : "—"}</td>
                      <td className="px-4 py-3 text-right"><Eye className="inline size-4 text-muted-foreground" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-border md:hidden">
                {lista.map((p) => (
                  <li key={p.correo}>
                    <button type="button" className="w-full px-4 py-3 text-left" onClick={() => setAbierta(p)}>
                      <div className="flex items-start justify-between gap-2"><p className="font-bold">{p.empresa}</p><Pastilla estado={p.estado} /></div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.correo}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground"><Pasos paso={p.paso} />{p.proximo_envio ? `Próximo: ${fechaCorta(p.proximo_envio)}` : ""}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {vista === "envios" && <Envios envios={datos.envios} />}
      {vista === "correos" && <Correos ejemplo={datos.prospectos.find((p) => p.vacante_id && p.dominio_ok)?.correo ?? datos.prospectos[0]?.correo ?? ""} ejemploSin={datos.prospectos.find((p) => !p.vacante_id && p.dominio_ok)?.correo ?? ""} />}
      {vista === "ajustes" && <Ajustes config={c} onGuardado={() => void cargar()} />}

      {cuentaAbierta && <FichaCuenta clave={cuentaAbierta} onCerrar={() => setCuentaAbierta(null)} onAbrirContacto={(correo) => { const p = datos.prospectos.find((x) => x.correo === correo); if (p) { setCuentaAbierta(null); setAbierta(p); } }} />}
      {abierta && <Ficha p={abierta} onCerrar={() => setAbierta(null)} onCambio={async () => { await cargar(); }} />}
      {agregar && <Agregar onCerrar={() => setAgregar(false)} onListo={async () => { setAgregar(false); await cargar(); }} />}
    </div>
  );
}

/* ---------- Ficha de la empresa ---------- */
function Ficha({ p, onCerrar, onCambio }: { p: Prospecto; onCerrar: () => void; onCambio: () => Promise<void> }) {
  const [det, setDet] = useState<{ actividad: Actividad[]; envios: Envio[] } | null>(null);
  const [form, setForm] = useState({ empresa: p.empresa, contacto_nombre: p.contacto_nombre ?? "", cargo: p.cargo ?? "", provincia: p.provincia ?? "", nota: p.nota ?? "" });
  const [ocupado, setOcupado] = useState(false);
  const [previa, setPrevia] = useState<{ asunto_final: string; cuerpo_html: string } | null>(null);
  const [estado, setEstado] = useState<Estado>(p.estado);

  useEffect(() => {
    void crm<{ actividad: Actividad[]; envios: Envio[] }>("detalle", { correo: p.correo }).then(setDet).catch(() => setDet({ actividad: [], envios: [] }));
  }, [p.correo]);

  const accion = async (nuevo: Estado | "reanudar", texto: string) => {
    setOcupado(true);
    try {
      await crm("estado", { correo: p.correo, estado: nuevo, nota: form.nota !== (p.nota ?? "") ? form.nota : "" });
      toast.success(texto);
      setEstado(nuevo === "reanudar" ? (p.paso > 0 ? "en_secuencia" : "nuevo") : nuevo);
      await onCambio();
    } catch (e) { toast.error((e as Error).message); } finally { setOcupado(false); }
  };
  const guardar = async () => {
    setOcupado(true);
    try { await crm("actualizar", { correo: p.correo, cambios: form }); toast.success("Datos guardados"); await onCambio(); }
    catch (e) { toast.error((e as Error).message); } finally { setOcupado(false); }
  };
  const verPrevia = async () => {
    try { setPrevia(await crm("vista_previa", { correo: p.correo, paso: Math.min(4, p.paso + 1) })); }
    catch (e) { toast.error((e as Error).message); }
  };
  const cerrada = ["baja", "no_interesado", "rebotado", "pausado", "excluida", "registrada"].includes(estado);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-label={`Ficha de ${p.empresa}`} onClick={onCerrar}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-background p-5 shadow-xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={rotulo}>Empresa</p>
            <h3 className="text-xl font-extrabold">{p.empresa}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><Mail className="size-4" />{p.correo}{p.dominio_ok && <span className="ml-1 inline-flex items-center gap-0.5 text-xs font-semibold text-success"><ShieldCheck className="size-3.5" />dominio verificado</span>}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onCerrar} aria-label="Cerrar"><X className="size-5" /></Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4">
          <Pastilla estado={estado} />
          <span className="flex items-center gap-2 text-sm"><Pasos paso={p.paso} /> {p.paso ? `${p.paso} de 4 · ${PASOS[p.paso]}` : "Aún sin correos"}</span>
          {p.proximo_envio && <span className="text-sm text-muted-foreground">Próximo: {PASOS[p.paso + 1]} el {fechaCorta(p.proximo_envio)}</span>}
          {p.cruce_nst && <span className="text-xs text-muted-foreground">Neuro STEM Talent le escribió hace poco: Enlace espera 45 días.</span>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" disabled={ocupado} onClick={() => void accion("interesado", "Marcada como interesada")}><Sparkles className="size-4" /> Interesada</Button>
          <Button size="sm" variant="secondary" disabled={ocupado} onClick={() => void accion("registrada", "¡Registrada! La secuencia se detuvo")}><CheckCircle2 className="size-4" /> Ya se registró</Button>
          <Button size="sm" variant="secondary" disabled={ocupado} onClick={() => void accion("respondio", "Marcada: respondió")}><MessageSquareReply className="size-4" /> Respondió</Button>
          {cerrada || estado === "respondio" || estado === "interesado" ? (
            <Button size="sm" variant="secondary" disabled={ocupado} onClick={() => void accion("reanudar", "Secuencia reanudada")}><Play className="size-4" /> Reanudar</Button>
          ) : (
            <Button size="sm" variant="secondary" disabled={ocupado} onClick={() => void accion("pausado", "Pausada")}><Pause className="size-4" /> Pausar</Button>
          )}
          <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => void accion("no_interesado", "Marcada como no interesada")}>No le interesa</Button>
          <Button size="sm" variant="ghost" className="text-destructive" disabled={ocupado} onClick={() => { if (confirm("¿No volver a escribirle nunca a esta empresa?")) void accion("baja", "Dada de baja: no se le escribirá más"); }}><Ban className="size-4" /> No escribir más</Button>
        </div>

        <Tarjeta titulo="Datos" className="mt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className={rotulo}>Empresa</span><input className={campo} value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} /></label>
            <label><span className={rotulo}>Persona de contacto</span><input className={campo} value={form.contacto_nombre} onChange={(e) => setForm({ ...form, contacto_nombre: e.target.value })} placeholder="Si la pones, el saludo usa su nombre" /></label>
            <label><span className={rotulo}>Cargo</span><input className={campo} value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} /></label>
            <label><span className={rotulo}>Provincia</span><input className={campo} value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} /></label>
            <div><span className={rotulo}>Origen</span><p className="mt-2 text-sm">{p.fuente}</p></div>
            <label className="sm:col-span-2"><span className={rotulo}>Nota</span><textarea className={cn(campo, "min-h-20")} value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} /></label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" disabled={ocupado} onClick={() => void guardar()}><Save className="size-4" /> Guardar</Button>
            {p.vacante_id && <Button size="sm" variant="ghost" asChild><a href={`/vacantes/${p.vacante_id}`} target="_blank" rel="noreferrer">Ver su vacante</a></Button>}
            {p.paso < 4 && !cerrada && <Button size="sm" variant="ghost" onClick={() => void verPrevia()}><Eye className="size-4" /> Ver el próximo correo</Button>}
          </div>
        </Tarjeta>

        {previa && (
          <Tarjeta titulo={`Así le llegará: «${previa.asunto_final}»`} className="mt-4">
            <iframe title="Vista previa del correo" className="h-96 w-full rounded-xl border border-border bg-white" srcDoc={previa.cuerpo_html} sandbox="" />
          </Tarjeta>
        )}

        <Tarjeta titulo="Historial" className="mt-4">
          {!det ? <Loader2 className="size-5 animate-spin text-primary" /> : (
            <ol className="space-y-3">
              {[...det.envios.map((e) => ({ k: `e${e.id}`, f: e.creado, t: e.estado === "enviado" ? `✉️ Correo ${e.paso} enviado: ${e.asunto ?? ""}` : e.estado === "prueba" ? `🧪 Prueba: ${e.asunto ?? ""}` : `⚠️ Error al enviar el correo ${e.paso}: ${e.error ?? ""}` })),
                ...det.actividad.filter((a) => a.tipo !== "envio").map((a) => ({ k: `a${a.id}`, f: a.creado, t: `${ESTADOS[a.tipo as Estado]?.label ?? a.tipo}${a.detalle ? ` · ${a.detalle}` : ""}` }))]
                .sort((a, b) => b.f.localeCompare(a.f))
                .map((x) => <li key={x.k} className="text-sm"><p>{x.t}</p><p className="text-xs text-muted-foreground">{fechaRD(x.f)}</p></li>)}
              {!det.envios.length && !det.actividad.length && <li className="text-sm text-muted-foreground">Todavía no hay movimientos.</li>}
            </ol>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}

/* ---------- Agregar empresa a mano ---------- */
function Agregar({ onCerrar, onListo }: { onCerrar: () => void; onListo: () => Promise<void> }) {
  const [f, setF] = useState({ correo: "", empresa: "", contacto_nombre: "", cargo: "", provincia: "", nota: "" });
  const [ocupado, setOcupado] = useState(false);
  const enviar = async () => {
    setOcupado(true);
    try { await crm("agregar", f); toast.success("Agregada. Mañana se verifica su dominio y entra en la cola."); await onListo(); }
    catch (e) { toast.error((e as Error).message); } finally { setOcupado(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Agregar empresa" onClick={onCerrar}>
      <div className="w-full max-w-lg rounded-2xl bg-background p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-lg font-extrabold">Agregar empresa</h3><Button size="icon" variant="ghost" onClick={onCerrar} aria-label="Cerrar"><X className="size-5" /></Button></div>
        <p className="mt-1 text-sm text-muted-foreground">Solo correos corporativos de empresas que contratan (nada de consultoras). Entrará en la secuencia automática.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className={rotulo}>Correo corporativo *</span><input className={campo} type="email" value={f.correo} onChange={(e) => setF({ ...f, correo: e.target.value })} placeholder="rrhh@empresa.com.do" /></label>
          <label className="sm:col-span-2"><span className={rotulo}>Empresa *</span><input className={campo} value={f.empresa} onChange={(e) => setF({ ...f, empresa: e.target.value })} /></label>
          <label><span className={rotulo}>Persona de contacto</span><input className={campo} value={f.contacto_nombre} onChange={(e) => setF({ ...f, contacto_nombre: e.target.value })} /></label>
          <label><span className={rotulo}>Cargo</span><input className={campo} value={f.cargo} onChange={(e) => setF({ ...f, cargo: e.target.value })} /></label>
          <label><span className={rotulo}>Provincia</span><input className={campo} value={f.provincia} onChange={(e) => setF({ ...f, provincia: e.target.value })} /></label>
          <label><span className={rotulo}>Nota</span><input className={campo} value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} /></label>
        </div>
        <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={onCerrar}>Cancelar</Button><Button disabled={ocupado || !f.correo || !f.empresa} onClick={() => void enviar()}>{ocupado ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Agregar</Button></div>
      </div>
    </div>
  );
}

/* ---------- Historial de envíos ---------- */
function Envios({ envios }: { envios: Envio[] }) {
  if (!envios.length) return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Todavía no se ha enviado ningún correo. El primer lote sale el próximo día laborable a las 9:41 a. m.</p>;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <ul className="divide-y divide-border">
        {envios.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-semibold">{e.empresa ?? e.correo} <span className="font-normal text-muted-foreground">· correo {e.paso} ({PASOS[e.paso]})</span></p>
              <p className="truncate text-xs text-muted-foreground">{e.asunto}{e.error ? ` · ${e.error}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", e.estado === "enviado" ? "bg-success/15 text-success" : e.estado === "prueba" ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive")}>{e.estado === "enviado" ? "Enviado" : e.estado === "prueba" ? "Prueba" : "Error"}</span>
              <span className="text-xs text-muted-foreground">{fechaRD(e.creado)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Editor de los 4 correos ---------- */
function Correos({ ejemplo, ejemploSin }: { ejemplo: string; ejemploSin: string }) {
  const [plantillas, setPlantillas] = useState<Plantilla[] | null>(null);
  const [paso, setPaso] = useState(1);
  const [version, setVersion] = useState<"con" | "sin">("con");
  const [borr, setBorr] = useState<{ asunto: string; html: string }>({ asunto: "", html: "" });
  const [previa, setPrevia] = useState<{ asunto_final: string; cuerpo_html: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    const j = await crm<{ plantillas: Plantilla[] }>("plantillas");
    setPlantillas(j.plantillas);
  }, []);
  useEffect(() => { void cargar().catch((e: Error) => toast.error(e.message)); }, [cargar]);

  const actual = plantillas?.find((t) => t.paso === paso);
  useEffect(() => {
    if (!actual) return;
    setBorr(version === "con" ? { asunto: actual.asunto, html: actual.html } : { asunto: actual.asunto_sin_vacante ?? "", html: actual.html_sin_vacante ?? "" });
    setPrevia(null);
  }, [actual, version]);

  const verPrevia = async () => {
    const correo = version === "con" ? ejemplo : ejemploSin || ejemplo;
    if (!correo) return;
    try { setPrevia(await crm("vista_previa", { correo, paso })); } catch (e) { toast.error((e as Error).message); }
  };
  const guardar = async () => {
    setOcupado(true);
    try {
      await crm("guardar_plantilla", version === "con" ? { paso, asunto: borr.asunto, html: borr.html } : { paso, asunto_sin_vacante: borr.asunto, html_sin_vacante: borr.html });
      toast.success(`Correo ${paso} guardado. Los próximos envíos usan este texto.`);
      await cargar();
    } catch (e) { toast.error((e as Error).message); } finally { setOcupado(false); }
  };

  if (!plantillas) return <Loader2 className="size-5 animate-spin text-primary" />;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Tarjeta titulo="Editar correo" ayuda="Palabras que se reemplazan solas: {{saludo}}, {{empresa}}, {{puesto}}, {{enlace_vacante}} y {{puesto_frase}}. La firma y la nota para darse de baja se agregan siempre al final.">
        <div className="flex flex-wrap gap-2">
          {plantillas.map((t) => <Button key={t.paso} size="sm" variant={paso === t.paso ? "secondary" : "ghost"} className={paso === t.paso ? "font-bold" : ""} onClick={() => setPaso(t.paso)}>{t.paso}. {PASOS[t.paso]}</Button>)}
        </div>
        <div className="mt-3 flex gap-2 text-sm">
          <button type="button" onClick={() => setVersion("con")} className={cn("rounded-full border px-3 py-1", version === "con" ? "border-primary bg-primary/10 font-bold text-primary" : "border-border")}>Con su vacante en Enlace</button>
          <button type="button" onClick={() => setVersion("sin")} className={cn("rounded-full border px-3 py-1", version === "sin" ? "border-primary bg-primary/10 font-bold text-primary" : "border-border")}>Sin vacante</button>
        </div>
        <label className="mt-3 block"><span className={rotulo}>Asunto</span><input className={campo} value={borr.asunto} onChange={(e) => setBorr({ ...borr, asunto: e.target.value })} /></label>
        <label className="mt-3 block"><span className={rotulo}>Texto (HTML)</span><textarea className={cn(campo, "min-h-72 font-mono text-xs")} value={borr.html} onChange={(e) => setBorr({ ...borr, html: e.target.value })} /></label>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={ocupado} onClick={() => void guardar()}><Save className="size-4" /> Guardar</Button>
          <Button size="sm" variant="ghost" onClick={() => void verPrevia()}><Eye className="size-4" /> Vista previa con una empresa real</Button>
        </div>
        {actual && <p className="mt-2 text-xs text-muted-foreground">Última edición: {fechaRD(actual.actualizado)}</p>}
      </Tarjeta>
      <Tarjeta titulo={previa ? `Asunto: ${previa.asunto_final}` : "Vista previa"} ayuda={previa ? "Así lo recibe la empresa (con lo guardado)." : "Guarda y toca «Vista previa» para ver el correo como lo recibe una empresa real."}>
        {previa ? <iframe title="Vista previa del correo" className="h-[32rem] w-full rounded-xl border border-border bg-white" srcDoc={previa.cuerpo_html} sandbox="" /> : <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground"><Mail className="mr-2 size-4" /> Sin vista previa</div>}
      </Tarjeta>
    </div>
  );
}

/* ---------- Ajustes ---------- */
function Ajustes({ config, onGuardado }: { config: Config; onGuardado: () => void }) {
  const [c, setC] = useState(config);
  const [ocupado, setOcupado] = useState(false);
  const guardar = async (cambios: Partial<Config>) => {
    setOcupado(true);
    try { const j = await crm<{ config: Config }>("config", { cambios }); setC(j.config); toast.success("Ajustes guardados"); onGuardado(); }
    catch (e) { toast.error((e as Error).message); } finally { setOcupado(false); }
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Tarjeta titulo="Envíos automáticos" ayuda="Si lo apagas, no sale ningún correo nuevo ni seguimiento hasta que lo vuelvas a encender. Las respuestas se siguen atendiendo.">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">{c.activo ? "Encendido" : "En pausa"}</p>
          <Interruptor activo={c.activo} etiqueta="Envíos automáticos" deshabilitado={ocupado} onCambio={(v) => { if (v || confirm("¿Pausar todos los envíos del CRM?")) void guardar({ activo: v }); }} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Remitente: {c.remitente.replace(/"/g, "")}. Primer día de envíos: {fechaCorta(c.inicio)}.</p>
      </Tarjeta>
      <Tarjeta titulo="Ritmo" ayuda="Zoho no permite envíos en ráfaga. 20 al día es un ritmo seguro para un correo nuevo; súbelo poco a poco si no hay rebotes.">
        <div className="grid grid-cols-2 gap-3">
          <label><span className={rotulo}>Correos por día</span><input type="number" min={0} max={60} className={campo} value={c.limite_diario} onChange={(e) => setC({ ...c, limite_diario: Number(e.target.value) })} /></label>
          <label><span className={rotulo}>Correo 2 (días después)</span><input type="number" min={1} max={30} className={campo} value={c.dias_paso2} onChange={(e) => setC({ ...c, dias_paso2: Number(e.target.value) })} /></label>
          <label><span className={rotulo}>Correo 3 (días después del 1)</span><input type="number" min={2} max={45} className={campo} value={c.dias_paso3} onChange={(e) => setC({ ...c, dias_paso3: Number(e.target.value) })} /></label>
          <label><span className={rotulo}>Correo 4 (días después del 1)</span><input type="number" min={3} max={60} className={campo} value={c.dias_paso4} onChange={(e) => setC({ ...c, dias_paso4: Number(e.target.value) })} /></label>
        </div>
        <Button className="mt-3" size="sm" disabled={ocupado} onClick={() => void guardar({ limite_diario: c.limite_diario, dias_paso2: c.dias_paso2, dias_paso3: c.dias_paso3, dias_paso4: c.dias_paso4 })}><Save className="size-4" /> Guardar ritmo</Button>
      </Tarjeta>
      <Tarjeta titulo="Reglas que el CRM respeta siempre" className="lg:col-span-2">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Solo correos corporativos con dominio verificado (que reciba correo). Nada de Gmail, Hotmail ni .gob.do.</li>
          <li>Ninguna consultora ni empresa de reclutamiento, y la misma lista de exclusión de Neuro STEM Talent.</li>
          <li>Una sola persona por empresa a la vez. Si NST le escribió en los últimos 45 días, Enlace espera.</li>
          <li>La secuencia se detiene en cuanto responden. Quien pide la baja no vuelve a recibir nada.</li>
          <li>Nunca se mencionan precios ni planes mientras los pagos estén ocultos.</li>
        </ul>
      </Tarjeta>
    </div>
  );
}

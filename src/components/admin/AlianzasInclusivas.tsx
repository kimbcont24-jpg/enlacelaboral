import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, HeartHandshake, Instagram, Loader2, Mail, Phone, Plus, RefreshCw, Save, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Interruptor, Kpi, Tarjeta, campo, haceDesde, rotulo } from "@/components/admin/comun";
import { crm } from "@/lib/crm-empresas";
import { cn } from "@/lib/utils";

type Aliado = {
  id: number; nombre: string; tipo: string; enfoque: string[] | null; correo: string | null; telefono: string | null; web: string | null;
  instagram: string | null; provincia: string | null; contacto_nombre: string | null; fuente: string | null; fuente_url: string | null; nota: string | null;
  estado: string; paso: number; ultimo_envio: string | null; proximo_envio: string | null; respondio_en: string | null; respuesta: string | null;
  siguiente_paso: string | null; seguimiento_en: string | null; prioridad: number; n_envios: number;
};
type Envio = { id: number; aliado_id: number; correo: string; paso: number; asunto: string; estado: string; error: string | null; creado: string };
type Datos = { aliados: Aliado[]; envios: Envio[]; config: { activo: boolean; limite: number; dias2: number; dias3: number }; cola_hoy: number };

export const TIPO_ALIADO: Record<string, string> = {
  fundacion: "Fundación", asociacion: "Asociación", ong: "ONG", empresa_inclusiva: "Empresa inclusiva", red: "Red", gobierno: "Gobierno", academia: "Academia",
};
const ESTADO: Record<string, { label: string; clase: string }> = {
  por_contactar: { label: "Por contactar", clase: "bg-primary/10 text-primary" },
  sin_contacto: { label: "Falta correo", clase: "bg-muted text-muted-foreground" },
  manual: { label: "Contacto manual", clase: "bg-[#fff4d6] text-[#7a5600]" },
  en_secuencia: { label: "En secuencia", clase: "bg-primary/15 text-primary" },
  terminado: { label: "Sin respuesta", clase: "bg-muted text-foreground" },
  respondio: { label: "Respondió", clase: "bg-[#fff4d6] text-[#7a5600]" },
  interesado: { label: "Interesada", clase: "bg-success/15 text-success" },
  aliado: { label: "Aliada", clase: "bg-success text-white" },
  no_interesado: { label: "No interesada", clase: "bg-muted text-muted-foreground" },
  baja: { label: "Pidió baja", clase: "bg-muted text-muted-foreground" },
  rebotado: { label: "Rebotó", clase: "bg-destructive/10 text-destructive" },
  pausado: { label: "Pausada", clase: "bg-muted text-muted-foreground" },
};
const FILTROS = [
  { id: "todas", label: "Todas", estados: [] as string[] },
  { id: "respuestas", label: "Respuestas", estados: ["respondio", "interesado", "aliado"] },
  { id: "activas", label: "En curso", estados: ["por_contactar", "en_secuencia"] },
  { id: "falta", label: "Falta correo", estados: ["sin_contacto"] },
  { id: "manual", label: "Manual", estados: ["manual"] },
  { id: "cerradas", label: "Cerradas", estados: ["terminado", "no_interesado", "baja", "rebotado", "pausado"] },
];
const fecha = (d: string | null) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("es-DO", { day: "numeric", month: "short" }) : "—");

export function AlianzasInclusivas() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [q, setQ] = useState("");
  const [abierta, setAbierta] = useState<Aliado | null>(null);
  const [nueva, setNueva] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try { setDatos(await crm<Datos>("aliados_listar")); setError(""); }
    catch (e) { setError((e as Error).message); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const lista = useMemo(() => {
    const f = FILTROS.find((x) => x.id === filtro)!;
    const t = q.trim().toLowerCase();
    return (datos?.aliados ?? [])
      .filter((a) => !f.estados.length || f.estados.includes(a.estado))
      .filter((a) => !t || [a.nombre, a.correo, a.contacto_nombre, a.provincia, ...(a.enfoque ?? [])].some((x) => (x ?? "").toLowerCase().includes(t)));
  }, [datos, filtro, q]);

  if (cargando && !datos) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (error && !datos) return <Tarjeta titulo="No pude abrir Alianzas"><p className="text-sm text-muted-foreground">{error}</p><Button className="mt-3" size="sm" onClick={() => void cargar()}><RefreshCw className="size-4" /> Reintentar</Button></Tarjeta>;
  if (!datos) return null;
  const a = datos.aliados;
  const cuenta = (est: string[]) => a.filter((x) => est.includes(x.estado)).length;
  const respuestas = a.filter((x) => ["respondio", "interesado", "aliado"].includes(x.estado));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-extrabold"><HeartHandshake className="size-5 text-success" /> Alianzas inclusivas</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Fundaciones, asociaciones, ONG y empresas que trabajan por la inclusión de personas con discapacidad. Les escribimos con un correo propio, con nuestros objetivos, para que sigan la página y compartan las vacantes inclusivas. Salen {datos.config.limite} por día, aparte de las empresas, en 3 toques.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Interruptor activo={datos.config.activo} etiqueta={datos.config.activo ? "Enviando" : "En pausa"} onCambio={async (v) => { await crm("aliados_config", { activo: v }); toast.success(v ? "Alianzas activadas" : "Alianzas en pausa"); void cargar(); }} />
          <Button size="sm" variant="outline" onClick={() => setNueva(true)}><Plus className="size-4" /> Agregar</Button>
          <Button size="sm" variant="ghost" onClick={() => void cargar()} disabled={cargando}><RefreshCw className={cn("size-4", cargando && "animate-spin")} /> Actualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi titulo="Organizaciones" valor={a.length} onClick={() => setFiltro("todas")} />
        <Kpi titulo="En curso" valor={cuenta(["por_contactar", "en_secuencia"])} nota={`${datos.cola_hoy} salen hoy`} onClick={() => setFiltro("activas")} />
        <Kpi titulo="Falta correo" valor={cuenta(["sin_contacto"])} nota="la búsqueda semanal los completa" onClick={() => setFiltro("falta")} />
        <Kpi titulo="Respondieron" valor={respuestas.length} tono={respuestas.length ? "bien" : "normal"} onClick={() => setFiltro("respuestas")} />
        <Kpi titulo="Aliadas" valor={cuenta(["aliado"])} tono={cuenta(["aliado"]) ? "bien" : "normal"} />
        <Kpi titulo="Correos enviados" valor={datos.envios.filter((e) => e.estado === "enviado").length} />
      </div>

      {respuestas.length > 0 && (
        <Tarjeta titulo="Respuestas de organizaciones" ayuda="Lo que dijeron y lo que te toca.">
          <ul className="divide-y divide-border">
            {respuestas.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-bold">{r.nombre} <Estado e={r.estado} /></p>
                  {r.respuesta && <p className="mt-1 text-sm italic text-muted-foreground">«{r.respuesta}»</p>}
                  {r.siguiente_paso && <p className="mt-1 text-sm font-semibold text-[#7a5600]">👉 {r.siguiente_paso}</p>}
                  <p className="mt-0.5 text-xs text-muted-foreground">Respondió {haceDesde(r.respondio_en)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setAbierta(r)}>Abrir</Button>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <Button key={f.id} size="sm" variant={filtro === f.id ? "secondary" : "ghost"} className={filtro === f.id ? "font-bold" : ""} onClick={() => setFiltro(f.id)}>
            {f.label} <span className="ml-1 text-xs text-muted-foreground">{f.estados.length ? cuenta(f.estados) : a.length}</span>
          </Button>
        ))}
        <label className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input className={cn(campo, "mt-0 pl-9")} placeholder="Buscar organización o enfoque" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <ul className="divide-y divide-border">
          {lista.map((x) => (
            <li key={x.id}>
              <button type="button" className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-muted/40" onClick={() => setAbierta(x)}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{x.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{TIPO_ALIADO[x.tipo] ?? x.tipo}{x.enfoque?.length ? ` · ${x.enfoque.join(", ")}` : ""}{x.provincia ? ` · ${x.provincia}` : ""}</p>
                  {x.respuesta && <p className="mt-0.5 truncate text-xs italic text-muted-foreground">«{x.respuesta}»</p>}
                </div>
                <span className="text-xs text-muted-foreground">{x.correo ?? (x.telefono ? `Tel. ${x.telefono}` : "Sin contacto")}</span>
                <span className="text-xs text-muted-foreground">{x.n_envios ? `${x.n_envios} de 3 · ${fecha(x.ultimo_envio)}` : ""}</span>
                <Estado e={x.estado} />
              </button>
            </li>
          ))}
          {!lista.length && <li className="px-4 py-10 text-center text-sm text-muted-foreground">No hay organizaciones en este filtro.</li>}
        </ul>
      </div>

      {(abierta || nueva) && <Ficha aliado={abierta} onCerrar={() => { setAbierta(null); setNueva(false); }} onGuardado={() => { setAbierta(null); setNueva(false); void cargar(); }} />}
    </div>
  );
}

function Estado({ e }: { e: string }) {
  const s = ESTADO[e] ?? { label: e, clase: "bg-muted" };
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold", s.clase)}>{s.label}</span>;
}

function Ficha({ aliado, onCerrar, onGuardado }: { aliado: Aliado | null; onCerrar: () => void; onGuardado: () => void }) {
  const [f, setF] = useState({
    nombre: aliado?.nombre ?? "", tipo: aliado?.tipo ?? "fundacion", correo: aliado?.correo ?? "", telefono: aliado?.telefono ?? "",
    web: aliado?.web ?? "", instagram: aliado?.instagram ?? "", contacto_nombre: aliado?.contacto_nombre ?? "", nota: aliado?.nota ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [previa, setPrevia] = useState<{ asunto: string; html: string } | null>(null);
  const [paso, setPaso] = useState(1);

  const guardar = async () => {
    if (!f.nombre.trim()) return toast.error("Escribe el nombre.");
    setGuardando(true);
    try { await crm("aliado_guardar", aliado ? { id: aliado.id, ...f } : f); toast.success("Guardado"); onGuardado(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setGuardando(false); }
  };
  const marcar = async (estado: string) => {
    if (!aliado) return;
    const nota = ["respondio", "interesado", "aliado"].includes(estado) ? (window.prompt("¿Qué respondieron? (resumen corto)") ?? "") : "";
    await crm("aliado_estado", { id: aliado.id, estado, nota });
    toast.success(`Marcada: ${ESTADO[estado]?.label ?? estado}`);
    onGuardado();
  };
  const verPrevia = async (p: number) => {
    if (!aliado) return;
    setPaso(p);
    try { setPrevia(await crm<{ asunto: string; html: string }>("aliado_previa", { id: aliado.id, paso: p })); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onCerrar}>
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-background p-5 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Ficha de la organización">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold">{aliado ? aliado.nombre : "Nueva organización"}</h3>
            {aliado && <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Estado e={aliado.estado} /> {TIPO_ALIADO[aliado.tipo]} {aliado.fuente ? `· Fuente: ${aliado.fuente}` : ""}</div>}
          </div>
          <Button size="sm" variant="ghost" onClick={onCerrar} aria-label="Cerrar"><X className="size-4" /></Button>
        </div>

        {aliado?.respuesta && (
          <div className="mt-4 rounded-xl border border-[#f0d58a] bg-[#fff8e6] p-3 text-sm">
            <p className={rotulo}>Lo que respondieron</p>
            <p className="mt-1 italic">«{aliado.respuesta}»</p>
            {aliado.siguiente_paso && <p className="mt-1 font-semibold text-[#7a5600]">👉 {aliado.siguiente_paso}</p>}
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className={rotulo}>Nombre</span><input className={campo} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
          <label><span className={rotulo}>Tipo</span>
            <select className={campo} value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
              {Object.entries(TIPO_ALIADO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label><span className={rotulo}>Persona de contacto</span><input className={campo} value={f.contacto_nombre} onChange={(e) => setF({ ...f, contacto_nombre: e.target.value })} /></label>
          <label><span className={rotulo}>Correo</span><input className={campo} type="email" value={f.correo} onChange={(e) => setF({ ...f, correo: e.target.value })} /></label>
          <label><span className={rotulo}>Teléfono</span><input className={campo} value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} /></label>
          <label><span className={rotulo}>Web</span><input className={campo} value={f.web} onChange={(e) => setF({ ...f, web: e.target.value })} /></label>
          <label><span className={rotulo}>Instagram</span><input className={campo} value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} /></label>
          <label className="sm:col-span-2"><span className={rotulo}>Nota</span><textarea className={campo} rows={2} value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} /></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void guardar()} disabled={guardando}>{guardando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Guardar</Button>
          {aliado?.correo && <Button size="sm" variant="outline" asChild><a href={`mailto:${aliado.correo}`}><Mail className="size-4" /> Escribir</a></Button>}
          {aliado?.telefono && <Button size="sm" variant="outline" asChild><a href={`tel:${aliado.telefono.replace(/\D/g, "")}`}><Phone className="size-4" /> Llamar</a></Button>}
          {aliado?.instagram && <Button size="sm" variant="outline" asChild><a href={`https://instagram.com/${aliado.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer"><Instagram className="size-4" /> Instagram</a></Button>}
        </div>

        {aliado && (
          <>
            <p className={cn(rotulo, "mt-6")}>Marcar como</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["respondio", "interesado", "aliado", "no_interesado", "baja", "pausado", "por_contactar"].map((e) => (
                <Button key={e} size="sm" variant={aliado.estado === e ? "secondary" : "outline"} onClick={() => void marcar(e)}>{ESTADO[e].label}</Button>
              ))}
            </div>

            <p className={cn(rotulo, "mt-6")}>Correos que recibe</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3].map((p) => <Button key={p} size="sm" variant={previa && paso === p ? "secondary" : "outline"} onClick={() => void verPrevia(p)}><Eye className="size-4" /> Correo {p}</Button>)}
            </div>
            {previa && (
              <div className="mt-3">
                <p className="text-sm font-semibold">Asunto: {previa.asunto}</p>
                <iframe title="Vista previa del correo" className="mt-2 h-[32rem] w-full rounded-xl border border-border bg-white" srcDoc={previa.html} sandbox="" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, CalendarClock, Flame, Loader2, Mail, MessageCircle, MessageSquareQuote, Phone, Radar, RefreshCw, Search, Star, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tarjeta, fechaRD, haceDesde, rotulo } from "@/components/admin/comun";
import { ESTADO_CUENTA, SEGMENTOS, crm, enlaceWhatsApp, type Cuenta, type Motor, type Respuesta } from "@/lib/crm-empresas";
import { cn } from "@/lib/utils";

const pesos = (n: number | null | undefined) => (n ? `RD$${Math.round(n).toLocaleString("es-DO")}` : "—");
const fechaCorta = (d: string | null) => (d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("es-DO", { day: "numeric", month: "short" }) : "—");

/* ---------- Piezas visuales ---------- */
export function Termometro({ valor, grande }: { valor: number; grande?: boolean }) {
  const color = valor >= 75 ? "#dc2626" : valor >= 55 ? "#ea580c" : valor >= 35 ? "#ca8a04" : "#64748b";
  return (
    <div className={cn("flex items-center gap-2", grande ? "w-40" : "w-28")} title={`Temperatura ${valor} de 100`}>
      <div className={cn("flex-1 overflow-hidden rounded-full bg-muted", grande ? "h-2.5" : "h-1.5")}>
        <div className="h-full rounded-full transition-all" style={{ width: `${valor}%`, background: `linear-gradient(90deg, #fbbf24, ${color})` }} />
      </div>
      <span className={cn("tabular-nums font-extrabold", grande ? "text-lg" : "text-xs")} style={{ color }}>{valor}</span>
    </div>
  );
}

function Chip({ s, onClick, activo }: { s: string; onClick?: () => void; activo?: boolean }) {
  const color = SEGMENTOS[s]?.color ?? "#64748b";
  const cls = "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold";
  const style = activo ? { background: color, color: "#fff", borderColor: color } : { color, borderColor: `${color}55`, background: `${color}10` };
  return onClick ? <button type="button" onClick={onClick} className={cls} style={style}>{s}</button> : <span className={cls} style={style}>{s}</span>;
}

function EstadoCuenta({ e }: { e: string }) {
  const x = ESTADO_CUENTA[e] ?? ESTADO_CUENTA.detectada!;
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", x.clase)}>{x.label}</span>;
}

function Barra({ etiqueta, valor, max, nota, color = "var(--primary)" }: { etiqueta: string; valor: number; max: number; nota?: string; color?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm"><span className="truncate font-semibold">{etiqueta}</span><span className="tabular-nums text-muted-foreground">{valor}{nota ? ` · ${nota}` : ""}</span></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${max ? Math.max(3, (valor / max) * 100) : 0}%`, background: color }} /></div>
    </div>
  );
}

function BotonWhatsApp({ c, size = "sm" }: { c: Cuenta; size?: "sm" | "icon" }) {
  const url = (c.telefonos ?? []).map((t) => enlaceWhatsApp(t, c.nombre, c.ultimo_puesto)).find(Boolean);
  if (!url) return null;
  return (
    <Button size={size} variant="secondary" asChild>
      <a href={url} target="_blank" rel="noreferrer" aria-label={`Escribir por WhatsApp a ${c.nombre}`}><MessageCircle className="size-4 text-[#128C7E]" />{size === "sm" && " WhatsApp"}</a>
    </Button>
  );
}

/* ---------- Respuestas de empresas ---------- */
const ESTADO_RESPUESTA: Record<string, { label: string; clase: string; borde: string }> = {
  interesado: { label: "Interesada", clase: "bg-success/15 text-success", borde: "border-success/40" },
  registrada: { label: "Registrada", clase: "bg-success text-white", borde: "border-success/40" },
  respondio: { label: "Respondió", clase: "bg-[#fff4d6] text-[#7a5600]", borde: "border-[#f0d58a]" },
  no_interesado: { label: "No interesada", clase: "bg-muted text-muted-foreground", borde: "border-border" },
  baja: { label: "Pidió no escribir más", clase: "bg-destructive/10 text-destructive", borde: "border-border" },
};

function BandejaRespuestas({ lista, onAbrirCuenta }: { lista: Respuesta[]; onAbrirCuenta: (clave: string) => void }) {
  const [todas, setTodas] = useState(false);
  const abiertas = lista.filter((r) => ["interesado", "registrada", "respondio"].includes(r.estado));
  const cerradas = lista.length - abiertas.length;
  const ver = todas ? lista : abiertas;
  const hoy = new Date().toISOString().slice(0, 10);
  return (
    <section className="rounded-2xl border-2 border-primary/25 bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-base font-extrabold"><MessageSquareQuote className="size-5 text-primary" /> Respuestas de empresas
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{abiertas.length} por atender</span>
        </p>
        {cerradas > 0 && <Button size="sm" variant="ghost" onClick={() => setTodas(!todas)}>{todas ? "Ver solo las abiertas" : `Ver también las cerradas (${cerradas})`}</Button>}
      </div>
      {lista.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Todavía ninguna empresa ha respondido. Cuando una lo haga, aparece aquí con lo que dijo, el siguiente paso y la fecha del seguimiento. También te llega un aviso al correo.
        </p>
      ) : ver.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No hay respuestas abiertas ahora mismo.</p>
      ) : (
        <ul className="mt-3 grid gap-3 lg:grid-cols-2">
          {ver.map((r) => {
            const e = ESTADO_RESPUESTA[r.estado] ?? ESTADO_RESPUESTA.respondio!;
            const vence = r.seguimiento_en && r.seguimiento_en.slice(0, 10) <= hoy;
            const wa = r.telefono ? enlaceWhatsApp(r.telefono, r.empresa, r.puesto) : null;
            return (
              <li key={r.correo} className={cn("rounded-xl border bg-background p-4", e.borde)}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-extrabold">{r.empresa}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.contacto ? `${r.contacto} · ` : ""}{r.correo}</p>
                  </div>
                  <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", e.clase)}>{e.label}</span>
                </div>
                {r.respuesta && <blockquote className="mt-3 border-l-4 border-primary/40 pl-3 text-sm italic text-foreground/90">«{r.respuesta}»</blockquote>}
                <p className="mt-2 text-[11px] text-muted-foreground">Respondió {haceDesde(r.respondio_en)}</p>
                {r.siguiente_paso && (
                  <div className={cn("mt-3 rounded-lg px-3 py-2 text-sm", vence ? "bg-[#fff4d6] text-[#7a5600]" : "bg-muted/60")}>
                    <p className="font-bold">Siguiente paso</p>
                    <p>{r.siguiente_paso}</p>
                    {r.seguimiento_en && <p className="mt-1 flex items-center gap-1 text-xs"><CalendarClock className="size-3.5" />{vence ? "Seguimiento automático: hoy" : `Seguimiento automático: ${fechaCorta(r.seguimiento_en)}`}{r.seguimientos ? ` · ${r.seguimientos} enviado(s)` : ""}</p>}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.clave && <Button size="sm" variant="secondary" onClick={() => onAbrirCuenta(r.clave!)}>Abrir empresa <ArrowRight className="size-4" /></Button>}
                  {wa && <Button size="sm" variant="ghost" asChild><a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="size-4 text-[#128C7E]" /> WhatsApp</a></Button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------- Tablero estratégico ---------- */
export function MotorVista({ onAbrirCuenta, onFiltrar }: { onAbrirCuenta: (clave: string) => void; onFiltrar: (segmento: string) => void }) {
  const [m, setM] = useState<Motor | null>(null);
  const [cargando, setCargando] = useState(true);
  const [recalculando, setRecalculando] = useState(false);
  const cargar = async () => {
    setCargando(true);
    try { setM(await crm<Motor>("motor")); } catch (e) { toast.error((e as Error).message); } finally { setCargando(false); }
  };
  useEffect(() => { void cargar(); }, []);
  const recalcular = async () => {
    setRecalculando(true);
    try { await crm("recalcular"); toast.success("Motor recalculado con las vacantes más recientes"); await cargar(); }
    catch (e) { toast.error((e as Error).message); } finally { setRecalculando(false); }
  };

  const d = useMemo(() => {
    if (!m) return null;
    const c = m.cuentas;
    const seg = (s: string) => c.filter((x) => x.segmentos.includes(s));
    const contactadas = c.filter((x) => ["en_secuencia", "sin_respuesta", "respondio", "interesada", "registrada", "no_interesada"].includes(x.estado)).length;
    return {
      total: c.length,
      conContacto: c.filter((x) => x.n_contactos > 0 || (x.telefonos?.length ?? 0) > 0).length,
      corporativo: c.filter((x) => x.n_corporativos > 0).length,
      contactadas,
      respondieron: c.filter((x) => ["respondio", "interesada", "registrada", "no_interesada"].includes(x.estado)).length,
      interesadas: c.filter((x) => ["interesada", "registrada"].includes(x.estado)).length,
      registradas: c.filter((x) => x.estado === "registrada").length,
      calientes: c.filter((x) => x.estado !== "no_interesada").slice(0, 12),
      contratandoAhora: seg("Contratando ahora").length,
      whatsapp: c.filter((x) => x.n_corporativos === 0 && (x.telefonos?.length ?? 0) > 0 && !["no_interesada", "registrada"].includes(x.estado)).slice(0, 10),
      segmentos: Object.keys(SEGMENTOS).map((s) => ({ s, n: seg(s).length, top: seg(s).slice(0, 3).map((x) => x.nombre) })).filter((x) => x.n > 0),
    };
  }, [m]);

  if (cargando && !m) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!m || !d) return <Tarjeta titulo="No pude cargar el motor"><Button size="sm" onClick={() => void cargar()}><RefreshCw className="size-4" /> Reintentar</Button></Tarjeta>;
  const maxArea = Math.max(...m.por_area.map((a) => a.vacantes), 1);
  const maxProv = Math.max(...m.por_provincia.map((a) => a.vacantes), 1);
  const embudo = [
    { k: "Empresas detectadas", v: d.total, nota: "publican en Enlace o están en tu lista" },
    { k: "Con algún contacto", v: d.conContacto, nota: "correo o teléfono" },
    { k: "Con correo corporativo", v: d.corporativo, nota: "entran en la cola automática" },
    { k: "Contactadas", v: d.contactadas },
    { k: "Respondieron", v: d.respondieron },
    { k: "Interesadas", v: d.interesadas },
    { k: "Registradas", v: d.registradas },
  ];
  const maxSem = Math.max(...m.semanas.map((s) => s.enviados), 1);

  return (
    <div className="space-y-5">
      {/* Portada */}
      <section className="relative overflow-hidden rounded-3xl p-6 text-white sm:p-8" style={{ background: "radial-gradient(1200px 400px at 90% -20%, #2F6FD1 0%, transparent 60%), linear-gradient(135deg, #0B2D5B 0%, #123f7d 60%, #0B2D5B 100%)" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 size-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 top-6 size-40 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#8EC1FF]"><Radar className="size-4" /> Motor estratégico de empresas</p>
            <h3 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
              {d.contratandoAhora} empresas están contratando esta semana.
              <span className="text-[#8EC1FF]"> {m.cola.length} van en el próximo envío</span>{d.whatsapp.length ? <> y <span className="text-[#8EC1FF]">{d.whatsapp.length}</span> esperan tu toque personal.</> : "."}
            </h3>
            <p className="mt-2 text-sm text-white/75">
              {m.vacantes_90d.toLocaleString("es-DO")} vacantes en 90 días. Solo {m.mercado_pct_salario} de cada 100 muestran el salario, y ese dato se convierte en argumento en cada correo.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => void recalcular()} disabled={recalculando}><RefreshCw className={cn("size-4", recalculando && "animate-spin")} /> Recalcular ahora</Button>
            {m.sincronizado && <p className="text-[11px] text-white/60">Vacantes al día: {fechaRD(m.sincronizado)} · se actualiza cada 3 h</p>}
          </div>
        </div>
      </section>

      {/* Respuestas */}
      <BandejaRespuestas lista={m.respuestas ?? []} onAbrirCuenta={onAbrirCuenta} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Empresas calientes */}
        <Tarjeta titulo="🔥 Empresas más calientes" ayuda="La temperatura (0 a 100) sube con vacantes recientes, volumen, puestos repetidos, áreas distintas, contacto disponible y respuestas.">
          <ul className="divide-y divide-border">
            {d.calientes.map((c, i) => (
              <li key={c.clave} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-5 text-center text-sm font-extrabold text-muted-foreground">{i + 1}</span>
                <button type="button" onClick={() => onAbrirCuenta(c.clave)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-bold hover:text-primary">{c.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.motivo || c.area}</p>
                  <div className="mt-1 flex flex-wrap gap-1">{c.segmentos.slice(0, 3).map((s) => <Chip key={s} s={s} />)}</div>
                </button>
                <Termometro valor={c.temperatura} />
                <div className="flex gap-1"><BotonWhatsApp c={c} size="icon" /><Button size="icon" variant="ghost" onClick={() => onAbrirCuenta(c.clave)} aria-label={`Abrir ${c.nombre}`}><ArrowRight className="size-4" /></Button></div>
              </li>
            ))}
          </ul>
        </Tarjeta>

        <div className="space-y-4">
          {/* Embudo */}
          <Tarjeta titulo="Embudo de empresas">
            <div className="space-y-2">
              {embudo.map((e, i) => (
                <div key={e.k}>
                  <div className="flex items-baseline justify-between text-sm"><span className="font-semibold">{e.k}</span><span className="tabular-nums font-extrabold">{e.v}</span></div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${Math.max(2, (e.v / Math.max(d.total, 1)) * 100)}%`, background: `hsl(${215 - i * 18} 70% ${42 + i * 3}%)` }} /></div>
                  {e.nota && <p className="text-[11px] text-muted-foreground">{e.nota}</p>}
                </div>
              ))}
            </div>
          </Tarjeta>

          {/* La cola */}
          <Tarjeta titulo={`📬 Próximos en la cola (${m.cola.length})`} ayuda="Orden: primero las que pusiste de primeras, después los seguimientos y luego las más calientes.">
            {m.cola.length === 0 ? <p className="text-sm text-muted-foreground">No hay nadie en la cola ahora mismo.</p> : (
              <ol className="space-y-2 text-sm">
                {m.cola.slice(0, 10).map((q) => (
                  <li key={q.correo} className="flex items-center justify-between gap-2">
                    <span className="min-w-0"><span className="font-semibold">{q.empresa}</span> <span className="text-xs text-muted-foreground">· correo {q.paso_siguiente}</span></span>
                    <Termometro valor={q.temperatura} />
                  </li>
                ))}
                {m.cola.length > 10 && <li className="text-xs text-muted-foreground">y {m.cola.length - 10} más…</li>}
              </ol>
            )}
          </Tarjeta>
        </div>
      </div>

      {/* Oportunidades por segmento */}
      <Tarjeta titulo="Oportunidades por tipo de empresa" ayuda="Cada grupo recibe un argumento distinto en el primer correo. Toca uno para ver sus empresas.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {d.segmentos.map(({ s, n, top }) => (
            <button key={s} type="button" onClick={() => onFiltrar(s)} className="lift rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary">
              <div className="flex items-center justify-between"><Chip s={s} /><span className="text-2xl font-extrabold tabular-nums" style={{ color: SEGMENTOS[s]?.color }}>{n}</span></div>
              <p className="mt-2 text-sm text-muted-foreground">{SEGMENTOS[s]?.idea}</p>
              {top.length > 0 && <p className="mt-2 truncate text-xs"><span className="font-semibold">Ej.:</span> {top.join(", ")}</p>}
            </button>
          ))}
        </div>
      </Tarjeta>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Toque personal */}
        <Tarjeta titulo="💬 Toque personal por WhatsApp" ayuda="Empresas sin correo corporativo pero con teléfono en su vacante. El motor no les escribe solo: un mensaje tuyo, uno a uno, convierte mucho más.">
          {d.whatsapp.length === 0 ? <p className="text-sm text-muted-foreground">No hay empresas en este grupo ahora.</p> : (
            <ul className="divide-y divide-border">
              {d.whatsapp.map((c) => (
                <li key={c.clave} className="flex items-center justify-between gap-2 py-2.5">
                  <button type="button" className="min-w-0 text-left" onClick={() => onAbrirCuenta(c.clave)}>
                    <p className="truncate text-sm font-bold">{c.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.ultimo_puesto ?? c.area}{c.vacantes_90d > 1 ? ` · ${c.vacantes_90d} vacantes` : ""}</p>
                  </button>
                  <BotonWhatsApp c={c} />
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        {/* Mercado */}
        <Tarjeta titulo="📊 Dónde se está contratando (90 días)">
          <p className={rotulo}>Por área</p>
          <div className="mt-2 space-y-2">{m.por_area.slice(0, 7).map((a) => <Barra key={a.area} etiqueta={a.area} valor={a.vacantes} max={maxArea} nota={`${a.empresas} empresas`} />)}</div>
          <p className={cn(rotulo, "mt-4")}>Por provincia</p>
          <div className="mt-2 space-y-2">{m.por_provincia.slice(0, 6).map((p) => <Barra key={p.provincia} etiqueta={p.provincia} valor={p.vacantes} max={maxProv} nota={`${p.empresas} empresas`} color="#0e7490" />)}</div>
        </Tarjeta>
      </div>

      {m.semanas.length > 0 && (
        <Tarjeta titulo="Correos enviados por semana">
          <div className="flex h-32 items-end gap-2">
            {m.semanas.map((s) => (
              <div key={s.semana} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-bold tabular-nums">{s.enviados}</span>
                <div className="w-full rounded-t-lg bg-primary" style={{ height: `${Math.max(4, (s.enviados / maxSem) * 96)}px` }} />
                <span className="text-[10px] text-muted-foreground">{fechaCorta(s.semana)}</span>
              </div>
            ))}
          </div>
        </Tarjeta>
      )}
    </div>
  );
}

/* ---------- Lista de cuentas ---------- */
export function CuentasVista({ segmentoInicial, onAbrirCuenta }: { segmentoInicial: string; onAbrirCuenta: (clave: string) => void }) {
  const [cuentas, setCuentas] = useState<Cuenta[] | null>(null);
  const [seg, setSeg] = useState(segmentoInicial);
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState<"temperatura" | "vacantes" | "reciente">("temperatura");
  useEffect(() => { setSeg(segmentoInicial); }, [segmentoInicial]);
  useEffect(() => { void crm<Motor>("motor").then((m) => setCuentas(m.cuentas)).catch((e: Error) => toast.error(e.message)); }, []);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (cuentas ?? [])
      .filter((c) => !seg || c.segmentos.includes(seg))
      .filter((c) => !t || [c.nombre, c.dominio, c.area, c.provincia, c.ultimo_puesto].some((x) => (x ?? "").toLowerCase().includes(t)))
      .sort((a, b) => orden === "vacantes" ? b.vacantes_90d - a.vacantes_90d : orden === "reciente" ? (b.ultima_vacante ?? "").localeCompare(a.ultima_vacante ?? "") : b.temperatura - a.temperatura);
  }, [cuentas, seg, q, orden]);
  const conteo = useMemo(() => {
    const r: Record<string, number> = {};
    for (const c of cuentas ?? []) for (const s of c.segmentos) r[s] = (r[s] ?? 0) + 1;
    return r;
  }, [cuentas]);

  if (!cuentas) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip s={`Todas · ${cuentas.length}`} activo={!seg} onClick={() => setSeg("")} />
        {Object.keys(SEGMENTOS).filter((s) => conteo[s]).map((s) => (
          <button key={s} type="button" onClick={() => setSeg(seg === s ? "" : s)} className="contents"><Chip s={`${s} · ${conteo[s]}`} activo={seg === s} /></button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa, dominio, puesto…" aria-label="Buscar empresas" className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary" />
        </div>
        <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} aria-label="Ordenar" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
          <option value="temperatura">Más calientes primero</option><option value="vacantes">Más vacantes (90 días)</option><option value="reciente">Publicaron más reciente</option>
        </select>
        <span className="text-sm text-muted-foreground">{lista.length} empresas</span>
      </div>
      {seg && SEGMENTOS[seg] && <p className="rounded-xl bg-muted/60 px-4 py-2 text-sm"><span className="font-bold">Estrategia:</span> {SEGMENTOS[seg].idea}</p>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {lista.slice(0, 150).map((c) => (
          <button key={c.clave} type="button" onClick={() => onAbrirCuenta(c.clave)} className="lift flex flex-col rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-primary">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0"><p className="truncate font-extrabold">{c.nombre}</p><p className="truncate text-xs text-muted-foreground">{[c.area, c.provincia].filter(Boolean).join(" · ")}</p></div>
              <EstadoCuenta e={c.estado} />
            </div>
            <div className="mt-3 flex items-center justify-between"><Termometro valor={c.temperatura} /><span className="text-xs text-muted-foreground">{c.vacantes_90d} vac. 90 d</span></div>
            <div className="mt-2 flex flex-wrap gap-1">{c.segmentos.slice(0, 3).map((s) => <Chip key={s} s={s} />)}</div>
            <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary"><ArrowRight className="size-3.5" /> {c.accion}</p>
            <div className="mt-2 flex gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="size-3" />{c.n_corporativos}/{c.n_contactos}</span>
              {(c.telefonos?.length ?? 0) > 0 && <span className="flex items-center gap-1"><Phone className="size-3" />{c.telefonos!.length}</span>}
              {c.ultima_vacante && <span>Última: {fechaCorta(c.ultima_vacante)}</span>}
            </div>
          </button>
        ))}
      </div>
      {lista.length > 150 && <p className="text-center text-sm text-muted-foreground">Mostrando 150 de {lista.length}. Usa el buscador o un grupo para afinar.</p>}
    </div>
  );
}

/* ---------- Ficha de una empresa ---------- */
type DetalleCuenta = {
  cuenta: Cuenta & { area_principal?: string; provincia_principal?: string; estado_cuenta?: string; areas?: string[]; provincias?: string[]; primera_vacante?: string };
  contactos: { correo: string; contacto_nombre: string | null; cargo: string | null; estado: string; paso: number; enviable: boolean; tipo_correo: string; dominio_ok: boolean | null; prioridad: boolean; telefono: string | null; ultimo_envio: string | null; proximo_envio: string | null; fuente: string }[];
  vacantes: { id: string; titulo: string; area: string | null; provincia: string | null; salario_min: number | null; salario_max: number | null; created_at: string }[];
  mercado: { area: string; n: number; promedio: number; mediana: number }[];
  actividad: { id: number; correo: string | null; tipo: string; detalle: string | null; creado: string }[];
};

export function FichaCuenta({ clave, onCerrar, onAbrirContacto }: { clave: string; onCerrar: () => void; onAbrirContacto: (correo: string) => void }) {
  const [d, setD] = useState<DetalleCuenta | null>(null);
  const cargar = () => crm<DetalleCuenta>("cuenta", { clave }).then(setD).catch((e: Error) => toast.error(e.message));
  useEffect(() => { void cargar(); }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  const priorizar = async (correo: string, valor: boolean) => {
    try { await crm("priorizar", { correo, valor }); toast.success(valor ? "Sale de primera en el próximo envío" : "Prioridad quitada"); await cargar(); }
    catch (e) { toast.error((e as Error).message); }
  };
  const excluir = async () => {
    if (!confirm("¿Sacar esta empresa del motor? No se le escribirá más.")) return;
    try { await crm("excluir_cuenta", { clave, valor: true }); toast.success("Empresa excluida"); onCerrar(); }
    catch (e) { toast.error((e as Error).message); }
  };
  const c = d?.cuenta;
  const estado = c?.estado_cuenta ?? c?.estado ?? "detectada";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-label="Ficha de la empresa" onClick={onCerrar}>
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        {!d || !c ? <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div> : (
          <>
            <div className="sticky top-0 z-10 border-b border-border bg-background/95 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn(rotulo, "flex items-center gap-1")}><Building2 className="size-3.5" /> Empresa</p>
                  <h3 className="truncate text-xl font-extrabold">{c.nombre}</h3>
                  <p className="text-sm text-muted-foreground">{[c.area_principal, c.provincia_principal, c.dominio].filter(Boolean).join(" · ")}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={onCerrar} aria-label="Cerrar"><X className="size-5" /></Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3"><Termometro valor={c.temperatura} grande /><EstadoCuenta e={estado} />{c.segmentos.map((s) => <Chip key={s} s={s} />)}</div>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
                <p className="flex items-center gap-2 text-sm font-extrabold text-primary"><Flame className="size-4" /> Siguiente paso: {c.accion}</p>
                {c.motivo && <p className="mt-1 text-sm text-muted-foreground">Señales: {c.motivo}</p>}
                <div className="mt-3 flex flex-wrap gap-2"><BotonWhatsApp c={{ ...c, nombre: c.nombre } as Cuenta} /></div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-border p-3"><p className="text-2xl font-extrabold">{c.vacantes_90d}</p><p className="text-[11px] text-muted-foreground">vacantes en 90 días</p></div>
                <div className="rounded-xl border border-border p-3"><p className="text-2xl font-extrabold">{c.puestos_repetidos}</p><p className="text-[11px] text-muted-foreground">puestos repetidos</p></div>
                <div className="rounded-xl border border-border p-3"><p className="text-2xl font-extrabold">{c.pct_salario}%</p><p className="text-[11px] text-muted-foreground">publica salario</p></div>
              </div>

              <Tarjeta titulo={`Contactos (${d.contactos.length})`} ayuda="Solo los corporativos con dominio verificado reciben correos automáticos. Una persona por empresa a la vez.">
                {d.contactos.length === 0 ? <p className="text-sm text-muted-foreground">Sin correos todavía. Agrega uno desde «Contactos → Agregar empresa».</p> : (
                  <ul className="divide-y divide-border">
                    {d.contactos.map((p) => (
                      <li key={p.correo} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                        <button type="button" className="min-w-0 text-left" onClick={() => onAbrirContacto(p.correo)}>
                          <p className="truncate text-sm font-semibold">{p.contacto_nombre ? `${p.contacto_nombre} · ` : ""}{p.correo}</p>
                          <p className="text-xs text-muted-foreground">{p.enviable ? (p.dominio_ok ? "Corporativo verificado" : "Corporativo, verificando dominio") : "Personal: sin envío automático"} · {p.estado.replace("_", " ")}{p.paso ? ` · correo ${p.paso}/4` : ""}</p>
                        </button>
                        {p.enviable && ["nuevo", "en_secuencia"].includes(p.estado) && (
                          <Button size="sm" variant={p.prioridad ? "secondary" : "ghost"} onClick={() => void priorizar(p.correo, !p.prioridad)}><Star className={cn("size-4", p.prioridad && "fill-current text-[#ca8a04]")} /> {p.prioridad ? "De primera" : "Poner de primera"}</Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Tarjeta>

              {d.mercado.length > 0 && (
                <Tarjeta titulo="Lo que paga el mercado en sus áreas" ayuda="Promedio de lo publicado en Enlace. Úsalo en una llamada o respuesta: es un dato que la empresa valora.">
                  <ul className="space-y-1 text-sm">{d.mercado.map((x) => <li key={x.area} className="flex justify-between"><span>{x.area}</span><span className="font-semibold tabular-nums">{pesos(x.promedio)} <span className="text-xs font-normal text-muted-foreground">({x.n} vacantes)</span></span></li>)}</ul>
                </Tarjeta>
              )}

              <Tarjeta titulo={`Sus vacantes en Enlace (${d.vacantes.length})`}>
                <ul className="divide-y divide-border">
                  {d.vacantes.slice(0, 25).map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <a href={`/vacantes/${v.id}`} target="_blank" rel="noreferrer" className="min-w-0 truncate font-semibold hover:text-primary">{v.titulo}</a>
                      <span className="shrink-0 text-xs text-muted-foreground">{v.salario_min ? pesos(v.salario_min) + " · " : ""}{fechaCorta(v.created_at)}</span>
                    </li>
                  ))}
                </ul>
                {d.vacantes.length > 25 && <p className="mt-2 text-xs text-muted-foreground">y {d.vacantes.length - 25} más.</p>}
              </Tarjeta>

              {d.actividad.length > 0 && (
                <Tarjeta titulo="Historial">
                  <ol className="space-y-2">{d.actividad.slice(0, 20).map((a) => <li key={a.id} className="text-sm"><p>{a.tipo === "envio" ? "✉️ " : ""}{a.detalle ?? a.tipo}</p><p className="text-xs text-muted-foreground">{fechaRD(a.creado)}{a.correo ? ` · ${a.correo}` : ""}</p></li>)}</ol>
                </Tarjeta>
              )}

              <div className="flex justify-end"><Button size="sm" variant="ghost" className="text-destructive" onClick={() => void excluir()}>Sacar esta empresa del motor</Button></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


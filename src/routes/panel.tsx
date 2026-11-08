import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, Crown, Briefcase, CalendarDays, ChevronRight, ExternalLink, Home, LogOut, Menu, MessageSquareText, Plus, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Logo } from "@/components/site/Logo";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { PanelCtx, type AccionVacante, type PanelApi, type Seccion } from "@/components/panel/contexto";
import { Inicio } from "@/components/panel/Inicio";
import { Candidatos } from "@/components/panel/Candidatos";
import { Ficha } from "@/components/panel/Ficha";
import { Agendar } from "@/components/panel/Agendar";
import { Agenda } from "@/components/panel/Agenda";
import { VacantesEmpresa } from "@/components/panel/VacantesEmpresa";
import { PublicarEmpresa } from "@/components/panel/PublicarEmpresa";
import { Mensajes } from "@/components/panel/Mensajes";
import { MiEmpresa } from "@/components/panel/MiEmpresa";
import { Planes } from "@/components/panel/Planes";
import { cargarVistas, type Vistas } from "@/lib/vistas";
import { Titulo } from "@/components/panel/comun";
import { supabase } from "@/integrations/supabase/client";
import { diasRestantes } from "@/lib/claridad";
import { CAMPOS_CANDIDATO, CAMPOS_EMPRESA, enlaceContacto, etapaDe, mensajePara, planActivo, type Candidato, type EmpresaPerfil, type Etapa, type Evento } from "@/lib/panel";
import { rowToVacante, SELECT, type Vacante, type VacanteRow } from "@/lib/vacantes";

const SECCIONES: Seccion[] = ["inicio", "candidatos", "agenda", "vacantes", "publicar", "mensajes", "empresa", "planes", "mas"];
type Search = { s?: Seccion; c?: string };

export const Route = createFileRoute("/panel")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    s: SECCIONES.includes(s["s"] as Seccion) ? (s["s"] as Seccion) : undefined,
    c: typeof s["c"] === "string" && /^[0-9a-f-]{36}$/i.test(s["c"]) ? s["c"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Panel de empresa | Enlace Laboral" }, { name: "robots", content: "noindex" }] }),
  component: Panel,
});

type Solicitud = { tipo: string; vacante_id: string | null; estado: string };

function Panel() {
  const navigate = useNavigate({ from: "/panel" });
  const search = Route.useSearch();
  const seccion = search.s ?? "inicio";
  const qc = useQueryClient();
  const [uid, setUid] = useState("");
  const [empresa, setEmpresa] = useState<EmpresaPerfil | null | undefined>(undefined);
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [vistas, setVistas] = useState<Record<string, Vistas>>({});
  const [filtro, setFiltro] = useState<{ vacante: string; etapa: Etapa | "" }>({ vacante: "", etapa: "" });
  const [base, setBase] = useState<{ v: Vacante | null; duplicar: boolean }>({ v: null, duplicar: false });
  const [agendando, setAgendando] = useState<Candidato | null>(null);
  const [avisos, setAvisos] = useState<NotificationPermission | "no">("no");
  const ids = useRef<Set<string>>(new Set());
  const misVacantes = useRef<Set<string>>(new Set());
  const candidatosRef = useRef<Candidato[]>([]);
  candidatosRef.current = candidatos;

  const ir = useCallback((s: Seccion, f?: { vacante?: string; etapa?: Etapa | "" }) => {
    if (f) setFiltro((x) => ({ vacante: f.vacante ?? x.vacante, etapa: f.etapa ?? x.etapa }));
    if (s !== "publicar") setBase({ v: null, duplicar: false });
    void navigate({ search: (x: Search) => ({ ...x, s: s === "inicio" ? undefined : s }) });
    window.scrollTo({ top: 0 });
  }, [navigate]);
  const abrir = useCallback((id: string) => void navigate({ search: (x: Search) => ({ ...x, c: id }) }), [navigate]);
  const cerrarFicha = useCallback(() => void navigate({ search: (x: Search) => ({ ...x, c: undefined }) }), [navigate]);

  /* ───── Carga ───── */

  const aCandidato = (r: Record<string, unknown>): Candidato => ({ ...(r as unknown as Candidato), historial: Array.isArray(r["historial"]) ? (r["historial"] as Evento[]) : [] });

  const avisarNuevos = useCallback((nuevos: Candidato[]) => {
    if (!nuevos.length) return;
    const t = nuevos.length === 1 ? `Nuevo candidato: ${nuevos[0]!.nombre}` : `${nuevos.length} candidatos nuevos`;
    toast.success(t, { action: { label: "Ver", onClick: () => (nuevos.length === 1 ? abrir(nuevos[0]!.id) : ir("candidatos", { etapa: "nuevo", vacante: "" })) } });
    if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState !== "visible") {
      try { new Notification("Enlace Laboral", { body: t, icon: "/favicon.ico", tag: "enlace-candidatos" }); } catch { /* sin avisos */ }
    }
  }, [abrir, ir]);

  const cargarCandidatos = useCallback(async (vids: string[], avisar: boolean) => {
    if (!vids.length) { setCandidatos([]); return; }
    const filas: Candidato[] = [];
    for (let i = 0; i < vids.length; i += 150) {
      const { data } = await supabase.from("aplicaciones").select(CAMPOS_CANDIDATO).in("vacante_id", vids.slice(i, i + 150)).order("created_at", { ascending: false }).limit(3000);
      filas.push(...((data ?? []) as unknown as Record<string, unknown>[]).map(aCandidato));
    }
    filas.sort((a, b) => b.created_at.localeCompare(a.created_at));
    const llegaron = filas.filter((c) => !ids.current.has(c.id));
    if (avisar && ids.current.size) avisarNuevos(llegaron);
    ids.current = new Set(filas.map((c) => c.id));
    setCandidatos(filas);
  }, [avisarNuevos]);

  const cargarTodo = useCallback(async (id: string) => {
    const [{ data }, { data: sol }, vs30] = await Promise.all([
      supabase.from("vacantes").select(SELECT).eq("owner_id", id).order("created_at", { ascending: false }).limit(1000),
      supabase.from("solicitudes_empresa").select("tipo,vacante_id,estado").eq("owner_id", id).order("created_at", { ascending: false }).limit(100),
      cargarVistas(),
    ]);
    setVistas(vs30);
    const vs = ((data ?? []) as unknown as VacanteRow[]).map(rowToVacante);
    misVacantes.current = new Set(vs.map((v) => v.id));
    setVacantes(vs);
    setSolicitudes((sol ?? []) as unknown as Solicitud[]);
    await cargarCandidatos(vs.map((v) => v.id), false);
  }, [cargarCandidatos]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const id = data.session?.user.id;
      if (!id) { await navigate({ to: "/auth" }); return; }
      setUid(id);
      if (typeof Notification !== "undefined") setAvisos(Notification.permission);
      const { data: e } = await supabase.from("empresas").select(CAMPOS_EMPRESA).eq("owner_id", id).limit(1).maybeSingle();
      if (!e) {
        // Candidatos con cuenta (guardaron su CV) no tienen panel de empresa: van a su búsqueda.
        const { count } = await supabase.from("candidatos").select("user_id", { count: "exact", head: true }).eq("user_id", id);
        if (count) { await navigate({ to: "/guardadas" }); return; }
      }
      setEmpresa(e ? ({ ...(e as unknown as EmpresaPerfil), plantillas: ((e as unknown as Record<string, unknown>)["plantillas"] ?? {}) as EmpresaPerfil["plantillas"] }) : null);
      await cargarTodo(id);
    })();
  }, [navigate, cargarTodo]);

  // Llegan solos: en vivo cuando se puede, y revisión cada 90 s por si acaso.
  useEffect(() => {
    if (!uid) return;
    const canal = supabase.channel(`panel-${uid}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "aplicaciones" }, (pl) => {
      const fila = aCandidato(pl.new as Record<string, unknown>);
      if (!misVacantes.current.has(fila.vacante_id) || ids.current.has(fila.id)) return;
      ids.current.add(fila.id);
      setCandidatos((xs) => [fila, ...xs]);
      avisarNuevos([fila]);
    }).subscribe();
    const revisar = () => { if (document.visibilityState === "visible") void cargarCandidatos([...misVacantes.current], true); };
    const t = window.setInterval(revisar, 90_000);
    document.addEventListener("visibilitychange", revisar);
    return () => { void supabase.removeChannel(canal); window.clearInterval(t); document.removeEventListener("visibilitychange", revisar); };
  }, [uid, cargarCandidatos, avisarNuevos]);

  /* ───── Acciones ───── */

  const actualizar = useCallback<PanelApi["actualizar"]>(async (c, cambios, evento) => {
    const actual = candidatosRef.current.find((x) => x.id === c.id) ?? c;
    const completo: Partial<Candidato> = { ...cambios };
    if (evento) completo.historial = [...actual.historial, { t: new Date().toISOString(), ...evento }].slice(-200);
    setCandidatos((xs) => xs.map((x) => (x.id === c.id ? { ...x, ...completo } : x)));
    const { error } = await supabase.from("aplicaciones").update(completo).eq("id", c.id);
    if (error) {
      setCandidatos((xs) => xs.map((x) => (x.id === c.id ? actual : x)));
      toast.error("No se pudo guardar. Revisa tu internet e intenta otra vez.");
      return false;
    }
    return true;
  }, []);

  const puesto = useCallback((id: string) => vacantes.find((v) => v.id === id)?.titulo ?? "la vacante", [vacantes]);

  const abrirEnlace = (href: string, etiqueta: string) => {
    const w = window.open(href, "_blank", "noopener");
    if (!w && !href.startsWith("mailto:")) toast(etiqueta, { action: { label: "Abrir", onClick: () => window.open(href, "_blank", "noopener") } });
  };

  const contactar = useCallback<PanelApi["contactar"]>((c, etapa) => {
    if (!empresa) return;
    const texto = mensajePara(etapa ?? (c.etapa === "nuevo" ? "revision" : c.etapa), c, puesto(c.vacante_id), empresa.nombre, empresa.plantillas);
    const link = enlaceContacto(c, texto, puesto(c.vacante_id));
    if (!link) return void toast.error("Esta persona no dejó un teléfono o correo válido.");
    abrirEnlace(link.href, `Abrir ${link.tipo === "whatsapp" ? "WhatsApp" : "correo"} para ${c.nombre.split(" ")[0]}`);
    const cambios: Partial<Candidato> = c.etapa === "nuevo" ? { etapa: "revision", etapa_at: new Date().toISOString() } : {};
    void actualizar(c, cambios, { tipo: "mensaje", texto: `Le escribiste por ${link.tipo === "whatsapp" ? "WhatsApp" : "correo"}` });
  }, [empresa, puesto, actualizar]);

  const mover = useCallback<PanelApi["mover"]>(async (c, etapa, opciones) => {
    if (c.etapa === etapa) return;
    const ok = await actualizar(c, { etapa, etapa_at: new Date().toISOString() }, { tipo: "etapa", texto: `Pasó a ${etapaDe(etapa).label}` });
    if (!ok || opciones?.silencioso) return;
    const avisable = etapa === "contratado" || etapa === "descartado";
    toast.success(`${c.nombre.split(" ")[0]} → ${etapaDe(etapa).label}`, avisable ? { action: { label: "Avisarle", onClick: () => contactar({ ...c, etapa }, etapa) }, duration: 8000 } : undefined);
  }, [actualizar, contactar]);

  const accionVacante = useCallback(async (v: Vacante, a: AccionVacante) => {
    if (a === "cerrar" && !confirm(`¿Cerrar "${v.titulo}"? Deja de verse y no recibe más aplicaciones. Tus candidatos se quedan aquí.`)) return;
    const vencida = diasRestantes(v) <= 0;
    const cambios = a === "pausar" ? { estado: "pausada" } : a === "cerrar" ? { estado: "cerrada" } : a === "renovar" || vencida ? { estado: "publicada", created_at: new Date().toISOString() } : { estado: "publicada" };
    const { data, error } = await supabase.from("vacantes").update(cambios).eq("id", v.id).select("estado").single();
    if (error) return void toast.error("No se pudo cambiar. Intenta otra vez.");
    const estado = (data as { estado: string } | null)?.estado;
    toast.success(estado === "revision" ? "Enviada a revisión." : a === "pausar" ? "Pausada: ya no se ve en la página." : a === "cerrar" ? "Cerrada. ¡Felicidades por la contratación!" : a === "renovar" ? "Renovada: se ve 30 días más." : "Publicada otra vez.");
    await cargarTodo(uid);
    await qc.invalidateQueries({ queryKey: ["vacantes"] });
  }, [uid, cargarTodo, qc]);

  const pedir = useCallback<PanelApi["pedir"]>(async (tipo, vacanteId, detalle) => {
    if (!empresa) return false;
    const { error } = await supabase.from("solicitudes_empresa").insert({ empresa_id: empresa.id, owner_id: uid, tipo, vacante_id: vacanteId ?? null, detalle: detalle?.trim().slice(0, 500) || null });
    if (error) { toast.error("No se pudo enviar la solicitud. Intenta otra vez."); return false; }
    setSolicitudes((s) => [{ tipo, vacante_id: vacanteId ?? null, estado: "nueva" }, ...s]);
    toast.success({ destacar: "Pedido recibido. Te escribimos hoy para activarlo. Pagas solo cuando esté activo.", prueba: "¡Listo! Activamos tu prueba de 14 días y te avisamos. No pagas nada.", asistido: "Recibido. Te escribimos para conocer el puesto. Pagas solo si contratas.", plan_empresa: "Solicitud recibida. Te escribimos para activar tu plan." }[tipo]);
    return true;
  }, [empresa, uid]);

  const api = useMemo<PanelApi | null>(() => (empresa ? {
    uid, empresa, vacantes, candidatos, solicitudes, vistas, filtro, puesto,
    vacante: (id) => vacantes.find((v) => v.id === id),
    ir, abrir, actualizar, mover, contactar, accionVacante, pedir,
    agendar: (c) => setAgendando(c),
    editarVacante: (v, duplicar = false) => { setBase({ v, duplicar }); void navigate({ search: (x: Search) => ({ ...x, s: "publicar" }) }); window.scrollTo({ top: 0 }); },
    recargar: () => cargarTodo(uid),
    setEmpresa: (e) => setEmpresa(e),
  } : null), [uid, empresa, vacantes, candidatos, solicitudes, vistas, filtro, puesto, ir, abrir, actualizar, mover, contactar, accionVacante, pedir, navigate, cargarTodo]);

  const salir = async () => { await supabase.auth.signOut(); await navigate({ to: "/auth" }); };
  const pedirAvisos = async () => {
    if (typeof Notification === "undefined") return void toast.error("Este navegador no permite avisos.");
    const r = await Notification.requestPermission();
    setAvisos(r);
    toast[r === "granted" ? "success" : "error"](r === "granted" ? "Listo: te avisamos cuando llegue alguien, aunque estés en otra pestaña." : "Los avisos quedaron bloqueados. Puedes activarlos en la configuración del navegador.");
  };

  if (empresa === undefined) return <div className="grid min-h-screen place-items-center bg-background"><span className="size-8 animate-spin rounded-full border-4 border-[#1d6ff2] border-t-transparent" /></div>;
  if (empresa === null) return <CrearEmpresa uid={uid} onListo={(e) => setEmpresa(e)} onSalir={() => void salir()} />;

  const nuevos = candidatos.filter((c) => c.etapa === "nuevo").length;
  const hoy = new Date().toDateString();
  const citasHoy = candidatos.filter((c) => c.etapa === "entrevista" && c.entrevista_at && new Date(c.entrevista_at).toDateString() === hoy).length;
  const nav: { id: Seccion; label: string; Icono: typeof Home; badge?: number }[] = [
    { id: "inicio", label: "Inicio", Icono: Home },
    { id: "candidatos", label: "Candidatos", Icono: Users, badge: nuevos },
    { id: "agenda", label: "Entrevistas", Icono: CalendarDays, badge: citasHoy },
    { id: "vacantes", label: "Vacantes", Icono: Briefcase },
    { id: "mensajes", label: "Mensajes", Icono: MessageSquareText },
    { id: "empresa", label: "Mi empresa", Icono: Settings },
    { id: "planes", label: planActivo(empresa) ? "Mi plan" : "Planes", Icono: Crown },
  ];
  const abierto = search.c ? candidatos.find((c) => c.id === search.c) : undefined;

  return (
    <PanelCtx.Provider value={api}>
      <div className="min-h-screen bg-background text-foreground lg:pl-64">
        {/* Barra lateral (computadora) */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#0a2f5c] text-white lg:flex">
          <div className="px-5 pb-5 pt-6"><Logo invertido tamano="text-[19px]" /></div>
          <div className="mx-3 flex items-center gap-3 rounded-2xl bg-white/[0.07] p-3">
            <EmpresaAvatar nombre={empresa.nombre} className="size-10 text-base" claro />
            <div className="min-w-0"><p className="truncate text-sm font-bold">{empresa.nombre}</p><p className="text-xs text-white/60">{empresa.verificada ? "Verificada" : "Verificación pendiente"}</p></div>
          </div>
          <button type="button" onClick={() => ir("publicar")} className="btn-aplicar mx-3 mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm"><Plus className="size-4" /> Publicar vacante</button>
          <nav className="mt-5 flex-1 space-y-0.5 px-3" aria-label="Panel">
            {nav.map(({ id, label, Icono, badge }) => (
              <button key={id} type="button" onClick={() => ir(id)} aria-current={seccion === id ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${seccion === id ? "bg-white text-[#0a2f5c]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
                <Icono className="size-[18px]" /> <span className="flex-1 text-left">{label}</span>
                {!!badge && <span className={`rounded-full px-1.5 text-xs font-bold ${seccion === id ? "bg-[#1d6ff2] text-white" : "bg-[#1d6ff2] text-white"}`}>{badge}</span>}
              </button>
            ))}
          </nav>
          <div className="space-y-0.5 border-t border-white/10 p-3">
            <button type="button" onClick={() => void pedirAvisos()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10">{avisos === "granted" ? <Bell className="size-4" /> : <BellOff className="size-4" />}{avisos === "granted" ? "Avisos activados" : "Activar avisos"}</button>
            <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10"><ExternalLink className="size-4" /> Ver la página</Link>
            <button type="button" onClick={() => void salir()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10"><LogOut className="size-4" /> Salir</button>
          </div>
        </aside>

        {/* Barra superior (celular) */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <div className="flex min-w-0 items-center gap-2.5"><EmpresaAvatar nombre={empresa.nombre} className="size-9 text-sm" /><p className="truncate text-sm font-extrabold">{empresa.nombre}</p></div>
          <button type="button" onClick={() => ir("publicar")} className="btn-aplicar inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm"><Plus className="size-4" /> Publicar</button>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {seccion === "inicio" && <Inicio />}
          {seccion === "candidatos" && <Candidatos />}
          {seccion === "agenda" && <Agenda />}
          {seccion === "vacantes" && <VacantesEmpresa />}
          {seccion === "publicar" && (
            <>
              <Titulo titulo={base.v && !base.duplicar ? "Editar vacante" : base.duplicar ? "Nueva vacante (copia)" : "Publicar vacante"} sub={base.duplicar ? "Copiamos los datos de la otra vacante. Cambia lo que necesites." : "Gratis. Los candidatos aplican sin crear cuenta y te llegan aquí."} />
              <PublicarEmpresa key={`${base.v?.id ?? "nueva"}-${base.duplicar}`} empresa={empresa} uid={uid} base={base.v} duplicar={base.duplicar} onListo={() => { setBase({ v: null, duplicar: false }); ir("vacantes"); void cargarTodo(uid); void qc.invalidateQueries({ queryKey: ["vacantes"] }); }} />
            </>
          )}
          {seccion === "mensajes" && <Mensajes />}
          {seccion === "empresa" && <MiEmpresa />}
          {seccion === "planes" && <Planes />}
          {seccion === "mas" && (
            <>
              <Titulo titulo="Más" />
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                {[
                  { t: "Mensajes a candidatos", I: MessageSquareText, f: () => ir("mensajes") },
                  { t: "Mi empresa", I: Settings, f: () => ir("empresa") },
                  { t: planActivo(empresa) ? "Mi plan" : "Planes y servicios", I: Crown, f: () => ir("planes") },
                  { t: avisos === "granted" ? "Avisos activados" : "Activar avisos en este teléfono", I: Bell, f: () => void pedirAvisos() },
                  { t: "Ver la página de empleos", I: ExternalLink, f: () => void navigate({ to: "/" }) },
                  { t: "Salir", I: LogOut, f: () => void salir() },
                ].map(({ t, I, f }) => <li key={t}><button type="button" onClick={f} className="flex w-full items-center gap-3 px-4 py-4 text-left text-[15px] font-semibold"><I className="size-5 text-muted-foreground" /><span className="flex-1">{t}</span><ChevronRight className="size-4 text-muted-foreground" /></button></li>)}
              </ul>
            </>
          )}
        </main>

        {/* Navegación de abajo (celular) */}
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Panel">
          {[...nav.slice(0, 4), { id: "mas" as Seccion, label: "Más", Icono: Menu }].map(({ id, label, Icono, badge }: { id: Seccion; label: string; Icono: typeof Home; badge?: number }) => {
            const activo = seccion === id || (id === "mas" && (seccion === "mensajes" || seccion === "empresa" || seccion === "planes"));
            return (
              <button key={id} type="button" onClick={() => ir(id)} aria-current={activo ? "page" : undefined} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${activo ? "text-[#1557c4]" : "text-muted-foreground"}`}>
                <Icono className="size-5" />{label}
                {!!badge && <span className="absolute left-1/2 top-1.5 ml-2 rounded-full bg-[#1d6ff2] px-1.5 text-[10px] font-bold text-white">{badge}</span>}
              </button>
            );
          })}
        </nav>

        {abierto && <Ficha id={abierto.id} onCerrar={cerrarFicha} onOtro={abrir} />}
        {agendando && <Agendar c={candidatos.find((c) => c.id === agendando.id) ?? agendando} onCerrar={() => setAgendando(null)} />}
      </div>
    </PanelCtx.Provider>
  );
}

function CrearEmpresa({ uid, onListo, onSalir }: { uid: string; onListo: (e: EmpresaPerfil) => void; onSalir: () => void }) {
  const [nombre, setNombre] = useState("");
  const [rnc, setRnc] = useState("");
  const [guardando, setGuardando] = useState(false);
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = rnc.replace(/\D/g, "");
    if (nombre.trim().length < 2) return void toast.error("Escribe el nombre de tu empresa.");
    if (d.length !== 9 && d.length !== 11) return void toast.error("El RNC tiene 9 dígitos (o 11 si es cédula).");
    setGuardando(true);
    const { data, error } = await supabase.from("empresas").insert({ owner_id: uid, nombre: nombre.trim(), rnc: d, verificada: false }).select(CAMPOS_EMPRESA).single();
    setGuardando(false);
    if (error) return void toast.error("No se pudo guardar. Intenta otra vez.");
    onListo({ ...(data as unknown as EmpresaPerfil), plantillas: {} });
  };
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <form onSubmit={(e) => void guardar(e)} className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-surface p-7 shadow-[var(--shadow-soft)]">
        <Logo />
        <h1 className="font-display text-2xl font-extrabold">Datos de tu empresa</h1>
        <p className="text-sm text-muted-foreground">Un último paso para usar tu panel y publicar vacantes gratis.</p>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la empresa" aria-label="Nombre de la empresa" className="h-12 w-full rounded-xl border border-border bg-background px-3.5" />
        <input value={rnc} onChange={(e) => setRnc(e.target.value)} inputMode="numeric" placeholder="RNC" aria-label="RNC" className="h-12 w-full rounded-xl border border-border bg-background px-3.5" />
        <button type="submit" disabled={guardando} className="btn-aplicar h-12 w-full rounded-xl">{guardando ? "Guardando…" : "Entrar a mi panel"}</button>
        <button type="button" onClick={onSalir} className="w-full text-sm font-semibold text-muted-foreground hover:underline">Salir</button>
      </form>
    </div>
  );
}

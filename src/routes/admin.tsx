import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ExternalLink, Eye, ImageUp, Inbox, Instagram, Share2, Star, Loader2, LogOut, Pause, Pencil, Play, Save, Send, Trash2, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/site/Header";
import { supabase } from "@/integrations/supabase/client";
import { Actividad } from "@/components/admin/Actividad";
import { Exportar } from "@/components/admin/Exportar";
import { Estudio } from "@/components/admin/Estudio";
import { DesdeFotos } from "@/components/admin/DesdeFotos";
import { Control } from "@/components/admin/Control";
import { Empresas } from "@/components/admin/Empresas";
import { Inicio } from "@/components/admin/Inicio";
import { Reportes } from "@/components/admin/Reportes";
import { Usuarios } from "@/components/admin/Usuarios";
import type { TabId } from "@/components/admin/comun";
import { textosEditables, textosPorDefecto, type ClaveTexto } from "@/lib/contenido";
import { areas, modalidades, nivelesExperiencia, provincias, tiposEmpleo } from "@/lib/data";
import { borradorVacio, extraer, type Borrador } from "@/lib/extraer";
import { senalesRiesgo } from "@/lib/antiestafa";
import { EVENTO_PUBLICADA, avisarPublicada, filaDesde, miEmpresa } from "@/lib/publicar";
import { aCsvUrl, tablaAVacantes } from "@/lib/csv";
import { CANAL_WHATSAPP, SELECT, enlacePieza, rowToVacante, textoWhatsApp, type Vacante, type VacanteRow } from "@/lib/vacantes";

export const Route = createFileRoute("/admin")({
  validateSearch: (s: Record<string, unknown>): { editar?: string } => ({ editar: typeof s["editar"] === "string" ? (s["editar"] as string) : undefined }),
  head: () => ({ meta: [{ title: "Administración | Enlace Laboral" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

type Tab = TabId;

type BorradorRow = { id: string; created_at: string; origen: string; texto: string; titulo: string | null; empresa: string | null; provincia: string | null; contacto_nombre: string | null; contacto_email: string | null; contacto_telefono: string | null; fuente: string | null; fuente_url: string | null; datos: Record<string, unknown> | null };

const campo = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";
const etiqueta = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

function Admin() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [estado, setEstado] = useState<"cargando" | "no" | "si">("cargando");
  const [uid, setUid] = useState("");
  const [tab, setTab] = useState<Tab>("inicio");
  const [editar, setEditar] = useState<Vacante | null>(null);
  const [desde, setDesde] = useState<BorradorRow | null>(null);
  const [pendientes, setPendientes] = useState(0);
  const [reportesNuevos, setReportesNuevos] = useState(0);

  const contar = useCallback(async () => {
    const [{ count }, { count: rep }] = await Promise.all([
      supabase.from("borradores").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
      supabase.from("reportes").select("id", { count: "exact", head: true }).eq("estado", "nuevo"),
    ]);
    setPendientes(count ?? 0);
    setReportesNuevos(rep ?? 0);
  }, []);
  useEffect(() => { if (estado === "si") void contar(); }, [estado, contar, tab]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return void navigate({ to: "/auth" });
      setUid(data.user.id);
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin");
      setEstado(roles && roles.length ? "si" : "no");
    })();
  }, [navigate]);

  useEffect(() => {
    if (estado !== "si" || !search.editar) return;
    void (async () => {
      const { data } = await supabase.from("vacantes").select(SELECT).eq("id", search.editar!).maybeSingle();
      if (data) {
        setEditar(rowToVacante(data as unknown as VacanteRow));
        setTab("publicar");
      } else {
        toast.error("No encontré esa vacante.");
      }
    })();
  }, [estado, search.editar]);

  const cerrarEdicion = () => {
    setEditar(null);
    if (search.editar) void navigate({ to: "/admin", search: {}, replace: true });
  };

  const salir = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  };

  const grupos: { id: string; label: string; aviso?: number; tabs: { id: Tab; label: string }[] }[] = [
    { id: "inicio", label: "Inicio", tabs: [{ id: "inicio", label: "Resumen" }] },
    {
      id: "vacantes", label: "Vacantes", aviso: pendientes + reportesNuevos,
      tabs: [
        { id: "fotos", label: "Desde fotos" },
        { id: "publicar", label: editar ? "Editando vacante" : "Publicar" },
        { id: "borradores", label: pendientes ? `Borradores (${pendientes})` : "Borradores" },
        { id: "masiva", label: "Carga masiva" },
        { id: "vacantes", label: "Publicadas" },
        { id: "reportes", label: reportesNuevos ? `Reportes (${reportesNuevos})` : "Reportes" },
      ],
    },
    { id: "negocio", label: "Negocio", tabs: [{ id: "aplicaciones", label: "Aplicaciones" }, { id: "pedidos", label: "Pedidos de CV" }, { id: "empresas", label: "Empresas" }, { id: "exportar", label: "Descargar datos" }] },
    { id: "control", label: "Control", tabs: [{ id: "control", label: "Interruptores y avisos" }, { id: "actividad", label: "Actividad" }, { id: "usuarios", label: "Usuarios" }] },
    { id: "crecer", label: "Crecer", tabs: [{ id: "estudio", label: "Estudio viral" }] },
    { id: "sitio", label: "Sitio", tabs: [{ id: "textos", label: "Textos" }] },
  ];
  const grupoActual = grupos.find((g) => g.tabs.some((t) => t.id === tab)) ?? grupos[0]!;
  const ir = (t: Tab) => { setTab(t); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {estado === "cargando" && <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>}
        {estado === "no" && <p className="py-20 text-center text-muted-foreground">Esta sección es solo para la administradora.</p>}
        {estado === "si" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Administración</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Panel de Enlace Laboral</h1>
              </div>
              <Button variant="outline" onClick={() => void salir()}><LogOut /> Salir</Button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="group" aria-label="Secciones">
              {grupos.map((g) => (
                <Button key={g.id} variant={grupoActual.id === g.id ? "default" : "outline"} onClick={() => ir(g.tabs[0]!.id)} className="relative h-11">
                  {g.label}
                  {!!g.aviso && grupoActual.id !== g.id && <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-bold text-white">{g.aviso}</span>}
                </Button>
              ))}
            </div>
            {grupoActual.tabs.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2 border-b border-border pb-3" role="group" aria-label={`Secciones de ${grupoActual.label}`}>
                {grupoActual.tabs.map((t) => (
                  <Button key={t.id} size="sm" variant={tab === t.id ? "secondary" : "ghost"} onClick={() => ir(t.id)} aria-current={tab === t.id ? "page" : undefined} className={tab === t.id ? "font-bold" : ""}>{t.label}</Button>
                ))}
              </div>
            )}
            <CompartirEnCanal />
            <div className="mt-6">
              {tab === "inicio" && <Inicio onIr={ir} />}
              {tab === "fotos" && <DesdeFotos uid={uid} />}
              {tab === "estudio" && <Estudio />}
              {tab === "exportar" && <Exportar />}
              {tab === "publicar" && <Publicar uid={uid} editar={editar} desde={desde} alPublicarBorrador={() => { setDesde(null); void contar(); setTab("borradores"); }} alTerminar={() => { cerrarEdicion(); setTab("vacantes"); }} cancelar={() => { setDesde(null); cerrarEdicion(); }} />}
              {tab === "borradores" && <Borradores uid={uid} onRevisar={(r) => { cerrarEdicion(); setDesde(r); setTab("publicar"); window.scrollTo({ top: 0, behavior: "smooth" }); }} onCambio={() => void contar()} />}
              {tab === "masiva" && <CargaMasiva />}
              {tab === "vacantes" && <MisVacantes onEditar={(v) => { setEditar(v); setTab("publicar"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}
              {tab === "aplicaciones" && <Aplicaciones />}
              {tab === "pedidos" && <Pedidos />}
              {tab === "reportes" && <Reportes onCambio={() => void contar()} />}
              {tab === "empresas" && <Empresas />}
              {tab === "control" && <Control />}
              {tab === "actividad" && <Actividad />}
              {tab === "usuarios" && <Usuarios uid={uid} />}
              {tab === "textos" && <Textos />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function aBorrador(v: Vacante): Borrador {
  return {
    titulo: v.titulo,
    empresa: v.empresa === "Empresa no indicada" ? "" : v.empresa,
    provincia: v.provincia,
    modalidad: v.modalidad,
    tipo: v.tipo,
    experiencia: v.experiencia,
    area: v.area,
    salarioMin: v.salarioMin > 0 ? String(v.salarioMin) : "",
    salarioMax: v.salarioMax ? String(v.salarioMax) : "",
    descripcion: v.descripcion,
    requisitos: v.requisitos.join("\n"),
    aplicar: v.aplicar,
    fuente: v.fuente === "Enlace Laboral" ? "" : v.fuente,
    fuenteUrl: v.fuenteUrl,
    redes: !!v.redes,
    imagen: v.imagen || "",
  };
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/** Paso 2 después de publicar: llevar la vacante al canal de WhatsApp. */
function CompartirEnCanal() {
  const [lista, setLista] = useState<Vacante[]>([]);
  useEffect(() => {
    const alPublicar = (e: Event) => setLista((l) => [(e as CustomEvent<Vacante>).detail, ...l].slice(0, 10));
    window.addEventListener(EVENTO_PUBLICADA, alPublicar);
    return () => window.removeEventListener(EVENTO_PUBLICADA, alPublicar);
  }, []);
  if (!lista.length) return null;
  const texto = lista.length === 1
    ? textoWhatsApp(lista[0]!, window.location.origin)
    : ["*Vacantes nuevas en Enlace Laboral*", "", ...lista.map((v) => `• ${v.titulo} · ${v.provincia}${v.salarioMin > 0 ? ` · ${v.salario}` : ""}\n${window.location.origin}/vacantes/${v.id}`), "", "Aplicar es gratis."].join("\n");
  const llevar = async () => {
    const ok = await copiar(texto);
    toast.success(ok ? "Texto copiado. Pégalo en tu canal y envía." : "Abre tu canal y pega el texto.");
    window.open(CANAL_WHATSAPP, "_blank", "noopener");
  };
  return (
    <div className="mt-5 rounded-2xl border border-[#1fa855]/40 bg-[#e9f8ef] p-4">
      <p className="font-bold text-[#0d6b35]">Paso 2: llévala a tu canal de WhatsApp</p>
      <p className="mt-1 text-sm">{lista.length === 1 ? `“${lista[0]!.titulo}” ya está publicada.` : `${lista.length} vacantes publicadas en esta sesión. Las llevo juntas en un solo mensaje.`} Pulsa el botón: copio el texto y abro tu canal. Allí solo pegas y envías.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => void llevar()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1fa855] px-5 text-sm font-bold text-white hover:bg-[#178c46]"><Share2 className="size-4" /> Copiar y abrir mi canal</button>
        <a href={enlacePieza(lista[0]!)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90"><Instagram className="size-4" /> Pieza para Instagram</a>
        <button type="button" onClick={() => setLista([])} className="h-11 rounded-xl border border-border bg-surface px-4 text-sm font-semibold">Ya la compartí</button>
      </div>
    </div>
  );
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const enLista = (v: unknown, lista: readonly string[], porDefecto: string) => { const x = str(v); return lista.includes(x) ? x : porDefecto; };

function desdeBorradorRow(r: BorradorRow): Borrador {
  const base = extraer(r.texto);
  const d = r.datos ?? {};
  const reqs = Array.isArray(d["requisitos"]) ? (d["requisitos"] as unknown[]).map(str).filter(Boolean).join("\n") : str(d["requisitos"]);
  const conIA = Object.keys(d).length > 0;
  const b: Borrador = conIA
    ? {
        titulo: str(d["titulo"]) || base.titulo,
        empresa: str(d["empresa"]),
        provincia: enLista(d["provincia"], provincias.slice(1), base.provincia),
        modalidad: enLista(d["modalidad"], modalidades, base.modalidad),
        tipo: enLista(d["tipo"], tiposEmpleo, base.tipo),
        experiencia: enLista(d["experiencia"], nivelesExperiencia, base.experiencia),
        area: enLista(d["area"], areas, base.area),
        salarioMin: str(d["salarioMin"]).replace(/\D/g, ""),
        salarioMax: str(d["salarioMax"]).replace(/\D/g, ""),
        descripcion: str(d["descripcion"]),
        requisitos: reqs,
        aplicar: str(d["aplicar"]),
        fuente: str(d["fuente"]),
        fuenteUrl: str(d["fuenteUrl"]),
      }
    : base;
  return {
    ...b,
    titulo: r.titulo?.trim() || b.titulo,
    empresa: r.empresa?.trim() || b.empresa,
    provincia: r.provincia && provincias.slice(1).includes(r.provincia) ? r.provincia : b.provincia,
    aplicar: b.aplicar || (r.origen === "empresa" ? r.contacto_email?.trim() || "" : ""),
    fuente: r.fuente?.trim() || b.fuente || (r.origen === "correo" ? "Correo recibido" : ""),
    fuenteUrl: r.fuente_url?.trim() || b.fuenteUrl,
    redes: /Autoriza compartir en redes: s[ií]/i.test(r.texto),
  };
}

function Publicar({ uid, editar, desde, alPublicarBorrador, alTerminar, cancelar }: { uid: string; editar: Vacante | null; desde: BorradorRow | null; alPublicarBorrador: () => void; alTerminar: () => void; cancelar: () => void }) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [b, setB] = useState<Borrador>(borradorVacio);
  const [leyendo, setLeyendo] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [lleno, setLleno] = useState(false);
  const archivo = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editar) {
      setB(aBorrador(editar));
      setLleno(true);
      setTexto("");
    }
  }, [editar]);

  useEffect(() => {
    if (desde && !editar) {
      setTexto(desde.texto);
      setB(desdeBorradorRow(desde));
      setLleno(true);
    }
  }, [desde, editar]);

  const set = (k: keyof Borrador) => (e: { target: { value: string } }) => setB((x) => ({ ...x, [k]: e.target.value }));

  const llenar = (t: string) => {
    if (!t.trim()) {
      toast.error("Pega primero el texto de la vacante.");
      return;
    }
    setB((anterior) => {
      const nuevo = extraer(t);
      return { ...nuevo, fuente: anterior.fuente || nuevo.fuente, fuenteUrl: nuevo.fuenteUrl || anterior.fuenteUrl };
    });
    setLleno(true);
    toast.success("Listo. Revisa los datos antes de publicar.");
  };

  const leerImagen = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Ese archivo no es una imagen.");
      return;
    }
    setLeyendo(0);
    try {
      const { crearLector, prepararFoto, leerFoto, limpiarOCR } = await import("@/lib/ocr");
      const { lectura } = await prepararFoto(file);
      const lector = await crearLector();
      let crudo = "";
      try { crudo = (await leerFoto(lector, lectura, (p) => setLeyendo(Math.round(p * 100)))).texto; } finally { await lector.cerrar(); }
      const t = limpiarOCR(crudo).trim();
      if (!t) throw new Error("sin texto");
      setTexto(t);
      llenar(t);
    } catch {
      toast.error("No pude leer la imagen. Prueba con una captura más clara o pega el texto.");
    } finally {
      setLeyendo(null);
    }
  };

  const alPegar = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const img = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (img) {
      e.preventDefault();
      void leerImagen(img);
    }
  };

  const limpiar = () => {
    setTexto("");
    setB(borradorVacio);
    setLleno(false);
    if (editar || desde) cancelar();
  };

  const publicar = async () => {
    if (!b.titulo.trim()) return void toast.error("Falta el puesto.");
    if (!b.fuente.trim()) return void toast.error("Indica de dónde sacaste la vacante (Fuente).");
    setGuardando(true);
    try {
      const fila = filaDesde(b);
      if (editar) {
        const { data, error } = await supabase.from("vacantes").update(fila).eq("id", editar.id).select("id");
        if (error) throw error;
        if (!data || !data.length) throw new Error("no se encontró la vacante o no tienes permiso");
        toast.success("Cambios guardados.");
      } else {
        const empresaId = await miEmpresa(uid);
        const { data: nueva, error } = await supabase.from("vacantes").insert({ ...fila, empresa_id: empresaId, owner_id: uid, estado: "publicada" }).select(SELECT).single();
        if (error) throw error;
        toast.success("¡Vacante publicada! Ya aparece en tu página.");
        if (nueva) avisarPublicada(rowToVacante(nueva as unknown as VacanteRow));
        if (desde) {
          await supabase.from("borradores").update({ estado: "publicado" }).eq("id", desde.id);
        }
      }
      await qc.invalidateQueries({ queryKey: ["vacantes"] });
      setTexto("");
      setB((x) => ({ ...borradorVacio, fuente: x.fuente }));
      setLleno(false);
      if (editar) alTerminar();
      else if (desde) alPublicarBorrador();
    } catch (err) {
      toast.error(`No se pudo guardar: ${err instanceof Error ? err.message : "error desconocido"}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {!editar && (
        <section className="rounded-2xl border border-border bg-surface p-5">
          {desde && (
            <div className="mb-4 rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm">
              <p className="font-bold text-primary">Revisando borrador {desde.origen === "empresa" ? "enviado por una empresa" : "llegado por correo"}</p>
              {(desde.contacto_nombre || desde.contacto_email || desde.contacto_telefono) && <p className="mt-1 text-muted-foreground">Contacto: {[desde.contacto_nombre, desde.contacto_email, desde.contacto_telefono].filter(Boolean).join(" · ")}</p>}
            </div>
          )}
          <h2 className="text-lg font-bold">1. Pega el texto o sube la imagen</h2>
          <p className="mt-1 text-sm text-muted-foreground">Copia la vacante de otro sitio y pégala aquí. También puedes pegar una captura directamente (Ctrl+V) o subir una foto.</p>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} onPaste={alPegar} rows={8} placeholder="Pega aquí el texto de la vacante…" className={campo} />
          <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Button type="button" onClick={() => llenar(texto)} disabled={leyendo !== null} className="h-11"><Wand2 /> Llenar formulario</Button>
            <Button type="button" variant="outline" onClick={() => archivo.current?.click()} disabled={leyendo !== null} className="h-11">
              {leyendo !== null ? (<><Loader2 className="animate-spin" /> Leyendo imagen {leyendo}%</>) : (<><ImageUp /> Subir imagen</>)}
            </Button>
            <input ref={archivo} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void leerImagen(f); e.target.value = ""; }} />
            {(texto || lleno) && <Button type="button" variant="ghost" onClick={limpiar} className="h-11"><X /> Empezar de nuevo</Button>}
          </div>
          {leyendo !== null && <p className="mt-2 text-xs text-muted-foreground">La primera vez tarda un poco más porque descarga el lector de texto.</p>}
        </section>
      )}

      <section className={`rounded-2xl border bg-surface p-5 ${editar ? "border-primary" : "border-border"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{editar ? `Editando: ${editar.titulo}` : "2. Revisa y corrige"}</h2>
          {editar && <Button type="button" variant="outline" onClick={limpiar}><X /> Cancelar</Button>}
        </div>
        {!lleno && !editar && <p className="mt-1 text-sm text-muted-foreground">También puedes llenar todo a mano. Lo que la vacante no diga, déjalo vacío.</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className={etiqueta}>Puesto *</span><input value={b.titulo} onChange={set("titulo")} className={campo} placeholder="Ej. Auxiliar de contabilidad" /></label>
          <label className="block"><span className={etiqueta}>Empresa que contrata</span><input value={b.empresa} onChange={set("empresa")} className={campo} placeholder="Vacío si la fuente no la dice" /></label>
          <label className="block"><span className={etiqueta}>Área</span><select value={b.area} onChange={set("area")} className={campo}>{areas.map((a) => <option key={a}>{a}</option>)}</select></label>
          <label className="block"><span className={etiqueta}>Ubicación</span><select value={b.provincia} onChange={set("provincia")} className={campo}>{provincias.slice(1).map((p) => <option key={p}>{p}</option>)}</select></label>
          <label className="block"><span className={etiqueta}>Modalidad</span><select value={b.modalidad} onChange={set("modalidad")} className={campo}>{modalidades.map((m) => <option key={m}>{m}</option>)}</select></label>
          <label className="block"><span className={etiqueta}>Tipo de empleo</span><select value={b.tipo} onChange={set("tipo")} className={campo}>{tiposEmpleo.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="block"><span className={etiqueta}>Experiencia</span><select value={b.experiencia} onChange={set("experiencia")} className={campo}>{nivelesExperiencia.map((n) => <option key={n}>{n}</option>)}</select></label>
          <label className="block"><span className={etiqueta}>Salario desde (RD$)</span><input inputMode="numeric" value={b.salarioMin} onChange={(e) => setB((x) => ({ ...x, salarioMin: e.target.value.replace(/\D/g, "") }))} className={campo} placeholder="Vacío si no lo dicen" /></label>
          <label className="block"><span className={etiqueta}>Salario hasta (RD$)</span><input inputMode="numeric" value={b.salarioMax} onChange={(e) => setB((x) => ({ ...x, salarioMax: e.target.value.replace(/\D/g, "") }))} className={campo} placeholder="Opcional" /></label>
          <label className="block sm:col-span-2"><span className={etiqueta}>Requisitos (uno por línea)</span><textarea value={b.requisitos} onChange={set("requisitos")} rows={5} className={campo} placeholder="Vacío si la vacante no los menciona" /></label>
          <label className="block sm:col-span-2"><span className={etiqueta}>Funciones, beneficios y horario</span><textarea value={b.descripcion} onChange={set("descripcion")} rows={6} className={campo} placeholder="Solo información del empleo. Vacío si no la hay." /></label>
          <label className="block sm:col-span-2"><span className={etiqueta}>Cómo aplicar (enlace, correo o WhatsApp)</span><input value={b.aplicar} onChange={set("aplicar")} className={campo} placeholder="Ej. rrhh@empresa.com o https://… — vacío = aplican por tu página" /></label>
          <label className="block"><span className={etiqueta}>Fuente (dónde la viste) *</span><input value={b.fuente} onChange={set("fuente")} className={campo} placeholder="Ej. LinkedIn, Instagram de la empresa…" /></label>
          <label className="block"><span className={etiqueta}>Enlace de la fuente</span><input value={b.fuenteUrl} onChange={set("fuenteUrl")} className={campo} placeholder="https://…" /></label>
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={!!b.redes} onChange={(e) => setB((x) => ({ ...x, redes: e.target.checked }))} className="mt-1 size-4" /><span>La empresa o quien la envió <strong>autoriza compartirla en las redes de Enlace Laboral</strong> (Telegram, Facebook, Instagram, WhatsApp). Sin esto, no se comparte sola.</span></label>
        <Button type="button" onClick={() => void publicar()} disabled={guardando} className="mt-6 h-12 w-full text-base font-bold sm:w-auto sm:px-8">
          {guardando ? <Loader2 className="animate-spin" /> : editar ? <Save /> : <Send />} {editar ? "Guardar cambios" : "Publicar vacante"}
        </Button>
      </section>
    </div>
  );
}

function Borradores({ uid, onRevisar, onCambio }: { uid: string; onRevisar: (r: BorradorRow) => void; onCambio: () => void }) {
  const qc = useQueryClient();
  const [publicando, setPublicando] = useState<string | null>(null);
  const [items, setItems] = useState<BorradorRow[] | null>(null);
  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from("borradores").select("*").eq("estado", "pendiente").order("created_at", { ascending: false }).limit(200);
    if (error) toast.error("No se pudieron cargar los borradores.");
    setItems((data as unknown as BorradorRow[] | null) ?? []);
  }, []);
  useEffect(() => void cargar(), [cargar]);

  const descartar = async (r: BorradorRow) => {
    if (!confirm(`¿Descartar "${r.titulo || "este borrador"}"?`)) return;
    const { error } = await supabase.from("borradores").update({ estado: "descartado" }).eq("id", r.id);
    if (error) toast.error("No se pudo descartar."); else toast.success("Borrador descartado.");
    await cargar();
    onCambio();
  };

  const analizar = (r: BorradorRow) => {
    const b = desdeBorradorRow(r);
    const riesgos = senalesRiesgo(`${r.texto} ${b.descripcion}`, !!(b.aplicar.trim() || r.contacto_email || r.contacto_telefono));
    const completa = !!b.titulo.trim() && !!b.empresa.trim() && !!b.aplicar.trim() && riesgos.length === 0;
    return { b, riesgos, completa };
  };

  /** Publica un borrador. En modo silencioso no avisa de cada uno (se usa al publicar en bloque). */
  const publicarUno = async (r: BorradorRow, silencioso = false): Promise<boolean> => {
    const b = desdeBorradorRow(r);
    if (!b.titulo.trim()) { if (!silencioso) toast.error("Este borrador no tiene puesto. Ábrelo con “Revisar” y complétalo."); return false; }
    if (!b.fuente.trim()) b.fuente = r.origen === "empresa" ? "Publicada por la empresa" : "Correo recibido";
    try {
      const empresaId = await miEmpresa(uid);
      const { data: nueva, error } = await supabase.from("vacantes").insert({ ...filaDesde(b), empresa_id: empresaId, owner_id: uid, estado: "publicada" }).select(SELECT).single();
      if (error) throw error;
      await supabase.from("borradores").update({ estado: "publicado" }).eq("id", r.id);
      if (!silencioso) toast.success(`Publicada: ${b.titulo}`);
      if (nueva) avisarPublicada(rowToVacante(nueva as unknown as VacanteRow));
      return true;
    } catch (err) {
      if (!silencioso) toast.error(`No se pudo publicar: ${err instanceof Error ? err.message : "error"}`);
      return false;
    }
  };

  const publicarYa = async (r: BorradorRow) => {
    const { riesgos } = analizar(r);
    const aviso = riesgos.filter((x) => !x.startsWith("No trae forma"));
    if (aviso.length && !confirm(`Ojo, esta vacante tiene señales de riesgo:\n\n• ${aviso.join("\n• ")}\n\n¿La publicas de todos modos?`)) return;
    setPublicando(r.id);
    await publicarUno(r);
    await qc.invalidateQueries({ queryKey: ["vacantes"] });
    await cargar();
    onCambio();
    setPublicando(null);
  };

  const completas = (items ?? []).filter((r) => analizar(r).completa);
  const publicarCompletas = async () => {
    if (!completas.length) return;
    if (!confirm(`Se publicarán ${completas.length} vacantes que tienen puesto, empresa y forma de aplicar, y ninguna señal de estafa. ¿Seguimos?`)) return;
    setPublicando("todas");
    let ok = 0;
    for (const r of completas) if (await publicarUno(r, true)) ok += 1;
    await qc.invalidateQueries({ queryKey: ["vacantes"] });
    toast.success(`${ok} de ${completas.length} vacantes publicadas.`);
    await cargar();
    onCambio();
    setPublicando(null);
  };

  if (!items) return <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>;
  if (!items.length) return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      <Inbox className="mx-auto mb-2 size-6" />
      No hay borradores. Aquí llegan las vacantes que envían las empresas y las que llegan a tu correo de vacantes.
    </div>
  );
  const accion = "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-semibold hover:border-primary hover:text-primary";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm text-muted-foreground">{items.length} por revisar · <b className="text-foreground">{completas.length}</b> están completas y sin señales de estafa.</p>
        <button type="button" disabled={!completas.length || publicando !== null} onClick={() => void publicarCompletas()} className="btn-aplicar inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm disabled:opacity-50">{publicando === "todas" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Publicar las {completas.length} completas</button>
      </div>
      {items.map((r) => {
        const { b: v, riesgos } = analizar(r);
        return (
        <div key={r.id} className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-bold">{r.titulo || str(r.datos?.["titulo"]) || "Vacante sin título"} <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">{r.origen === "empresa" ? "Empresa" : "Correo"}</span></p>
          <p className="mt-0.5 text-xs text-muted-foreground">{[r.empresa || str(r.datos?.["empresa"]), r.provincia, new Date(r.created_at).toLocaleDateString("es-DO"), r.contacto_email].filter(Boolean).join(" · ")}</p>
          <div className="mt-3 rounded-xl bg-secondary p-3 text-sm">
            <p className="text-xs font-semibold text-muted-foreground">Así se publicaría:</p>
            <p className="mt-1 font-bold">{v.titulo || "Sin puesto: revisa antes"}</p>
            <p className="text-muted-foreground">{[v.empresa || "Empresa no indicada", v.provincia, v.modalidad, v.salarioMin ? `RD$${Number(v.salarioMin).toLocaleString("es-DO")}${v.salarioMax ? ` - RD$${Number(v.salarioMax).toLocaleString("es-DO")}` : ""}` : "Salario no publicado"].join(" · ")}</p>
            <p className="text-muted-foreground">{v.requisitos ? `${v.requisitos.split("\n").length} requisitos` : "Sin requisitos"} · {v.aplicar ? `Aplicar: ${v.aplicar}` : "Aplican por tu página"}</p>
          </div>
          {riesgos.length > 0 && (
            <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
              <p className="font-bold">Revisa antes de publicar:</p>
              <ul className="mt-1 list-disc pl-5">{riesgos.map((x) => (<li key={x}>{x}</li>))}</ul>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
            <button type="button" disabled={publicando !== null} onClick={() => void publicarYa(r)} className="btn-aplicar inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-sm">{publicando === r.id ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Publicar ya</button>
            <button type="button" onClick={() => onRevisar(r)} className={`${accion} border-primary text-primary`}><Eye className="size-4" /> Revisar primero</button>
            <button type="button" onClick={() => void descartar(r)} className={`${accion} hover:border-destructive hover:text-destructive`}><Trash2 className="size-4" /> Descartar</button>
          </div>
        </div>
        );
      })}
    </div>
  );
}

function MisVacantes({ onEditar }: { onEditar: (v: Vacante) => void }) {
  const qc = useQueryClient();
  const [items, setItems] = useState<Vacante[] | null>(null);
  const [filtro, setFiltro] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [trabajando, setTrabajando] = useState(false);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from("vacantes").select(SELECT).order("created_at", { ascending: false }).limit(500);
    if (error) toast.error("No se pudieron cargar las vacantes.");
    setItems(((data ?? []) as unknown as VacanteRow[]).map(rowToVacante));
  }, []);
  useEffect(() => void cargar(), [cargar]);

  const refrescar = async () => {
    await cargar();
    await qc.invalidateQueries({ queryKey: ["vacantes"] });
  };

  const alternar = async (v: Vacante) => {
    const nuevo = v.estado === "publicada" ? "pausada" : "publicada";
    const { error } = await supabase.from("vacantes").update({ estado: nuevo }).eq("id", v.id);
    if (error) toast.error("No se pudo cambiar."); else toast.success(nuevo === "publicada" ? "Vacante visible otra vez." : "Vacante pausada: ya no se ve en la página.");
    await refrescar();
  };

  const copiarHoy = async () => {
    const hoy = (items ?? []).filter((v) => v.estado === "publicada" && Date.now() - new Date(v.creado).getTime() < 864e5);
    if (!hoy.length) return void toast.error("Hoy no has publicado vacantes todavía.");
    const texto = ["*Vacantes nuevas en Enlace Laboral*", "", ...hoy.map((v) => `• ${v.titulo} · ${v.provincia}${v.salarioMin > 0 ? ` · ${v.salario}` : ""}\n${window.location.origin}/vacantes/${v.id}`), "", "Aplicar es gratis."].join("\n");
    const ok = await copiar(texto);
    toast.success(ok ? `${hoy.length} vacantes copiadas. Pégalas en tu canal.` : "Abre tu canal y pega el texto.");
    window.open(CANAL_WHATSAPP, "_blank", "noopener");
  };

  const copiarWhatsApp = async (v: Vacante) => {
    const texto = textoWhatsApp(v);
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Texto copiado. Pégalo en tu canal o estado de WhatsApp.");
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
    }
  };

  const destacar = async (v: Vacante) => {
    const { error } = await supabase.from("vacantes").update({ destacada: !v.destacada }).eq("id", v.id);
    if (error) toast.error("No se pudo cambiar."); else toast.success(v.destacada ? "Ya no está destacada." : "Vacante destacada: sale arriba del listado.");
    await refrescar();
  };

  const borrar = async (v: Vacante) => {
    if (!confirm(`¿Borrar "${v.titulo}"? No se puede deshacer.`)) return;
    const { error } = await supabase.from("vacantes").delete().eq("id", v.id);
    if (error) toast.error("No se pudo borrar."); else toast.success("Vacante borrada.");
    await refrescar();
  };

  const enGrupo = async (texto: string, cambios: Record<string, unknown> | "borrar", pide?: string) => {
    if (!sel.length) return;
    if (pide && !confirm(pide.replace("{n}", String(sel.length)))) return;
    setTrabajando(true);
    const q = cambios === "borrar" ? supabase.from("vacantes").delete().in("id", sel) : supabase.from("vacantes").update(cambios).in("id", sel);
    const { error } = await q;
    setTrabajando(false);
    if (error) return void toast.error("No se pudo completar. Intenta otra vez.");
    toast.success(`${sel.length} vacante${sel.length === 1 ? "" : "s"}: ${texto}.`);
    setSel([]);
    await refrescar();
  };

  if (!items) return <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>;
  if (!items.length) return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Todavía no has publicado vacantes. Ve a “Publicar vacante” para crear la primera.</p>;

  const lista = items.filter((v) => `${v.titulo} ${v.empresa} ${v.fuente}`.toLowerCase().includes(filtro.toLowerCase()));
  const accion = "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-semibold hover:border-primary hover:text-primary";

  return (
    <div className="space-y-3">
      <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar en mis vacantes…" className={campo} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{items.filter((v) => v.estado === "publicada").length} visibles · {items.length} en total</p>
        <button type="button" onClick={() => void copiarHoy()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1fa855] px-4 text-sm font-bold text-white hover:bg-[#178c46]"><Share2 className="size-4" /> Llevar las de hoy al canal</button>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm">
        <label className="flex items-center gap-2 font-semibold"><input type="checkbox" className="size-4" checked={lista.length > 0 && lista.every((v) => sel.includes(v.id))} onChange={(e) => setSel(e.target.checked ? lista.map((v) => v.id) : [])} /> Elegir todas las de la lista ({lista.length})</label>
        {sel.length > 0 && <span className="text-muted-foreground">{sel.length} elegidas</span>}
      </div>
      {sel.length > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-primary bg-surface p-3 shadow-lg" role="toolbar" aria-label="Acciones para las vacantes elegidas">
          <span className="mr-1 text-sm font-bold">{sel.length} elegidas:</span>
          <button type="button" disabled={trabajando} onClick={() => void enGrupo("pausadas", { estado: "pausada" }, "¿Pausar {n} vacantes? Dejan de verse en la página.")} className={accion}><Pause className="size-4" /> Pausar</button>
          <button type="button" disabled={trabajando} onClick={() => void enGrupo("publicadas", { estado: "publicada" })} className={accion}><Play className="size-4" /> Publicar</button>
          <button type="button" disabled={trabajando} onClick={() => void enGrupo("renovadas por 30 días más", { created_at: new Date().toISOString(), estado: "publicada" }, "¿Renovar {n} vacantes? Quedan como nuevas por 30 días.")} className={accion}><RefreshCw className="size-4" /> Renovar 30 días</button>
          <button type="button" disabled={trabajando} onClick={() => void enGrupo("destacadas", { destacada: true })} className={accion}><Star className="size-4" /> Destacar</button>
          <button type="button" disabled={trabajando} onClick={() => void enGrupo("sin destacar", { destacada: false })} className={accion}>Quitar destacado</button>
          <button type="button" disabled={trabajando} onClick={() => void enGrupo("borradas", "borrar", "¿Borrar {n} vacantes? No se puede deshacer.")} className={`${accion} hover:border-destructive hover:text-destructive`}><Trash2 className="size-4" /> Borrar</button>
          <button type="button" onClick={() => setSel([])} className="ml-auto text-sm font-semibold text-muted-foreground hover:underline">Quitar selección</button>
          {trabajando && <Loader2 className="size-4 animate-spin text-primary" />}
        </div>
      )}
      {lista.map((v) => (
        <div key={v.id} className={`rounded-2xl border bg-surface p-4 ${sel.includes(v.id) ? "border-primary" : "border-border"}`}>
          <p className="font-bold"><input type="checkbox" className="mr-2 size-4 align-middle" aria-label={`Elegir ${v.titulo}`} checked={sel.includes(v.id)} onChange={() => setSel((x) => (x.includes(v.id) ? x.filter((i) => i !== v.id) : [...x, v.id]))} />{v.titulo} {v.estado !== "publicada" && <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Pausada</span>}{v.destacada && <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Destacada</span>}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{v.empresa} · {v.provincia} · {v.salario} · {v.publicado} · Fuente: {v.fuente}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            <button type="button" onClick={() => onEditar(v)} className={`${accion} border-primary text-primary`}><Pencil className="size-4" /> Editar</button>
            <button type="button" onClick={() => void alternar(v)} className={accion}>{v.estado === "publicada" ? <><Pause className="size-4" /> Pausar</> : <><Play className="size-4" /> Publicar</>}</button>
            <button type="button" onClick={() => void destacar(v)} className={accion}><Star className={`size-4 ${v.destacada ? "fill-current" : ""}`} /> {v.destacada ? "Quitar" : "Destacar"}</button>
            <button type="button" onClick={() => void copiarWhatsApp(v)} className={accion}><Share2 className="size-4" /> WhatsApp</button>
            <a href={enlacePieza(v)} target="_blank" rel="noopener noreferrer" className={accion} title="Abre el generador de piezas con esta vacante cargada"><Instagram className="size-4" /> Instagram</a>
            <Link to="/vacantes/$id" params={{ id: v.id }} target="_blank" className={accion}><ExternalLink className="size-4" /> Ver</Link>
            <button type="button" onClick={() => void borrar(v)} className={`${accion} hover:border-destructive hover:text-destructive`}><Trash2 className="size-4" /> Borrar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Aplicaciones() {
  type A = { id: string; nombre: string; contacto: string; mensaje: string | null; created_at: string; enviada_at: string | null; vacantes: { titulo: string } | null };
  const [items, setItems] = useState<A[] | null>(null);
  const cargar = useCallback(async () => {
    const { data } = await supabase.from("aplicaciones").select("id,nombre,contacto,mensaje,created_at,enviada_at,vacantes(titulo)").order("created_at", { ascending: false }).limit(500);
    setItems((data as unknown as A[] | null) ?? []);
  }, []);
  useEffect(() => void cargar(), [cargar]);
  const borrar = async (id: string) => {
    if (!confirm("¿Borrar esta aplicación?")) return;
    await supabase.from("aplicaciones").delete().eq("id", id);
    void cargar();
  };
  if (!items) return <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>;
  if (!items.length) return <p className="text-sm text-muted-foreground">Todavía no hay aplicaciones. Aquí verás a quienes apliquen por tu página (en vacantes sin “cómo aplicar”).</p>;
  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
          <div className="min-w-0">
            <p className="font-bold">{a.nombre} <span className="font-normal text-muted-foreground">· {a.contacto}</span></p>
            <p className="text-xs text-primary">{a.vacantes?.titulo ?? "Vacante"} · {new Date(a.created_at).toLocaleDateString("es-DO")} {a.enviada_at ? <span className="ml-1 rounded-full bg-success/10 px-2 py-0.5 font-bold text-success">Enviada por correo</span> : <span className="ml-1 rounded-full bg-muted px-2 py-0.5 font-bold text-muted-foreground">Se envía en la próxima hora</span>}</p>
            {a.mensaje && <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{a.mensaje}</p>}
          </div>
          <Button size="sm" variant="outline" onClick={() => void borrar(a.id)}><Trash2 /> Borrar</Button>
        </div>
      ))}
    </div>
  );
}

function CargaMasiva() {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ creadas: number; actualizadas: number; omitidas: { fila: number; motivo: string }[] } | null>(null);
  const tabla = useMemo(() => tablaAVacantes(texto), [texto]);
  const leerArchivo = async (f: File) => setTexto(await f.text());
  const publicar = async () => {
    if (!tabla.filas.length || tabla.faltan.length) return;
    if (!confirm(`Se publicarán hasta ${tabla.filas.length} vacantes. ¿Seguimos?`)) return;
    setEnviando(true);
    const { data, error } = await supabase.rpc("importar_vacantes_admin", { p_filas: tabla.filas });
    setEnviando(false);
    if (error || !data) return void toast.error(`No se pudo importar: ${error?.message ?? "error"}`);
    setResultado(data);
    await qc.invalidateQueries({ queryKey: ["vacantes"] });
    toast.success(`${data.creadas} nuevas y ${data.actualizadas} actualizadas.`);
    if (!data.omitidas.length) setTexto("");
  };
  const plantilla = () => {
    const blob = new Blob(["puesto,empresa,provincia,modalidad,tipo,experiencia,area,salario_min,salario_max,descripcion,requisitos,aplicar\n"], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "plantilla-vacantes.csv";
    a.click();
  };
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">Subir muchas vacantes de una vez</h2>
        <p className="text-sm text-muted-foreground">Copia las filas desde Excel o Google Sheets (con la primera fila de títulos) y pégalas aquí, o sube un archivo .csv. Columnas: <b>puesto, provincia</b> (obligadas), empresa, modalidad, tipo, experiencia, área, salario mínimo y máximo, descripción, requisitos (separados con | ) y aplicar (correo, WhatsApp o enlace).</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={plantilla}>Descargar plantilla</Button>
          <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input px-3 text-sm font-medium hover:bg-accent">Subir archivo .csv<input type="file" accept=".csv,.tsv,.txt,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void leerArchivo(f); e.target.value = ""; }} /></label>
        </div>
        <textarea value={texto} onChange={(e) => { setTexto(e.target.value); setResultado(null); }} rows={7} placeholder="Pega aquí las filas copiadas de Excel o Sheets…" className={campo} />
        {texto.trim() && (
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
            {tabla.faltan.length > 0 ? (
              <p className="font-semibold text-destructive">Faltan columnas obligatorias: {tabla.faltan.join(", ")}. Revisa la primera fila.</p>
            ) : (
              <>
                <p><b>{tabla.filas.length}</b> vacantes listas. Columnas reconocidas: {tabla.reconocidas.join(", ")}.{tabla.ignoradas.length > 0 && <span className="text-muted-foreground"> Se ignoran: {tabla.ignoradas.join(", ")}.</span>}</p>
                <ul className="mt-2 list-disc pl-5 text-muted-foreground">{tabla.filas.slice(0, 5).map((f, i) => (<li key={i}>{f["titulo"]} · {f["empresa"] || "sin empresa"} · {f["provincia"]}</li>))}{tabla.filas.length > 5 && <li>… y {tabla.filas.length - 5} más</li>}</ul>
                <Button className="mt-3" disabled={enviando} onClick={() => void publicar()}>{enviando ? <Loader2 className="animate-spin" /> : <Send />} Publicar {tabla.filas.length} vacantes</Button>
              </>
            )}
          </div>
        )}
        {resultado && resultado.omitidas.length > 0 && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
            <p className="font-bold">No se publicaron {resultado.omitidas.length} filas:</p>
            <ul className="mt-1 list-disc pl-5">{resultado.omitidas.map((o) => (<li key={o.fila}>Fila {o.fila}: {o.motivo}</li>))}</ul>
          </div>
        )}
      </section>
      <HojasConectadas />
    </div>
  );
}

function HojasConectadas() {
  type H = { id: string; nombre: string; url: string; activa: boolean; ultima_sync: string | null; resultado: string | null };
  const [hojas, setHojas] = useState<H[] | null>(null);
  const [nombre, setNombre] = useState("");
  const [url, setUrl] = useState("");
  const cargar = useCallback(async () => {
    const { data } = await supabase.from("hojas_vacantes").select("*").order("created_at", { ascending: false });
    setHojas((data as unknown as H[] | null) ?? []);
  }, []);
  useEffect(() => void cargar(), [cargar]);
  const agregar = async () => {
    if (nombre.trim().length < 2 || !/^https:\/\//.test(url.trim())) return void toast.error("Escribe un nombre y el enlace completo de la hoja (empieza con https://).");
    const { error } = await supabase.from("hojas_vacantes").insert({ nombre: nombre.trim(), url: aCsvUrl(url) });
    if (error) return void toast.error("No se pudo guardar la hoja.");
    setNombre(""); setUrl(""); toast.success("Hoja conectada. Se lee todos los días a las 6:30 a. m."); void cargar();
  };
  const alternar = async (h: H) => { await supabase.from("hojas_vacantes").update({ activa: !h.activa }).eq("id", h.id); void cargar(); };
  const quitar = async (h: H) => { if (!confirm(`¿Quitar la hoja «${h.nombre}»? Sus vacantes ya publicadas no se borran.`)) return; await supabase.from("hojas_vacantes").delete().eq("id", h.id); void cargar(); };
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-extrabold">Hojas conectadas (se sincronizan solas)</h2>
      <p className="text-sm text-muted-foreground">Una empresa o agencia mantiene una hoja de Google Sheets con sus vacantes. Cada mañana la leemos: lo nuevo se publica, lo que cambió se actualiza y lo que quitaron se cierra. La hoja debe estar compartida como «Cualquier persona con el enlace: lector» y cada fila necesita puesto, provincia y <b>aplicar</b>.</p>
      <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <input className={campo} placeholder="Nombre (empresa o agencia)" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input className={campo} placeholder="Enlace de la hoja de Google" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button className="mt-1" onClick={() => void agregar()}>Conectar</Button>
      </div>
      {hojas?.map((h) => (
        <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 text-sm">
          <div className="min-w-0">
            <p className="font-bold">{h.nombre} {!h.activa && <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">En pausa</span>}</p>
            <p className="text-xs text-muted-foreground">{h.ultima_sync ? `Última lectura: ${new Date(h.ultima_sync).toLocaleString("es-DO")} · ${h.resultado ?? ""}` : "Todavía no se ha leído (se lee a las 6:30 a. m.)"}</p>
          </div>
          <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void alternar(h)}>{h.activa ? "Pausar" : "Activar"}</Button><Button size="sm" variant="outline" onClick={() => void quitar(h)}><Trash2 /> Quitar</Button></div>
        </div>
      ))}
    </section>
  );
}

function Pedidos() {
  type P = { id: string; codigo: string; paquete: string; precio: number; nombre: string; contacto: string; correo: string | null; puesto: string | null; cv_texto: string | null; notas: string | null; estado: string; created_at: string };
  const [items, setItems] = useState<P[] | null>(null);
  const cargar = useCallback(async () => {
    const { data } = await supabase.from("pedidos_servicios").select("*").order("created_at", { ascending: false }).limit(300);
    setItems((data as unknown as P[] | null) ?? []);
  }, []);
  useEffect(() => void cargar(), [cargar]);
  const marcar = async (id: string, estado: "pendiente_pago" | "pagado" | "entregado") => {
    const ahora = new Date().toISOString();
    const cambios: Record<string, unknown> = { estado };
    if (estado === "pagado") cambios["pagado_at"] = ahora;
    if (estado === "entregado") cambios["entregado_at"] = ahora;
    await supabase.from("pedidos_servicios").update(cambios).eq("id", id);
    void cargar();
  };
  const borrar = async (id: string) => {
    if (!confirm("¿Borrar este pedido?")) return;
    await supabase.from("pedidos_servicios").delete().eq("id", id);
    void cargar();
  };
  if (!items) return <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>;
  const cobrado = items.filter((p) => p.estado !== "pendiente_pago").reduce((s, p) => s + p.precio, 0);
  const color: Record<string, string> = { pendiente_pago: "bg-muted text-muted-foreground", pagado: "bg-cta/10 text-cta", entregado: "bg-success/10 text-success" };
  const nombreEstado: Record<string, string> = { pendiente_pago: "Falta el pago", pagado: "Pagado · por entregar", entregado: "Entregado" };
  return (
    <div className="space-y-3">
      <p className="rounded-2xl border border-border bg-surface p-4 text-sm">Cobrado: <span className="text-lg font-extrabold text-success">RD${cobrado.toLocaleString("es-DO")}</span> · Pedidos: {items.length} · Por entregar: {items.filter((p) => p.estado === "pagado").length}</p>
      {!items.length && <p className="text-sm text-muted-foreground">Todavía no hay pedidos. Cuando alguien pida un servicio en /impulso, aparece aquí y te llega un correo. Pon tus datos de pago en la pestaña Textos.</p>}
      {items.map((p) => (
        <div key={p.id} className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold">{p.nombre} <span className="font-normal text-muted-foreground">· {p.codigo} · {p.paquete} · RD${p.precio.toLocaleString("es-DO")}</span></p>
              <p className="text-sm text-primary"><a className="underline" href={`https://wa.me/${p.contacto.replace(/\D/g, "").replace(/^(?!1)/, "1")}`} target="_blank" rel="noreferrer">{p.contacto}</a>{p.correo ? ` · ${p.correo}` : ""} · {new Date(p.created_at).toLocaleString("es-DO")}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${color[p.estado] ?? ""}`}>{nombreEstado[p.estado] ?? p.estado}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.estado === "pendiente_pago" && <Button size="sm" onClick={() => void marcar(p.id, "pagado")}>Marcar pagado</Button>}
              {p.estado === "pagado" && <Button size="sm" onClick={() => void marcar(p.id, "entregado")}>Marcar entregado</Button>}
              <Button size="sm" variant="outline" onClick={() => void borrar(p.id)}><Trash2 /> Borrar</Button>
            </div>
          </div>
          {p.puesto && <p className="mt-2 text-sm"><b>Busca:</b> {p.puesto}</p>}
          {p.notas && <p className="mt-1 whitespace-pre-line text-sm"><b>Notas:</b> {p.notas}</p>}
          {p.cv_texto && <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold text-primary">Ver su CV</summary><pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">{p.cv_texto}</pre></details>}
        </div>
      ))}
    </div>
  );
}

function Textos() {
  const [valores, setValores] = useState<Record<string, string>>(textosPorDefecto);
  useEffect(() => {
    void supabase.from("contenido_sitio").select("clave,valor").then(({ data }) => {
      if (data) setValores((v) => ({ ...v, ...Object.fromEntries(data.filter((r) => r.valor.trim()).map((r) => [r.clave, r.valor])) }));
    });
  }, []);
  const guardar = async () => {
    const filas = Object.keys(textosEditables).map((clave) => ({ clave, valor: valores[clave] ?? "", updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("contenido_sitio").upsert(filas);
    if (error) toast.error("No se pudieron guardar los textos"); else toast.success("Textos actualizados en la página");
  };
  return (
    <div className="space-y-4">
      {(Object.keys(textosEditables) as ClaveTexto[]).map((k) => (
        <label key={k} className="block">
          <span className="text-sm font-semibold">{textosEditables[k].etiqueta}</span>
          <textarea className={campo} rows={2} value={valores[k] ?? ""} onChange={(e) => setValores({ ...valores, [k]: e.target.value })} />
        </label>
      ))}
      <Button onClick={() => void guardar()}><Save /> Guardar textos</Button>
    </div>
  );
}

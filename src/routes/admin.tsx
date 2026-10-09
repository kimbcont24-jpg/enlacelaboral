import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Eye, ImageUp, Inbox, Loader2, LogOut, Pause, Pencil, Play, Save, Send, Trash2, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/site/Header";
import { supabase } from "@/integrations/supabase/client";
import { textosEditables, textosPorDefecto, type ClaveTexto } from "@/lib/contenido";
import { areas, modalidades, nivelesExperiencia, provincias, tiposEmpleo } from "@/lib/data";
import { borradorVacio, extraer, type Borrador } from "@/lib/extraer";
import { SELECT, rowToVacante, type Vacante, type VacanteRow } from "@/lib/vacantes";

export const Route = createFileRoute("/admin")({
  validateSearch: (s: Record<string, unknown>): { editar?: string } => ({ editar: typeof s["editar"] === "string" ? (s["editar"] as string) : undefined }),
  head: () => ({ meta: [{ title: "Administración | Enlace Laboral" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

type Tab = "publicar" | "borradores" | "vacantes" | "aplicaciones" | "textos";

type BorradorRow = { id: string; created_at: string; origen: string; texto: string; titulo: string | null; empresa: string | null; provincia: string | null; contacto_nombre: string | null; contacto_email: string | null; contacto_telefono: string | null; fuente: string | null; fuente_url: string | null; datos: Record<string, unknown> | null };

const campo = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";
const etiqueta = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

function Admin() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [estado, setEstado] = useState<"cargando" | "no" | "si">("cargando");
  const [uid, setUid] = useState("");
  const [tab, setTab] = useState<Tab>("publicar");
  const [editar, setEditar] = useState<Vacante | null>(null);
  const [desde, setDesde] = useState<BorradorRow | null>(null);
  const [pendientes, setPendientes] = useState(0);

  const contar = useCallback(async () => {
    const { count } = await supabase.from("borradores").select("id", { count: "exact", head: true }).eq("estado", "pendiente");
    setPendientes(count ?? 0);
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "publicar", label: editar ? "Editando vacante" : "Publicar vacante" },
    { id: "borradores", label: pendientes ? `Borradores (${pendientes})` : "Borradores" },
    { id: "vacantes", label: "Mis vacantes" },
    { id: "aplicaciones", label: "Aplicaciones" },
    { id: "textos", label: "Textos" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {estado === "cargando" && <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>}
        {estado === "no" && <p className="py-20 text-center text-muted-foreground">Esta sección es solo para la administradora.</p>}
        {estado === "si" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Administración</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Panel de Enlace RD</h1>
              </div>
              <Button variant="outline" onClick={() => void salir()}><LogOut /> Salir</Button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {tabs.map((t) => (
                <Button key={t.id} variant={tab === t.id ? "default" : "outline"} onClick={() => setTab(t.id)} className="h-11">{t.label}</Button>
              ))}
            </div>
            <div className="mt-6">
              {tab === "publicar" && <Publicar uid={uid} editar={editar} desde={desde} alPublicarBorrador={() => { setDesde(null); void contar(); setTab("borradores"); }} alTerminar={() => { cerrarEdicion(); setTab("vacantes"); }} cancelar={() => { setDesde(null); cerrarEdicion(); }} />}
              {tab === "borradores" && <Borradores onRevisar={(r) => { cerrarEdicion(); setDesde(r); setTab("publicar"); window.scrollTo({ top: 0, behavior: "smooth" }); }} onCambio={() => void contar()} />}
              {tab === "vacantes" && <MisVacantes onEditar={(v) => { setEditar(v); setTab("publicar"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}
              {tab === "aplicaciones" && <Aplicaciones />}
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
    fuente: v.fuente === "Enlace RD" ? "" : v.fuente,
    fuenteUrl: v.fuenteUrl,
  };
}

async function miEmpresa(uid: string): Promise<string> {
  const { data } = await supabase.from("empresas").select("id").eq("owner_id", uid).maybeSingle();
  if (data) return (data as { id: string }).id;
  const { data: nueva, error } = await supabase.from("empresas").insert({ owner_id: uid, nombre: "Enlace RD", rnc: "no-aplica" }).select("id").single();
  if (error || !nueva) throw error ?? new Error("No se pudo preparar la cuenta");
  return (nueva as { id: string }).id;
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
    aplicar: b.aplicar || r.contacto_email?.trim() || "",
    fuente: r.fuente?.trim() || b.fuente || (r.origen === "correo" ? "Correo recibido" : ""),
    fuenteUrl: r.fuente_url?.trim() || b.fuenteUrl,
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
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("spa", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setLeyendo(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      const t = data.text.trim();
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
      const min = Number(b.salarioMin) || 0;
      const max = Number(b.salarioMax) || 0;
      const etiquetas = [
        b.empresa.trim() && `m:empresa:${b.empresa.trim()}`,
        `m:fuente:${b.fuente.trim()}`,
        b.fuenteUrl.trim() && `m:fuente_url:${b.fuenteUrl.trim()}`,
        b.aplicar.trim() && `m:aplicar:${b.aplicar.trim()}`,
      ].filter(Boolean) as string[];
      const fila = {
        titulo: b.titulo.trim(),
        area: b.area,
        provincia: b.provincia,
        modalidad: b.modalidad,
        tipo: b.tipo,
        experiencia: b.experiencia,
        salario_min: min,
        salario_max: max > min ? max : null,
        descripcion: b.descripcion.trim(),
        requisitos: b.requisitos.split("\n").map((r) => r.trim()).filter(Boolean),
        etiquetas,
      };
      if (editar) {
        const { data, error } = await supabase.from("vacantes").update(fila).eq("id", editar.id).select("id");
        if (error) throw error;
        if (!data || !data.length) throw new Error("no se encontró la vacante o no tienes permiso");
        toast.success("Cambios guardados.");
      } else {
        const empresaId = await miEmpresa(uid);
        const { error } = await supabase.from("vacantes").insert({ ...fila, empresa_id: empresaId, owner_id: uid, estado: "publicada" });
        if (error) throw error;
        toast.success("¡Vacante publicada! Ya aparece en tu página.");
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
        <Button type="button" onClick={() => void publicar()} disabled={guardando} className="mt-6 h-12 w-full text-base font-bold sm:w-auto sm:px-8">
          {guardando ? <Loader2 className="animate-spin" /> : editar ? <Save /> : <Send />} {editar ? "Guardar cambios" : "Publicar vacante"}
        </Button>
      </section>
    </div>
  );
}

function Borradores({ onRevisar, onCambio }: { onRevisar: (r: BorradorRow) => void; onCambio: () => void }) {
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
      <p className="text-xs text-muted-foreground">{items.length} por revisar. Nada se publica hasta que tú lo apruebes.</p>
      {items.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-bold">{r.titulo || str(r.datos?.["titulo"]) || "Vacante sin título"} <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">{r.origen === "empresa" ? "Empresa" : "Correo"}</span></p>
          <p className="mt-0.5 text-xs text-muted-foreground">{[r.empresa || str(r.datos?.["empresa"]), r.provincia, new Date(r.created_at).toLocaleDateString("es-DO"), r.contacto_email].filter(Boolean).join(" · ")}</p>
          <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{r.texto}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
            <button type="button" onClick={() => onRevisar(r)} className={`${accion} border-primary text-primary`}><Eye className="size-4" /> Revisar y publicar</button>
            <button type="button" onClick={() => void descartar(r)} className={`${accion} hover:border-destructive hover:text-destructive`}><Trash2 className="size-4" /> Descartar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MisVacantes({ onEditar }: { onEditar: (v: Vacante) => void }) {
  const qc = useQueryClient();
  const [items, setItems] = useState<Vacante[] | null>(null);
  const [filtro, setFiltro] = useState("");

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

  const borrar = async (v: Vacante) => {
    if (!confirm(`¿Borrar "${v.titulo}"? No se puede deshacer.`)) return;
    const { error } = await supabase.from("vacantes").delete().eq("id", v.id);
    if (error) toast.error("No se pudo borrar."); else toast.success("Vacante borrada.");
    await refrescar();
  };

  if (!items) return <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>;
  if (!items.length) return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Todavía no has publicado vacantes. Ve a “Publicar vacante” para crear la primera.</p>;

  const lista = items.filter((v) => `${v.titulo} ${v.empresa} ${v.fuente}`.toLowerCase().includes(filtro.toLowerCase()));
  const accion = "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-semibold hover:border-primary hover:text-primary";

  return (
    <div className="space-y-3">
      <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar en mis vacantes…" className={campo} />
      <p className="text-xs text-muted-foreground">{items.filter((v) => v.estado === "publicada").length} visibles · {items.length} en total</p>
      {lista.map((v) => (
        <div key={v.id} className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-bold">{v.titulo} {v.estado !== "publicada" && <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Pausada</span>}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{v.empresa} · {v.provincia} · {v.salario} · {v.publicado} · Fuente: {v.fuente}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button type="button" onClick={() => onEditar(v)} className={`${accion} border-primary text-primary`}><Pencil className="size-4" /> Editar</button>
            <button type="button" onClick={() => void alternar(v)} className={accion}>{v.estado === "publicada" ? <><Pause className="size-4" /> Pausar</> : <><Play className="size-4" /> Publicar</>}</button>
            <Link to="/vacantes/$id" params={{ id: v.id }} target="_blank" className={accion}><ExternalLink className="size-4" /> Ver</Link>
            <button type="button" onClick={() => void borrar(v)} className={`${accion} hover:border-destructive hover:text-destructive`}><Trash2 className="size-4" /> Borrar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Aplicaciones() {
  type A = { id: string; nombre: string; contacto: string; mensaje: string | null; created_at: string; vacantes: { titulo: string } | null };
  const [items, setItems] = useState<A[] | null>(null);
  const cargar = useCallback(async () => {
    const { data } = await supabase.from("aplicaciones").select("id,nombre,contacto,mensaje,created_at,vacantes(titulo)").order("created_at", { ascending: false }).limit(500);
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
            <p className="text-xs text-primary">{a.vacantes?.titulo ?? "Vacante"} · {new Date(a.created_at).toLocaleDateString("es-DO")}</p>
            {a.mensaje && <p className="mt-1 text-sm text-muted-foreground">{a.mensaje}</p>}
          </div>
          <Button size="sm" variant="outline" onClick={() => void borrar(a.id)}><Trash2 /> Borrar</Button>
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

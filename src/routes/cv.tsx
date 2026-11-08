import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Briefcase, Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, Download, Eye, FileText, GraduationCap, Lightbulb, ListChecks, MessageCircle, Palette, Pencil, Plus, Search, Sparkles, Target, Trash2, User, Wrench, X } from "lucide-react";
import { toast } from "sonner";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { GuardarNube } from "@/components/site/GuardarNube";
import { COLORES, HojaCV, PLANTILLAS, type Color, type Plantilla } from "@/components/cv/Hojas";
import { cvVacio, lineasLogros, textoCV, useCV, type CV, type Curso, type Educacion, type Experiencia } from "@/lib/cv";
import { carta, IDIOMAS, NIVELES, revisar, rolDe, ROLES, VERBOS, type Rol } from "@/lib/cv-ayuda";
import { coincidencia } from "@/lib/panel";
import { useVacantes, type Vacante } from "@/lib/vacantes";

export const Route = createFileRoute("/cv")({
  head: () => ({
    meta: [
      { title: "Crea tu CV gratis, profesional y en minutos | Enlace Laboral" },
      { name: "description", content: "Haz tu currículum gratis con ejemplos para tu puesto, revisor en vivo, 6 diseños y carta de presentación. Compáralo con una vacante real. Sin cuenta y sin marca de agua." },
      { property: "og:title", content: "Crea tu CV gratis | Enlace Laboral" },
      { property: "og:description", content: "Ejemplos para tu puesto, revisor en vivo, 6 diseños y carta de presentación. Gratis y sin marca de agua." },
    ],
  }),
  component: CrearCV,
});

const PASOS = [
  { id: "datos", t: "Tus datos", I: User },
  { id: "perfil", t: "Perfil", I: Sparkles },
  { id: "experiencia", t: "Experiencia", I: Briefcase },
  { id: "formacion", t: "Formación", I: GraduationCap },
  { id: "habilidades", t: "Habilidades", I: Wrench },
  { id: "otros", t: "Otros datos", I: ListChecks },
  { id: "diseno", t: "Diseño", I: Palette },
] as const;
type Paso = (typeof PASOS)[number]["id"];

const campo = "h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3.5 text-[15px] outline-none transition-colors focus:border-[#1d6ff2] focus:bg-surface focus:ring-2 focus:ring-[#1d6ff2]/15";
const area = "w-full min-w-0 rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] leading-relaxed outline-none transition-colors focus:border-[#1d6ff2] focus:bg-surface focus:ring-2 focus:ring-[#1d6ff2]/15";
const etiqueta = "mb-1.5 block text-sm font-bold";
const chip = "inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] font-semibold transition-colors hover:border-[#1d6ff2] hover:text-[#1557c4]";
const K_ESTILO = "enlace-cv-plantilla";

function leerEstilo(): { plantilla: Plantilla; color: Color } {
  try {
    const [p, c] = (localStorage.getItem(K_ESTILO) ?? "").split(":");
    return { plantilla: PLANTILLAS.some((x) => x.id === p) ? (p as Plantilla) : "clasico", color: COLORES.some((x) => x.id === c) ? (c as Color) : "marino" };
  } catch { return { plantilla: "clasico", color: "marino" }; }
}

function CrearCV() {
  const { cv, setCV, cargado } = useCV();
  const [paso, setPaso] = useState<Paso>("datos");
  const [vistaMovil, setVistaMovil] = useState<"editar" | "ver">("editar");
  const [estilo, setEstilo] = useState<{ plantilla: Plantilla; color: Color }>({ plantilla: "clasico", color: "marino" });
  const [herramienta, setHerramienta] = useState<"comparar" | "carta" | null>(null);
  const [imprimir, setImprimir] = useState<"cv" | "carta">("cv");
  const [textoCarta, setTextoCarta] = useState("");
  const [cartaPara, setCartaPara] = useState({ puesto: "", empresa: "" });
  const [rolElegido, setRolElegido] = useState<string>("");
  useEffect(() => { setEstilo(leerEstilo()); }, []);
  const guardarEstilo = (e: { plantilla: Plantilla; color: Color }) => {
    setEstilo(e);
    try { localStorage.setItem(K_ESTILO, `${e.plantilla}:${e.color}`); } catch { /* sin almacenamiento */ }
    window.dispatchEvent(new Event("enlace-cv-cambio"));
  };

  const rol: Rol | null = ROLES.find((r) => r.id === rolElegido) ?? rolDe(cv);
  const revision = useMemo(() => revisar(cv), [cv]);
  const hecho: Record<Paso, boolean> = {
    datos: !!cv.nombre.trim() && !!(cv.telefono.trim() || cv.correo.trim()) && !!cv.puesto.trim(),
    perfil: cv.resumen.trim().length > 40,
    experiencia: cv.experiencia.some((e) => e.puesto.trim() && lineasLogros(e.logros).length > 0),
    formacion: cv.educacion.some((e) => e.titulo.trim()),
    habilidades: cv.habilidades.split(",").filter((h) => h.trim()).length >= 4,
    otros: !!(cv.idiomas.trim() || cv.disponibilidad.trim() || cv.licencia.trim()),
    diseno: true,
  };
  const i = PASOS.findIndex((p) => p.id === paso);

  const descargar = (que: "cv" | "carta" = "cv") => {
    if (que === "cv" && !cv.nombre.trim()) return void toast.error("Escribe al menos tu nombre.");
    setImprimir(que);
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };
  const copiar = async () => { try { await navigator.clipboard.writeText(textoCV(cv)); toast.success("CV copiado como texto."); } catch { toast.error("No se pudo copiar."); } };
  const limpiar = () => { if (confirm("¿Borrar todo lo escrito en el CV?")) { setCV(cvVacio); setPaso("datos"); } };

  return (
    <div className="min-h-screen bg-background text-foreground" data-imprimir={imprimir}>
      <div className="no-print"><Header /></div>

      <div className="no-print border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">Tu CV profesional</h1>
            <p className="text-sm text-muted-foreground">Gratis, sin marca de agua. {cargado && cv.nombre ? "Se guarda solo mientras escribes." : "Empieza por tus datos."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setHerramienta("comparar")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3.5 text-sm font-semibold hover:border-[#1d6ff2] hover:text-[#1557c4]"><Target className="size-4" /> <span className="hidden sm:inline">Comparar con una vacante</span><span className="sm:hidden">Comparar</span></button>
            <button type="button" onClick={() => { setCartaPara({ puesto: "", empresa: "" }); setTextoCarta(carta(cv, "", "")); setHerramienta("carta"); }} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3.5 text-sm font-semibold hover:border-[#1d6ff2] hover:text-[#1557c4]"><FileText className="size-4" /> Carta</button>
            <button type="button" onClick={() => void copiar()} aria-label="Copiar como texto" className="grid size-10 place-items-center rounded-xl border border-border hover:border-[#1d6ff2]"><Copy className="size-4" /></button>
            <a href={`https://wa.me/?text=${encodeURIComponent(textoCV(cv))}`} target="_blank" rel="noopener noreferrer" aria-label="Enviar por WhatsApp" className="grid size-10 place-items-center rounded-xl border border-border text-[#1fa855] hover:border-[#1fa855]"><MessageCircle className="size-4" /></a>
            <button type="button" onClick={() => descargar()} className="btn-aplicar inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm"><Download className="size-4" /> Descargar PDF</button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[90rem] px-4 pb-20 pt-6 sm:px-6">
        {/* Pasos en celular y tableta */}
        <div className="no-print -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 xl:hidden">
          {PASOS.map((p, j) => <button key={p.id} type="button" onClick={() => { setPaso(p.id); setVistaMovil("editar"); }} className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold ${paso === p.id ? "border-[#0a2f5c] bg-[#0a2f5c] text-white" : "border-border bg-surface"}`}>{hecho[p.id] && p.id !== "diseno" ? <Check className="size-3.5" /> : <span className="text-xs opacity-60">{j + 1}</span>}{p.t}</button>)}
        </div>
        <div className="no-print mb-4 flex rounded-xl border border-border bg-surface p-1 lg:hidden">
          {(["editar", "ver"] as const).map((v) => <button key={v} type="button" onClick={() => setVistaMovil(v)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold ${vistaMovil === v ? "bg-[#0a2f5c] text-white" : ""}`}>{v === "editar" ? <><Pencil className="size-4" /> Editar</> : <><Eye className="size-4" /> Ver mi CV</>}</button>)}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:grid-cols-[14rem_minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* Barra de pasos + revisor (computadora grande) */}
          <aside className="no-print hidden xl:block">
            <div className="sticky top-24 space-y-4">
              <nav aria-label="Pasos del CV" className="space-y-0.5">
                {PASOS.map((p, j) => (
                  <button key={p.id} type="button" onClick={() => setPaso(p.id)} aria-current={paso === p.id ? "step" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${paso === p.id ? "bg-[#0a2f5c] text-white" : "hover:bg-secondary"}`}>
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${paso === p.id ? "bg-white/20" : hecho[p.id] && p.id !== "diseno" ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>{hecho[p.id] && p.id !== "diseno" && paso !== p.id ? <Check className="size-3.5" /> : j + 1}</span>
                    {p.t}
                  </button>
                ))}
              </nav>
              <Revisor r={revision} onIr={(s) => setPaso(s as Paso)} />
            </div>
          </aside>

          {/* Editor */}
          <main className={`no-print min-w-0 ${vistaMovil === "ver" ? "hidden lg:block" : ""}`}>
            <div className="mb-4 xl:hidden"><Revisor r={revision} onIr={(s) => setPaso(s as Paso)} compacto /></div>
            <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-extrabold">{PASOS[i]!.t}</h2>
                <span className="text-sm text-muted-foreground">Paso {i + 1} de {PASOS.length}</span>
              </div>
              {paso === "datos" && <PasoDatos cv={cv} setCV={setCV} />}
              {paso === "perfil" && <PasoPerfil cv={cv} setCV={setCV} rol={rol} rolElegido={rolElegido} setRol={setRolElegido} />}
              {paso === "experiencia" && <PasoExperiencia cv={cv} setCV={setCV} rol={rol} />}
              {paso === "formacion" && <PasoFormacion cv={cv} setCV={setCV} />}
              {paso === "habilidades" && <PasoHabilidades cv={cv} setCV={setCV} rol={rol} />}
              {paso === "otros" && <PasoOtros cv={cv} setCV={setCV} />}
              {paso === "diseno" && <PasoDiseno cv={cv} estilo={estilo} onEstilo={guardarEstilo} />}
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
                <button type="button" disabled={i === 0} onClick={() => setPaso(PASOS[i - 1]!.id)} className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:invisible"><ChevronLeft className="size-4" /> Anterior</button>
                {i < PASOS.length - 1
                  ? <button type="button" onClick={() => setPaso(PASOS[i + 1]!.id)} className="inline-flex h-11 items-center gap-1 rounded-xl bg-[#0a2f5c] px-5 text-sm font-bold text-white">Siguiente: {PASOS[i + 1]!.t} <ChevronRight className="size-4" /></button>
                  : <button type="button" onClick={() => descargar()} className="btn-aplicar inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm"><Download className="size-4" /> Descargar mi CV</button>}
              </div>
            </div>
            <GuardarNube className="mt-4" />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>Al descargar se abre la ventana de impresión: elige «Guardar como PDF».</p>
              <button type="button" onClick={limpiar} className="font-semibold hover:text-destructive">Empezar de cero</button>
            </div>
          </main>

          {/* Vista previa */}
          <div id="cv-vista" className={`min-w-0 ${vistaMovil === "editar" ? "hidden lg:block" : ""}`}>
            <div className="lg:sticky lg:top-24">
              <Vista cv={cv} estilo={estilo} />
              <p className="no-print mt-3 text-center text-sm text-muted-foreground">¿Listo? <Link to="/vacantes" className="font-semibold text-[#1557c4] underline-offset-4 hover:underline">Busca vacantes</Link> y marca «Incluir mi CV» al aplicar.</p>
            </div>
          </div>
        </div>
      </div>

      {herramienta === "comparar" && <Comparar cv={cv} setCV={setCV} onCerrar={() => setHerramienta(null)} onCarta={(v) => { const empresa = v.empresa === "Empresa no indicada" ? "" : v.empresa; setCartaPara({ puesto: v.titulo, empresa }); setTextoCarta(carta(cv, v.titulo, empresa)); setHerramienta("carta"); }} />}
      {herramienta === "carta" && <Carta inicial={cartaPara} texto={textoCarta} setTexto={setTextoCarta} cv={cv} onCerrar={() => setHerramienta(null)} onDescargar={() => descargar("carta")} />}
      <div id="carta-imprimir" className="hidden whitespace-pre-line p-0 text-[15px] leading-relaxed" style={{ fontFamily: "Figtree, system-ui, sans-serif" }}>{textoCarta}</div>

      <div className="no-print"><Footer /></div>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body, .bg-background { background: #fff !important; }
          .no-print, nav, footer { display: none !important; }
          #cv-vista { display: block !important; }
          #cv-vista > div { position: static !important; }
          #cv-escala { transform: none !important; width: auto !important; height: auto !important; position: static !important; }
          #cv-marco { height: auto !important; overflow: visible !important; }
          .cv-hoja { box-shadow: none !important; border: 0 !important; border-radius: 0 !important; width: auto !important; max-width: none !important; }
          .min-h-screen { min-height: 0 !important; }
          [data-imprimir="carta"] #cv-vista { display: none !important; }
          [data-imprimir="carta"] #carta-imprimir { display: block !important; }
          [data-imprimir="cv"] #carta-imprimir { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ───────── Vista previa a escala, con aviso de una página ───────── */

const ANCHO = 794; // A4 a 96 ppp
function Vista({ cv, estilo }: { cv: CV; estilo: { plantilla: Plantilla; color: Color } }) {
  const marco = useRef<HTMLDivElement>(null);
  const hoja = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [alto, setAlto] = useState(1123);
  useLayoutEffect(() => {
    const m = marco.current, h = hoja.current;
    if (!m || !h) return;
    const medir = () => { setEscala(Math.min(1, m.clientWidth / ANCHO)); setAlto(h.offsetHeight); };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(m); ro.observe(h);
    return () => ro.disconnect();
  }, []);
  const paginas = alto / (ANCHO * 1.414);
  return (
    <div>
      <div className="no-print mb-2 flex items-center justify-between gap-2 text-sm">
        <span className="font-bold text-muted-foreground">Así queda</span>
        {paginas > 1.02 ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c27803]/12 px-2.5 py-1 text-xs font-bold text-[#8a5200]"><AlertTriangle className="size-3.5" /> Pasa de una página: acorta o usa «Compacto»</span>
          : <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-xs font-bold text-success"><CheckCircle2 className="size-3.5" /> Cabe en una página</span>}
      </div>
      <div id="cv-marco" ref={marco} className="relative w-full" style={{ height: alto * escala }}>
        <div id="cv-escala" ref={hoja} className="absolute left-0 top-0 origin-top-left" style={{ width: ANCHO, transform: `scale(${escala})` }}>
          <HojaCV cv={cv} plantilla={estilo.plantilla} color={estilo.color} />
        </div>
        {paginas > 1.02 && <div aria-hidden="true" className="no-print pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-[#c27803]/60" style={{ top: ANCHO * 1.414 * escala }}><span className="absolute right-2 -top-6 rounded bg-[#c27803] px-1.5 py-0.5 text-[10px] font-bold text-white">Fin de la página 1</span></div>}
      </div>
    </div>
  );
}

/* ───────── Revisor ───────── */

function Revisor({ r, onIr, compacto = false }: { r: ReturnType<typeof revisar>; onIr: (s: string) => void; compacto?: boolean }) {
  const [abierto, setAbierto] = useState(!compacto);
  const pendientes = r.avisos.filter((a) => a.tipo !== "bien");
  const tono = r.puntos >= 85 ? "#0f7a43" : r.puntos >= 60 ? "#1d6ff2" : "#c27803";
  const rad = 20, c = 2 * Math.PI * rad;
  return (
    <section className="rounded-2xl border border-border bg-surface p-4" aria-label="Revisor del CV">
      <button type="button" onClick={() => setAbierto((x) => !x)} className="flex w-full items-center gap-3 text-left" aria-expanded={abierto}>
        <span className="relative grid size-12 shrink-0 place-items-center">
          <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true"><circle cx="24" cy="24" r={rad} fill="none" stroke="#e8eef6" strokeWidth="5" /><circle cx="24" cy="24" r={rad} fill="none" stroke={tono} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - r.puntos / 100)} className="transition-[stroke-dashoffset] duration-500" /></svg>
          <span className="text-sm font-extrabold tabular-nums">{r.puntos}</span>
        </span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">Revisor del CV</span><span className="block text-xs text-muted-foreground">{pendientes.length ? `${pendientes.length} ${pendientes.length === 1 ? "cosa por mejorar" : "cosas por mejorar"}` : "¡Todo se ve bien!"}</span></span>
        <ChevronRight className={`size-4 shrink-0 text-muted-foreground transition-transform ${abierto ? "rotate-90" : ""}`} />
      </button>
      {abierto && (
        <ul className="mt-3 space-y-1.5">
          {r.avisos.slice(0, 8).map((a, j) => (
            <li key={j}><button type="button" onClick={() => onIr(a.seccion)} className="flex w-full items-start gap-2 rounded-lg p-1.5 text-left text-[13px] leading-snug hover:bg-secondary">
              {a.tipo === "error" ? <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" /> : a.tipo === "mejora" ? <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-[#c27803]" /> : <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />}
              <span>{a.texto}</span>
            </button></li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ───────── Pasos ───────── */

type P = { cv: CV; setCV: (cv: CV) => void };

function PasoDatos({ cv, setCV }: P) {
  const set = (k: keyof CV) => (e: React.ChangeEvent<HTMLInputElement>) => setCV({ ...cv, [k]: e.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className={etiqueta}>Nombre completo</span><input value={cv.nombre} onChange={set("nombre")} className={campo} placeholder="Ej.: María Pérez" autoComplete="name" /></label>
      <label className="sm:col-span-2"><span className={etiqueta}>Puesto que buscas</span><input value={cv.puesto} onChange={set("puesto")} className={campo} placeholder="Ej.: Asistente administrativa" list="puestos-sugeridos" /><span className="mt-1 block text-xs text-muted-foreground">Con esto te damos ejemplos para tu perfil, tus logros y tus habilidades.</span></label>
      <datalist id="puestos-sugeridos">{["Cajera", "Servicio al cliente", "Agente de call center", "Auxiliar de almacén", "Asistente administrativa", "Recepcionista", "Vendedor", "Chofer", "Mesero", "Auxiliar contable", "Operaria de producción", "Soporte técnico"].map((x) => <option key={x} value={x} />)}</datalist>
      <label><span className={etiqueta}>WhatsApp / teléfono</span><input value={cv.telefono} onChange={set("telefono")} className={campo} placeholder="809-000-0000" inputMode="tel" autoComplete="tel" /></label>
      <label><span className={etiqueta}>Correo</span><input value={cv.correo} onChange={set("correo")} className={campo} placeholder="nombre.apellido@gmail.com" inputMode="email" autoComplete="email" /></label>
      <label><span className={etiqueta}>Ciudad o provincia</span><input value={cv.ciudad} onChange={set("ciudad")} className={campo} placeholder="Ej.: Santiago" /></label>
      <label><span className={etiqueta}>LinkedIn <span className="font-normal text-muted-foreground">(opcional)</span></span><input value={cv.linkedin} onChange={set("linkedin")} className={campo} placeholder="linkedin.com/in/tu-nombre" /></label>
      <p className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-[13px] text-muted-foreground sm:col-span-2"><Lightbulb className="mt-0.5 size-4 shrink-0 text-[#1557c4]" /> No pongas foto, cédula, edad, estado civil ni religión. No hacen falta y así te evalúan por lo que sabes hacer.</p>
    </div>
  );
}

function SelectorRol({ rol, rolElegido, setRol }: { rol: Rol | null; rolElegido: string; setRol: (v: string) => void }) {
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold text-muted-foreground">Ejemplos para:</span>
      <select value={rolElegido || rol?.id || ""} onChange={(e) => setRol(e.target.value)} className="h-9 rounded-lg border border-border bg-surface px-2 text-sm font-semibold">
        {!rol && <option value="">Elige tu área</option>}
        {ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
      </select>
    </label>
  );
}

function PasoPerfil({ cv, setCV, rol, rolElegido, setRol }: P & { rol: Rol | null; rolElegido: string; setRol: (v: string) => void }) {
  const n = cv.resumen.trim().length;
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="cv-resumen" className={etiqueta}>Sobre ti, en 2 o 3 líneas</label>
        <textarea id="cv-resumen" value={cv.resumen} onChange={(e) => setCV({ ...cv, resumen: e.target.value })} rows={5} className={area} placeholder="Qué sabes hacer, cuánta experiencia tienes y qué buscas." />
        <p className={`mt-1 text-right text-xs ${n > 450 ? "font-bold text-[#8a5200]" : "text-muted-foreground"}`}>{n} caracteres {n > 450 ? "· muy largo" : n >= 120 ? "· buen largo" : ""}</p>
      </div>
      <div className="rounded-2xl bg-background p-4">
        <SelectorRol rol={rol} rolElegido={rolElegido} setRol={setRol} />
        {rol ? (
          <ul className="mt-3 space-y-2">
            {rol.resumenes.map((r) => (
              <li key={r} className="rounded-xl border border-border bg-surface p-3 text-[14px] leading-relaxed">
                <Corchetes texto={r} />
                <button type="button" onClick={() => { setCV({ ...cv, resumen: r }); toast.success("Ejemplo puesto. Cambia lo que está entre [corchetes] por tus datos."); }} className="mt-2 block text-sm font-bold text-[#1557c4] hover:underline">Usar este ejemplo</button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted-foreground">Escribe en «Tus datos» el puesto que buscas, o elige tu área, y te mostramos ejemplos.</p>}
      </div>
    </div>
  );
}

function Corchetes({ texto }: { texto: string }) {
  return <>{texto.split(/(\[[^\]]+\])/).map((p, i) => p.startsWith("[") ? <mark key={i} className="rounded bg-[#ffd84d]/50 px-0.5 text-inherit">{p}</mark> : <span key={i}>{p}</span>)}</>;
}

function PasoExperiencia({ cv, setCV, rol }: P & { rol: Rol | null }) {
  const [abierta, setAbierta] = useState(0);
  const setExp = (j: number, cambios: Partial<Experiencia>) => setCV({ ...cv, experiencia: cv.experiencia.map((x, k) => (k === j ? { ...x, ...cambios } : x)) });
  const mover = (j: number, d: -1 | 1) => { const l = [...cv.experiencia]; const t = l[j + d]; if (!t) return; l[j + d] = l[j]!; l[j] = t; setCV({ ...cv, experiencia: l }); setAbierta(j + d); };
  const agregar = () => { setCV({ ...cv, experiencia: [...cv.experiencia, { puesto: "", empresa: "", desde: "", hasta: "", logros: "" }] }); setAbierta(cv.experiencia.length); };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">La más reciente primero. ¿Primer empleo? Pon pasantías, voluntariado o trabajos informales: cuentan.</p>
      {cv.experiencia.map((e, j) => {
        const logros = e.logros ? e.logros.split("\n") : [""];
        const setLogro = (k: number, v: string) => setExp(j, { logros: logros.map((x, m) => (m === k ? v : x)).join("\n") });
        return (
          <div key={j} className={`rounded-2xl border ${abierta === j ? "border-[#1d6ff2]/40 bg-background" : "border-border"}`}>
            <div className="flex items-center gap-2 p-3">
              <button type="button" onClick={() => setAbierta(abierta === j ? -1 : j)} className="min-w-0 flex-1 text-left">
                <span className="block truncate font-bold">{e.puesto || `Experiencia ${j + 1}`}</span>
                <span className="block truncate text-xs text-muted-foreground">{[e.empresa, [e.desde, e.hasta || (e.desde ? "actualidad" : "")].filter(Boolean).join(" – ")].filter(Boolean).join(" · ") || "Toca para llenar"}</span>
              </button>
              <button type="button" disabled={j === 0} onClick={() => mover(j, -1)} aria-label="Subir" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"><ArrowUp className="size-4" /></button>
              <button type="button" disabled={j === cv.experiencia.length - 1} onClick={() => mover(j, 1)} aria-label="Bajar" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"><ArrowDown className="size-4" /></button>
              {cv.experiencia.length > 1 && <button type="button" onClick={() => { if (confirm("¿Quitar esta experiencia?")) setCV({ ...cv, experiencia: cv.experiencia.filter((_, k) => k !== j) }); }} aria-label="Quitar" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="size-4" /></button>}
            </div>
            {abierta === j && (
              <div className="space-y-4 border-t border-border p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label><span className={etiqueta}>Puesto</span><input value={e.puesto} onChange={(ev) => setExp(j, { puesto: ev.target.value })} className={campo} placeholder="Ej.: Cajera" /></label>
                  <label><span className={etiqueta}>Empresa</span><input value={e.empresa} onChange={(ev) => setExp(j, { empresa: ev.target.value })} className={campo} placeholder="Ej.: Supermercado Bravo" /></label>
                  <label><span className={etiqueta}>Desde</span><input value={e.desde} onChange={(ev) => setExp(j, { desde: ev.target.value })} className={campo} placeholder="Ej.: Mar. 2022" /></label>
                  <label><span className={etiqueta}>Hasta</span><input value={e.hasta} onChange={(ev) => setExp(j, { hasta: ev.target.value })} className={campo} placeholder="Vacío si trabajas aquí" /></label>
                </div>
                <div>
                  <p className={etiqueta}>Qué lograste <span className="font-normal text-muted-foreground">(una idea por línea)</span></p>
                  <ul className="space-y-2">
                    {logros.map((l, k) => (
                      <li key={k} className="flex items-start gap-2">
                        <span aria-hidden="true" className="mt-4 size-1.5 shrink-0 rounded-full bg-[#1d6ff2]" />
                        <textarea value={l} onChange={(ev) => setLogro(k, ev.target.value.replace(/\n/g, " "))} rows={2} className={`${area} text-[14px]`} placeholder="Ej.: Atendía 60 clientes al día y bajé las quejas a la mitad." />
                        {logros.length > 1 && <button type="button" onClick={() => setExp(j, { logros: logros.filter((_, m) => m !== k).join("\n") })} aria-label="Quitar logro" className="mt-2 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-destructive"><X className="size-4" /></button>}
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => setExp(j, { logros: [...logros, ""].join("\n") })} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#1557c4]"><Plus className="size-4" /> Otro logro</button>
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-muted-foreground">Empieza con un verbo:</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">{VERBOS.slice(0, 10).map((v) => <button key={v} type="button" onClick={() => { const ult = logros.length - 1; const vacio = !logros[ult]!.trim(); setExp(j, { logros: (vacio ? logros.map((x, m) => (m === ult ? `${v} ` : x)) : [...logros, `${v} `]).join("\n") }); }} className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-primary hover:bg-[#1d6ff2]/15">{v}</button>)}</div>
                  </div>
                  {rol && (
                    <div className="mt-4 rounded-xl bg-[#ffd84d]/15 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-[#6b5000]"><Lightbulb className="size-3.5" /> Ideas de logros para {rol.nombre.toLowerCase()}. Cambia los [corchetes] por tus números reales.</p>
                      <ul className="mt-2 space-y-1.5">{rol.logros.map((x) => <li key={x}><button type="button" onClick={() => { const limpio = logros.filter((y) => y.trim()); setExp(j, { logros: [...limpio, x].join("\n") }); }} className="flex w-full items-start gap-2 rounded-lg p-1.5 text-left text-[13px] hover:bg-white"><Plus className="mt-0.5 size-3.5 shrink-0 text-[#1557c4]" /><span><Corchetes texto={x} /></span></button></li>)}</ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button type="button" onClick={agregar} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-bold text-[#1557c4] hover:border-[#1d6ff2]"><Plus className="size-4" /> Agregar otra experiencia</button>
    </div>
  );
}

function ListaSimple<T extends Educacion | Curso>({ items, onCambio, nuevo, campos, agregarTexto }: { items: T[]; onCambio: (l: T[]) => void; nuevo: T; campos: { k: keyof T; ph: string; ancho?: string }[]; agregarTexto: string }) {
  return (
    <div className="space-y-2">
      {items.map((it, j) => (
        <div key={j} className="flex items-start gap-2">
          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1.3fr_1fr_6rem]">
            {campos.map((c) => <input key={String(c.k)} value={String(it[c.k] ?? "")} onChange={(e) => onCambio(items.map((x, m) => (m === j ? { ...x, [c.k]: e.target.value } : x)))} className={campo} placeholder={c.ph} />)}
          </div>
          <button type="button" onClick={() => onCambio(items.filter((_, m) => m !== j))} aria-label="Quitar" className="mt-1.5 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onCambio([...items, { ...nuevo }])} className="inline-flex items-center gap-1 text-sm font-bold text-[#1557c4]"><Plus className="size-4" /> {agregarTexto}</button>
    </div>
  );
}

function PasoFormacion({ cv, setCV }: P) {
  return (
    <div className="space-y-6">
      <div>
        <p className={etiqueta}>Estudios</p>
        <ListaSimple items={cv.educacion} onCambio={(l) => setCV({ ...cv, educacion: l })} nuevo={{ titulo: "", centro: "", anio: "" }} agregarTexto="Agregar estudio" campos={[{ k: "titulo", ph: "Título (ej.: Bachiller, Lic. en Contabilidad)" }, { k: "centro", ph: "Centro (ej.: UASD, PUCMM)" }, { k: "anio", ph: "Año" }]} />
      </div>
      <div>
        <p className={etiqueta}>Cursos y certificaciones</p>
        <p className="-mt-1 mb-2 text-xs text-muted-foreground">INFOTEP, diplomados, cursos en línea… Suman mucho, sobre todo si estás empezando.</p>
        <ListaSimple items={cv.cursos} onCambio={(l) => setCV({ ...cv, cursos: l })} nuevo={{ nombre: "", centro: "", anio: "" }} agregarTexto="Agregar curso" campos={[{ k: "nombre", ph: "Curso (ej.: Excel intermedio)" }, { k: "centro", ph: "Centro (ej.: INFOTEP)" }, { k: "anio", ph: "Año" }]} />
      </div>
    </div>
  );
}

function PasoHabilidades({ cv, setCV, rol }: P & { rol: Rol | null }) {
  const [nueva, setNueva] = useState("");
  const [idioma, setIdioma] = useState("Inglés");
  const [nivel, setNivel] = useState("Básico");
  const hab = cv.habilidades.split(",").map((h) => h.trim()).filter(Boolean);
  const idiomas = cv.idiomas.split(",").map((h) => h.trim()).filter(Boolean);
  const setHab = (l: string[]) => setCV({ ...cv, habilidades: [...new Set(l)].join(", ") });
  const agregar = (h: string) => { const t = h.trim(); if (t && !hab.some((x) => x.toLowerCase() === t.toLowerCase())) setHab([...hab, t]); };
  return (
    <div className="space-y-6">
      <div>
        <p className={etiqueta}>Tus habilidades <span className="font-normal text-muted-foreground">({hab.length}; lo ideal es de 6 a 12)</span></p>
        <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background p-2">
          {hab.map((h) => <span key={h} className="inline-flex items-center gap-1 rounded-full bg-[#0a2f5c] py-1 pl-3 pr-1.5 text-[13px] font-semibold text-white">{h}<button type="button" onClick={() => setHab(hab.filter((x) => x !== h))} aria-label={`Quitar ${h}`} className="grid size-5 place-items-center rounded-full hover:bg-white/20"><X className="size-3" /></button></span>)}
          <input value={nueva} onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); agregar(nueva); setNueva(""); } }} onBlur={() => { if (nueva.trim()) { agregar(nueva); setNueva(""); } }} placeholder={hab.length ? "Escribe otra y pulsa Enter" : "Escribe una habilidad y pulsa Enter"} className="h-8 min-w-[10rem] flex-1 bg-transparent px-2 text-[14px] outline-none" />
        </div>
        {rol && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground">Comunes en {rol.nombre.toLowerCase()} (toca las que sabes hacer):</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{rol.habilidades.filter((h) => !hab.some((x) => x.toLowerCase() === h.toLowerCase())).map((h) => <button key={h} type="button" onClick={() => agregar(h)} className={chip}><Plus className="size-3" />{h}</button>)}</div>
          </div>
        )}
      </div>
      <div>
        <p className={etiqueta}>Idiomas</p>
        <div className="flex flex-wrap gap-1.5">{idiomas.map((x) => <span key={x} className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pl-3 pr-1.5 text-[13px] font-semibold text-primary">{x}<button type="button" onClick={() => setCV({ ...cv, idiomas: idiomas.filter((y) => y !== x).join(", ") })} aria-label={`Quitar ${x}`} className="grid size-5 place-items-center rounded-full hover:bg-white"><X className="size-3" /></button></span>)}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <select value={idioma} onChange={(e) => setIdioma(e.target.value)} className="h-10 rounded-xl border border-border bg-surface px-3 text-sm">{IDIOMAS.map((x) => <option key={x}>{x}</option>)}</select>
          <select value={nivel} onChange={(e) => setNivel(e.target.value)} className="h-10 rounded-xl border border-border bg-surface px-3 text-sm">{NIVELES.map((x) => <option key={x}>{x}</option>)}</select>
          <button type="button" onClick={() => { const v = `${idioma} (${nivel.toLowerCase()})`; const sin = idiomas.filter((y) => !y.startsWith(idioma)); setCV({ ...cv, idiomas: [...sin, v].join(", ") }); }} className="inline-flex h-10 items-center gap-1 rounded-xl bg-[#0a2f5c] px-4 text-sm font-bold text-white"><Plus className="size-4" /> Agregar</button>
        </div>
      </div>
    </div>
  );
}

function PasoOtros({ cv, setCV }: P) {
  const disp = ["Inmediata", "Turnos rotativos", "Fines de semana", "Medio tiempo", "Viajar", "Trabajo remoto"];
  return (
    <div className="space-y-5">
      <label className="block"><span className={etiqueta}>Licencia de conducir</span>
        <select value={cv.licencia} onChange={(e) => setCV({ ...cv, licencia: e.target.value })} className={campo}>
          <option value="">No poner</option>
          {["Categoría 1 (motor)", "Categoría 2", "Categoría 3", "Categoría 4", "Categoría 2 y motor"].map((x) => <option key={x}>{x}</option>)}
        </select>
      </label>
      <div>
        <label htmlFor="cv-disp" className={etiqueta}>Disponibilidad</label>
        <input id="cv-disp" value={cv.disponibilidad} onChange={(e) => setCV({ ...cv, disponibilidad: e.target.value })} className={campo} placeholder="Ej.: Inmediata, turnos rotativos" />
        <div className="mt-2 flex flex-wrap gap-1.5">{disp.map((d) => <button key={d} type="button" onClick={() => { const l = cv.disponibilidad.split(",").map((x) => x.trim()).filter(Boolean); setCV({ ...cv, disponibilidad: (l.includes(d) ? l.filter((x) => x !== d) : [...l, d]).join(", ") }); }} aria-pressed={cv.disponibilidad.includes(d)} className={`${chip} ${cv.disponibilidad.includes(d) ? "border-[#1d6ff2] bg-[#1d6ff2]/10 text-[#1557c4]" : ""}`}>{cv.disponibilidad.includes(d) && <Check className="size-3" />}{d}</button>)}</div>
      </div>
      <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
        <span><span className="block text-sm font-bold">«Referencias disponibles a solicitud»</span><span className="text-xs text-muted-foreground">No pongas teléfonos de referencias en el CV: dalos cuando te los pidan.</span></span>
        <input type="checkbox" checked={cv.referencias} onChange={(e) => setCV({ ...cv, referencias: e.target.checked })} className="size-5 shrink-0" />
      </label>
    </div>
  );
}

function PasoDiseno({ cv, estilo, onEstilo }: { cv: CV; estilo: { plantilla: Plantilla; color: Color }; onEstilo: (e: { plantilla: Plantilla; color: Color }) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <p className={etiqueta}>Diseño</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PLANTILLAS.map((p) => (
            <button key={p.id} type="button" onClick={() => onEstilo({ ...estilo, plantilla: p.id })} aria-pressed={estilo.plantilla === p.id} className={`group overflow-hidden rounded-2xl border-2 bg-background text-left transition-colors ${estilo.plantilla === p.id ? "border-[#1d6ff2]" : "border-transparent hover:border-border"}`}>
              <div className="pointer-events-none relative h-36 overflow-hidden bg-[#eef1f5]" aria-hidden="true">
                <div className="absolute left-1/2 top-2 origin-top" style={{ width: ANCHO, transform: "translateX(-50%) scale(0.2)" }}><HojaCV cv={cv.nombre ? cv : { ...cvVacio, nombre: "María Pérez", puesto: "Asistente administrativa", telefono: "809-555-0000", correo: "maria@correo.com", ciudad: "Santo Domingo", resumen: "Organizada y detallista, con tres años apoyando gerencias.", experiencia: [{ puesto: "Asistente", empresa: "Empresa Ejemplo", desde: "2022", hasta: "", logros: "Organicé el archivo de 2,000 expedientes.\nCoordiné la agenda de 3 gerentes." }], educacion: [{ titulo: "Lic. en Administración", centro: "UASD", anio: "2021" }], habilidades: "Excel, Agenda, Redacción, Archivo", idiomas: "Español (nativo)" }} plantilla={p.id} color={estilo.color} /></div>
              </div>
              <p className="flex items-center justify-between px-3 py-2 text-sm font-bold">{p.t}{estilo.plantilla === p.id && <CheckCircle2 className="size-4 text-[#1d6ff2]" />}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className={etiqueta}>Color</p>
        <div className="flex flex-wrap gap-2">
          {COLORES.map((c) => <button key={c.id} type="button" onClick={() => onEstilo({ ...estilo, color: c.id })} aria-pressed={estilo.color === c.id} aria-label={c.t} title={c.t} className={`grid size-10 place-items-center rounded-full ring-offset-2 transition-shadow ${estilo.color === c.id ? "ring-2 ring-[#1d6ff2]" : ""}`} style={{ backgroundColor: c.c }}>{estilo.color === c.id && <Check className="size-4 text-white" />}</button>)}
        </div>
      </div>
      <p className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-[13px] text-muted-foreground"><Lightbulb className="mt-0.5 size-4 shrink-0 text-[#1557c4]" /> Todos los diseños los leen bien los sistemas que usan las empresas para filtrar CV. Si es para un banco o una oficina formal, «Clásico» o «Elegante» son apuestas seguras.</p>
    </div>
  );
}

/* ───────── Herramientas ───────── */

function Modal({ titulo, onCerrar, children, ancho = "max-w-2xl" }: { titulo: string; onCerrar: () => void; children: React.ReactNode; ancho?: string }) {
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); }; document.addEventListener("keydown", t); return () => document.removeEventListener("keydown", t); }, [onCerrar]);
  return (
    <div className="no-print fixed inset-0 z-[70] grid place-items-end sm:place-items-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" tabIndex={-1} aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 bg-[#0a1a33]/50" />
      <div className={`relative flex max-h-[92vh] w-full ${ancho} flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl`}>
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4"><h2 className="font-display text-lg font-extrabold">{titulo}</h2><button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid size-9 place-items-center rounded-lg hover:bg-muted"><X className="size-5" /></button></header>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function Comparar({ cv, setCV, onCerrar, onCarta }: P & { onCerrar: () => void; onCarta: (v: Vacante) => void }) {
  const { jobs } = useVacantes();
  const [q, setQ] = useState(cv.puesto);
  const [elegida, setElegida] = useState<Vacante | null>(null);
  const lista = jobs.filter((j) => j.requisitos.length > 0 && (!q.trim() || `${j.titulo} ${j.empresa}`.toLowerCase().includes(q.trim().toLowerCase()))).slice(0, 12);
  const texto = textoCV(cv);
  const k = elegida ? coincidencia(texto, elegida.requisitos) : null;
  const hab = cv.habilidades.split(",").map((h) => h.trim()).filter(Boolean);
  return (
    <Modal titulo="Compara tu CV con una vacante" onCerrar={onCerrar}>
      {!elegida ? (
        <>
          <p className="text-sm text-muted-foreground">Elige una vacante y te decimos qué requisitos ya aparecen en tu CV y cuáles faltan.</p>
          <label className="relative mt-3 block"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por puesto o empresa" className={`${campo} pl-9`} /></label>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
            {lista.map((j) => <li key={j.id}><button type="button" onClick={() => setElegida(j)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/50"><span className="min-w-0"><span className="block truncate font-bold">{j.titulo}</span><span className="block truncate text-xs text-muted-foreground">{j.empresa} · {j.provincia}</span></span><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></button></li>)}
            {!lista.length && <li className="p-4 text-sm text-muted-foreground">No encontramos vacantes con esa búsqueda.</li>}
          </ul>
        </>
      ) : (
        <>
          <button type="button" onClick={() => setElegida(null)} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" /> Elegir otra</button>
          <h3 className="text-lg font-extrabold">{elegida.titulo}</h3>
          <p className="text-sm text-muted-foreground">{elegida.empresa}</p>
          {!k ? <p className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm">Completa más tu CV (perfil, experiencia y habilidades) para poder compararlo.</p> : (
            <>
              <div className="mt-4 flex items-center gap-4 rounded-2xl bg-background p-4">
                <span className="font-display text-4xl font-extrabold tabular-nums" style={{ color: k.ok.length / k.total >= 0.7 ? "#0f7a43" : k.ok.length / k.total >= 0.4 ? "#1d6ff2" : "#c27803" }}>{Math.round((k.ok.length / k.total) * 100)}%</span>
                <span className="text-sm"><b>{k.ok.length} de {k.total} requisitos</b> aparecen en tu CV.<br /><span className="text-muted-foreground">Es una guía por palabras, no una decisión.</span></span>
              </div>
              {k.ok.length > 0 && <><p className="mt-4 text-sm font-extrabold">Ya los tienes</p><ul className="mt-2 space-y-1.5">{k.ok.map((r) => <li key={r} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-success" />{r}</li>)}</ul></>}
              {k.falta.length > 0 && (
                <>
                  <p className="mt-4 text-sm font-extrabold">No aparecen en tu CV</p>
                  <p className="text-xs text-muted-foreground">Si de verdad lo sabes hacer, agrégalo. Si no, no lo pongas: te lo pueden preguntar en la entrevista.</p>
                  <ul className="mt-2 space-y-1.5">{k.falta.map((r) => {
                    const corto = r.length <= 40 ? r : "";
                    const ya = corto && hab.some((h) => h.toLowerCase() === corto.toLowerCase());
                    return <li key={r} className="flex items-start justify-between gap-3 rounded-lg p-1.5 text-sm hover:bg-secondary/40"><span className="flex items-start gap-2"><span className="mt-1.5 size-2 shrink-0 rounded-full border border-current text-muted-foreground" />{r}</span>{corto && !ya && <button type="button" onClick={() => { setCV({ ...cv, habilidades: [...hab, corto].join(", ") }); toast.success("Agregado a tus habilidades"); }} className="shrink-0 text-xs font-bold text-[#1557c4] hover:underline">Lo sé hacer</button>}</li>;
                  })}</ul>
                </>
              )}
            </>
          )}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
            <button type="button" onClick={() => onCarta(elegida)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0a2f5c] px-4 text-sm font-bold text-white"><FileText className="size-4" /> Hacer carta para esta vacante</button>
            <Link to="/vacantes/$id" params={{ id: elegida.id }} className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm font-bold hover:border-[#1d6ff2]">Ver la vacante</Link>
          </div>
        </>
      )}
    </Modal>
  );
}

function Carta({ inicial, texto, setTexto, cv, onCerrar, onDescargar }: { inicial: { puesto: string; empresa: string }; texto: string; setTexto: (t: string) => void; cv: CV; onCerrar: () => void; onDescargar: () => void }) {
  const [puesto, setPuesto] = useState(inicial.puesto);
  const [empresa, setEmpresa] = useState(inicial.empresa);
  return (
    <Modal titulo="Carta de presentación" onCerrar={onCerrar}>
      <p className="text-sm text-muted-foreground">La armamos con los datos de tu CV. Revísala y cámbiala a tu gusto antes de enviarla.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input value={puesto} onChange={(e) => setPuesto(e.target.value)} placeholder="Puesto al que aplicas" className={campo} />
        <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Empresa" className={campo} />
        <button type="button" onClick={() => setTexto(carta(cv, puesto, empresa))} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0a2f5c] px-4 text-sm font-bold text-white"><Sparkles className="size-4" /> Armar</button>
      </div>
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={16} className={`${area} mt-3 text-[14px]`} aria-label="Texto de la carta" />
      {/\[[^\]]+\]/.test(texto) && <p className="mt-2 text-xs font-semibold text-[#8a5200]">Cambia lo que está entre [corchetes] antes de enviarla.</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => { void navigator.clipboard.writeText(texto).then(() => toast.success("Carta copiada")).catch(() => toast.error("No se pudo copiar")); }} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold hover:border-[#1d6ff2]"><Copy className="size-4" /> Copiar</button>
        <button type="button" onClick={onDescargar} className="btn-aplicar inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm"><Download className="size-4" /> Descargar PDF</button>
      </div>
    </Modal>
  );
}

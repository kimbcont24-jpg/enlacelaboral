import { useEffect, useState, type ComponentType, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Award, BadgeCheck, Check, CheckCircle2, Download, Eye, FileText, Lightbulb, Lock, Mic, Send, ShieldCheck, Sparkles, Target, Upload } from "lucide-react";

import { COLORES, HojaCV, PLANTILLAS, type Color, type Fuente, type Plantilla } from "@/components/cv/Hojas";
import { cvVacio, type CV } from "@/lib/cv";

/** CV de ejemplo: se usa en la portada y en las miniaturas de diseño cuando la persona todavía no ha escrito nada. */
export const CV_MUESTRA: CV = {
  ...cvVacio,
  nombre: "María Pérez",
  puesto: "Asistente administrativa",
  telefono: "809-555-0000",
  correo: "maria.perez@correo.com",
  ciudad: "Santo Domingo",
  resumen: "Asistente administrativa con tres años apoyando gerencias. Organizo agendas, archivo y reportes en Excel, y atiendo clientes con trato cercano.",
  experiencia: [
    { puesto: "Asistente administrativa", empresa: "Empresa Ejemplo", desde: "Mar. 2022", hasta: "", logros: "Organicé el archivo de 2,000 expedientes y reduje a la mitad el tiempo de búsqueda.\nCoordiné la agenda de 3 gerentes sin choques de reuniones.\nPreparé los reportes semanales de gastos en Excel." },
    { puesto: "Recepcionista", empresa: "Centro Médico Ejemplo", desde: "2020", hasta: "2022", logros: "Atendí a más de 60 personas al día en recepción y por teléfono.\nLlevé el control de citas de 8 consultorios." },
  ],
  educacion: [{ titulo: "Lic. en Administración de Empresas", centro: "UASD", anio: "2021" }],
  cursos: [{ nombre: "Excel intermedio", centro: "INFOTEP", anio: "2023" }],
  habilidades: "Excel, Manejo de agenda, Redacción, Archivo, Servicio al cliente, Facturación",
  idiomas: "Español (nativo), Inglés (intermedio)",
  disponibilidad: "Inmediata",
};

export type EstiloCV = { plantilla: Plantilla; color: Color; fuente: Fuente };

/** Nivel del CV según el puntaje del revisor: da una meta cercana en vez de solo un número. */
export function nivelCV(puntos: number): { t: string; color: string } {
  if (puntos >= 85) return { t: "Listo para enviar", color: "#0f7a43" };
  if (puntos >= 60) return { t: "Casi listo", color: "#1d6ff2" };
  if (puntos >= 40) return { t: "Va tomando forma", color: "#c27803" };
  return { t: "Apenas empieza", color: "#c27803" };
}

/** Anillo de puntaje (0–100). */
export function Anillo({ puntos, color, lado = 48, grosor = 5, pista = "#e8eef6", className = "" }: { puntos: number; color: string; lado?: number; grosor?: number; pista?: string; className?: string }) {
  const rad = 24 - grosor / 2 - 1.5, c = 2 * Math.PI * rad;
  return (
    <span className={`relative grid shrink-0 place-items-center ${className}`} style={{ width: lado, height: lado }}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={rad} fill="none" stroke={pista} strokeWidth={grosor} />
        <circle cx="24" cy="24" r={rad} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, puntos)) / 100)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <span className="font-extrabold tabular-nums" style={{ fontSize: lado * 0.3 }}>{puntos}</span>
    </span>
  );
}

/** Hoja A4 en miniatura, a escala con CSS (`--s`), para la portada. */
function Pagina({ cv, estilo, className = "" }: { cv: CV; estilo: EstiloCV; className?: string }) {
  return (
    <div className={`cve-pagina ${className}`}>
      <div><HojaCV cv={cv} plantilla={estilo.plantilla} color={estilo.color} fuente={estilo.fuente} /></div>
    </div>
  );
}

const RECORRIDO: { plantilla: Plantilla; color: Color }[] = [
  { plantilla: "clasico", color: "marino" },
  { plantilla: "moderno", color: "azul" },
  { plantilla: "ejecutivo", color: "turquesa" },
  { plantilla: "elegante", color: "vino" },
  { plantilla: "minimal", color: "grafito" },
  { plantilla: "compacto", color: "verde" },
];

/* ───────── Portada ───────── */

export function PortadaCV({ cv, cargado, estilo, puntos, siguiente, onEmpezar, onImportar, onDescargar }: {
  cv: CV; cargado: boolean; estilo: EstiloCV; puntos: number;
  /** Nombre del próximo paso sin completar, si queda alguno. */
  siguiente: string | null;
  onEmpezar: () => void; onImportar: () => void; onDescargar: () => void;
}) {
  const conDatos = cargado && !!(cv.nombre.trim() || cv.resumen.trim() || cv.experiencia.some((e) => e.puesto.trim()));
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    if (conDatos || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setVuelta((v) => (v + 1) % RECORRIDO.length), 3600);
    return () => window.clearInterval(t);
  }, [conDatos]);

  const demo = RECORRIDO[vuelta]!;
  const frente: EstiloCV = conDatos ? estilo : { plantilla: demo.plantilla, color: demo.color, fuente: "s" };
  const otra = RECORRIDO[(vuelta + 2) % RECORRIDO.length]!;
  const atras: EstiloCV = { plantilla: conDatos && estilo.plantilla === otra.plantilla ? "minimal" : otra.plantilla, color: conDatos ? estilo.color : otra.color, fuente: "s" };
  const hoja = conDatos ? cv : CV_MUESTRA;
  const nombreDiseno = PLANTILLAS.find((p) => p.id === frente.plantilla)!.t;
  const nivel = nivelCV(conDatos ? puntos : 92);
  const primerNombre = cv.nombre.trim().split(/\s+/)[0] ?? "";

  return (
    <header className="hero-dark no-print px-4 pb-24 pt-9 sm:px-6 md:pt-12 lg:pb-28">
      <div className="relative mx-auto grid max-w-[82rem] items-center gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        <div>
          <p className="entra inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90 ring-1 ring-white/15"><Sparkles className="size-4 text-[#ffd84d]" /> Estudio de CV · gratis de verdad</p>
          <h1 className="entra mt-5 text-balance font-display text-[2rem] font-extrabold leading-[1.08] tracking-[-0.03em] [animation-delay:60ms] sm:text-[2.6rem] xl:text-[3.1rem]">Crea un CV que haga que <span className="cve-subraya text-[#ffd84d]">te llamen</span></h1>
          <p className="entra mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-white/85 [animation-delay:120ms]">Te guiamos paso a paso con ejemplos para tu puesto, un revisor que te dice qué mejorar y 6 diseños que las empresas leen bien. Al terminar, aplicas a vacantes reales con un toque.</p>

          {conDatos ? (
            <div className="vista-entra mt-7 max-w-xl rounded-3xl bg-white/[0.08] p-4 ring-1 ring-white/15 backdrop-blur-sm sm:p-5">
              <div className="flex items-center gap-4">
                <Anillo puntos={puntos} color={puntos >= 85 ? "#5fe3a1" : puntos >= 60 ? "#8ec1ff" : "#ffd84d"} pista="rgb(255 255 255 / 0.16)" lado={64} grosor={5} />
                <div className="min-w-0">
                  <p className="text-lg font-extrabold leading-tight">{primerNombre ? `${primerNombre}, tu CV va en ${puntos} de 100` : `Tu CV va en ${puntos} de 100`}</p>
                  <p className="mt-0.5 text-sm text-white/75">{nivel.t}.{siguiente ? <> {puntos >= 85 ? "Para subir más" : "Sigue con"}: <b className="text-white">{siguiente}</b>.</> : " Ya puedes descargarlo o enviarlo."}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button type="button" onClick={onEmpezar} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[15px] font-extrabold text-[#0a2f5c] shadow-[0_14px_30px_-16px_rgb(0_0_0/0.7)] transition-transform hover:-translate-y-0.5">Seguir con mi CV <ArrowRight className="size-4" /></button>
                <button type="button" onClick={onDescargar} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/30 px-5 text-[15px] font-bold text-white hover:bg-white/10"><Download className="size-4" /> Descargar PDF</button>
              </div>
            </div>
          ) : (
            <div className="entra mt-8 flex flex-wrap gap-3 [animation-delay:180ms]">
              <button type="button" onClick={onEmpezar} className="inline-flex h-[3.25rem] items-center gap-2 rounded-2xl bg-white px-7 text-base font-extrabold text-[#0a2f5c] shadow-[0_14px_30px_-16px_rgb(0_0_0/0.7)] transition-transform hover:-translate-y-0.5">Empezar mi CV <ArrowRight className="size-4" /></button>
              <button type="button" onClick={onImportar} className="inline-flex h-[3.25rem] items-center gap-2 rounded-2xl border border-white/30 px-6 text-base font-bold text-white hover:bg-white/10"><Upload className="size-4" /> Ya tengo un CV</button>
            </div>
          )}

          <ul className="entra mt-7 grid max-w-xl grid-cols-2 gap-x-5 gap-y-2.5 text-sm font-semibold text-white/80 [animation-delay:240ms] sm:flex sm:flex-wrap">
            {([[ShieldCheck, "Sin cuenta ni tarjeta"], [BadgeCheck, "Sin marca de agua"], [FileText, "PDF, Word e imagen"], [Lock, "Se guarda en tu equipo"]] as const).map(([I, t]) => (
              <li key={t} className="flex items-center gap-1.5"><I className="size-4 shrink-0 text-[#8ec1ff]" /> {t}</li>
            ))}
          </ul>
        </div>

        {/* Escena: el CV (el de la persona, o el de ejemplo cambiando de diseño) */}
        <div className="cve-escena relative mx-auto h-[20rem] w-full max-w-[33rem] [--s:0.4] sm:h-[27rem] sm:[--s:0.5] xl:h-[31rem] xl:[--s:0.56]" aria-hidden="true">
          <div className="cve-brillo" />
          <div className="cve-hojas">
            <div className="cve-atras"><Pagina cv={hoja} estilo={atras} /></div>
            <div className="cve-frente"><div className="cve-inclina"><Pagina key={`${frente.plantilla}-${frente.color}`} cv={hoja} estilo={frente} className="cve-cambia" /></div></div>
          </div>

          <div className="cve-chip -left-1 top-[30%] sm:-left-6 lg:-left-10">
            <Anillo puntos={conDatos ? puntos : 92} color={nivel.color} lado={38} grosor={5} />
            <span><span className="block text-[11px] font-semibold text-[#556275]">Revisor en vivo</span>{nivel.t}</span>
          </div>
          <div className="cve-chip right-0 top-[3%] [animation-delay:-2.2s] max-sm:hidden"><CheckCircle2 className="size-5 text-[#0f7a43]" /> Cabe en una página</div>
          <div className="cve-chip bottom-[13%] left-0 [animation-delay:-3.4s] max-sm:hidden lg:-left-4">
            <span className="flex -space-x-1">{COLORES.map((c) => <span key={c.id} className="size-4 rounded-full ring-2 ring-white" style={{ backgroundColor: c.c }} />)}</span>
            <span>{conDatos ? "6 diseños, 6 colores" : <>Diseño <span className="text-[#1557c4]">{nombreDiseno}</span></>}</span>
          </div>
          <div className="cve-chip bottom-[7%] right-0 bg-[#1d6ff2]! text-white! [animation-delay:-1.2s]"><Send className="size-4" /> Aplicar con mi CV</div>
          {!conDatos && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/70 ring-1 ring-white/15 max-sm:hidden">CV de ejemplo</span>}
        </div>
      </div>
    </header>
  );
}

/* ───────── Pasos ───────── */

type PasoDef = { id: string; t: string; I: ComponentType<{ className?: string }> };

export function PasosCV<T extends PasoDef>({ pasos, actual, hecho, onIr }: { pasos: readonly T[]; actual: T["id"]; hecho: Record<string, boolean>; onIr: (id: T["id"]) => void }) {
  return (
    <nav aria-label="Pasos del CV" className="cve-pasos -mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
      <ol className="flex min-w-max md:min-w-0">
        {pasos.map((p, j) => {
          const aqui = p.id === actual, listo = !!hecho[p.id] && p.id !== "diseno";
          return (
            <li key={p.id} className="relative flex min-w-[5.6rem] flex-1 justify-center">
              {j < pasos.length - 1 && <span aria-hidden="true" className={`absolute left-1/2 top-5 h-0.5 w-full ${listo ? "bg-success" : "bg-border"}`} />}
              <button type="button" onClick={() => onIr(p.id)} aria-current={aqui ? "step" : undefined} className="group relative flex flex-col items-center gap-1.5 rounded-xl px-1 pb-1 outline-none">
                <span className={`grid size-10 place-items-center rounded-full border-2 transition-all duration-300 group-focus-visible:ring-4 group-focus-visible:ring-[#1d6ff2]/30 ${aqui ? "cve-paso-aqui scale-110 border-transparent text-white" : listo ? "border-success bg-success text-white" : "border-border bg-surface text-muted-foreground group-hover:border-[#1d6ff2] group-hover:text-[#1557c4]"}`}>
                  {listo && !aqui ? <Check className="size-5" /> : <p.I className="size-[18px]" />}
                </span>
                <span className={`whitespace-nowrap text-[13px] ${aqui ? "font-extrabold text-foreground" : "font-semibold text-muted-foreground group-hover:text-foreground"}`}>{p.t}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ───────── Cambio rápido de diseño, pegado a la vista previa ───────── */

export function CambioRapido({ estilo, onEstilo }: { estilo: EstiloCV; onEstilo: (e: EstiloCV) => void }) {
  return (
    <div className="no-print mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex min-w-0 flex-wrap gap-1" role="group" aria-label="Diseño del CV">
        {PLANTILLAS.map((p) => <button key={p.id} type="button" onClick={() => onEstilo({ ...estilo, plantilla: p.id })} aria-pressed={estilo.plantilla === p.id} className={`h-7 shrink-0 rounded-full px-2.5 text-xs font-bold transition-colors ${estilo.plantilla === p.id ? "bg-white text-[#0a2f5c]" : "bg-white/10 text-white/85 hover:bg-white/20"}`}>{p.t}</button>)}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5 py-1" role="group" aria-label="Color del CV">
        {COLORES.map((c) => <button key={c.id} type="button" onClick={() => onEstilo({ ...estilo, color: c.id })} aria-pressed={estilo.color === c.id} aria-label={c.t} title={c.t} className={`size-6 rounded-full ring-2 transition-transform hover:scale-110 ${estilo.color === c.id ? "scale-110 ring-white" : "ring-white/30"}`} style={{ backgroundColor: c.c }} />)}
      </div>
    </div>
  );
}

/* ───────── Consejo del paso ───────── */

export function OjoReclutadora({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <aside className={`cve-ojo rounded-2xl p-4 ${className}`}>
      <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#1557c4]"><span className="grid size-6 place-items-center rounded-full bg-[#1d6ff2] text-white"><Eye className="size-3.5" /></span> Ojo de reclutadora</p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/85">{texto}</p>
    </aside>
  );
}

/* ───────── Herramientas: lo que sigue después del PDF ───────── */

export function MasQueUnPDF({ onComparar, onCarta, onEntrevista }: { onComparar: () => void; onCarta: () => void; onEntrevista: () => void }) {
  const tarjeta = "cve-tarjeta group flex h-full w-full flex-col rounded-3xl border border-border bg-surface p-5 text-left";
  const items = [
    { I: Target, cuando: "Antes de aplicar", t: "Compáralo con una vacante", d: "Elige una vacante real y mira qué requisitos ya aparecen en tu CV y cuáles te faltan.", cta: "Comparar", f: onComparar, tono: "#1d6ff2" },
    { I: FileText, cuando: "Al aplicar", t: "Carta de presentación", d: "La armamos con los datos de tu CV para cada vacante. La revisas, la ajustas y la descargas.", cta: "Hacer mi carta", f: onCarta, tono: "#0b6e7a" },
    { I: Mic, cuando: "Cuando te llamen", t: "Practica la entrevista", d: "Preguntas para tu puesto, qué buscan con cada una y un cronómetro para ensayar en voz alta.", cta: "Practicar", f: onEntrevista, tono: "#8a1c3c" },
  ] as const;
  const contenido = (I: ComponentType<{ className?: string }>, cuando: string, t: string, d: string, cta: string, tono: string) => (
    <>
      <span className="flex items-center justify-between gap-3">
        <span className="grid size-12 place-items-center rounded-2xl text-white shadow-[0_12px_22px_-14px_var(--tono)]" style={{ backgroundColor: tono, "--tono": tono } as CSSProperties}><I className="size-6" /></span>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-primary">{cuando}</span>
      </span>
      <span className="mt-4 block text-lg font-extrabold leading-snug">{t}</span>
      <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">{d}</span>
      <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-extrabold text-[#1557c4]">{cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
    </>
  );
  return (
    <section className="no-print mt-14" aria-labelledby="cve-mas">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-[#1557c4]"><Lightbulb className="size-4" /> Incluido, sin pagar nada</p>
          <h2 id="cve-mas" className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-[1.75rem]">Tu CV no termina en el PDF</h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">El CV abre la puerta. Estas herramientas te acompañan desde que eliges la vacante hasta la entrevista.</p>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((x) => <li key={x.t}><button type="button" onClick={x.f} className={tarjeta}>{contenido(x.I, x.cuando, x.t, x.d, x.cta, x.tono)}</button></li>)}
        <li><Link to="/insignias" className={tarjeta}>{contenido(Award, "Para destacar", "Insignias de habilidades", "Demuestra lo que sabes con una prueba corta y agrega la insignia verificada a tu CV.", "Ganar una insignia", "#0a2f5c")}</Link></li>
      </ul>
    </section>
  );
}

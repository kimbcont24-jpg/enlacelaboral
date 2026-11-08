import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Copy, Download, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { GuardarNube } from "@/components/site/GuardarNube";
import { cvVacio, progresoCV, textoCV, useCV, type CV, type Educacion, type Experiencia } from "@/lib/cv";

type Plantilla = "clasico" | "moderno" | "compacto";
const PLANTILLAS: { id: Plantilla; t: string }[] = [{ id: "clasico", t: "Clásico" }, { id: "moderno", t: "Moderno" }, { id: "compacto", t: "Compacto" }];

export const Route = createFileRoute("/cv")({
  head: () => ({
    meta: [
      { title: "Crea tu CV gratis en 5 minutos | Enlace Laboral" },
      { name: "description", content: "Haz tu currículum gratis, sin cuenta y sin marca de agua. Llena el formulario, mira cómo queda y descárgalo en PDF listo para enviar." },
      { property: "og:title", content: "Crea tu CV gratis en 5 minutos | Enlace Laboral" },
      { property: "og:description", content: "Currículum limpio de una página, pensado para lo que revisan los reclutadores en República Dominicana." },
    ],
  }),
  component: CrearCV,
});

const campo = "w-full min-w-0 rounded-xl border border-border bg-background px-3.5 py-2.5 text-base outline-none focus:border-primary";
const etiqueta = "mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground";

function CrearCV() {
  const { cv, setCV, cargado } = useCV();
  const [vista, setVista] = useState<"editar" | "ver">("editar");
  const [plantilla, setPlantilla] = useState<Plantilla>("clasico");
  useEffect(() => { try { const g = localStorage.getItem("enlace-cv-plantilla") as Plantilla | null; if (g && PLANTILLAS.some((x) => x.id === g)) setPlantilla(g); } catch { /* sin almacenamiento */ } }, []);
  const elegirPlantilla = (x: Plantilla) => { setPlantilla(x); try { localStorage.setItem("enlace-cv-plantilla", x); } catch { /* sin almacenamiento */ } };
  const progreso = progresoCV(cv);
  const set = (k: keyof CV) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCV({ ...cv, [k]: e.target.value });
  const setExp = (i: number, k: keyof Experiencia, v: string) => setCV({ ...cv, experiencia: cv.experiencia.map((x, j) => (j === i ? { ...x, [k]: v } : x)) });
  const setEdu = (i: number, k: keyof Educacion, v: string) => setCV({ ...cv, educacion: cv.educacion.map((x, j) => (j === i ? { ...x, [k]: v } : x)) });

  const descargar = () => {
    if (!cv.nombre.trim()) return void toast.error("Escribe al menos tu nombre.");
    window.print();
  };
  const copiar = async () => {
    try { await navigator.clipboard.writeText(textoCV(cv)); toast.success("CV copiado como texto. Pégalo donde lo necesites."); } catch { toast.error("No se pudo copiar."); }
  };
  const limpiar = () => { if (confirm("¿Borrar todo lo escrito en el CV?")) setCV(cvVacio); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="no-print"><Header /></div>
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">
        <div className="no-print">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Crea tu CV gratis</h1>
          <Link to="/impulso" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cta/40 bg-cta/5 p-4 text-sm hover:border-cta">
            <span><b>¿Prefieres que te lo hagamos?</b> CV profesional, carta y LinkedIn en menos de 24 horas, desde RD$500.</span>
            <span className="font-bold text-cta">Ver Impulso Laboral →</span>
          </Link>
          <p className="mt-2 max-w-2xl text-muted-foreground">Una página, limpia, con lo que un reclutador revisa en 30 segundos. Sin cuenta, sin marca de agua. Se guarda en tu teléfono y lo puedes editar cuando quieras.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={descargar} className="btn-aplicar inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base"><Download className="size-4" /> Descargar en PDF</button>
            <button type="button" onClick={() => void copiar()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 font-semibold hover:border-primary"><Copy className="size-4" /> Copiar como texto</button>
            <div className="ml-auto flex rounded-xl border border-border bg-surface p-1 lg:hidden">
              <button type="button" onClick={() => setVista("editar")} className={`rounded-lg px-4 py-2 text-sm font-bold ${vista === "editar" ? "bg-primary text-primary-foreground" : ""}`}>Editar</button>
              <button type="button" onClick={() => setVista("ver")} className={`rounded-lg px-4 py-2 text-sm font-bold ${vista === "ver" ? "bg-primary text-primary-foreground" : ""}`}>Ver CV</button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Al descargar se abre la ventana de impresión: elige «Guardar como PDF».</p>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-12">
          <form className={`no-print space-y-6 lg:col-span-5 ${vista === "ver" ? "hidden lg:block" : ""}`} onSubmit={(e) => e.preventDefault()}>
            <section className="rounded-2xl bg-[#0a2f5c] p-5 text-white" aria-label="Qué tan listo está tu CV">
              <div className="flex items-center justify-between gap-3">
                <p className="font-extrabold">{progreso.pct === 100 ? "¡Tu CV está completo!" : "Tu CV está al"} {progreso.pct < 100 && <span className="font-display text-2xl tabular-nums">{progreso.pct}%</span>}</p>
                {progreso.pct === 100 && <CheckCircle2 className="size-6 text-[#8ec1ff]" />}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#8ec1ff] transition-[width] duration-500" style={{ width: `${Math.max(4, progreso.pct)}%` }} /></div>
              {progreso.faltan.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-white/80">
                  {progreso.faltan.slice(0, 3).map((f) => <li key={f.t}><b className="text-white">{f.t}:</b> {f.tip}</li>)}
                </ul>
              )}
            </section>

            <GuardarNube />
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-extrabold">Tus datos</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className={etiqueta}>Nombre completo</span><input value={cv.nombre} onChange={set("nombre")} className={campo} placeholder="Ej. María Pérez" autoComplete="name" /></label>
                <label className="sm:col-span-2"><span className={etiqueta}>Puesto que buscas</span><input value={cv.puesto} onChange={set("puesto")} className={campo} placeholder="Ej. Asistente administrativa" /></label>
                <label><span className={etiqueta}>WhatsApp</span><input value={cv.telefono} onChange={set("telefono")} className={campo} placeholder="809-000-0000" inputMode="tel" autoComplete="tel" /></label>
                <label><span className={etiqueta}>Correo</span><input value={cv.correo} onChange={set("correo")} className={campo} placeholder="tu@correo.com" inputMode="email" autoComplete="email" /></label>
                <label className="sm:col-span-2"><span className={etiqueta}>Ciudad o provincia</span><input value={cv.ciudad} onChange={set("ciudad")} className={campo} placeholder="Ej. Santiago" /></label>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-extrabold">Sobre ti</h2>
              <p className="mt-1 text-sm text-muted-foreground">Dos o tres líneas: qué sabes hacer y qué buscas. Sin «soy una persona responsable»; mejor algo concreto.</p>
              <textarea value={cv.resumen} onChange={set("resumen")} rows={3} className={`${campo} mt-3`} placeholder="Ej. Tres años atendiendo clientes en tienda y por WhatsApp. Manejo caja, inventario y Excel básico. Busco un puesto de atención al cliente en Santiago." />
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-extrabold">Experiencia</h2>
              <p className="mt-1 text-sm text-muted-foreground">La más reciente primero. Si es tu primer empleo, pon pasantías, trabajos informales o voluntariado.</p>
              <div className="mt-3 space-y-4">
                {cv.experiencia.map((e, i) => (
                  <div key={i} className="rounded-xl border border-border p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input value={e.puesto} onChange={(ev) => setExp(i, "puesto", ev.target.value)} className={campo} placeholder="Puesto" />
                      <input value={e.empresa} onChange={(ev) => setExp(i, "empresa", ev.target.value)} className={campo} placeholder="Empresa" />
                      <input value={e.desde} onChange={(ev) => setExp(i, "desde", ev.target.value)} className={campo} placeholder="Desde (ej. 2022)" />
                      <input value={e.hasta} onChange={(ev) => setExp(i, "hasta", ev.target.value)} className={campo} placeholder="Hasta (vacío = actual)" />
                    </div>
                    <textarea value={e.logros} onChange={(ev) => setExp(i, "logros", ev.target.value)} rows={2} className={`${campo} mt-2`} placeholder="Qué hacías y qué lograste. Ej. Atendía 60 clientes al día y bajé las quejas a la mitad." />
                    {cv.experiencia.length > 1 && <button type="button" onClick={() => setCV({ ...cv, experiencia: cv.experiencia.filter((_, j) => j !== i) })} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /> Quitar</button>}
                  </div>
                ))}
                <button type="button" onClick={() => setCV({ ...cv, experiencia: [...cv.experiencia, { puesto: "", empresa: "", desde: "", hasta: "", logros: "" }] })} className="inline-flex items-center gap-1 text-sm font-bold text-primary"><Plus className="size-4" /> Agregar otra experiencia</button>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-extrabold">Formación</h2>
              <div className="mt-3 space-y-3">
                {cv.educacion.map((e, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_90px]">
                    <input value={e.titulo} onChange={(ev) => setEdu(i, "titulo", ev.target.value)} className={campo} placeholder="Título o curso (ej. Bachiller, Técnico en…)" />
                    <input value={e.centro} onChange={(ev) => setEdu(i, "centro", ev.target.value)} className={campo} placeholder="Centro (ej. INFOTEP, UASD)" />
                    <input value={e.anio} onChange={(ev) => setEdu(i, "anio", ev.target.value)} className={campo} placeholder="Año" />
                  </div>
                ))}
                <div className="flex gap-4">
                  <button type="button" onClick={() => setCV({ ...cv, educacion: [...cv.educacion, { titulo: "", centro: "", anio: "" }] })} className="inline-flex items-center gap-1 text-sm font-bold text-primary"><Plus className="size-4" /> Agregar</button>
                  {cv.educacion.length > 1 && <button type="button" onClick={() => setCV({ ...cv, educacion: cv.educacion.slice(0, -1) })} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /> Quitar la última</button>}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-extrabold">Habilidades e idiomas</h2>
              <div className="mt-3 grid gap-3">
                <label><span className={etiqueta}>Habilidades (separadas por coma)</span><input value={cv.habilidades} onChange={set("habilidades")} className={campo} placeholder="Ej. Excel, caja, atención al cliente, licencia de conducir" /></label>
                <label><span className={etiqueta}>Idiomas</span><input value={cv.idiomas} onChange={set("idiomas")} className={campo} placeholder="Ej. Español nativo, inglés intermedio" /></label>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>Se guarda en este dispositivo{cargado && cv.nombre ? " ✓" : ""}. Para no perderlo, guárdalo con tu correo.</p>
              <button type="button" onClick={limpiar} className="font-semibold hover:text-destructive">Empezar de cero</button>
            </div>
          </form>

          <div id="cv-vista" className={`lg:col-span-7 ${vista === "editar" ? "hidden lg:block" : ""}`}>
            <div className="lg:sticky lg:top-24">
              <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-muted-foreground">Así queda</p>
                <div className="inline-flex rounded-xl border border-border bg-surface p-1" role="group" aria-label="Diseño del CV">
                  {PLANTILLAS.map((x) => <button key={x.id} type="button" aria-pressed={plantilla === x.id} onClick={() => elegirPlantilla(x.id)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${plantilla === x.id ? "bg-[#0a2f5c] text-white" : "text-muted-foreground hover:text-foreground"}`}>{x.t}</button>)}
                </div>
              </div>
              {plantilla === "moderno" ? <HojaModerna cv={cv} /> : <Hoja cv={cv} compacto={plantilla === "compacto"} />}
              <p className="no-print mt-4 text-sm text-muted-foreground">¿Ya lo tienes? <Link to="/vacantes" className="font-semibold text-primary underline">Busca vacantes</Link> y, al aplicar, marca «Incluir mi CV» para que la empresa lo reciba.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="no-print"><Footer /></div>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body, .bg-background { background: #fff !important; }
          .no-print { display: none !important; }
          #cv-vista { display: block !important; }
          #cv-vista > div { position: static !important; }
          nav, footer { display: none !important; }
          #cv-hoja { box-shadow: none !important; border: 0 !important; border-radius: 0 !important; width: auto !important; max-width: none !important; padding: 0 !important; }
          .min-h-screen { min-height: 0 !important; }
        }
      `}</style>
    </div>
  );
}

/** La hoja del CV: una página, tipografía clara, navy para los títulos. Es lo que se imprime. */
function Hoja({ cv, compacto = false }: { cv: CV; compacto?: boolean }) {
  const nombre = cv.nombre.trim() || "Tu nombre";
  const contacto = [cv.telefono, cv.correo, cv.ciudad].filter((x) => x.trim()).join("  ·  ");
  const habilidades = cv.habilidades.split(",").map((h) => h.trim()).filter(Boolean);
  const exp = cv.experiencia.filter((e) => e.puesto.trim() || e.empresa.trim());
  const edu = cv.educacion.filter((e) => e.titulo.trim());
  const vacio = !cv.nombre && !cv.resumen && !exp.length;
  return (
    <article id="cv-hoja" className={`mx-auto w-full max-w-[210mm] rounded-2xl border border-border bg-white text-[#14213a] shadow-[var(--shadow-lift)] ${compacto ? "p-7 text-[14px] sm:p-8 [&_section]:mt-4" : "p-8 sm:p-10"}`} style={{ fontFamily: "Figtree, system-ui, sans-serif" }}>
      <header className={compacto ? "flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b-2 border-[#1d6ff2] pb-3" : "border-b-4 border-[#0a2f5c] pb-4"}>
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-[#0a2f5c]">{nombre}</h2>
        {cv.puesto && <p className="mt-1 text-lg font-semibold text-[#1d6ff2]">{cv.puesto}</p>}
        {contacto && <p className="mt-2 text-sm text-[#5b6678]">{contacto}</p>}
      </header>
      {vacio && <p className="mt-6 text-sm text-[#5b6678]">Llena el formulario y tu CV aparece aquí. Cuando esté listo, descárgalo en PDF.</p>}
      {cv.resumen && <p className="mt-5 text-[15px] leading-relaxed">{cv.resumen}</p>}
      {exp.length > 0 && (
        <section className="mt-6">
          <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a2f5c]">Experiencia</h3>
          <div className="mt-3 space-y-4">
            {exp.map((e, i) => (
              <div key={i}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="font-bold">{e.puesto}{e.empresa && <span className="font-semibold text-[#5b6678]"> · {e.empresa}</span>}</p>
                  {(e.desde || e.hasta) && <p className="text-sm text-[#5b6678]">{[e.desde, e.hasta || "actualidad"].filter(Boolean).join(" – ")}</p>}
                </div>
                {e.logros && <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed">{e.logros}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
      {edu.length > 0 && (
        <section className="mt-6">
          <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a2f5c]">Formación</h3>
          <ul className="mt-3 space-y-1.5">
            {edu.map((e, i) => <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4"><span><span className="font-bold">{e.titulo}</span>{e.centro && <span className="text-[#5b6678]"> · {e.centro}</span>}</span>{e.anio && <span className="text-sm text-[#5b6678]">{e.anio}</span>}</li>)}
          </ul>
        </section>
      )}
      {(habilidades.length > 0 || cv.idiomas) && (
        <section className="mt-6 grid gap-5 sm:grid-cols-2">
          {habilidades.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a2f5c]">Habilidades</h3>
              <ul className="mt-3 flex flex-wrap gap-1.5">{habilidades.map((h) => <li key={h} className="rounded-md bg-[#e8eef6] px-2.5 py-1 text-sm font-semibold text-[#0a2f5c]">{h}</li>)}</ul>
            </div>
          )}
          {cv.idiomas && (
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a2f5c]">Idiomas</h3>
              <p className="mt-3 text-[15px]">{cv.idiomas}</p>
            </div>
          )}
        </section>
      )}
    </article>
  );
}

/** Diseño con columna lateral azul: contacto, habilidades e idiomas a la izquierda. */
function HojaModerna({ cv }: { cv: CV }) {
  const nombre = cv.nombre.trim() || "Tu nombre";
  const habilidades = cv.habilidades.split(",").map((h) => h.trim()).filter(Boolean);
  const exp = cv.experiencia.filter((e) => e.puesto.trim() || e.empresa.trim());
  const edu = cv.educacion.filter((e) => e.titulo.trim());
  const titulo = "text-[11px] font-extrabold uppercase tracking-[0.18em]";
  return (
    <article id="cv-hoja" className="mx-auto grid w-full max-w-[210mm] grid-cols-[34%_1fr] overflow-hidden rounded-2xl border border-border bg-white text-[#14213a] shadow-[var(--shadow-lift)] print:grid" style={{ fontFamily: "Figtree, system-ui, sans-serif", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
      <aside className="space-y-6 bg-[#0a2f5c] p-6 text-white sm:p-7">
        <div className="grid size-16 place-items-center rounded-full bg-[#1d6ff2] text-2xl font-extrabold">{nombre.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase()}</div>
        {(cv.telefono || cv.correo || cv.ciudad) && (
          <div><h3 className={`${titulo} text-[#8ec1ff]`}>Contacto</h3><ul className="mt-2 space-y-1.5 text-[13px] [overflow-wrap:anywhere]">{[cv.telefono, cv.correo, cv.ciudad].filter((x) => x.trim()).map((x) => <li key={x}>{x}</li>)}</ul></div>
        )}
        {habilidades.length > 0 && <div><h3 className={`${titulo} text-[#8ec1ff]`}>Habilidades</h3><ul className="mt-2 space-y-1.5 text-[13px]">{habilidades.map((h) => <li key={h} className="flex gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#8ec1ff]" />{h}</li>)}</ul></div>}
        {cv.idiomas && <div><h3 className={`${titulo} text-[#8ec1ff]`}>Idiomas</h3><p className="mt-2 text-[13px]">{cv.idiomas}</p></div>}
      </aside>
      <div className="p-6 sm:p-8">
        <h2 className="text-[1.75rem] font-extrabold leading-tight tracking-tight text-[#0a2f5c]">{nombre}</h2>
        {cv.puesto && <p className="mt-1 text-base font-semibold text-[#1d6ff2]">{cv.puesto}</p>}
        {cv.resumen && <p className="mt-4 text-[14px] leading-relaxed">{cv.resumen}</p>}
        {!cv.nombre && !cv.resumen && !exp.length && <p className="mt-6 text-sm text-[#5b6678]">Llena el formulario y tu CV aparece aquí.</p>}
        {exp.length > 0 && (
          <section className="mt-6"><h3 className={`${titulo} text-[#0a2f5c]`}>Experiencia</h3>
            <div className="mt-3 space-y-4 border-l-2 border-[#e8eef6] pl-4">
              {exp.map((e, i) => (
                <div key={i} className="relative"><span className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full bg-[#1d6ff2]" />
                  <p className="font-bold">{e.puesto}{e.empresa && <span className="font-semibold text-[#5b6678]"> · {e.empresa}</span>}</p>
                  {(e.desde || e.hasta) && <p className="text-xs text-[#5b6678]">{[e.desde, e.hasta || "actualidad"].filter(Boolean).join(" – ")}</p>}
                  {e.logros && <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed">{e.logros}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
        {edu.length > 0 && (
          <section className="mt-6"><h3 className={`${titulo} text-[#0a2f5c]`}>Formación</h3>
            <ul className="mt-3 space-y-1.5 text-[14px]">{edu.map((e, i) => <li key={i}><span className="font-bold">{e.titulo}</span>{e.centro && <span className="text-[#5b6678]"> · {e.centro}</span>}{e.anio && <span className="text-[#5b6678]"> · {e.anio}</span>}</li>)}</ul>
          </section>
        )}
      </div>
    </article>
  );
}

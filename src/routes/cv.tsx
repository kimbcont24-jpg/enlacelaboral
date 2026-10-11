import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Download, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { cvVacio, textoCV, useCV, type CV, type Educacion, type Experiencia } from "@/lib/cv";

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
              <p>Se guarda solo en este dispositivo. {cargado && cv.nombre && "Guardado ✓"}</p>
              <button type="button" onClick={limpiar} className="font-semibold hover:text-destructive">Empezar de cero</button>
            </div>
          </form>

          <div id="cv-vista" className={`lg:col-span-7 ${vista === "editar" ? "hidden lg:block" : ""}`}>
            <div className="lg:sticky lg:top-24">
              <p className="no-print mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Así queda</p>
              <Hoja cv={cv} />
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
function Hoja({ cv }: { cv: CV }) {
  const nombre = cv.nombre.trim() || "Tu nombre";
  const contacto = [cv.telefono, cv.correo, cv.ciudad].filter((x) => x.trim()).join("  ·  ");
  const habilidades = cv.habilidades.split(",").map((h) => h.trim()).filter(Boolean);
  const exp = cv.experiencia.filter((e) => e.puesto.trim() || e.empresa.trim());
  const edu = cv.educacion.filter((e) => e.titulo.trim());
  const vacio = !cv.nombre && !cv.resumen && !exp.length;
  return (
    <article id="cv-hoja" className="mx-auto w-full max-w-[210mm] rounded-2xl border border-border bg-white p-8 text-[#14213a] shadow-[var(--shadow-lift)] sm:p-10" style={{ fontFamily: "Figtree, system-ui, sans-serif" }}>
      <header className="border-b-4 border-[#002d62] pb-4">
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-[#002d62]">{nombre}</h2>
        {cv.puesto && <p className="mt-1 text-lg font-semibold text-[#ce1126]">{cv.puesto}</p>}
        {contacto && <p className="mt-2 text-sm text-[#5b6678]">{contacto}</p>}
      </header>
      {vacio && <p className="mt-6 text-sm text-[#5b6678]">Llena el formulario y tu CV aparece aquí. Cuando esté listo, descárgalo en PDF.</p>}
      {cv.resumen && <p className="mt-5 text-[15px] leading-relaxed">{cv.resumen}</p>}
      {exp.length > 0 && (
        <section className="mt-6">
          <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#002d62]">Experiencia</h3>
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
          <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#002d62]">Formación</h3>
          <ul className="mt-3 space-y-1.5">
            {edu.map((e, i) => <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4"><span><span className="font-bold">{e.titulo}</span>{e.centro && <span className="text-[#5b6678]"> · {e.centro}</span>}</span>{e.anio && <span className="text-sm text-[#5b6678]">{e.anio}</span>}</li>)}
          </ul>
        </section>
      )}
      {(habilidades.length > 0 || cv.idiomas) && (
        <section className="mt-6 grid gap-5 sm:grid-cols-2">
          {habilidades.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#002d62]">Habilidades</h3>
              <ul className="mt-3 flex flex-wrap gap-1.5">{habilidades.map((h) => <li key={h} className="rounded-md bg-[#e8eef6] px-2.5 py-1 text-sm font-semibold text-[#002d62]">{h}</li>)}</ul>
            </div>
          )}
          {cv.idiomas && (
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#002d62]">Idiomas</h3>
              <p className="mt-3 text-[15px]">{cv.idiomas}</p>
            </div>
          )}
        </section>
      )}
    </article>
  );
}

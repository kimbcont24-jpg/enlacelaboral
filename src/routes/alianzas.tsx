import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, CalendarCheck, CheckCircle2, GraduationCap, HandHeart, Loader2, School, Users } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { provincias } from "@/lib/data";

export const Route = createFileRoute("/alianzas")({
  head: () => ({ meta: [{ title: "Alianzas para el empleo: universidades, INFOTEP y fundaciones | Enlace Laboral" }, { name: "description", content: "Universidades, centros de formación, fundaciones y ONG: conecten a sus estudiantes, egresados y participantes con empresas que contratan. Sin costo." }] }),
  component: Alianzas,
});

const TIPOS = [
  { id: "universidad", t: "Universidad o instituto", I: GraduationCap },
  { id: "infotep", t: "Centro de formación (INFOTEP u operador)", I: School },
  { id: "fundacion", t: "Fundación", I: HandHeart },
  { id: "ong", t: "ONG o asociación", I: Users },
  { id: "gobierno", t: "Institución pública", I: Building2 },
  { id: "otra", t: "Otra", I: Building2 },
] as const;

const INTERESES = [
  "Publicar pasantías para estudiantes",
  "Que nuestros egresados encuentren empleo",
  "Inserción laboral de personas con discapacidad",
  "Primer empleo para jóvenes",
  "Hacer una jornada o feria de empleo",
  "Talleres de CV y entrevista",
];

const campo = "h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function Alianzas() {
  const [f, setF] = useState({ tipo: "universidad", institucion: "", contacto_nombre: "", contacto_cargo: "", correo: "", telefono: "", provincia: "", mensaje: "" });
  const [interes, setInteres] = useState<string[]>([]);
  const [estado, setEstado] = useState<"listo" | "enviando" | "hecho">("listo");
  const pon = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.institucion.trim().length < 3 || f.contacto_nombre.trim().length < 2) return void toast.error("Escribe el nombre de la institución y de la persona de contacto.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.correo.trim())) return void toast.error("Escribe un correo válido.");
    setEstado("enviando");
    const t = (v: string) => v.trim() || null;
    const { error } = await supabase.from("alianzas").insert({ tipo: f.tipo, institucion: f.institucion.trim(), contacto_nombre: f.contacto_nombre.trim(), correo: f.correo.trim(), contacto_cargo: t(f.contacto_cargo), telefono: t(f.telefono), provincia: t(f.provincia), mensaje: t(f.mensaje), interes });
    if (error) { setEstado("listo"); return void toast.error("No se pudo enviar. Intenta otra vez."); }
    setEstado("hecho");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="hero-dark px-4 pb-14 pt-10 sm:px-6 md:pb-20 md:pt-14">
        <div className="relative mx-auto max-w-6xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90"><HandHeart className="size-4 text-[#7ee2a8]" aria-hidden="true" /> Alianzas para el empleo</p>
          <h1 className="mt-4 max-w-3xl text-balance font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight md:text-[2.6rem]">Juntos llevamos a más gente de la formación al trabajo</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">Universidades, centros de formación, fundaciones y ONG: conecten a sus estudiantes, egresados y participantes con empresas que están contratando. Sin costo.</p>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_26rem]">
        <section aria-labelledby="t-que" className="space-y-8">
          <div>
            <h2 id="t-que" className="font-display text-2xl font-extrabold">Lo que hacemos juntos</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                { I: GraduationCap, t: "Pasantías y primer empleo", d: "Sus estudiantes ven vacantes de pasantía y primer empleo, y aplican con su CV en un minuto." },
                { I: Users, t: "Banco de talento", d: "Sus egresados, si lo desean, pueden aparecer para que las empresas los inviten a aplicar." },
                { I: CalendarCheck, t: "Jornadas de empleo", d: "Organizamos jornadas en su campus o centro con empresas que contratan, con inscripción en línea." },
                { I: HandHeart, t: "Inclusión real", d: "Vacantes de empresas comprometidas con personas con discapacidad, jóvenes y personas de cualquier edad." },
              ].map(({ I, t, d }) => <li key={t} className="rounded-2xl border border-border bg-surface p-5"><I className="size-6 text-primary" aria-hidden="true" /><p className="mt-2 font-extrabold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></li>)}
            </ul>
          </div>
          <div className="rounded-3xl bg-secondary/60 p-6">
            <h2 className="font-display text-xl font-extrabold">Cómo funciona</h2>
            <ol className="mt-4 space-y-3">
              {["Nos escribes con este formulario.", "Te contactamos para conocer a tu gente y lo que necesitan.", "Compartimos un enlace propio para tus estudiantes o participantes y empezamos con las vacantes y jornadas."].map((t, i) => <li key={t} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#0a2f5c] text-sm font-bold text-white">{i + 1}</span><span className="pt-0.5">{t}</span></li>)}
            </ol>
          </div>
          <p className="text-sm text-muted-foreground">¿Eres persona buscando empleo? Mira <Link to="/empleo-para-todos" className="font-bold text-primary underline-offset-4 hover:underline">Empleo para todas las personas</Link>.</p>
        </section>

        <aside className="h-fit rounded-3xl border border-border bg-surface p-6 lg:sticky lg:top-20">
          {estado === "hecho" ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden="true" />
              <p className="mt-3 text-xl font-extrabold">¡Gracias! Recibimos tu solicitud</p>
              <p className="mt-1 text-sm text-muted-foreground">Te escribiremos al correo que pusiste para conversar los próximos pasos.</p>
            </div>
          ) : (
            <form onSubmit={(e) => void enviar(e)} className="space-y-3">
              <p className="text-lg font-extrabold">Quiero ser aliado</p>
              <fieldset>
                <legend className="mb-1.5 text-sm font-bold">Tipo de institución</legend>
                <select value={f.tipo} onChange={(e) => pon("tipo", e.target.value)} aria-label="Tipo de institución" className={campo}>{TIPOS.map((t) => <option key={t.id} value={t.id}>{t.t}</option>)}</select>
              </fieldset>
              <input value={f.institucion} onChange={(e) => pon("institucion", e.target.value)} required maxLength={160} placeholder="Nombre de la institución" aria-label="Nombre de la institución" className={campo} />
              <div className="grid grid-cols-2 gap-2">
                <input value={f.contacto_nombre} onChange={(e) => pon("contacto_nombre", e.target.value)} required maxLength={120} placeholder="Tu nombre" aria-label="Tu nombre" className={campo} />
                <input value={f.contacto_cargo} onChange={(e) => pon("contacto_cargo", e.target.value)} maxLength={120} placeholder="Tu cargo" aria-label="Tu cargo" className={campo} />
              </div>
              <input type="email" value={f.correo} onChange={(e) => pon("correo", e.target.value)} required maxLength={160} placeholder="Correo institucional" aria-label="Correo institucional" className={campo} />
              <div className="grid grid-cols-2 gap-2">
                <input value={f.telefono} onChange={(e) => pon("telefono", e.target.value)} inputMode="tel" maxLength={40} placeholder="Teléfono (opcional)" aria-label="Teléfono" className={campo} />
                <select value={f.provincia} onChange={(e) => pon("provincia", e.target.value)} aria-label="Provincia" className={campo}><option value="">Provincia</option>{provincias.filter((p) => p !== "Toda República Dominicana").map((p) => <option key={p}>{p}</option>)}</select>
              </div>
              <fieldset>
                <legend className="mb-1.5 text-sm font-bold">¿Qué les interesa?</legend>
                <div className="space-y-1.5">{INTERESES.map((x) => <label key={x} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={interes.includes(x)} onChange={() => setInteres((a) => (a.includes(x) ? a.filter((y) => y !== x) : [...a, x]))} className="mt-0.5 size-4" />{x}</label>)}</div>
              </fieldset>
              <textarea value={f.mensaje} onChange={(e) => pon("mensaje", e.target.value)} rows={3} maxLength={1500} placeholder="Cuéntanos de tu gente (opcional)" aria-label="Mensaje" className={`${campo} h-auto py-3`} />
              <button type="submit" disabled={estado === "enviando"} className="btn-aplicar flex h-12 w-full items-center justify-center gap-2 rounded-xl">{estado === "enviando" && <Loader2 className="size-4 animate-spin" />} Enviar</button>
            </form>
          )}
        </aside>
      </div></main>
      <Footer />
    </div>
  );
}

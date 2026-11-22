import { createFileRoute, Link } from "@tanstack/react-router";
import { Consentimiento } from "@/components/site/Consentimiento";
import { useMemo, useState } from "react";
import { ArrowRight, BarChart3, Brain, Building2, CalendarCheck, Check, CheckCircle2, ChevronDown, FileText, GraduationCap, HandHeart, HeartHandshake, Landmark, Loader2, Mail, Megaphone, School, ShieldCheck, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { nivelDe } from "@/lib/claridad";
import { provincias } from "@/lib/data";
import { CORREO_INFO, useVacantes } from "@/lib/vacantes";

export const Route = createFileRoute("/alianzas")({
  head: () => ({ meta: [{ title: "Alianzas para el empleo: universidades, INFOTEP y fundaciones | Enlace Laboral" }, { name: "description", content: "Tu institución forma el talento; nosotros lo conectamos con empresas que contratan. Pasantías, primer empleo, jornadas de empleo e inclusión en toda República Dominicana. Gratis para instituciones." }], links: [{ rel: "canonical", href: "https://enlacelaboralrd.com/alianzas" }] }),
  component: Alianzas,
});

type Tipo = "universidad" | "infotep" | "fundacion" | "ong" | "gobierno" | "otra";

const INTERESES = [
  "Pasantías para estudiantes",
  "Empleo para egresados",
  "Primer empleo para jóvenes",
  "Inclusión de personas con discapacidad",
  "Inclusión de personas neurodivergentes (autismo, TDAH)",
  "Jornada o feria de empleo",
  "Talleres de CV y entrevista",
];

/** Lo que la institución quiere lograr: cada opción marca su interés en el formulario. */
const METAS: { I: typeof GraduationCap; t: string; d: string; interes: string[] }[] = [
  { I: GraduationCap, t: "Pasantías y primer empleo", d: "Para estudiantes y egresados que buscan su primera oportunidad.", interes: ["Pasantías para estudiantes", "Primer empleo para jóvenes"] },
  { I: CalendarCheck, t: "Una jornada de empleo", d: "Empresas entrevistando en tu local, con inscripción en línea.", interes: ["Jornada o feria de empleo"] },
  { I: Brain, t: "Empleo inclusivo", d: "Personas con discapacidad y neurodivergentes (autismo, TDAH, dislexia).", interes: ["Inclusión de personas con discapacidad", "Inclusión de personas neurodivergentes (autismo, TDAH)"] },
  { I: FileText, t: "Preparar a tu gente", d: "Talleres de CV y entrevista, presenciales o virtuales.", interes: ["Talleres de CV y entrevista"] },
];

const PERFILES: { id: Tipo; t: string; corto: string; I: typeof GraduationCap; frase: string; recibe: string[] }[] = [
  { id: "universidad", t: "Universidades e institutos", corto: "Universidades", I: GraduationCap, frase: "Que tus egresados salgan con trabajo, no solo con título.", recibe: ["Pasantías y vacantes de primer empleo para tus estudiantes, con salario visible cuando la empresa lo publica", "Jornadas de empleo en tu campus con inscripción en línea y lista de asistentes", "Tus egresados pueden activar su perfil en el banco de talento para que las empresas los inviten", "Talleres de CV y entrevista para tus estudiantes"] },
  { id: "infotep", t: "Centros de formación técnica", corto: "INFOTEP y centros", I: School, frase: "Cada técnico que gradúas merece una empresa que lo espere.", recibe: ["Empresas que buscan técnicos en las áreas que enseñas", "Jornadas de empleo al cierre de cada grupo, con recordatorios por WhatsApp", "CV listo en minutos para tus participantes, gratis y sin marca de agua", "Vacantes con horario compatible con estudios"] },
  { id: "fundacion", t: "Fundaciones y ONG", corto: "Fundaciones y ONG", I: HandHeart, frase: "Tu gente tiene talento. Juntos le abrimos la puerta.", recibe: ["Vacantes de empresas que se comprometen con la inclusión: discapacidad, neurodivergencia y primer empleo", "Preparación para tus participantes: CV, entrevista y cómo pedir ajustes razonables", "Avisos libres de discriminación: aquí no se publica nada que pida edad, sexo o foto", "Jornadas de empleo pensadas para tu comunidad"] },
  { id: "gobierno", t: "Instituciones públicas", corto: "Instituciones públicas", I: Landmark, frase: "Más empleo formal, en todas las provincias.", recibe: ["Una plataforma gratuita para difundir programas de empleo y formación", "Ferias y jornadas con inscripción y control de asistencia", "Vacantes de las 32 provincias, con filtro por provincia y por inclusión", "Información de empleo clara: salario, requisitos y cómo aplicar"] },
];

const ACCIONES = [
  { I: CalendarCheck, t: "Jornada de empleo", d: "Empresas entrevistando en tu local. La gente se inscribe con su CV y el día del evento marcamos quién asistió." },
  { I: Megaphone, t: "Campaña de vacantes", d: "Seleccionamos vacantes para el perfil de tu gente y te damos un enlace propio para compartir." },
  { I: FileText, t: "Taller de CV y entrevista", d: "Tu gente sale con un CV profesional hecho en minutos y sabiendo qué responder." },
  { I: Brain, t: "Camino inclusivo", d: "Vacantes con compromiso de inclusión y guía para pedir ajustes razonables sin miedo." },
  { I: Users, t: "Banco de talento", d: "Tus egresados activan su perfil y las empresas los invitan. Nadie aparece sin decidirlo." },
  { I: BarChart3, t: "Informe de impacto", d: "Cuántos aplicaron, se inscribieron y asistieron. Listo para tus informes de responsabilidad social." },
];

const PASOS = [
  { t: "Nos escribes", d: "Llenas el formulario en 2 minutos. Sin papeleo ni contratos." },
  { t: "Conversamos", d: "Te contactamos para conocer a tu gente y lo que necesita." },
  { t: "Lanzamos juntos", d: "Primera jornada, taller o campaña de vacantes para tu comunidad." },
  { t: "Medimos el impacto", d: "Te enviamos los resultados para seguir mejorando." },
];

const PREGUNTAS = [
  ["¿Cuánto cuesta ser aliado?", "Nada. Ser aliado de Enlace Laboral es gratis para universidades, centros de formación, fundaciones e instituciones públicas."],
  ["¿Qué tiene que hacer mi institución?", "Compartir las vacantes y jornadas con tu gente y decirnos qué necesita. Nosotros ponemos la plataforma, el contacto con las empresas y el seguimiento."],
  ["¿Qué pasa con los datos de mis estudiantes o participantes?", "Cada persona decide qué comparte. Nadie aparece en el banco de talento sin activarlo, y las empresas no ven teléfonos ni correos hasta que la persona acepta."],
  ["¿Podemos hacer una jornada de empleo en nuestro local?", "Sí. Creamos la jornada en la plataforma, la gente se inscribe con su CV, le recordamos por WhatsApp y el día del evento marcamos quién asistió."],
  ["¿Trabajan con personas neurodivergentes?", "Sí, es una prioridad. Las empresas pueden marcar sus vacantes como inclusivas para personas neurodivergentes y tenemos un camino con consejos para autismo, TDAH y dislexia."],
];

const campo = "h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base outline-none transition-colors focus:border-[#1d6ff2] focus:ring-2 focus:ring-[#1d6ff2]/20";
const opcion = "group flex min-h-[4.5rem] w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const opcionIcono = "grid size-10 shrink-0 place-items-center rounded-xl";

const irAlFormulario = () => document.getElementById("unirme")?.scrollIntoView({ behavior: "smooth", block: "start" });

function Alianzas() {
  const { jobs } = useVacantes();
  const datos = useMemo(() => ({
    vacantes: jobs.length,
    provincias: new Set(jobs.map((j) => j.provincia)).size,
    empresas: new Set(jobs.map((j) => j.empresa).filter((e) => e && !/no indicada/i.test(e))).size,
    inicio: jobs.filter((j) => nivelDe(j) === "Primer empleo" || j.tipo === "Pasantía").length,
  }), [jobs]);
  const [perfil, setPerfil] = useState<Tipo>("universidad");
  const [interes, setInteres] = useState<string[]>([]);
  const p = PERFILES.find((x) => x.id === perfil)!;

  const metaActiva = (m: (typeof METAS)[number]) => m.interes.every((x) => interes.includes(x));
  const elegirMeta = (m: (typeof METAS)[number]) => {
    const activa = metaActiva(m);
    setInteres((a) => (activa ? a.filter((x) => !m.interes.includes(x)) : [...new Set([...a, ...m.interes])]));
    if (!activa && window.matchMedia("(max-width: 1023px)").matches) irAlFormulario();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* 1. Portada: el mensaje y la acción, juntos */}
      <header className="hero-dark px-4 pb-14 pt-8 sm:px-6 md:pb-20 md:pt-12">
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 bottom-0 -z-10 size-[28rem] rounded-full bg-[#0f7a43]/25 blur-[120px]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          <div className="lg:self-start">
            <p className="entra inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90"><HeartHandshake className="size-4 text-[#7ee2a8]" aria-hidden="true" /> Alianzas para el empleo · gratis para instituciones</p>
            <h1 className="entra mt-4 text-balance font-display text-[2.35rem] font-extrabold leading-[1.02] tracking-[-0.035em] [animation-delay:60ms] md:text-[3.4rem]">
              Del aula al{" "}
              <span className="relative whitespace-nowrap">empleo<svg aria-hidden="true" viewBox="0 0 300 20" className="absolute -bottom-2 left-0 w-full" preserveAspectRatio="none"><path d="M4 14 C 80 4, 200 4, 296 12" stroke="#ffd84d" strokeWidth="6" fill="none" strokeLinecap="round" className="alz-trazo" /></svg></span>, juntos.
            </h1>
            <p className="entra mt-5 max-w-xl text-lg leading-relaxed text-white/85 [animation-delay:120ms]">Tu institución forma el talento. Las empresas lo están buscando. <strong className="text-white">Con una alianza, Enlace Laboral conecta a tu gente con empleo real</strong>: pasantías, primer empleo, jornadas e inclusión, en todo el país.</p>

            <h2 className="mt-7 text-sm font-extrabold uppercase tracking-[.1em] text-[#8ec1ff]">¿Qué quieres lograr con tu gente?</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2.5">
              {METAS.map((m) => {
                const on = metaActiva(m);
                return (
                  <li key={m.t}>
                    <button type="button" aria-pressed={on} onClick={() => elegirMeta(m)} className={`${opcion} ${on ? "border-[#7ee2a8] bg-[#7ee2a8]/15" : "border-white/15 bg-white/[.07] hover:border-white/40 hover:bg-white/[.13]"}`}>
                      <span className={`${opcionIcono} ${on ? "bg-[#7ee2a8] text-[#06331c]" : "bg-white/12 text-[#8ec1ff]"}`}>{on ? <Check className="size-5" aria-hidden="true" /> : <m.I className="size-5" aria-hidden="true" />}</span>
                      <span className="min-w-0"><span className="block font-extrabold leading-tight">{m.t}</span><span className="mt-0.5 hidden text-sm text-white/75 sm:block">{m.d}</span></span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-sm text-white/70">Elige una o varias: las marcamos en tu solicitud.</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-white/90">
              {["Sin costo ni contratos", "Los datos de tu gente, protegidos", "Una persona real te acompaña"].map((x) => <span key={x} className="flex items-center gap-2"><Check className="size-4 text-[#7ee2a8]" aria-hidden="true" /> {x}</span>)}
            </div>
          </div>

          <div id="unirme" className="scroll-mt-20">
            <Formulario interes={interes} setInteres={setInteres} />
          </div>
        </div>
      </header>

      <main>
        {/* 2. Qué es una alianza, en una sola idea */}
        <section aria-labelledby="t-que" className="border-b border-border bg-surface px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow">Qué es una alianza</p>
            <h2 id="t-que" className="mt-1 max-w-3xl text-balance font-display text-2xl font-extrabold tracking-tight md:text-[2.25rem]">Una suma sencilla: cada quien pone lo que mejor sabe hacer</h2>
            <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <div className="rounded-3xl border border-border bg-background p-7">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#1d6ff2]/10 text-[#1557c4]"><School className="size-6" aria-hidden="true" /></span>
                <h3 className="mt-5 text-xl font-extrabold">Tu institución pone</h3>
                <ul className="mt-3 space-y-2 text-muted-foreground">{["Tu gente: estudiantes, egresados o participantes", "Difundir vacantes y jornadas", "Decirnos qué necesitan"].map((x) => <li key={x} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-[#1557c4]" aria-hidden="true" />{x}</li>)}</ul>
              </div>
              <span aria-hidden="true" className="grid place-items-center font-display text-4xl font-extrabold text-[#1d6ff2]">+</span>
              <div className="rounded-3xl border border-border bg-background p-7">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#0a2f5c] text-white"><Building2 className="size-6" aria-hidden="true" /></span>
                <h3 className="mt-5 text-xl font-extrabold">Enlace Laboral pone</h3>
                <ul className="mt-3 space-y-2 text-muted-foreground">{["Empresas que están contratando", "Plataforma, CV gratis y jornadas", "Seguimiento y resultados"].map((x) => <li key={x} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-[#0a2f5c]" aria-hidden="true" />{x}</li>)}</ul>
              </div>
              <span aria-hidden="true" className="grid place-items-center font-display text-4xl font-extrabold text-[#0f7a43]">=</span>
              <div className="relative overflow-hidden rounded-3xl bg-[#ffd84d] p-7 text-[#3d2f00]">
                <Sparkles aria-hidden="true" className="absolute -right-4 -top-4 size-28 opacity-15" />
                <span className="grid size-12 place-items-center rounded-2xl bg-[#3d2f00] text-[#ffd84d]"><HeartHandshake className="size-6" aria-hidden="true" /></span>
                <h3 className="mt-5 text-xl font-extrabold">Tu gente gana</h3>
                <p className="mt-3 font-display text-2xl font-extrabold leading-tight">Empleo real, con salario claro y sin discriminación.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. El puente ya funciona: diagrama + números en vivo */}
        <section aria-labelledby="t-puente" className="relative overflow-hidden bg-[#06172e] px-4 py-16 text-white sm:px-6 md:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
          <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-0 size-[26rem] rounded-full bg-[#1d6ff2]/30 blur-[120px]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
            <Diagrama />
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[.1em] text-[#8ec1ff]">El puente ya está funcionando</p>
              <h2 id="t-puente" className="mt-2 text-balance font-display text-2xl font-extrabold tracking-tight md:text-[2.25rem]">Tu gente llega a un lugar donde las empresas ya están publicando</h2>
              <dl className="mt-8 grid grid-cols-2 gap-3">
                {[[datos.vacantes, "vacantes abiertas hoy"], [datos.empresas, "empresas publicando"], [datos.provincias, "provincias con empleo"], [datos.inicio, "de primer empleo o pasantía"]].map(([n, t]) => (
                  <div key={t as string} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
                    <dd className="font-display text-4xl font-extrabold tabular-nums sm:text-5xl">{(n as number) > 0 ? (n as number).toLocaleString("es-DO") : "—"}</dd>
                    <dt className="mt-1 text-sm text-white/70">{t as string}</dt>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-white/50">Datos en vivo de Enlace Laboral.</p>
            </div>
          </div>
        </section>

        {/* 4. Por tipo de institución */}
        <section aria-labelledby="t-para" className="px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow">Para cada institución</p>
            <h2 id="t-para" className="mt-1 max-w-3xl text-balance font-display text-2xl font-extrabold tracking-tight md:text-[2.25rem]">Lo que tu gente gana desde el primer día</h2>
            <div role="tablist" aria-label="Tipo de institución" className="mt-8 flex flex-wrap gap-2">
              {PERFILES.map(({ id, corto, I }) => (
                <button key={id} type="button" role="tab" aria-selected={perfil === id} onClick={() => setPerfil(id)} className={`inline-flex h-12 items-center gap-2 rounded-full border px-5 font-bold transition-colors ${perfil === id ? "border-[#0a2f5c] bg-[#0a2f5c] text-white" : "border-border bg-surface hover:border-[#1d6ff2]"}`}><I className="size-5" aria-hidden="true" />{corto}</button>
              ))}
            </div>
            <div role="tabpanel" key={perfil} className="entra mt-6 grid overflow-hidden rounded-[2rem] border border-border bg-surface lg:grid-cols-[1fr_1.15fr]">
              <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0a2f5c] to-[#1557c4] p-8 text-white sm:p-10">
                <p.I aria-hidden="true" className="absolute -bottom-8 -right-8 size-48 text-white/[0.07]" />
                <p.I className="size-12 text-[#ffd84d]" aria-hidden="true" />
                <div className="relative mt-10">
                  <p className="text-sm font-bold text-white/70">{p.t}</p>
                  <p className="mt-2 text-balance font-display text-3xl font-extrabold leading-tight sm:text-4xl">«{p.frase}»</p>
                </div>
              </div>
              <ul className="grid content-center gap-4 p-8 sm:p-10">
                {p.recibe.map((r) => <li key={r} className="flex gap-3 text-[17px] leading-relaxed"><span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-[#0f7a43] text-white"><Check className="size-4" aria-hidden="true" /></span>{r}</li>)}
                <li><button type="button" onClick={irAlFormulario} className="mt-2 inline-flex items-center gap-2 font-bold text-[#1557c4] underline-offset-4 hover:underline">Quiero esto para mi institución <ArrowRight className="size-4" aria-hidden="true" /></button></li>
              </ul>
            </div>
          </div>
        </section>

        {/* 5. Qué hacemos juntos */}
        <section aria-labelledby="t-acciones" className="bg-[#f0f5fc] px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow">Qué hacemos juntos</p>
            <h2 id="t-acciones" className="mt-1 max-w-3xl text-balance font-display text-2xl font-extrabold tracking-tight md:text-[2.25rem]">Acciones concretas, no solo un logo en una lista</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ACCIONES.map(({ I, t, d }, i) => (
                <div key={t} className="group relative overflow-hidden rounded-3xl bg-surface p-7 shadow-[0_1px_2px_rgb(20_33_58/0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgb(10_47_92/0.35)]">
                  <span aria-hidden="true" className="absolute right-5 top-4 font-display text-5xl font-extrabold text-[#0a2f5c]/[0.06]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#1d6ff2]/10 text-[#1557c4] transition group-hover:bg-[#1d6ff2] group-hover:text-white"><I className="size-6" aria-hidden="true" /></span>
                  <h3 className="mt-5 text-xl font-extrabold">{t}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Cómo funciona */}
        <section id="como" aria-labelledby="t-como" className="scroll-mt-20 px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow">Cómo funciona</p>
            <h2 id="t-como" className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-[2.25rem]">De la solicitud al primer empleo</h2>
            <ol className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-6">
              <span aria-hidden="true" className="absolute left-6 top-6 hidden h-0.5 w-[calc(100%-3rem)] bg-gradient-to-r from-[#1d6ff2] via-[#7ee2a8] to-[#ffd84d] md:block" />
              {PASOS.map((x, i) => (
                <li key={x.t} className="relative">
                  <span className="relative grid size-12 place-items-center rounded-full bg-[#0a2f5c] font-display text-lg font-extrabold text-white ring-8 ring-background">{i + 1}</span>
                  <h3 className="mt-5 text-xl font-extrabold">{x.t}</h3>
                  <p className="mt-1.5 text-muted-foreground">{x.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 7. Compromisos: inclusión y ODS */}
        <section aria-labelledby="t-compromiso" className="px-4 pb-16 sm:px-6 md:pb-24">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.15fr_1fr]">
            <div className="rounded-[2rem] border border-border bg-surface p-7 sm:p-9">
              <p className="eyebrow">Nuestro compromiso</p>
              <h2 id="t-compromiso" className="mt-1 text-balance font-display text-2xl font-extrabold tracking-tight">Tu gente no va a encontrar avisos que la excluyan</h2>
              <ul className="mt-6 grid gap-3">
                {[
                  [ShieldCheck, "Cero discriminación", "Ningún aviso puede pedir edad, sexo, foto, estado civil o «buena presencia». El sistema lo detecta y no lo deja publicar."],
                  [Brain, "Neurodiversidad, una prioridad", "Vacantes marcadas como inclusivas para personas neurodivergentes y un camino con consejos para autismo, TDAH y dislexia."],
                  [Sparkles, "Transparencia", "Salario visible cuando la empresa lo publica, empresa identificada y fecha de vencimiento."],
                ].map(([I, t, d]) => {
                  const Icono = I as typeof ShieldCheck;
                  return <li key={t as string} className="flex gap-3.5 rounded-2xl bg-background p-4"><Icono className="mt-0.5 size-5 shrink-0 text-[#0f7a43]" aria-hidden="true" /><span><strong className="block">{t as string}</strong><span className="text-sm text-muted-foreground">{d as string}</span></span></li>;
                })}
              </ul>
              <Link to="/empleo-para-todos" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#1557c4] underline-offset-4 hover:underline">Ver Empleo para todas las personas <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </div>
            <div className="flex flex-col justify-center rounded-[2rem] bg-[#06172e] p-7 text-white sm:p-9">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[.1em] text-[#8ec1ff]">Suma a tus informes</p>
                <h3 className="mt-2 text-balance font-display text-2xl font-extrabold leading-tight">Una alianza que aporta a los Objetivos de Desarrollo Sostenible</h3>
              </div>
              <ul className="mt-6 grid gap-2.5">
                {[["4", "Educación de calidad", "#c5192d"], ["8", "Trabajo decente y crecimiento económico", "#a21942"], ["10", "Reducción de las desigualdades", "#dd1367"]].map(([n, t, c]) => (
                  <li key={n} className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-3.5"><span className="grid size-12 shrink-0 place-items-center rounded-xl font-display text-xl font-extrabold" style={{ backgroundColor: c }}>{n}</span><span className="font-bold">ODS {n}: {t}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 8. Preguntas */}
        <section aria-labelledby="t-preguntas" className="border-t border-border bg-surface px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="eyebrow">Preguntas frecuentes</p>
              <h2 id="t-preguntas" className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-[2.25rem]">Lo que suelen preguntarnos</h2>
              <p className="mt-3 text-muted-foreground">¿Otra duda? Escríbenos a <a href={`mailto:${CORREO_INFO}`} className="font-bold text-primary underline-offset-4 hover:underline">{CORREO_INFO}</a></p>
            </div>
            <div className="space-y-3">
              {PREGUNTAS.map(([q, a]) => (
                <details key={q} className="group rounded-2xl border border-border bg-background px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">{q}<ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
                  <p className="mt-2 text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Cierre */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 rounded-3xl bg-[#0a2f5c] p-7 text-white sm:flex-row sm:items-center sm:p-9">
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight">¿Hacemos la primera acción juntos?</h2>
              <p className="mt-1 text-white/80">Cuéntanos de tu institución en 2 minutos. ¿Buscas empleo? Mira <Link to="/empleo-para-todos" className="font-bold text-white underline underline-offset-4">Empleo para todas las personas</Link>.</p>
            </div>
            <button type="button" onClick={irAlFormulario} className="btn-aplicar inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl px-6 text-base">Quiero ser aliado <ArrowRight className="size-5" aria-hidden="true" /></button>
          </div>
        </section>
      </main>
      <Footer />
      <style>{`
        @keyframes alz-flujo { to { stroke-dashoffset: -28; } }
        .alz-flujo { animation: alz-flujo 1.4s linear infinite; }
        @keyframes alz-pulso { 0%,100% { box-shadow: 0 0 60px -14px #1d6ff2; } 50% { box-shadow: 0 0 90px -6px #1d6ff2; } }
        .alz-pulso { animation: alz-pulso 3s ease-in-out infinite; }
        @keyframes alz-trazo { from { stroke-dashoffset: 320; } to { stroke-dashoffset: 0; } }
        .alz-trazo { stroke-dasharray: 320; animation: alz-trazo 1.2s .4s cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .alz-flujo, .alz-pulso, .alz-trazo { animation: none; stroke-dasharray: none; } }
      `}</style>
    </div>
  );
}

/** Ilustración del enlace: instituciones → Enlace Laboral → empresas y empleo. */
function Diagrama() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[28rem]">
      <svg viewBox="0 0 400 400" className="absolute inset-0 size-full">
        <defs><linearGradient id="alz-g" x1="0" x2="1"><stop offset="0" stopColor="#8ec1ff" /><stop offset="1" stopColor="#7ee2a8" /></linearGradient></defs>
        {[90, 200, 310].map((y, i) => <path key={y} d={`M120 ${y} C 170 ${y}, 160 200, 200 200`} stroke="url(#alz-g)" strokeWidth="3" fill="none" strokeDasharray="6 8" className="alz-flujo" style={{ animationDelay: `${i * 0.25}s` }} />)}
        {[120, 280].map((y, i) => <path key={y} d={`M200 200 C 240 200, 250 ${y}, 280 ${y}`} stroke="url(#alz-g)" strokeWidth="3" fill="none" strokeDasharray="6 8" className="alz-flujo" style={{ animationDelay: `${0.75 + i * 0.25}s` }} />)}
      </svg>
      {[{ y: "22.5%", I: GraduationCap, t: "Universidades" }, { y: "50%", I: School, t: "Centros técnicos" }, { y: "77.5%", I: HandHeart, t: "Fundaciones" }].map(({ y, I, t }) => (
        <div key={t} className="absolute left-[20%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5" style={{ top: y }}>
          <span className="grid size-16 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur"><I className="size-7 text-[#8ec1ff]" /></span>
          <span className="text-xs font-bold text-white/80">{t}</span>
        </div>
      ))}
      <div className="alz-pulso absolute left-1/2 top-1/2 grid size-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2rem] bg-gradient-to-br from-[#1d6ff2] to-[#0a2f5c] ring-4 ring-white/10">
        <span className="text-center font-display text-sm font-extrabold leading-tight">Enlace<br />Laboral</span>
      </div>
      {[{ y: "30%", I: Building2, t: "Empresas" }, { y: "70%", I: Sparkles, t: "Empleo" }].map(({ y, I, t }) => (
        <div key={t} className="absolute left-[80%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5" style={{ top: y }}>
          <span className="grid size-16 place-items-center rounded-2xl bg-[#ffd84d] text-[#3d2f00]"><I className="size-7" /></span>
          <span className="text-xs font-bold text-white/80">{t}</span>
        </div>
      ))}
    </div>
  );
}

function Formulario({ interes, setInteres }: { interes: string[]; setInteres: React.Dispatch<React.SetStateAction<string[]>> }) {
  const [f, setF] = useState({ tipo: "universidad" as Tipo, institucion: "", contacto_nombre: "", contacto_cargo: "", correo: "", telefono: "", provincia: "", mensaje: "" });
  const [estado, setEstado] = useState<"listo" | "enviando" | "hecho" | "correo">("listo");
  const pon = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  /** Si la base no responde, la solicitud sale por correo con todo ya escrito. */
  const mailto = () => {
    const cuerpo = [`Institución: ${f.institucion}`, `Tipo: ${f.tipo}`, `Contacto: ${f.contacto_nombre}${f.contacto_cargo ? ` (${f.contacto_cargo})` : ""}`, `Correo: ${f.correo}`, `Teléfono: ${f.telefono}`, `Provincia: ${f.provincia}`, `Nos interesa: ${interes.join(", ")}`, "", f.mensaje].join("\n");
    return `mailto:${CORREO_INFO}?subject=${encodeURIComponent(`Solicitud de alianza: ${f.institucion}`)}&body=${encodeURIComponent(cuerpo)}`;
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.institucion.trim().length < 3 || f.contacto_nombre.trim().length < 2) return void toast.error("Escribe el nombre de la institución y de la persona de contacto.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.correo.trim())) return void toast.error("Escribe un correo válido.");
    setEstado("enviando");
    const t = (v: string) => v.trim() || null;
    try {
      const { error } = await supabase.from("alianzas").insert({ tipo: f.tipo, institucion: f.institucion.trim(), contacto_nombre: f.contacto_nombre.trim(), correo: f.correo.trim(), contacto_cargo: t(f.contacto_cargo), telefono: t(f.telefono), provincia: t(f.provincia), mensaje: t(f.mensaje), interes });
      if (error) throw error;
      setEstado("hecho");
    } catch {
      setEstado("correo");
    }
  };

  if (estado === "hecho" || estado === "correo") {
    return (
      <div className="rounded-3xl bg-surface p-8 text-center text-foreground shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)] sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#0f7a43]/12 text-[#0f7a43]">{estado === "hecho" ? <CheckCircle2 className="size-9" aria-hidden="true" /> : <Mail className="size-8" aria-hidden="true" />}</span>
        {estado === "hecho" ? (
          <>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight">¡Bienvenida la alianza!</h2>
            <p className="mt-2 text-muted-foreground">Recibimos tu solicitud. Te escribiremos a <strong className="text-foreground">{f.correo.trim()}</strong> para conversar los próximos pasos.</p>
          </>
        ) : (
          <>
            <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight">Falta un toque para enviarla</h2>
            <p className="mt-2 text-muted-foreground">No pudimos guardarla en este momento. Envíala por correo: ya va escrita con tus datos.</p>
            <a href={mailto()} className="btn-aplicar mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl px-6">Enviar por correo <ArrowRight className="size-5" aria-hidden="true" /></a>
          </>
        )}
        <Link to="/vacantes" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#1557c4] underline-offset-4 hover:underline">Mientras tanto, mira las vacantes abiertas <ArrowRight className="size-4" aria-hidden="true" /></Link>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => void enviar(e)} className="entra space-y-4 rounded-3xl bg-surface p-6 text-foreground shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)] [animation-delay:200ms] sm:p-8">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Quiero ser aliado</h2>
        <p className="mt-1 text-sm text-muted-foreground">2 minutos. Te contactamos para planificar la primera acción.</p>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">Somos</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {([["universidad", "Universidad", GraduationCap], ["infotep", "Centro técnico", School], ["fundacion", "Fundación", HandHeart], ["ong", "ONG", Users], ["gobierno", "Institución pública", Landmark], ["otra", "Otra", Building2]] as const).map(([id, t, I]) => (
            <button key={id} type="button" aria-pressed={f.tipo === id} onClick={() => pon("tipo", id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition-colors ${f.tipo === id ? "border-[#1d6ff2] bg-[#1d6ff2]/10 text-[#1557c4]" : "border-border hover:border-[#1d6ff2]/50"}`}><I className="size-4 shrink-0" aria-hidden="true" />{t}</button>
          ))}
        </div>
      </fieldset>
      <input value={f.institucion} onChange={(e) => pon("institucion", e.target.value)} required maxLength={160} placeholder="Nombre de la institución" aria-label="Nombre de la institución" className={campo} />
      <div className="grid grid-cols-2 gap-2">
        <input value={f.contacto_nombre} onChange={(e) => pon("contacto_nombre", e.target.value)} required maxLength={120} placeholder="Tu nombre" aria-label="Tu nombre" className={campo} />
        <input value={f.contacto_cargo} onChange={(e) => pon("contacto_cargo", e.target.value)} maxLength={120} placeholder="Tu cargo" aria-label="Tu cargo" className={campo} />
      </div>
      <input type="email" value={f.correo} onChange={(e) => pon("correo", e.target.value)} required maxLength={160} placeholder="Correo institucional" aria-label="Correo institucional" className={campo} />
      <div className="grid grid-cols-2 gap-2">
        <input value={f.telefono} onChange={(e) => pon("telefono", e.target.value)} inputMode="tel" maxLength={40} placeholder="Teléfono" aria-label="Teléfono" className={campo} />
        <select value={f.provincia} onChange={(e) => pon("provincia", e.target.value)} aria-label="Provincia" className={campo}><option value="">Provincia</option>{provincias.filter((x) => x !== "Toda República Dominicana").map((x) => <option key={x}>{x}</option>)}</select>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">Nos interesa</legend>
        <div className="flex flex-wrap gap-2">
          {INTERESES.map((x) => { const on = interes.includes(x); return <button key={x} type="button" aria-pressed={on} onClick={() => setInteres((a) => (on ? a.filter((y) => y !== x) : [...a, x]))} className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${on ? "border-[#0f7a43] bg-[#0f7a43] text-white" : "border-border hover:border-[#0f7a43]"}`}>{on && <Check className="-ml-0.5 mr-1 inline size-3.5" aria-hidden="true" />}{x}</button>; })}
        </div>
      </fieldset>
      <textarea value={f.mensaje} onChange={(e) => pon("mensaje", e.target.value)} rows={3} maxLength={1500} placeholder="Cuéntanos de tu gente (opcional)" aria-label="Mensaje" className={`${campo} h-auto py-3`} />
      <Consentimiento para="aliado" />
      <button type="submit" disabled={estado === "enviando"} className="btn-aplicar flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg">{estado === "enviando" ? <Loader2 className="size-5 animate-spin" /> : <HeartHandshake className="size-5" aria-hidden="true" />} Enviar solicitud</button>
      <p className="text-center text-xs text-muted-foreground">Sin costo. Te respondemos por correo.</p>
    </form>
  );
}

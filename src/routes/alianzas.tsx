import { createFileRoute, Link } from "@tanstack/react-router";
import { Consentimiento } from "@/components/site/Consentimiento";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, CalendarCheck, Check, CheckCircle2, ChevronDown, GraduationCap, HandHeart, HeartHandshake, Landmark, Loader2, Megaphone, Presentation, School, ShieldCheck, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { nivelDe } from "@/lib/claridad";
import { provincias } from "@/lib/data";
import { useVacantes } from "@/lib/vacantes";

export const Route = createFileRoute("/alianzas")({
  head: () => ({ meta: [{ title: "Alianzas para el empleo: universidades, INFOTEP y fundaciones | Enlace Laboral" }, { name: "description", content: "Del aula al empleo. Universidades, centros de formación, fundaciones e instituciones: conecten a su gente con empresas que contratan en toda República Dominicana. Sin costo." }] }),
  component: Alianzas,
});

type Tipo = "universidad" | "infotep" | "fundacion" | "ong" | "gobierno" | "otra";

const PERFILES: { id: Tipo; t: string; corto: string; I: typeof GraduationCap; frase: string; recibe: string[] }[] = [
  { id: "universidad", t: "Universidades e institutos", corto: "Universidades", I: GraduationCap, frase: "Que tus egresados salgan con trabajo, no solo con título.", recibe: ["Pasantías y vacantes de primer empleo para tus estudiantes, todas con salario visible cuando la empresa lo publica", "Jornadas de empleo en tu campus con inscripción en línea y lista de asistentes", "Tus egresados pueden aparecer en el banco de talento para que las empresas los inviten", "Talleres de CV y entrevista para tus estudiantes, presenciales o virtuales"] },
  { id: "infotep", t: "Centros de formación técnica", corto: "INFOTEP y centros", I: School, frase: "Cada técnico que gradúas merece una empresa que lo espere.", recibe: ["Empresas que buscan técnicos justo en las áreas que enseñas", "Jornadas de empleo al cierre de cada grupo, con inscripción y recordatorios por WhatsApp", "CV listo en minutos para tus participantes, gratis y sin marca de agua", "Vacantes con horario compatible con estudios para quienes siguen formándose"] },
  { id: "fundacion", t: "Fundaciones y ONG", corto: "Fundaciones", I: HandHeart, frase: "Tu gente tiene talento. Nosotros les abrimos la puerta.", recibe: ["Vacantes de empresas que se comprometen con la inclusión: discapacidad, primer empleo, cualquier edad", "Acompañamiento para preparar a tus participantes: CV, entrevista y qué llevar", "Avisos libres de discriminación: aquí no se publica nada que pida edad, sexo o foto", "Jornadas de empleo pensadas para tu comunidad"] },
  { id: "gobierno", t: "Instituciones públicas", corto: "Instituciones", I: Landmark, frase: "Más empleo formal, en todas las provincias.", recibe: ["Una plataforma gratuita para difundir programas de empleo y formación", "Jornadas y ferias de empleo con inscripción y control de asistencia", "Vacantes de las 32 provincias, con filtro por provincia y por inclusión", "Información de empleo clara: salario, requisitos y cómo aplicar"] },
];

const PASOS = [
  { t: "Nos escribes", d: "Llenas el formulario en 2 minutos. Sin papeleo." },
  { t: "Conversamos", d: "Te llamamos para conocer a tu gente y lo que necesitan." },
  { t: "Lanzamos juntos", d: "Primera jornada, taller o campaña de vacantes para tu comunidad." },
  { t: "Medimos el impacto", d: "Te contamos cuántos aplicaron, se inscribieron y asistieron." },
];

const PREGUNTAS = [
  ["¿Cuánto cuesta ser aliado?", "Nada. Ser aliado de Enlace Laboral es gratis para universidades, centros de formación, fundaciones e instituciones."],
  ["¿Qué tiene que hacer mi institución?", "Compartir las vacantes y jornadas con tu gente y avisarnos qué necesitan. Nosotros ponemos la plataforma y el trabajo con las empresas."],
  ["¿Qué pasa con los datos de mis estudiantes o participantes?", "Cada persona decide qué comparte. Nadie aparece en el banco de talento sin activarlo y las empresas no ven teléfonos ni correos hasta que la persona acepta."],
  ["¿Podemos hacer una jornada de empleo en nuestro local?", "Sí. Creamos la jornada en la plataforma, la gente se inscribe con su CV y el día del evento marcamos quién asistió."],
];

const INTERESES = [
  "Pasantías para estudiantes",
  "Empleo para egresados",
  "Inclusión de personas con discapacidad",
  "Primer empleo para jóvenes",
  "Jornada o feria de empleo",
  "Talleres de CV y entrevista",
];

const campo = "h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base outline-none transition-colors focus:border-[#1d6ff2] focus:ring-2 focus:ring-[#1d6ff2]/20";

function Alianzas() {
  const { jobs } = useVacantes();
  const datos = useMemo(() => ({
    vacantes: jobs.length,
    provincias: new Set(jobs.map((j) => j.provincia)).size,
    empresas: new Set(jobs.map((j) => j.empresa).filter((e) => e && !/no indicada/i.test(e))).size,
    inicio: jobs.filter((j) => nivelDe(j) === "Primer empleo" || j.tipo === "Pasantía").length,
  }), [jobs]);
  const [perfil, setPerfil] = useState<Tipo>("universidad");
  const p = PERFILES.find((x) => x.id === perfil)!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── Portada: el enlace entre formación y empleo ── */}
      <header className="relative overflow-hidden bg-[#06172e] px-4 pb-20 pt-12 text-white sm:px-6 md:pb-28 md:pt-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-10 size-[30rem] rounded-full bg-[#1d6ff2]/30 blur-[120px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-0 size-[26rem] rounded-full bg-[#0f7a43]/30 blur-[120px]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm font-semibold"><HeartHandshake className="size-4 text-[#7ee2a8]" aria-hidden="true" /> Alianzas para el empleo · sin costo</p>
            <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-6xl lg:text-[4.4rem]">
              Del aula<br />al <span className="relative whitespace-nowrap">empleo<svg aria-hidden="true" viewBox="0 0 300 20" className="absolute -bottom-2 left-0 w-full" preserveAspectRatio="none"><path d="M4 14 C 80 4, 200 4, 296 12" stroke="#ffd84d" strokeWidth="6" fill="none" strokeLinecap="round" className="alz-trazo" /></svg></span>.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">Tu institución forma talento. Las empresas lo están buscando. <strong className="text-white">Enlace Laboral es el puente</strong>: vacantes reales, jornadas de empleo e inclusión, en todo el país.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#unirme" className="btn-aplicar inline-flex h-14 items-center gap-2 rounded-2xl px-7 text-lg">Quiero ser aliado <ArrowRight className="size-5" aria-hidden="true" /></a>
              <a href="#como" className="inline-flex h-14 items-center rounded-2xl border border-white/25 px-6 font-bold hover:bg-white/10">Cómo funciona</a>
            </div>
          </div>

          {/* Diagrama del enlace */}
          <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[30rem]">
            <svg viewBox="0 0 400 400" className="absolute inset-0 size-full">
              <defs><linearGradient id="alz-g" x1="0" x2="1"><stop offset="0" stopColor="#8ec1ff" /><stop offset="1" stopColor="#7ee2a8" /></linearGradient></defs>
              {[[80, 90], [80, 200], [80, 310]].map(([x, y], i) => <path key={i} d={`M${x + 40} ${y} C 170 ${y}, 160 200, 200 200`} stroke="url(#alz-g)" strokeWidth="3" fill="none" strokeDasharray="6 8" className="alz-flujo" style={{ animationDelay: `${i * 0.25}s` }} />)}
              {[[320, 120], [320, 280]].map(([x, y], i) => <path key={i} d={`M200 200 C 240 200, 250 ${y}, ${x - 40} ${y}`} stroke="url(#alz-g)" strokeWidth="3" fill="none" strokeDasharray="6 8" className="alz-flujo" style={{ animationDelay: `${0.75 + i * 0.25}s` }} />)}
            </svg>
            {[{ y: "22.5%", I: GraduationCap, t: "Universidades" }, { y: "50%", I: School, t: "Centros técnicos" }, { y: "77.5%", I: HandHeart, t: "Fundaciones" }].map(({ y, I, t }) => (
              <div key={t} className="absolute left-[20%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5" style={{ top: y }}>
                <span className="grid size-16 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur"><I className="size-7 text-[#8ec1ff]" /></span>
                <span className="text-xs font-bold text-white/80">{t}</span>
              </div>
            ))}
            <div className="absolute left-1/2 top-1/2 grid size-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2rem] bg-gradient-to-br from-[#1d6ff2] to-[#0a2f5c] shadow-[0_0_80px_-10px_#1d6ff2] ring-4 ring-white/10 alz-pulso">
              <span className="text-center font-display text-sm font-extrabold leading-tight">Enlace<br />Laboral</span>
            </div>
            {[{ y: "30%", I: Building2, t: "Empresas" }, { y: "70%", I: Sparkles, t: "Empleo" }].map(({ y, I, t }) => (
              <div key={t} className="absolute left-[80%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5" style={{ top: y }}>
                <span className="grid size-16 place-items-center rounded-2xl bg-[#ffd84d] text-[#3d2f00]"><I className="size-7" /></span>
                <span className="text-xs font-bold text-white/80">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Números en vivo */}
        <div className="relative mx-auto mt-14 grid max-w-6xl grid-cols-2 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur md:grid-cols-4">
          {[[datos.vacantes, "vacantes abiertas hoy"], [datos.empresas, "empresas publicando"], [datos.provincias, "provincias con empleo"], [datos.inicio, "de primer empleo o pasantía"]].map(([n, t], i) => (
            <div key={t as string} className={`p-5 sm:p-6 ${i % 2 === 0 ? "border-r border-white/10" : ""} ${i < 2 ? "border-b border-white/10 md:border-b-0" : ""} ${i === 1 ? "md:border-r" : ""}`}>
              <p className="font-display text-4xl font-extrabold tabular-nums sm:text-5xl">{(n as number) > 0 ? (n as number).toLocaleString("es-DO") : "—"}</p>
              <p className="mt-1 text-sm text-white/70">{t as string}</p>
            </div>
          ))}
        </div>
        <p className="relative mx-auto mt-3 max-w-6xl text-xs text-white/50">Datos en vivo de Enlace Laboral.</p>
      </header>

      <main>
        {/* ── Por tipo de aliado ── */}
        <section aria-labelledby="t-para" className="px-4 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 id="t-para" className="max-w-3xl text-balance font-display text-3xl font-extrabold tracking-tight md:text-5xl">Lo que tu gente gana desde el primer día</h2>
            <div role="tablist" aria-label="Tipo de institución" className="mt-10 flex flex-wrap gap-2">
              {PERFILES.map(({ id, corto, I }) => (
                <button key={id} type="button" role="tab" aria-selected={perfil === id} onClick={() => setPerfil(id)} className={`inline-flex h-12 items-center gap-2 rounded-full border px-5 font-bold transition-colors ${perfil === id ? "border-[#0a2f5c] bg-[#0a2f5c] text-white" : "border-border bg-surface hover:border-[#1d6ff2]"}`}><I className="size-5" aria-hidden="true" />{corto}</button>
              ))}
            </div>
            <div role="tabpanel" className="mt-8 grid gap-8 overflow-hidden rounded-[2rem] border border-border bg-surface lg:grid-cols-[1fr_1.15fr]">
              <div className="relative flex flex-col justify-between bg-gradient-to-br from-[#0a2f5c] to-[#1557c4] p-8 text-white sm:p-10">
                <p.I className="size-12 text-[#ffd84d]" aria-hidden="true" />
                <div className="mt-10">
                  <p className="text-sm font-bold text-white/70">{p.t}</p>
                  <p className="mt-2 text-balance font-display text-3xl font-extrabold leading-tight sm:text-4xl">«{p.frase}»</p>
                </div>
              </div>
              <ul className="grid gap-4 p-8 sm:p-10">
                {p.recibe.map((r) => <li key={r} className="flex gap-3 text-[17px] leading-relaxed"><span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-[#0f7a43] text-white"><Check className="size-4" aria-hidden="true" /></span>{r}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Por qué Enlace Laboral ── */}
        <section aria-labelledby="t-porque" className="bg-[#f0f5fc] px-4 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 id="t-porque" className="max-w-3xl text-balance font-display text-3xl font-extrabold tracking-tight md:text-5xl">Una bolsa de empleo que tus estudiantes sí van a usar</h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { I: ShieldCheck, t: "Cero discriminación", d: "Ningún aviso puede pedir edad, sexo, foto o estado civil. El sistema lo detecta y no lo deja publicar." },
                { I: Sparkles, t: "Transparencia", d: "Salario visible cuando la empresa lo publica, empresa identificada, fuente verdadera y fecha de vencimiento." },
                { I: Users, t: "Aplicar en un minuto", d: "Sin crear cuenta. CV profesional gratis, en PDF o Word, y seguimiento de cada aplicación." },
                { I: CalendarCheck, t: "Jornadas de empleo", d: "Entrevistas en persona con inscripción en línea, recordatorio por WhatsApp y lista de asistencia." },
                { I: HeartHandshake, t: "Inclusión de verdad", d: "Empresas que marcan «Primer empleo», «Inclusiva», «Sin límite de edad». Botón de accesibilidad en toda la página." },
                { I: Megaphone, t: "Difusión", d: "Las vacantes llegan a nuestro canal de WhatsApp y redes, además de la página." },
              ].map(({ I, t, d }) => (
                <div key={t} className="rounded-3xl bg-surface p-7 shadow-[0_1px_2px_rgb(20_33_58/0.06)]">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#1d6ff2]/10 text-[#1557c4]"><I className="size-6" aria-hidden="true" /></span>
                  <p className="mt-5 text-xl font-extrabold">{t}</p>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cómo funciona ── */}
        <section id="como" aria-labelledby="t-como" className="scroll-mt-20 px-4 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 id="t-como" className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">De la firma al primer empleo</h2>
            <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
              <span aria-hidden="true" className="absolute left-6 top-6 hidden h-0.5 w-[calc(100%-3rem)] bg-gradient-to-r from-[#1d6ff2] via-[#7ee2a8] to-[#ffd84d] md:block" />
              {PASOS.map((x, i) => (
                <li key={x.t} className="relative">
                  <span className="relative grid size-12 place-items-center rounded-full bg-[#0a2f5c] font-display text-lg font-extrabold text-white ring-8 ring-background">{i + 1}</span>
                  <p className="mt-5 text-xl font-extrabold">{x.t}</p>
                  <p className="mt-1.5 text-muted-foreground">{x.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Compromiso con el país ── */}
        <section aria-labelledby="t-ods" className="px-4 pb-20 sm:px-6 md:pb-28">
          <div className="mx-auto grid max-w-6xl items-center gap-8 overflow-hidden rounded-[2rem] bg-[#06172e] p-8 text-white sm:p-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <Presentation className="size-10 text-[#ffd84d]" aria-hidden="true" />
              <h2 id="t-ods" className="mt-5 text-balance font-display text-3xl font-extrabold leading-tight md:text-4xl">Una alianza que suma a los Objetivos de Desarrollo Sostenible</h2>
              <p className="mt-4 max-w-xl text-white/75">Trabajamos por un empleo digno, por la educación que lleva al trabajo y por reducir las desigualdades. Tu institución puede mostrarlo en sus informes de responsabilidad social.</p>
            </div>
            <ul className="grid gap-3">
              {[["4", "Educación de calidad", "#c5192d"], ["8", "Trabajo decente y crecimiento económico", "#a21942"], ["10", "Reducción de las desigualdades", "#dd1367"]].map(([n, t, c]) => (
                <li key={n} className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4"><span className="grid size-14 shrink-0 place-items-center rounded-xl font-display text-2xl font-extrabold" style={{ backgroundColor: c }}>{n}</span><span className="font-bold">ODS {n}: {t}</span></li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Formulario ── */}
        <section id="unirme" aria-labelledby="t-unirme" className="scroll-mt-20 bg-gradient-to-b from-[#f0f5fc] to-background px-4 py-20 sm:px-6 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_30rem]">
            <div>
              <h2 id="t-unirme" className="text-balance font-display text-3xl font-extrabold tracking-tight md:text-5xl">Hagamos esto juntos</h2>
              <p className="mt-4 max-w-lg text-lg text-muted-foreground">Cuéntanos de tu institución. Te escribimos para conversar y planificar la primera acción con tu gente.</p>
              <ul className="mt-8 space-y-3 text-lg">
                {["Gratis, sin contratos", "Los datos de tu gente, protegidos", "Una persona real te acompaña"].map((t) => <li key={t} className="flex items-center gap-3"><CheckCircle2 className="size-6 text-[#0f7a43]" aria-hidden="true" />{t}</li>)}
              </ul>
              <div className="mt-12 space-y-3">
                <h3 className="text-lg font-extrabold">Preguntas frecuentes</h3>
                {PREGUNTAS.map(([q, a]) => (
                  <details key={q} className="group rounded-2xl border border-border bg-surface px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">{q}<ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
                    <p className="mt-2 text-muted-foreground">{a}</p>
                  </details>
                ))}
              </div>
            </div>
            <Formulario />
          </div>
        </section>

        <p className="px-4 pb-12 text-center text-sm text-muted-foreground sm:px-6">¿Buscas empleo? Mira <Link to="/empleo-para-todos" className="font-bold text-primary underline-offset-4 hover:underline">Empleo para todas las personas</Link>.</p>
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

function Formulario() {
  const [f, setF] = useState({ tipo: "universidad" as Tipo, institucion: "", contacto_nombre: "", contacto_cargo: "", correo: "", telefono: "", provincia: "", mensaje: "" });
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

  if (estado === "hecho") {
    return (
      <div className="h-fit rounded-[2rem] bg-[#0a2f5c] p-10 text-center text-white">
        <CheckCircle2 className="mx-auto size-16 text-[#7ee2a8]" aria-hidden="true" />
        <p className="mt-4 font-display text-3xl font-extrabold">¡Bienvenida la alianza!</p>
        <p className="mt-2 text-white/80">Recibimos tu solicitud. Te escribiremos a {f.correo.trim()} para conversar los próximos pasos.</p>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => void enviar(e)} className="h-fit space-y-4 rounded-[2rem] border border-border bg-surface p-7 shadow-[0_30px_60px_-30px_rgb(10_47_92/0.35)] lg:sticky lg:top-20">
      <p className="font-display text-2xl font-extrabold">Quiero ser aliado</p>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">Somos</legend>
        <div className="grid grid-cols-2 gap-2">
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

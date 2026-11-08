import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Accessibility, ArrowRight, BookOpen, Flag, GraduationCap, HeartHandshake, Scale, Sprout, Users } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { nivelDe } from "@/lib/claridad";
import { useVacantes } from "@/lib/vacantes";

export const Route = createFileRoute("/empleo-para-todos")({
  head: () => ({ meta: [{ title: "Empleo para todas las personas | Enlace Laboral" }, { name: "description", content: "Primer empleo, personas con discapacidad, cualquier edad y estudiantes: vacantes, derechos y apoyo en República Dominicana. Cero discriminación." }] }),
  component: EmpleoParaTodos,
});

const CAMINOS = [
  { id: "primer-empleo", I: Sprout, t: "Busco mi primer empleo", d: "Nunca has trabajado o estás empezando." },
  { id: "discapacidad", I: Accessibility, t: "Tengo una discapacidad", d: "Empresas que adaptan la entrevista y el puesto." },
  { id: "toda-edad", I: Users, t: "Tengo 40 años o más", d: "Tu experiencia vale. Sin límite de edad." },
  { id: "estudiantes", I: GraduationCap, t: "Estoy estudiando", d: "Pasantías y horarios que respetan tus clases." },
] as const;

function EmpleoParaTodos() {
  const { jobs } = useVacantes();
  const cuenta = useMemo(() => ({
    "primer-empleo": jobs.filter((j) => nivelDe(j) === "Primer empleo" || j.categorias.includes("incl:primer-empleo")).length,
    discapacidad: jobs.filter((j) => j.categorias.includes("incl:discapacidad")).length,
    "toda-edad": jobs.filter((j) => j.categorias.includes("incl:toda-edad")).length,
    estudiantes: jobs.filter((j) => j.tipo === "Pasantía" || j.tipo === "Medio tiempo" || j.categorias.includes("incl:estudiantes")).length,
  }), [jobs]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="hero-dark px-4 pb-14 pt-10 sm:px-6 md:pb-20 md:pt-14">
        <div className="relative mx-auto max-w-6xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90"><HeartHandshake className="size-4 text-[#7ee2a8]" aria-hidden="true" /> Cero discriminación</p>
          <h1 className="mt-4 max-w-3xl text-balance font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight md:text-[2.8rem]">Empleo para todas las personas</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">No importa tu edad, si es tu primer trabajo o si tienes una discapacidad. Aquí no se publican avisos que excluyen y te ayudamos a dar el paso.</p>
          <nav aria-label="Elige tu camino" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CAMINOS.map(({ id, I, t, d }) => (
              <a key={id} href={`#${id}`} className="group rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/15 transition-colors hover:bg-white/[0.14]">
                <I className="size-6 text-[#8ec1ff]" aria-hidden="true" />
                <p className="mt-2 font-extrabold">{t}</p>
                <p className="mt-0.5 text-sm text-white/75">{d}</p>
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-6xl space-y-14">
        <section aria-labelledby="t-compromiso" className="grid gap-6 rounded-3xl border border-border bg-surface p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 id="t-compromiso" className="flex items-center gap-2 font-display text-2xl font-extrabold"><Scale className="size-6 text-primary" aria-hidden="true" /> Nuestro compromiso</h2>
            <p className="mt-3 text-muted-foreground">El Código de Trabajo dominicano (Principio VII) prohíbe excluir a una persona por su sexo, edad, raza, color, origen nacional o social, opinión política, militancia sindical o religión. Lo que sí puede pedir una empresa son las capacidades que el puesto necesita de verdad.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              ["Revisamos cada aviso", "Quitamos pedidos de edad, sexo, foto o estado civil de las vacantes que publicamos."],
              ["Las empresas no pueden publicar avisos que excluyen", "Nuestro formulario detecta esas frases y no deja publicar hasta que se cambien."],
              ["Compromisos visibles", "Las empresas pueden marcar «Primer empleo», «Inclusiva», «Sin límite de edad» y más. Los ves en cada vacante."],
              ["Página para todos", "Toca el botón de accesibilidad (abajo a la izquierda) para agrandar la letra o subir el contraste."],
            ].map(([t, d]) => <li key={t} className="rounded-2xl bg-secondary/60 p-4"><p className="font-bold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></li>)}
          </ul>
        </section>

        <Seccion id="primer-empleo" I={Sprout} titulo="Mi primer empleo" n={cuenta["primer-empleo"]} enlace={{ to: "/vacantes", search: { incl: "primer-empleo" }, t: "Ver vacantes de primer empleo" }}
          consejos={[
            "No tener experiencia no es un problema: cuenta lo que hiciste en la escuela, la iglesia, el deporte, ayudando en el negocio familiar o como voluntario.",
            "Haz tu CV gratis aquí. Tiene ejemplos para quienes empiezan y lo descargas en PDF o Word.",
            "Practica la entrevista: te mostramos las preguntas más comunes y cómo responderlas.",
          ]}
          extra={<div className="flex flex-wrap gap-2"><Link to="/cv" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold hover:border-primary"><BookOpen className="size-4" aria-hidden="true" /> Hacer mi CV</Link><Link to="/cv" search={{ h: "entrevista" }} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold hover:border-primary">Practicar entrevista</Link></div>} />

        <Seccion id="discapacidad" I={Accessibility} titulo="Personas con discapacidad" n={cuenta.discapacidad} enlace={{ to: "/vacantes", search: { incl: "discapacidad" }, t: "Ver vacantes inclusivas" }}
          consejos={[
            "La Ley 5-13 sobre discapacidad establece la igualdad de oportunidades y cuotas de empleo: 5% de la nómina en el sector público y 2% en el privado.",
            "Tú decides si cuentas tu discapacidad y cuándo. Si necesitas un ajuste para la entrevista (intérprete de señas, lugar accesible, más tiempo), escríbelo en el mensaje al aplicar.",
            "Las vacantes marcadas «Inclusiva» son de empresas que se comprometen a adaptar la entrevista y el puesto.",
          ]}
          extra={<p className="text-sm text-muted-foreground">Orientación y programas: <a href="https://conadis.gob.do" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline-offset-4 hover:underline">CONADIS</a> (Consejo Nacional de Discapacidad).</p>} />

        <Seccion id="toda-edad" I={Users} titulo="40 años o más" n={cuenta["toda-edad"]} enlace={{ to: "/vacantes", search: { incl: "toda-edad" }, t: "Ver vacantes sin límite de edad" }}
          consejos={[
            "Pedir una edad máxima en un aviso va contra el Código de Trabajo. Aquí no lo permitimos.",
            "En tu CV pon los últimos 10 a 15 años de experiencia y lo que lograste. No hace falta poner tu fecha de nacimiento.",
            "Si llevas tiempo sin trabajar, un curso corto de INFOTEP muestra que estás al día.",
          ]} />

        <Seccion id="estudiantes" I={GraduationCap} titulo="Estudiantes y jóvenes" n={cuenta.estudiantes} enlace={{ to: "/vacantes", search: { tipo: "Pasantía" }, t: "Ver pasantías" }}
          consejos={[
            "Busca pasantías y trabajos de medio tiempo que respeten tu horario de clases.",
            "INFOTEP ofrece formación técnico profesional y la Formación Dual, donde estudias y practicas en una empresa al mismo tiempo.",
            "Pregunta en tu universidad o centro por su bolsa de empleo y sus acuerdos de pasantía.",
          ]}
          extra={<p className="text-sm text-muted-foreground">Cursos y carreras técnicas: <a href="https://www.infotep.gob.do" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline-offset-4 hover:underline">INFOTEP</a>.</p>} />

        <section aria-labelledby="t-derechos" className="rounded-3xl bg-[#0a2f5c] p-6 text-white sm:p-8">
          <h2 id="t-derechos" className="flex items-center gap-2 font-display text-2xl font-extrabold"><Flag className="size-6 text-[#ffd84d]" aria-hidden="true" /> ¿Viste un aviso que excluye?</h2>
          <p className="mt-2 max-w-2xl text-white/85">Si una vacante en Enlace Laboral pide edad, sexo, foto, estado civil o algo que no tiene que ver con el trabajo, toca «Reportar» en la vacante y la revisamos. Para casos en tu trabajo, puedes orientarte en el <a href="https://mt.gob.do" target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">Ministerio de Trabajo</a>.</p>
          <p className="mt-3 text-sm text-white/70">Recuerda: ninguna empresa seria te cobra por entrevistarte o contratarte.</p>
        </section>

        <section aria-labelledby="t-aliados" className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-surface p-6">
            <h2 id="t-aliados" className="font-display text-xl font-extrabold">¿Eres empresa?</h2>
            <p className="mt-2 text-muted-foreground">Marca tus compromisos de inclusión al publicar. Las personas los ven en tu vacante y en tu página. Publicar es gratis.</p>
            <Link to="/empresas" className="mt-4 inline-flex items-center gap-1.5 font-bold text-primary">Publicar una vacante inclusiva <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-6">
            <h2 className="font-display text-xl font-extrabold">¿Universidad, centro de formación o fundación?</h2>
            <p className="mt-2 text-muted-foreground">Conecta a tus estudiantes, egresados o participantes con empresas que contratan. Sin costo.</p>
            <Link to="/alianzas" className="mt-4 inline-flex items-center gap-1.5 font-bold text-primary">Unirme como aliado <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </section>
        <p className="text-xs text-muted-foreground">Información general, no asesoría legal. Fuentes: Código de Trabajo de la República Dominicana (Principio VII); Ley 5-13 sobre discapacidad (cuotas reportadas por elDinero, enero 2026).</p>
      </div></main>
      <Footer />
    </div>
  );
}

function Seccion({ id, I, titulo, n, consejos, enlace, extra }: { id: string; I: typeof Sprout; titulo: string; n: number; consejos: string[]; enlace: { to: "/vacantes"; search: Record<string, string>; t: string }; extra?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`t-${id}`} className="scroll-mt-24 grid gap-6 lg:grid-cols-[18rem_1fr]">
      <div>
        <span className="grid size-12 place-items-center rounded-2xl bg-[#1d6ff2]/10 text-[#1557c4]"><I className="size-6" aria-hidden="true" /></span>
        <h2 id={`t-${id}`} className="mt-3 font-display text-2xl font-extrabold">{titulo}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{n > 0 ? `${n} ${n === 1 ? "vacante abierta" : "vacantes abiertas"} ahora` : "Las empresas las van marcando cada día"}</p>
        <Link to={enlace.to} search={enlace.search as never} className="btn-aplicar mt-4 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm">{enlace.t} <ArrowRight className="size-4" aria-hidden="true" /></Link>
      </div>
      <div className="space-y-4">
        <ul className="space-y-3">{consejos.map((c) => <li key={c} className="flex gap-3 rounded-2xl border border-border bg-surface p-4 text-[15px] leading-relaxed"><HeartHandshake className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />{c}</li>)}</ul>
        {extra}
      </div>
    </section>
  );
}

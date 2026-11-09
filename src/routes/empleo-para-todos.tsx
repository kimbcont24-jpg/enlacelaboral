import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Accessibility, ArrowRight, Baby, BellRing, BookOpen, Building2, CheckCircle2, ExternalLink, Flag, GraduationCap, HeartHandshake, Landmark, MessageCircle, Scale, ShieldCheck, Sprout, Users } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { VacanteTarjeta } from "@/components/site/VacanteTarjeta";
import { AlertaForm } from "@/components/site/AlertaForm";
import { provincias } from "@/lib/data";
import { enCamino, revisarDiscriminacion } from "@/lib/inclusion";
import { SITIO, useVacantes, type Vacante } from "@/lib/vacantes";

export const Route = createFileRoute("/empleo-para-todos")({
  head: () => ({
    meta: [
      { title: "Empleo para todas las personas | Enlace Laboral" },
      { name: "description", content: "Primer empleo, estudiantes, 40 años o más, mamás y papás, personas con discapacidad: vacantes reales, un plan claro y apoyo en República Dominicana. Cero discriminación." },
      { property: "og:title", content: "Empleo para todas las personas · Enlace Laboral" },
      { property: "og:description", content: "Vacantes reales para tu situación, un plan en 3 pasos y a quién acudir. Gratis y sin discriminación." },
    ],
  }),
  component: EmpleoParaTodos,
});

type Recurso = { n: string; d: string; url?: string };
type Paso = { t: string; d: string; link?: { to: string; search?: Record<string, string>; t: string } };
type Camino = {
  id: "primer-empleo" | "estudiantes" | "toda-edad" | "horario-flexible" | "discapacidad";
  I: typeof Sprout;
  t: string; // en el selector
  d: string;
  titulo: string;
  frase: string;
  nota: string; // qué cuenta como vacante para este camino
  plan: Paso[];
  derechos: string[];
  recursos: Recurso[];
  vacio: { texto: string; link?: { to: string; search?: Record<string, string>; t: string } };
};

const INFOTEP: Recurso = { n: "INFOTEP", d: "Cursos técnicos gratuitos en todo el país y Formación Dual (estudias y practicas en una empresa).", url: "https://www.infotep.gob.do" };
const SENAE: Recurso = { n: "Servicio Nacional de Empleo (Ministerio de Trabajo)", d: "Bolsa electrónica de empleo, ferias de empleo y oficinas territoriales que te orientan sin costo.", url: "https://mt.gob.do" };
const CONADIS: Recurso = { n: "CONADIS", d: "Consejo Nacional de Discapacidad: orientación, programas y ferias de empleo inclusivas junto al Ministerio de Trabajo.", url: "https://conadis.gob.do" };
const OPORTUNIDAD: Recurso = { n: "Oportunidad 14-24", d: "Programa del Gabinete de Política Social para jóvenes de 14 a 24 años que no estudian ni trabajan: formación técnica y apoyo para conseguir empleo." };

const CAMINOS: Camino[] = [
  {
    id: "primer-empleo", I: Sprout, t: "Busco mi primer empleo", d: "Nunca has trabajado o estás empezando.",
    titulo: "Mi primer empleo", frase: "Todo el mundo empezó sin experiencia. Lo que cuenta es lo que ya sabes hacer.",
    nota: "Vacantes que no piden experiencia.",
    plan: [
      { t: "Haz tu CV en 5 minutos", d: "Cuenta lo que hiciste en la escuela, la iglesia, el deporte, el voluntariado o ayudando en el negocio familiar. Tiene ejemplos para quienes empiezan.", link: { to: "/cv", t: "Hacer mi CV gratis" } },
      { t: "Practica la entrevista", d: "Te mostramos las preguntas que más hacen y cómo responderlas con tus propias palabras.", link: { to: "/cv", search: { h: "entrevista" }, t: "Practicar ahora" } },
      { t: "Aplica a varias esta semana", d: "Mientras más apliques, más rápido llega la primera llamada. Activa una alerta y te avisamos cuando salgan nuevas." },
    ],
    derechos: [
      "Desde el primer día te corresponde al menos el salario mínimo de tu sector y estar inscrito en la TSS (salud y pensión).",
      "Ninguna empresa seria te cobra por entrevistarte, capacitarte o contratarte.",
    ],
    recursos: [INFOTEP, SENAE],
    vacio: { texto: "En este momento no hay vacantes sin experiencia en esa provincia. Prueba con todo el país." },
  },
  {
    id: "estudiantes", I: GraduationCap, t: "Estoy estudiando", d: "Pasantías y medio tiempo que respetan tus clases.",
    titulo: "Estudiantes y jóvenes", frase: "Estudiar y trabajar a la vez es posible si el horario te acompaña.",
    nota: "Pasantías y trabajos de medio tiempo.",
    plan: [
      { t: "Busca pasantías y medio tiempo", d: "Son las vacantes que mejor se acomodan a tu horario de clases. Aquí abajo tienes las de ahora." },
      { t: "Pregunta en tu universidad o centro", d: "Casi todos tienen bolsa de empleo y acuerdos de pasantía con empresas. Es un camino directo." },
      { t: "Arma tu CV de estudiante", d: "Pon tu carrera, el año que cursas, proyectos de clase y cursos cortos. Eso vale.", link: { to: "/cv", t: "Hacer mi CV" } },
    ],
    derechos: [
      "Si trabajas, aunque sea medio tiempo, tienes derecho a salario y a estar inscrito en la TSS.",
      "Si tienes entre 14 y 24 años y ahora mismo no estudias ni trabajas, el programa Oportunidad 14-24 te forma gratis en un oficio.",
    ],
    recursos: [INFOTEP, OPORTUNIDAD],
    vacio: { texto: "En este momento no hay pasantías ni medio tiempo en esa provincia. Prueba con todo el país." },
  },
  {
    id: "toda-edad", I: Users, t: "Tengo 40 años o más", d: "Tu experiencia vale. Sin límite de edad.",
    titulo: "40 años o más", frase: "Tu experiencia es un valor, no un obstáculo.",
    nota: "Vacantes cuyo aviso no pide edad.",
    plan: [
      { t: "CV con tus últimos 10 a 15 años", d: "Pon lo que lograste, con números si puedes. No hace falta tu fecha de nacimiento ni foto.", link: { to: "/cv", t: "Actualizar mi CV" } },
      { t: "Muestra que estás al día", d: "Un curso corto de INFOTEP, manejo de correo, Excel o WhatsApp de empresa. Ponlo en tu CV." },
      { t: "Usa tu red", d: "Antiguos compañeros, la iglesia, la junta de vecinos. Una recomendación abre muchas puertas." },
    ],
    derechos: [
      "El Código de Trabajo prohíbe excluir a una persona por su edad. Aquí no se publican avisos con edad máxima.",
      "Si ves una vacante en Enlace Laboral que pide edad, toca «Reportar» y la corregimos.",
    ],
    recursos: [INFOTEP, SENAE],
    vacio: { texto: "No hay vacantes en esa provincia ahora mismo. Prueba con todo el país." },
  },
  {
    id: "horario-flexible", I: Baby, t: "Soy mamá, papá o cuido a alguien", d: "Medio tiempo y trabajos desde casa.",
    titulo: "Mamás, papás y quienes cuidan", frase: "Trabajar y cuidar a tu familia no tiene por qué ser una pelea.",
    nota: "Medio tiempo, desde casa o con horario flexible.",
    plan: [
      { t: "Busca medio tiempo o desde casa", d: "Son las vacantes que más se acomodan a la rutina de la casa. Aquí abajo están las de ahora." },
      { t: "Habla de horarios con naturalidad", d: "En la entrevista puedes preguntar por turnos y flexibilidad. Es una pregunta normal." },
      { t: "Activa una alerta", d: "Te avisamos por correo cuando salgan vacantes nuevas, para que no tengas que estar buscando cada día." },
    ],
    derechos: [
      "Ninguna empresa debería decidir por si tienes hijos o por tu estado civil. Aquí no se publican avisos que lo piden.",
      "Si trabajas medio tiempo o desde casa, también te corresponden salario y TSS.",
    ],
    recursos: [SENAE, INFOTEP],
    vacio: { texto: "No hay vacantes de medio tiempo ni desde casa en esa provincia ahora mismo. Prueba con todo el país." },
  },
  {
    id: "discapacidad", I: Accessibility, t: "Tengo una discapacidad", d: "Empresas que adaptan la entrevista y el puesto.",
    titulo: "Personas con discapacidad", frase: "El talento no tiene una sola forma. Tú decides qué contar y cuándo.",
    nota: "Vacantes que la empresa marcó como inclusivas.",
    plan: [
      { t: "Decide qué contar y cuándo", d: "No estás obligado a decirlo en el CV. Puedes contarlo cuando te sientas cómodo." },
      { t: "Pide los ajustes que necesitas", d: "Intérprete de señas, lugar accesible o más tiempo. Escríbelo en el mensaje al aplicar: es tu derecho pedirlo." },
      { t: "Busca las ferias inclusivas", d: "El Ministerio de Trabajo y CONADIS organizan ferias de empleo para personas con discapacidad." },
    ],
    derechos: [
      "La Ley 5-13 establece igualdad de oportunidades y cuotas de empleo: 5% de la nómina en el sector público y 2% en el privado.",
      "Ningún aviso en Enlace Laboral puede pedir «sin discapacidad» o «perfecto estado de salud».",
    ],
    recursos: [CONADIS, SENAE],
    vacio: { texto: "Todavía ninguna empresa ha marcado sus vacantes como inclusivas. Las estamos invitando a hacerlo. Mientras tanto, mira las vacantes desde casa.", link: { to: "/vacantes", search: { modalidad: "Remoto" }, t: "Ver vacantes desde casa" } },
  },
];

const textoAviso = (j: Vacante) => `${j.titulo}\n${j.descripcion}\n${j.requisitos.join("\n")}`;
const compartir = (c: Camino) => `https://wa.me/?text=${encodeURIComponent(`${c.titulo}: vacantes reales, un plan en 3 pasos y a quién acudir, gratis. Míralo en Enlace Laboral 👉 ${SITIO}/empleo-para-todos#${c.id}`)}`;

function EmpleoParaTodos() {
  const { jobs, cargando } = useVacantes();

  const porCamino = useMemo(() => Object.fromEntries(CAMINOS.map((c) => [c.id, jobs.filter((j) => enCamino(j, c.id))])) as Record<Camino["id"], Vacante[]>, [jobs]);
  const limpias = useMemo(() => jobs.filter((j) => revisarDiscriminacion(textoAviso(j)).length === 0).length, [jobs]);
  const nProvincias = useMemo(() => new Set(jobs.map((j) => j.provincia)).size, [jobs]);
  const pct = jobs.length ? Math.floor((limpias / jobs.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="hero-dark px-4 pb-14 pt-10 sm:px-6 md:pb-20 md:pt-14">
        <div className="relative mx-auto max-w-6xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90"><HeartHandshake className="size-4 text-[#7ee2a8]" aria-hidden="true" /> Cero discriminación</p>
          <h1 className="mt-4 max-w-3xl text-balance font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight md:text-[2.8rem]">Empleo para todas las personas</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">No importa tu edad, si es tu primer trabajo, si estás estudiando, si cuidas a tu familia o si tienes una discapacidad. Te conectamos con vacantes reales y te acompañamos a dar el paso.</p>

          <dl className="mt-7 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [cargando ? "…" : jobs.length.toLocaleString("es-DO"), "vacantes abiertas"],
              [cargando ? "…" : porCamino["primer-empleo"].length.toLocaleString("es-DO"), "sin pedir experiencia"],
              [cargando ? "…" : String(nProvincias), "provincias"],
              [cargando ? "…" : `${pct}%`, "sin pedir edad, sexo ni foto"],
            ].map(([n, t]) => (
              <div key={t} className="rounded-2xl bg-white/[0.08] px-4 py-3 ring-1 ring-white/15">
                <dd className="text-2xl font-extrabold tabular-nums">{n}</dd>
                <dt className="text-xs font-semibold text-white/75">{t}</dt>
              </div>
            ))}
          </dl>

          <nav aria-label="Elige tu camino" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CAMINOS.map(({ id, I, t, d }) => (
              <a key={id} href={`#${id}`} className="group rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/15 transition-colors hover:bg-white/[0.14]">
                <I className="size-6 text-[#8ec1ff]" aria-hidden="true" />
                <p className="mt-2 font-extrabold leading-snug">{t}</p>
                <p className="mt-0.5 text-sm text-white/75">{d}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#8ec1ff]">{cargando ? "Contando…" : `${porCamino[id].length} vacantes`} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></p>
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-6xl space-y-16">
        <Buscador porCamino={porCamino} cargando={cargando} />

        <section aria-labelledby="t-compromiso" className="grid gap-6 rounded-3xl border border-border bg-surface p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 id="t-compromiso" className="flex items-center gap-2 font-display text-2xl font-extrabold"><Scale className="size-6 text-primary" aria-hidden="true" /> Nuestro compromiso</h2>
            <p className="mt-3 text-muted-foreground">El Código de Trabajo dominicano (Principio VII) prohíbe excluir a una persona por su sexo, edad, raza, color, origen nacional o social, opinión política, militancia sindical o religión. Una empresa solo puede pedir lo que el puesto necesita de verdad.</p>
            {!cargando && jobs.length > 0 && (
              <div className="mt-5 rounded-2xl bg-success/10 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-success"><ShieldCheck className="size-5" aria-hidden="true" /> Revisión de hoy</p>
                <p className="mt-1 text-sm"><span className="font-extrabold">{limpias.toLocaleString("es-DO")} de {jobs.length.toLocaleString("es-DO")}</span> vacantes publicadas no piden edad, sexo, foto, estado civil ni rasgos físicos.{jobs.length - limpias > 0 ? " Las demás las estamos revisando para corregirlas." : ""}</p>
              </div>
            )}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              ["Revisamos cada aviso", "Quitamos pedidos de edad, sexo, foto o estado civil de las vacantes que publicamos."],
              ["Las empresas no pueden publicar avisos que excluyen", "Nuestro formulario detecta esas frases y no deja publicar hasta que se cambien."],
              ["Compromisos visibles", "Las empresas pueden marcar «Primer empleo», «Inclusiva», «Sin límite de edad» y «Horario flexible». Los ves en cada vacante."],
              ["Página para todos", "Toca el botón de accesibilidad (abajo a la izquierda) para agrandar la letra o subir el contraste."],
            ].map(([t, d]) => <li key={t} className="rounded-2xl bg-secondary/60 p-4"><p className="font-bold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></li>)}
          </ul>
        </section>

        {CAMINOS.map((c) => <Seccion key={c.id} c={c} vacantes={porCamino[c.id]} cargando={cargando} />)}

        <section aria-labelledby="t-apoyo">
          <h2 id="t-apoyo" className="flex items-center gap-2 font-display text-2xl font-extrabold"><Landmark className="size-6 text-primary" aria-hidden="true" /> A quién acudir</h2>
          <p className="mt-1 text-muted-foreground">Instituciones públicas que te apoyan gratis, además de Enlace Laboral.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[INFOTEP, SENAE, CONADIS, OPORTUNIDAD].map((r) => <RecursoTarjeta key={r.n} r={r} />)}
          </div>
        </section>

        <section aria-labelledby="t-derechos" className="rounded-3xl bg-[#0a2f5c] p-6 text-white sm:p-8">
          <h2 id="t-derechos" className="flex items-center gap-2 font-display text-2xl font-extrabold"><Flag className="size-6 text-[#ffd84d]" aria-hidden="true" /> ¿Viste un aviso que excluye?</h2>
          <p className="mt-2 max-w-2xl text-white/85">Si una vacante en Enlace Laboral pide edad, sexo, foto, estado civil o algo que no tiene que ver con el trabajo, toca «Reportar» en la vacante y la revisamos. Para casos en tu trabajo, puedes orientarte en el <a href="https://mt.gob.do" target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">Ministerio de Trabajo</a>.</p>
          <p className="mt-3 text-sm text-white/70">Recuerda: ninguna empresa seria te cobra por entrevistarte o contratarte.</p>
        </section>

        <section aria-labelledby="t-aliados" className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-surface p-6">
            <h2 id="t-aliados" className="flex items-center gap-2 font-display text-xl font-extrabold"><Building2 className="size-5 text-primary" aria-hidden="true" /> ¿Eres empresa?</h2>
            <p className="mt-2 text-muted-foreground">Marca tus compromisos de inclusión al publicar: primer empleo, inclusiva, toda edad, horario flexible o para estudiantes. Las personas los ven en tu vacante y te encuentran aquí. Publicar es gratis.</p>
            <Link to="/empresas" className="mt-4 inline-flex items-center gap-1.5 font-bold text-primary">Publicar una vacante inclusiva <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold"><GraduationCap className="size-5 text-primary" aria-hidden="true" /> ¿Universidad, centro de formación o fundación?</h2>
            <p className="mt-2 text-muted-foreground">Conecta a tus estudiantes, egresados o participantes con empresas que contratan. Sin costo.</p>
            <Link to="/alianzas" className="mt-4 inline-flex items-center gap-1.5 font-bold text-primary">Unirme como aliado <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </section>
        <p className="text-xs text-muted-foreground">Información general, no asesoría legal. Las cifras se calculan en vivo con las vacantes publicadas en Enlace Laboral. Fuentes: Código de Trabajo de la República Dominicana (Principio VII); Ley 5-13 sobre discapacidad (cuotas reportadas por elDinero, enero 2026); Ministerio de Trabajo (Servicio Nacional de Empleo); Gabinete de Política Social (Oportunidad 14-24).</p>
      </div></main>
      <Footer />
    </div>
  );
}

/** «Encuentra en 1 minuto»: eliges tu situación y tu provincia, y ves vacantes reales al instante. */
function Buscador({ porCamino, cargando }: { porCamino: Record<Camino["id"], Vacante[]>; cargando: boolean }) {
  const [camino, setCamino] = useState<Camino["id"]>("primer-empleo");
  const [provincia, setProvincia] = useState("");
  const c = CAMINOS.find((x) => x.id === camino)!;
  const lista = porCamino[camino].filter((j) => !provincia || j.provincia === provincia);
  return (
    <section aria-labelledby="t-buscador" className="rounded-3xl border border-border bg-surface p-6 shadow-[0_24px_48px_-32px_rgb(10_47_92/0.45)] sm:p-8">
      <h2 id="t-buscador" className="font-display text-2xl font-extrabold">Encuentra tu vacante en 1 minuto</h2>
      <p className="mt-1 text-muted-foreground">Dinos qué te describe y dónde vives. Te mostramos vacantes reales, abiertas hoy.</p>
      <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="¿Qué te describe?">
        {CAMINOS.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={camino === x.id} onClick={() => setCamino(x.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${camino === x.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary hover:text-primary"}`}>
            <x.I className="size-4" aria-hidden="true" /> {x.t}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block min-w-[14rem]">
          <span className="text-xs font-semibold text-muted-foreground">Provincia</span>
          <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary">
            <option value="">Todo el país</option>
            {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <p className="pb-2.5 text-sm font-semibold" aria-live="polite">{cargando ? "Buscando…" : `${lista.length} ${lista.length === 1 ? "vacante" : "vacantes"} para ti`} <span className="font-normal text-muted-foreground">· {c.nota}</span></p>
      </div>
      {!cargando && (lista.length > 0 ? (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{lista.slice(0, 6).map((j) => <VacanteTarjeta key={j.id} job={j} />)}</div>
          {lista.length > 6 && <Link to="/vacantes" search={{ incl: camino, provincia: provincia || undefined } as never} className="btn-aplicar mt-5 inline-flex h-12 items-center gap-2 rounded-xl px-6">Ver las {lista.length} vacantes <ArrowRight className="size-4" aria-hidden="true" /></Link>}
        </>
      ) : (
        <div className="mt-5 rounded-2xl bg-secondary/60 p-5 text-sm">
          <p>{provincia && porCamino[camino].length > 0 ? c.vacio.texto.replace(/Prueba con todo el país\.?/, "") : c.vacio.texto}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {provincia && porCamino[camino].length > 0 && <button type="button" onClick={() => setProvincia("")} className="font-bold text-primary hover:underline">Ver en todo el país ({porCamino[camino].length})</button>}
            {c.vacio.link && <Link to={c.vacio.link.to} search={c.vacio.link.search as never} className="font-bold text-primary hover:underline">{c.vacio.link.t}</Link>}
          </div>
        </div>
      ))}
    </section>
  );
}

function Seccion({ c, vacantes, cargando }: { c: Camino; vacantes: Vacante[]; cargando: boolean }) {
  const [alerta, setAlerta] = useState(false);
  const n = vacantes.length;
  return (
    <section id={c.id} aria-labelledby={`t-${c.id}`} className="scroll-mt-24">
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div>
          <span className="grid size-12 place-items-center rounded-2xl bg-[#1d6ff2]/10 text-[#1557c4]"><c.I className="size-6" aria-hidden="true" /></span>
          <h2 id={`t-${c.id}`} className="mt-3 font-display text-2xl font-extrabold">{c.titulo}</h2>
          <p className="mt-1 text-[15px] text-muted-foreground">{c.frase}</p>
          <p className="mt-3 text-sm font-bold">{cargando ? "Contando vacantes…" : n > 0 ? `${n} ${n === 1 ? "vacante abierta" : "vacantes abiertas"} ahora` : "Sin vacantes marcadas por ahora"}</p>
          <p className="text-xs text-muted-foreground">{c.nota}</p>
          {n > 0 ? (
            <Link to="/vacantes" search={{ incl: c.id } as never} className="btn-aplicar mt-4 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm">Ver las {n} vacantes <ArrowRight className="size-4" aria-hidden="true" /></Link>
          ) : c.vacio.link ? (
            <Link to={c.vacio.link.to} search={c.vacio.link.search as never} className="btn-aplicar mt-4 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm">{c.vacio.link.t} <ArrowRight className="size-4" aria-hidden="true" /></Link>
          ) : null}
          <div className="mt-3 flex flex-col items-start gap-1.5">
            <button type="button" onClick={() => setAlerta((v) => !v)} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"><BellRing className="size-4" aria-hidden="true" /> Avísame de vacantes nuevas</button>
            <a href={compartir(c)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#178a45] hover:underline"><MessageCircle className="size-4" aria-hidden="true" /> Enviarle esto a alguien</a>
          </div>
        </div>

        <div className="space-y-5">
          {alerta && <div className="rounded-2xl border border-border bg-surface p-4"><AlertaForm compacta /></div>}

          <ol className="grid gap-3 md:grid-cols-3">
            {c.plan.map((p, i) => (
              <li key={p.t} className="flex flex-col rounded-2xl border border-border bg-surface p-4">
                <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground" aria-hidden="true">{i + 1}</span>
                <p className="mt-3 font-extrabold leading-snug">{p.t}</p>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
                {p.link && <Link to={p.link.to} search={p.link.search as never} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"><BookOpen className="size-4" aria-hidden="true" /> {p.link.t}</Link>}
              </li>
            ))}
          </ol>

          {!cargando && n > 0 && (
            <div>
              <p className="mb-3 text-sm font-bold">Vacantes de hoy para ti</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{vacantes.slice(0, 3).map((j) => <VacanteTarjeta key={j.id} job={j} />)}</div>
            </div>
          )}
          {!cargando && n === 0 && <p className="rounded-2xl bg-secondary/60 p-4 text-sm">{c.vacio.texto}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-success/10 p-4">
              <p className="text-sm font-extrabold text-success">Tus derechos</p>
              <ul className="mt-2 space-y-2">{c.derechos.map((d) => <li key={d} className="flex gap-2 text-sm leading-relaxed"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />{d}</li>)}</ul>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-sm font-extrabold">Apoyo gratis</p>
              <ul className="mt-2 space-y-2">{c.recursos.map((r) => (
                <li key={r.n} className="text-sm leading-relaxed">
                  {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">{r.n}</a> : <span className="font-bold">{r.n}</span>}: <span className="text-muted-foreground">{r.d}</span>
                </li>
              ))}</ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecursoTarjeta({ r }: { r: Recurso }) {
  const contenido = (
    <>
      <p className="flex items-center gap-1.5 font-extrabold">{r.n} {r.url && <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden="true" />}</p>
      <p className="mt-1 text-sm text-muted-foreground">{r.d}</p>
      {r.url && <p className="mt-2 text-xs font-semibold text-primary">{new URL(r.url).hostname.replace(/^www\./, "")}</p>}
    </>
  );
  return r.url
    ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="lift rounded-2xl border border-border bg-surface p-4">{contenido}</a>
    : <div className="rounded-2xl border border-border bg-surface p-4">{contenido}</div>;
}

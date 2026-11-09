import { createFileRoute, Link } from "@tanstack/react-router";
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Accessibility, ArrowRight, Baby, BellRing, BookOpen, Building2, CheckCircle2, ExternalLink, Flag, GraduationCap, HandHeart, HeartHandshake, Landmark, MessageCircle, Scale, Search, ShieldCheck, Sparkles, Sprout, Users } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { VacanteTarjeta } from "@/components/site/VacanteTarjeta";
import { AlertaForm } from "@/components/site/AlertaForm";
import { LogoMarca } from "@/components/site/Logo";
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
  color: string; // acento del camino
  suave: string; // fondo suave del camino
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
    id: "primer-empleo", I: Sprout, color: "#0f7a43", suave: "#e6f5ec", t: "Busco mi primer empleo", d: "Nunca has trabajado o estás empezando.",
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
    id: "estudiantes", I: GraduationCap, color: "#1d6ff2", suave: "#e8f0fe", t: "Estoy estudiando", d: "Pasantías y medio tiempo que respetan tus clases.",
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
    id: "toda-edad", I: Users, color: "#b45309", suave: "#fdf1e1", t: "Tengo 40 años o más", d: "Tu experiencia vale. Sin límite de edad.",
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
    id: "horario-flexible", I: Baby, color: "#be185d", suave: "#fce7f1", t: "Soy mamá, papá o cuido a alguien", d: "Medio tiempo y trabajos desde casa.",
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
    id: "discapacidad", I: Accessibility, color: "#6d28d9", suave: "#f0e9fd", t: "Tengo una discapacidad", d: "Empresas que adaptan la entrevista y el puesto.",
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
const acento = (c: Camino) => ({ "--acento": c.color, "--suave": c.suave }) as CSSProperties;

/** Aparece suavemente al bajar. Lo que ya se ve al cargar no se esconde nunca. */
function Revela({ children, className = "", retraso = 0 }: { children: ReactNode; className?: string; retraso?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.classList.add("ept-revela");
    el.style.transitionDelay = `${retraso}ms`;
    const o = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { el.classList.add("ept-visto"); o.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" });
    o.observe(el);
    return () => o.disconnect();
  }, [retraso]);
  return <div ref={ref} className={className}>{children}</div>;
}

/** Cuenta desde 0 hasta el número real (solo la primera vez). */
function Cuenta({ n, sufijo = "" }: { n: number; sufijo?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!n) { setV(0); return; }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setV(n); return; }
    let raf = 0; const t0 = performance.now(); const dur = 1100;
    const paso = (t: number) => { const p = Math.min(1, (t - t0) / dur); setV(Math.round(n * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(paso); };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [n]);
  return <>{v.toLocaleString("es-DO")}{sufijo}</>;
}

/** La idea de Enlace en un dibujo: cinco caminos que se conectan en el centro. */
function Constelacion({ porCamino, cargando }: { porCamino: Record<Camino["id"], Vacante[]>; cargando: boolean }) {
  const pos = [[50, 10], [89, 38], [75, 86], [25, 86], [11, 38]] as const;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[26rem]" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
        <g className="ept-orbita"><circle cx="50" cy="50" r="44" fill="none" stroke="rgb(255 255 255 / .12)" strokeWidth=".3" strokeDasharray="1 2.4" /></g>
        <circle cx="50" cy="50" r="30" fill="none" stroke="rgb(255 255 255 / .08)" strokeWidth=".3" />
        {pos.map(([x, y], i) => <line key={i} x1="50" y1="50" x2={x} y2={y} stroke={CAMINOS[i]!.color === "#1d6ff2" ? "#8ec1ff" : "rgb(255 255 255 / .55)"} strokeWidth=".45" className="ept-linea" style={{ animationDelay: `${i * -0.3}s` }} />)}
      </svg>
      <div className="ept-nodo left-1/2 top-1/2 grid size-24 place-items-center rounded-full bg-white shadow-[0_20px_50px_-10px_rgb(0_0_0/.45)] sm:size-28" style={{ animationDuration: "7s" }}>
        <LogoMarca className="h-12 w-auto sm:h-14" />
      </div>
      {CAMINOS.map((c, i) => {
        const [x, y] = pos[i]!;
        return (
          <div key={c.id} className="ept-nodo" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * -1.1}s` }}>
            <div className="relative grid size-14 place-items-center rounded-2xl bg-white shadow-[0_14px_30px_-12px_rgb(0_0_0/.5)] sm:size-16" style={{ color: c.color }}>
              <span className="ept-latido absolute inset-0 -z-10 rounded-2xl" style={{ color: c.color, animationDelay: `${i * 0.45}s` }} />
              <c.I className="size-7" />
              <span className="absolute -right-2 -top-2 min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-extrabold text-white shadow" style={{ background: c.color }}>{cargando ? "·" : porCamino[c.id].length}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmpleoParaTodos() {
  const { jobs, cargando } = useVacantes();

  const porCamino = useMemo(() => Object.fromEntries(CAMINOS.map((c) => [c.id, jobs.filter((j) => enCamino(j, c.id))])) as Record<Camino["id"], Vacante[]>, [jobs]);
  const limpias = useMemo(() => jobs.filter((j) => revisarDiscriminacion(textoAviso(j)).length === 0).length, [jobs]);
  const nProvincias = useMemo(() => new Set(jobs.map((j) => j.provincia)).size, [jobs]);
  const pct = jobs.length ? Math.floor((limpias / jobs.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="hero-dark px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-14">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-[#7ee2a8]/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-[#ff9ccf]/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div className="entra">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90 ring-1 ring-white/15"><HeartHandshake className="size-4 text-[#7ee2a8]" aria-hidden="true" /> Cero discriminación</p>
            <h1 className="mt-4 max-w-3xl text-balance font-display text-[2.1rem] font-extrabold leading-[1.08] tracking-tight md:text-[3rem]">
              Empleo para <span className="bg-gradient-to-r from-[#7ee2a8] via-[#8ec1ff] to-[#ffb3d9] bg-clip-text text-transparent">todas las personas</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">No importa tu edad, si es tu primer trabajo, si estás estudiando, si cuidas a tu familia o si tienes una discapacidad. Te conectamos con vacantes reales y te acompañamos a dar el paso.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#buscador" className="btn-aplicar inline-flex h-12 items-center gap-2 rounded-xl px-6 text-base"><Search className="size-5" aria-hidden="true" /> Encontrar mi vacante</a>
              <a href="#compromiso" className="vidrio inline-flex h-12 items-center gap-2 rounded-xl px-5 text-base font-bold text-white hover:bg-white/15"><ShieldCheck className="size-5" aria-hidden="true" /> Nuestro compromiso</a>
            </div>
            <dl className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [jobs.length, "", "vacantes abiertas"],
                [porCamino["primer-empleo"].length, "", "sin pedir experiencia"],
                [nProvincias, "", "provincias"],
                [pct, "%", "sin pedir edad, sexo ni foto"],
              ].map(([n, suf, t]) => (
                <div key={t as string} className="vidrio rounded-2xl px-3.5 py-3">
                  <dd className="text-2xl font-extrabold tabular-nums">{cargando ? "…" : <Cuenta n={n as number} sufijo={suf as string} />}</dd>
                  <dt className="text-[11px] font-semibold leading-tight text-white/75">{t as string}</dt>
                </div>
              ))}
            </dl>
          </div>
          <div className="hidden lg:block"><Constelacion porCamino={porCamino} cargando={cargando} /></div>
        </div>

        <nav aria-label="Elige tu camino" className="relative mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-3 lg:grid-cols-5">
          {CAMINOS.map((c, i) => (
            <a key={c.id} href={`#${c.id}`} style={{ ...acento(c), animationDelay: `${150 + i * 70}ms` }} className={`${i === CAMINOS.length - 1 ? "col-span-2 lg:col-span-1 " : ""}entra group relative overflow-hidden rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.13] hover:ring-white/30`}>
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ background: c.color }} />
              <span className="grid size-10 place-items-center rounded-xl bg-white text-[var(--acento)] shadow-sm"><c.I className="size-5" aria-hidden="true" /></span>
              <p className="mt-3 text-[15px] font-extrabold leading-snug sm:text-base">{c.t}</p>
              <p className="mt-0.5 hidden text-sm text-white/75 sm:block">{c.d}</p>
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white">{cargando ? "Contando…" : `${porCamino[c.id].length} ${porCamino[c.id].length === 1 ? "vacante" : "vacantes"}`} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" /></p>
            </a>
          ))}
        </nav>
      </header>

      <main className="ept-grano px-4 py-14 sm:px-6"><div className="mx-auto max-w-6xl space-y-20">
        <Revela><Buscador porCamino={porCamino} cargando={cargando} /></Revela>

        <Revela>
          <section id="compromiso" aria-labelledby="t-compromiso" className="scroll-mt-24 grid gap-6 rounded-[2rem] border border-border bg-surface p-6 shadow-[0_24px_48px_-36px_rgb(10_47_92/0.5)] sm:p-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><Scale className="size-6" aria-hidden="true" /></span>
              <h2 id="t-compromiso" className="mt-4 font-display text-[1.7rem] font-extrabold leading-tight">Nuestro compromiso</h2>
              <p className="mt-3 text-muted-foreground">El Código de Trabajo dominicano (Principio VII) prohíbe excluir a una persona por su sexo, edad, raza, color, origen nacional o social, opinión política, militancia sindical o religión. Una empresa solo puede pedir lo que el puesto necesita de verdad.</p>
              {!cargando && jobs.length > 0 && (
                <div className="mt-6 flex items-center gap-4 rounded-2xl bg-success/10 p-4">
                  <Anillo pct={pct} />
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-success"><ShieldCheck className="size-4" aria-hidden="true" /> Revisión de hoy</p>
                    <p className="mt-0.5 text-sm"><span className="font-extrabold">{limpias.toLocaleString("es-DO")} de {jobs.length.toLocaleString("es-DO")}</span> vacantes no piden edad, sexo, foto, estado civil ni rasgos físicos.{jobs.length - limpias > 0 ? " Las demás las estamos corrigiendo." : ""}</p>
                  </div>
                </div>
              )}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                [ShieldCheck, "Revisamos cada aviso", "Quitamos pedidos de edad, sexo, foto o estado civil de las vacantes que publicamos."],
                [Flag, "No se publican avisos que excluyen", "Nuestro formulario detecta esas frases y no deja publicar hasta que se cambien."],
                [Sparkles, "Compromisos visibles", "Las empresas marcan «Primer empleo», «Inclusiva», «Sin límite de edad» y «Horario flexible». Los ves en cada vacante."],
                [Accessibility, "Página para todos", "Toca el botón de accesibilidad (abajo a la izquierda) para agrandar la letra o subir el contraste."],
              ].map(([I, t, d]) => {
                const Icono = I as typeof Flag;
                return (
                  <li key={t as string} className="lift rounded-2xl border border-border bg-background p-4">
                    <Icono className="size-5 text-primary" aria-hidden="true" />
                    <p className="mt-2 font-bold">{t as string}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{d as string}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        </Revela>

        {CAMINOS.map((c, i) => <Seccion key={c.id} c={c} vacantes={porCamino[c.id]} cargando={cargando} invertido={i % 2 === 1} />)}

        <Revela>
          <section aria-label="Lo que creemos" className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0a2f5c_0%,#0f4aa8_100%)] px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <div aria-hidden="true" className="pointer-events-none absolute -left-10 -top-10 size-56 rounded-full bg-[#7ee2a8]/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-10 size-64 rounded-full bg-[#ff9ccf]/20 blur-3xl" />
            <HandHeart className="relative mx-auto size-10 text-[#ffd84d]" aria-hidden="true" />
            <p className="relative mx-auto mt-4 max-w-3xl text-balance font-display text-[1.6rem] font-extrabold leading-tight sm:text-[2.2rem]">«Un empleo cambia una casa entera. Por eso aquí nadie se queda fuera por su edad, su cuerpo o su historia.»</p>
            <p className="relative mt-4 text-sm font-semibold text-white/75">Equipo Enlace Laboral</p>
            <div className="relative mt-7 flex flex-wrap justify-center gap-2">
              {CAMINOS.map((c) => <a key={c.id} href={`#${c.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/20 transition-colors hover:bg-white/20"><c.I className="size-4" style={{ color: c.suave }} aria-hidden="true" /> {c.titulo}</a>)}
            </div>
          </section>
        </Revela>

        <Revela>
          <section aria-labelledby="t-apoyo">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="t-apoyo" className="flex items-center gap-2 font-display text-[1.7rem] font-extrabold"><Landmark className="size-7 text-primary" aria-hidden="true" /> A quién acudir</h2>
                <p className="mt-1 text-muted-foreground">Instituciones públicas que te apoyan gratis, además de Enlace Laboral.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[INFOTEP, SENAE, CONADIS, OPORTUNIDAD].map((r, i) => <RecursoTarjeta key={r.n} r={r} color={["#0f7a43", "#1d6ff2", "#6d28d9", "#b45309"][i]!} />)}
            </div>
          </section>
        </Revela>

        <Revela>
          <section aria-labelledby="t-derechos" className="grid items-center gap-6 rounded-[2rem] bg-[#0a2f5c] p-6 text-white sm:p-10 md:grid-cols-[auto_1fr]">
            <span className="grid size-16 place-items-center rounded-2xl bg-[#ffd84d] text-[#3d2f00]"><Flag className="size-8" aria-hidden="true" /></span>
            <div>
              <h2 id="t-derechos" className="font-display text-[1.7rem] font-extrabold">¿Viste un aviso que excluye?</h2>
              <p className="mt-2 max-w-2xl text-white/85">Si una vacante en Enlace Laboral pide edad, sexo, foto, estado civil o algo que no tiene que ver con el trabajo, toca «Reportar» en la vacante y la revisamos. Para casos en tu trabajo, puedes orientarte en el <a href="https://mt.gob.do" target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">Ministerio de Trabajo</a>.</p>
              <p className="mt-3 text-sm text-white/70">Recuerda: ninguna empresa seria te cobra por entrevistarte o contratarte.</p>
            </div>
          </section>
        </Revela>

        <Revela>
          <section aria-labelledby="t-aliados" className="grid gap-4 md:grid-cols-2">
            <div className="lift relative overflow-hidden rounded-[2rem] border border-border bg-surface p-7">
              <span aria-hidden="true" className="absolute -right-8 -top-8 size-32 rounded-full bg-[#1d6ff2]/10" />
              <span className="relative grid size-12 place-items-center rounded-2xl bg-[#e8f0fe] text-[#1d6ff2]"><Building2 className="size-6" aria-hidden="true" /></span>
              <h2 id="t-aliados" className="relative mt-4 font-display text-xl font-extrabold">¿Eres empresa?</h2>
              <p className="relative mt-2 text-muted-foreground">Marca tus compromisos de inclusión al publicar: primer empleo, inclusiva, toda edad, horario flexible o para estudiantes. Las personas los ven en tu vacante y te encuentran aquí. Publicar es gratis.</p>
              <Link to="/empresas" className="relative mt-5 inline-flex items-center gap-1.5 font-bold text-primary">Publicar una vacante inclusiva <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </div>
            <div className="lift relative overflow-hidden rounded-[2rem] border border-border bg-surface p-7">
              <span aria-hidden="true" className="absolute -right-8 -top-8 size-32 rounded-full bg-[#0f7a43]/10" />
              <span className="relative grid size-12 place-items-center rounded-2xl bg-[#e6f5ec] text-[#0f7a43]"><GraduationCap className="size-6" aria-hidden="true" /></span>
              <h2 className="relative mt-4 font-display text-xl font-extrabold">¿Universidad, centro de formación o fundación?</h2>
              <p className="relative mt-2 text-muted-foreground">Conecta a tus estudiantes, egresados o participantes con empresas que contratan. Sin costo.</p>
              <Link to="/alianzas" className="relative mt-5 inline-flex items-center gap-1.5 font-bold text-primary">Unirme como aliado <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </div>
          </section>
        </Revela>
        <p className="text-xs text-muted-foreground">Información general, no asesoría legal. Las cifras se calculan en vivo con las vacantes publicadas en Enlace Laboral. Fuentes: Código de Trabajo de la República Dominicana (Principio VII); Ley 5-13 sobre discapacidad (cuotas reportadas por elDinero, enero 2026); Ministerio de Trabajo (Servicio Nacional de Empleo); Gabinete de Política Social (Oportunidad 14-24).</p>
      </div></main>
      <Footer />
    </div>
  );
}

/** Anillo de porcentaje (revisión anti-discriminación). */
function Anillo({ pct }: { pct: number }) {
  const r = 22, l = 2 * Math.PI * r;
  return (
    <div className="relative grid size-16 shrink-0 place-items-center">
      <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-success/20" />
        <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="text-success transition-[stroke-dashoffset] duration-1000" strokeDasharray={l} strokeDashoffset={l * (1 - pct / 100)} />
      </svg>
      <span className="text-sm font-extrabold text-success">{pct}%</span>
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
    <section id="buscador" aria-labelledby="t-buscador" style={acento(c)} className="relative scroll-mt-24 overflow-hidden rounded-[2rem] border border-border bg-surface p-6 shadow-[0_30px_60px_-40px_rgb(10_47_92/0.55)] sm:p-10">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 transition-colors duration-500" style={{ background: c.color }} />
      <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-60 blur-2xl transition-colors duration-500" style={{ background: c.suave }} />
      <div className="relative">
        <p className="eyebrow">Paso 1 de 1</p>
        <h2 id="t-buscador" className="mt-1 font-display text-[1.7rem] font-extrabold leading-tight sm:text-[2rem]">Encuentra tu vacante en 1 minuto</h2>
        <p className="mt-1 text-muted-foreground">Dinos qué te describe y dónde vives. Te mostramos vacantes reales, abiertas hoy.</p>
        <div className="mt-6 flex flex-wrap gap-2" role="radiogroup" aria-label="¿Qué te describe?">
          {CAMINOS.map((x) => {
            const activo = camino === x.id;
            return (
              <button key={x.id} type="button" role="radio" aria-checked={activo} onClick={() => setCamino(x.id)}
                style={activo ? { background: x.color, borderColor: x.color } : undefined}
                className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all duration-300 ${activo ? "scale-[1.03] text-white shadow-md" : "border-border bg-background hover:-translate-y-0.5 hover:shadow-sm"}`}>
                <x.I className="size-4" style={activo ? undefined : { color: x.color }} aria-hidden="true" /> {x.t}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-4">
          <label className="block min-w-[15rem]">
            <span className="text-xs font-semibold text-muted-foreground">Provincia</span>
            <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className="mt-1 h-12 w-full rounded-xl border-2 border-input bg-background px-3 text-sm font-semibold outline-none transition-colors focus:border-[var(--acento)]">
              <option value="">Todo el país</option>
              {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <p className="pb-3 text-sm" aria-live="polite">
            <span className="text-2xl font-extrabold tabular-nums" style={{ color: c.color }}>{cargando ? "…" : lista.length}</span>{" "}
            <span className="font-semibold">{lista.length === 1 ? "vacante" : "vacantes"} para ti</span>
            <span className="text-muted-foreground"> · {c.nota}</span>
          </p>
        </div>
        {!cargando && (lista.length > 0 ? (
          <div key={`${camino}-${provincia}`} className="vista-entra">
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{lista.slice(0, 6).map((j, i) => <div key={j.id} className={i >= 3 ? "hidden sm:block [&>article]:h-full" : "[&>article]:h-full"}><VacanteTarjeta job={j} /></div>)}</div>
            {lista.length > 3 && <Link to="/vacantes" search={{ incl: camino, provincia: provincia || undefined } as never} className="btn-aplicar mt-6 inline-flex h-12 items-center gap-2 rounded-xl px-6">Ver las {lista.length} vacantes <ArrowRight className="size-4" aria-hidden="true" /></Link>}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl p-5 text-sm" style={{ background: c.suave }}>
            <p>{provincia && porCamino[camino].length > 0 ? c.vacio.texto.replace(/Prueba con todo el país\.?/, "") : c.vacio.texto}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {provincia && porCamino[camino].length > 0 && <button type="button" onClick={() => setProvincia("")} className="font-bold hover:underline" style={{ color: c.color }}>Ver en todo el país ({porCamino[camino].length})</button>}
              {c.vacio.link && <Link to={c.vacio.link.to} search={c.vacio.link.search as never} className="font-bold hover:underline" style={{ color: c.color }}>{c.vacio.link.t}</Link>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Seccion({ c, vacantes, cargando, invertido }: { c: Camino; vacantes: Vacante[]; cargando: boolean; invertido: boolean }) {
  const [alerta, setAlerta] = useState(false);
  const n = vacantes.length;
  return (
    <section id={c.id} aria-labelledby={`t-${c.id}`} style={acento(c)} className="scroll-mt-24">
      <Revela>
        <div className="relative overflow-hidden rounded-[2rem] p-6 sm:p-10" style={{ background: `linear-gradient(${invertido ? "225deg" : "135deg"}, ${c.suave} 0%, var(--surface) 70%)` }}>
          <c.I aria-hidden="true" className={`pointer-events-none absolute -bottom-10 size-56 opacity-[0.07] ${invertido ? "-left-6" : "-right-6"}`} style={{ color: c.color }} />
          <div className="relative grid gap-8 lg:grid-cols-[19rem_1fr]">
            <div>
              <span className="grid size-14 place-items-center rounded-2xl text-white shadow-lg" style={{ background: c.color, boxShadow: `0 14px 28px -12px ${c.color}` }}><c.I className="size-7" aria-hidden="true" /></span>
              <h2 id={`t-${c.id}`} className="mt-4 font-display text-[1.7rem] font-extrabold leading-tight">{c.titulo}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{c.frase}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums" style={{ color: c.color }}>{cargando ? "…" : n}</span>
                <span className="text-sm font-bold">{n === 1 ? "vacante abierta" : "vacantes abiertas"}</span>
              </div>
              <p className="text-xs text-muted-foreground">{c.nota}</p>
              {n > 0 ? (
                <Link to="/vacantes" search={{ incl: c.id } as never} className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5" style={{ background: c.color }}>Ver las {n} vacantes <ArrowRight className="size-4" aria-hidden="true" /></Link>
              ) : c.vacio.link ? (
                <Link to={c.vacio.link.to} search={c.vacio.link.search as never} className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5" style={{ background: c.color }}>{c.vacio.link.t} <ArrowRight className="size-4" aria-hidden="true" /></Link>
              ) : null}
              <div className="mt-4 flex flex-col items-start gap-2">
                <button type="button" onClick={() => setAlerta((v) => !v)} aria-expanded={alerta} className="inline-flex items-center gap-1.5 text-sm font-bold hover:underline" style={{ color: c.color }}><BellRing className="size-4" aria-hidden="true" /> Avísame de vacantes nuevas</button>
                <a href={compartir(c)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#178a45] hover:underline"><MessageCircle className="size-4" aria-hidden="true" /> Enviarle esto a alguien</a>
              </div>
            </div>

            <div className="min-w-0 space-y-6">
              {alerta && <div className="vista-entra rounded-2xl border border-border bg-surface p-4"><AlertaForm compacta /></div>}

              <div>
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: c.color }}>Tu plan en 3 pasos</p>
                <ol className="relative grid gap-3 md:grid-cols-3">
                  <span aria-hidden="true" className="absolute left-4 right-4 top-[1.6rem] hidden h-0.5 md:block" style={{ background: `repeating-linear-gradient(90deg, ${c.color}55 0 8px, transparent 8px 14px)` }} />
                  {c.plan.map((p, i) => (
                    <li key={p.t} className="lift relative flex flex-col rounded-2xl border border-border bg-surface p-4">
                      <span className="relative grid size-9 place-items-center rounded-full text-sm font-extrabold text-white ring-4 ring-surface" style={{ background: c.color }} aria-hidden="true">{i + 1}</span>
                      <p className="mt-3 font-extrabold leading-snug">{p.t}</p>
                      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
                      {p.link && <Link to={p.link.to} search={p.link.search as never} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold hover:underline" style={{ color: c.color }}><BookOpen className="size-4" aria-hidden="true" /> {p.link.t}</Link>}
                    </li>
                  ))}
                </ol>
              </div>

              {!cargando && n > 0 && (
                <div>
                  <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: c.color }}>Vacantes de hoy para ti</p>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{vacantes.slice(0, 3).map((j) => <VacanteTarjeta key={j.id} job={j} />)}</div>
                </div>
              )}
              {!cargando && n === 0 && <p className="rounded-2xl border border-dashed p-4 text-sm" style={{ borderColor: `${c.color}66`, background: c.suave }}>{c.vacio.texto}</p>}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-success/20 bg-surface p-5">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-success"><ShieldCheck className="size-5" aria-hidden="true" /> Tus derechos</p>
                  <ul className="mt-3 space-y-2.5">{c.derechos.map((d) => <li key={d} className="flex gap-2 text-sm leading-relaxed"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />{d}</li>)}</ul>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <p className="flex items-center gap-2 text-sm font-extrabold"><HeartHandshake className="size-5" style={{ color: c.color }} aria-hidden="true" /> Apoyo gratis</p>
                  <ul className="mt-3 space-y-2.5">{c.recursos.map((r) => (
                    <li key={r.n} className="text-sm leading-relaxed">
                      {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline" style={{ color: c.color }}>{r.n}</a> : <span className="font-bold">{r.n}</span>}: <span className="text-muted-foreground">{r.d}</span>
                    </li>
                  ))}</ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Revela>
    </section>
  );
}

function RecursoTarjeta({ r, color }: { r: Recurso; color: string }) {
  const contenido = (
    <>
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: color }}><Landmark className="size-5" aria-hidden="true" /></span>
      <p className="mt-3 flex items-center gap-1.5 font-extrabold">{r.n} {r.url && <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden="true" />}</p>
      <p className="mt-1 text-sm text-muted-foreground">{r.d}</p>
      {r.url && <p className="mt-3 text-xs font-bold" style={{ color }}>{new URL(r.url).hostname.replace(/^www\./, "")}</p>}
    </>
  );
  const clase = "lift relative block overflow-hidden rounded-2xl border border-border bg-surface p-5";
  return r.url
    ? <a href={r.url} target="_blank" rel="noopener noreferrer" className={clase}>{contenido}</a>
    : <div className={clase}>{contenido}</div>;
}

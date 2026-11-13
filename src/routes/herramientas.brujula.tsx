import { createFileRoute, Link } from "@tanstack/react-router";
import { type CSSProperties, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Briefcase, Compass, FileText, HandHeart, Hammer, Lightbulb, MapPin, MessageCircle, Palette, Megaphone, RotateCcw, Search, Sparkles, Table2 } from "lucide-react";

import { AlertaForm } from "@/components/site/AlertaForm";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { provincias } from "@/lib/data";
import { enCamino } from "@/lib/inclusion";
import { SITIO, useVacantes, type Vacante } from "@/lib/vacantes";

export const Route = createFileRoute("/herramientas/brujula")({
  head: () => ({
    meta: [
      { title: "Brújula del primer empleo: ¿para qué trabajo soy bueno? | Enlace Laboral" },
      { name: "description", content: "Test gratis de intereses y fortalezas para quienes buscan su primer empleo en República Dominicana. Descubre qué áreas van contigo y mira vacantes sin experiencia." },
      { property: "og:title", content: "Brújula del primer empleo · ¿Para qué trabajo eres bueno?" },
      { property: "og:description", content: "12 preguntas, 3 minutos. Te dice qué áreas van contigo y te muestra vacantes sin experiencia." },
    ],
    links: [{ rel: "canonical", href: "https://enlacelaboralrd.com/herramientas/brujula" }],
  }),
  component: Brujula,
});

/* ---------- Perfiles (inspirados en el modelo de intereses de Holland, RIASEC) ---------- */
type PerfilId = "ayudar" | "convencer" | "organizar" | "manos" | "resolver" | "crear";
type Perfil = { id: PerfilId; nombre: string; I: typeof Compass; color: string; frase: string; descripcion: string; areas: string[]; puestos: string[]; consejo: string };

const PERFILES: Record<PerfilId, Perfil> = {
  ayudar: { id: "ayudar", nombre: "Ayudar y atender", I: HandHeart, color: "#be185d", frase: "Te sale natural cuidar a la gente y hacer que se sienta bien atendida.",
    descripcion: "Disfrutas tratar con personas, escuchar y resolverles algo. La paciencia y la empatía son tu fuerte.",
    areas: ["Servicio al Cliente", "Hotelería y Turismo", "Salud", "Recursos Humanos"],
    puestos: ["Agente de servicio al cliente", "Recepcionista", "Camarero/a o bartender", "Auxiliar de farmacia", "Asistente de recursos humanos"],
    consejo: "En la entrevista cuenta una vez en que ayudaste a alguien a resolver un problema, aunque haya sido en tu casa, tu iglesia o tu escuela." },
  convencer: { id: "convencer", nombre: "Convencer y vender", I: Megaphone, color: "#d97706", frase: "Tienes chispa para hablar, negociar y entusiasmar a otros.",
    descripcion: "Te gustan las metas, los retos y hablar con gente nueva. No te da miedo el «no».",
    areas: ["Ventas", "Hotelería y Turismo", "Servicio al Cliente"],
    puestos: ["Promotor/a de ventas", "Vendedor/a de tienda", "Agente de call center (ventas)", "Asesor/a de ventas junior", "Mercaderista"],
    consejo: "Si alguna vez vendiste algo (rifas, comida, ropa por Instagram), ponlo en tu CV: eso es experiencia en ventas." },
  organizar: { id: "organizar", nombre: "Organizar y ordenar", I: Table2, color: "#1d6ff2", frase: "Eres de los que tienen todo en su sitio y no dejan nada a medias.",
    descripcion: "Te sientes bien con el orden, los detalles, los números y las tareas claras. Eres confiable.",
    areas: ["Administración", "Contabilidad y Finanzas", "Logística"],
    puestos: ["Auxiliar administrativo/a", "Digitador/a", "Cajero/a", "Auxiliar de contabilidad", "Auxiliar de almacén e inventario"],
    consejo: "Aprende bien Excel (hay cursos gratis en INFOTEP): abre muchas puertas en oficinas y almacenes." },
  manos: { id: "manos", nombre: "Hacer con las manos", I: Hammer, color: "#0f7a43", frase: "Lo tuyo es la acción: arreglar, armar, mover y ver el resultado.",
    descripcion: "Prefieres el trabajo práctico al escritorio. Te gusta el movimiento y aprender haciendo.",
    areas: ["Producción", "Operaciones", "Logística"],
    puestos: ["Operario/a de producción", "Ayudante de almacén", "Ayudante de chofer o mensajero/a", "Auxiliar de mantenimiento", "Empacador/a"],
    consejo: "Las zonas francas y fábricas contratan sin experiencia y te entrenan. Un curso técnico corto te sube de puesto rápido." },
  resolver: { id: "resolver", nombre: "Investigar y resolver", I: Search, color: "#6d28d9", frase: "Te gusta entender cómo funcionan las cosas y encontrar la solución.",
    descripcion: "Eres curioso/a, analítico/a y no te rindes ante un problema. Aprendes solo/a con un video o un tutorial.",
    areas: ["Tecnología", "Salud", "Contabilidad y Finanzas"],
    puestos: ["Soporte técnico (help desk)", "Auxiliar de laboratorio", "Pasante de sistemas o datos", "Técnico/a en reparación de equipos", "Auxiliar de calidad"],
    consejo: "Haz un proyecto pequeño (una hoja de cálculo, una página, arreglar equipos de tus vecinos) y muéstralo: vale como experiencia." },
  crear: { id: "crear", nombre: "Crear e imaginar", I: Palette, color: "#0e7490", frase: "Tienes ojo para lo visual y ganas de hacer cosas nuevas.",
    descripcion: "Te gusta diseñar, decorar, grabar, escribir o darle tu toque a todo. Las redes sociales son tu terreno.",
    areas: ["Ventas", "Tecnología", "Hotelería y Turismo"],
    puestos: ["Asistente de redes sociales", "Diseñador/a gráfico junior", "Vendedor/a visual o decorador/a de tienda", "Asistente de eventos", "Creador/a de contenido para negocios"],
    consejo: "Arma un portafolio en Instagram o Canva con 5 a 10 trabajos tuyos. Para estos puestos importa más que el título." },
};

const PREGUNTAS: { texto: string; perfil: PerfilId }[] = [
  { texto: "Me gusta ayudar a la gente cuando tiene un problema.", perfil: "ayudar" },
  { texto: "Me resulta fácil convencer a otros de una idea o de comprar algo.", perfil: "convencer" },
  { texto: "Me siento bien cuando tengo mis cosas ordenadas y bajo control.", perfil: "organizar" },
  { texto: "Prefiero trabajar de pie y en movimiento antes que sentado/a todo el día.", perfil: "manos" },
  { texto: "Cuando algo no funciona, me quedo hasta descubrir por qué.", perfil: "resolver" },
  { texto: "Me gusta diseñar, decorar, grabar videos o crear contenido.", perfil: "crear" },
  { texto: "Tengo paciencia para escuchar y atender a personas distintas.", perfil: "ayudar" },
  { texto: "Me motiva tener metas y ganar más si las cumplo.", perfil: "convencer" },
  { texto: "Se me dan bien los números, las listas y los detalles.", perfil: "organizar" },
  { texto: "Disfruto arreglar, armar o manejar herramientas y equipos.", perfil: "manos" },
  { texto: "Aprendo solo/a cosas nuevas de la computadora o el celular.", perfil: "resolver" },
  { texto: "La gente me dice que tengo buen gusto o ideas originales.", perfil: "crear" },
];

const OPCIONES = [
  { v: 0, t: "No es lo mío", e: "🙂" },
  { v: 1, t: "Más o menos", e: "😊" },
  { v: 2, t: "¡Ese soy yo!", e: "🤩" },
] as const;

const FORTALEZAS: { id: string; t: string; cv: string }[] = [
  { id: "responsable", t: "Responsable", cv: "Persona responsable y puntual, que cumple lo que se compromete." },
  { id: "aprendo", t: "Aprendo rápido", cv: "Aprendo rápido y me adapto con facilidad a nuevas tareas." },
  { id: "equipo", t: "Trabajo en equipo", cv: "Me integro bien a los equipos y colaboro para lograr metas comunes." },
  { id: "comunicacion", t: "Me comunico bien", cv: "Me comunico de forma clara y respetuosa con clientes y compañeros." },
  { id: "paciencia", t: "Paciente", cv: "Mantengo la calma y la paciencia al atender a personas." },
  { id: "organizado", t: "Organizado/a", cv: "Organizo mi tiempo y mis tareas para entregar a tiempo." },
  { id: "presion", t: "Calma bajo presión", cv: "Trabajo bien bajo presión y en momentos de mucho movimiento." },
  { id: "tecnologia", t: "Bueno/a con la tecnología", cv: "Manejo con facilidad la computadora, el celular y las aplicaciones." },
  { id: "creativo", t: "Creativo/a", cv: "Propongo ideas nuevas y busco formas distintas de resolver." },
  { id: "manos", t: "Hábil con las manos", cv: "Tengo habilidad manual y cuidado con herramientas y equipos." },
];

type Paso = "inicio" | "preguntas" | "fortalezas" | "resultado";

function Brujula() {
  const [paso, setPaso] = useState<Paso>("inicio");
  const [i, setI] = useState(0);
  const [resp, setResp] = useState<number[]>(() => PREGUNTAS.map(() => -1));
  const [fortalezas, setFortalezas] = useState<string[]>([]);
  const [estudia, setEstudia] = useState(false);
  const [provincia, setProvincia] = useState("");

  const responder = (v: number) => {
    const nuevas = resp.map((x, k) => (k === i ? v : x));
    setResp(nuevas);
    window.setTimeout(() => { if (i < PREGUNTAS.length - 1) setI(i + 1); else setPaso("fortalezas"); }, 220);
  };
  const reiniciar = () => { setResp(PREGUNTAS.map(() => -1)); setFortalezas([]); setI(0); setPaso("inicio"); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="hero-dark px-4 pb-10 pt-10 sm:px-6 md:pt-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-10 size-80 rounded-full bg-[#7ee2a8]/15 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <Link to="/herramientas" className="text-sm font-semibold text-white/80 hover:text-white">← Herramientas gratis</Link>
          <div className="mt-4 flex items-center gap-4">
            <span className="brj-rosa grid size-16 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/20"><Compass className="brj-aguja size-9 text-[#ffd84d]" aria-hidden="true" /></span>
            <h1 className="text-balance font-display text-[2rem] font-extrabold leading-tight md:text-[2.8rem]">Brújula del <span className="bg-gradient-to-r from-[#ffd84d] to-[#7ee2a8] bg-clip-text text-transparent">primer empleo</span></h1>
          </div>
          <p className="mt-4 max-w-2xl text-lg text-white/85">¿No sabes por dónde empezar? Responde 12 preguntas sobre lo que te gusta y lo que haces bien. Te decimos qué áreas van contigo, qué puestos buscar sin experiencia y te mostramos vacantes reales.</p>
        </div>
      </header>

      <main className="px-4 py-10 sm:px-6"><div className="mx-auto max-w-4xl">
        {paso === "inicio" && (
          <section className="rounded-[2rem] border border-border bg-surface p-7 text-center shadow-[0_30px_60px_-40px_rgb(10_47_92/0.55)] sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0f7a43]">3 minutos · gratis · sin registro</p>
            <h2 className="mt-3 text-balance text-2xl font-extrabold sm:text-3xl">No hay respuestas buenas ni malas</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Contesta pensando en cómo eres de verdad, no en lo que crees que una empresa quiere oír. Vale lo que haces en la escuela, en tu casa, en la iglesia, en el deporte o en el negocio de la familia.</p>
            <button type="button" onClick={() => setPaso("preguntas")} className="btn-aplicar mt-7 inline-flex h-13 items-center gap-2 rounded-xl px-8 py-3.5 text-lg">Empezar <ArrowRight className="size-5" aria-hidden="true" /></button>
          </section>
        )}

        {paso === "preguntas" && (
          <section aria-live="polite" className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_30px_60px_-40px_rgb(10_47_92/0.55)] sm:p-10">
            <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
              <span>Pregunta {i + 1} de {PREGUNTAS.length}</span>
              {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" /> Atrás</button>}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={PREGUNTAS.length} aria-valuenow={i}>
              <div className="h-full rounded-full bg-gradient-to-r from-[#0f7a43] to-[#1d6ff2] transition-all duration-300" style={{ width: `${(i / PREGUNTAS.length) * 100}%` }} />
            </div>
            <p key={i} className="brj-entra mt-8 min-h-[4.5rem] text-balance text-center text-2xl font-extrabold leading-snug sm:text-3xl">{PREGUNTAS[i].texto}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {OPCIONES.map((o) => (
                <button key={o.v} type="button" onClick={() => responder(o.v)}
                  className={`lift flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-4 text-base font-bold transition sm:flex-col sm:py-6 ${resp[i] === o.v ? "border-[#0f7a43] bg-[#e6f5ec]" : "border-border hover:border-[#0f7a43]"}`}>
                  <span className="text-2xl sm:text-3xl" aria-hidden="true">{o.e}</span>{o.t}
                </button>
              ))}
            </div>
          </section>
        )}

        {paso === "fortalezas" && (
          <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_30px_60px_-40px_rgb(10_47_92/0.55)] sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0f7a43]">Último paso</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Elige hasta 3 cosas que te salen bien</h2>
            <p className="mt-2 text-muted-foreground">Las usaremos para escribirte frases listas para tu CV.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {FORTALEZAS.map((f) => {
                const on = fortalezas.includes(f.id);
                return (
                  <button key={f.id} type="button" aria-pressed={on} disabled={!on && fortalezas.length >= 3}
                    onClick={() => setFortalezas(on ? fortalezas.filter((x) => x !== f.id) : [...fortalezas, f.id])}
                    className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition disabled:opacity-40 ${on ? "border-[#0f7a43] bg-[#0f7a43] text-white" : "border-border hover:border-[#0f7a43]"}`}>{f.t}</button>
                );
              })}
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-border p-4 font-semibold">
                <input type="checkbox" checked={estudia} onChange={(e) => setEstudia(e.target.checked)} className="size-5 accent-[#0f7a43]" /> Estoy estudiando (muéstrame también pasantías y medio tiempo)
              </label>
              <label className="block rounded-2xl border border-border p-4">
                <span className="flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4 text-primary" aria-hidden="true" /> ¿Dónde quieres trabajar?</span>
                <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5">
                  <option value="">Todo el país</option>
                  {provincias.slice(1).map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => { setPaso("resultado"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="btn-aplicar inline-flex h-13 items-center gap-2 rounded-xl px-8 py-3.5 text-lg"><Sparkles className="size-5" aria-hidden="true" /> Ver mi resultado</button>
              <button type="button" onClick={() => { setI(PREGUNTAS.length - 1); setPaso("preguntas"); }} className="font-semibold text-muted-foreground hover:text-foreground">← Volver a las preguntas</button>
            </div>
          </section>
        )}

        {paso === "resultado" && <Resultado resp={resp} fortalezas={fortalezas} estudia={estudia} provincia={provincia} reiniciar={reiniciar} />}

        <p className="mt-8 text-center text-xs text-muted-foreground">La Brújula es una orientación basada en el modelo de intereses vocacionales de John Holland (RIASEC), adaptada a los empleos de entrada en República Dominicana. No es una prueba psicológica ni decide por ti: tus intereses pueden cambiar y puedes aprender cualquier cosa.</p>
      </div></main>
      <Footer />
    </div>
  );
}

function Resultado({ resp, fortalezas, estudia, provincia, reiniciar }: { resp: number[]; fortalezas: string[]; estudia: boolean; provincia: string; reiniciar: () => void }) {
  const { jobs, cargando } = useVacantes();

  const puntajes = useMemo(() => {
    const p = Object.fromEntries(Object.keys(PERFILES).map((k) => [k, 0])) as Record<PerfilId, number>;
    PREGUNTAS.forEach((q, k) => { p[q.perfil] += Math.max(0, resp[k]); });
    return (Object.keys(p) as PerfilId[]).map((id) => ({ id, n: p[id] })).sort((a, b) => b.n - a.n);
  }, [resp]);
  const [p1, p2] = [PERFILES[puntajes[0].id], PERFILES[puntajes[1].id]];
  const areas = [...new Set([...p1.areas, ...p2.areas])];

  const vacantes = useMemo(() => {
    const cabe = (j: Vacante) => enCamino(j, "primer-empleo") || (estudia && enCamino(j, "estudiantes"));
    const enProv = (j: Vacante) => !provincia || j.provincia === provincia || (provincia === "Distrito Nacional" && j.provincia === "Santo Domingo") || (provincia === "Santo Domingo" && j.provincia === "Distrito Nacional");
    const peso = (j: Vacante) => (p1.areas.includes(j.area) ? 2 : areas.includes(j.area) ? 1 : 0);
    return jobs.filter((j) => cabe(j) && enProv(j) && peso(j) > 0).sort((a, b) => peso(b) - peso(a));
  }, [jobs, estudia, provincia, p1, areas]);

  const frases = FORTALEZAS.filter((f) => fortalezas.includes(f.id)).map((f) => f.cv);
  const maximo = 4;
  const compartir = `https://wa.me/?text=${encodeURIComponent(`Hice la Brújula del primer empleo de Enlace Laboral y mi perfil es «${p1.nombre}» y «${p2.nombre}». ¿Y el tuyo? Hazla gratis en 3 minutos:\n${SITIO}/herramientas/brujula`)}`;

  return (
    <div className="brj-entra space-y-8">
      {/* Perfil principal */}
      <section style={{ "--c": p1.color } as CSSProperties} className="relative overflow-hidden rounded-[2rem] p-7 text-white shadow-[0_30px_70px_-30px_rgb(10_47_92/0.7)] sm:p-10" >
        <div aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(135deg, #0a2f5c 0%, ${p1.color} 120%)` }} />
        <div className="relative grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <span className="grid size-20 place-items-center rounded-3xl bg-white/15 ring-1 ring-white/25"><p1.I className="size-10 text-[#ffd84d]" aria-hidden="true" /></span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/75">Tu brújula apunta a</p>
            <h2 className="mt-1 font-display text-[2rem] font-extrabold leading-tight sm:text-[2.4rem]">{p1.nombre}</h2>
            <p className="mt-2 text-lg text-white/90">{p1.frase} {p1.descripcion}</p>
            <p className="mt-3 text-white/80">Y también tienes mucho de <strong className="text-white">{p2.nombre.toLowerCase()}</strong>: {p2.frase.charAt(0).toLowerCase() + p2.frase.slice(1)}</p>
          </div>
        </div>
      </section>

      {/* Barras de perfiles */}
      <section className="rounded-[2rem] border border-border bg-surface p-6 sm:p-8" aria-labelledby="t-mapa-intereses">
        <h2 id="t-mapa-intereses" className="text-xl font-extrabold">Tu mapa de intereses</h2>
        <ul className="mt-4 space-y-3">
          {puntajes.map(({ id, n }) => {
            const p = PERFILES[id];
            return (
              <li key={id} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
                <span className="flex items-center gap-2 font-semibold"><p.I className="size-4 shrink-0" style={{ color: p.color }} aria-hidden="true" /> {p.nombre}</span>
                <span className="h-3 overflow-hidden rounded-full bg-muted"><span className="brj-barra block h-full rounded-full" style={{ width: `${(n / maximo) * 100}%`, background: p.color }} /></span>
                <span className="w-8 text-right font-bold tabular-nums">{n}/{maximo}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Puestos y áreas */}
      <section className="grid gap-6 md:grid-cols-2">
        {[p1, p2].map((p) => (
          <div key={p.id} className="rounded-[2rem] border border-t-4 border-border bg-surface p-6" style={{ borderTopColor: p.color }}>
            <p className="flex items-center gap-2 text-sm font-bold" style={{ color: p.color }}><p.I className="size-4" aria-hidden="true" /> {p.nombre}</p>
            <h3 className="mt-2 text-lg font-extrabold">Puestos para empezar sin experiencia</h3>
            <ul className="mt-3 space-y-1.5">{p.puestos.map((t) => <li key={t} className="flex gap-2 text-sm"><Briefcase className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> {t}</li>)}</ul>
            <p className="mt-4 text-sm font-semibold">Áreas en Enlace:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.areas.map((a) => <Link key={a} to="/vacantes" search={{ area: a, experiencia: "Sin experiencia" } as never} className="rounded-full bg-muted px-3 py-1 text-xs font-bold hover:bg-secondary">{a}</Link>)}
            </div>
            <p className="mt-4 flex gap-2 rounded-2xl bg-muted p-3 text-sm"><Lightbulb className="mt-0.5 size-4 shrink-0 text-[#d97706]" aria-hidden="true" /> {p.consejo}</p>
          </div>
        ))}
      </section>

      {/* Vacantes */}
      <section aria-labelledby="t-vac-brj" className="rounded-[2rem] border border-border bg-surface p-6 sm:p-8">
        <h2 id="t-vac-brj" className="text-xl font-extrabold">Vacantes que van contigo {provincia && <span className="text-primary">en {provincia}</span>}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sin experiencia{estudia ? ", pasantías y medio tiempo" : ""}, en las áreas de tu perfil.</p>
        {cargando ? (
          <p className="mt-5 text-muted-foreground">Buscando vacantes…</p>
        ) : vacantes.length ? (
          <>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {vacantes.slice(0, 6).map((j) => (
                <li key={j.id}>
                  <Link to="/vacantes/$id" params={{ id: j.id }} className="lift block h-full rounded-2xl border border-border p-4 hover:border-primary">
                    <p className="font-extrabold leading-snug">{j.titulo}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{j.empresa} · {j.provincia}</p>
                    <p className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold"><span className="rounded-full bg-[#e6f5ec] px-2 py-0.5 text-[#0f7a43]">{j.experiencia === "Sin experiencia" ? "Sin experiencia" : j.tipo}</span><span className="rounded-full bg-muted px-2 py-0.5">{j.area}</span>{j.salario && <span className="rounded-full bg-muted px-2 py-0.5">{j.salario}</span>}</p>
                  </Link>
                </li>
              ))}
            </ul>
            {vacantes.length > 6 && <Link to="/vacantes" search={{ incl: "primer-empleo", area: p1.areas[0], provincia: provincia || undefined } as never} className="btn-aplicar mt-5 inline-flex h-12 items-center gap-2 rounded-xl px-6">Ver más vacantes <ArrowRight className="size-4" aria-hidden="true" /></Link>}
          </>
        ) : (
          <div className="mt-5 rounded-2xl bg-muted p-5 text-sm">
            <p className="font-semibold">Ahora mismo no hay vacantes sin experiencia de tu perfil{provincia ? ` en ${provincia}` : ""}.</p>
            <p className="mt-1 text-muted-foreground">Salen nuevas todos los días. Activa una alerta aquí abajo y te avisamos.</p>
            <Link to="/empleo-para-todos" hash="primer-empleo" className="mt-3 inline-flex items-center gap-1.5 font-bold text-primary">Ver todas las vacantes de primer empleo <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        )}
      </section>

      {/* Frases CV + pasos */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[2rem] border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><FileText className="size-5 text-primary" aria-hidden="true" /> Frases para tu CV</h2>
          {frases.length ? (
            <ul className="mt-3 space-y-2">{frases.map((f) => <li key={f} className="rounded-xl bg-muted p-3 text-sm">«{f}»</li>)}</ul>
          ) : <p className="mt-3 text-sm text-muted-foreground">No elegiste fortalezas. Puedes hacer la Brújula otra vez para recibir frases listas.</p>}
          <p className="mt-3 text-sm">Pon estas frases en tu «Perfil» y agrega: <em>«Busco mi primera oportunidad en {p1.areas[0].toLowerCase()}»</em>.</p>
          <Link to="/cv" className="btn-aplicar mt-4 inline-flex h-12 items-center gap-2 rounded-xl px-6">Hacer mi CV gratis</Link>
        </div>
        <div className="rounded-[2rem] border border-border bg-surface p-6">
          <h2 className="text-xl font-extrabold">Tus próximos pasos</h2>
          <ol className="mt-3 space-y-3 text-sm">
            <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#0f7a43] text-xs font-extrabold text-white">1</span><span><strong>Arma tu CV</strong> con las frases de la izquierda. <Link to="/cv" className="font-semibold text-primary underline">Empezar</Link></span></li>
            <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#0f7a43] text-xs font-extrabold text-white">2</span><span><strong>Practica la entrevista</strong> con las preguntas más comunes. <Link to="/cv" search={{ h: "entrevista" } as never} className="font-semibold text-primary underline">Practicar</Link></span></li>
            <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#0f7a43] text-xs font-extrabold text-white">3</span><span><strong>Aplica a 5 vacantes esta semana.</strong> La primera llamada llega más rápido de lo que crees.</span></li>
            <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#0f7a43] text-xs font-extrabold text-white">4</span><span><strong>Busca apoyo gratis</strong> en INFOTEP y en las oficinas de empleo. <Link to="/empleo-para-todos" hash="primer-empleo" className="font-semibold text-primary underline">Ver dónde</Link></span></li>
          </ol>
        </div>
      </section>

      <div className="rounded-[2rem] border border-border bg-surface p-6"><AlertaForm areaInicial={p1.areas[0]} provinciaInicial={provincia} /></div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <a href={compartir} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1fa855] px-5 text-sm font-bold text-white hover:bg-[#178c46]"><MessageCircle className="size-4" aria-hidden="true" /> Compartir mi resultado</a>
        <button type="button" onClick={reiniciar} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-5 text-sm font-bold hover:border-primary"><RotateCcw className="size-4" aria-hidden="true" /> Hacerla otra vez</button>
      </div>
    </div>
  );
}

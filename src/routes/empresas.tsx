import { createFileRoute, Link } from "@tanstack/react-router";
import { Consentimiento } from "@/components/site/Consentimiento";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { COMPROMISOS, revisarDiscriminacion } from "@/lib/inclusion";
import { AvisoExclusion } from "@/components/site/AvisoExclusion";
import { ArrowRight, Bell, Building2, CalendarCheck, CalendarClock, Check, ClipboardList, Columns3, Copy, Crown, FileText, Link2, Mail, MessageCircle, Megaphone, ShieldCheck, Sparkles, Upload } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useControles } from "@/lib/controles";
import { provincias } from "@/lib/data";
import { PAGOS_ACTIVOS } from "@/lib/pagos";
import { CORREO_INFO } from "@/lib/vacantes";

export const Route = createFileRoute("/empresas")({
  head: () => ({ meta: [{ title: "Publica tu vacante gratis en 2 minutos | Enlace Laboral" }, { name: "description", content: "Publica tu vacante gratis en República Dominicana: sube el flyer, llena un formulario corto o envíala por correo. Sin crear cuenta. Con cuenta, manejas a tus candidatos en tu panel." }], links: [{ rel: "canonical", href: "https://enlacelaboralrd.com/empresas" }] }),
  component: Empresas,
});

const FUNCIONES = [
  { I: Columns3, t: "Tablero de candidatos", d: "Cada persona en su etapa: nuevo, revisando, entrevista, contratado. La mueves arrastrando." },
  { I: FileText, t: "CV y requisitos lado a lado", d: "Ves su CV ordenado y qué requisitos de tu vacante aparecen en lo que envió." },
  { I: CalendarClock, t: "Agenda de entrevistas", d: "Eliges día y hora, y la cita queda en tu agenda y en tu calendario del celular." },
  { I: MessageCircle, t: "WhatsApp con un toque", d: "Invitación, felicitación o descarte amable: el mensaje sale escrito con su nombre y la cita." },
  { I: Bell, t: "Avisos en vivo", d: "Cuando alguien aplica, aparece en tu panel en ese momento. Puedes activar avisos del navegador." },
  { I: Link2, t: "Banco de talento", d: "Encuentra personas que pidieron ser encontradas e invítalas a tu vacante. Si aceptan, te llegan con su CV." },
  { I: CalendarCheck, t: "Jornadas de empleo", d: "Anuncia tu jornada de reclutamiento. La gente se apunta con su CV, le recuerdas por WhatsApp y marcas quién vino." },
  { I: Megaphone, t: "Difusión incluida", d: "Tu vacante sale en la página, en el canal de WhatsApp y en Instagram, con tu nombre." },
];

const PRECIOS = [
  { n: "Gratis", p: "RD$0", u: "siempre", d: "Todo lo que necesitas para publicar y contratar.", b: ["Vacantes sin límite", "Tablero, agenda y mensajes por WhatsApp", "Preguntas de filtro y salario del mercado", "Banco de talento: 5 invitaciones al mes", "Tú y 1 compañero en el panel", "Cartel con QR para tu local"], cta: "Crear cuenta gratis" },
  { n: "Plan Empresa", p: "RD$1,900", u: "al mes", d: "Para quien contrata seguido y quiere llenar puestos más rápido.", b: ["Todo lo de Gratis", "Invitaciones al banco de talento sin límite", "Hasta 10 personas de tu equipo", "Destaca hasta 4 vacantes a la vez, tú mismo", "Primero en el listado y en nuestros canales", "Informe para gerencia (imprimir o PDF)", "Una reclutadora revisa tus vacantes", "Atención directa por WhatsApp"], cta: "Probar 14 días gratis", top: true },
  { n: "Reclutamiento asistido", p: "RD$5,900", u: "por puesto cubierto", d: "Hacemos el proceso por ti y te presentamos a los mejores tres.", b: ["Filtro de candidatos por una reclutadora", "Entrevistas por competencias", "Pagas solo si contratas"], cta: "Pedirlo desde mi panel" },
];

const ASUNTO_CORREO = "Vacante para publicar";
const CUERPO_CORREO = ["Puesto:", "Empresa:", "Ubicación (provincia o remoto):", "Funciones:", "Requisitos:", "Horario:", "Salario (opcional, pero atrae más candidatos):", "Cómo deben aplicar (correo o WhatsApp):", "", "Persona de contacto y teléfono:"].join("\n");
const MAILTO_VACANTE = `mailto:${CORREO_INFO}?subject=${encodeURIComponent(ASUNTO_CORREO)}&body=${encodeURIComponent(CUERPO_CORREO)}`;

const copiarCorreo = () => {
  void navigator.clipboard?.writeText(CORREO_INFO).then(() => toast.success("Correo copiado"), () => toast.error("No se pudo copiar. Escríbelo a mano: " + CORREO_INFO));
};

/** Lleva al formulario y abre el selector de imagen (el toque del usuario lo permite). */
const subirFlyer = () => {
  document.getElementById("publicar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("flyer-entrada")?.click();
};

const opcion = "group flex min-h-[4.5rem] w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/[.07] p-3.5 text-left transition hover:border-white/40 hover:bg-white/[.13] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const opcionIcono = "grid size-10 shrink-0 place-items-center rounded-xl bg-white/12 text-[#8ec1ff]";

function Empresas() {
  const controles = useControles();
  const [enviado, setEnviado] = useState(false);
  const plan = "Publicación Gratis";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* 1. Publicar: lo primero que se ve */}
      <header className="hero-dark px-4 pb-14 pt-8 sm:px-6 md:pb-20 md:pt-12">
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <div className="lg:self-start">
            <p className="entra inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90"><Sparkles className="size-4 text-[#ffd84d]" /> Gratis · sin crear cuenta · sin tarjeta</p>
            <h1 className="entra mt-4 text-balance font-display text-[2rem] font-extrabold leading-[1.08] tracking-[-0.03em] [animation-delay:60ms] md:text-[2.75rem]">Publica tu vacante gratis en 2 minutos</h1>
            <p className="entra mt-4 max-w-xl text-lg text-white/85 [animation-delay:120ms]">Sube el flyer o llena un formulario corto. La revisamos, la publicamos y te avisamos por correo.</p>

            <h2 className="mt-7 text-sm font-extrabold uppercase tracking-[.1em] text-[#8ec1ff]">Elige cómo publicar</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-1">
              <li>
                <button type="button" onClick={subirFlyer} className={opcion}>
                  <span className={opcionIcono}><Upload className="size-5" /></span>
                  <span className="min-w-0"><span className="block font-extrabold leading-tight">Subir el flyer</span><span className="mt-0.5 hidden text-sm text-white/75 sm:block">Lo más rápido: lo leemos y llenamos el formulario por ti.</span></span>
                </button>
              </li>
              <li>
                <a href="#publicar" className={opcion}>
                  <span className={opcionIcono}><ClipboardList className="size-5" /></span>
                  <span className="min-w-0"><span className="block font-extrabold leading-tight">Llenar el formulario</span><span className="mt-0.5 hidden text-sm text-white/75 sm:block">Sin cuenta. Escribes los datos del puesto y listo.</span></span>
                </a>
              </li>
              <li>
                <a href={MAILTO_VACANTE} className={opcion}>
                  <span className={opcionIcono}><Mail className="size-5" /></span>
                  <span className="min-w-0"><span className="block font-extrabold leading-tight">Enviarla por correo</span><span className="mt-0.5 hidden break-all text-sm text-white/75 sm:block">{CORREO_INFO}</span></span>
                </a>
              </li>
              <li>
                <Link to="/auth" search={{ modo: "registro" }} className={opcion}>
                  <span className={opcionIcono}><Building2 className="size-5" /></span>
                  <span className="min-w-0"><span className="block font-extrabold leading-tight">Crear cuenta de empresa</span><span className="mt-0.5 hidden text-sm text-white/75 sm:block">Publicas tú mismo y manejas a tus candidatos en tu panel.</span></span>
                </Link>
              </li>
            </ul>
            <p className="mt-4 text-sm text-white/75">¿Ya tienes cuenta? <Link to="/auth" className="font-bold text-white underline underline-offset-4">Entra a tu panel</Link></p>
          </div>

          <div id="publicar" className="scroll-mt-20">
            {enviado ? (
              <div className="rounded-3xl bg-surface p-7 text-foreground shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)] sm:p-9">
                <span className="grid size-12 place-items-center rounded-full bg-success/12 text-success"><Check className="size-6" /></span>
                <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight">¡Recibimos tu vacante!</h2>
                <p className="mt-2 text-muted-foreground">La revisamos y te avisamos al correo que indicaste cuando esté publicada.</p>
                <div className="mt-6 rounded-2xl bg-background p-5">
                  <p className="font-extrabold">Siguiente paso (opcional): crea tu cuenta gratis</p>
                  <p className="mt-1 text-sm text-muted-foreground">Con tu cuenta ves a tus candidatos en un panel, agendas entrevistas y les escribes por WhatsApp.</p>
                  <Link to="/auth" search={{ modo: "registro" }} className="btn-aplicar mt-4 inline-flex min-h-12 items-center rounded-xl px-5 text-sm">Crear cuenta de empresa</Link>
                </div>
                <button onClick={() => setEnviado(false)} className="mt-5 min-h-11 rounded-xl border border-border px-4 text-sm font-bold hover:border-primary">Enviar otra vacante</button>
              </div>
            ) : !controles.activos.ctl_empresas ? (
              <div className="rounded-3xl bg-surface p-8 text-center text-foreground">
                <h2 className="text-xl font-bold">Recepción de vacantes en pausa</h2>
                <p className="mt-2 text-sm text-muted-foreground">Por ahora el formulario no está recibiendo vacantes. Envíala por correo a <a href={MAILTO_VACANTE} className="font-bold text-primary underline">{CORREO_INFO}</a> o vuelve en unas horas.</p>
              </div>
            ) : (
              <FormVacante plan={plan} onListo={() => { setEnviado(true); document.getElementById("publicar")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
            )}
          </div>
        </div>
      </header>

      {/* 2. Qué pasa después + la vía del correo, explicada */}
      <section className="border-b border-border bg-surface px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">Qué pasa después de enviarla</h2>
            <ol className="mt-7 grid gap-6 sm:grid-cols-3">
              {[["La recibimos", "Llega al equipo de Enlace Laboral con tus datos de contacto."], ["La revisamos", "Confirmamos que se entienda bien y que no excluya a nadie."], ["Sale publicada", "Te avisamos por correo con el enlace para compartirla."]].map(([t, d], i) => (
                <li key={t} className="relative pl-12">
                  <span className="absolute left-0 top-0 grid size-9 place-items-center rounded-full bg-[#0a2f5c] font-display font-extrabold text-white">{i + 1}</span>
                  <h3 className="font-extrabold">{t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2.5 text-sm font-semibold">
              {["Publicar es gratis, siempre", "Visible 30 días", "Los candidatos aplican directo contigo"].map((x) => <span key={x} className="flex items-center gap-2"><Check className="size-4 text-success" /> {x}</span>)}
            </div>
            <Link to="/empresas-contratando" className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-bold text-[#1557c4] hover:border-[#1d6ff2]">Mira las empresas que ya están contratando aquí <ArrowRight className="size-4" /></Link>
          </div>
          <div className="rounded-3xl border border-border bg-background p-6">
            <p className="flex items-center gap-2 font-extrabold"><Mail className="size-5 text-primary" /> ¿Prefieres el correo?</p>
            <p className="mt-2 text-sm text-muted-foreground">Escribe los datos de la vacante en el mensaje (puesto, ubicación, requisitos y cómo aplicar) y envíalo a:</p>
            <p className="mt-3 break-all rounded-xl bg-surface px-4 py-3 font-display text-lg font-extrabold text-[#0a2f5c]">{CORREO_INFO}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={MAILTO_VACANTE} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">Abrir mi correo <ArrowRight className="size-4" /></a>
              <button type="button" onClick={copiarCorreo} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold hover:border-primary"><Copy className="size-4" /> Copiar correo</button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">El botón abre el correo con los datos que necesitamos ya listados. Si lo que tienes es el flyer en imagen, súbelo en el formulario: ahí lo leemos al momento.</p>
          </div>
        </div>
      </section>

      {/* 3. El panel (para quien crea cuenta) */}
      <section id="panel" className="hero-dark scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[.1em] text-[#8ec1ff]">Con cuenta de empresa · también gratis</p>
            <h2 className="mt-2 text-balance font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">¿Contratas seguido? Maneja a tus candidatos desde tu panel</h2>
            <p className="mt-3 max-w-xl text-white/85">Los candidatos aplican sin crear cuenta y te llegan con su CV. Tú decides, agendas la entrevista y les escribes por WhatsApp.</p>
            <ol className="mt-7 space-y-4">
              {[["Crea tu cuenta", "Nombre de la empresa, RNC y correo."], ["Publica la vacante", "Un formulario corto que te dice qué le falta para que se entienda bien."], ["Recibe y elige", "Las aplicaciones llegan a tu panel. Agenda, decide y avisa a cada persona."]].map(([t, d], i) => (
                <li key={t} className="relative pl-12">
                  <span className="absolute left-0 top-0 grid size-9 place-items-center rounded-full bg-white font-display font-extrabold text-[#0a2f5c]">{i + 1}</span>
                  <h3 className="font-extrabold">{t}</h3>
                  <p className="text-sm text-white/75">{d}</p>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ modo: "registro" }} className="btn-aplicar inline-flex min-h-12 items-center rounded-2xl px-6 text-base">Crear cuenta de empresa</Link>
              <Link to="/auth" className="inline-flex min-h-12 items-center rounded-2xl border border-white/30 px-6 text-base font-bold text-white hover:bg-white/10">Ya tengo cuenta</Link>
            </div>
          </div>
          <MuestraPanel />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 md:py-20"><div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-balance font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">Lo que hace tu panel, sin pagar nada</h2>
        <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {FUNCIONES.map(({ I, t, d }) => (
            <div key={t}>
              <span className="grid size-11 place-items-center rounded-2xl bg-[#1d6ff2]/10 text-[#1557c4]"><I className="size-5" /></span>
              <h3 className="mt-4 text-lg font-extrabold">{t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div></section>

      {PAGOS_ACTIVOS && (
      <section id="precios" aria-labelledby="t-precios" className="scroll-mt-20 border-t border-border px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 id="t-precios" className="max-w-2xl text-balance font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">Empieza gratis. Paga solo si quieres llegar más lejos.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">Sin contrato, sin tarjeta y sin cobros automáticos. Primero lo activamos y después pagas por transferencia.</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {PRECIOS.map((x) => (
              <div key={x.n} className={`relative flex flex-col rounded-3xl p-7 ${x.top ? "bg-[#0a2f5c] text-white shadow-2xl lg:-my-3 lg:py-10" : "border border-border bg-surface"}`}>
                {x.top && <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-[#ffd84d] px-3 py-1 text-xs font-extrabold text-[#3d2f00]"><Crown className="size-3.5" /> 14 días gratis</span>}
                <h3 className="text-lg font-extrabold">{x.n}</h3>
                <p className="mt-3"><span className="font-display text-4xl font-extrabold tracking-tight">{x.p}</span> <span className={`text-sm font-semibold ${x.top ? "text-white/70" : "text-muted-foreground"}`}>{x.u}</span></p>
                <p className={`mt-2 text-sm ${x.top ? "text-white/80" : "text-muted-foreground"}`}>{x.d}</p>
                <ul className="mt-5 space-y-2.5 text-sm">{x.b.map((b) => <li key={b} className="flex gap-2"><Check className={`mt-0.5 size-4 shrink-0 ${x.top ? "text-[#8ec1ff]" : "text-success"}`} />{b}</li>)}</ul>
                <Link to="/auth" search={{ modo: "registro" }} className={`mt-auto pt-7`}><span className={`flex h-12 items-center justify-center rounded-xl text-sm font-bold ${x.top ? "btn-aplicar" : "border border-border hover:border-primary"}`}>{x.cta}</span></Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">¿Solo una vacante urgente? <strong className="text-foreground">Destácala 7 días por RD$500</strong> desde tu panel.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-semibold">
            {["Sin contrato ni permanencia", "Pagas después de activarlo", "Si dejas de pagar, sigues en Gratis con todo tu historial"].map((t) => <span key={t} className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-success" /> {t}</span>)}
          </div>
        </div>
      </section>
      )}

      {/* 4. Reglas de publicación */}
      <section aria-labelledby="t-sin-discriminacion" className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow">Política de publicación</p>
              <h2 id="t-sin-discriminacion" className="mt-1 font-display text-2xl font-extrabold tracking-tight">Vacantes sin límite de edad ni filtros que excluyen</h2>
              <p className="mt-3 text-muted-foreground">En Enlace Laboral no se publican avisos que pidan edad, sexo, foto, estado civil, religión o «buena presencia». Pide lo que el puesto necesita de verdad: experiencia, conocimientos, horario. Nuestro sistema revisa cada aviso antes de enviarlo.</p>
              <Link to="/herramientas/generador-flyers" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-4 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground">Crea gratis el flyer de tu vacante, con lenguaje inclusivo →</Link>
            </div>
            <ul className="grid gap-2 text-sm lg:w-[26rem]">
              <li className="flex gap-2.5 rounded-2xl bg-background p-3.5"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" /><span><strong>Código de Trabajo, Principio VII.</strong> Prohíbe cualquier discriminación, exclusión o preferencia por sexo, edad, raza, color, origen, opinión política, militancia sindical o creencia religiosa.</span></li>
              <li className="flex gap-2.5 rounded-2xl bg-background p-3.5"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" /><span><strong>Constitución, artículo 39.</strong> Derecho a la igualdad.</span></li>
              <li className="flex gap-2.5 rounded-2xl bg-background p-3.5"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" /><span><strong>Convenio 111 de la OIT</strong>, ratificado por el país, sobre discriminación en el empleo.</span></li>
            </ul>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">En el Congreso hay además proyectos que harían más explícita la prohibición de poner edad en los anuncios de empleo. Mientras no sean ley, esta regla se basa en lo que ya está vigente.</p>
        </div>
      </section>

      {/* 5. Cierre */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 rounded-3xl bg-[#0a2f5c] p-7 text-white sm:flex-row sm:items-center sm:p-9">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">¿Tienes una vacante abierta hoy?</h2>
            <p className="mt-1 text-white/80">Publícala gratis ahora. ¿Dudas? Escríbenos a <a href={`mailto:${CORREO_INFO}`} className="font-bold text-white underline underline-offset-4">{CORREO_INFO}</a></p>
          </div>
          <a href="#publicar" className="btn-aplicar inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl px-6 text-base">Publicar mi vacante <ArrowRight className="size-5" /></a>
        </div>
      </section>
      <Footer />
    </div>
  );
}

/** Vista de muestra del panel (ilustración con nombres de ejemplo, no datos reales). */
function MuestraPanel() {
  const cols = [
    { t: "Nuevos", c: "#1d6ff2", gente: [["Ana R.", "3/4 requisitos"], ["Luis M.", "2/4 requisitos"]] },
    { t: "Entrevista", c: "#e0a106", gente: [["Carla P.", "Mañana · 10:00 a. m."]] },
    { t: "Contratados", c: "#22c55e", gente: [["José D.", "¡Empieza el lunes!"]] },
  ];
  return (
    <div className="entra relative [animation-delay:200ms]" aria-label="Ejemplo de cómo se ve el panel de empresa" role="img">
      <div className="rounded-[1.75rem] bg-white/10 p-2 shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)] ring-1 ring-white/15 backdrop-blur">
        <div className="rounded-[1.4rem] bg-[#f4f6f9] p-4 text-foreground sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold">Auxiliar de almacén</p>
            <span className="rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-bold text-success">Activa</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {cols.map((col) => (
              <div key={col.t} className="rounded-xl bg-[#e6eaf1] p-2">
                <p className="flex items-center gap-1.5 px-1 pb-2 text-[11px] font-extrabold"><span className="size-1.5 rounded-full" style={{ backgroundColor: col.c }} />{col.t}</p>
                <div className="space-y-2">
                  {col.gente.map(([n, d]) => (
                    <div key={n} className="rounded-lg bg-white p-2 shadow-[0_1px_2px_rgb(20_33_58/.08)]">
                      <p className="truncate text-xs font-bold">{n}</p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-3 max-w-[15rem] rounded-2xl bg-white p-3 text-foreground shadow-xl sm:-left-8">
        <div className="ml-auto rounded-xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2 text-[12px] leading-snug text-[#111b21]">Hola Carla, te escribe Almacenes Ejemplo. Queremos invitarte a una entrevista mañana a las 10:00 a. m.</div>
        <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground"><MessageCircle className="size-3 text-[#1fa855]" /> Enviado por WhatsApp desde tu panel</p>
      </div>
    </div>
  );
}

const MAX_LUGARES = 10;
const caja = "mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-primary";
const rotulo = "text-sm font-bold";

function FormVacante({ plan, onListo }: { plan: string; onListo: () => void }) {
  const [f, setF] = useState({ empresa: "", contacto: "", correo: "", telefono: "", titulo: "", lugares: [provincias[1] ?? "Distrito Nacional"], detalle: "", trampa: "", redes: false, compromisos: [] as string[] });
  const [enviando, setEnviando] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  /** Una vacante puede ser para varias provincias: al aprobarla se publica una por cada una. */
  const agregarLugar = (p: string) => setF((x) => (!p || x.lugares.includes(p) || x.lugares.length >= MAX_LUGARES ? x : { ...x, lugares: [...x.lugares, p] }));
  const quitarLugar = (p: string) => setF((x) => (x.lugares.length <= 1 ? x : { ...x, lugares: x.lugares.filter((l) => l !== p) }));
  const cambiarPrincipal = (p: string) => setF((x) => ({ ...x, lugares: [p, ...x.lugares.slice(1).filter((l) => l !== p)] }));
  const [leyendo, setLeyendo] = useState<number | null>(null);
  const [leido, setLeido] = useState<string[] | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  /** Lee el flyer en el navegador de la empresa (la foto no se envía a ningún servidor) y llena el formulario. */
  const leerFlyer = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Sube una foto o captura del flyer (JPG o PNG).");
    setLeyendo(0);
    setLeido(null);
    let lector: { cerrar: () => Promise<void> } | null = null;
    try {
      const ocr = await import("@/lib/ocr");
      const { lectura } = await ocr.prepararFoto(file);
      const l = await ocr.crearLector();
      lector = l;
      const r = await ocr.leerFoto(l, lectura, (p) => setLeyendo(Math.round(p * 100)));
      const a = ocr.analizarTexto(r.texto);
      const b = a.varias[0] ?? a.b;
      const correo = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.exec(b.aplicar || a.texto)?.[0] ?? "";
      const tel = /(?:8[024]9)[\s.-]?\d{3}[\s.-]?\d{4}/.exec(a.texto)?.[0] ?? "";
      const detalle = a.texto.split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
      if (!b.titulo && a.texto.trim().length < 20) throw new Error("vacio");
      setF((x) => ({
        ...x,
        titulo: b.titulo || x.titulo,
        empresa: b.empresa || x.empresa,
        lugares: provincias.slice(1).includes(b.provincia) ? [b.provincia, ...x.lugares.slice(1).filter((l) => l !== b.provincia)] : x.lugares,
        correo: x.correo || correo,
        telefono: x.telefono || tel,
        detalle,
      }));
      setLeido([b.titulo ? "el puesto" : "", b.empresa ? "la empresa" : "", b.provincia ? "la ubicación" : "", correo ? "el correo" : "", detalle ? "los detalles" : ""].filter(Boolean));
      toast.success("Leímos tu flyer. Revisa los datos antes de enviar.");
    } catch {
      toast.error("No pudimos leer esa imagen. Prueba con una foto más nítida o llena el formulario a mano.");
    } finally {
      await lector?.cerrar().catch(() => undefined);
      setLeyendo(null);
      if (entrada.current) entrada.current.value = "";
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.trampa) return onListo();
    if (f.detalle.trim().length < 30) return void toast.error("Cuéntanos un poco más: funciones, requisitos y horario.");
    const malas = revisarDiscriminacion(`${f.titulo}\n${f.detalle}`);
    if (malas.length) return void toast.error(`Quita «${malas[0]!.frase}»: ${malas[0]!.motivo} En Enlace Laboral no se publican avisos que discriminan.`);
    setEnviando(true);
    const texto = [`Puesto: ${f.titulo.trim()}`, `Empresa: ${f.empresa.trim()}`, `Ubicación: ${f.lugares.join(", ")}`, "", f.detalle.trim(), "", `Plan: ${plan}`, f.redes ? "Autoriza compartir en redes: sí" : "Autoriza compartir en redes: no", f.compromisos.length ? `Compromisos de inclusión: ${f.compromisos.join(", ")}` : ""].filter((l, i, a) => l !== "" || i < a.length - 1).join("\n");
    const { error } = await supabase.from("borradores").insert({
      origen: "empresa",
      texto,
      titulo: f.titulo.trim(),
      empresa: f.empresa.trim(),
      provincia: f.lugares[0],
      contacto_nombre: f.contacto.trim(),
      contacto_email: f.correo.trim(),
      contacto_telefono: f.telefono.trim() || null,
      fuente: "Publicada por la empresa",
    });
    setEnviando(false);
    if (error) return void toast.error(error.message.includes("recepcion_pausada") ? "Por ahora no estamos recibiendo vacantes. Vuelve en unas horas." : "No se pudo enviar. Intenta otra vez en un momento.");
    onListo();
  };

  const paso = "flex items-center gap-2.5 font-display text-lg font-extrabold";
  const num = "grid size-7 shrink-0 place-items-center rounded-full bg-[#0a2f5c] text-sm font-extrabold text-white";
  return (
    <form onSubmit={(e) => void enviar(e)} className="space-y-4 rounded-3xl bg-surface p-5 text-foreground shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)] sm:p-8">
      <div>
        <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">Publica aquí, sin crear cuenta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tres pasos. Los campos sin «opcional» son necesarios.</p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4">
        <p className="flex items-center gap-2 font-bold"><Upload className="size-4 text-primary" /> ¿Ya tienes el flyer? Súbelo y llenamos todo por ti</p>
        <p className="mt-1 text-sm text-muted-foreground">La imagen se lee en tu dispositivo y no se guarda. Después solo revisas.</p>
        <input id="flyer-entrada" ref={entrada} type="file" accept="image/*" className="hidden" onChange={(e) => void leerFlyer(e.target.files?.[0])} />
        <button type="button" disabled={leyendo !== null} onClick={() => entrada.current?.click()} className="mt-3 min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {leyendo !== null ? `Leyendo tu flyer… ${leyendo}%` : "Subir flyer o captura"}
        </button>
        {leido && leido.length > 0 && <p role="status" className="mt-3 text-sm font-semibold text-success">Llenamos {leido.join(", ")}. Revisa todo antes de enviar.</p>}
      </div>

      <p className={`${paso} pt-1`}><span className={num}>1</span> La vacante</p>
      <label className="block"><span className={rotulo}>Puesto</span><input required maxLength={200} value={f.titulo} onChange={set("titulo")} placeholder="Ej. Cajero/a" className={caja} /></label>
      <label className="block"><span className={rotulo}>Ubicación</span><select required value={f.lugares[0]} onChange={(e) => cambiarPrincipal(e.target.value)} className={caja}>{provincias.slice(1).map((p) => (<option key={p}>{p}</option>))}</select></label>
      <div className="-mt-2">
        {f.lugares.length > 1 && (
          <ul aria-label="Otras provincias de esta vacante" className="mb-2 flex flex-wrap gap-2">
            {f.lugares.slice(1).map((p) => (
              <li key={p} className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 py-1 pl-3 pr-1 text-sm font-semibold text-primary">
                {p}
                <button type="button" onClick={() => quitarLugar(p)} aria-label={`Quitar ${p}`} className="grid size-6 place-items-center rounded-full text-base leading-none hover:bg-primary/15">×</button>
              </li>
            ))}
          </ul>
        )}
        {f.lugares.length < MAX_LUGARES && (
          <select value="" onChange={(e) => agregarLugar(e.target.value)} aria-label="Agregar otra provincia" className="w-full rounded-xl border border-dashed border-border bg-surface px-4 py-2.5 text-sm font-semibold text-primary outline-none focus:border-primary">
            <option value="">+ ¿También en otra provincia? Agrégala</option>
            {provincias.slice(1).filter((p) => !f.lugares.includes(p)).map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        )}
        {f.lugares.length > 1 && <p className="mt-1.5 text-xs text-muted-foreground">Tu vacante saldrá en {f.lugares.length} provincias.</p>}
      </div>
      <label className="block"><span className={rotulo}>Detalles del puesto</span><textarea required rows={5} maxLength={8000} value={f.detalle} onChange={set("detalle")} placeholder="Funciones, requisitos, horario, salario y cómo deben aplicar (correo o WhatsApp). Si publicas el salario, tu vacante llama más la atención." className={caja} /></label>
      <p className="-mt-2 text-xs text-muted-foreground">No pidas edad, sexo, foto ni CV con foto, estado civil o hijos: pide lo que necesita el trabajo.</p>
      <AvisoExclusion hallazgos={revisarDiscriminacion(`${f.titulo}\n${f.detalle}`)} />

      <p className={`${paso} pt-2`}><span className={num}>2</span> Tus datos <span className="text-sm font-semibold text-muted-foreground">(para avisarte)</span></p>
      <label className="block"><span className={rotulo}>Empresa</span><input required maxLength={200} autoComplete="organization" value={f.empresa} onChange={set("empresa")} placeholder="Nombre de la empresa" className={caja} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className={rotulo}>Tu nombre</span><input required maxLength={200} autoComplete="name" value={f.contacto} onChange={set("contacto")} placeholder="Nombre y apellido" className={caja} /></label>
        <label className="block"><span className={rotulo}>Teléfono <span className="font-normal text-muted-foreground">(opcional)</span></span><input maxLength={40} inputMode="tel" autoComplete="tel" value={f.telefono} onChange={set("telefono")} placeholder="809-000-0000" className={caja} /></label>
      </div>
      <label className="block"><span className={rotulo}>Tu correo</span><input required type="email" maxLength={200} autoComplete="email" value={f.correo} onChange={set("correo")} placeholder="rrhh@empresa.do" className={caja} /></label>

      <p className={`${paso} pt-2`}><span className={num}>3</span> Confirma y envía</p>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={f.redes} onChange={(e) => setF((x) => ({ ...x, redes: e.target.checked }))} className="mt-1 size-4" /><span>Autorizo que Enlace Laboral comparta esta vacante en sus redes (Telegram, Facebook, Instagram y WhatsApp). Es opcional y gratis.</span></label>
      <details className="rounded-xl border border-border p-3">
        <summary className="cursor-pointer text-sm font-bold">¿Tu vacante es inclusiva? Márcalo aquí <span className="font-normal text-muted-foreground">(opcional)</span>{f.compromisos.length > 0 && <span className="ml-2 rounded-full bg-success/12 px-2 py-0.5 text-xs font-bold text-success">{f.compromisos.length} marcado{f.compromisos.length > 1 ? "s" : ""}</span>}</summary>
        <p className="mt-2 text-xs text-muted-foreground">Las personas podrán encontrar tu vacante con estos filtros.</p>
        <div className="mt-2 grid gap-2">{COMPROMISOS.map((c) => { const on = f.compromisos.includes(c.id); return <label key={c.id} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={on} onChange={() => setF((x) => ({ ...x, compromisos: on ? x.compromisos.filter((y) => y !== c.id) : [...x.compromisos, c.id] }))} className="mt-1 size-4" /><span><strong>{c.t}.</strong> <span className="text-muted-foreground">{c.d}</span></span></label>; })}</div>
      </details>
      <Consentimiento para="empresa" />
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.trampa} onChange={set("trampa")} className="hidden" name="sitio_web" />
      <button type="submit" disabled={enviando} className="btn-aplicar min-h-13 w-full rounded-xl py-3.5 text-base disabled:opacity-60">{enviando ? "Enviando…" : "Publicar mi vacante gratis"}</button>
      <p className="text-center text-xs text-muted-foreground">La revisamos y te avisamos al correo que indiques.</p>
    </form>
  );
}

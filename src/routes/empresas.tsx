import { createFileRoute, Link } from "@tanstack/react-router";
import { Consentimiento } from "@/components/site/Consentimiento";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { COMPROMISOS } from "@/lib/inclusion";
import { Bell, CalendarCheck, CalendarClock, Check, Columns3, Crown, FileText, Link2, MessageCircle, Megaphone, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useControles } from "@/lib/controles";
import { provincias } from "@/lib/data";

export const Route = createFileRoute("/empresas")({
  head: () => ({ meta: [{ title: "Publica vacantes gratis y elige candidatos | Enlace Laboral" }, { name: "description", content: "Publica tus vacantes gratis en República Dominicana. Recibe candidatos en tu panel, agenda entrevistas y escríbeles por WhatsApp con un toque." }] }),
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

function Empresas() {
  const controles = useControles();
  const [enviado, setEnviado] = useState(false);
  const plan = "Publicación Gratis";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="hero-dark px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-16">
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div>
            <p className="entra inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90"><Sparkles className="size-4 text-[#ffd84d]" /> Publicar y elegir candidatos es gratis</p>
            <h1 className="entra mt-5 text-balance font-display text-[2rem] font-extrabold leading-[1.1] tracking-[-0.02em] [animation-delay:60ms] md:text-[2.75rem]">Publica tu vacante y elige a tu gente desde un solo lugar</h1>
            <p className="entra mt-5 max-w-xl text-lg text-white/85 [animation-delay:120ms]">Los candidatos aplican sin crear cuenta y te llegan a tu panel con su CV. Tú decides, agendas la entrevista y les escribes por WhatsApp.</p>
            <div className="entra mt-8 flex flex-wrap gap-3 [animation-delay:180ms]">
              <Link to="/auth" search={{ modo: "registro" }} className="btn-aplicar inline-flex h-13 items-center rounded-2xl px-7 py-3.5 text-base">Crear cuenta de empresa</Link>
              <Link to="/auth" className="inline-flex items-center rounded-2xl border border-white/30 px-6 py-3.5 text-base font-bold text-white hover:bg-white/10">Ya tengo cuenta</Link>
            </div>
            <p className="mt-4 text-sm text-white/70">¿Sin tiempo para crear cuenta? <a href="#publicar" className="font-bold text-white underline underline-offset-4">Envíanos la vacante aquí</a>.</p>
          </div>
          <MuestraPanel />
        </div>
      </header>

      <section className="px-4 py-16 sm:px-6 md:py-24"><div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-balance font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">Lo que hace tu panel, sin pagar nada</h2>
        <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {FUNCIONES.map(({ I, t, d }) => (
            <div key={t}>
              <span className="grid size-11 place-items-center rounded-2xl bg-[#1d6ff2]/10 text-[#1557c4]"><I className="size-5" /></span>
              <h3 className="mt-4 text-lg font-extrabold">{t}</h3>
              <p className="mt-1.5 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div></section>

      <section className="border-y border-border bg-surface px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">Así de simple</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[["Crea tu cuenta", "Nombre de la empresa, RNC y correo. Dos minutos."], ["Publica la vacante", "Un formulario corto que te dice qué le falta para que se entienda bien."], ["Recibe y elige", "Las aplicaciones llegan a tu panel. Agenda, decide y avisa a cada persona."]].map(([t, d], i) => (
              <li key={t} className="relative pl-14">
                <span className="absolute left-0 top-0 grid size-10 place-items-center rounded-full bg-[#0a2f5c] font-display text-lg font-extrabold text-white">{i + 1}</span>
                <h3 className="text-lg font-extrabold">{t}</h3>
                <p className="mt-1 text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl bg-background p-5 text-sm font-semibold">
            {["Publicar es gratis, siempre", "Vacantes visibles 30 días y se renuevan con un toque", "Revisamos cada vacante para cuidar a los candidatos"].map((x) => <span key={x} className="flex items-center gap-2"><Check className="size-4 text-success" /> {x}</span>)}
          </div>
        </div>
      </section>

      <section id="precios" aria-labelledby="t-precios" className="scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
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

      <section id="publicar" className="scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">¿Prefieres no crear cuenta?</h2>
            <p className="mt-3 text-muted-foreground">Envíanos la vacante con este formulario y la publicamos nosotros. Puedes subir el flyer y lo llenamos por ti. Para ver y manejar a tus candidatos, crea tu cuenta gratis.</p>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><RefreshCw className="size-4" /> También por correo: kimbcont24+vacantes@gmail.com</p>
          </div>
          {enviado ? (
            <div className="rounded-3xl border border-primary/40 bg-primary/5 p-8">
              <h3 className="text-xl font-bold">¡Recibimos tu vacante!</h3>
              <p className="mt-2 text-sm text-muted-foreground">La revisamos y te avisamos al correo cuando esté publicada.</p>
              <button onClick={() => setEnviado(false)} className="mt-6 rounded-xl border border-border px-4 py-2 text-sm font-bold">Enviar otra</button>
            </div>
          ) : !controles.activos.ctl_empresas ? (
            <div className="rounded-3xl border border-border bg-surface p-8 text-center">
              <h3 className="text-xl font-bold">Recepción de vacantes en pausa</h3>
              <p className="mt-2 text-sm text-muted-foreground">Por ahora no estamos recibiendo vacantes nuevas. Vuelve en unas horas, o escríbenos por el canal de WhatsApp.</p>
            </div>
          ) : (
            <FormVacante plan={plan} onListo={() => setEnviado(true)} />
          )}
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

const caja = "mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-primary";
const rotulo = "text-sm font-bold";

function FormVacante({ plan, onListo }: { plan: string; onListo: () => void }) {
  const [f, setF] = useState({ empresa: "", contacto: "", correo: "", telefono: "", titulo: "", provincia: provincias[1] ?? "Distrito Nacional", detalle: "", trampa: "", redes: false, compromisos: [] as string[] });
  const [enviando, setEnviando] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
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
        provincia: provincias.slice(1).includes(b.provincia) ? b.provincia : x.provincia,
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
    setEnviando(true);
    const texto = [`Puesto: ${f.titulo.trim()}`, `Empresa: ${f.empresa.trim()}`, `Ubicación: ${f.provincia}`, "", f.detalle.trim(), "", `Plan: ${plan}`, f.redes ? "Autoriza compartir en redes: sí" : "Autoriza compartir en redes: no", f.compromisos.length ? `Compromisos de inclusión: ${f.compromisos.join(", ")}` : ""].filter((l, i, a) => l !== "" || i < a.length - 1).join("\n");
    const { error } = await supabase.from("borradores").insert({
      origen: "empresa",
      texto,
      titulo: f.titulo.trim(),
      empresa: f.empresa.trim(),
      provincia: f.provincia,
      contacto_nombre: f.contacto.trim(),
      contacto_email: f.correo.trim(),
      contacto_telefono: f.telefono.trim() || null,
      fuente: "Publicada por la empresa",
    });
    setEnviando(false);
    if (error) return void toast.error(error.message.includes("recepcion_pausada") ? "Por ahora no estamos recibiendo vacantes. Vuelve en unas horas." : "No se pudo enviar. Intenta otra vez en un momento.");
    onListo();
  };

  return (
    <form onSubmit={(e) => void enviar(e)} className="space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4">
        <p className="font-bold">¿Ya tienes el flyer de la vacante?</p>
        <p className="mt-1 text-sm text-muted-foreground">Súbelo y llenamos el formulario por ti. La imagen se lee en tu dispositivo y no se guarda.</p>
        <input ref={entrada} type="file" accept="image/*" className="hidden" onChange={(e) => void leerFlyer(e.target.files?.[0])} />
        <button type="button" disabled={leyendo !== null} onClick={() => entrada.current?.click()} className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {leyendo !== null ? `Leyendo tu flyer… ${leyendo}%` : "Subir flyer o captura"}
        </button>
        {leido && leido.length > 0 && <p role="status" className="mt-3 text-sm font-semibold text-success">Llenamos {leido.join(", ")}. Revisa todo antes de enviar.</p>}
      </div>
      <label className="block"><span className={rotulo}>Empresa</span><input required maxLength={200} value={f.empresa} onChange={set("empresa")} placeholder="Nombre de la empresa" className={caja} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className={rotulo}>Contacto</span><input required maxLength={200} value={f.contacto} onChange={set("contacto")} placeholder="Nombre y apellido" className={caja} /></label>
        <label className="block"><span className={rotulo}>Teléfono (opcional)</span><input maxLength={40} inputMode="tel" value={f.telefono} onChange={set("telefono")} placeholder="809-000-0000" className={caja} /></label>
      </div>
      <label className="block"><span className={rotulo}>Correo</span><input required type="email" maxLength={200} value={f.correo} onChange={set("correo")} placeholder="rrhh@empresa.do" className={caja} /></label>
      <label className="block"><span className={rotulo}>Título del puesto</span><input required maxLength={200} value={f.titulo} onChange={set("titulo")} placeholder="Ej. Cajero/a" className={caja} /></label>
      <label className="block"><span className={rotulo}>Ubicación</span><select required value={f.provincia} onChange={set("provincia")} className={caja}>{provincias.slice(1).map((p) => (<option key={p}>{p}</option>))}</select></label>
      <label className="block"><span className={rotulo}>Detalles</span><textarea required rows={5} maxLength={8000} value={f.detalle} onChange={set("detalle")} placeholder="Funciones, requisitos, horario, salario y beneficios. Si publicas el salario, tu vacante llama más la atención." className={caja} /></label>
      <fieldset className="rounded-xl border border-border p-3"><legend className="px-1 text-sm font-bold">¿Tu vacante es para…? (opcional)</legend><p className="text-xs text-muted-foreground">Marca lo que aplique. Las personas podrán encontrar tu vacante con estos filtros.</p><div className="mt-2 grid gap-2">{COMPROMISOS.map((c) => { const on = f.compromisos.includes(c.id); return <label key={c.id} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={on} onChange={() => setF((x) => ({ ...x, compromisos: on ? x.compromisos.filter((y) => y !== c.id) : [...x.compromisos, c.id] }))} className="mt-1 size-4" /><span><strong>{c.t}.</strong> <span className="text-muted-foreground">{c.d}</span></span></label>; })}</div></fieldset>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={f.redes} onChange={(e) => setF((x) => ({ ...x, redes: e.target.checked }))} className="mt-1 size-4" /><span>Autorizo que Enlace Laboral comparta esta vacante en sus redes (Telegram, Facebook, Instagram y WhatsApp). Es opcional y gratis.</span></label>
      <Consentimiento para="empresa" />
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.trampa} onChange={set("trampa")} className="hidden" name="sitio_web" />
      <button type="submit" disabled={enviando} className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-60">{enviando ? "Enviando…" : "Enviar vacante gratis"}</button>
      <p className="text-center text-xs text-muted-foreground">Te contactamos al correo que indiques.</p>
    </form>
  );
}

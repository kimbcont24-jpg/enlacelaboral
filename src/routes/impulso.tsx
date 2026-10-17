import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, CheckCircle2, ChevronDown, Clock, Flame, GraduationCap, Loader2, MessageCircle, Rocket, ShieldCheck, Sparkles, Target, Video, Wallet, XCircle } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useContenido } from "@/lib/contenido";
import { leerCV, cvCompleto, textoCV, type CV } from "@/lib/cv";
import { diagnosticarCV } from "@/lib/diagnostico";
import { OFERTA_TEXTO, PAQUETES, ofertaVigente, pesosRD, precioActual, useCuentaRegresiva, type Paquete } from "@/lib/impulso";

export const Route = createFileRoute("/impulso")({
  head: () => ({
    meta: [
      { title: "Impulso Laboral: CV profesional y orientación | Enlace Laboral" },
      { name: "description", content: "Te hacemos el CV, la carta y el perfil de LinkedIn, y te orientamos en vivo. Oferta de lanzamiento desde RD$500, con entrega en menos de 24 horas." },
      { property: "og:title", content: "Impulso Laboral | Enlace Laboral" },
      { property: "og:description", content: "CV profesional, carta, LinkedIn y orientación en vivo. Oferta de lanzamiento desde RD$500." },
    ],
    links: [{ rel: "canonical", href: "https://enlace-rd.vercel.app/impulso" }],
  }),
  component: Impulso,
});

const campo = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none focus:border-primary";

function Cuenta({ oscuro = false }: { oscuro?: boolean }) {
  const c = useCuentaRegresiva();
  const caja = oscuro ? "bg-white/10 text-white" : "bg-primary text-white";
  const items = c ? [[c.dias, "días"], [c.horas, "horas"], [c.min, "min"], [c.seg, "seg"]] : [["–", "días"], ["–", "horas"], ["–", "min"], ["–", "seg"]];
  return (
    <div className="flex gap-2" role="timer" aria-label="Tiempo que queda de la oferta">
      {items.map(([n, l]) => (
        <div key={String(l)} className={`min-w-14 rounded-xl px-2.5 py-2 text-center ${caja}`}>
          <p className="text-xl font-extrabold tabular-nums leading-none">{typeof n === "number" ? String(n).padStart(2, "0") : n}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-80">{l}</p>
        </div>
      ))}
    </div>
  );
}

function Precio({ p, oscuro = false }: { p: Paquete; oscuro?: boolean }) {
  const oferta = ofertaVigente();
  return (
    <div>
      {oferta && <p className={`text-base font-semibold line-through ${oscuro ? "text-white/60" : "text-muted-foreground"}`}>Precio normal {pesosRD(p.normal)}</p>}
      <div className="flex flex-wrap items-baseline gap-2">
        <p className={`text-4xl font-extrabold tracking-tight ${oscuro ? "text-white" : "text-primary"}`}>{pesosRD(precioActual(p))}</p>
        {oferta && <span className="rounded-full bg-[#ffd84d] px-2.5 py-0.5 text-xs font-extrabold text-[#5a3b00]">Ahorras {pesosRD(p.normal - p.lanzamiento)}</span>}
      </div>
      {oferta && <p className={`mt-1 text-xs font-semibold ${oscuro ? "text-[#8ec1ff]" : "text-cta"}`}>Precio de lanzamiento hasta el {OFERTA_TEXTO}</p>}
    </div>
  );
}

function Impulso() {
  const [elegido, setElegido] = useState<Paquete | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const elegir = (p: Paquete) => {
    setElegido(p);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };
  const porId = (id: Paquete["id"]) => PAQUETES.find((x) => x.id === id)!;
  const oferta = ofertaVigente();
  return (
    <div className="min-h-screen bg-background pb-20 text-foreground md:pb-0">
      <Header />
      {oferta && (
        <div className="bg-[#ffd84d] text-[#4a3000]">
          <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm font-bold"><Flame className="size-4" aria-hidden="true" /> Oferta de lanzamiento: hasta 37 % menos en los paquetes hasta el {OFERTA_TEXTO}</p>
        </div>
      )}
      <header className="hero-dark text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 md:py-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow !text-[#8ec1ff]">Impulso Laboral</p>
            <h1 className="entra mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">Tu CV, hecho por <span className="text-[#8ec1ff]">expertos</span>. Listo en 24 horas.</h1>
            <p className="entra mt-5 max-w-xl text-base text-white/85 md:text-lg">Te escribimos el CV, la carta y tu perfil de LinkedIn para que te llamen a más entrevistas. Pagas por transferencia, sin llamadas ni vueltas. Y si quieres hablar con alguien, tienes orientación en vivo.</p>
            <div className="entra mt-7 flex flex-wrap gap-3">
              <a href="#paquetes" className="btn-aplicar inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base">Ver paquetes <ArrowRight className="size-4" aria-hidden="true" /></a>
              <a href="#diagnostico" className="vidrio inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white">Diagnóstico gratis de mi CV</a>
            </div>
            {oferta && (
              <div className="entra mt-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#ffd84d]">La oferta termina en</p>
                <Cuenta oscuro />
              </div>
            )}
            <ul className="mt-8 flex flex-wrap gap-2 text-xs font-semibold">
              {["Entrega en menos de 24 h", "Devolución si no llegamos a tiempo", "Compatible con sistemas que filtran CVs"].map((t) => (<li key={t} className="vidrio inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"><BadgeCheck className="size-3.5 text-[#8ec1ff]" aria-hidden="true" /> {t}</li>))}
            </ul>
          </div>
          <AntesDespues />
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-14">
          <p className="eyebrow">¿Por dónde empiezo?</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Elige según tu momento</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { i: GraduationCap, t: "Busco mi primer empleo", d: "Armamos un CV que destaca lo que sí tienes: estudios, cursos y ganas.", p: porId("cv") },
              { i: Target, t: "Aplico y nadie me llama", d: "CV, carta y LinkedIn alineados con la vacante que quieres.", p: porId("impulso") },
              { i: Rocket, t: "Tengo una entrevista o quiero cambiar de carrera", d: "Practicas en vivo y sales con un plan claro, y con los documentos listos.", p: porId("despegue") },
            ].map(({ i: Icono, t, d, p }) => (
              <button key={t} type="button" onClick={() => elegir(p)} className="lift group rounded-2xl border border-border bg-surface p-5 text-left">
                <Icono className="size-7 text-cta" aria-hidden="true" />
                <p className="mt-3 text-lg font-extrabold leading-snug">{t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">Te recomendamos: {p.nombre} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></p>
              </button>
            ))}
          </div>
        </section>

        <section id="paquetes" className="scroll-mt-20 bg-secondary/60 py-14">
          <div className="mx-auto max-w-6xl px-6">
            <p className="eyebrow">Paquetes</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Resultados profesionales, a precio dominicano</h2>
            {oferta && <div className="mt-4 flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffd84d] px-3 py-1 text-sm font-extrabold text-[#4a3000]"><Flame className="size-4" aria-hidden="true" /> Precios de lanzamiento</span><Cuenta /></div>}
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {PAQUETES.map((p) => {
                const rey = p.id === "despegue";
                const popular = p.id === "impulso";
                return (
                  <article key={p.id} className={`lift relative flex flex-col rounded-3xl p-6 ${rey ? "hero-dark text-white shadow-xl xl:-mt-3 xl:mb-[-12px]" : `border bg-surface ${popular ? "border-cta shadow-lg" : "border-border"}`}`}>
                    {p.etiqueta && <span className={`absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-extrabold ${rey ? "bg-[#ffd84d] text-[#4a3000]" : "bg-cta text-white"}`}>{p.etiqueta}</span>}
                    <h3 className="mt-1 text-xl font-extrabold">{p.nombre}</h3>
                    <p className={`mt-1 text-sm xl:min-h-[6.5rem] ${rey ? "text-white/80" : "text-muted-foreground"}`}>{p.resumen}</p>
                    <div className="mt-5"><Precio p={p} oscuro={rey} /></div>
                    <p className={`mt-4 rounded-xl px-3 py-2 text-xs font-semibold ${rey ? "bg-white/10" : "bg-secondary text-primary"}`}>{p.paraQuien}</p>
                    <ul className="mt-4 space-y-2 text-sm">
                      {p.incluye.map((x) => (<li key={x} className="flex gap-2"><CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${rey ? "text-[#8ec1ff]" : "text-success"}`} aria-hidden="true" /><span>{x}</span></li>))}
                    </ul>
                    <p className={`mt-4 text-xs font-semibold ${rey ? "text-white/70" : "text-muted-foreground"}`}>{p.entrega}</p>
                    <button type="button" onClick={() => elegir(p)} className={`mt-auto pt-5`}><span className={`block rounded-xl py-3 text-center text-base ${rey ? "bg-[#ffd84d] font-extrabold text-[#4a3000] hover:brightness-95" : "btn-aplicar"}`}>Quiero este paquete</span></button>
                  </article>
                );
              })}
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">Después del {OFERTA_TEXTO}, los paquetes pasan a su precio normal. Pago por transferencia bancaria.</p>
          </div>
        </section>

        <div ref={formRef} className="mx-auto max-w-4xl scroll-mt-20 px-6">{elegido && <Pedido key={elegido.id} paquete={elegido} onCambiar={() => setElegido(null)} />}</div>

        <Diagnostico onPedir={() => elegir(porId("impulso"))} />

        <section className="mx-auto max-w-6xl px-6 py-14">
          <p className="eyebrow">Así de simple</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">De tu pedido a tu CV listo, sin llamadas</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              { i: Sparkles, t: "1. Eliges", d: "Escoges el paquete y llenas un formulario corto." },
              { i: Wallet, t: "2. Pagas", d: "Transferencia bancaria con tu código de pedido." },
              { i: MessageCircle, t: "3. Envías el comprobante", d: "Por WhatsApp, con un botón que ya trae el mensaje." },
              { i: Clock, t: "4. Recibes", d: "En menos de 24 horas desde que confirmamos tu pago." },
            ].map(({ i: Icono, t, d }) => (
              <li key={t} className="lift rounded-2xl border border-border bg-surface p-5">
                <Icono className="size-6 text-cta" aria-hidden="true" />
                <p className="mt-3 font-bold">{t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-14">
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Antes de decidir</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
            {[
              ["¿Cómo pago?", "Por transferencia bancaria. Al hacer tu pedido te mostramos los datos y tu código. Ese código va en el concepto de la transferencia."],
              ["¿Cuánto tardan?", "Menos de 24 horas desde que confirmamos tu pago. Si no llegamos a tiempo, te devolvemos tu dinero."],
              ["¿Mi CV pasará los filtros de las empresas?", "Lo escribimos con formato limpio y palabras clave del puesto, para que lo lean bien tanto las personas como los sistemas que filtran CVs. No podemos garantizar que una empresa te llame."],
              ["¿Inventan experiencia?", "Nunca. Mejoramos cómo cuentas lo que sí has hecho. Si no tienes experiencia formal, destacamos tus estudios, cursos y habilidades."],
              ["¿Qué pasa con mi información?", "Solo la usamos para hacer tu pedido. No publicamos ni compartimos tu CV sin tu permiso."],
              ["¿Cómo es la orientación en vivo?", "Es una videollamada individual de 45 a 60 minutos. Después de tu pedido te escribimos para acordar el día y la hora que te sirvan."],
              ["No sé cuál paquete elegir", "Haz el diagnóstico gratis de tu CV aquí abajo, o elige «Pack Impulso», que es el más completo para empezar a aplicar."],
            ].map(([q, a]) => (
              <details key={q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">{q}<ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
                <p className="mt-2 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="hero-dark text-white">
          <div className="mx-auto max-w-4xl px-6 py-14 text-center">
            <ShieldCheck className="mx-auto size-10 text-[#8ec1ff]" aria-hidden="true" />
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Si no llegamos a tiempo, te devolvemos tu dinero</h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/85">Sin letra chica. Tu CV listo en menos de 24 horas desde que confirmamos tu pago.</p>
            <a href="#paquetes" className="btn-aplicar mt-7 inline-block rounded-xl px-8 py-3.5 text-base">Elegir mi paquete</a>
            <p className="mt-6 text-sm text-white/70">¿Prefieres hacerlo tú mismo? <Link to="/cv" className="font-semibold text-white underline">Crea tu CV gratis</Link>.</p>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
        <a href="#paquetes" className="btn-aplicar flex items-center justify-center gap-2 rounded-xl py-3 text-center text-base">{oferta ? `Oferta · desde ${pesosRD(PAQUETES[0]!.lanzamiento)}` : `Ver paquetes · desde ${pesosRD(PAQUETES[0]!.normal)}`}</a>
      </div>
      <Footer />
    </div>
  );
}

/** Ejemplo ilustrativo: no es el CV de ninguna persona real. */
function AntesDespues() {
  const linea = (w: string, o = "bg-gray-300") => <div className={`h-1.5 rounded ${o}`} style={{ width: w }} />;
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4">
        <div className="rotate-[-3deg] rounded-xl bg-white p-3 shadow-xl">
          <p className="mb-2 inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-extrabold text-red-700"><XCircle className="size-3" /> ANTES</p>
          <div className="space-y-1.5">{linea("70%", "bg-gray-500")}{linea("40%")}{linea("95%")}{linea("90%")}{linea("60%")}{linea("92%")}{linea("85%")}{linea("50%")}{linea("94%")}{linea("88%")}{linea("30%")}</div>
          <p className="mt-3 text-[9px] leading-tight text-gray-500">Texto largo, sin orden, sin logros ni resultados.</p>
        </div>
        <div className="mt-6 rotate-[3deg] rounded-xl bg-white p-3 shadow-2xl ring-2 ring-[#8ec1ff]">
          <p className="mb-2 inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-extrabold text-green-700"><CheckCircle2 className="size-3" /> DESPUÉS</p>
          <div className="mb-2 h-2 w-3/4 rounded bg-[#0a2f5c]" />
          <div className="mb-2 h-1.5 w-1/2 rounded bg-[#1d6ff2]" />
          <div className="grid grid-cols-3 gap-1.5">
            <div className="col-span-1 space-y-1.5"><div className="h-1.5 rounded bg-[#8ec1ff]" /><div className="h-1.5 w-4/5 rounded bg-gray-300" /><div className="h-1.5 w-3/5 rounded bg-gray-300" /><div className="h-1.5 rounded bg-[#8ec1ff]" /><div className="h-1.5 w-4/5 rounded bg-gray-300" /></div>
            <div className="col-span-2 space-y-1.5"><div className="h-1.5 rounded bg-[#0a2f5c]" /><div className="h-1.5 w-11/12 rounded bg-gray-300" /><div className="h-1.5 w-4/5 rounded bg-gray-300" /><div className="h-1.5 w-10/12 rounded bg-gray-300" /><div className="h-1.5 rounded bg-[#0a2f5c]" /><div className="h-1.5 w-11/12 rounded bg-gray-300" /></div>
          </div>
          <p className="mt-3 text-[9px] leading-tight text-gray-500">Resumen claro, logros con números y secciones fáciles de leer.</p>
        </div>
      </div>
      <p className="mt-4 text-center text-[11px] text-white/60">Ejemplo ilustrativo del tipo de cambio que hacemos</p>
    </div>
  );
}

function Diagnostico({ onPedir }: { onPedir: () => void }) {
  const [cv, setCv] = useState<CV | null>(null);
  const [listo, setListo] = useState(false);
  useEffect(() => { const g = leerCV(); setCv(g && cvCompleto(g) ? g : null); setListo(true); }, []);
  const d = cv ? diagnosticarCV(cv) : null;
  const tono = d ? (d.nota >= 8 ? "text-success" : d.nota >= 5 ? "text-[#b36b00]" : "text-destructive") : "";
  return (
    <section id="diagnostico" className="mx-auto max-w-4xl scroll-mt-20 px-6 py-14">
      <div className="rounded-3xl border border-border bg-surface p-6 md:p-8">
        <p className="eyebrow">Gratis</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Diagnóstico de tu CV en 10 puntos</h2>
        <p className="mt-2 text-sm text-muted-foreground">Revisamos lo que ya escribiste en <Link to="/cv" className="font-semibold text-primary underline">Mi CV</Link> con reglas claras: contacto, resumen, logros, números, habilidades e idiomas. No se sube a ningún servidor.</p>
        {listo && !d && (
          <div className="mt-5 rounded-2xl bg-secondary p-5">
            <p className="font-bold">Todavía no tienes un CV guardado en este dispositivo.</p>
            <p className="mt-1 text-sm text-muted-foreground">Créalo gratis en 5 minutos y vuelve aquí para ver tu puntuación.</p>
            <Link to="/cv" className="btn-aplicar mt-4 inline-block rounded-xl px-6 py-2.5 text-base">Crear mi CV gratis</Link>
          </div>
        )}
        {d && (
          <div className="mt-5">
            <p className={`text-5xl font-extrabold ${tono}`}>{d.nota}<span className="text-2xl text-muted-foreground">/{d.total}</span></p>
            <ul className="mt-4 grid gap-2 md:grid-cols-2">
              {d.puntos.map((p) => (
                <li key={p.texto} className={`flex gap-2 rounded-xl border p-3 text-sm ${p.ok ? "border-success/30 bg-success/5" : "border-border"}`}>
                  {p.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />}
                  <span><b>{p.texto}</b>{!p.ok && <span className="block text-muted-foreground">{p.consejo}</span>}</span>
                </li>
              ))}
            </ul>
            {d.nota < d.total && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary p-5 text-white">
                <p className="font-bold">¿Quieres que lo corrijamos por ti? Lo dejamos listo en menos de 24 horas.</p>
                <button type="button" onClick={onPedir} className="rounded-xl bg-[#ffd84d] px-5 py-2.5 font-extrabold text-[#4a3000]">Pedir el Pack Impulso</button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Pedido({ paquete, onCambiar }: { paquete: Paquete; onCambiar: () => void }) {
  const textos = useContenido();
  const guardado = typeof window !== "undefined" ? leerCV() : null;
  const [f, setF] = useState({ nombre: guardado?.nombre ?? "", contacto: guardado?.telefono ?? "", correo: guardado?.correo ?? "", puesto: guardado?.puesto ?? "", notas: "", cv: guardado && cvCompleto(guardado) ? textoCV(guardado) : "", acepto: false });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [hecho, setHecho] = useState<{ codigo: string; precio: number } | null>(null);
  const set = (k: keyof typeof f) => (v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  const enVivo = paquete.id === "entrevista" || paquete.id === "despegue";

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (f.nombre.trim().length < 2) return setError("Escribe tu nombre.");
    if (f.contacto.replace(/\D/g, "").length < 10) return setError("Escribe tu WhatsApp con el código de área, por ejemplo 809 555 1234.");
    if (!f.acepto) return setError("Marca que estás de acuerdo con las condiciones.");
    setEnviando(true);
    const { data, error: err } = await supabase.rpc("crear_pedido", { p_paquete: paquete.id, p_nombre: f.nombre, p_contacto: f.contacto, p_correo: f.correo || null, p_puesto: f.puesto || null, p_cv: f.cv || null, p_notas: f.notas || null });
    setEnviando(false);
    if (err || !data) return setError("No pudimos guardar tu pedido. Intenta de nuevo en un momento.");
    setHecho(data as { codigo: string; precio: number });
  };

  if (hecho) {
    const numero = textos.pago_whatsapp.replace(/\D/g, "");
    const mensaje = `Hola, pagué mi pedido ${hecho.codigo} (${paquete.nombre}, ${pesosRD(hecho.precio)}). Adjunto el comprobante.`;
    return (
      <section className="mt-12 rounded-2xl border-2 border-success/40 bg-surface p-6 md:p-8" aria-live="polite">
        <p className="flex items-center gap-2 text-sm font-bold text-success"><CheckCircle2 className="size-5" aria-hidden="true" /> Pedido recibido</p>
        <h2 className="mt-2 text-2xl font-extrabold">Tu código es {hecho.codigo}</h2>
        <p className="mt-1 text-muted-foreground">{paquete.nombre} · <span className="font-bold text-foreground">{pesosRD(hecho.precio)}</span></p>
        <div className="mt-5 rounded-xl bg-secondary p-4">
          <p className="text-sm font-bold">Para pagar</p>
          {textos.pago_datos.trim()
            ? <p className="mt-1 whitespace-pre-line text-sm">{textos.pago_datos}</p>
            : <p className="mt-1 text-sm">Te enviamos los datos de pago a tu WhatsApp en menos de 1 hora.</p>}
          <p className="mt-2 text-xs text-muted-foreground">Pon tu código {hecho.codigo} en el concepto de la transferencia.</p>
        </div>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm">
          <li>Haz la transferencia por {pesosRD(hecho.precio)}.</li>
          <li>Envíanos el comprobante por WhatsApp con tu código.</li>
          <li>{enVivo ? "Te escribimos para agendar tu sesión y entregamos tus documentos en menos de 24 horas." : "Recibes tu entrega en menos de 24 horas desde que confirmamos el pago."}</li>
        </ol>
        {numero.length >= 10 && (
          <a href={`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1fa855] px-6 py-3 text-base font-bold text-white hover:opacity-90"><MessageCircle className="size-5" aria-hidden="true" /> Enviar comprobante por WhatsApp</a>
        )}
      </section>
    );
  }

  return (
    <section className="mt-12 rounded-2xl border border-border bg-surface p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Tu pedido</p>
          <h2 className="mt-1 text-2xl font-extrabold">{paquete.nombre} · {pesosRD(precioActual(paquete))}</h2>
        </div>
        <button type="button" onClick={onCambiar} className="text-sm font-semibold text-primary underline">Cambiar paquete</button>
      </div>
      <form onSubmit={(e) => void enviar(e)} className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold">Nombre completo<input className={campo} value={f.nombre} onChange={(e) => set("nombre")(e.target.value)} autoComplete="name" required /></label>
        <label className="block text-sm font-semibold">WhatsApp<input className={campo} value={f.contacto} onChange={(e) => set("contacto")(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="809 555 1234" required /></label>
        <label className="block text-sm font-semibold">Correo (opcional)<input className={campo} type="email" value={f.correo} onChange={(e) => set("correo")(e.target.value)} autoComplete="email" /></label>
        <label className="block text-sm font-semibold">Puesto que buscas<input className={campo} value={f.puesto} onChange={(e) => set("puesto")(e.target.value)} placeholder="Ej.: Auxiliar contable, Servicio al cliente" /></label>
        {paquete.id !== "entrevista" && (
          <label className="block text-sm font-semibold md:col-span-2">Tu CV actual o tu experiencia
            <textarea className={campo} rows={7} value={f.cv} onChange={(e) => set("cv")(e.target.value)} placeholder="Pega aquí tu CV. Si no tienes uno, cuéntanos en tus palabras dónde has trabajado, qué hacías, qué estudiaste y qué sabes hacer. Nosotros lo ordenamos." />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">Si ya hiciste tu CV en <Link to="/cv" className="underline">Mi CV</Link>, aparece aquí automáticamente. También puedes mandarlo por WhatsApp al pagar.</span>
          </label>
        )}
        <label className="block text-sm font-semibold md:col-span-2">{enVivo ? "¿Qué quieres trabajar en la sesión? ¿Qué días y horas te sirven?" : "¿Hay una vacante en la que quieres aplicar? (opcional)"}
          <textarea className={campo} rows={3} value={f.notas} onChange={(e) => set("notas")(e.target.value)} placeholder={enVivo ? "Ej.: tengo una entrevista el jueves; me sirven las tardes después de las 5." : "Pega el enlace o el nombre de la vacante."} />
        </label>
        <label className="flex items-start gap-2 text-sm md:col-span-2">
          <input type="checkbox" className="mt-1 size-4" checked={f.acepto} onChange={(e) => set("acepto")(e.target.checked)} />
          <span>Entiendo que el trabajo empieza cuando se confirma mi pago, que la entrega es en menos de 24 horas y que, si no se cumple, me devuelven mi dinero. Entiendo que esto mejora mi presentación pero no garantiza que me contraten.</span>
        </label>
        {error && <p role="alert" className="text-sm font-semibold text-destructive md:col-span-2">{error}</p>}
        <div className="md:col-span-2">
          <button type="submit" disabled={enviando} className="btn-aplicar inline-flex items-center gap-2 rounded-xl px-8 py-3 text-base disabled:opacity-60">{enviando ? <Loader2 className="size-4 animate-spin" /> : enVivo ? <Video className="size-4" /> : <Sparkles className="size-4" />} Hacer mi pedido</button>
          <p className="mt-2 text-xs text-muted-foreground">No se cobra nada ahora: primero te mostramos cómo pagar.</p>
        </div>
      </form>
    </section>
  );
}


import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { BadgeCheck, CheckCircle2, Clock, FileText, Loader2, MessageCircle, ShieldCheck, Sparkles, Video, Wallet } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useContenido } from "@/lib/contenido";
import { leerCV, cvCompleto, textoCV } from "@/lib/cv";
import { PAQUETES, pesosRD, type Paquete } from "@/lib/impulso";

export const Route = createFileRoute("/impulso")({
  head: () => ({
    meta: [
      { title: "Impulso Laboral: CV profesional y orientación | Enlace Laboral" },
      { name: "description", content: "Te hacemos el CV, la carta y el perfil de LinkedIn, y te orientamos en vivo. Desde RD$500, con entrega en menos de 24 horas." },
      { property: "og:title", content: "Impulso Laboral | Enlace Laboral" },
      { property: "og:description", content: "CV profesional, carta, LinkedIn y orientación en vivo. Entrega en menos de 24 horas." },
    ],
    links: [{ rel: "canonical", href: "https://enlace-rd.vercel.app/impulso" }],
  }),
  component: Impulso,
});

const campo = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none focus:border-primary";

function Impulso() {
  const [elegido, setElegido] = useState<Paquete | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const elegir = (p: Paquete) => {
    setElegido(p);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="hero-dark text-white">
        <div className="mx-auto max-w-5xl px-6 py-14 text-center md:py-20">
          <p className="eyebrow !text-[#8ec1ff]">Impulso Laboral</p>
          <h1 className="entra mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Un CV que abre puertas, listo en menos de 24 horas</h1>
          <p className="entra mx-auto mt-4 max-w-2xl text-base text-white/85 md:text-lg">Escogemos tu paquete, tú pagas por transferencia y nosotros hacemos el trabajo. Sin llamadas, sin vueltas. Y si prefieres hablar con alguien, tienes orientación en vivo.</p>
          <a href="#paquetes" className="btn-aplicar mt-7 inline-block rounded-xl px-7 py-3 text-base">Ver paquetes</a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { i: Sparkles, t: "1. Eliges tu paquete", d: "Llenas un formulario corto con tu CV actual y el puesto que buscas." },
            { i: Wallet, t: "2. Pagas por transferencia", d: "Te mostramos los datos de pago. Envías el comprobante por WhatsApp." },
            { i: Clock, t: "3. Lo recibes en menos de 24 horas", d: "Te lo enviamos por WhatsApp o correo, listo para usar." },
          ].map(({ i: Icono, t, d }) => (
            <li key={t} className="lift rounded-2xl border border-border bg-surface p-5">
              <Icono className="size-6 text-cta" aria-hidden="true" />
              <p className="mt-3 font-bold">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>

        <section id="paquetes" className="mt-14 scroll-mt-24">
          <p className="eyebrow">Paquetes</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Elige lo que necesitas</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {PAQUETES.map((p) => {
              const destacado = p.id === "impulso" || p.id === "despegue";
              return (
                <article key={p.id} className={`lift flex flex-col rounded-2xl border bg-surface p-6 ${destacado ? "border-cta/60" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-extrabold">{p.nombre}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{p.resumen}</p>
                    </div>
                    {p.etiqueta && <span className="shrink-0 rounded-full bg-cta px-3 py-1 text-xs font-bold text-white">{p.etiqueta}</span>}
                  </div>
                  <p className="mt-4 text-3xl font-extrabold text-primary">{pesosRD(p.precio)}</p>
                  <ul className="mt-4 space-y-2 text-sm">
                    {p.incluye.map((x) => (<li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" /><span>{x}</span></li>))}
                  </ul>
                  <p className="mt-4 text-xs font-semibold text-muted-foreground">{p.entrega}</p>
                  <button type="button" onClick={() => elegir(p)} className="btn-aplicar mt-5 rounded-xl py-3 text-base">Quiero este paquete</button>
                </article>
              );
            })}
          </div>
        </section>

        <div ref={formRef} className="scroll-mt-24">{elegido && <Pedido key={elegido.id} paquete={elegido} onCambiar={() => setElegido(null)} />}</div>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            { i: ShieldCheck, t: "Si no llegamos a tiempo, te devolvemos tu dinero", d: "Entregamos en menos de 24 horas desde que confirmamos tu pago." },
            { i: BadgeCheck, t: "Honestidad primero", d: "Mejoramos cómo te presentas. No prometemos que te contraten ni inventamos experiencia que no tienes." },
            { i: FileText, t: "Tu información es tuya", d: "Solo usamos tu CV para hacer tu pedido. No lo publicamos ni lo compartimos sin tu permiso." },
          ].map(({ i: Icono, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-surface p-5">
              <Icono className="size-6 text-primary" aria-hidden="true" />
              <p className="mt-3 font-bold">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </section>

        <p className="mt-8 text-center text-sm text-muted-foreground">¿Prefieres hacerlo tú mismo? <Link to="/cv" className="font-semibold text-primary underline">Crea tu CV gratis</Link>.</p>
      </main>
      <Footer />
    </div>
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
          <h2 className="mt-1 text-2xl font-extrabold">{paquete.nombre} · {pesosRD(paquete.precio)}</h2>
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


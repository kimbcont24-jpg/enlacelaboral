import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, ClipboardPaste, Lock, MessageCircle, ShieldAlert, ShieldCheck, ShieldQuestion, Sparkles, ThumbsUp, Trash2 } from "lucide-react";

import { CalculadoraPagina } from "@/components/site/CalculadoraBase";
import { analizarOferta, EJEMPLOS, type Nivel } from "@/lib/verificador";
import { SITIO } from "@/lib/vacantes";

export const Route = createFileRoute("/herramientas/verificar-oferta")({
  head: () => ({
    meta: [
      { title: "¿Esta oferta de empleo es real o es estafa? Verificador gratis RD | Enlace Laboral" },
      { name: "description", content: "Pega el texto de una vacante que te llegó por WhatsApp, Instagram o Facebook y te decimos qué señales de estafa tiene. Gratis, sin registro y sin guardar nada." },
      { property: "og:title", content: "¿Esta oferta de empleo es real o es estafa? Verifícala gratis" },
      { property: "og:description", content: "Pega la vacante y mira sus señales de alerta en segundos. No guardamos nada." },
    ],
    links: [{ rel: "canonical", href: "https://enlacelaboralrd.com/herramientas/verificar-oferta" }],
  }),
  component: Verificador,
});

const ESTILO: Record<Nivel, { c: string; bg: string; t: string; I: typeof AlertOctagon }> = {
  alto: { c: "#b42318", bg: "#fdecea", t: "Alerta fuerte", I: AlertOctagon },
  medio: { c: "#b45309", bg: "#fff4e0", t: "Ojo", I: AlertTriangle },
  bajo: { c: "#475467", bg: "#eef1f5", t: "A tener en cuenta", I: ShieldQuestion },
};

const VEREDICTO = {
  riesgo: { titulo: "Alto riesgo de estafa", texto: "Esta oferta tiene señales típicas de fraude. No pagues nada, no envíes documentos ni códigos, y no vayas a ningún lugar hasta confirmar que la empresa existe.", I: ShieldAlert, fondo: "linear-gradient(135deg,#7a1010 0%,#d92d20 100%)" },
  cuidado: { titulo: "Revísala con cuidado", texto: "No vimos señales graves, pero hay detalles que debes confirmar antes de dar tus datos o ir a una entrevista.", I: ShieldQuestion, fondo: "linear-gradient(135deg,#7a3e00 0%,#e08a00 100%)" },
  normal: { titulo: "No vimos señales de estafa", texto: "El texto no tiene las señales típicas de fraude. Igual, confirma que la empresa existe antes de entregar tus documentos.", I: ShieldCheck, fondo: "linear-gradient(135deg,#0a4d2c 0%,#0f7a43 100%)" },
} as const;

function Verificador() {
  const [texto, setTexto] = useState("");
  const [revisado, setRevisado] = useState("");
  const r = useMemo(() => (revisado.trim().length >= 30 ? analizarOferta(revisado) : null), [revisado]);
  const corto = texto.trim().length > 0 && texto.trim().length < 30;

  const pegar = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) { setTexto(t); setRevisado(t); } } catch { /* el navegador no dio permiso */ }
  };
  const revisar = () => { setRevisado(texto); requestAnimationFrame(() => document.getElementById("resultado-verif")?.scrollIntoView({ behavior: "smooth", block: "start" })); };
  const probar = (t: string) => { setTexto(t); setRevisado(t); };

  const v = r ? VEREDICTO[r.veredicto] : null;
  const compartir = `https://wa.me/?text=${encodeURIComponent(`Antes de aplicar a una vacante que te llegó por WhatsApp o redes, verifícala gratis aquí. Te dice si tiene señales de estafa:\n${SITIO}/herramientas/verificar-oferta`)}`;

  return (
    <CalculadoraPagina titulo="¿Esta oferta de empleo es real o" resaltado="es estafa?" intro="Pega el texto de la vacante que te llegó por WhatsApp, Instagram, Facebook o Telegram. En segundos te mostramos sus señales de alerta y qué hacer.">
      <section className="rounded-3xl border border-border bg-surface p-6 md:p-8" aria-label="Texto de la oferta">
        <label htmlFor="oferta" className="text-sm font-semibold">Texto de la oferta</label>
        <textarea id="oferta" value={texto} onChange={(e) => setTexto(e.target.value.slice(0, 6000))} rows={8}
          placeholder="Pega aquí el mensaje o la publicación completa, con el contacto incluido…"
          className="mt-2 w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 text-base leading-relaxed outline-none focus:border-primary" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={revisar} disabled={texto.trim().length < 30} className="btn-aplicar inline-flex h-12 items-center gap-2 rounded-xl px-6 disabled:opacity-50"><ShieldCheck className="size-5" aria-hidden="true" /> Verificar oferta</button>
          <button type="button" onClick={() => void pegar()} className="inline-flex h-12 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold hover:border-primary"><ClipboardPaste className="size-4" aria-hidden="true" /> Pegar</button>
          {texto && <button type="button" onClick={() => { setTexto(""); setRevisado(""); }} className="inline-flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"><Trash2 className="size-4" aria-hidden="true" /> Borrar</button>}
        </div>
        {corto && <p className="mt-2 text-sm text-muted-foreground">Pega un poco más de texto para poder revisarlo.</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">¿Quieres ver cómo funciona?</span>
          <button type="button" onClick={() => probar(EJEMPLOS.estafa)} className="rounded-full bg-[#fdecea] px-3 py-1 font-bold text-[#b42318]">Probar con una estafa</button>
          <button type="button" onClick={() => probar(EJEMPLOS.normal)} className="rounded-full bg-[#e6f5ec] px-3 py-1 font-bold text-[#0f7a43]">Probar con una oferta normal</button>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Lock className="size-3.5" aria-hidden="true" /> El texto se revisa en tu propio teléfono o computadora. No lo enviamos ni lo guardamos.</p>
      </section>

      <div id="resultado-verif" className="scroll-mt-24">
        {r && v && (
          <section aria-live="polite" className="mt-8 space-y-6">
            <div className="flex items-start gap-4 rounded-3xl p-6 text-white shadow-[0_30px_60px_-30px_rgb(10_47_92/0.6)] md:p-8" style={{ background: v.fondo }}>
              <v.I className="size-12 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="text-2xl font-extrabold md:text-3xl">{v.titulo}</h2>
                <p className="mt-2 text-white/90">{v.texto}</p>
                <p className="mt-3 text-sm font-semibold text-white/80">{r.senales.length ? `${r.senales.length} ${r.senales.length === 1 ? "señal encontrada" : "señales encontradas"}` : "Ninguna señal de alerta"}{r.positivas.length ? ` · ${r.positivas.length} ${r.positivas.length === 1 ? "punto a favor" : "puntos a favor"}` : ""}</p>
              </div>
            </div>

            {r.senales.length > 0 && (
              <div className="rounded-3xl border border-border bg-surface p-6">
                <h3 className="text-xl font-extrabold">Lo que encontramos</h3>
                <ul className="mt-4 space-y-3">
                  {r.senales.map((s) => {
                    const e = ESTILO[s.nivel];
                    return (
                      <li key={s.id} className="rounded-2xl border-l-4 p-4" style={{ borderColor: e.c, background: e.bg }}>
                        <p className="flex flex-wrap items-center gap-2 font-extrabold" style={{ color: e.c }}><e.I className="size-5" aria-hidden="true" /> {s.titulo} <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">{e.t}</span></p>
                        <p className="mt-1 text-sm text-foreground">{s.explica}</p>
                        {s.frase && <p className="mt-2 rounded-lg bg-white/80 px-3 py-2 font-mono text-xs text-foreground">«{s.frase}»</p>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {r.discrimina.length > 0 && (
              <div className="rounded-3xl border border-[#d8b4fe] bg-[#f5f0ff] p-6">
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#6d28d9]"><AlertTriangle className="size-5" aria-hidden="true" /> Además, esta oferta discrimina</h3>
                <p className="mt-1 text-sm">No es señal de estafa, pero pedir estas cosas va contra la igualdad de oportunidades. Tu talento no depende de esto.</p>
                <ul className="mt-3 space-y-1.5 text-sm">{r.discrimina.map((h) => <li key={h.frase}>• «{h.frase}»: {h.motivo}</li>)}</ul>
                <Link to="/empleo-para-todos" className="mt-3 inline-flex text-sm font-bold text-[#6d28d9] hover:underline">Conoce nuestro compromiso de empleo para todos →</Link>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-surface p-6">
                <h3 className="flex items-center gap-2 text-lg font-extrabold"><ThumbsUp className="size-5 text-success" aria-hidden="true" /> Puntos a favor</h3>
                {r.positivas.length ? (
                  <ul className="mt-3 space-y-2 text-sm">{r.positivas.map((p) => <li key={p.id} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" /> {p.titulo}</li>)}</ul>
                ) : <p className="mt-3 text-sm text-muted-foreground">La oferta no trae datos que den confianza: ni empresa clara, ni salario, ni dirección, ni correo de empresa.</p>}
              </div>
              <div className="rounded-3xl border border-border bg-surface p-6">
                <h3 className="flex items-center gap-2 text-lg font-extrabold"><Sparkles className="size-5 text-primary" aria-hidden="true" /> Qué hacer ahora</h3>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
                  <li><strong>No pagues nada</strong>: ni inscripción, ni uniforme, ni curso, ni trámite.</li>
                  <li>Busca la empresa en Google, LinkedIn o Instagram, confirma su RNC en la página de la DGII y <strong>llama a su número oficial</strong>, no al que te escribió.</li>
                  <li><strong>Nunca compartas</strong> el código que te llega por SMS o WhatsApp, ni tus claves.</li>
                  <li>Ve a entrevistas solo en la empresa o por videollamada, y avisa a alguien de confianza.</li>
                  <li>Si ya te estafaron, denuncia en la Policía Nacional (DICAT, delitos de alta tecnología) y reporta el perfil en la red social.</li>
                </ol>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-[#0a2f5c] p-6 text-white">
              <p className="flex-1 font-semibold">En Enlace revisamos cada vacante y te mostramos la fuente original y el contacto de la empresa.</p>
              <Link to="/vacantes" className="inline-flex h-11 items-center rounded-xl bg-[#ffd84d] px-5 font-extrabold text-[#0a2f5c]">Ver vacantes revisadas</Link>
              <a href={compartir} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1fa855] px-5 text-sm font-bold"><MessageCircle className="size-4" aria-hidden="true" /> Avisar a otros</a>
            </div>
          </section>
        )}
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-5 text-sm text-muted-foreground">
        <h2 className="text-base font-extrabold text-foreground">Cómo funciona</h2>
        <p className="mt-2">Revisamos el texto buscando las señales más comunes de fraude laboral en República Dominicana: cobros, pedidos de dinero o datos, promesas exageradas, trabajos de «likes», ofertas en el extranjero con visa garantizada, prisa y contactos que se esconden. Es una ayuda para decidir, no una garantía: una estafa bien escrita puede pasar sin alertas y una oferta real puede tener alguna. Ante la duda, confirma con la empresa. Lee también nuestros <Link to="/seguridad" className="font-semibold text-primary underline">consejos de seguridad</Link>.</p>
      </section>
    </CalculadoraPagina>
  );
}

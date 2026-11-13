import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";
import { type ComponentType, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Briefcase, Check, ChevronDown, Clock, Copy, DoorOpen, FileText, Handshake, MessagesSquare, Search, Send, ShieldCheck, Sprout, X } from "lucide-react";

import { AlertaForm } from "@/components/site/AlertaForm";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { ETAPAS, GUIAS, type Etapa, type Guia } from "@/lib/guias";

export const Route = createFileRoute("/recursos")({
  head: () => ({
    meta: [
      { title: "Guías cortas para conseguir empleo en RD | Enlace Laboral" },
      { name: "description", content: "CV, correo para aplicar, entrevista, salario, oferta y liquidación: guías cortas con ejemplos listos para copiar, pensadas para quien busca empleo en República Dominicana." },
      { property: "og:title", content: "Guías cortas para conseguir empleo · Enlace Laboral" },
      { property: "og:description", content: "Pasos claros y ejemplos listos para copiar. Se leen en 2 minutos." },
    ],
    links: [{ rel: "canonical", href: "https://enlacelaboralrd.com/recursos" }],
  }),
  component: Recursos,
});

const ICONO: Record<Etapa, ComponentType<{ className?: string; style?: React.CSSProperties }>> = { cv: FileText, aplicar: Send, entrevista: MessagesSquare, oferta: Handshake, primer: Sprout, salida: DoorOpen };
const COLOR: Record<Etapa, string> = { cv: "#1d6ff2", aplicar: "#0e7490", entrevista: "#6d28d9", oferta: "#0f7a43", primer: "#d97706", salida: "#be185d" };

const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Recursos() {
  const [etapa, setEtapa] = useState<Etapa | "todas">("todas");
  const [q, setQ] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);

  // Abrir una guía desde un enlace con #id (por ejemplo, desde la portada).
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id || !GUIAS.some((g) => g.id === id)) return;
    setAbierta(id);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const lista = useMemo(() => {
    const b = sinTildes(q.trim());
    return GUIAS.filter((g) => (etapa === "todas" || g.etapa === etapa) && (!b || sinTildes(`${g.titulo} ${g.resumen} ${g.pasos.join(" ")}`).includes(b)));
  }, [etapa, q]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <header className="hero-dark px-4 pb-24 pt-10 sm:px-6 md:pb-28 md:pt-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-0 size-80 rounded-full bg-[#7ee2a8]/15 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/90 ring-1 ring-white/15"><Briefcase className="size-4 text-[#ffd84d]" aria-hidden="true" /> Guías para tu búsqueda</p>
          <h1 className="mt-4 max-w-3xl text-balance font-display text-[2.1rem] font-extrabold leading-[1.08] md:text-[3rem]">Lo que de verdad miran las empresas <span className="bg-gradient-to-r from-[#ffd84d] to-[#7ee2a8] bg-clip-text text-transparent">al contratar</span></h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">Guías cortas, con pasos claros y ejemplos que puedes copiar. Elige en qué etapa estás.</p>
          <label className="mt-6 flex max-w-xl items-center gap-3 rounded-2xl bg-white px-4 py-3 text-[#0a2f5c] shadow-lg">
            <Search className="size-5 shrink-0 text-[#5b6b80]" aria-hidden="true" />
            <span className="sr-only">Buscar en las guías</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca: correo, salario, entrevista, liquidación…" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#5b6b80]" />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Borrar búsqueda"><X className="size-4" /></button>}
          </label>
        </div>
      </header>

      <main className="px-4 pb-20 sm:px-6"><div className="mx-auto max-w-5xl">
        {/* Etapas */}
        <nav aria-label="¿En qué etapa estás?" className="relative z-10 -mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ETAPAS.map((e) => {
            const I = ICONO[e.id];
            const activo = etapa === e.id;
            const n = GUIAS.filter((g) => g.etapa === e.id).length;
            return (
              <button key={e.id} type="button" aria-pressed={activo} onClick={() => { setEtapa(activo ? "todas" : e.id); setAbierta(null); }}
                className={`lift rounded-2xl border p-4 text-left shadow-[0_18px_40px_-28px_rgb(10_47_92/0.6)] transition ${activo ? "border-transparent text-white" : "border-border bg-surface hover:border-[var(--c)]"}`}
                style={{ "--c": COLOR[e.id], ...(activo ? { background: COLOR[e.id] } : {}) } as React.CSSProperties}>
                <I className={`size-6 ${activo ? "text-white" : ""}`} style={activo ? undefined : { color: COLOR[e.id] }} />
                <p className="mt-2 text-sm font-extrabold leading-tight">{e.t}</p>
                <p className={`mt-0.5 text-xs ${activo ? "text-white/85" : "text-muted-foreground"}`}>{e.d}</p>
                <p className={`mt-2 text-[11px] font-bold ${activo ? "text-white/90" : "text-muted-foreground"}`}>{n} {n === 1 ? "guía" : "guías"}</p>
              </button>
            );
          })}
        </nav>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-muted-foreground">{etapa === "todas" ? "Todas las guías" : ETAPAS.find((e) => e.id === etapa)?.t} · <strong className="text-foreground">{lista.length}</strong></p>
          {(etapa !== "todas" || q) && <button type="button" onClick={() => { setEtapa("todas"); setQ(""); }} className="font-semibold text-primary hover:underline">Ver todas</button>}
        </div>

        {/* Guías */}
        <ol className="mt-3 space-y-3">
          {lista.map((g) => <GuiaItem key={g.id} g={g} abierta={abierta === g.id} alternar={() => setAbierta(abierta === g.id ? null : g.id)} />)}
          {!lista.length && <li className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">No encontramos guías con «{q}». Prueba con otra palabra.</li>}
        </ol>

        {/* Tres reglas */}
        <section aria-labelledby="t-reglas" className="mt-14 grid gap-4 rounded-[2rem] bg-[linear-gradient(135deg,#0a2f5c_0%,#0f4aa8_100%)] p-7 text-white sm:p-10 md:grid-cols-[1fr_2fr]">
          <h2 id="t-reglas" className="font-display text-[1.6rem] font-extrabold leading-tight">Si solo recuerdas tres cosas</h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {[["1", "Adapta cada aplicación", "El nombre del puesto en el asunto y 2 líneas de por qué encajas."], ["2", "Demuestra con ejemplos", "Un logro con número vale más que cinco adjetivos."], ["3", "Nunca pagues por un empleo", "Ni entrevista, ni curso, ni uniforme. Eso es estafa."]].map(([n, t, d]) => (
              <li key={n} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <span className="text-2xl font-extrabold text-[#ffd84d]">{n}</span>
                <p className="mt-1 font-extrabold">{t}</p>
                <p className="mt-1 text-sm text-white/80">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Herramientas */}
        <section aria-labelledby="t-herr" className="mt-14">
          <h2 id="t-herr" className="font-display text-[1.6rem] font-extrabold">Herramientas que te ahorran tiempo</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["/cv", "Hacer mi CV", "Listo en 5 minutos, en PDF."],
              ["/herramientas/salario-neto", "Salario neto", "Cuánto te llega de verdad."],
              ["/herramientas/comparar-ofertas", "Comparar ofertas", "Dinero real y bienestar."],
              ["/herramientas/verificar-oferta", "¿Es estafa?", "Revisa una oferta dudosa."],
            ].map(([to, t, d]) => (
              <Link key={to} to={to as "/cv"} className="lift group rounded-2xl border border-border bg-surface p-5 hover:border-primary">
                <p className="font-extrabold">{t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">Abrir <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </section>

        <section id="alerta" className="mt-14 scroll-mt-24"><AlertaForm /></section>
      </div></main>
      <Footer />
    </div>
  );
}

function GuiaItem({ g, abierta, alternar }: { g: Guia; abierta: boolean; alternar: () => void }) {
  const I = ICONO[g.etapa];
  const c = COLOR[g.etapa];
  const [copiado, setCopiado] = useState(false);
  const copiar = async (t: string) => {
    try { await navigator.clipboard.writeText(t); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sin permiso del navegador */ }
  };
  return (
    <li id={g.id} className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-surface transition ${abierta ? "border-[var(--c)] shadow-[0_24px_48px_-32px_rgb(10_47_92/0.55)]" : "border-border"}`} style={{ "--c": c } as React.CSSProperties}>
      <button type="button" aria-expanded={abierta} onClick={alternar} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: `${c}14`, color: c }}><I className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold leading-snug sm:text-lg">{g.titulo}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">{g.resumen}</span>
        </span>
        <span className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground sm:flex"><Clock className="size-3.5" aria-hidden="true" /> {g.minutos} min</span>
        <ChevronDown className={`size-5 shrink-0 text-muted-foreground transition-transform ${abierta ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {abierta && (
        <div className="vista-entra grid gap-5 border-t border-border p-5 sm:p-6 md:grid-cols-[1.1fr_1fr]">
          <div>
            <ol className="space-y-2.5">
              {g.pasos.map((p, i) => (
                <li key={p} className="flex gap-3 text-[15px] leading-relaxed">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white" style={{ background: c }}>{i + 1}</span>{p}
                </li>
              ))}
            </ol>
            <p className="mt-4 flex gap-2 rounded-xl bg-[#fff4e0] p-3 text-sm text-[#7a4a00]"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span><strong>Error común:</strong> {g.error}</span></p>
            {g.accion && (
              <Link to={g.accion.to as "/cv"} hash={g.accion.hash} search={g.accion.search as never} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white" style={{ background: c }}>
                {g.accion.t} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>
          {g.ejemplo ? (
            <figure className="self-start rounded-2xl border border-border bg-background p-4">
              <figcaption className="flex items-center justify-between gap-2 text-xs font-extrabold uppercase tracking-wide" style={{ color: c }}>
                {g.ejemplo.titulo}
                <button type="button" onClick={() => void copiar(g.ejemplo!.texto)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-[11px] normal-case tracking-normal text-foreground hover:border-primary">
                  {copiado ? <><Check className="size-3.5 text-success" /> Copiado</> : <><Copy className="size-3.5" /> Copiar</>}
                </button>
              </figcaption>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{g.ejemplo.texto}</p>
            </figure>
          ) : (
            <div className="self-start rounded-2xl bg-muted p-4 text-sm text-muted-foreground"><ShieldCheck className="mb-2 size-5 text-success" aria-hidden="true" />Aplica estos pasos en tu próxima postulación. Si te surge una duda, escríbenos por el chat de la página.</div>
          )}
        </div>
      )}
    </li>
  );
}

import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Link2, Share2 } from "lucide-react";

import { AlertaForm } from "@/components/site/AlertaForm";
import { CanalWhatsApp } from "@/components/site/CanalWhatsApp";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { FUENTES, VIGENCIA } from "@/lib/calculos";
import { SITIO } from "@/lib/vacantes";

export const campoCalc = "mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary";
export const rotuloCalc = "text-sm font-semibold";

export function CalculadoraPagina({ titulo, resaltado, intro, children }: { titulo: string; resaltado: string; intro: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="mx-auto max-w-5xl px-6 pb-6 pt-12 md:pt-16">
        <Link to="/herramientas" className="text-sm font-semibold text-primary hover:underline">← Herramientas gratis</Link>
        <h1 className="mt-3 max-w-3xl text-balance text-4xl font-extrabold tracking-tight md:text-5xl">{titulo} <span className="text-primary">{resaltado}</span></h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{intro}</p>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-20">{children}</main>
      <Footer />
    </div>
  );
}

export function CompartirResultado({ texto, ruta, query }: { texto: string; ruta: string; query: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = `${SITIO}${ruta}${query}`;
  const mensaje = `${texto}\n\nCalcula el tuyo gratis:\n${url}`;
  const copiar = async () => {
    try { await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch { window.prompt("Copia este enlace", url); }
  };
  const compartir = async () => {
    if (navigator.share) { try { await navigator.share({ text: mensaje }); return; } catch { return; } }
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener");
  };
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void compartir()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1fa855] px-5 text-sm font-bold text-white hover:bg-[#178c46]"><Share2 className="size-4" /> Compartir resultado</button>
      <button type="button" onClick={() => void copiar()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-5 text-sm font-bold hover:border-primary">{copiado ? <Check className="size-4 text-success" /> : <Link2 className="size-4" />} {copiado ? "Enlace copiado" : "Copiar enlace con mis datos"}</button>
    </div>
  );
}

export function PieCalculadora({ nota }: { nota?: string }) {
  return (
    <>
      <section className="mt-10 rounded-2xl border border-border bg-surface p-5 text-sm text-muted-foreground" aria-labelledby="fuentes-calc">
        <h2 id="fuentes-calc" className="font-bold text-foreground">De dónde salen las cifras (vigentes en {VIGENCIA})</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">{FUENTES.map((f) => (<li key={f.url}><a href={f.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{f.nombre}</a></li>))}</ul>
        <p className="mt-3">{nota} Es un cálculo orientativo. Convenios, contratos y casos particulares pueden cambiar el resultado. Para un reclamo, confirma con el Ministerio de Trabajo o un abogado laboral. No es asesoría legal.</p>
      </section>
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface p-6">
          <h2 className="text-xl font-extrabold">¿Buscas empleo?</h2>
          <p className="mt-2 text-muted-foreground">Mira vacantes reales con el salario a la vista y aplica gratis.</p>
          <Link to="/vacantes" className="btn-aplicar mt-4 inline-flex rounded-xl px-6 py-3">Ver vacantes</Link>
          <div className="mt-3"><CanalWhatsApp variante="boton" /></div>
        </div>
        <AlertaForm compacta />
      </section>
    </>
  );
}

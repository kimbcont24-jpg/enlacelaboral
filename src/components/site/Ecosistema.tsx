import { Bot, Briefcase, Building2, GraduationCap, HeartHandshake, Landmark, Link2, MapPin, School, Sparkles, UserRound, Wrench, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fuentesTalento, preguntasNexa, redInstitucional } from "@/lib/ecosistema";

const icons: Record<string, LucideIcon> = { Briefcase, Building2, GraduationCap, HeartHandshake, Landmark, Link2, MapPin, School, UserRound, Wrench };

function Icono({ name, className }: { name: string; className?: string }) {
  const Cmp = icons[name] ?? Sparkles;
  return <Cmp className={className} strokeWidth={1.75} aria-hidden="true" />;
}

export function RedInstitucional() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-secondary/30 px-6 py-16 md:py-20">
      <div className="relative mx-auto max-w-7xl">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">Una red que conecta <span className="text-shine">todo el ecosistema laboral</span></h2>
        <p className="mt-3 max-w-xl text-muted-foreground">No importa dónde esté el talento. Enlace lo conecta.</p>
        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {redInstitucional.slice(0, 5).map((n) => (
              <div key={n.nombre} className="lift flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium"><Icono name={n.icono} className="size-4 text-primary" />{n.nombre}</div>
            ))}
          </div>
          <div className="grad-primary relative mx-auto flex size-36 items-center justify-center rounded-full text-center text-primary-foreground shadow-[var(--shadow-glow)] md:size-44">
            <span className="relative px-5 text-sm font-extrabold uppercase leading-tight tracking-tight">Enlace Laboral</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {redInstitucional.slice(5).map((n) => (
              <div key={n.nombre} className="lift flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium"><Icono name={n.icono} className="size-4 text-primary" />{n.nombre}</div>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8">
          <h3 className="text-xl font-bold">Conectamos talento desde múltiples fuentes</h3>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {fuentesTalento.map((f) => (<span key={f} className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium">{f}</span>))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function NexaSection() {
  return (
    <section className="hero-dark relative overflow-hidden border-t border-border px-6 py-16 text-primary-foreground md:py-20">
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3 py-1 font-mono text-[10px] uppercase tracking-widest"><Bot className="size-3.5" aria-hidden="true" /> Enlace IA</span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-5xl">Conoce a Nexa</h2>
          <p className="mt-3 text-lg text-primary-foreground/75">Tu asistente laboral inteligente.</p>
          <Button type="button" onClick={() => window.dispatchEvent(new Event("abrir-nexa"))} className="mt-8 h-12 rounded-xl bg-primary px-6 font-bold text-primary-foreground"><Sparkles className="size-4" /> Hablar con Nexa</Button>
        </div>
        <div className="rounded-3xl border border-primary-foreground/15 bg-primary-foreground/5 p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary-foreground/50">Puedes preguntarle</p>
          <div className="mt-4 space-y-3">
            {preguntasNexa.map((p) => (<div key={p} className="rounded-2xl bg-primary-foreground/10 px-4 py-3 text-sm">{p}</div>))}
          </div>
        </div>
      </div>
    </section>
  );
}

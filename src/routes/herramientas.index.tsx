import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Calculator, Compass, Gift, Radar, Scale, ShieldCheck, Trophy } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/herramientas/")({
  head: () => ({
    meta: [
      { title: "Herramientas gratis para trabajadores en RD | Enlace Laboral" },
      { name: "description", content: "Calculadora de regalía pascual, salario neto, liquidación, prestaciones laborales y comparador de ofertas de trabajo de República Dominicana. Gratis, sin registro." },
    ],
    links: [{ rel: "canonical", href: "https://enlace-rd.vercel.app/herramientas" }],
  }),
  component: Herramientas,
});

const items = [
  { to: "/insignias", icono: BadgeCheck, titulo: "Demuestra lo que sabes hacer", texto: "Pruebas cortas de Perfila: servicio al cliente, Excel y Word, ortografía o caja. Si logras el nivel, tu insignia verificada sale en tu CV.", etiqueta: "Nuevo · Insignias con Perfila" },
  { to: "/salarios", icono: Radar, titulo: "¿Cuánto pagan por tu puesto?", texto: "Radar salarial: salarios publicados en vacantes reales, por puesto, área y provincia. Te decimos cuántas vacantes hay detrás de cada cifra.", etiqueta: "Nuevo · Radar salarial" },
  { to: "/herramientas/regalia-pascual", icono: Gift, titulo: "¿Cuánto te toca de regalía pascual?", texto: "Tu doble sueldo 2026 en segundos: si trabajaste todo el año, si empezaste este año, si te fuiste o si tu salario cambió.", etiqueta: "Doble sueldo 2026" },
  { to: "/herramientas/salario-neto", icono: Calculator, titulo: "¿Cuánto te llega de tu salario?", texto: "Descuentos de AFP, SFS e ISR al detalle. También: qué bruto necesitas para ganar el neto que quieres.", etiqueta: "Salario neto 2026" },
  { to: "/herramientas/liquidacion", icono: Scale, titulo: "¿Cuánto te deben de liquidación?", texto: "Preaviso, cesantía, vacaciones y regalía pascual según el Código de Trabajo.", etiqueta: "Prestaciones laborales" },
  { to: "/herramientas/comparar-ofertas", icono: Trophy, titulo: "¿Qué oferta de trabajo te conviene más?", texto: "Compara dos ofertas (o tu trabajo actual contra una nueva): salario neto, pasaje, horas en el tapón, beneficios y cómo te sentirías ahí.", etiqueta: "Comparador de ofertas" },
  { to: "/herramientas/brujula", icono: Compass, titulo: "¿Para qué trabajo eres bueno?", texto: "Brújula del primer empleo: 12 preguntas sobre lo que te gusta y haces bien. Te dice qué áreas van contigo y te muestra vacantes sin experiencia.", etiqueta: "Nuevo · Primer empleo" },
  { to: "/herramientas/verificar-oferta", icono: ShieldCheck, titulo: "¿Esta oferta es real o es estafa?", texto: "Pega la vacante que te llegó por WhatsApp o redes y mira sus señales de alerta en segundos. No guardamos nada.", etiqueta: "Nuevo · Verificador de ofertas" },
] as const;

function Herramientas() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="mx-auto max-w-5xl px-6 pb-8 pt-14 md:pt-20">
        <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight md:text-6xl">Herramientas gratis para <span className="text-primary">tu trabajo.</span></h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Cálculos claros, con las leyes de República Dominicana y sus fuentes a la vista. Sin registro.</p>
      </header>
      <main className="mx-auto grid max-w-5xl gap-6 px-6 pb-20 md:grid-cols-2">
        {items.map((i) => (
          <Link key={i.to} to={i.to} className="lift group rounded-3xl border border-border bg-surface p-7 transition hover:border-primary">
            <i.icono className="size-9 text-primary" aria-hidden="true" />
            <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-primary">{i.etiqueta}</p>
            <h2 className="mt-1 text-2xl font-extrabold">{i.titulo}</h2>
            <p className="mt-2 text-muted-foreground">{i.texto}</p>
            <span className="mt-5 inline-flex items-center gap-2 font-bold text-primary">{i.to === "/salarios" ? "Explorar" : i.to === "/insignias" ? "Ganar mi insignia" : "Calcular"} <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </Link>
        ))}
        <p className="text-sm text-muted-foreground md:col-span-2">Son cálculos orientativos. Para un reclamo, confirma con el Ministerio de Trabajo.</p>
      </main>
      <Footer />
    </div>
  );
}

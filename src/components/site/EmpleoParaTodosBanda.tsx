import { Link } from "@tanstack/react-router";
import { Accessibility, GraduationCap, HeartHandshake, Sprout, Users } from "lucide-react";

/** Franja de la portada: caminos para quienes más cuesta conseguir empleo. */
export function EmpleoParaTodosBanda() {
  const caminos = [
    { href: "/empleo-para-todos#primer-empleo", I: Sprout, t: "Mi primer empleo" },
    { href: "/empleo-para-todos#discapacidad", I: Accessibility, t: "Con discapacidad" },
    { href: "/empleo-para-todos#toda-edad", I: Users, t: "40 años o más" },
    { href: "/empleo-para-todos#estudiantes", I: GraduationCap, t: "Estudiantes" },
  ];
  return (
    <section className="px-4 pb-12 sm:px-6" aria-labelledby="t-para-todos">
      <div className="mx-auto grid max-w-6xl items-center gap-6 rounded-3xl border border-[#0f7a43]/25 bg-[#0f7a43]/[0.05] p-6 sm:p-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[#0b5e33]"><HeartHandshake className="size-4" aria-hidden="true" /> Cero discriminación</p>
          <h2 id="t-para-todos" className="mt-1 font-display text-2xl font-extrabold">Empleo para todas las personas</h2>
          <p className="mt-1 max-w-xl text-muted-foreground">Aquí no se publican avisos que piden edad, sexo o foto. Encuentra empresas que se comprometen con la inclusión.</p>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          {caminos.map(({ href, I, t }) => <li key={href}><Link to={href as "/empleo-para-todos"} className="flex h-full items-center gap-2 rounded-xl bg-surface px-3.5 py-3 text-sm font-bold ring-1 ring-border hover:ring-[#0f7a43]"><I className="size-5 shrink-0 text-[#0b5e33]" aria-hidden="true" />{t}</Link></li>)}
        </ul>
      </div>
    </section>
  );
}

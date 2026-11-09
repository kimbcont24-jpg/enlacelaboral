import { createFileRoute, Link } from "@tanstack/react-router";
import { Accessibility, Handshake, Link2, Scale, Sparkles, Users } from "lucide-react";

import { Bloque, PaginaLegal } from "@/components/site/Legal";

export const Route = createFileRoute("/nosotros")({
  head: () => ({ meta: [{ title: "Quiénes somos | Enlace Laboral" }, { name: "description", content: "Enlace Laboral es una plataforma dominicana que une a personas que buscan empleo con empresas, universidades, INFOTEP y fundaciones. Gratis para candidatos y sin discriminación." }] }),
  component: Nosotros,
});

const CREEMOS: { I: typeof Users; t: string; d: string }[] = [
  { I: Scale, t: "Claridad", d: "Vacantes con información completa y, cuando se puede, con salario. Nada de anuncios a medias." },
  { I: Accessibility, t: "Empleo para todas las personas", d: "Primer empleo, personas con discapacidad, cualquier edad. Aquí no se publica nada que discrimine." },
  { I: Handshake, t: "Confianza", d: "Empresas revisadas, cero cobros a candidatos y tus datos protegidos." },
  { I: Sparkles, t: "Herramientas útiles", d: "CV gratis, alertas, jornadas de empleo y un panel sencillo para las empresas." },
];

function Nosotros() {
  return (
    <PaginaLegal actual="/nosotros" etiqueta="Hecho en República Dominicana" titulo="Somos el enlace entre el talento y las oportunidades" intro={<p>Enlace Laboral nace de la experiencia en reclutamiento en República Dominicana, para que buscar y ofrecer empleo sea más fácil, más claro y más justo.</p>}
      resumen={[
        { I: Users, t: "Para quien busca empleo", d: "Aplica gratis, sin cuenta y desde el celular." },
        { I: Link2, t: "Para empresas", d: "Publica gratis y maneja a tus candidatos en un solo lugar." },
        { I: Handshake, t: "Para aliados", d: "Universidades, INFOTEP, fundaciones e instituciones." },
      ]}
      indice={[["que", "Qué hacemos"], ["creemos", "En qué creemos"], ["enlace", "Por qué «Enlace»"], ["unete", "Súmate"]]}>
      <Bloque id="que" titulo="Qué hacemos">
        <p>Reunimos vacantes reales de empresas, instituciones y fuentes públicas de todo el país, y las mostramos claras y fáciles de entender. Quien busca empleo aplica en minutos. Las empresas reciben a sus candidatos en un panel donde los ordenan, los entrevistan y les responden.</p>
      </Bloque>
      <Bloque id="creemos" titulo="En qué creemos">
        <ul className="grid gap-3 sm:grid-cols-2">
          {CREEMOS.map((c) => <li key={c.t} className="rounded-2xl border border-border p-4"><c.I className="size-5 text-[#1557c4]" aria-hidden="true" /><p className="mt-2 font-extrabold">{c.t}</p><p className="mt-1 text-sm text-muted-foreground">{c.d}</p></li>)}
        </ul>
      </Bloque>
      <Bloque id="enlace" titulo="Por qué «Enlace»">
        <p>Porque no queremos ser solo una lista de anuncios. Queremos conectar a quien busca su primer empleo con la empresa que está dispuesta a enseñarle, a la universidad con las pasantías, a las fundaciones con empresas inclusivas, y a todos con información clara.</p>
      </Bloque>
      <Bloque id="unete" titulo="Súmate">
        <div className="flex flex-wrap gap-2">
          <Link to="/vacantes" className="btn-aplicar inline-flex h-11 items-center rounded-xl px-5 text-sm">Ver vacantes</Link>
          <Link to="/empresas" className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-bold hover:border-primary">Publicar una vacante</Link>
          <Link to="/alianzas" className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-bold hover:border-primary">Ser aliado</Link>
        </div>
      </Bloque>
    </PaginaLegal>
  );
}

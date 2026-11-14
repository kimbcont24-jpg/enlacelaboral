import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Eye, MessageSquareReply, Send, UserCheck, Users } from "lucide-react";

import { faltaParaSello, guardarReclamo, type Audiencia, type Sello } from "@/lib/motivar-empresas";

/**
 * Para empresas que salen en Enlace (por vacantes que reunimos) pero aún no tienen cuenta.
 * Les muestra con datos reales lo que ya tienen aquí: gente que vio sus vacantes, aplicó o la sigue.
 */
export function ReclamaEmpresa({ slug, nombre, a, vacantes, puntaje, sello }: { slug: string; nombre: string; a: Audiencia | null | undefined; vacantes: number; puntaje: number | null; sello: Sello | null }) {
  const cifras = [
    a && a.vistas > 0 && { I: Eye, n: a.vistas, t: a.vistas === 1 ? "vista de sus vacantes este mes" : "vistas de sus vacantes este mes" },
    a && a.aplicaciones > 0 && { I: Send, n: a.aplicaciones, t: a.aplicaciones === 1 ? "persona aplicó desde Enlace" : "personas aplicaron desde Enlace" },
    a && a.seguidores > 0 && { I: Users, n: a.seguidores, t: a.seguidores === 1 ? "persona sigue a la empresa" : "personas siguen a la empresa" },
  ].filter(Boolean) as { I: typeof Eye; n: number; t: string }[];
  const falta = puntaje != null ? faltaParaSello(puntaje, vacantes) : null;
  const reclamar = () => guardarReclamo(slug, nombre);

  return (
    <section aria-labelledby="reclama-t" className="relative mt-4 overflow-hidden rounded-3xl border border-[#1d6ff2]/25 bg-gradient-to-br from-[#eef4ff] via-white to-[#fff8e6] p-5 sm:p-6">
      <div aria-hidden="true" className="absolute -right-16 -top-16 size-48 rounded-full bg-[#1d6ff2]/10 blur-2xl" />
      <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#0a2f5c] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white"><Building2 className="size-3.5" /> ¿Trabajas en {nombre}?</p>
          <h2 id="reclama-t" className="mt-2.5 font-display text-xl font-bold leading-tight tracking-tight sm:text-2xl">
            {cifras.length ? "Tu empresa ya tiene público en Enlace. Reclama tu perfil gratis." : "Este perfil ya existe. Reclámalo gratis y hazlo tuyo."}
          </h2>
          {cifras.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {cifras.map(({ I, n, t }) => <li key={t} className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm shadow-sm"><I className="size-4 text-[#1d6ff2]" /><b className="tabular-nums">{n.toLocaleString("es-DO")}</b> {t}</li>)}
            </ul>
          ) : (
            <p className="mt-1.5 text-sm text-muted-foreground">Publicamos {vacantes ? `${vacantes === 1 ? "su vacante" : `sus ${vacantes} vacantes`}` : "sus vacantes"} porque {vacantes === 1 ? "es pública" : "son públicas"}. Con tu cuenta las manejas tú, directo y sin costo.</p>
          )}
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <li className="flex items-start gap-2"><UserCheck className="mt-0.5 size-4 shrink-0 text-[#0f7a43]" /> Recibe a quien aplica en tu panel, con su CV</li>
            <li className="flex items-start gap-2"><MessageSquareReply className="mt-0.5 size-4 shrink-0 text-[#0f7a43]" /> Responde en público a las opiniones</li>
            <li className="flex items-start gap-2"><Building2 className="mt-0.5 size-4 shrink-0 text-[#0f7a43]" /> Pon tu logo, fotos y beneficios</li>
            <li className="flex items-start gap-2"><Users className="mt-0.5 size-4 shrink-0 text-[#0f7a43]" /> Mira cuántas personas esperan tus vacantes</li>
          </ul>
          {!sello && falta && <p className="mt-3 text-xs text-muted-foreground">Con {falta.puntaje > 0 ? `${falta.puntaje} puntos más de claridad` : `${falta.vacantes} vacante${falta.vacantes === 1 ? "" : "s"} más`} gana el sello {falta.t}. Publicar con sueldo es lo que más suma.</p>}
        </div>
        <div className="grid gap-2 md:w-60">
          <Link to="/auth" search={{ modo: "registro", empresa: nombre }} onClick={reclamar} className="btn-aplicar inline-flex h-12 items-center justify-center gap-2 rounded-full px-5">Reclamar mi empresa <ArrowRight className="size-4" /></Link>
          <Link to="/auth" onClick={reclamar} className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-bold hover:bg-secondary">Ya tengo cuenta</Link>
          <p className="text-center text-[11px] text-muted-foreground">Gratis. Revisamos tu RNC antes de unir el perfil.</p>
        </div>
      </div>
    </section>
  );
}

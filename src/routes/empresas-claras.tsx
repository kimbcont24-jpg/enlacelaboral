import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Award, Check, Info, Share2, Trophy } from "lucide-react";
import { toast } from "sonner";

import { SelloEmpresa } from "@/components/empresa/Sello";
import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { NIVELES_SELLO, NOMBRE_SELLO, rankingEmpresas, type FilaRanking } from "@/lib/motivar-empresas";
import { fetchPublicadas, SITIO } from "@/lib/vacantes";

const MES = new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric", timeZone: "America/Santo_Domingo" });

export const Route = createFileRoute("/empresas-claras")({
  loader: async () => {
    const todas = await fetchPublicadas().catch(() => []);
    const filas = rankingEmpresas(todas);
    const conSueldo = todas.length ? Math.round((todas.filter((j) => j.salarioMin > 0).length / todas.length) * 100) : 0;
    return { filas, vacantes: todas.length, conSueldo, mes: MES.format(new Date()) };
  },
  head: ({ loaderData }) => {
    const n = loaderData?.filas.filter((f) => f.sello).length ?? 0;
    const title = `Empresas que publican claro en RD · ${loaderData?.mes ?? ""} | Enlace Laboral`;
    const desc = `Ranking de las empresas dominicanas que publican vacantes con sueldo, requisitos, funciones y cómo aplicar. ${n ? `${n} empresas tienen el sello este mes.` : ""}`;
    return { meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }], links: [{ rel: "canonical", href: `${SITIO}/empresas-claras` }] };
  },
  component: EmpresasClaras,
});

function EmpresasClaras() {
  const d = Route.useLoaderData();
  const [area, setArea] = useState("");
  const conSello = useMemo(() => d.filas.filter((f) => f.sello), [d.filas]);
  const areas = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of conSello) for (const a of f.areas) m.set(a, (m.get(a) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([a]) => a);
  }, [conSello]);
  const lista = area ? conSello.filter((f) => f.areas.includes(area)) : conSello;
  const podio = area ? [] : conSello.slice(0, 3);
  const resto = area ? lista : lista.slice(3);
  const cuenta = (n: string) => conSello.filter((f) => f.sello?.nivel === n).length;

  const compartir = async () => {
    const url = `${SITIO}/empresas-claras`;
    const texto = `Estas son las empresas dominicanas que publican sus vacantes con sueldo y requisitos claros (${d.mes}).`;
    try {
      if (navigator.share) await navigator.share({ title: NOMBRE_SELLO, text: texto, url });
      else { await navigator.clipboard.writeText(`${texto} ${url}`); toast.success("Enlace copiado"); }
    } catch { /* cancelado */ }
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <Header />
      <section className="relative overflow-hidden bg-[#0a2f5c] text-white">
        <div aria-hidden="true" className="absolute -left-24 -top-24 size-96 rounded-full bg-[#1d6ff2] opacity-50 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-32 right-0 size-96 rounded-full bg-[#f5a700] opacity-30 blur-3xl" />
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider"><Trophy className="size-4 text-[#ffd84d]" /> Ranking de {d.mes}</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">{NOMBRE_SELLO}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">Las empresas que dicen el sueldo, los requisitos, las funciones y cómo aplicar. Porque saber lo que te espera quita la ansiedad de aplicar a ciegas.</p>
          <dl className="mt-7 flex flex-wrap gap-3">
            {[[conSello.length, "empresas con sello"], [cuenta("oro"), "con sello Oro"], [d.vacantes, "vacantes revisadas"], [`${d.conSueldo}%`, "de las vacantes dice el sueldo"]].map(([n, t]) => (
              <div key={String(t)} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur"><dd className="font-display text-2xl font-bold">{typeof n === "number" ? n.toLocaleString("es-DO") : n}</dd><dt className="text-xs font-semibold text-white/70">{t}</dt></div>
            ))}
          </dl>
          <button type="button" onClick={() => void compartir()} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 font-bold text-[#0a2f5c]"><Share2 className="size-4" /> Compartir el ranking</button>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {conSello.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface p-8 text-center">
            <p className="font-extrabold">Este mes todavía ninguna empresa llega al sello.</p>
            <p className="mt-1 text-muted-foreground">Basta con publicar vacantes con sueldo, requisitos y funciones.</p>
          </div>
        ) : (
          <>
            {areas.length > 1 && (
              <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar por área">
                {["", ...areas].map((a) => <button key={a || "todas"} type="button" onClick={() => setArea(a)} aria-pressed={area === a} className={`rounded-full px-4 py-2 text-sm font-bold ${area === a ? "bg-[#0a2f5c] text-white" : "border border-border bg-surface hover:bg-secondary"}`}>{a || "Todas las áreas"}</button>)}
              </div>
            )}

            {podio.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                {podio.map((f, i) => <Podio key={f.slug} f={f} puesto={i + 1} />)}
              </div>
            )}

            {resto.length > 0 && (
              <ol className="mt-6 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface" start={podio.length + 1}>
                {resto.map((f, i) => (
                  <li key={f.slug}>
                    <Link to="/empresa/$id" params={{ id: f.slug }} className="grid grid-cols-[2rem_auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 hover:bg-[#f7f9fd] sm:grid-cols-[2.5rem_auto_minmax(0,1fr)_9rem_auto]">
                      <span className="text-center font-display text-lg font-bold text-muted-foreground tabular-nums">{podio.length + i + 1}</span>
                      <EmpresaAvatar nombre={f.nombre} className="size-10 text-base" />
                      <span className="min-w-0"><span className="block truncate font-bold">{f.nombre}</span><span className="block truncate text-xs text-muted-foreground">{f.vacantes} {f.vacantes === 1 ? "vacante" : "vacantes"} · {f.conSueldo}% con sueldo{f.areas[0] ? ` · ${f.areas[0]}` : ""}</span></span>
                      <span className="hidden items-center gap-2 sm:flex"><span className="h-2 flex-1 overflow-hidden rounded-full bg-[#e7ebf2]"><span className="block h-full rounded-full bg-[#0f7a43]" style={{ width: `${f.puntaje}%` }} /></span><span className="w-8 text-right text-sm font-bold tabular-nums">{f.puntaje}</span></span>
                      {f.sello && <SelloEmpresa s={f.sello} />}
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="rounded-3xl border border-border bg-surface p-6 md:p-7">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Info className="size-5 text-[#1d6ff2]" /> Cómo lo medimos</h2>
            <p className="mt-2 text-muted-foreground">Revisamos cada vacante publicada en Enlace en los últimos 30 días. Cada una suma por estos 6 datos, y el puntaje de la empresa es el promedio de sus vacantes (de 0 a 100). El sello mide la información que la empresa da, no si es buena o mala para trabajar: para eso están las opiniones de su perfil.</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {["Dice el salario (un rango también cuenta)", "Dice el nombre de la empresa", "Tiene requisitos claros", "Explica funciones u horario", "Dice cómo aplicar", "Tiene una fuente que se puede verificar"].map((t) => <li key={t} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-[#0f7a43]" />{t}</li>)}
            </ul>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {NIVELES_SELLO.map((n) => (
                <div key={n.nivel} className="rounded-2xl border border-border p-4">
                  <SelloEmpresa s={{ ...n, siguiente: null }} />
                  <p className="mt-2 text-sm"><b>{n.puntaje} puntos o más</b> y al menos {n.vacantes} {n.vacantes === 1 ? "vacante" : "vacantes"} en el mes.</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No incluimos empresas confidenciales ni consultoras de reclutamiento. El ranking cambia todos los días con las vacantes nuevas.</p>
          </section>

          <aside className="h-fit space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-[#0a2f5c] p-6 text-white">
              <Award className="size-8 text-[#ffd84d]" />
              <p className="mt-2 text-lg font-extrabold leading-tight">¿Tu empresa no aparece?</p>
              <p className="mt-1.5 text-sm text-white/80">Publica gratis con sueldo y requisitos. Las vacantes claras salen primero y tu empresa gana su sello, con una insignia para presumirlo en tus redes.</p>
              <Link to="/empresas" className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 font-bold text-[#0a2f5c]">Publicar gratis <ArrowRight className="size-4" /></Link>
            </div>
            <Link to="/vacantes" className="block rounded-3xl border border-border bg-surface p-5 hover:border-[#0f7a43]">
              <p className="font-extrabold">¿Buscas empleo?</p>
              <p className="mt-1 text-sm text-muted-foreground">En vacantes, toca el filtro «Vacantes claras 6/6» y ve solo las que dicen todo.</p>
            </Link>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Podio({ f, puesto }: { f: FilaRanking; puesto: number }) {
  const medalla = ["#f5a700", "#9aa6b8", "#c9763a"][puesto - 1]!;
  return (
    <Link to="/empresa/$id" params={{ id: f.slug }} className={`group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 transition-shadow hover:shadow-[0_20px_40px_-25px_rgb(10_47_92/0.5)] ${puesto === 1 ? "md:-translate-y-2" : ""}`}>
      <span aria-hidden="true" className="absolute -right-3 -top-6 font-display text-[7rem] font-bold leading-none opacity-[0.08]" style={{ color: medalla }}>{puesto}</span>
      <span className="grid size-9 place-items-center rounded-full font-display text-lg font-bold text-white shadow" style={{ backgroundColor: medalla }}>{puesto}</span>
      <div className="mt-4 flex items-center gap-3">
        <EmpresaAvatar nombre={f.nombre} className="size-14 text-2xl" />
        <div className="min-w-0"><p className="truncate font-display text-lg font-bold leading-tight group-hover:underline">{f.nombre}</p>{f.sello && <SelloEmpresa s={f.sello} className="mt-1" />}</div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-[#f3f6fb] p-2"><dd className="font-display text-xl font-bold">{f.puntaje}</dd><dt className="text-[11px] font-semibold text-muted-foreground">puntos</dt></div>
        <div className="rounded-xl bg-[#f3f6fb] p-2"><dd className="font-display text-xl font-bold">{f.vacantes}</dd><dt className="text-[11px] font-semibold text-muted-foreground">vacantes</dt></div>
        <div className="rounded-xl bg-[#f3f6fb] p-2"><dd className="font-display text-xl font-bold">{f.conSueldo}%</dd><dt className="text-[11px] font-semibold text-muted-foreground">con sueldo</dt></div>
      </dl>
    </Link>
  );
}

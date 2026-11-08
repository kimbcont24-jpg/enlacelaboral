import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, MapPin, Search, Send, Sparkles } from "lucide-react";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { useApply } from "@/components/site/apply-context";
import { cvCompleto, type CV } from "@/lib/cv";
import { viaAplicar } from "@/lib/mensajes";
import { usePostulaciones } from "@/lib/postulaciones";
import { recomendar } from "@/lib/recomendar";
import { useVacantes, type Vacante } from "@/lib/vacantes";

const TODAS = "Todo el país";

/** Al final del CV: vacantes reales para aplicar con un toque, con el CV incluido. */
export function EnviarCV({ cv }: { cv: CV }) {
  const { jobs, cargando } = useVacantes();
  const { lista, yaAplico } = usePostulaciones();
  const aplicar = useApply();
  const [q, setQ] = useState("");
  const [prov, setProv] = useState(TODAS);
  const [ver, setVer] = useState(9);
  const completo = cvCompleto(cv);

  const recomendadas = useMemo(() => recomendar(cv, jobs, new Set(), 60), [cv, jobs]);
  const porque = useMemo(() => new Map(recomendadas.map((r) => [r.job.id, r.porque])), [recomendadas]);
  const provincias = useMemo(() => [TODAS, ...[...new Set(jobs.map((j) => j.provincia))].sort()], [jobs]);

  const busca = q.trim().toLowerCase();
  const base: Vacante[] = busca || prov !== TODAS
    ? jobs.filter((j) => (!busca || `${j.titulo} ${j.empresa} ${j.requisitos.join(" ")}`.toLowerCase().includes(busca)) && (prov === TODAS || j.provincia === prov))
    : [...recomendadas.map((r) => r.job), ...jobs.filter((j) => !porque.has(j.id))];
  const listaVer = base.slice(0, ver);
  const enviadas = lista.length;

  return (
    <section id="enviar-cv" className="no-print mt-12 scroll-mt-24 overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="hero-dark px-5 py-7 sm:px-8">
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Envía tu CV a vacantes reales</h2>
            <p className="mt-1 max-w-2xl text-white/80">Toca «Aplicar con mi CV» y tu CV va incluido. Sin cuenta, sin volver a escribir nada.</p>
          </div>
          {enviadas > 0 && <Link to="/guardadas" search={{ ver: "postulaciones" }} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/20">Has aplicado a {enviadas} · Ver seguimiento</Link>}
        </div>
      </div>
      <div className="p-5 sm:p-8">
        {!completo && <p className="mb-4 flex items-start gap-2 rounded-xl bg-[#c27803]/10 p-3 text-sm text-[#8a5200]"><AlertTriangle className="mt-0.5 size-4 shrink-0" /> Pon tu nombre y tu teléfono o correo en «Tus datos» para que tu CV vaya incluido al aplicar.</p>}
        <div className="grid gap-2 sm:grid-cols-[1fr_14rem]">
          <label className="relative"><span className="sr-only">Buscar vacantes</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => { setQ(e.target.value); setVer(9); }} placeholder="Busca por puesto, empresa o palabra" className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-[15px]" /></label>
          <select value={prov} onChange={(e) => { setProv(e.target.value); setVer(9); }} aria-label="Provincia" className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-semibold">{provincias.map((p) => <option key={p}>{p}</option>)}</select>
        </div>
        {!busca && prov === TODAS && recomendadas.length > 0 && <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#1557c4]"><Sparkles className="size-4" /> Primero las que más se parecen a tu CV</p>}
        {cargando ? <p className="mt-6 text-sm text-muted-foreground">Cargando vacantes…</p> : listaVer.length === 0 ? <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No encontramos vacantes con esa búsqueda.</p> : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listaVer.map((j) => {
              const ya = yaAplico(j.id);
              const pq = porque.get(j.id);
              return (
                <li key={j.id} className="flex flex-col rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <EmpresaAvatar nombre={j.empresa} className="size-10 text-base" />
                    <div className="min-w-0 flex-1">
                      <Link to="/vacantes/$id" params={{ id: j.id }} className="block font-extrabold leading-snug hover:text-[#1557c4]">{j.titulo}</Link>
                      <p className="truncate text-sm text-muted-foreground">{j.empresa}</p>
                    </div>
                  </div>
                  {j.salarioMin > 0 && <p className="mt-2 font-extrabold tabular-nums text-success">{j.salario} <span className="text-xs font-semibold text-muted-foreground">al mes</span></p>}
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3.5" /> {j.provincia} · {viaAplicar(j).texto}</p>
                  {pq && pq.length > 0 && <p className="mt-2 flex flex-wrap gap-1 text-[11px]"><span className="font-semibold text-muted-foreground">Coincide:</span>{pq.map((x) => <span key={x} className="rounded bg-[#1d6ff2]/10 px-1.5 font-semibold text-[#1557c4]">{x}</span>)}</p>}
                  <div className="mt-auto pt-3">
                    {ya ? <span className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-success/10 text-sm font-bold text-success"><CheckCircle2 className="size-4" /> Ya aplicaste</span>
                      : <button type="button" onClick={() => aplicar(j)} className="btn-aplicar flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm"><Send className="size-4" /> Aplicar con mi CV</button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {base.length > ver && <button type="button" onClick={() => setVer((v) => v + 9)} className="mx-auto mt-5 flex h-11 items-center rounded-xl border border-border px-6 text-sm font-bold text-[#1557c4] hover:border-[#1d6ff2]">Ver más vacantes ({base.length - ver})</button>}
      </div>
    </section>
  );
}

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Copy, ExternalLink, MoreHorizontal, Pause, Pencil, Play, Plus, RefreshCw, Share2, Star, Users, XCircle } from "lucide-react";

import { usePanel } from "@/components/panel/contexto";
import { btnLinea, Titulo, Vacio } from "@/components/panel/comun";
import { Barra } from "@/components/panel/Inicio";
import { ClaridadPill } from "@/components/site/JobCard";
import { diasRestantes } from "@/lib/claridad";
import { ETAPAS, estadoVacante, planActivo } from "@/lib/panel";
import { enlaceWhatsApp, type Vacante } from "@/lib/vacantes";

type Filtro = "abiertas" | "revision" | "cerradas";

export function VacantesEmpresa() {
  const p = usePanel();
  const [filtro, setFiltro] = useState<Filtro>("abiertas");
  const grupo = (v: Vacante): Filtro => { const e = estadoVacante(v).id; return e === "revision" ? "revision" : e === "cerrada" || e === "pausada" ? "cerradas" : "abiertas"; };
  const lista = p.vacantes.filter((v) => grupo(v) === filtro);
  const cuenta = (f: Filtro) => p.vacantes.filter((v) => grupo(v) === f).length;

  if (!p.vacantes.length) {
    return (<><Titulo titulo="Vacantes" /><Vacio titulo="Publica tu primera vacante gratis" texto="Toma dos minutos. Las personas aplican aquí mismo y te llegan a este panel."><button type="button" onClick={() => p.ir("publicar")} className="btn-aplicar h-12 rounded-xl px-6">Publicar vacante</button></Vacio></>);
  }

  return (
    <>
      <Titulo titulo="Vacantes" sub="Cada vacante se ve 30 días. Renuévala o ciérrala cuando llenes el puesto.">
        <button type="button" onClick={() => p.ir("publicar")} className="btn-aplicar inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm"><Plus className="size-4" /> Nueva</button>
      </Titulo>
      <div className="mb-4 flex gap-2" role="tablist">
        {([["abiertas", "Abiertas"], ["revision", "En revisión"], ["cerradas", "Pausadas y cerradas"]] as const).map(([id, t]) => cuenta(id) > 0 || id === "abiertas" ? (
          <button key={id} type="button" role="tab" aria-selected={filtro === id} onClick={() => setFiltro(id)} className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold ${filtro === id ? "border-[#0a2f5c] bg-[#0a2f5c] text-white" : "border-border bg-surface"}`}>{t}<span className={`rounded-full px-1.5 text-xs ${filtro === id ? "bg-white/20" : "bg-muted"}`}>{cuenta(id)}</span></button>
        ) : null)}
      </div>
      {lista.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No hay vacantes aquí.</p>}
      <ul className="grid gap-4 lg:grid-cols-2">{lista.map((v) => <Tarjeta key={v.id} v={v} />)}</ul>
    </>
  );
}

function Tarjeta({ v }: { v: Vacante }) {
  const p = usePanel();
  const [menu, setMenu] = useState(false);
  const e = estadoVacante(v);
  const suyos = p.candidatos.filter((c) => c.vacante_id === v.id);
  const nuevos = suyos.filter((c) => c.etapa === "nuevo").length;
  const dias = diasRestantes(v);
  const pedida = p.solicitudes.some((s) => s.tipo === "destacar" && s.vacante_id === v.id && (s.estado === "nueva" || s.estado === "contactada"));
  const conPlan = planActivo(p.empresa);

  return (
    <li className="flex flex-col rounded-2xl border border-border bg-surface">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${e.tono}`}>{e.label}</span>{v.destacada && <span className="rounded-full bg-[#ffd84d] px-2 py-0.5 text-[11px] font-extrabold text-[#3d2f00]">Destacada</span>}<ClaridadPill job={v} /></div>
            <h3 className="mt-2 text-lg font-extrabold leading-snug">{v.titulo}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{v.provincia} · {v.salario || "Sin salario"}</p>
          </div>
          <div className="relative">
            <button type="button" onClick={() => setMenu((x) => !x)} aria-label="Más acciones" aria-expanded={menu} className="grid size-9 place-items-center rounded-lg hover:bg-muted"><MoreHorizontal className="size-5" /></button>
            {menu && (
              <>
                <button type="button" aria-hidden="true" tabIndex={-1} onClick={() => setMenu(false)} className="fixed inset-0 z-10 cursor-default" />
                <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl" role="menu">
                  {[
                    { t: "Editar", I: Pencil, f: () => p.editarVacante(v) },
                    { t: "Duplicar como nueva", I: Copy, f: () => p.editarVacante(v, true) },
                    e.id === "activa" ? { t: "Pausar", I: Pause, f: () => void p.accionVacante(v, "pausar") } : null,
                    e.id === "pausada" || e.id === "cerrada" ? { t: "Volver a publicar", I: Play, f: () => void p.accionVacante(v, "reactivar") } : null,
                    e.id !== "cerrada" ? { t: "Cerrar (ya la llené)", I: XCircle, f: () => void p.accionVacante(v, "cerrar") } : null,
                  ].filter((x): x is { t: string; I: typeof Pencil; f: () => void } => !!x).map((x) => (
                    <button key={x.t} type="button" role="menuitem" onClick={() => { setMenu(false); x.f(); }} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-secondary"><x.I className="size-4 text-muted-foreground" /> {x.t}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-background py-2.5"><p className="text-xl font-extrabold tabular-nums">{suyos.length}</p><p className="text-[11px] text-muted-foreground">candidatos</p></div>
          <div className="rounded-xl bg-background py-2.5"><p className="text-xl font-extrabold tabular-nums">{suyos.filter((c) => c.etapa === "entrevista").length}</p><p className="text-[11px] text-muted-foreground">en entrevista</p></div>
          <div className="rounded-xl bg-background py-2.5"><p className={`text-xl font-extrabold tabular-nums ${e.id === "activa" && dias <= 5 ? "text-destructive" : ""}`}>{e.id === "activa" ? dias : "—"}</p><p className="text-[11px] text-muted-foreground">días visible</p></div>
        </div>
        {suyos.length > 0 && (
          <div className="mt-3 flex items-center gap-3"><Barra candidatos={suyos} /><span className="text-xs text-muted-foreground">{ETAPAS.filter((x) => suyos.some((c) => c.etapa === x.id)).map((x) => `${suyos.filter((c) => c.etapa === x.id).length} ${x.corto.toLowerCase()}`).join(" · ")}</span></div>
        )}
        {e.id === "revision" && <p className="mt-3 rounded-xl bg-[#c27803]/10 p-3 text-sm text-[#8a5200]">La estamos revisando. Sale publicada en cuanto la aprobemos.</p>}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border px-5 py-3.5">
        <button type="button" onClick={() => p.ir("candidatos", { vacante: v.id, etapa: "" })} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0a2f5c] px-4 text-sm font-bold text-white"><Users className="size-4" /> Ver candidatos{nuevos > 0 && <span className="rounded-full bg-[#1d6ff2] px-1.5 text-xs">{nuevos}</span>}</button>
        {(e.id === "vencida" || (e.id === "activa" && dias <= 5)) && <button type="button" onClick={() => void p.accionVacante(v, "renovar")} className={`${btnLinea} border-[#1d6ff2] text-[#1557c4]`}><RefreshCw className="size-4" /> Renovar</button>}
        {e.id === "activa" && <a href={enlaceWhatsApp(v)} target="_blank" rel="noopener noreferrer" className={btnLinea}><Share2 className="size-4" /> Compartir</a>}
        {e.id === "activa" && <Link to="/vacantes/$id" params={{ id: v.id }} target="_blank" className={btnLinea} aria-label="Ver como candidato"><ExternalLink className="size-4" /></Link>}
        {e.id === "activa" && !v.destacada && (
          <button type="button" disabled={pedida} onClick={() => void p.pedir("destacar", v.id)} className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#ffd84d] px-3.5 text-sm font-extrabold text-[#3d2f00] hover:brightness-95 disabled:opacity-60">
            <Star className="size-4" /> {pedida ? "Destacado pedido" : conPlan ? "Destacar (incluido)" : "Destacar"}
          </button>
        )}
      </div>
    </li>
  );
}

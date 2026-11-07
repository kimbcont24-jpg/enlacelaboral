import { Link } from "@tanstack/react-router";
import { ExternalLink, Pause, Pencil, Play, RefreshCw, Share2, Users, XCircle } from "lucide-react";

import { diasRestantes } from "@/lib/claridad";
import { estadoVacante, type Candidato } from "@/lib/panel";
import { enlaceWhatsApp, type Vacante } from "@/lib/vacantes";

type Accion = "renovar" | "pausar" | "reactivar" | "cerrar";

export function VacantesEmpresa({ vacantes, candidatos, onAccion, onEditar, onVerCandidatos, onPublicar }: {
  vacantes: Vacante[];
  candidatos: Candidato[];
  onAccion: (v: Vacante, a: Accion) => void;
  onEditar: (v: Vacante) => void;
  onVerCandidatos: (id: string) => void;
  onPublicar: () => void;
}) {
  if (!vacantes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <p className="text-lg font-bold">Publica tu primera vacante gratis</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Toma 2 minutos. Las personas aplican aquí mismo y te llegan a este panel.</p>
        <button type="button" onClick={onPublicar} className="btn-aplicar mt-5 h-12 rounded-xl px-6 text-base">Publicar vacante</button>
      </div>
    );
  }
  const btn = "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-semibold hover:border-primary hover:text-primary";
  return (
    <ul className="space-y-3">
      {vacantes.map((v) => {
        const e = estadoVacante(v);
        const suyos = candidatos.filter((c) => c.vacante_id === v.id);
        const nuevos = suyos.filter((c) => c.etapa === "nuevo").length;
        const dias = diasRestantes(v);
        return (
          <li key={v.id} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-lg font-extrabold leading-tight">{v.titulo} <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${e.tono}`}>{e.label}</span>{v.destacada && <span className="rounded-full bg-[#ffd84d] px-2 py-0.5 text-[11px] font-extrabold text-[#3d2f00]">Destacada</span>}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{v.provincia} · {v.salario || "Sin salario"} · publicada {v.publicado}{e.id === "activa" ? ` · se ve ${dias} ${dias === 1 ? "día" : "días"} más` : ""}</p>
                {e.id === "revision" && <p className="mt-1 text-xs text-[#8a5200]">La estamos revisando. Sale publicada cuando la aprobemos.</p>}
              </div>
              <button type="button" onClick={() => onVerCandidatos(v.id)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-bold text-primary">
                <Users className="size-4" /> {suyos.length} {suyos.length === 1 ? "candidato" : "candidatos"}{nuevos > 0 && <span className="rounded-full bg-cta px-1.5 text-xs text-cta-foreground">{nuevos} nuevo{nuevos === 1 ? "" : "s"}</span>}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => onEditar(v)} className={btn}><Pencil className="size-4" /> Editar</button>
              {(e.id === "vencida" || (e.id === "activa" && dias <= 5)) && <button type="button" onClick={() => onAccion(v, "renovar")} className={`${btn} border-primary text-primary`}><RefreshCw className="size-4" /> Renovar 30 días</button>}
              {e.id === "activa" && <button type="button" onClick={() => onAccion(v, "pausar")} className={btn}><Pause className="size-4" /> Pausar</button>}
              {(e.id === "pausada" || e.id === "cerrada") && <button type="button" onClick={() => onAccion(v, "reactivar")} className={btn}><Play className="size-4" /> Volver a publicar</button>}
              {e.id !== "cerrada" && <button type="button" onClick={() => onAccion(v, "cerrar")} className={btn}><XCircle className="size-4" /> Cerrar (ya la llené)</button>}
              {e.id === "activa" && <a href={enlaceWhatsApp(v)} target="_blank" rel="noopener noreferrer" className={btn}><Share2 className="size-4" /> Compartir</a>}
              {e.id === "activa" && <Link to="/vacantes/$id" params={{ id: v.id }} target="_blank" className={btn}><ExternalLink className="size-4" /> Ver</Link>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

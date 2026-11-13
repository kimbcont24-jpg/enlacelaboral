import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Check, ExternalLink, Loader2, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Estrellas } from "@/components/empresa/Estrellas";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIAS, TIPOS, type TipoOpinion } from "@/lib/opiniones";

type Fila = {
  id: string; empresa_slug: string; empresa_nombre: string; tipo: TipoOpinion; estrellas: number; categorias: Record<string, number>;
  recomienda: boolean | null; titulo: string | null; positivo: string | null; mejorar: string | null; puesto: string | null;
  relacion: string | null; verificada: boolean; estado: "pendiente" | "publicada" | "rechazada"; motivo: string | null;
  respuesta: string | null; creada: string; editada: string; correo: string | null;
};

const MOTIVOS = ["Tiene nombres o datos personales", "Insultos o lenguaje ofensivo", "Acusación grave sin base", "No es sobre esta empresa", "Parece falsa o repetida"];

// Señales para revisar con más cuidado (no deciden solas).
const ALERTA = /(\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b|@[a-z0-9.-]+\.|ladr[oó]n|estaf|robo|acos|demanda|polic[ií]a|maldit|co[ñn]o|mierda|carajo|\bpuñet)/i;

/** Moderación de opiniones de empresas: nada se publica sin pasar por aquí. */
export function Opiniones({ onCambio }: { onCambio?: () => void }) {
  const [estado, setEstado] = useState<"pendiente" | "publicada" | "rechazada">("pendiente");
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setFilas(null);
    const { data, error } = await supabase.rpc("opiniones_admin" as never, { p_estado: estado } as never);
    if (error) { toast.error("No se pudieron cargar las opiniones."); setFilas([]); return; }
    setFilas(((data ?? []) as Fila[]).slice().reverse());
  }, [estado]);
  useEffect(() => { void cargar(); }, [cargar]);

  async function moderar(f: Fila, accion: "publicar" | "rechazar" | "borrar", motivo?: string) {
    if (accion === "borrar" && !window.confirm("¿Borrar esta opinión para siempre?")) return;
    setTrabajando(f.id);
    const { error } = await supabase.rpc("moderar_opinion" as never, { p_id: f.id, p_accion: accion, p_motivo: motivo ?? null } as never);
    setTrabajando(null);
    if (error) { toast.error("No se pudo guardar."); return; }
    toast.success(accion === "publicar" ? "Publicada" : accion === "rechazar" ? "No publicada" : "Borrada");
    setFilas((l) => (l ?? []).filter((x) => x.id !== f.id));
    onCambio?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Opiniones de empresas</h2>
          <p className="text-sm text-muted-foreground">Nada se publica sin tu visto bueno. Publica lo que ayuda a decidir; no publiques nombres de personas, insultos ni acusaciones graves sin base.</p>
        </div>
        <div className="inline-flex rounded-full bg-secondary p-1 text-sm font-bold">
          {(["pendiente", "publicada", "rechazada"] as const).map((e) => (
            <button key={e} type="button" onClick={() => setEstado(e)} className={`rounded-full px-3.5 py-1.5 ${estado === e ? "bg-white shadow-sm" : "text-muted-foreground"}`}>{e === "pendiente" ? "Por revisar" : e === "publicada" ? "Publicadas" : "No publicadas"}</button>
          ))}
        </div>
      </div>

      {filas === null ? <div className="grid place-items-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>
        : filas.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">{estado === "pendiente" ? "No hay opiniones por revisar." : "Nada por aquí."}</p>
        : (
          <ul className="space-y-4">
            {filas.map((f) => {
              const texto = [f.titulo, f.positivo, f.mejorar].filter(Boolean).join(" ");
              const alerta = ALERTA.test(texto);
              return (
                <li key={f.id} className={`rounded-2xl border bg-surface p-5 ${alerta ? "border-[#c27803]/50" : "border-border"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <a href={`/empresa/${f.empresa_slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-extrabold hover:underline">{f.empresa_nombre} <ExternalLink className="size-3.5" /></a>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{TIPOS[f.tipo].titulo}</span>·
                        <span>{f.tipo === "trabajo" ? (f.relacion === "actual" ? "Trabaja ahí" : f.relacion === "anterior" ? "Trabajó ahí" : "Sin indicar") : "Aplicó"}{f.puesto ? ` · ${f.puesto}` : ""}</span>·
                        <span>{new Date(f.editada).toLocaleString("es-DO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>·
                        <span title="Solo lo ves tú">{f.correo ?? "sin correo"}</span>
                        {f.verificada && <span className="inline-flex items-center gap-1 font-bold text-[#0f7a43]"><BadgeCheck className="size-3.5" /> Aplicó por Enlace</span>}
                      </p>
                    </div>
                    <Estrellas valor={f.estrellas} size={18} />
                  </div>
                  {alerta && <p className="mt-3 rounded-lg bg-[#c27803]/10 px-3 py-2 text-xs font-semibold text-[#8a5200]">Revisa con calma: puede tener un teléfono, correo, insulto o una acusación grave.</p>}
                  {f.titulo && <p className="mt-3 font-bold">{f.titulo}</p>}
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {f.positivo && <p className="text-sm"><span className="mb-0.5 flex items-center gap-1 text-xs font-bold text-[#0f7a43]"><ThumbsUp className="size-3.5" /> Lo bueno</span>{f.positivo}</p>}
                    {f.mejorar && <p className="text-sm"><span className="mb-0.5 flex items-center gap-1 text-xs font-bold text-[#b45309]"><ThumbsDown className="size-3.5" /> Por mejorar</span>{f.mejorar}</p>}
                  </div>
                  {Object.keys(f.categorias ?? {}).length > 0 && (
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {CATEGORIAS[f.tipo].filter((c) => f.categorias[c.k]).map((c) => <span key={c.k}>{c.t}: <b className="text-foreground">{f.categorias[c.k]}</b>/5</span>)}
                      {f.recomienda != null && <span>Recomienda: <b className="text-foreground">{f.recomienda ? "sí" : "no"}</b></span>}
                    </p>
                  )}
                  {f.motivo && <p className="mt-2 text-xs text-muted-foreground">Motivo: {f.motivo}</p>}
                  {f.respuesta && <p className="mt-2 rounded-lg bg-secondary p-2 text-xs"><b>Respuesta de la empresa:</b> {f.respuesta}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {f.estado !== "publicada" && (
                      <button type="button" disabled={trabajando === f.id} onClick={() => void moderar(f, "publicar")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0f7a43] px-4 text-sm font-bold text-white disabled:opacity-60"><Check className="size-4" /> Publicar</button>
                    )}
                    {f.estado !== "rechazada" && (
                      <details className="relative">
                        <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-full border border-border px-4 text-sm font-bold [&::-webkit-details-marker]:hidden"><X className="size-4" /> No publicar</summary>
                        <div className="absolute left-0 z-10 mt-1 w-64 rounded-xl border border-border bg-surface p-1.5 shadow-xl">
                          {MOTIVOS.map((m) => <button key={m} type="button" onClick={() => void moderar(f, "rechazar", m)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary">{m}</button>)}
                        </div>
                      </details>
                    )}
                    <button type="button" disabled={trabajando === f.id} onClick={() => void moderar(f, "borrar")} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /> Borrar</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
    </div>
  );
}

/** Cuántas opiniones esperan revisión (para el aviso del menú). */
export async function contarOpinionesPendientes(): Promise<number> {
  const { data, error } = await supabase.rpc("opiniones_admin" as never, { p_estado: "pendiente" } as never);
  return error ? 0 : ((data ?? []) as unknown[]).length;
}

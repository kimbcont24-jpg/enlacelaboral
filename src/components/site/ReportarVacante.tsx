import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

const MOTIVOS = ["Piden dinero para entrar", "Información falsa o engañosa", "Ya no está disponible", "Discriminación", "Otro"] as const;

/** Botón para que cualquier persona avise de una vacante sospechosa o vencida. */
export function ReportarVacante({ id }: { id: string }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState<string>(MOTIVOS[0]);
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const { error } = await supabase.rpc("reportar_vacante", { p_id: id, p_motivo: motivo, p_detalle: detalle || null });
    setEnviando(false);
    if (error) return void toast.error("No pudimos enviar el reporte. Intenta otra vez en un momento.");
    setHecho(true);
  };

  if (hecho) return <p className="mt-8 rounded-xl border border-success/40 bg-success/5 p-4 text-sm font-semibold text-success" role="status">Gracias. Revisamos tu reporte.</p>;

  return (
    <div className="mt-8 border-t border-border pt-4">
      {!abierto ? (
        <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-destructive"><Flag className="size-4" aria-hidden="true" /> Reportar esta vacante</button>
      ) : (
        <form onSubmit={(e) => void enviar(e)} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm font-bold">¿Qué pasa con esta vacante?</p>
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-label="Motivo" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
            {MOTIVOS.map((m) => (<option key={m}>{m}</option>))}
          </select>
          <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} maxLength={1000} rows={3} placeholder="Cuéntanos más (opcional). No pongas tus datos personales." className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
          <div className="flex gap-2">
            <button type="submit" disabled={enviando} className="rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{enviando ? "Enviando…" : "Enviar reporte"}</button>
            <button type="button" onClick={() => setAbierto(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}

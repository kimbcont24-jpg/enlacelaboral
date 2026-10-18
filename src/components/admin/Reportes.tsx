import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tarjeta, haceDesde } from "@/components/admin/comun";
import { supabase } from "@/integrations/supabase/client";

type R = { id: string; vacante_id: string; motivo: string; detalle: string | null; estado: string; created_at: string };
type V = { id: string; titulo: string; estado: string };

export function Reportes({ onCambio }: { onCambio: () => void }) {
  const [filas, setFilas] = useState<R[]>([]);
  const [vacantes, setVacantes] = useState<Record<string, V>>({});
  const [ver, setVer] = useState<"nuevo" | "revisado">("nuevo");
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase.from("reportes").select("*").order("created_at", { ascending: false }).limit(300);
    const rs = (data ?? []) as R[];
    setFilas(rs);
    const ids = [...new Set(rs.map((r) => r.vacante_id))];
    if (ids.length) {
      const { data: vs } = await supabase.from("vacantes").select("id,titulo,estado").in("id", ids);
      setVacantes(Object.fromEntries(((vs ?? []) as V[]).map((v) => [v.id, v])));
    }
    setCargando(false);
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const marcar = async (vacanteId: string, estado: "resuelto" | "descartado") => {
    const { error } = await supabase.from("reportes").update({ estado }).eq("vacante_id", vacanteId).eq("estado", "nuevo");
    if (error) return void toast.error("No se pudo actualizar");
    await cargar(); onCambio();
  };
  const cerrar = async (vacanteId: string) => {
    const { error } = await supabase.from("vacantes").update({ estado: "cerrada" }).eq("id", vacanteId);
    if (error) return void toast.error("No se pudo cerrar la vacante");
    toast.success("Vacante cerrada");
    await marcar(vacanteId, "resuelto");
  };

  const lista = filas.filter((r) => (ver === "nuevo" ? r.estado === "nuevo" : r.estado !== "nuevo"));
  const grupos = Object.entries(lista.reduce<Record<string, R[]>>((m, r) => { (m[r.vacante_id] ??= []).push(r); return m; }, {})).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={ver === "nuevo" ? "default" : "outline"} size="sm" onClick={() => setVer("nuevo")}>Por revisar ({filas.filter((r) => r.estado === "nuevo").length})</Button>
        <Button variant={ver === "revisado" ? "default" : "outline"} size="sm" onClick={() => setVer("revisado")}>Ya revisados</Button>
      </div>
      {cargando && <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>}
      {!cargando && grupos.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{ver === "nuevo" ? "No hay reportes por revisar. Las personas pueden reportar desde cada vacante." : "Todavía no hay reportes revisados."}</p>}
      {grupos.map(([vid, rs]) => {
        const v = vacantes[vid];
        return (
          <Tarjeta key={vid}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{v?.titulo ?? "Vacante eliminada"} <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${rs.length >= 3 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{rs.length} reporte{rs.length === 1 ? "" : "s"}</span> {v && v.estado !== "publicada" && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{v.estado}</span>}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {rs.slice(0, 6).map((r) => (<li key={r.id}><strong>{r.motivo}</strong>{r.detalle ? ` — ${r.detalle}` : ""} <span className="text-xs text-muted-foreground">· {haceDesde(r.created_at)}</span></li>))}
                  {rs.length > 6 && <li className="text-xs text-muted-foreground">y {rs.length - 6} más</li>}
                </ul>
              </div>
              {ver === "nuevo" && (
                <div className="flex flex-wrap gap-2">
                  {v && <Button asChild size="sm" variant="outline"><Link to="/vacantes/$id" params={{ id: vid }} target="_blank">Ver</Link></Button>}
                  {v && v.estado === "publicada" && <Button size="sm" variant="destructive" onClick={() => void cerrar(vid)}>Cerrar vacante</Button>}
                  <Button size="sm" variant="outline" onClick={() => void marcar(vid, "descartado")}>Descartar</Button>
                </div>
              )}
            </div>
          </Tarjeta>
        );
      })}
    </div>
  );
}

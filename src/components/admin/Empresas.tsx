import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tarjeta, haceDesde } from "@/components/admin/comun";
import { supabase } from "@/integrations/supabase/client";

type E = { id: string; nombre: string; rnc: string; sector: string | null; provincia: string | null; contacto_nombre: string | null; contacto_email: string | null; contacto_telefono: string | null; verificada: boolean; created_at: string; plan: string; plan_hasta: string | null };
type S = { id: string; empresa_id: string; tipo: string; estado: string; created_at: string; vacante_id: string | null; detalle: string | null; vacantes: { titulo: string } | null };

export function Empresas() {
  const [filas, setFilas] = useState<E[]>([]);
  const [sol, setSol] = useState<S[]>([]);
  const [cargando, setCargando] = useState(true);
  const [jor, setJor] = useState<{ id: string; titulo: string; fecha: string; lugar: string; provincia: string; empresa_id: string }[]>([]);
  const cargar = useCallback(async () => {
    const [{ data }, { data: s2 }, { data: j2 }] = await Promise.all([
      supabase.from("empresas").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("solicitudes_empresa").select("id,empresa_id,tipo,estado,created_at,vacante_id,detalle,vacantes(titulo)").in("estado", ["nueva", "contactada"]).order("created_at", { ascending: false }).limit(100),
      supabase.from("jornadas").select("id,titulo,fecha,lugar,provincia,empresa_id").eq("estado", "revision").order("fecha").limit(50),
    ]);
    setJor((j2 ?? []) as typeof jor);
    setFilas((data ?? []) as unknown as E[]);
    setSol((s2 ?? []) as unknown as S[]);
    setCargando(false);
  }, []);

  const darPlan = async (e: E, meses: number, dias = 0) => {
    const hasta = new Date(); hasta.setMonth(hasta.getMonth() + meses); hasta.setDate(hasta.getDate() + dias);
    const cambios = meses || dias ? { plan: "empresa", plan_hasta: hasta.toISOString().slice(0, 10) } : { plan: "gratis", plan_hasta: null };
    const { error } = await supabase.from("empresas").update(cambios).eq("id", e.id);
    if (error) return void toast.error("No se pudo cambiar el plan");
    toast.success(meses || dias ? `${e.nombre}: Plan Empresa hasta ${hasta.toLocaleDateString("es-DO")}` : `${e.nombre}: plan gratis`);
    await cargar();
  };

  const marcar = async (s: S, estado: string) => {
    const { error } = await supabase.from("solicitudes_empresa").update({ estado }).eq("id", s.id);
    if (error) return void toast.error("No se pudo cambiar");
    if (estado === "pagada" && s.tipo === "destacar" && s.vacante_id) await supabase.from("vacantes").update({ destacada: true }).eq("id", s.vacante_id);
    const emp = filas.find((x) => x.id === s.empresa_id);
    if (estado === "pagada" && s.tipo === "plan_empresa" && emp) await darPlan(emp, 1);
    if (estado === "pagada" && s.tipo === "prueba" && emp) await darPlan(emp, 0, 14);
    if (estado !== "pagada" || s.tipo === "asistido" || s.tipo === "destacar") toast.success(estado === "pagada" ? (s.tipo === "destacar" ? "Pagada: vacante destacada." : "Marcada como cerrada.") : "Listo");
    await cargar();
  };
  useEffect(() => { void cargar(); }, [cargar]);

  const cambiar = async (e: E) => {
    const { error } = await supabase.from("empresas").update({ verificada: !e.verificada }).eq("id", e.id);
    if (error) return void toast.error("No se pudo cambiar");
    toast.success(e.verificada ? "Verificación quitada" : `${e.nombre} verificada`);
    await cargar();
  };

  if (cargando) return <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>;
  return (
    <div className="space-y-3">
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">Verifica una empresa solo cuando hayas confirmado que existe (por ejemplo con su RNC y un contacto real). Solo tú puedes cambiar esto: las empresas no pueden verificarse solas.</p>
      {jor.length > 0 && (
        <div className="space-y-2 rounded-2xl border-2 border-[#c27803]/40 bg-surface p-4">
          <p className="font-bold">Jornadas de empleo por aprobar ({jor.length})</p>
          {jor.map((j) => (
            <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 p-3 text-sm">
              <div className="min-w-0"><p className="font-bold">{j.titulo} · {filas.find((f) => f.id === j.empresa_id)?.nombre ?? "Empresa"}</p><p className="text-muted-foreground">{new Date(j.fecha).toLocaleString("es-DO")} · {j.lugar}, {j.provincia}</p></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void supabase.from("jornadas").update({ estado: "publicada" }).eq("id", j.id).then(() => { toast.success("Jornada publicada"); void cargar(); })}>Aprobar</Button>
                <Button size="sm" variant="ghost" onClick={() => void supabase.from("jornadas").update({ estado: "cancelada" }).eq("id", j.id).then(() => { toast.success("Rechazada"); void cargar(); })}>Rechazar</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {sol.length > 0 && (
        <div className="space-y-2 rounded-2xl border-2 border-primary/40 bg-surface p-4">
          <p className="font-bold">Pedidos de empresas ({sol.length})</p>
          {sol.map((x) => {
            const e = filas.find((f) => f.id === x.empresa_id);
            return (
              <div key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 p-3 text-sm">
                <div className="min-w-0"><p className="font-bold">{x.tipo === "destacar" ? `Destacar: ${x.vacantes?.titulo ?? "vacante"}` : x.tipo === "prueba" ? "Quiere probar Plan Empresa 14 días" : x.tipo === "asistido" ? "Quiere Reclutamiento Asistido" : "Quiere el Plan Empresa"} · {e?.nombre ?? "Empresa"}</p><p className="text-muted-foreground">{[e?.contacto_nombre, e?.contacto_telefono, e?.contacto_email].filter(Boolean).join(" · ") || "Sin contacto"} · {haceDesde(x.created_at)}{x.estado === "contactada" ? " · ya contactada" : ""}</p>{x.detalle && <p className="mt-1 whitespace-pre-wrap">{x.detalle}</p>}</div>
                <div className="flex gap-2">
                  {x.estado === "nueva" && <Button size="sm" variant="outline" onClick={() => void marcar(x, "contactada")}>Ya la contacté</Button>}
                  <Button size="sm" onClick={() => void marcar(x, "pagada")}>{x.tipo === "prueba" ? "Activar prueba 14 días" : x.tipo === "asistido" ? "Ya lo acordamos" : "Pagó: activar"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => void marcar(x, "descartada")}>Descartar</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {filas.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Todavía no se ha registrado ninguna empresa con cuenta.</p>}
      {filas.map((e) => (
        <Tarjeta key={e.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold">{e.nombre} {e.verificada && <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success"><BadgeCheck className="size-3.5" aria-hidden="true" /> Verificada</span>}</p>
              <p className="mt-1 text-sm text-muted-foreground">RNC {e.rnc}{e.sector ? ` · ${e.sector}` : ""}{e.provincia ? ` · ${e.provincia}` : ""}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{[e.contacto_nombre, e.contacto_email, e.contacto_telefono].filter(Boolean).join(" · ") || "Sin datos de contacto"} · registrada {haceDesde(e.created_at)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={e.verificada ? "outline" : "default"} onClick={() => void cambiar(e)}>{e.verificada ? "Quitar verificación" : "Marcar como verificada"}</Button>
              {e.plan === "empresa" ? <Button size="sm" variant="outline" onClick={() => void darPlan(e, 0)}>Plan Empresa{e.plan_hasta ? ` hasta ${e.plan_hasta}` : ""} · quitar</Button> : <Button size="sm" variant="outline" onClick={() => void darPlan(e, 1)}>Dar Plan Empresa 1 mes</Button>}
            </div>
          </div>
        </Tarjeta>
      ))}
    </div>
  );
}

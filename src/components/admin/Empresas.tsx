import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tarjeta, haceDesde } from "@/components/admin/comun";
import { supabase } from "@/integrations/supabase/client";

type E = { id: string; nombre: string; rnc: string; sector: string | null; provincia: string | null; contacto_nombre: string | null; contacto_email: string | null; contacto_telefono: string | null; verificada: boolean; created_at: string };

export function Empresas() {
  const [filas, setFilas] = useState<E[]>([]);
  const [cargando, setCargando] = useState(true);
  const cargar = useCallback(async () => {
    const { data } = await supabase.from("empresas").select("*").order("created_at", { ascending: false }).limit(300);
    setFilas((data ?? []) as E[]);
    setCargando(false);
  }, []);
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
      {filas.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Todavía no se ha registrado ninguna empresa con cuenta.</p>}
      {filas.map((e) => (
        <Tarjeta key={e.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold">{e.nombre} {e.verificada && <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success"><BadgeCheck className="size-3.5" aria-hidden="true" /> Verificada</span>}</p>
              <p className="mt-1 text-sm text-muted-foreground">RNC {e.rnc}{e.sector ? ` · ${e.sector}` : ""}{e.provincia ? ` · ${e.provincia}` : ""}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{[e.contacto_nombre, e.contacto_email, e.contacto_telefono].filter(Boolean).join(" · ") || "Sin datos de contacto"} · registrada {haceDesde(e.created_at)}</p>
            </div>
            <Button size="sm" variant={e.verificada ? "outline" : "default"} onClick={() => void cambiar(e)}>{e.verificada ? "Quitar verificación" : "Marcar como verificada"}</Button>
          </div>
        </Tarjeta>
      ))}
    </div>
  );
}

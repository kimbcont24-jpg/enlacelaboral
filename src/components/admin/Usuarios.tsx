import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tarjeta, haceDesde } from "@/components/admin/comun";
import { supabase } from "@/integrations/supabase/client";

type U = { id: string; email: string; nombre: string | null; creado: string; ultimo_acceso: string | null; es_admin: boolean };

export function Usuarios({ uid }: { uid: string }) {
  const [filas, setFilas] = useState<U[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pidiendo, setPidiendo] = useState<string | null>(null);
  const [buscar, setBuscar] = useState("");

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.rpc("usuarios_admin");
    if (error) toast.error("No se pudo cargar la lista");
    setFilas((data ?? []) as U[]);
    setCargando(false);
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const cambiar = async (u: U, admin: boolean) => {
    const { error } = await supabase.rpc("cambiar_admin", { p_user: u.id, p_admin: admin });
    setPidiendo(null);
    if (error) return void toast.error(error.message || "No se pudo cambiar");
    toast.success(admin ? `${u.email} ahora es administradora` : `${u.email} ya no es administradora`);
    await cargar();
  };

  const q = buscar.trim().toLowerCase();
  const lista = filas.filter((u) => !q || `${u.email} ${u.nombre ?? ""}`.toLowerCase().includes(q));
  if (cargando) return <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">Quien sea administrador puede ver pedidos y datos de contacto, publicar y cambiar el sitio. Da ese acceso solo a personas de confianza. Siempre debe quedar al menos una administradora, y no puedes quitarte el acceso a ti misma.</p>
      <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por correo o nombre" aria-label="Buscar usuario" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
      <p className="text-sm text-muted-foreground">{filas.length} cuenta{filas.length === 1 ? "" : "s"} · {filas.filter((u) => u.es_admin).length} administradora{filas.filter((u) => u.es_admin).length === 1 ? "" : "s"}</p>
      {lista.map((u) => (
        <Tarjeta key={u.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-bold">{u.nombre || u.email} {u.es_admin && <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary"><ShieldCheck className="size-3.5" aria-hidden="true" /> Administradora</span>} {u.id === uid && <span className="text-xs font-semibold text-muted-foreground">(tú)</span>}</p>
              <p className="truncate text-sm text-muted-foreground">{u.nombre ? `${u.email} · ` : ""}creada {haceDesde(u.creado)} · último acceso {haceDesde(u.ultimo_acceso)}</p>
            </div>
            {pidiendo === u.id ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{u.es_admin ? "¿Quitar acceso?" : "¿Dar acceso total?"}</span>
                <Button size="sm" variant={u.es_admin ? "destructive" : "default"} onClick={() => void cambiar(u, !u.es_admin)}>Sí</Button>
                <Button size="sm" variant="outline" onClick={() => setPidiendo(null)}>No</Button>
              </div>
            ) : u.id === uid ? null : (
              <Button size="sm" variant="outline" onClick={() => setPidiendo(u.id)}>{u.es_admin ? "Quitar acceso de admin" : "Hacer administradora"}</Button>
            )}
          </div>
        </Tarjeta>
      ))}
    </div>
  );
}

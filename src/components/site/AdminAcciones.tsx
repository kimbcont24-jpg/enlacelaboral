import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Vacante } from "@/lib/vacantes";

async function esAdmin(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return false;
  const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin");
  return !!(r && r.length);
}

export function useEsAdmin() {
  const q = useQuery({ queryKey: ["es-admin"], queryFn: esAdmin, staleTime: 300_000 });
  return q.data === true;
}

const boton = "inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary hover:text-primary";

export function AdminAcciones({ job, volverAlListado = false }: { job: Vacante; volverAlListado?: boolean }) {
  const admin = useEsAdmin();
  const qc = useQueryClient();
  const navigate = useNavigate();
  if (!admin) return null;

  const despues = async () => {
    await qc.invalidateQueries({ queryKey: ["vacantes"] });
    if (volverAlListado) await navigate({ to: "/vacantes" });
  };

  const pausar = async () => {
    const { error } = await supabase.from("vacantes").update({ estado: "pausada" }).eq("id", job.id);
    if (error) return void toast.error("No se pudo pausar.");
    toast.success("Vacante pausada. Puedes volver a publicarla desde tu panel.");
    await despues();
  };

  const borrar = async () => {
    if (!confirm(`¿Borrar "${job.titulo}"? No se puede deshacer.`)) return;
    const { error } = await supabase.from("vacantes").delete().eq("id", job.id);
    if (error) return void toast.error("No se pudo borrar.");
    toast.success("Vacante borrada.");
    await despues();
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-2">
      <span className="px-1 text-[10px] font-bold uppercase tracking-widest text-primary">Solo tú ves esto</span>
      <Link to="/admin" search={{ editar: job.id }} className={boton}><Pencil className="size-3.5" /> Editar</Link>
      <button type="button" onClick={() => void pausar()} className={boton}><Pause className="size-3.5" /> Pausar</button>
      <button type="button" onClick={() => void borrar()} className={`${boton} hover:border-destructive hover:text-destructive`}><Trash2 className="size-3.5" /> Borrar</button>
    </div>
  );
}

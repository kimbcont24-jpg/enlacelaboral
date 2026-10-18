import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/** Interruptores del sitio. Se guardan en contenido_sitio y los respeta también el servidor. */
export const CONTROLES = [
  { clave: "ctl_empresas", titulo: "Recibir vacantes de empresas", ayuda: "El formulario de /empresas. Apagado: muestra «recepción en pausa» y el servidor rechaza envíos." },
  { clave: "ctl_pedidos", titulo: "Recibir pedidos de CV", ayuda: "Los pedidos de /impulso. Apagado: nadie puede crear pedidos nuevos." },
  { clave: "ctl_avisos_pedidos", titulo: "Correo de aviso de pedidos nuevos", ayuda: "Automático cada 15 minutos. Apagado: los pedidos se guardan, pero no te llega correo." },
  { clave: "ctl_redes", titulo: "Compartir vacantes autorizadas en redes", ayuda: "Telegram (y luego Facebook/Instagram). Apagado: no se comparte nada solo." },
  { clave: "ctl_renovar", titulo: "Avisos de renovación a empresas", ayuda: "Correo diario a quien publicó, cuando le quedan 5 días. Apagado: no se avisa a nadie." },
  { clave: "ctl_hojas", titulo: "Sincronizar hojas de Google", ayuda: "Actualización diaria desde las hojas conectadas. Apagado: no se importa ni se cierra nada." },
] as const;

export type ClaveControl = (typeof CONTROLES)[number]["clave"];

export type Controles = {
  activos: Record<ClaveControl, boolean>;
  aviso: { visible: boolean; texto: string; tipo: "info" | "alerta" };
};

const porDefecto: Controles = {
  activos: { ctl_empresas: true, ctl_pedidos: true, ctl_avisos_pedidos: true, ctl_redes: true, ctl_renovar: true, ctl_hojas: true },
  aviso: { visible: false, texto: "", tipo: "info" },
};

async function leer(): Promise<Controles> {
  const { data } = await supabase.from("contenido_sitio").select("clave,valor").or("clave.like.ctl_*,clave.like.aviso_*");
  const m = new Map((data ?? []).map((r) => [r.clave, r.valor]));
  const activos = { ...porDefecto.activos };
  for (const c of CONTROLES) activos[c.clave] = m.get(c.clave) !== "off";
  const texto = (m.get("aviso_texto") ?? "").trim();
  return { activos, aviso: { visible: m.get("ctl_aviso") === "on" && texto.length > 0, texto, tipo: m.get("aviso_tipo") === "alerta" ? "alerta" : "info" } };
}

export function useControles() {
  const q = useQuery({ queryKey: ["controles"], queryFn: leer, staleTime: 30_000 });
  return { ...(q.data ?? porDefecto), cargando: q.isLoading };
}

export function useGuardarControl() {
  const qc = useQueryClient();
  return async (clave: string, valor: string) => {
    const { error } = await supabase.from("contenido_sitio").upsert({ clave, valor, updated_at: new Date().toISOString() });
    if (!error) await qc.invalidateQueries({ queryKey: ["controles"] });
    return !error;
  };
}

import { supabase } from "@/integrations/supabase/client";

/** Llama al CRM de empresas a través del servidor (solo administradoras). */
export async function crm<T>(accion: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const r = await fetch("/api/crm-empresas", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify({ accion, args }),
  });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(j.error ?? "No se pudo completar");
  return j;
}

export type Cuenta = {
  clave: string; nombre: string; dominio: string | null; area: string | null; provincia: string | null;
  vacantes_total: number; vacantes_30d: number; vacantes_90d: number; vacantes_7d: number; puestos_repetidos: number; pct_salario: number;
  ultima_vacante: string | null; ultimo_puesto: string | null; registrada: boolean; telefonos: string[] | null;
  n_contactos: number; n_corporativos: number; estado: string; temperatura: number; segmentos: string[]; accion: string | null; motivo: string | null;
};

export type Motor = {
  cuentas: Cuenta[];
  cola: { correo: string; empresa: string; paso_siguiente: number; temperatura: number; motivo: string | null }[];
  por_area: { area: string; vacantes: number; empresas: number; con_salario: number }[];
  por_provincia: { provincia: string; vacantes: number; empresas: number }[];
  semanas: { semana: string; enviados: number }[];
  respuestas_semana: { semana: string; n: number }[];
  mercado_pct_salario: number;
  vacantes_90d: number;
  sincronizado: string | null;
};

/** Número dominicano → enlace de WhatsApp con mensaje listo. */
export function enlaceWhatsApp(tel: string, empresa: string, puesto?: string | null): string | null {
  let d = tel.replace(/\D/g, "");
  if (d.length === 10 && /^(809|829|849)/.test(d)) d = `1${d}`;
  if (d.length !== 11 || !d.startsWith("1")) return null;
  const texto = `Hola, le saluda el equipo de Enlace Laboral RD. Vimos que ${empresa} está buscando${puesto ? ` ${puesto}` : " personal"} y su vacante ya aparece publicada gratis en enlacelaboralrd.com. ¿Le gustaría publicar las próximas directamente y recibir los candidatos ordenados en un panel? Es gratis y le ayudo con el registro.`;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
}

export const ESTADO_CUENTA: Record<string, { label: string; clase: string }> = {
  detectada: { label: "Detectada", clase: "bg-muted text-muted-foreground" },
  lista: { label: "Lista para la cola", clase: "bg-primary/10 text-primary" },
  en_secuencia: { label: "En secuencia", clase: "bg-primary/15 text-primary" },
  sin_respuesta: { label: "Sin respuesta", clase: "bg-muted text-foreground" },
  respondio: { label: "Respondió", clase: "bg-[#fff4d6] text-[#7a5600]" },
  interesada: { label: "Interesada", clase: "bg-success/15 text-success" },
  registrada: { label: "Registrada", clase: "bg-success text-white" },
  no_interesada: { label: "No interesada", clase: "bg-muted text-muted-foreground" },
};

/** Qué significa cada segmento y la estrategia que el motor aplica. */
export const SEGMENTOS: Record<string, { color: string; idea: string }> = {
  "Contratando ahora": { color: "#2F6FD1", idea: "Publicó esta semana: el mejor momento para escribir, porque la necesidad está fresca." },
  "Alto volumen": { color: "#0B2D5B", idea: "5 o más vacantes en 90 días. El gancho es el panel: manejar todo en un solo lugar." },
  "Rotación": { color: "#b45309", idea: "Repite puestos. El gancho son las preguntas de filtro para no perder tiempo." },
  "Sin salario": { color: "#7c3aed", idea: "No publica salario. El gancho es el dato: casi nadie lo publica y quien lo hace se destaca." },
  "Turismo": { color: "#0e7490", idea: "Hoteles y resorts: contratan por temporada; conviene entrar antes de cada pico." },
  "Nueva en Enlace": { color: "#15803d", idea: "Su primera vacante en Enlace en las últimas 2 semanas: primera impresión." },
  "Solo contacto personal": { color: "#be185d", idea: "Solo hay Gmail/Hotmail o teléfono: no se le envía nada automático. Toque personal por WhatsApp." },
  "Sin contacto": { color: "#64748b", idea: "No hay correo ni teléfono: buscar el contacto de gestión humana en LinkedIn o su sitio." },
  "Ya registrada": { color: "#0f7a43", idea: "Ya tiene cuenta: acompañar para que publique directo." },
};

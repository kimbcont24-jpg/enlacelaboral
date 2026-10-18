import { supabase } from "@/integrations/supabase/client";
import type { Borrador } from "@/lib/extraer";
import type { Vacante } from "@/lib/vacantes";

/** Convierte el formulario de una vacante en la fila que se guarda. */
export function filaDesde(b: Borrador) {
  const min = Number(b.salarioMin) || 0;
  const max = Number(b.salarioMax) || 0;
  const etiquetas = [
    b.empresa.trim() && `m:empresa:${b.empresa.trim()}`,
    `m:fuente:${b.fuente.trim()}`,
    b.fuenteUrl.trim() && `m:fuente_url:${b.fuenteUrl.trim()}`,
    b.aplicar.trim() && `m:aplicar:${b.aplicar.trim()}`,
    b.redes && "m:redes:si",
    b.imagen && `m:imagen:${b.imagen}`,
  ].filter(Boolean) as string[];
  return {
    titulo: b.titulo.trim(),
    area: b.area,
    provincia: b.provincia,
    modalidad: b.modalidad,
    tipo: b.tipo,
    experiencia: b.experiencia,
    salario_min: min,
    salario_max: max > min ? max : null,
    descripcion: b.descripcion.trim(),
    requisitos: b.requisitos.split("\n").map((r) => r.trim()).filter(Boolean),
    etiquetas,
  };
}

export async function miEmpresa(uid: string): Promise<string> {
  const { data } = await supabase.from("empresas").select("id").eq("owner_id", uid).maybeSingle();
  if (data) return (data as { id: string }).id;
  const { data: nueva, error } = await supabase.from("empresas").insert({ owner_id: uid, nombre: "Enlace Laboral", rnc: "no-aplica" }).select("id").single();
  if (error || !nueva) throw error ?? new Error("No se pudo preparar la cuenta");
  return (nueva as { id: string }).id;
}


export const EVENTO_PUBLICADA = "enlace-vacante-publicada";
export function avisarPublicada(v: Vacante) {
  window.dispatchEvent(new CustomEvent<Vacante>(EVENTO_PUBLICADA, { detail: v }));
}


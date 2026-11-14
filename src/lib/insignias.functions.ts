import { supabase } from "@/integrations/supabase/client";

/**
 * Pruebas de insignias de Enlace Laboral (14 nov 2026).
 *
 * Antes se hacían en Perfila; mientras Perfila madura como producto, las pruebas viven en Enlace.
 * El banco de preguntas y la corrección están SOLO en la base de datos (funciones insignia_*):
 * el navegador nunca recibe las respuestas correctas. El formato de la insignia es el mismo, así que
 * más adelante las pruebas se pueden llevar a Perfila sin perder lo ganado.
 */
const PRUEBAS = ["servicio_cliente", "excel_word", "ortografia_redaccion", "calculo_caja"] as const;
type Prueba = (typeof PRUEBAS)[number];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EstadoInsignia = {
  ref: string;
  prueba: Prueba;
  estado: "pendiente" | "en_curso" | "terminada" | "vencida" | "cancelada";
  nivel: "destacado" | "solido" | null;
  nombre: string | null;
  fecha: string | null;
};

export type PreguntaPrueba = { id: string; enunciado: string; opciones: string[] };
export type PruebaAbierta =
  | { estado: "en_curso"; prueba: Prueba; nombre: string; minutos: number; inicio: string; limite: string; ahora: string; preguntas: PreguntaPrueba[] }
  | { estado: "terminada" | "vencida" | "no_existe"; prueba?: Prueba };
export type Entrega =
  | { estado: "terminada"; nivel: "destacado" | "solido" | null; aciertos: number; total: number; alertas: string[] }
  | { estado: "vencida" };

async function rpc<T>(fn: string, args: Record<string, unknown>, fallo: string): Promise<T> {
  const { data, error } = await supabase.rpc(fn as never, args as never);
  if (error) {
    // Los mensajes propios de la base (límites, datos) se muestran tal cual; lo demás, genérico.
    const propio = (error as { code?: string }).code === "P0001";
    throw new Error(propio && error.message ? error.message : fallo);
  }
  return data as T;
}

/** Siempre activas: ya no dependen de una conexión externa. */
export async function insigniasActivas() {
  return { activas: true };
}

export async function pedirInsignia({ data }: { data: { prueba: Prueba; nombre: string; correo: string; regreso?: string } }) {
  const nombre = data.nombre.trim();
  const correo = data.correo.trim().toLowerCase();
  if (!PRUEBAS.includes(data.prueba)) throw new Error("Esa prueba no existe.");
  if (nombre.length < 2) throw new Error("Escribe tu nombre");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) throw new Error("Escribe un correo válido");
  const r = await rpc<{ ref: string; reused: boolean }>("insignia_iniciar", { p_prueba: data.prueba, p_nombre: nombre, p_correo: correo }, "No se pudo abrir la prueba. Intenta de nuevo.");
  if (!r || !UUID.test(r.ref)) throw new Error("No se pudo abrir la prueba. Intenta de nuevo.");
  return { ref: r.ref, url: `/insignias/prueba/${r.ref}`, reusada: r.reused === true };
}

export async function abrirPrueba(ref: string): Promise<PruebaAbierta> {
  if (!UUID.test(ref)) return { estado: "no_existe" };
  return rpc<PruebaAbierta>("insignia_preguntas", { p_ref: ref }, "No se pudo cargar la prueba. Revisa tu internet.");
}

export async function entregarPrueba(ref: string, respuestas: Record<string, number>, salidas: number): Promise<Entrega> {
  return rpc<Entrega>("insignia_entregar", { p_ref: ref, p_respuestas: respuestas, p_salidas: salidas }, "No se pudo entregar. Revisa tu internet y vuelve a intentarlo: tus respuestas siguen guardadas.");
}

const ESTADOS: Record<string, EstadoInsignia["estado"]> = {
  sent: "pendiente", in_progress: "en_curso", completed: "terminada", expired: "vencida", cancelled: "cancelada",
};

export async function consultarInsignias({ data }: { data: { refs: string[] } }): Promise<EstadoInsignia[]> {
  const refs = data.refs.filter((r) => UUID.test(r)).slice(0, 20);
  if (!refs.length) return [];
  const lista = await rpc<Record<string, unknown>[]>("insignia_estado", { p_refs: refs }, "No se pudo revisar ahora.");
  return (Array.isArray(lista) ? lista : [])
    .filter((b) => typeof b["ref"] === "string" && PRUEBAS.includes(b["test_key"] as Prueba))
    .map((b) => ({
      ref: String(b["ref"]),
      prueba: b["test_key"] as Prueba,
      estado: ESTADOS[String(b["status"])] ?? "pendiente",
      nivel: b["level"] === "destacado" || b["level"] === "solido" ? b["level"] : null,
      // Solo el primer nombre: la página de verificación es pública.
      nombre: typeof b["first_name"] === "string" && b["first_name"] ? String(b["first_name"]).slice(0, 40) : null,
      fecha: typeof b["completed_at"] === "string" ? String(b["completed_at"]) : null,
    }));
}

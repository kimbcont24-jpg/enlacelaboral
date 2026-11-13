import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Conversación con Perfila de servidor a servidor. La clave compartida vive solo en el servidor
 * (variable PERFILA_PARTNER_SECRET en Vercel) y nunca llega al navegador.
 */
const PRUEBAS = ["servicio_cliente", "excel_word", "ortografia_redaccion", "calculo_caja"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EstadoInsignia = {
  ref: string;
  prueba: (typeof PRUEBAS)[number];
  estado: "pendiente" | "en_curso" | "terminada" | "vencida" | "cancelada";
  nivel: "destacado" | "solido" | null;
  nombre: string | null;
  fecha: string | null;
};

function config() {
  const secreto = process.env["PERFILA_PARTNER_SECRET"] ?? "";
  const base = (process.env["PERFILA_URL"] ?? "https://talent-do-ai.lovable.app").replace(/\/$/, "");
  return { secreto, base, lista: secreto.length === 64 };
}

async function llamar(cuerpo: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { secreto, base, lista } = config();
  if (!lista) throw new Error("Las insignias se están activando. Vuelve a intentarlo en un rato.");
  let res: Response;
  try {
    res = await fetch(`${base}/api/enlace/insignias`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-perfila-partner": secreto },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new Error("Perfila no respondió. Intenta de nuevo en un momento.");
  }
  const datos = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg = typeof datos["error"] === "string" && res.status === 422 ? datos["error"] : "No se pudo conectar con Perfila. Intenta de nuevo.";
    throw new Error(msg);
  }
  return datos;
}

/** ¿Está conectada Perfila? (para mostrar el botón o el aviso de «muy pronto»). */
export const insigniasActivas = createServerFn({ method: "GET" }).handler(async () => ({ activas: config().lista }));

export const pedirInsignia = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      prueba: z.enum(PRUEBAS),
      nombre: z.string().trim().min(2, "Escribe tu nombre").max(120),
      correo: z.string().trim().toLowerCase().email("Escribe un correo válido").max(160),
      regreso: z.string().url().max(300),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    // Solo se vuelve a una página de Enlace (sitio publicado o local).
    const u = new URL(data.regreso);
    const propio = u.hostname === "enlacelaboralrd.com" || u.hostname === "www.enlacelaboralrd.com" || u.hostname.endsWith(".vercel.app") || u.hostname === "localhost" || u.hostname === "127.0.0.1";
    const regreso = propio ? `${u.origin}/insignias` : "https://enlacelaboralrd.com/insignias";
    const r = await llamar({ action: "start", email: data.correo, name: data.nombre, test: data.prueba, returnUrl: regreso });
    const ref = typeof r["ref"] === "string" ? r["ref"] : "";
    const url = typeof r["url"] === "string" ? r["url"] : "";
    if (!UUID.test(ref) || !/^https?:\/\//.test(url)) throw new Error("Perfila no devolvió el enlace de la prueba.");
    return { ref, url, reusada: r["reused"] === true };
  });

const ESTADOS: Record<string, EstadoInsignia["estado"]> = {
  sent: "pendiente", in_progress: "en_curso", completed: "terminada", expired: "vencida", cancelled: "cancelada",
};

export const consultarInsignias = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ refs: z.array(z.string().regex(UUID)).min(1).max(20) }).parse(d))
  .handler(async ({ data }): Promise<EstadoInsignia[]> => {
    const r = await llamar({ action: "status", refs: data.refs });
    const lista = Array.isArray(r["badges"]) ? (r["badges"] as Record<string, unknown>[]) : [];
    return lista
      .filter((b) => typeof b["ref"] === "string" && PRUEBAS.includes(b["test_key"] as (typeof PRUEBAS)[number]))
      .map((b) => ({
        ref: String(b["ref"]),
        prueba: b["test_key"] as EstadoInsignia["prueba"],
        estado: ESTADOS[String(b["status"])] ?? "pendiente",
        nivel: b["level"] === "destacado" || b["level"] === "solido" ? b["level"] : null,
        // Solo el primer nombre: la página de verificación es pública.
        nombre: typeof b["first_name"] === "string" && b["first_name"] ? String(b["first_name"]).slice(0, 40) : null,
        fecha: typeof b["completed_at"] === "string" ? String(b["completed_at"]) : null,
      }));
  });

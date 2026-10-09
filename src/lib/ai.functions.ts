import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const NexaInput = z.object({
  mensajes: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1500) })).min(1).max(20),
});

const SISTEMA = "Eres Nexa, la asistente de Enlace Laboral, portal de empleo de República Dominicana. Hablas español dominicano, cercano, claro y breve.";

export const preguntarNexa = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NexaInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Nexa no está configurada todavía.");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({ model: "google/gemini-3.7-flash", messages: [{ role: "system", content: SISTEMA }, ...data.mensajes], max_tokens: 500 }),
    });
    if (!res.ok) throw new Error("Nexa no respondió");
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { texto: json.choices?.[0]?.message?.content?.trim() || "No pude generar respuesta. Intenta de nuevo." };
  });

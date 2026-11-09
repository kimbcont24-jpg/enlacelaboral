import type { Hallazgo } from "@/lib/inclusion";

/** Recuadro rojo: frases que discriminan y por qué. Lo usan los formularios de publicar. */
export function AvisoExclusion({ hallazgos, para = "empresa" }: { hallazgos: Hallazgo[]; para?: "empresa" | "admin" }) {
  if (!hallazgos.length) return null;
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm">
      <p className="font-extrabold text-destructive">{para === "admin" ? "Corrige esto antes de publicar" : "Cambia esto antes de enviar"}</p>
      <ul className="mt-1.5 space-y-1">{hallazgos.map((x) => <li key={x.frase}><strong>«{x.frase}»</strong>: {x.motivo}</li>)}</ul>
      <p className="mt-2 text-xs text-muted-foreground">En Enlace Laboral está prohibido pedir edad, sexo, foto o CV con foto, estado civil, hijos o rasgos físicos. El Código de Trabajo (Principio VII) prohíbe excluir por estos motivos. Pide lo que el puesto necesita de verdad.</p>
    </div>
  );
}

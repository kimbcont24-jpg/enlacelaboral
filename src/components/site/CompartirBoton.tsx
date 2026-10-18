import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { enlaceWhatsApp, SITIO, type Vacante } from "@/lib/vacantes";

/** Comparte con el menú del teléfono si existe; si no, abre WhatsApp. */
export function CompartirBoton({ job, solo = false, className = "" }: { job: Vacante; solo?: boolean; className?: string }) {
  const [copiado, setCopiado] = useState(false);
  const compartir = async () => {
    const url = `${SITIO}/vacantes/${job.id}`;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: `${job.titulo} en ${job.provincia}`, text: `${job.titulo} · ${job.salario}`, url });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
    window.open(enlaceWhatsApp(job), "_blank", "noopener,noreferrer");
    try { await navigator.clipboard?.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch { /* sin portapapeles */ }
  };
  return (
    <button type="button" onClick={compartir} aria-label="Compartir esta vacante" className={`inline-flex items-center justify-center gap-2 rounded-xl border border-border font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary ${solo ? "size-11" : "px-4 py-3 text-sm"} ${className}`}>
      {copiado ? <Check className="size-4 text-success" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
      {!solo && (copiado ? "Enlace copiado" : "Compartir")}
    </button>
  );
}

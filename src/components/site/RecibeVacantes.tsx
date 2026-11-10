import { useState } from "react";
import { BellRing } from "lucide-react";

import { AlertaForm } from "@/components/site/AlertaForm";
import { CANAL_WHATSAPP } from "@/lib/vacantes";
import { cn } from "@/lib/utils";

function IconoWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.97.23-3.27-.68-2.76-1.09-4.5-3.92-4.64-4.1-.14-.18-1.1-1.47-1.1-2.8 0-1.34.7-1.99.95-2.27.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.6.46.23.54.77 1.87.84 2.01.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.89 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.6-.14.25.09 1.57.74 1.84.88.27.14.45.2.52.32.07.11.07.66-.17 1.33Z" />
    </svg>
  );
}

/** Un solo bloque para recibir vacantes: WhatsApp o correo, a elegir. Ocupa la mitad que dos tarjetas. */
export function RecibeVacantes() {
  const [via, setVia] = useState<"wa" | "correo">("wa");
  return (
    <section className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">Gratis y sin cuenta</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight md:text-2xl">Recibe las vacantes nuevas</h2>
          </div>
          <div role="tablist" aria-label="Cómo recibirlas" className="grid grid-cols-2 rounded-full bg-secondary p-1 text-sm font-bold md:w-72">
            <button type="button" role="tab" aria-selected={via === "wa"} onClick={() => setVia("wa")} className={cn("inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-colors", via === "wa" ? "bg-[#1fa855] text-white shadow" : "text-muted-foreground")}>
              <IconoWhatsApp className="size-4" /> WhatsApp
            </button>
            <button type="button" role="tab" aria-selected={via === "correo"} onClick={() => setVia("correo")} className={cn("inline-flex items-center justify-center gap-1.5 rounded-full py-2 transition-colors", via === "correo" ? "bg-cta text-white shadow" : "text-muted-foreground")}>
              <BellRing className="size-4" aria-hidden="true" /> Correo
            </button>
          </div>
        </div>
        <div className="border-t border-border bg-background p-5 sm:p-6">
          {via === "wa" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground sm:text-base">Cada vacante nueva te llega al celular por el canal de Enlace Laboral.</p>
              <a href={CANAL_WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1fa855] px-6 py-3 font-bold text-white hover:bg-[#178c46]">
                <IconoWhatsApp className="size-5" /> Unirme al canal
              </a>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">Cada mañana, solo las vacantes de tu área y tu provincia.</p>
              <AlertaForm compacta />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

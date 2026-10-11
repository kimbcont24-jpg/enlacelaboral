import { CANAL_WHATSAPP } from "@/lib/vacantes";

function IconoWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.97.23-3.27-.68-2.76-1.09-4.5-3.92-4.64-4.1-.14-.18-1.1-1.47-1.1-2.8 0-1.34.7-1.99.95-2.27.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.6.46.23.54.77 1.87.84 2.01.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.89 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.6-.14.25.09 1.57.74 1.84.88.27.14.45.2.52.32.07.11.07.66-.17 1.33Z" />
    </svg>
  );
}

/** Invitación al canal de WhatsApp. "banda" para secciones anchas, "tarjeta" para columnas. */
export function CanalWhatsApp({ variante = "banda" }: { variante?: "banda" | "tarjeta" | "boton" }) {
  if (variante === "boton") {
    return (
      <a href={CANAL_WHATSAPP} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1fa855] py-3 text-sm font-bold text-white hover:bg-[#178c46]">
        <IconoWhatsApp className="size-5" /> Recibir vacantes por WhatsApp
      </a>
    );
  }
  if (variante === "tarjeta") {
    return (
      <div className="rounded-2xl border border-[#1fa855]/30 bg-[#e9f8ef] p-5">
        <p className="flex items-center gap-2 font-bold text-[#0d6b35]"><IconoWhatsApp className="size-5" /> Canal de empleos en WhatsApp</p>
        <p className="mt-1 text-sm text-foreground/80">Publicamos cada vacante nueva en nuestro canal. Te enteras primero, sin buscar.</p>
        <a href={CANAL_WHATSAPP} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#1fa855] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#178c46]">Unirme al canal</a>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl bg-[#e9f8ef] p-6 md:flex-row md:items-center md:justify-between md:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#1fa855] text-white"><IconoWhatsApp className="size-7" /></span>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">Recibe las vacantes en WhatsApp</h2>
          <p className="mt-1 text-foreground/80">Únete al canal de empleos de Enlace Laboral. Cada vacante nueva te llega al celular. Es gratis.</p>
        </div>
      </div>
      <a href={CANAL_WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1fa855] px-6 py-3.5 text-base font-bold text-white hover:bg-[#178c46]">
        <IconoWhatsApp className="size-5" /> Unirme al canal
      </a>
    </div>
  );
}

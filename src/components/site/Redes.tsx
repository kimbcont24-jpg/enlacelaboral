import { Mail } from "lucide-react";

import { CANAL_TELEGRAM, CANAL_WHATSAPP, CORREO_EMPRESAS, CORREO_INFO, INSTAGRAM } from "@/lib/vacantes";

type Icono = ({ className }: { className?: string }) => React.ReactElement;

export const IconoWhatsApp: Icono = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.97.23-3.27-.68-2.76-1.09-4.5-3.92-4.64-4.1-.14-.18-1.1-1.47-1.1-2.8 0-1.34.7-1.99.95-2.27.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.6.46.23.54.77 1.87.84 2.01.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.89 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.6-.14.25.09 1.57.74 1.84.88.27.14.45.2.52.32.07.11.07.66-.17 1.33Z" /></svg>
);
export const IconoTelegram: Icono = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M21.94 4.3a1.2 1.2 0 0 0-1.62-1.23L2.9 9.8c-1.18.46-1.16 1.12-.2 1.42l4.46 1.39 1.72 5.28c.21.58.1.81.71.81.47 0 .68-.21.94-.47l2.25-2.19 4.68 3.46c.86.47 1.48.23 1.7-.8l3.07-14.4ZM8.9 13.1l9.15-5.78c.43-.26.82-.12.5.17l-7.84 7.07-.3 3.25-1.5-4.71Z" /></svg>
);
export const IconoInstagram: Icono = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>
);

export const REDES: { nombre: string; usuario: string; href: string; I: Icono; color: string; texto: string }[] = [
  { nombre: "WhatsApp", usuario: "Canal Enlace Laboral", href: CANAL_WHATSAPP, I: IconoWhatsApp, color: "#1fa855", texto: "Cada vacante nueva, en tu celular." },
  { nombre: "Telegram", usuario: "@enlacelaboral", href: CANAL_TELEGRAM, I: IconoTelegram, color: "#229ed9", texto: "Las vacantes llegan solas al canal." },
  { nombre: "Instagram", usuario: "@enlacelaboralrd", href: INSTAGRAM, I: IconoInstagram, color: "#d6249f", texto: "Consejos, guías y vacantes destacadas." },
];

/** Íconos redondos para el pie de página. */
export function RedesIconos() {
  return (
    <ul className="flex gap-2" aria-label="Síguenos">
      {REDES.map((r) => (
        <li key={r.nombre}>
          <a href={r.href} target="_blank" rel="noopener noreferrer" aria-label={`${r.nombre} de Enlace Laboral (${r.usuario})`} title={`${r.nombre} · ${r.usuario}`}
            className="grid size-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <r.I className="size-5" />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Tarjetas de canales y correos para la página de Contacto. */
export function CanalesContacto() {
  const correos = [
    { t: "Preguntas generales", d: "Dudas, sugerencias, prensa y alianzas.", c: CORREO_INFO },
    { t: "Empresas", d: "Publicar vacantes, tu cuenta y planes.", c: CORREO_EMPRESAS },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {correos.map((x) => (
          <a key={x.c} href={`mailto:${x.c}`} className="group rounded-2xl border border-border bg-surface p-4 hover:border-primary">
            <span className="flex items-center gap-2 font-bold"><Mail className="size-5 text-primary" aria-hidden="true" /> {x.t}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{x.d}</span>
            <span className="mt-2 block break-all font-semibold text-primary group-hover:underline">{x.c}</span>
          </a>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {REDES.map((r) => (
          <a key={r.nombre} href={r.href} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-border bg-surface p-4 hover:border-primary">
            <span className="flex items-center gap-2 font-bold"><span className="grid size-9 place-items-center rounded-xl text-white" style={{ background: r.color }}><r.I className="size-5" /></span>{r.nombre}</span>
            <span className="mt-2 block text-sm font-semibold">{r.usuario}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">{r.texto}</span>
          </a>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Por las redes no pedimos dinero ni datos bancarios. Si alguien te escribe en nombre de Enlace Laboral pidiendo un pago, es una estafa.</p>
    </div>
  );
}

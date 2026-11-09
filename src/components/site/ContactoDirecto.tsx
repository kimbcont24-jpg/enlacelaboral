import { useState } from "react";
import { Check, Copy, ExternalLink, Link2, Mail, MessageCircle, Phone } from "lucide-react";

import type { Vacante } from "@/lib/vacantes";

/**
 * Mientras no haya dominio propio (envío automático por Resend), la vacante muestra
 * el contacto directo de la empresa y la fuente original bien a la vista.
 * El formulario de Enlace queda como opción secundaria.
 */

export type Contacto = { correos: string[]; telefonos: string[]; url: string; asunto: string };

export function leerContacto(aplicar: string): Contacto {
  const t = (aplicar ?? "").trim();
  const correos = [...new Set(t.match(/[\w.+-]+@[\w-]+\.[\w.-]*\w/g) ?? [])];
  const url = t.match(/https?:\/\/\S+/)?.[0]?.replace(/[).,;]+$/, "") ?? "";
  const sinOtros = t.replace(/https?:\/\/\S+/g, " ").replace(/[\w.+-]+@[\w-]+\.[\w.-]*\w/g, " ");
  const telefonos = [...new Set((sinOtros.match(/\+?\d[\d\s().-]{8,}\d/g) ?? []).map((n) => n.trim()).filter((n) => n.replace(/\D/g, "").length >= 10))];
  const asunto = t.match(/asunto:?\s*«?"?([^)»"\n·|]+)/i)?.[1]?.trim() ?? "";
  return { correos, telefonos, url, asunto };
}

/** ¿La vacante tiene algo directo que mostrar (correo, WhatsApp, enlace o publicación original)? */
export function tieneContactoDirecto(job: Pick<Vacante, "aplicar" | "fuenteUrl">): boolean {
  const c = leerContacto(job.aplicar);
  return c.correos.length > 0 || c.telefonos.length > 0 || !!c.url || !!job.fuenteUrl;
}

const wa = (n: string) => {
  const d = n.replace(/\D/g, "");
  return `https://wa.me/${d.length === 10 ? `1${d}` : d}`;
};

function BotonCopiar({ texto, etiqueta, pequeno = false }: { texto: string; etiqueta: string; pequeno?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 2200); } catch { /* sin portapapeles */ }
      }}
      className={pequeno ? "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary" : "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-surface px-3 text-sm font-bold text-primary hover:bg-primary/5"}
    >
      {ok ? <Check className={pequeno ? "size-3.5" : "size-4"} aria-hidden="true" /> : <Copy className={pequeno ? "size-3.5" : "size-4"} aria-hidden="true" />} {ok ? "¡Copiado!" : etiqueta}
    </button>
  );
}

export function ContactoDirecto({ job, compacto = false, alUsar }: { job: Vacante; compacto?: boolean; alUsar?: () => void }) {
  const c = leerContacto(job.aplicar);
  const asunto = c.asunto || `Aplicación: ${job.titulo}`;
  const cuerpo = `Hola,\n\nVi la vacante «${job.titulo}» en Enlace Laboral y me gustaría aplicar. Adjunto mi CV.\n\nNombre:\nTeléfono:\n\nGracias.`;
  const fuenteVisible = (job.fuente && job.fuente !== "Enlace Laboral" && job.fuente !== "Carga masiva") || !!job.fuenteUrl;
  // Si el enlace para aplicar es la misma publicación original, se muestra un solo botón.
  const mismoEnlace = !!c.url && c.url === job.fuenteUrl;

  return (
    <div id="aplicar-directo" className="space-y-3">
      {!compacto && <p className="text-base font-extrabold">Aplica directo con la empresa</p>}

      {c.correos.map((correo) => (
        <div key={correo} className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary"><Mail className="size-4" aria-hidden="true" /> Envía tu CV a este correo</p>
          <p className="mt-1.5 select-all break-all text-lg font-extrabold leading-snug text-foreground">{correo}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Asunto: <span className="font-semibold text-foreground">{asunto}</span>. Adjunta tu CV en PDF.
          </p>
          <a
            href={`mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`}
            onClick={alUsar}
            className="btn-aplicar mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg"
          >
            <Mail className="size-5" aria-hidden="true" /> Aplicar
          </a>
          <div className="mt-2 flex justify-center">
            <BotonCopiar texto={correo} etiqueta="Copiar correo" pequeno />
          </div>
        </div>
      ))}

      {c.telefonos.map((tel) => (
        <div key={tel} className="rounded-2xl border-2 border-[#1fa855]/30 bg-[#1fa855]/5 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#178a45]"><Phone className="size-4" aria-hidden="true" /> Teléfono / WhatsApp de la empresa</p>
          <p className="mt-1.5 select-all text-lg font-extrabold text-foreground">{tel}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <BotonCopiar texto={tel} etiqueta="Copiar número" />
            <a
              href={`${wa(tel)}?text=${encodeURIComponent(`Hola, vi la vacante «${job.titulo}» en Enlace Laboral y me gustaría aplicar.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={alUsar}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1fa855] px-3 text-sm font-bold text-white hover:opacity-90"
            >
              <MessageCircle className="size-4" aria-hidden="true" /> Escribir por WhatsApp
            </a>
          </div>
        </div>
      ))}

      {c.url && !mismoEnlace && (
        <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={alUsar} className="btn-aplicar flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-base">
          <Link2 className="size-5" aria-hidden="true" /> Aplicar en el enlace de la empresa
        </a>
      )}

      {fuenteVisible && (
        <div className="rounded-2xl border border-border bg-secondary/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Fuente</p>
          <p className="mt-0.5 text-base font-extrabold">{job.fuente || "Publicación original"}</p>
          {job.fuenteUrl ? (
            <a href={job.fuenteUrl} target="_blank" rel="noopener noreferrer" onClick={mismoEnlace ? alUsar : undefined} className={mismoEnlace ? "btn-aplicar mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-3 text-base" : "mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-foreground/15 bg-surface px-3 text-sm font-bold hover:bg-secondary"}>
              <ExternalLink className="size-4" aria-hidden="true" /> {mismoEnlace ? "Aplicar en la publicación original" : "Ver la publicación original"}
            </a>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Así la publicó la empresa o su reclutador/a.</p>
          )}
        </div>
      )}
    </div>
  );
}

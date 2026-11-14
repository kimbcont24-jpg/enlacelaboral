import { useEffect, useRef, useState } from "react";
import { ClipboardPaste, ImageUp, Loader2, ScanText, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import type { Borrador } from "@/lib/extraer";
import { analizarTexto, crearLector, leerFoto, prepararFoto, type Lector } from "@/lib/ocr";

export type Leido = { b: Borrador; dudas: (keyof Borrador)[]; avisos: string[]; varias: Borrador[]; foto: { blob: Blob; url: string } | null };

/**
 * «Publica desde tu flyer»: la empresa sube la foto del anuncio que ya usa en WhatsApp o Instagram
 * (o pega el texto) y el formulario se llena solo. La lectura corre en su celular o computadora: la foto no sale de ahí hasta que publica.
 */
export function DesdeFlyer({ onLeido }: { onLeido: (l: Leido) => void }) {
  const [estado, setEstado] = useState<"listo" | "leyendo" | "pegar">("listo");
  const [progreso, setProgreso] = useState(0);
  const [texto, setTexto] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const lector = useRef<Lector | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { void lector.current?.cerrar(); }, []);

  const entregar = (crudo: string, foto: Leido["foto"]) => {
    const a = analizarTexto(crudo);
    if (a.texto.replace(/\s/g, "").length < 25 || !a.b.titulo) {
      toast.error(foto ? "No pude leer bien el flyer. Prueba con una foto más clara, o pega el texto." : "No encontré el puesto en ese texto. Revisa que esté completo.");
      return false;
    }
    onLeido({ b: a.b, dudas: a.dudas, avisos: a.avisos.filter((x) => !/empresa|cómo aplicar/i.test(x)), varias: a.varias, foto });
    toast.success("¡Listo! Llenamos el formulario. Revisa lo marcado en amarillo.", { duration: 6000 });
    return true;
  };

  const leerArchivo = async (file: File) => {
    if (!file.type.startsWith("image/")) return void toast.error("Sube una imagen (JPG o PNG) del flyer.");
    if (file.size > 15 * 1024 * 1024) return void toast.error("La imagen pesa mucho. Prueba con una captura de pantalla.");
    setEstado("leyendo"); setProgreso(0);
    try {
      const { lectura, subir } = await prepararFoto(file);
      lector.current ??= await crearLector();
      const r = await leerFoto(lector.current, lectura, (n) => setProgreso(Math.round(n * 100)));
      entregar(r.texto, { blob: subir, url: URL.createObjectURL(subir) });
    } catch {
      toast.error("No pude leer la imagen. Prueba otra vez o pega el texto.");
    } finally { setEstado("listo"); }
  };

  if (estado === "pegar") {
    return (
      <div className="rounded-2xl border border-[#1d6ff2]/30 bg-[#1d6ff2]/[0.04] p-4">
        <div className="flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-extrabold"><ClipboardPaste className="size-4 text-[#1d6ff2]" /> Pega el texto de tu anuncio</p><button type="button" onClick={() => setEstado("listo")} aria-label="Cerrar" className="grid size-8 place-items-center rounded-lg hover:bg-muted"><X className="size-4" /></button></div>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={6} maxLength={6000} autoFocus placeholder="Copia el mensaje que mandas por WhatsApp o pones en Instagram y pégalo aquí." className="mt-2 w-full rounded-xl border border-border bg-surface p-3 text-sm outline-none focus:border-primary" />
        <button type="button" disabled={texto.trim().length < 30} onClick={() => { if (entregar(texto, null)) { setTexto(""); setEstado("listo"); } }} className="btn-aplicar mt-2 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm disabled:opacity-50"><Sparkles className="size-4" /> Llenar el formulario</button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => { e.preventDefault(); setArrastrando(false); const f = e.dataTransfer.files[0]; if (f) void leerArchivo(f); }}
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-4 transition-colors sm:p-5 ${arrastrando ? "border-[#1d6ff2] bg-[#1d6ff2]/10" : "border-[#1d6ff2]/40 bg-gradient-to-br from-[#eef4ff] to-[#fff8e6]"}`}>
      {estado === "leyendo" ? (
        <div className="flex items-center gap-4" aria-live="polite">
          <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-[#0a2f5c] text-white"><ScanText className="size-6" /><span className="absolute inset-x-1 top-1 h-0.5 animate-[escanea_1.4s_ease-in-out_infinite] rounded bg-[#ffd84d]" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">Leyendo tu flyer…</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#1d6ff2] transition-[width]" style={{ width: `${Math.max(6, progreso)}%` }} /></div>
            <p className="mt-1 text-xs text-muted-foreground">Toma unos segundos. La primera vez descarga el lector.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#0a2f5c] text-white"><ImageUp className="size-6" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">¿Ya tienes el flyer? Publica en 2 minutos</p>
            <p className="text-sm text-muted-foreground">Sube la foto del anuncio que mandas por WhatsApp o pones en Instagram. Llenamos el formulario y tú solo revisas.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => input.current?.click()} className="btn-aplicar inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm"><ImageUp className="size-4" /> Subir flyer</button>
            <button type="button" onClick={() => setEstado("pegar")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold"><ClipboardPaste className="size-4" /> Pegar texto</button>
          </div>
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void leerArchivo(f); }} />
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { enlaceAplicar, type Vacante } from "@/lib/vacantes";
import { cvCompleto, leerCV, textoCV, type CV } from "@/lib/cv";
import { Link } from "@tanstack/react-router";

export function ApplyDialog({ job, onClose }: { job: Vacante | null; onClose: () => void }) {
  const [estado, setEstado] = useState<"form" | "enviando" | "listo">("form");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cv, setCv] = useState<CV | null>(null);
  const [incluirCv, setIncluirCv] = useState(true);

  useEffect(() => {
    if (job) {
      setEstado("form"); setError(null);
      const g = leerCV();
      setCv(cvCompleto(g) ? g : null);
      if (cvCompleto(g)) { if (!nombre) setNombre(g.nombre); if (!contacto) setContacto(g.telefono || g.correo); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!job) return null;
  const enlace = enlaceAplicar(job.aplicar);

  const enviar = async () => {
    setEstado("enviando");
    setError(null);
    const texto = [mensaje.trim(), cv && incluirCv ? `--- CV ---\n${textoCV(cv)}` : ""].filter(Boolean).join("\n\n");
    const { error: err } = await supabase.from("aplicaciones").insert({ vacante_id: job.id, nombre: nombre.trim(), contacto: contacto.trim(), mensaje: texto || null });
    if (err) {
      setError("No pudimos enviar tus datos. Intenta de nuevo en un momento.");
      setEstado("form");
      return;
    }
    setEstado("listo");
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-foreground/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-lift)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Aplicar es gratis</p>
            <h2 className="mt-1 text-xl font-extrabold leading-tight">{job.titulo}</h2>
            <p className="text-sm text-muted-foreground">{job.empresa} • {job.provincia}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>

        {job.aplicar ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-secondary p-4 text-sm">
              <p className="font-bold">Cómo aplicar</p>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">{job.aplicar}</p>
            </div>
            {enlace && (
              <a href={enlace.href} target="_blank" rel="noopener noreferrer" className="grad-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-primary-foreground">
                {enlace.label} <ExternalLink className="size-4" />
              </a>
            )}
            <p className="text-xs text-muted-foreground">Vacante publicada originalmente en {job.fuente}. Nunca pagues dinero para ser contratado.</p>
          </div>
        ) : estado === "listo" ? (
          <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-6 text-center">
            <CheckCircle2 className="mx-auto size-10 text-success" />
            <p className="mt-3 text-lg font-bold">¡Recibimos tus datos!</p>
            <p className="mt-1 text-sm text-muted-foreground">Los haremos llegar para esta vacante. Si hay avances, te contactarán por el medio que dejaste.</p>
            <button onClick={onClose} className="grad-primary mt-5 w-full rounded-xl py-3 font-bold text-primary-foreground">Seguir viendo vacantes</button>
          </div>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); void enviar(); }}>
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre completo" className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
            <input required value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="WhatsApp o correo" className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
            <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3} placeholder="Cuéntanos brevemente tu experiencia (opcional)" className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
            {cv ? (
              <label className="flex items-start gap-2 rounded-xl bg-secondary px-4 py-3 text-sm"><input type="checkbox" checked={incluirCv} onChange={(e) => setIncluirCv(e.target.checked)} className="mt-0.5 accent-[var(--cta)]" /> <span>Incluir mi CV de Enlace Laboral ({cv.nombre}). <Link to="/cv" className="font-semibold text-primary underline">Editarlo</Link></span></label>
            ) : (
              <p className="text-sm text-muted-foreground">¿No tienes CV? <Link to="/cv" className="font-semibold text-primary underline">Créalo gratis en 5 minutos</Link> y se incluye solo al aplicar.</p>
            )}
            {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={estado === "enviando"} className="grad-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-primary-foreground disabled:opacity-70">
              {estado === "enviando" ? (<><Loader2 className="size-4 animate-spin" /> Enviando…</>) : "Enviar mis datos"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

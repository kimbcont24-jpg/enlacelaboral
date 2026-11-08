import { useEffect, useRef, useState } from "react";
import { Check, FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { lineasLogros, type CV } from "@/lib/cv";
import { interpretarCV, leerArchivo } from "@/lib/cv-archivos";

/** Trae un CV que la persona ya tiene (PDF, Word o texto pegado) y lo pasa al editor. Se lee en su equipo. */
export function Importar({ actual, onUsar, onCerrar }: { actual: CV; onUsar: (cv: CV) => void; onCerrar: () => void }) {
  const [modo, setModo] = useState<"archivo" | "pegar">("archivo");
  const [texto, setTexto] = useState("");
  const [leyendo, setLeyendo] = useState(false);
  const [resultado, setResultado] = useState<CV | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); }; document.addEventListener("keydown", t); return () => document.removeEventListener("keydown", t); }, [onCerrar]);

  const procesar = (t: string) => {
    if (t.trim().length < 40) return void toast.error("No encontramos texto suficiente. Si tu CV es una foto o un escaneo, cópialo y pégalo a mano.");
    setResultado(interpretarCV(t));
  };
  const subir = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 8e6) return void toast.error("El archivo es muy grande (máximo 8 MB).");
    setLeyendo(true);
    try { procesar(await leerArchivo(f)); } catch { toast.error("No pudimos leer ese archivo. Prueba con PDF, Word (.docx) o pega el texto."); } finally { setLeyendo(false); if (entrada.current) entrada.current.value = ""; }
  };
  const usar = () => {
    if (!resultado) return;
    if ((actual.nombre.trim() || actual.resumen.trim()) && !confirm("Esto reemplaza lo que ya tienes escrito en el CV. ¿Seguir?")) return;
    onUsar(resultado);
  };

  const r = resultado;
  const filas: [string, string | number, boolean][] = r ? [
    ["Nombre", r.nombre || "—", !!r.nombre],
    ["Contacto", [r.telefono, r.correo].filter(Boolean).join(" · ") || "—", !!(r.telefono || r.correo)],
    ["Perfil", r.resumen ? `${r.resumen.slice(0, 70)}${r.resumen.length > 70 ? "…" : ""}` : "—", !!r.resumen],
    ["Experiencias", r.experiencia.filter((e) => e.puesto.trim()).length, r.experiencia.some((e) => e.puesto.trim())],
    ["Logros", r.experiencia.reduce((n, e) => n + lineasLogros(e.logros).length, 0), r.experiencia.some((e) => e.logros.trim())],
    ["Estudios", r.educacion.filter((e) => e.titulo.trim()).length, r.educacion.some((e) => e.titulo.trim())],
    ["Cursos", r.cursos.length, r.cursos.length > 0],
    ["Habilidades", r.habilidades.split(",").filter((h) => h.trim()).length, !!r.habilidades.trim()],
  ] : [];

  return (
    <div className="no-print fixed inset-0 z-[70] grid place-items-end sm:place-items-center" role="dialog" aria-modal="true" aria-label="Importar mi CV">
      <button type="button" tabIndex={-1} aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 bg-[#0a1a33]/50" />
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4"><h2 className="font-display text-lg font-extrabold">Importar mi CV</h2><button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid size-9 place-items-center rounded-lg hover:bg-muted"><X className="size-5" /></button></header>
        <div className="overflow-y-auto p-5">
          {!r ? (
            <>
              <p className="text-sm text-muted-foreground">¿Ya tienes un CV? Lo pasamos a Enlace Laboral para que lo mejores con los diseños y el revisor. Tu archivo se lee en tu teléfono o computadora: no se sube a ningún lado.</p>
              <div className="mt-4 inline-flex rounded-xl border border-border bg-background p-1">
                {([["archivo", "Subir archivo"], ["pegar", "Pegar texto"]] as const).map(([m, t]) => <button key={m} type="button" onClick={() => setModo(m)} className={`rounded-lg px-4 py-2 text-sm font-bold ${modo === m ? "bg-[#0a2f5c] text-white" : "text-muted-foreground"}`}>{t}</button>)}
              </div>
              {modo === "archivo" ? (
                <button type="button" onClick={() => entrada.current?.click()} disabled={leyendo} className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1d6ff2]/40 bg-[#1d6ff2]/[0.04] px-4 py-10 text-center hover:border-[#1d6ff2]">
                  {leyendo ? <Loader2 className="size-7 animate-spin text-[#1d6ff2]" /> : <FileUp className="size-7 text-[#1d6ff2]" />}
                  <span className="font-bold">{leyendo ? "Leyendo tu CV…" : "Elegir mi CV"}</span>
                  <span className="text-sm text-muted-foreground">PDF, Word (.docx) o texto (.txt)</span>
                </button>
              ) : (
                <>
                  <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={10} placeholder="Copia todo el texto de tu CV y pégalo aquí." className="mt-4 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-[14px]" />
                  <button type="button" onClick={() => procesar(texto)} className="btn-aplicar mt-3 h-11 w-full rounded-xl text-sm">Leer mi CV</button>
                </>
              )}
              <input ref={entrada} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="hidden" onChange={(e) => void subir(e.target.files?.[0])} />
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Esto es lo que encontramos. Después lo puedes corregir en cada paso.</p>
              <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
                {filas.map(([t, v, ok]) => <li key={t} className="flex items-center gap-3 px-4 py-2.5 text-sm"><span className={`grid size-5 shrink-0 place-items-center rounded-full ${ok ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>{ok ? <Check className="size-3" /> : "–"}</span><span className="w-24 shrink-0 font-semibold">{t}</span><span className="min-w-0 truncate text-muted-foreground">{v}</span></li>)}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={usar} className="btn-aplicar h-11 flex-1 rounded-xl px-5 text-sm">Usar estos datos</button>
                <button type="button" onClick={() => setResultado(null)} className="h-11 rounded-xl border border-border px-4 text-sm font-bold">Probar otro</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

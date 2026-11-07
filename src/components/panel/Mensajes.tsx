import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { usePanel } from "@/components/panel/contexto";
import { Titulo } from "@/components/panel/comun";
import { supabase } from "@/integrations/supabase/client";
import { mensajePara, PLANTILLAS, VARIABLES, type ClavePlantilla, type Etapa, type Plantillas } from "@/lib/panel";

const ETAPA_DE: Record<ClavePlantilla, Etapa> = { recibido: "revision", entrevista: "entrevista", contratado: "contratado", descartado: "descartado" };

export function Mensajes() {
  const p = usePanel();
  const [textos, setTextos] = useState<Plantillas>(() => Object.fromEntries(PLANTILLAS.map((x) => [x.clave, p.empresa.plantillas[x.clave] || x.texto])));
  const [guardando, setGuardando] = useState(false);
  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const ejemplo = { nombre: "María Pérez", entrevista_at: (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return d.toISOString(); })(), entrevista_lugar: "Av. Abraham Lincoln #45, 3er piso" };
  const puesto = p.vacantes[0]?.titulo ?? "Auxiliar de almacén";

  const insertar = (clave: ClavePlantilla, v: string) => {
    const el = refs.current[clave];
    const t = textos[clave] ?? "";
    const i = el?.selectionStart ?? t.length, f = el?.selectionEnd ?? t.length;
    setTextos((x) => ({ ...x, [clave]: t.slice(0, i) + v + t.slice(f) }));
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(i + v.length, i + v.length); });
  };

  const guardar = async () => {
    setGuardando(true);
    // Solo guardamos las que cambió; las demás siguen la plantilla de Enlace.
    const propias = Object.fromEntries(PLANTILLAS.filter((x) => (textos[x.clave] ?? "").trim() && textos[x.clave]!.trim() !== x.texto).map((x) => [x.clave, textos[x.clave]!.trim()]));
    const { error } = await supabase.from("empresas").update({ plantillas: propias }).eq("id", p.empresa.id);
    setGuardando(false);
    if (error) return void toast.error("No se pudo guardar. Intenta otra vez.");
    p.setEmpresa({ ...p.empresa, plantillas: propias });
    toast.success("Mensajes guardados. Se usan desde ahora.");
  };

  return (
    <>
      <Titulo titulo="Mensajes a candidatos" sub="Así le escribe tu empresa a cada persona. Se llenan solos con su nombre, el puesto y la cita.">
        <button type="button" onClick={() => void guardar()} disabled={guardando} className="btn-aplicar h-10 rounded-xl px-5 text-sm">{guardando ? "Guardando…" : "Guardar mensajes"}</button>
      </Titulo>
      <div className="space-y-4">
        {PLANTILLAS.map((x) => (
          <section key={x.clave} className="grid gap-4 rounded-2xl border border-border bg-surface p-5 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div><h2 className="font-extrabold">{x.titulo}</h2><p className="text-xs text-muted-foreground">{x.cuando}</p></div>
                {textos[x.clave] !== x.texto && <button type="button" onClick={() => setTextos((t) => ({ ...t, [x.clave]: x.texto }))} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"><RotateCcw className="size-3.5" /> Original</button>}
              </div>
              <textarea ref={(el) => { refs.current[x.clave] = el; }} value={textos[x.clave] ?? ""} onChange={(e) => setTextos((t) => ({ ...t, [x.clave]: e.target.value }))} rows={5} maxLength={900} aria-label={x.titulo} className="mt-3 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {VARIABLES.filter((v) => x.clave === "entrevista" || !["{fecha}", "{hora}", "{lugar}"].includes(v)).map((v) => <button key={v} type="button" onClick={() => insertar(x.clave, v)} className="rounded-md bg-secondary px-2 py-1 font-mono text-xs font-semibold text-primary hover:bg-[#1d6ff2]/15">{v}</button>)}
              </div>
            </div>
            <div className="rounded-2xl bg-[#e7ddd3] p-4" aria-label="Vista previa">
              <p className="mb-2 text-[11px] font-semibold text-[#5c5148]">Así lo recibe</p>
              <div className="ml-auto max-w-[92%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-[#d9fdd3] px-3.5 py-2.5 text-sm text-[#111b21] shadow-sm">{mensajePara(ETAPA_DE[x.clave], ejemplo, puesto, p.empresa.nombre, textos)}</div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

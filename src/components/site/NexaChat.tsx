import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { preguntarNexa } from "@/lib/ai.functions";

const sugerencias = ["¿Qué vacantes hay para primer empleo?", "Ayúdame a mejorar mi CV", "¿Cómo publico una vacante gratis?"];

export function NexaChat() {
  const consultarNexa = useServerFn(preguntarNexa);
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<{ de: "nexa" | "yo"; texto: string }[]>([{ de: "nexa", texto: "¡Hola! Soy Nexa, tu asistente laboral de Enlace." }]);
  const [texto, setTexto] = useState("");
  const [respondiendo, setRespondiendo] = useState(false);

  useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener("abrir-nexa", abrir);
    return () => window.removeEventListener("abrir-nexa", abrir);
  }, []);

  const enviar = async (valor: string) => {
    const v = valor.trim();
    if (!v || respondiendo) return;
    const siguientes = [...mensajes, { de: "yo" as const, texto: v }];
    setMensajes(siguientes);
    setTexto("");
    setRespondiendo(true);
    try {
      const r = await consultarNexa({ data: { mensajes: siguientes.map((m) => ({ role: m.de === "yo" ? ("user" as const) : ("assistant" as const), content: m.texto })) } });
      setMensajes((a) => [...a, { de: "nexa", texto: r.texto }]);
    } catch {
      setMensajes((a) => [...a, { de: "nexa", texto: "Ahora mismo no pude responder. Intenta nuevamente en un momento." }]);
    } finally {
      setRespondiendo(false);
    }
  };

  return (
    <>
      {abierto && (
        <div className="fixed bottom-24 right-4 z-[90] flex h-[26rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-lift)]">
          <div className="hero-dark flex items-center gap-3 px-4 py-3">
            <Bot className="size-5" />
            <p className="flex-1 text-sm font-bold">Nexa · Enlace IA</p>
            <Button type="button" variant="ghost" size="icon" onClick={() => setAbierto(false)} aria-label="Cerrar chat" className="text-primary-foreground"><X className="size-4" /></Button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {mensajes.map((m, i) => (<div key={i} className={m.de === "nexa" ? "max-w-[85%] rounded-2xl bg-secondary p-3 text-sm" : "ml-auto max-w-[85%] rounded-2xl bg-primary p-3 text-sm text-primary-foreground"}>{m.texto}</div>))}
            <div className="flex flex-wrap gap-2 pt-1">
              {sugerencias.map((s) => (<Button type="button" variant="outline" size="sm" key={s} onClick={() => void enviar(s)} disabled={respondiendo} className="h-auto whitespace-normal rounded-full px-3 py-1 text-left text-[11px]">{s}</Button>))}
            </div>
            {respondiendo && (<p className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="size-3.5 animate-pulse text-primary" /> Nexa está pensando…</p>)}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void enviar(texto); }} className="flex items-center gap-2 border-t border-border p-3">
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escríbele a Nexa…" className="w-full bg-transparent px-2 text-sm outline-none" />
            <Button type="submit" size="icon" disabled={respondiendo || !texto.trim()} aria-label="Enviar" className="size-9 shrink-0 rounded-full"><Send className="size-4" /></Button>
          </form>
        </div>
      )}
      <Button type="button" onClick={() => setAbierto((v) => !v)} aria-label="Abrir asistente Nexa" className="grad-primary fixed bottom-5 right-4 z-[90] h-auto rounded-full px-4 py-3 font-bold shadow-[var(--shadow-glow)]">
        <Bot className="size-4" />
        <span className="hidden text-sm sm:inline">Pregúntale a Nexa</span>
      </Button>
    </>
  );
}

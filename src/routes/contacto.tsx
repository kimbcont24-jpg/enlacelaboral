import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Clock3, Flag, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Consentimiento } from "@/components/site/Consentimiento";
import { Bloque, PaginaLegal } from "@/components/site/Legal";
import { supabase } from "@/integrations/supabase/client";
import { CANAL_WHATSAPP } from "@/lib/vacantes";

type Tipo = "contacto" | "empresa" | "denuncia";
export const Route = createFileRoute("/contacto")({
  validateSearch: (s: Record<string, unknown>): { tipo?: Tipo } => (["contacto", "empresa", "denuncia"].includes(s["tipo"] as string) ? { tipo: s["tipo"] as Tipo } : {}),
  head: () => ({ meta: [{ title: "Contacto y ayuda | Enlace Laboral" }, { name: "description", content: "Preguntas frecuentes y formulario para escribirle al equipo de Enlace Laboral. Reporta ofertas sospechosas." }] }),
  component: Contacto,
});

const PREGUNTAS: [string, React.ReactNode][] = [
  ["¿Cuesta algo buscar empleo aquí?", "No. Es gratis para quien busca empleo, siempre. Si alguien te pide dinero por un puesto, es una estafa: repórtalo abajo."],
  ["¿Tengo que crear una cuenta para aplicar?", <>No. Aplicas con tu nombre y tu WhatsApp o correo. La cuenta es opcional y sirve para guardar tu CV y seguir tus aplicaciones en <Link to="/guardadas" className="font-semibold text-primary underline">Mi búsqueda</Link>.</>],
  ["Apliqué y no me han respondido. ¿Qué hago?", "Cada empresa revisa a su ritmo. Puedes ver tus aplicaciones en «Mi búsqueda» y seguir aplicando a otras vacantes. Las empresas que más responden lo muestran en su vacante."],
  ["¿Cómo hago mi CV?", <>Con el <Link to="/cv" className="font-semibold text-primary underline">creador de CV</Link>, gratis. Lo descargas en PDF y lo puedes enviar al aplicar.</>],
  ["Soy empresa. ¿Cómo publico?", <>Crea tu cuenta en <Link to="/empresas" className="font-semibold text-primary underline">Empresas</Link> con tu RNC o cédula y publica gratis desde tu panel.</>],
  ["Quiero que borren mis datos.", <>Pídelo en la <Link to="/privacidad" hash="pedir" className="font-semibold text-primary underline">política de privacidad</Link>, en «Pedir ver, corregir o borrar tus datos».</>],
];

function Contacto() {
  return (
    <PaginaLegal actual="/contacto" etiqueta="Estamos para ayudarte" titulo="Contacto y ayuda" intro={<p>Mira primero las preguntas frecuentes. Si no encuentras la respuesta, escríbenos.</p>}
      resumen={[
        { I: MessageCircle, t: "Te respondemos nosotros", d: "Personas reales, al correo o WhatsApp que nos dejes." },
        { I: Flag, t: "Reporta una estafa", d: "Si alguien te pidió dinero por un empleo, avísanos aquí." },
        { I: Clock3, t: "Tus datos personales", d: "Para ver, corregir o borrarlos, usa el formulario de Privacidad." },
      ]}
      indice={[["preguntas", "Preguntas frecuentes"], ["escribir", "Escríbenos"]]}>
      <Bloque id="preguntas" titulo="Preguntas frecuentes">
        <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {PREGUNTAS.map(([p, r]) => (
            <details key={p} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">{p}<ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
              <p className="mt-2 text-muted-foreground">{r}</p>
            </details>
          ))}
        </div>
        <p className="text-sm">Recibe vacantes nuevas en el <a href={CANAL_WHATSAPP} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">canal de WhatsApp de Enlace Laboral</a>.</p>
      </Bloque>
      <Bloque id="escribir" titulo="Escríbenos">
        <Formulario />
      </Bloque>
    </PaginaLegal>
  );
}

function Formulario() {
  const { tipo } = Route.useSearch();
  const [f, setF] = useState({ tipo: tipo ?? "contacto", nombre: "", contacto: "", vacante: "", detalle: "" });
  const [estado, setEstado] = useState<"listo" | "enviando" | "hecho">("listo");
  const caja = "mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-3 font-normal outline-none focus:border-primary";
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.nombre.trim().length < 2 || f.contacto.trim().length < 5) return void toast.error("Escribe tu nombre y tu correo o WhatsApp.");
    if (f.detalle.trim().length < 10) return void toast.error("Cuéntanos un poco más en el mensaje.");
    setEstado("enviando");
    const { error } = await supabase.from("solicitudes_datos").insert({ tipo: f.tipo, nombre: f.nombre.trim(), contacto: f.contacto.trim(), detalle: f.detalle.trim(), vacante: f.tipo === "denuncia" ? f.vacante.trim() || null : null });
    if (error) { setEstado("listo"); return void toast.error(error.message.includes("tráfico") ? error.message : "No se pudo enviar. Intenta otra vez."); }
    setEstado("hecho");
  };
  if (estado === "hecho") return <p className="rounded-2xl bg-success/10 p-4 font-semibold text-success">Recibido. Te respondemos al correo o WhatsApp que escribiste.</p>;
  return (
    <form onSubmit={(e) => void enviar(e)} className="space-y-3 rounded-2xl border border-border bg-surface p-5">
      <label className="block text-sm font-bold">Sobre qué es
        <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as Tipo })} className={caja}>
          <option value="contacto">Una pregunta o sugerencia</option>
          <option value="empresa">Soy empresa (planes, publicar, mi cuenta)</option>
          <option value="denuncia">Reportar una oferta o empresa sospechosa</option>
        </select>
      </label>
      <label className="block text-sm font-bold">Tu nombre<input required maxLength={150} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} className={caja} /></label>
      <label className="block text-sm font-bold">Tu correo o WhatsApp<input required maxLength={200} value={f.contacto} onChange={(e) => setF({ ...f, contacto: e.target.value })} className={caja} /></label>
      {f.tipo === "denuncia" && <label className="block text-sm font-bold">Enlace o nombre de la vacante <span className="font-normal text-muted-foreground">(si lo tienes)</span><input maxLength={300} value={f.vacante} onChange={(e) => setF({ ...f, vacante: e.target.value })} className={caja} /></label>}
      <label className="block text-sm font-bold">Mensaje<textarea required rows={4} maxLength={2000} value={f.detalle} onChange={(e) => setF({ ...f, detalle: e.target.value })} placeholder={f.tipo === "denuncia" ? "¿Qué pasó? Por ejemplo: me pidieron dinero para la entrevista." : ""} className={caja} /></label>
      <Consentimiento para="aliado" />
      <button type="submit" disabled={estado === "enviando"} className="btn-aplicar inline-flex h-12 items-center gap-2 rounded-xl px-6">{estado === "enviando" && <Loader2 className="size-4 animate-spin" />} Enviar mensaje</button>
    </form>
  );
}

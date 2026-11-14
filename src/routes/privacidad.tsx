import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, EyeOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Bloque, LEGAL_ACTUALIZADO, PaginaLegal } from "@/components/site/Legal";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/privacidad")({
  head: () => ({ meta: [{ title: "Política de privacidad | Enlace Laboral" }, { name: "description", content: "Qué datos guardamos, para qué, quién los ve y cómo pedir que los corrijamos o borremos. Según la Ley 172-13 de República Dominicana." }], links: [{ rel: "canonical", href: "https://enlacelaboralrd.com/privacidad" }] }),
  component: Privacidad,
});

function Privacidad() {
  return (
    <PaginaLegal actual="/privacidad" etiqueta="Tus datos son tuyos" titulo="Política de privacidad"
      intro={<p>Actualizada el {LEGAL_ACTUALIZADO}. En palabras sencillas y según la Ley 172-13 sobre Protección de Datos de Carácter Personal.</p>}
      resumen={[
        { I: EyeOff, t: "No vendemos tus datos", d: "Ni los alquilamos. Tampoco usamos publicidad ni rastreadores." },
        { I: BadgeCheck, t: "Solo los ve la empresa a la que aplicas", d: "Las demás empresas no ven tu aplicación." },
        { I: Trash2, t: "Puedes pedir que los borremos", d: "Cuando quieras, con el formulario al final de esta página." },
      ]}
      indice={[["que", "Qué datos guardamos"], ["para", "Para qué los usamos"], ["quien", "Quién los ve"], ["donde", "Dónde y por cuánto tiempo"], ["derechos", "Tus derechos"], ["empresas", "Reglas para empresas"], ["pedir", "Ver, corregir o borrar"]]}>

          <Bloque id="que" titulo="Qué datos guardamos">
            <p><strong>Si buscas empleo y aplicas sin cuenta:</strong> tu nombre, tu WhatsApp o correo, el mensaje que escribas, las respuestas a las preguntas de la empresa y, si tú lo eliges, tu CV en texto.</p>
            <p><strong>Si creas tu cuenta (opcional):</strong> tu correo, tu CV, las vacantes que guardas y el seguimiento de tus aplicaciones, para que no los pierdas si cambias de teléfono. Si activas «Banco de talento», las empresas registradas pueden ver tu perfil e invitarte. Puedes apagarlo cuando quieras.</p>
            <p><strong>Sin cuenta, tu CV se queda en tu teléfono.</strong> No lo subimos a ningún lado hasta que aplicas o lo guardas en tu cuenta.</p>
            <p><strong>Si eres empresa:</strong> el nombre de la empresa, el RNC o la cédula, el nombre, correo y teléfono de contacto, y las vacantes que publicas.</p>
            <p><strong>Datos de uso:</strong> contamos cuántas veces se ve cada vacante, sin guardar quién la vio. No usamos publicidad ni rastreadores de terceros (ver <Link to="/cookies" className="font-semibold text-primary underline">cookies</Link>).</p>
            <p>No pedimos ni guardamos foto, edad, sexo, estado civil, religión ni información de salud. Si tienes una discapacidad, no estás obligado a decirlo.</p>
          </Bloque>

          <Bloque id="para" titulo="Para qué los usamos">
            <p>Solo para conectar a personas que buscan empleo con empresas que contratan: enviar tu aplicación a la empresa, que la empresa pueda contactarte, mostrarte tu seguimiento y avisarte de vacantes si lo pides.</p>
            <p>Revisamos a las empresas (su RNC o cédula) para proteger a los candidatos de estafas. <strong>Ninguna empresa puede cobrarte por aplicar o por un empleo.</strong> Si alguien te pide dinero, avísanos.</p>
            <p>No vendemos ni alquilamos tus datos a nadie.</p>
          </Bloque>

          <Bloque id="quien" titulo="Quién los ve">
            <p><strong>La empresa a la que aplicas</strong> ve tu nombre, tu contacto, tu mensaje, tus respuestas y tu CV si lo incluiste. Solo esa empresa, no las demás.</p>
            <p><strong>El equipo de Enlace Laboral</strong> puede verlos para dar soporte y evitar abusos.</p>
            <p><strong>Proveedores que nos dan el servicio:</strong> la base de datos y el alojamiento de la página. Ellos guardan la información, pero no la usan para nada propio.</p>
            <p>Si aplicas por WhatsApp o por correo directo a la empresa, ese mensaje va de ti a la empresa y Enlace Laboral no lo guarda.</p>
          </Bloque>

          <Bloque id="donde" titulo="Dónde se guardan y por cuánto tiempo">
            <p>En servidores seguros de proveedores de nube, con conexión cifrada. Cada empresa solo puede ver las aplicaciones de sus propias vacantes.</p>
            <p>Guardamos tus datos mientras sean útiles para el proceso de selección o mientras tengas tu cuenta. Puedes pedir que los borremos en cualquier momento.</p>
          </Bloque>

          <Bloque id="derechos" titulo="Tus derechos">
            <p>Según la Ley 172-13 puedes: <strong>saber</strong> qué datos tenemos sobre ti, <strong>corregirlos</strong> si están mal, pedir que los <strong>borremos</strong> y <strong>retirar tu permiso</strong> cuando quieras. Respondemos lo antes posible.</p>
            <p>Si tienes cuenta, puedes editar tu CV, apagar «Banco de talento» o <strong>borrar tu cuenta y tus datos</strong> tú mismo (Opciones → «Borrar mi cuenta y mis datos») en <Link to="/guardadas" className="font-semibold text-primary underline">Mi búsqueda</Link>.</p>
          </Bloque>

          <Bloque id="empresas" titulo="Reglas para empresas">
            <p>Para publicar hay que dar un RNC o una cédula reales. Revisamos cada empresa antes de verificarla.</p>
            <p>Está prohibido: pedir dinero a los candidatos; publicar ofertas falsas; pedir edad, sexo, foto, estado civil, religión o «buena presencia» (Código de Trabajo, Principio VII); y usar los datos de los candidatos para algo distinto a su proceso de selección.</p>
            <p>Si una empresa incumple, quitamos sus vacantes y su cuenta.</p>
          </Bloque>

          <Bloque id="pedir" titulo="Pedir ver, corregir o borrar tus datos">
            <SolicitudDatos />
          </Bloque>
    </PaginaLegal>
  );
}

function SolicitudDatos() {
  const [f, setF] = useState({ tipo: "borrar", nombre: "", contacto: "", detalle: "" });
  const [estado, setEstado] = useState<"listo" | "enviando" | "hecho">("listo");
  const caja = "mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-3 outline-none focus:border-primary";
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.nombre.trim().length < 2 || f.contacto.trim().length < 5) return void toast.error("Escribe tu nombre y el correo o WhatsApp que usaste.");
    setEstado("enviando");
    const { error } = await supabase.from("solicitudes_datos").insert({ tipo: f.tipo, nombre: f.nombre.trim(), contacto: f.contacto.trim(), detalle: f.detalle.trim() || null });
    if (error) { setEstado("listo"); return void toast.error("No se pudo enviar. Intenta otra vez."); }
    setEstado("hecho");
  };
  if (estado === "hecho") return <p className="rounded-2xl bg-success/10 p-4 font-semibold text-success">Recibido. Te contactamos al correo o WhatsApp que escribiste.</p>;
  return (
    <form onSubmit={(e) => void enviar(e)} className="space-y-3 rounded-2xl border border-border bg-surface p-5">
      <label className="block text-sm font-bold">Qué necesitas
        <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} className={caja}>
          <option value="ver">Saber qué datos tienen sobre mí</option>
          <option value="corregir">Corregir mis datos</option>
          <option value="borrar">Borrar mis datos</option>
          <option value="otra">Otra consulta</option>
        </select>
      </label>
      <label className="block text-sm font-bold">Tu nombre<input required maxLength={150} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} className={caja} /></label>
      <label className="block text-sm font-bold">Correo o WhatsApp que usaste en Enlace Laboral<input required maxLength={200} value={f.contacto} onChange={(e) => setF({ ...f, contacto: e.target.value })} className={caja} /></label>
      <label className="block text-sm font-bold">Detalles <span className="font-normal text-muted-foreground">(opcional)</span><textarea rows={3} maxLength={2000} value={f.detalle} onChange={(e) => setF({ ...f, detalle: e.target.value })} className={caja} /></label>
      <button type="submit" disabled={estado === "enviando"} className="btn-aplicar inline-flex h-12 items-center gap-2 rounded-xl px-6">{estado === "enviando" && <Loader2 className="size-4 animate-spin" />} Enviar solicitud</button>
    </form>
  );
}

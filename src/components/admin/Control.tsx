import { useEffect, useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Interruptor, Tarjeta, campo, haceDesde, rotulo } from "@/components/admin/comun";
import { usePanel } from "@/components/admin/Inicio";
import { CONTROLES, useControles, useGuardarControl, type ClaveControl } from "@/lib/controles";

const N8N = "https://kimberlycontreras.app.n8n.cloud/workflow/";

type Auto = { clave?: ClaveControl; nombre: string; cuando: string; que: string; ultima: "correo" | "avisos_pedidos" | "renovaciones" | "hojas" | "redes" | "alertas" | null; n8n?: string };

const AUTOMATIZACIONES: Auto[] = [
  { clave: "ctl_avisos_pedidos", nombre: "Aviso de pedidos de CV", cuando: "Cada 15 min, de 7 a. m. a 11 p. m.", que: "Te envía un correo por cada pedido nuevo.", ultima: "avisos_pedidos", n8n: "fA5yCn0pb3ryygjE" },
  { clave: "ctl_renovar", nombre: "Renovar vacantes con un clic", cuando: "Todos los días, 9 a. m.", que: "Avisa a la empresa 5 días antes de que venza su vacante.", ultima: "renovaciones", n8n: "T9Tgx74kr8V0AvxY" },
  { clave: "ctl_hojas", nombre: "Hojas de Google", cuando: "Todos los días, 6:30 a. m.", que: "Actualiza, agrega y cierra vacantes según las hojas conectadas.", ultima: "hojas", n8n: "8hpXDNFr979z33es" },
  { clave: "ctl_redes", nombre: "Compartir en Telegram", cuando: "Cada 15 min", que: "Publica solo las vacantes cuya empresa autorizó compartirlas. Falta conectar el canal.", ultima: "redes", n8n: "leER6yTad6KZqdFG" },
  { nombre: "Correo → borradores", cuando: "Cada hora", que: "Convierte los correos recibidos en borradores para revisar.", ultima: "correo" },
  { nombre: "Alertas a suscriptores", cuando: "Todos los días, 8 a. m.", que: "Envía las vacantes nuevas a quienes crearon una alerta.", ultima: "alertas" },
  { nombre: "Piezas diarias (Instagram y WhatsApp)", cuando: "Todos los días, 7:30 a. m.", que: "Te manda las imágenes y textos de las vacantes nuevas. Solo llega si hubo nuevas.", ultima: null, n8n: "QhRsBPKHTFPyz5sx" },
];

function FilaInterruptor({ clave, titulo, ayuda, extra }: { clave: ClaveControl; titulo: string; ayuda: string; extra?: React.ReactNode }) {
  const { activos } = useControles();
  const guardar = useGuardarControl();
  const [pidiendo, setPidiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const activo = activos[clave];

  const poner = async (v: boolean) => {
    setGuardando(true);
    const ok = await guardar(clave, v ? "on" : "off");
    setGuardando(false);
    setPidiendo(false);
    if (ok) toast.success(v ? `${titulo}: encendido` : `${titulo}: en pausa`); else toast.error("No se pudo guardar el cambio");
  };

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{titulo} <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${activo ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{activo ? "Encendido" : "En pausa"}</span></p>
        <p className="mt-0.5 text-sm text-muted-foreground">{ayuda}</p>
        {extra}
      </div>
      {pidiendo ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">¿Pausar?</span>
          <Button size="sm" variant="destructive" disabled={guardando} onClick={() => void poner(false)}>Sí, pausar</Button>
          <Button size="sm" variant="outline" onClick={() => setPidiendo(false)}>No</Button>
        </div>
      ) : (
        <Interruptor activo={activo} etiqueta={titulo} deshabilitado={guardando} onCambio={(v) => (v ? void poner(true) : setPidiendo(true))} />
      )}
    </div>
  );
}

function AvisoSitio() {
  const { aviso } = useControles();
  const guardar = useGuardarControl();
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<"info" | "alerta">("info");
  const [visible, setVisible] = useState(false);
  const [listo, setListo] = useState(false);
  useEffect(() => { if (!listo) { setTexto(aviso.texto); setTipo(aviso.tipo); setVisible(aviso.visible); if (aviso.texto || aviso.visible) setListo(true); } }, [aviso, listo]);

  const aplicar = async (mostrar: boolean) => {
    if (mostrar && texto.trim().length < 3) return void toast.error("Escribe el mensaje del aviso.");
    const r = await Promise.all([guardar("aviso_texto", texto.trim().slice(0, 200)), guardar("aviso_tipo", tipo), guardar("ctl_aviso", mostrar ? "on" : "off")]);
    if (r.every(Boolean)) { setVisible(mostrar); toast.success(mostrar ? "Aviso publicado en todo el sitio" : "Aviso quitado"); } else toast.error("No se pudo guardar el aviso");
  };

  return (
    <Tarjeta titulo="Aviso para todo el sitio" ayuda="Una barra arriba de todas las páginas. Úsala para mantenimiento, ofertas o novedades.">
      <label className="block"><span className={rotulo}>Mensaje (máximo 200 letras)</span><input className={campo} maxLength={200} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej. Oferta de lanzamiento en Impulso hasta el 30 de noviembre" /></label>
      <label className="mt-3 block sm:w-60"><span className={rotulo}>Estilo</span><select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value as "info" | "alerta")}><option value="info">Informativo (azul)</option><option value="alerta">Importante (amarillo)</option></select></label>
      {texto.trim() && (
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <p className={`px-4 py-2 text-center text-sm font-semibold ${tipo === "alerta" ? "bg-[#ffd84d] text-[#4a3000]" : "bg-primary text-primary-foreground"}`}>{texto}</p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => void aplicar(true)}><Save /> {visible ? "Guardar cambios" : "Publicar aviso"}</Button>
        {visible && <Button variant="outline" onClick={() => void aplicar(false)}>Quitar aviso</Button>}
        <span className="text-sm text-muted-foreground">{visible ? "Ahora se ve en el sitio." : "Ahora no se ve."}</span>
      </div>
    </Tarjeta>
  );
}

export function Control() {
  const panel = usePanel();
  const u = panel.data?.ultimas;
  return (
    <div className="space-y-6">
      <Tarjeta titulo="Recepción" ayuda="Decide si el sitio acepta vacantes y pedidos. Se aplica en el servidor, no solo en la pantalla.">
        <div className="space-y-5">
          {CONTROLES.filter((c) => c.clave === "ctl_empresas" || c.clave === "ctl_pedidos").map((c) => (<FilaInterruptor key={c.clave} clave={c.clave} titulo={c.titulo} ayuda={c.ayuda} />))}
        </div>
      </Tarjeta>

      <Tarjeta titulo="Automatizaciones" ayuda="Pausar una no la borra: sigue corriendo, pero el sitio no le entrega trabajo hasta que la vuelvas a encender.">
        <div className="space-y-5 divide-y divide-border">
          {AUTOMATIZACIONES.map((a, i) => (
            <div key={a.nombre} className={i ? "pt-5" : ""}>
              {a.clave ? (
                <FilaInterruptor
                  clave={a.clave}
                  titulo={a.nombre}
                  ayuda={`${a.que} ${a.cuando.replace(/\.$/, "")}.`}
                  extra={<p className="mt-1 text-xs text-muted-foreground">Última actividad: <strong>{a.ultima ? haceDesde(u?.[a.ultima]) : "—"}</strong>{a.n8n && <> · <a href={N8N + a.n8n} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline">Abrir en n8n <ExternalLink className="size-3" /></a></>}</p>}
                />
              ) : (
                <div>
                  <p className="font-semibold">{a.nombre}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.que} {a.cuando.replace(/\.$/, "")}.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Última actividad: <strong>{a.ultima ? haceDesde(u?.[a.ultima]) : "—"}</strong>{a.n8n && <> · <a href={N8N + a.n8n} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline">Abrir en n8n <ExternalLink className="size-3" /></a></>}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Tarjeta>

      <AvisoSitio />
    </div>
  );
}

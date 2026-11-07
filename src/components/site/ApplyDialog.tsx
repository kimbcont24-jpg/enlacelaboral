import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ChevronDown, Copy, ExternalLink, FileText, Loader2, Mail, MessageCircle, ShieldCheck, X } from "lucide-react";

import { EmpresaAvatar } from "@/components/site/EmpresaAvatar";
import { supabase } from "@/integrations/supabase/client";
import { cvCompleto, leerCV, textoCV, type CV } from "@/lib/cv";
import { enlaceConMensaje, mensajeAplicacion, viaAplicar } from "@/lib/mensajes";
import { usePostulaciones } from "@/lib/postulaciones";
import { enlaceAplicar, useVacantes, type Vacante } from "@/lib/vacantes";

/** Lo que la persona escribió la última vez: la próxima aplicación ya sale rellena. */
const CLAVE_DATOS = "enlace-aplicante";
type Datos = { nombre: string; contacto: string };
const leerDatos = (): Datos => {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_DATOS) ?? "null") as Partial<Datos> | null;
    return { nombre: typeof v?.nombre === "string" ? v.nombre : "", contacto: typeof v?.contacto === "string" ? v.contacto : "" };
  } catch { return { nombre: "", contacto: "" }; }
};
const guardarDatos = (d: Datos) => { try { localStorage.setItem(CLAVE_DATOS, JSON.stringify(d)); } catch { /* sin almacenamiento */ } };

const campo = "w-full rounded-xl border border-border bg-background px-4 py-3.5 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const botonGrande = "btn-aplicar flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg disabled:opacity-70";

type Estado = "listo" | "enviando" | "enviado";
type Entrega = "empresa" | "guardada";

export function ApplyDialog({ job, onClose, onCambiar }: { job: Vacante | null; onClose: () => void; onCambiar: (j: Vacante) => void }) {
  const [estado, setEstado] = useState<Estado>("listo");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cv, setCv] = useState<CV | null>(null);
  const [incluirCv, setIncluirCv] = useState(true);
  const [texto, setTexto] = useState("");
  const [editado, setEditado] = useState(false);
  const [copiado, setCopiado] = useState<"" | "mensaje" | "cv">("");
  const [entrega, setEntrega] = useState<Entrega>("guardada");
  const { registrar, yaAplico } = usePostulaciones();
  const { jobs } = useVacantes();

  // Cada vez que se abre una vacante: pantalla limpia y datos recordados.
  useEffect(() => {
    if (!job) return;
    setEstado("listo"); setError(null); setEditado(false); setCopiado(""); setMensaje("");
    const g = leerCV();
    const completo = cvCompleto(g);
    setCv(completo ? g : null);
    const d = leerDatos();
    setNombre(d.nombre || (completo ? g.nombre : ""));
    setContacto(d.contacto || (completo ? g.telefono || g.correo : ""));
  }, [job]);

  useEffect(() => {
    if (!job) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = antes; };
  }, [job, onClose]);

  // El mensaje se arma solo con el nombre y el CV, hasta que la persona lo edite.
  useEffect(() => {
    if (job && !editado) setTexto(mensajeAplicacion(job, nombre, cv));
  }, [job, nombre, cv, editado]);

  const parecidas = useMemo(() => {
    if (!job) return [];
    return jobs.filter((j) => j.id !== job.id && !yaAplico(j.id) && (j.area === job.area || j.provincia === job.provincia)).slice(0, 3);
  }, [jobs, job, yaAplico]);

  if (!job) return null;

  const via = viaAplicar(job);
  const ya = yaAplico(job.id);
  const conEmpresa = job.empresa && job.empresa !== "Empresa no indicada";
  // Por correo sí cabe el CV completo en el mensaje; por WhatsApp se copia aparte.
  const textoFinal = via.clave === "correo" && cv && incluirCv ? `${texto}\n\n${textoCV(cv)}` : texto;
  const enlace = enlaceConMensaje(job, textoFinal) ?? enlaceAplicar(job.aplicar);

  const copiar = async (que: "mensaje" | "cv") => {
    try {
      await navigator.clipboard.writeText(que === "cv" && cv ? textoCV(cv) : texto);
      setCopiado(que);
      setTimeout(() => setCopiado(""), 2200);
    } catch { /* sin portapapeles */ }
  };

  const recordar = () => { if (nombre.trim() || contacto.trim()) guardarDatos({ nombre: nombre.trim(), contacto: contacto.trim() }); };

  // Abrir WhatsApp / correo / sitio: la vacante queda anotada y se muestra el siguiente paso.
  const alAbrir = () => {
    recordar();
    registrar(job, via.texto);
    setEstado("enviado");
  };

  const marcarAplicada = () => {
    registrar(job, "Instrucciones de la empresa");
    setEstado("enviado");
  };

  const enviarFormulario = async () => {
    setEstado("enviando");
    setError(null);
    const cuerpo = [mensaje.trim(), cv && incluirCv ? `--- CV ---\n${textoCV(cv)}` : ""].filter(Boolean).join("\n\n");
    const { error: err } = await supabase.from("aplicaciones").insert({ vacante_id: job.id, nombre: nombre.trim(), contacto: contacto.trim(), mensaje: cuerpo || null });
    if (err) {
      setError("No pudimos enviar tus datos. Revisa tu internet e intenta de nuevo.");
      setEstado("listo");
      return;
    }
    recordar();
    registrar(job, via.clave === "correo" ? "Aplicación desde Enlace Laboral" : "Formulario de Enlace Laboral");
    // Con correo de la empresa, además se lo mandamos desde aquí.
    let llego = false;
    if (via.clave === "correo") {
      try {
        const r = await fetch("/api/aplicar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ vacante_id: job.id, nombre: nombre.trim(), contacto: contacto.trim(), mensaje: cuerpo }) });
        llego = r.ok && ((await r.json()) as { enviado?: boolean }).enviado === true;
      } catch { llego = false; }
    }
    setEntrega(llego ? "empresa" : "guardada");
    setEstado("enviado");
  };

  const IconoVia = via.clave === "whatsapp" ? MessageCircle : via.clave === "correo" ? Mail : via.clave === "formulario" ? FileText : ExternalLink;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/60 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Aplicar a ${job.titulo}`} onClick={onClose}>
      <div className="entra max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] border border-border bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow-lift)] sm:rounded-3xl sm:px-6 sm:pb-6 sm:pt-6" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />

        <div className="flex items-start gap-3">
          <EmpresaAvatar nombre={job.empresa} className="size-12 text-xl" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold leading-tight sm:text-xl">{job.titulo}</h2>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{conEmpresa ? `${job.empresa} · ` : ""}{job.provincia}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>

        {estado === "enviado" ? (
          <Enviado job={job} via={via.clave} entrega={entrega} parecidas={parecidas} onClose={onClose} onAplicar={onCambiar} enlace={enlace} />
        ) : (
          <div className="mt-5 space-y-4">
            {/* ---------- WhatsApp o correo: un nombre y un botón ---------- */}
            {via.clave === "whatsapp" && enlace && (
              <>
                <p className="text-sm text-muted-foreground">
                  Te abrimos el chat de la empresa con el mensaje ya escrito. Solo tocas enviar.
                </p>
                <label className="block text-sm font-semibold">
                  Tu nombre <span className="font-normal text-muted-foreground">(opcional)</span>
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" placeholder="Ej: María Pérez" className={`${campo} mt-1.5 font-normal`} />
                </label>
                <a href={enlace.href} target="_blank" rel="noopener noreferrer" onClick={alAbrir} className={botonGrande}>
                  <IconoVia className="size-5" aria-hidden="true" /> {enlace.label}
                </a>
                <details className="group rounded-xl bg-secondary/70 px-4 py-3 text-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                    Ver o cambiar el mensaje <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <textarea value={texto} onChange={(e) => { setTexto(e.target.value); setEditado(true); }} rows={5} className={`${campo} mt-3 text-sm`} aria-label="Mensaje para la empresa" />
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <button type="button" onClick={() => void copiar("mensaje")} className="inline-flex items-center gap-1.5 py-1 text-xs font-semibold text-primary hover:underline"><Copy className="size-3.5" aria-hidden="true" /> {copiado === "mensaje" ? "¡Copiado!" : "Copiar mensaje"}</button>
                    {cv && via.clave === "whatsapp" && <button type="button" onClick={() => void copiar("cv")} className="inline-flex items-center gap-1.5 py-1 text-xs font-semibold text-primary hover:underline"><Copy className="size-3.5" aria-hidden="true" /> {copiado === "cv" ? "¡Copiado!" : "Copiar mi CV"}</button>}
                  </div>
                </details>
                {!cv && <SinCv />}
              </>
            )}

            {/* ---------- Sitio de la empresa ---------- */}
            {via.clave === "sitio" && enlace && (
              <>
                <p className="text-sm text-muted-foreground">Esta empresa recibe candidatos en su propio sitio. Te llevamos directo; tu postulación queda anotada aquí para que le des seguimiento.</p>
                <a href={enlace.href} target="_blank" rel="noopener noreferrer" onClick={alAbrir} className={botonGrande}>
                  <ExternalLink className="size-5" aria-hidden="true" /> Ir al sitio de la empresa
                </a>
                {cv ? (
                  <button type="button" onClick={() => void copiar("cv")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-secondary">
                    <Copy className="size-4" aria-hidden="true" /> {copiado === "cv" ? "¡CV copiado! Pégalo en su formulario" : "Copiar mi CV para pegarlo allá"}
                  </button>
                ) : <SinCv />}
              </>
            )}

            {/* ---------- Instrucciones sin enlace ---------- */}
            {via.clave === "instrucciones" && (
              <>
                <div className="rounded-2xl bg-secondary p-4 text-sm">
                  <p className="font-bold">Así aplica la empresa</p>
                  <p className="mt-1.5 whitespace-pre-line text-foreground/85 [overflow-wrap:anywhere]">{job.aplicar}</p>
                </div>
                <button type="button" onClick={marcarAplicada} className={botonGrande}><CheckCircle2 className="size-5" aria-hidden="true" /> Ya apliqué, anótala</button>
              </>
            )}

            {/* ---------- Formulario de Enlace Laboral ---------- */}
            {(via.clave === "formulario" || via.clave === "correo") && (
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void enviarFormulario(); }}>
                <p className="text-sm text-muted-foreground">{via.clave === "correo" ? "Aplicas aquí mismo y nosotros se lo enviamos a la empresa. Sin cuenta, sin costo." : "Deja tus datos y los hacemos llegar a la empresa. Sin cuenta, sin costo."}</p>
                <input required value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" placeholder="Tu nombre completo" aria-label="Tu nombre completo" className={campo} />
                <input required value={contacto} onChange={(e) => setContacto(e.target.value)} autoComplete="tel" placeholder="Tu WhatsApp o correo" aria-label="Tu WhatsApp o correo" className={campo} />
                {cv ? (
                  <label className="flex items-start gap-2.5 rounded-xl bg-secondary px-4 py-3 text-sm"><input type="checkbox" checked={incluirCv} onChange={(e) => setIncluirCv(e.target.checked)} className="mt-0.5 size-4 accent-[var(--cta)]" /> <span>Incluir mi CV ({cv.nombre}). <Link to="/cv" onClick={onClose} className="font-semibold text-primary underline">Editarlo</Link></span></label>
                ) : <SinCv />}
                <details className="group text-sm">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 py-1 font-semibold text-primary">Agregar un mensaje <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
                  <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3} placeholder="Cuéntanos brevemente tu experiencia" aria-label="Mensaje" className={`${campo} mt-2`} />
                </details>
                {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
                <button type="submit" disabled={estado === "enviando"} className={botonGrande}>
                  {estado === "enviando" ? (<><Loader2 className="size-5 animate-spin" aria-hidden="true" /> Enviando…</>) : via.clave === "correo" ? "Enviar mi aplicación" : "Enviar mis datos"}
                </button>
                <p className="text-center text-xs text-muted-foreground">Al enviar, compartes tu nombre, contacto y CV con {conEmpresa ? job.empresa : "la empresa"}.</p>
              </form>
            )}

            {ya && estado === "listo" && (
              <p className="rounded-xl bg-success/10 px-4 py-2.5 text-sm text-success">Ya aplicaste a esta vacante. <Link to="/guardadas" search={{ ver: "postulaciones" }} onClick={onClose} className="font-bold underline">Ver mis postulaciones</Link></p>
            )}

            <p className="flex items-start gap-2 text-xs leading-snug text-muted-foreground">
              <ShieldCheck className="mt-px size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{/^publicada por/i.test(job.fuente) ? `Vacante ${job.fuente.toLowerCase()}.` : `Publicada originalmente en ${job.fuente}.`} Nunca pagues dinero para ser contratado.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SinCv() {
  return <p className="text-sm text-muted-foreground">¿No tienes CV? <Link to="/cv" className="font-semibold text-primary underline">Hazlo gratis en 5 minutos</Link> y la próxima vez se incluye solo.</p>;
}

/** Pantalla final: confirma, y deja a un toque la siguiente vacante. */
function Enviado({ job, via, entrega, parecidas, onClose, onAplicar, enlace }: { job: Vacante; via: string; entrega: Entrega; parecidas: Vacante[]; onClose: () => void; onAplicar: (j: Vacante) => void; enlace: { href: string; label: string } | null }) {
  const externo = via === "whatsapp" || via === "sitio";
  return (
    <div className="mt-5">
      <div className="rounded-2xl border border-success/30 bg-success/10 p-5 text-center">
        <CheckCircle2 className="mx-auto size-11 text-success" aria-hidden="true" />
        <p className="mt-3 text-lg font-extrabold">{externo ? "¡Vas por buen camino!" : via === "correo" && entrega === "empresa" ? "¡Aplicación enviada!" : "¡Recibimos tus datos!"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {via === "whatsapp" && "Envía el mensaje en WhatsApp y listo. "}
          {via === "sitio" && "Termina tu solicitud en el sitio de la empresa. "}
          {via === "formulario" && "Si hay avances, te contactan por el medio que dejaste. "}
          {via === "correo" && entrega === "empresa" && `Le llegó a ${job.empresa !== "Empresa no indicada" ? job.empresa : "la empresa"}; si les interesa, te contactan por el medio que dejaste. `}
          {via === "correo" && entrega === "guardada" && "Guardamos tus datos. Para asegurar que le lleguen, envíalos también por correo con un toque. "}
          Quedó anotada en <Link to="/guardadas" search={{ ver: "postulaciones" }} onClick={onClose} className="font-semibold text-primary underline">Mis postulaciones</Link>.
        </p>
        {externo && enlace && <a href={enlace.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">¿No se abrió? Toca aquí</a>}
        {via === "correo" && entrega === "guardada" && enlace && <a href={enlace.href} target="_blank" rel="noopener noreferrer" className="btn-aplicar mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-base"><Mail className="size-5" aria-hidden="true" /> Enviar también por correo</a>}
      </div>

      {parecidas.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-bold">Aplica a otra mientras estás aquí</p>
          <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {parecidas.map((j) => (
              <li key={j.id} className="flex items-center gap-3 p-3">
                <EmpresaAvatar nombre={j.empresa} className="size-10 text-base" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{j.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">{j.empresa !== "Empresa no indicada" ? `${j.empresa} · ` : ""}{j.provincia}</p>
                </div>
                <button onClick={() => onAplicar(j)} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground">Aplicar <ArrowRight className="size-3.5" aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={onClose} className="mt-5 w-full rounded-xl border border-border py-3 text-sm font-semibold hover:bg-secondary">Seguir viendo vacantes</button>
      <span className="sr-only">{job.titulo}</span>
    </div>
  );
}

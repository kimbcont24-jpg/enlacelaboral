import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useControles } from "@/lib/controles";
import { comparativa, planes, provincias, serviciosCandidato } from "@/lib/data";

export const Route = createFileRoute("/empresas")({
  head: () => ({ meta: [{ title: "Publica vacantes gratis | Enlace Laboral" }] }),
  component: Empresas,
});

function Empresas() {
  const controles = useControles();
  const [enviado, setEnviado] = useState(false);
  const [plan, setPlan] = useState(planes[0]!.nombre);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <header className="mx-auto max-w-7xl px-6 pb-12 pt-16">
                <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight md:text-6xl">Publica tus vacantes gratis y llega a candidatos de todo el país</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Envía tu vacante y la publicamos sin costo. Los servicios extras son opcionales.</p>
        <ul className="mt-6 grid max-w-3xl gap-3 text-sm sm:grid-cols-3">
          <li className="rounded-2xl border border-border bg-surface p-4"><p className="font-bold">Los candidatos te llegan al correo</p><p className="mt-1 text-muted-foreground">Cada aplicación se envía al correo que indiques, con los datos y el CV de la persona.</p></li>
          <li className="rounded-2xl border border-border bg-surface p-4"><p className="font-bold">Difusión incluida</p><p className="mt-1 text-muted-foreground">Tu vacante sale en la página, en el canal de WhatsApp y en Instagram, con tu nombre de empresa.</p></li>
          <li className="rounded-2xl border border-border bg-surface p-4"><p className="font-bold">Sin cuenta ni contraseña</p><p className="mt-1 text-muted-foreground">Un formulario de dos minutos. También puedes mandarla por correo a kimbcont24+vacantes@gmail.com.</p></li>
        </ul>
      </header>
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {planes.map((p) => (
            <div key={p.nombre} className={p.popular ? "relative flex flex-col rounded-3xl border-2 border-primary bg-surface p-7" : "relative flex flex-col rounded-3xl border border-border bg-surface p-7"}>
              
              <h2 className="text-lg font-bold">{p.nombre}</h2>
              <div className="mt-3 flex items-baseline gap-1"><span className="text-3xl font-extrabold">{p.precio}</span><span className="text-sm text-muted-foreground">{p.unidad}</span></div>
              {"impulso" in p && p.impulso && (<p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary">{p.impulso}</p>)}
              <p className="mt-3 text-sm text-muted-foreground">{p.resumen}</p>
              <ul className="mt-6 flex-1 space-y-2 text-sm">{p.beneficios.map((b) => (<li key={b} className="flex gap-2"><span className="text-primary">✓</span> {b}</li>))}</ul>
              <button onClick={() => { setPlan(p.nombre); document.getElementById("publicar")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-6 w-full rounded-xl border border-border py-3 font-bold hover:border-primary hover:text-primary">{p.cta}</button>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-3xl border border-border bg-surface p-7">
          <h2 className="text-2xl font-extrabold tracking-tight">Gratis vs. Destacada por RD$500</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40"><tr><th className="px-4 py-3 text-left">Incluye</th><th className="px-4 py-3">Gratis</th><th className="px-4 py-3 text-primary">Destacada</th></tr></thead>
              <tbody>{comparativa.map((c) => (<tr key={c.fila}><td className="px-4 py-3">{c.fila}</td><td className="px-4 py-3 text-center">{c.gratis ? "✓" : "—"}</td><td className="px-4 py-3 text-center text-primary">{c.destacada ? "✓" : "—"}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </section>
      <section id="publicar" className="border-y border-border bg-surface px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Publica tu vacante</h2>
            <p className="mt-3 text-muted-foreground">Completa el formulario. La revisamos y la publicamos.</p>
          </div>
          {enviado ? (
            <div className="rounded-3xl border border-primary/40 bg-primary/5 p-8">
              <h3 className="text-xl font-bold">¡Recibimos tu vacante!</h3>
              <p className="mt-2 text-sm text-muted-foreground">La revisamos y te avisamos al correo cuando esté publicada. Plan: <strong>{plan}</strong>.</p>
              <button onClick={() => setEnviado(false)} className="mt-6 rounded-xl border border-border px-4 py-2 text-sm font-bold">Enviar otra</button>
            </div>
          ) : !controles.activos.ctl_empresas ? (
            <div className="rounded-3xl border border-border bg-background p-8 text-center">
              <h3 className="text-xl font-bold">Recepción de vacantes en pausa</h3>
              <p className="mt-2 text-sm text-muted-foreground">Por ahora no estamos recibiendo vacantes nuevas. Vuelve en unas horas, o escríbenos por el canal de WhatsApp.</p>
            </div>
          ) : (
            <FormVacante plan={plan} setPlan={setPlan} onListo={() => setEnviado(true)} />
          )}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-2xl font-bold">Servicios para candidatos</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {serviciosCandidato.map((s) => (
            <div key={s.nombre} className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-bold">{s.nombre}</h3>
              <p className="mt-2 text-2xl font-extrabold text-primary">{s.precio}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">{s.beneficios.map((b) => (<li key={b}>• {b}</li>))}</ul>
            </div>
          ))}
        </div>
        <Link to="/vacantes" className="mt-10 inline-block rounded-xl bg-foreground px-6 py-3 font-bold text-background">Explorar vacantes</Link>
      </section>
      <Footer />
    </div>
  );
}

const caja = "mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-primary";
const rotulo = "font-mono text-[10px] uppercase tracking-widest text-muted-foreground";

function FormVacante({ plan, setPlan, onListo }: { plan: string; setPlan: (p: string) => void; onListo: () => void }) {
  const [f, setF] = useState({ empresa: "", contacto: "", correo: "", telefono: "", titulo: "", provincia: provincias[1] ?? "Distrito Nacional", detalle: "", trampa: "", redes: false });
  const [enviando, setEnviando] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const [leyendo, setLeyendo] = useState<number | null>(null);
  const [leido, setLeido] = useState<string[] | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  /** Lee el flyer en el navegador de la empresa (la foto no se envía a ningún servidor) y llena el formulario. */
  const leerFlyer = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Sube una foto o captura del flyer (JPG o PNG).");
    setLeyendo(0);
    setLeido(null);
    let lector: { cerrar: () => Promise<void> } | null = null;
    try {
      const ocr = await import("@/lib/ocr");
      const { lectura } = await ocr.prepararFoto(file);
      const l = await ocr.crearLector();
      lector = l;
      const r = await ocr.leerFoto(l, lectura, (p) => setLeyendo(Math.round(p * 100)));
      const a = ocr.analizarTexto(r.texto);
      const b = a.varias[0] ?? a.b;
      const correo = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.exec(b.aplicar || a.texto)?.[0] ?? "";
      const tel = /(?:8[024]9)[\s.-]?\d{3}[\s.-]?\d{4}/.exec(a.texto)?.[0] ?? "";
      const detalle = a.texto.split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
      if (!b.titulo && a.texto.trim().length < 20) throw new Error("vacio");
      setF((x) => ({
        ...x,
        titulo: b.titulo || x.titulo,
        empresa: b.empresa || x.empresa,
        provincia: provincias.slice(1).includes(b.provincia) ? b.provincia : x.provincia,
        correo: x.correo || correo,
        telefono: x.telefono || tel,
        detalle,
      }));
      setLeido([b.titulo ? "el puesto" : "", b.empresa ? "la empresa" : "", b.provincia ? "la ubicación" : "", correo ? "el correo" : "", detalle ? "los detalles" : ""].filter(Boolean));
      toast.success("Leímos tu flyer. Revisa los datos antes de enviar.");
    } catch {
      toast.error("No pudimos leer esa imagen. Prueba con una foto más nítida o llena el formulario a mano.");
    } finally {
      await lector?.cerrar().catch(() => undefined);
      setLeyendo(null);
      if (entrada.current) entrada.current.value = "";
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.trampa) return onListo();
    if (f.detalle.trim().length < 30) return void toast.error("Cuéntanos un poco más: funciones, requisitos y horario.");
    setEnviando(true);
    const texto = [`Puesto: ${f.titulo.trim()}`, `Empresa: ${f.empresa.trim()}`, `Ubicación: ${f.provincia}`, "", f.detalle.trim(), "", `Plan: ${plan}`, f.redes ? "Autoriza compartir en redes: sí" : "Autoriza compartir en redes: no"].join("\n");
    const { error } = await supabase.from("borradores").insert({
      origen: "empresa",
      texto,
      titulo: f.titulo.trim(),
      empresa: f.empresa.trim(),
      provincia: f.provincia,
      contacto_nombre: f.contacto.trim(),
      contacto_email: f.correo.trim(),
      contacto_telefono: f.telefono.trim() || null,
      fuente: "Publicada por la empresa",
    });
    setEnviando(false);
    if (error) return void toast.error(error.message.includes("recepcion_pausada") ? "Por ahora no estamos recibiendo vacantes. Vuelve en unas horas." : "No se pudo enviar. Intenta otra vez en un momento.");
    onListo();
  };

  return (
    <form onSubmit={(e) => void enviar(e)} className="space-y-4 rounded-3xl border border-border bg-background p-8">
      <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4">
        <p className="font-bold">¿Ya tienes el flyer de la vacante?</p>
        <p className="mt-1 text-sm text-muted-foreground">Súbelo y llenamos el formulario por ti. La imagen se lee en tu dispositivo y no se guarda.</p>
        <input ref={entrada} type="file" accept="image/*" className="hidden" onChange={(e) => void leerFlyer(e.target.files?.[0])} />
        <button type="button" disabled={leyendo !== null} onClick={() => entrada.current?.click()} className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {leyendo !== null ? `Leyendo tu flyer… ${leyendo}%` : "Subir flyer o captura"}
        </button>
        {leido && leido.length > 0 && <p role="status" className="mt-3 text-sm font-semibold text-success">Llenamos {leido.join(", ")}. Revisa todo antes de enviar.</p>}
      </div>
      <label className="block"><span className={rotulo}>Empresa</span><input required maxLength={200} value={f.empresa} onChange={set("empresa")} placeholder="Nombre de la empresa" className={caja} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className={rotulo}>Contacto</span><input required maxLength={200} value={f.contacto} onChange={set("contacto")} placeholder="Nombre y apellido" className={caja} /></label>
        <label className="block"><span className={rotulo}>Teléfono (opcional)</span><input maxLength={40} inputMode="tel" value={f.telefono} onChange={set("telefono")} placeholder="809-000-0000" className={caja} /></label>
      </div>
      <label className="block"><span className={rotulo}>Correo</span><input required type="email" maxLength={200} value={f.correo} onChange={set("correo")} placeholder="rrhh@empresa.do" className={caja} /></label>
      <label className="block"><span className={rotulo}>Título del puesto</span><input required maxLength={200} value={f.titulo} onChange={set("titulo")} placeholder="Ej. Cajero/a" className={caja} /></label>
      <label className="block"><span className={rotulo}>Ubicación</span><select required value={f.provincia} onChange={set("provincia")} className={caja}>{provincias.slice(1).map((p) => (<option key={p}>{p}</option>))}</select></label>
      <label className="block"><span className={rotulo}>Plan</span><select value={plan} onChange={(e) => setPlan(e.target.value)} className={caja}>{planes.map((p) => (<option key={p.nombre} value={p.nombre}>{p.nombre} — {p.precio}</option>))}</select></label>
      <label className="block"><span className={rotulo}>Detalles</span><textarea required rows={5} maxLength={8000} value={f.detalle} onChange={set("detalle")} placeholder="Funciones, requisitos, horario, salario y beneficios. Si publicas el salario, tu vacante llama más la atención." className={caja} /></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={f.redes} onChange={(e) => setF((x) => ({ ...x, redes: e.target.checked }))} className="mt-1 size-4" /><span>Autorizo que Enlace Laboral comparta esta vacante en sus redes (Telegram, Facebook, Instagram y WhatsApp). Es opcional y gratis.</span></label>
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.trampa} onChange={set("trampa")} className="hidden" name="sitio_web" />
      <button type="submit" disabled={enviando} className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground disabled:opacity-60">{enviando ? "Enviando…" : "Enviar vacante gratis"}</button>
      <p className="text-center text-xs text-muted-foreground">La revisamos antes de publicarla. Te contactamos al correo que indiques.</p>
    </form>
  );
}

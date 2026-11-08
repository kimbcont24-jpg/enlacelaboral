import { useState } from "react";
import { BadgeCheck, Check, Clock, Code2, Copy, Crown, Link2, QrCode, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { usePanel } from "@/components/panel/contexto";
import { campoPanel, Titulo } from "@/components/panel/comun";
import { supabase } from "@/integrations/supabase/client";
import { provincias } from "@/lib/data";
import { diasPlan, planActivo } from "@/lib/panel";
import { SITIO } from "@/lib/vacantes";

const SECTORES = ["Comercio", "Manufactura", "Turismo y hotelería", "Servicios", "Tecnología", "Salud", "Educación", "Construcción", "Logística y transporte", "Finanzas", "Zona franca", "Agropecuario", "Otro"];

export function MiEmpresa() {
  const p = usePanel();
  const e = p.empresa;
  const [f, setF] = useState({ nombre: e.nombre, sector: e.sector ?? "", provincia: e.provincia ?? "", contacto_nombre: e.contacto_nombre ?? "", contacto_email: e.contacto_email ?? "", contacto_telefono: e.contacto_telefono ?? "", sitio_web: e.sitio_web ?? "", descripcion: e.descripcion ?? "" });
  const [guardando, setGuardando] = useState(false);
  const pon = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (f.nombre.trim().length < 2) return void toast.error("Escribe el nombre de la empresa.");
    setGuardando(true);
    const datos = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() || null])) as Record<string, string | null>;
    datos["nombre"] = f.nombre.trim();
    const { error } = await supabase.from("empresas").update(datos).eq("id", e.id);
    setGuardando(false);
    if (error) return void toast.error("No se pudo guardar.");
    p.setEmpresa({ ...e, ...(datos as object) } as typeof e);
    toast.success("Datos guardados.");
  };

  return (
    <>
      <Titulo titulo="Mi empresa" />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <form onSubmit={(ev) => void guardar(ev)} className="space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm">
            {e.verificada ? <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 font-bold text-success"><BadgeCheck className="size-4" /> Empresa verificada</span>
              : <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c27803]/12 px-2.5 py-1 font-bold text-[#8a5200]"><Clock className="size-4" /> Verificación pendiente</span>}
          </div>
          {!e.verificada && <p className="text-sm text-muted-foreground">Verificamos con tu RNC y un contacto real. Mientras tanto revisamos cada vacante antes de publicarla. Completa tus datos para que sea más rápido.</p>}
          <label className="block"><span className="mb-1 block text-sm font-bold">Nombre comercial</span><input value={f.nombre} onChange={(x) => pon("nombre", x.target.value)} maxLength={120} className={campoPanel} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm font-bold">Sector</span><select value={f.sector} onChange={(x) => pon("sector", x.target.value)} className={campoPanel}><option value="">Elige…</option>{[...new Set([...(f.sector && !SECTORES.includes(f.sector) ? [f.sector] : []), ...SECTORES])].map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="block"><span className="mb-1 block text-sm font-bold">Provincia</span><select value={f.provincia} onChange={(x) => pon("provincia", x.target.value)} className={campoPanel}><option value="">Elige…</option>{provincias.filter((x) => x !== "Toda República Dominicana").map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="block"><span className="mb-1 block text-sm font-bold">Persona de contacto</span><input value={f.contacto_nombre} onChange={(x) => pon("contacto_nombre", x.target.value)} maxLength={120} className={campoPanel} /></label>
            <label className="block"><span className="mb-1 block text-sm font-bold">Teléfono / WhatsApp</span><input value={f.contacto_telefono} onChange={(x) => pon("contacto_telefono", x.target.value)} inputMode="tel" maxLength={30} className={campoPanel} /></label>
            <label className="block"><span className="mb-1 block text-sm font-bold">Correo</span><input type="email" value={f.contacto_email} onChange={(x) => pon("contacto_email", x.target.value)} maxLength={160} className={campoPanel} /></label>
            <label className="block"><span className="mb-1 block text-sm font-bold">Sitio web</span><input value={f.sitio_web} onChange={(x) => pon("sitio_web", x.target.value)} placeholder="https://" maxLength={200} className={campoPanel} /></label>
          </div>
          <label className="block"><span className="mb-1 block text-sm font-bold">Sobre la empresa</span><textarea value={f.descripcion} onChange={(x) => pon("descripcion", x.target.value)} rows={4} maxLength={1500} placeholder="A qué se dedican, cuántas personas son, por qué es bueno trabajar ahí." className={`${campoPanel} h-auto py-3`} /></label>
          <button type="submit" disabled={guardando} className="btn-aplicar h-11 rounded-xl px-6 text-sm">{guardando ? "Guardando…" : "Guardar datos"}</button>
        </form>

        <aside className="h-fit space-y-4">
          <button type="button" onClick={() => p.ir("planes")} className="block w-full rounded-2xl bg-[#0a2f5c] p-5 text-left text-white">
            <p className="flex items-center gap-2 text-sm font-semibold text-white/75">{planActivo(e) ? <Crown className="size-4 text-[#ffd84d]" /> : <Sparkles className="size-4 text-[#ffd84d]" />} Tu plan</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{planActivo(e) ? "Plan Empresa" : "Gratis"}</p>
            <p className="mt-1 text-sm text-white/75">{planActivo(e) ? (diasPlan(e) !== null ? `Activo · ${diasPlan(e)} días restantes` : "Activo") : "Vacantes sin límite, tablero, agenda y mensajes."}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/85">
              {(planActivo(e) ? ["Destaca hasta 4 vacantes a la vez", "Informe para gerencia", "Prioridad en nuestros canales", "Atención directa por WhatsApp"] : ["Todo lo que usas sigue gratis", "Destaca vacantes desde RD$500", e.prueba_usada ? "Plan Empresa RD$1,900 al mes" : "Prueba el Plan Empresa 14 días gratis"]).map((b) => <li key={b} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#8ec1ff]" />{b}</li>)}
            </ul>
            <p className="mt-4 text-sm font-bold text-[#8ec1ff]">{planActivo(e) ? "Ver mi plan" : "Ver planes"}</p>
          </button>
          <a href={`/empresa/${e.id}`} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-border bg-surface p-5 text-sm hover:border-primary">
            <p className="font-extrabold">Tu página de empresa</p>
            <p className="mt-1 text-muted-foreground">Los candidatos ven tu descripción y todas tus vacantes abiertas. Compártela en tus redes.</p>
            <p className="mt-2 font-bold text-[#1557c4]">Ver mi página</p>
          </a>
          <TrabajaConNosotros id={e.id} nombre={e.nombre} />
          <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
            <p className="font-extrabold">Consejo</p>
            <p className="mt-1 text-muted-foreground">Las empresas con descripción, sector y teléfono completos se verifican más rápido. Al verificarte, tus vacantes salen publicadas sin esperar revisión.</p>
          </div>
        </aside>
      </div>
    </>
  );
}

/** Enlace para la web, Instagram o el letrero de la empresa: lleva a todas sus vacantes abiertas. */
function TrabajaConNosotros({ id, nombre }: { id: string; nombre: string }) {
  const url = `${SITIO}/empresa/${id}`;
  const html = `<a href="${url}" target="_blank" rel="noopener" style="display:inline-block;background:#1d6ff2;color:#fff;font:700 15px system-ui,sans-serif;padding:12px 22px;border-radius:12px;text-decoration:none">Trabaja con nosotros</a>`;
  const copiar = async (t: string, que: string) => { try { await navigator.clipboard.writeText(t); toast.success(`${que} copiado.`); } catch { toast.error("No se pudo copiar."); } };
  const qr = async () => {
    const QR = (await import("qrcode")).default;
    const a = document.createElement("a");
    a.href = await QR.toDataURL(url, { margin: 2, width: 1024, color: { dark: "#0a2f5c", light: "#ffffff" } });
    a.download = `qr-empleos-${nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    a.click();
  };
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
      <p className="flex items-center gap-2 font-extrabold"><Link2 className="size-4 text-[#1d6ff2]" /> «Trabaja con nosotros»</p>
      <p className="mt-1 text-muted-foreground">Pon este enlace en tu web, tu Instagram o tu letrero. Siempre muestra tus vacantes abiertas.</p>
      <div className="mt-3 grid gap-2">
        <button type="button" onClick={() => void copiar(url, "Enlace")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0a2f5c] font-bold text-white"><Copy className="size-4" /> Copiar enlace</button>
        <button type="button" onClick={() => void copiar(html, "Botón para tu web")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border font-semibold"><Code2 className="size-4" /> Botón para tu página web</button>
        <button type="button" onClick={() => void qr()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border font-semibold"><QrCode className="size-4" /> Descargar código QR</button>
      </div>
    </div>
  );
}

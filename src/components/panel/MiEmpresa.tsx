import { useState } from "react";
import { BadgeCheck, Check, Clock, Crown } from "lucide-react";
import { toast } from "sonner";

import { usePanel } from "@/components/panel/contexto";
import { campoPanel, Titulo } from "@/components/panel/comun";
import { supabase } from "@/integrations/supabase/client";
import { planes, provincias } from "@/lib/data";
import { planActivo } from "@/lib/panel";

const SECTORES = ["Comercio", "Manufactura", "Turismo y hotelería", "Servicios", "Tecnología", "Salud", "Educación", "Construcción", "Logística y transporte", "Finanzas", "Zona franca", "Agropecuario", "Otro"];

export function MiEmpresa() {
  const p = usePanel();
  const e = p.empresa;
  const [f, setF] = useState({ nombre: e.nombre, sector: e.sector ?? "", provincia: e.provincia ?? "", contacto_nombre: e.contacto_nombre ?? "", contacto_email: e.contacto_email ?? "", contacto_telefono: e.contacto_telefono ?? "", sitio_web: e.sitio_web ?? "", descripcion: e.descripcion ?? "" });
  const [guardando, setGuardando] = useState(false);
  const pon = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const activo = planActivo(e);
  const plan = planes.find((x) => x.nombre === "Plan Empresa");
  const pedido = p.solicitudes.some((s) => s.tipo === "plan_empresa" && (s.estado === "nueva" || s.estado === "contactada"));

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
          <div className={`rounded-2xl p-5 ${activo ? "bg-[#0a2f5c] text-white" : "border border-border bg-surface"}`}>
            <p className="flex items-center gap-2 text-sm font-semibold opacity-80"><Crown className="size-4" /> Tu plan</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{activo ? "Plan Empresa" : "Gratis"}</p>
            {activo && e.plan_hasta && <p className="mt-1 text-sm opacity-80">Activo hasta el {new Date(`${e.plan_hasta}T12:00:00`).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}</p>}
            {!activo && <p className="mt-1 text-sm text-muted-foreground">Vacantes, candidatos, entrevistas y mensajes sin costo.</p>}
          </div>
          {!activo && plan && (
            <div className="rounded-2xl border-2 border-[#1d6ff2] bg-surface p-5">
              <p className="font-extrabold">Plan Empresa</p>
              <p className="mt-1"><span className="font-display text-2xl font-extrabold">{plan.precio}</span> <span className="text-sm text-muted-foreground">{plan.unidad}</span></p>
              <ul className="mt-3 space-y-2 text-sm">{plan.beneficios.map((b) => <li key={b} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />{b}</li>)}</ul>
              <button type="button" disabled={pedido} onClick={() => void p.pedir("plan_empresa")} className="btn-aplicar mt-4 h-11 w-full rounded-xl text-sm disabled:opacity-60">{pedido ? "Solicitud enviada: te contactamos" : "Quiero el Plan Empresa"}</button>
              <p className="mt-2 text-xs text-muted-foreground">No se cobra nada aquí. Te escribimos para coordinar el pago.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

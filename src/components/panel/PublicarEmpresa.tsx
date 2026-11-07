import { useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { claridad } from "@/lib/claridad";
import { areas, modalidades, nivelesExperiencia, provincias, tiposEmpleo } from "@/lib/data";
import { borradorVacio, type Borrador } from "@/lib/extraer";
import type { EmpresaPerfil } from "@/lib/panel";
import { filaDesde } from "@/lib/publicar";
import type { Vacante } from "@/lib/vacantes";

const FUENTE = "Publicada por la empresa";
const campo = "h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const etiqueta = "mb-1.5 block text-sm font-bold";

export function borradorDe(v: Vacante): Borrador {
  return {
    ...borradorVacio,
    titulo: v.titulo,
    empresa: v.empresa,
    provincia: v.provincia,
    modalidad: v.modalidad,
    tipo: v.tipo,
    experiencia: v.experiencia,
    area: v.area,
    salarioMin: v.salarioMin > 0 ? String(v.salarioMin) : "",
    salarioMax: v.salarioMax ? String(v.salarioMax) : "",
    descripcion: v.descripcion,
    requisitos: v.requisitos.join("\n"),
    fuente: FUENTE,
  };
}

export function PublicarEmpresa({ empresa, uid, base, duplicar = false, onListo }: { empresa: EmpresaPerfil; uid: string; base: Vacante | null; duplicar?: boolean; onListo: () => void }) {
  const editar = duplicar ? null : base;
  const [b, setB] = useState<Borrador>(() => (base ? borradorDe(base) : { ...borradorVacio, empresa: empresa.nombre, fuente: FUENTE }));
  const [guardando, setGuardando] = useState(false);
  const pon = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setB((x) => ({ ...x, [k]: v }));

  // Vista de claridad en vivo: la misma medida que ven los candidatos.
  const c = claridad({
    salarioMin: Number(b.salarioMin) || 0,
    empresa: empresa.nombre,
    requisitos: b.requisitos.split("\n").filter((r) => r.trim()),
    descripcion: b.descripcion,
    aplicar: "",
    fuente: FUENTE,
    fuenteUrl: "",
  } as unknown as Vacante);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (b.titulo.trim().length < 3) return void toast.error("Escribe el nombre del puesto.");
    if (b.descripcion.trim().length < 30) return void toast.error("Cuenta un poco más qué hará la persona (mínimo 30 letras).");
    const min = Number(b.salarioMin) || 0, max = Number(b.salarioMax) || 0;
    if (max && min && max < min) return void toast.error("El salario máximo no puede ser menor que el mínimo.");
    setGuardando(true);
    // Sin "cómo aplicar": la gente aplica en Enlace Laboral y llega a este panel.
    const fila = filaDesde({ ...b, empresa: empresa.nombre, fuente: FUENTE, fuenteUrl: "", aplicar: "", redes: false, imagen: "" });
    const q = editar
      ? supabase.from("vacantes").update(fila).eq("id", editar.id).select("estado").single()
      : supabase.from("vacantes").insert({ ...fila, empresa_id: empresa.id, owner_id: uid, estado: "publicada" }).select("estado").single();
    const { data, error } = await q;
    setGuardando(false);
    if (error) return void toast.error("No se pudo guardar. Revisa tu internet e intenta otra vez.");
    const estado = (data as { estado: string } | null)?.estado;
    toast.success(estado === "revision" ? "Recibida. La revisamos y sale publicada cuando la aprobemos. Te avisamos aquí." : editar ? "Cambios guardados." : "¡Publicada! Ya la ven los candidatos.");
    onListo();
  };

  return (
    <form onSubmit={(e) => void guardar(e)} className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div>
          <label className={etiqueta} htmlFor="p-titulo">Puesto</label>
          <input id="p-titulo" value={b.titulo} onChange={(e) => pon("titulo", e.target.value)} placeholder="Ej.: Auxiliar de almacén" className={campo} maxLength={120} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Sel id="p-area" label="Área" value={b.area} onChange={(v) => pon("area", v)} opciones={areas} />
          <Sel id="p-prov" label="Dónde" value={b.provincia} onChange={(v) => pon("provincia", v)} opciones={provincias.filter((p) => p !== "Toda República Dominicana")} />
          <Sel id="p-mod" label="Modalidad" value={b.modalidad} onChange={(v) => pon("modalidad", v)} opciones={modalidades} />
          <Sel id="p-tipo" label="Jornada" value={b.tipo} onChange={(v) => pon("tipo", v)} opciones={tiposEmpleo} />
          <Sel id="p-exp" label="Experiencia" value={b.experiencia} onChange={(v) => pon("experiencia", v)} opciones={nivelesExperiencia} />
        </div>
        <fieldset>
          <legend className={etiqueta}>Salario mensual (RD$)</legend>
          <div className="grid grid-cols-2 gap-3">
            <input inputMode="numeric" aria-label="Salario desde" value={b.salarioMin} onChange={(e) => pon("salarioMin", e.target.value.replace(/\D/g, ""))} placeholder="Desde" className={campo} />
            <input inputMode="numeric" aria-label="Salario hasta" value={b.salarioMax} onChange={(e) => pon("salarioMax", e.target.value.replace(/\D/g, ""))} placeholder="Hasta (opcional)" className={campo} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Las vacantes con salario se entienden mejor y atraen gente que sí puede aceptar la oferta.</p>
        </fieldset>
        <div>
          <label className={etiqueta} htmlFor="p-desc">Qué hará la persona</label>
          <textarea id="p-desc" value={b.descripcion} onChange={(e) => pon("descripcion", e.target.value)} rows={5} maxLength={4000} placeholder="Funciones, horario, beneficios…" className={`${campo} h-auto py-3`} />
        </div>
        <div>
          <label className={etiqueta} htmlFor="p-req">Requisitos <span className="font-normal text-muted-foreground">(uno por línea)</span></label>
          <textarea id="p-req" value={b.requisitos} onChange={(e) => pon("requisitos", e.target.value)} rows={4} maxLength={3000} placeholder={"Bachiller\nManejo de Excel\nDisponibilidad de horario"} className={`${campo} h-auto py-3`} />
          <p className="mt-1.5 text-xs text-muted-foreground">No pidas edad, sexo, foto ni estado civil: pide lo que necesita el trabajo.</p>
        </div>
        <button type="submit" disabled={guardando} className="btn-aplicar flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base sm:w-auto sm:px-8">
          {guardando && <Loader2 className="size-4 animate-spin" />} {editar ? "Guardar cambios" : "Publicar vacante"}
        </button>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-4">
        <div>
          <p className="text-sm font-bold">Claridad de tu vacante</p>
          <p className={`mt-1 text-2xl font-extrabold ${c.nivel === "Alta" ? "text-success" : c.nivel === "Media" ? "text-[#8a5200]" : "text-muted-foreground"}`}>{c.nivel} · {c.puntos}/{c.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">Los candidatos ven esta misma medida en tu vacante.</p>
        </div>
        <ul className="space-y-2 text-sm">
          {[...c.tiene.map((t) => [t, true] as const), ...c.falta.map((t) => [t, false] as const)].map(([t, ok]) => (
            <li key={t} className={`flex items-center gap-2 ${ok ? "" : "text-muted-foreground"}`}>
              {ok ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <Circle className="size-4 shrink-0" />} {t}
            </li>
          ))}
        </ul>
        <p className="border-t border-border pt-4 text-xs text-muted-foreground">Los candidatos aplican aquí mismo, sin cuenta, y te llegan a la pestaña Candidatos.</p>
        {!empresa.verificada && <p className="rounded-xl bg-cta/10 p-3 text-xs text-[#8a5200]">Tu empresa aún no está verificada: revisamos cada vacante antes de publicarla.</p>}
      </aside>
    </form>
  );
}

function Sel({ id, label, value, onChange, opciones }: { id: string; label: string; value: string; onChange: (v: string) => void; opciones: readonly string[] }) {
  return (
    <div>
      <label className={etiqueta} htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={campo}>
        {!opciones.includes(value) && value && <option value={value}>{value}</option>}
        {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

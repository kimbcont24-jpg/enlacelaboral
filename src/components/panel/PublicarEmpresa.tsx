import { useState } from "react";
import { BadgeCheck, CheckCircle2, Circle, ListChecks, Loader2, Plus, TrendingUp, Wand2, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { claridad } from "@/lib/claridad";
import { areas, modalidades, nivelesExperiencia, provincias, tiposEmpleo } from "@/lib/data";
import { borradorVacio, type Borrador } from "@/lib/extraer";
import type { EmpresaPerfil } from "@/lib/panel";
import { filaDesde } from "@/lib/publicar";
import { useVacantes, type Vacante } from "@/lib/vacantes";
import { salarioMercado } from "@/lib/mercado";
import { PLANTILLAS_VACANTE } from "@/lib/plantillas-vacante";
import { nuevaId, SUGERIDAS, type Pregunta } from "@/lib/preguntas";
import { COMPROMISOS, etiquetaCompromiso, revisarDiscriminacion, type Compromiso } from "@/lib/inclusion";

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
  const [preguntas, setPreguntas] = useState<Pregunta[]>(() => base?.preguntas ?? []);
  const [compromisos, setCompromisos] = useState<Compromiso[]>(() => COMPROMISOS.filter((c) => base?.categorias.includes(etiquetaCompromiso(c.id))).map((c) => c.id));
  const exclusiones = revisarDiscriminacion(`${b.titulo}\n${b.descripcion}\n${b.requisitos}\n${preguntas.map((q) => q.texto).join("\n")}`);
  const { jobs } = useVacantes();
  const mercado = b.titulo.trim().length >= 4 ? salarioMercado(b.titulo, b.provincia, jobs, editar?.id) : null;
  const miSalario = (Number(b.salarioMin) || 0) && (Number(b.salarioMax) ? (Number(b.salarioMin) + Number(b.salarioMax)) / 2 : Number(b.salarioMin));
  const usarPlantilla = (t: (typeof PLANTILLAS_VACANTE)[number]) => setB((x) => ({ ...x, titulo: t.puesto, area: t.area, descripcion: t.descripcion, requisitos: t.requisitos.join("\n") }));
  const ponPregunta = (id: string, cambios: Partial<Pregunta>) => setPreguntas((ps) => ps.map((q) => (q.id === id ? { ...q, ...cambios } : q)));
  const agregarPregunta = (q?: Omit<Pregunta, "id">) => setPreguntas((ps) => (ps.length >= 3 ? ps : [...ps, { id: nuevaId(), ...(q ?? { texto: "", tipo: "si_no", esperada: "si" }) }]));
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
    if (exclusiones.length) return void toast.error(`Quita «${exclusiones[0]!.frase}»: ${exclusiones[0]!.motivo} En Enlace Laboral no se publican avisos que excluyen.`);
    setGuardando(true);
    // Sin "cómo aplicar": la gente aplica en Enlace Laboral y llega a este panel.
    const limpias = preguntas.map((q) => ({ ...q, texto: q.texto.trim().slice(0, 200) })).filter((q) => q.texto.length >= 5);
    const basica = filaDesde({ ...b, empresa: empresa.nombre, fuente: FUENTE, fuenteUrl: "", aplicar: "", redes: false, imagen: "" });
    const fila = { ...basica, etiquetas: [...basica.etiquetas, ...compromisos.map(etiquetaCompromiso)], preguntas: limpias };
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
        {!editar && !b.descripcion.trim() && (
          <div className="rounded-2xl bg-[#1d6ff2]/[0.06] p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold"><Wand2 className="size-4 text-[#1d6ff2]" /> Empieza con un ejemplo</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Llenamos funciones y requisitos. Tú cambias lo que quieras.</p>
            <div className="mt-3 flex flex-wrap gap-2">{PLANTILLAS_VACANTE.map((t) => <button key={t.puesto} type="button" onClick={() => usarPlantilla(t)} className="rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] font-semibold hover:border-[#1d6ff2] hover:text-[#1557c4]">{t.puesto}</button>)}</div>
          </div>
        )}
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
          {mercado ? (
            <div className="mt-2.5 rounded-xl border border-border bg-background p-3.5">
              <p className="flex items-center gap-1.5 text-sm font-extrabold"><TrendingUp className="size-4 text-[#1d6ff2]" /> Lo que pagan puestos parecidos{mercado.provincia ? ` en ${b.provincia}` : ""}</p>
              <div className="relative mt-3 h-2 rounded-full bg-gradient-to-r from-[#1d6ff2]/20 via-[#1d6ff2]/60 to-[#1d6ff2]/20">
                {miSalario > 0 && <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#0a2f5c] shadow" style={{ left: `${Math.min(100, Math.max(0, ((miSalario - mercado.bajo * 0.8) / (mercado.alto * 1.2 - mercado.bajo * 0.8)) * 100))}%` }} title="Tu oferta" />}
              </div>
              <div className="mt-1.5 flex justify-between text-xs tabular-nums text-muted-foreground"><span>RD${mercado.bajo.toLocaleString("es-DO")}</span><span className="font-bold text-foreground">RD${mercado.medio.toLocaleString("es-DO")}</span><span>RD${mercado.alto.toLocaleString("es-DO")}</span></div>
              <p className="mt-2 text-xs text-muted-foreground">La mitad de {mercado.n} vacantes parecidas en Enlace Laboral paga entre RD${mercado.bajo.toLocaleString("es-DO")} y RD${mercado.alto.toLocaleString("es-DO")}.{miSalario > 0 ? (miSalario < mercado.bajo ? " Tu oferta está por debajo: puede que lleguen menos personas." : miSalario > mercado.alto ? " Tu oferta está por encima: buena para atraer a los mejores." : " Tu oferta está dentro de lo normal.") : ""}</p>
            </div>
          ) : <p className="mt-1.5 text-xs text-muted-foreground">Las vacantes con salario se entienden mejor y atraen gente que sí puede aceptar la oferta.</p>}
        </fieldset>
        <div>
          <label className={etiqueta} htmlFor="p-desc">Qué hará la persona</label>
          <textarea id="p-desc" value={b.descripcion} onChange={(e) => pon("descripcion", e.target.value)} rows={5} maxLength={4000} placeholder="Funciones, horario, beneficios…" className={`${campo} h-auto py-3`} />
        </div>
        <div>
          <label className={etiqueta} htmlFor="p-req">Requisitos <span className="font-normal text-muted-foreground">(uno por línea)</span></label>
          <textarea id="p-req" value={b.requisitos} onChange={(e) => pon("requisitos", e.target.value)} rows={4} maxLength={3000} placeholder={"Bachiller\nManejo de Excel\nDisponibilidad de horario"} className={`${campo} h-auto py-3`} />
          <p className="mt-1.5 text-xs text-muted-foreground">No pidas edad, sexo, foto ni estado civil: pide lo que necesita el trabajo.</p>
          {exclusiones.length > 0 && (
            <div role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm">
              <p className="font-extrabold text-destructive">Cambia esto antes de publicar</p>
              <ul className="mt-1.5 space-y-1">{exclusiones.map((x) => <li key={x.frase}><strong>«{x.frase}»</strong>: {x.motivo}</li>)}</ul>
              <p className="mt-2 text-xs text-muted-foreground">El Código de Trabajo (Principio VII) prohíbe excluir por sexo, edad, raza, color, origen, religión u opinión. Pide lo que el puesto necesita de verdad: así te llegan más personas buenas.</p>
            </div>
          )}
        </div>
        <fieldset className="rounded-2xl border border-border p-4">
          <legend className="px-1 text-sm font-bold">Compromisos de inclusión <span className="font-normal text-muted-foreground">(opcional)</span></legend>
          <p className="text-xs text-muted-foreground">Se muestran en tu vacante y ayudan a que te encuentren personas que muchas veces no se atreven a aplicar.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {COMPROMISOS.map((c) => {
              const on = compromisos.includes(c.id);
              return (
                <label key={c.id} className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-sm transition-colors ${on ? "border-success bg-success/5" : "border-border hover:border-success/50"}`}>
                  <input type="checkbox" checked={on} onChange={() => setCompromisos((xs) => (on ? xs.filter((x) => x !== c.id) : [...xs, c.id]))} className="mt-0.5 size-4 accent-[var(--success)]" />
                  <span><span className="block font-bold">{c.t}</span><span className="text-xs text-muted-foreground">{c.d}</span></span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="rounded-2xl border border-border p-4">
          <legend className="px-1 text-sm font-bold"><span className="inline-flex items-center gap-1.5"><ListChecks className="size-4 text-[#1d6ff2]" /> Preguntas de filtro <span className="font-normal text-muted-foreground">(opcional, hasta 3)</span></span></legend>
          <p className="text-xs text-muted-foreground">El candidato las responde al aplicar. En tu panel ves al instante quién cumple lo indispensable.</p>
          <ul className="mt-3 space-y-3">
            {preguntas.map((q, i) => (
              <li key={q.id} className="rounded-xl bg-background p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-2.5 text-xs font-bold text-muted-foreground">{i + 1}.</span>
                  <input value={q.texto} onChange={(e) => ponPregunta(q.id, { texto: e.target.value })} maxLength={200} placeholder="Escribe la pregunta" aria-label={`Pregunta ${i + 1}`} className={`${campo} h-11 bg-surface`} />
                  <button type="button" onClick={() => setPreguntas((ps) => ps.filter((x) => x.id !== q.id))} aria-label="Quitar pregunta" className="mt-1 grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-5 text-[13px]">
                  <select value={q.tipo} onChange={(e) => ponPregunta(q.id, { tipo: e.target.value as Pregunta["tipo"], esperada: e.target.value === "si_no" ? "si" : undefined })} aria-label="Tipo de respuesta" className="h-9 rounded-lg border border-border bg-surface px-2 font-semibold">
                    <option value="si_no">Respuesta Sí / No</option>
                    <option value="texto">Respuesta escrita</option>
                  </select>
                  {q.tipo === "si_no" && (
                    <label className="inline-flex items-center gap-1.5">Busco que responda
                      <select value={q.esperada ?? ""} onChange={(e) => ponPregunta(q.id, { esperada: (e.target.value || undefined) as Pregunta["esperada"] })} className="h-9 rounded-lg border border-border bg-surface px-2 font-semibold">
                        <option value="si">Sí</option><option value="no">No</option><option value="">Cualquiera</option>
                      </select>
                    </label>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {preguntas.length < 3 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGERIDAS.filter((sq) => !preguntas.some((q) => q.texto === sq.texto)).slice(0, 4).map((sq) => <button key={sq.texto} type="button" onClick={() => agregarPregunta(sq)} className="rounded-full border border-dashed border-border px-3 py-1.5 text-left text-[12.5px] font-semibold text-muted-foreground hover:border-[#1d6ff2] hover:text-[#1557c4]">+ {sq.texto}</button>)}
              <button type="button" onClick={() => agregarPregunta()} className="inline-flex items-center gap-1 rounded-full bg-[#0a2f5c] px-3 py-1.5 text-[12.5px] font-bold text-white"><Plus className="size-3.5" /> Escribir la mía</button>
            </div>
          )}
        </fieldset>
        <button type="submit" disabled={guardando} className="btn-aplicar flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base sm:w-auto sm:px-8">
          {guardando && <Loader2 className="size-4 animate-spin" />} {editar ? "Guardar cambios" : "Publicar vacante"}
        </button>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-4">
        <div>
          <p className="text-sm font-bold">Claridad de tu vacante</p>
          <p className={`mt-1 text-2xl font-extrabold ${c.nivel === "Alta" ? "text-success" : c.nivel === "Media" ? "text-[#8a5200]" : "text-muted-foreground"}`}>{c.nivel} · {c.puntos}/{c.total}</p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={c.total} aria-valuenow={c.puntos} aria-label="Claridad de tu vacante">
            <div className={`h-full rounded-full transition-[width] duration-500 ${c.puntos === c.total ? "bg-gradient-to-r from-[#0a7a4b] to-[#12a05f]" : "bg-[#1d6ff2]"}`} style={{ width: `${(c.puntos / c.total) * 100}%` }} />
          </div>
          {c.puntos === c.total ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-success/10 p-3 text-[13px] font-semibold text-success"><BadgeCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> ¡Listo! Tu vacante lleva el sello «Vacante clara 6/6», sale primero entre las de su día y aparece en el filtro de vacantes claras.</p>
          ) : (
            <p className="mt-3 rounded-xl bg-[#1d6ff2]/10 p-3 text-[13px] text-[#0a2f5c]">
              <span className="font-bold">{c.total - c.puntos === 1 ? "Te falta 1 dato" : `Te faltan ${c.total - c.puntos} datos`} para el sello «Vacante clara».</span> Agrega {c.falta.map((f) => f.toLowerCase()).join(" y ")}: las vacantes con sello salen primero entre las de su día y quien busca empleo puede filtrarlas.
              {c.falta.includes("Salario publicado") && <span className="mt-1.5 block text-xs text-muted-foreground">El salario es la primera pregunta de casi todo candidato. Un rango también cuenta.</span>}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Los candidatos ven esta misma medida en tu vacante.</p>
        </div>
        <ul className="space-y-2 text-sm">
          {[...c.tiene.map((t) => [t, true] as const), ...c.falta.map((t) => [t, false] as const)].map(([t, ok]) => (
            <li key={t} className={`flex items-center gap-2 ${ok ? "" : "text-muted-foreground"}`}>
              {ok ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <Circle className="size-4 shrink-0" />} {t}
            </li>
          ))}
        </ul>
        <p className="border-t border-border pt-4 text-xs text-muted-foreground">Los candidatos aplican aquí mismo, sin cuenta, y te llegan a la pestaña Candidatos.</p>
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

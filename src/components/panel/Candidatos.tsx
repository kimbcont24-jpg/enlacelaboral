import { useMemo, useState } from "react";
import { ChevronDown, Download, Mail, MessageCircle, Phone, Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { hace, type Vacante } from "@/lib/vacantes";
import { claveContacto, descargarCsv, enlaceContacto, ETAPAS, etapaDe, plantilla, telefono, type Candidato, type Etapa } from "@/lib/panel";

type Props = {
  candidatos: Candidato[];
  vacantes: Vacante[];
  empresa: string;
  vacanteSel: string;
  etapaSel: Etapa | "";
  vistoAntes: number;
  onFiltro: (vacante: string, etapa: Etapa | "") => void;
  onCambio: (id: string, cambios: Partial<Candidato>) => void;
};

export function Candidatos({ candidatos, vacantes, empresa, vacanteSel, etapaSel, vistoAntes, onFiltro, onCambio }: Props) {
  const [q, setQ] = useState("");
  const titulo = useMemo(() => new Map(vacantes.map((v) => [v.id, v.titulo])), [vacantes]);

  // La misma persona en varias vacantes de esta empresa.
  const otras = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const c of candidatos) {
      const k = claveContacto(c.contacto);
      if (!k) continue;
      if (!m.has(k)) m.set(k, new Set());
      m.get(k)!.add(c.vacante_id);
    }
    return m;
  }, [candidatos]);

  const deVacante = candidatos.filter((c) => !vacanteSel || c.vacante_id === vacanteSel);
  const lista = deVacante.filter((c) => (!etapaSel || c.etapa === etapaSel) && (!q || `${c.nombre} ${c.contacto} ${c.mensaje ?? ""} ${c.nota ?? ""}`.toLowerCase().includes(q.toLowerCase())));

  const exportar = () => {
    descargarCsv(`candidatos-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Nombre", "Contacto", "Vacante", "Etapa", "Aplicó", "Nota", "Mensaje y CV"],
      ...lista.map((c) => [c.nombre, c.contacto, titulo.get(c.vacante_id) ?? "", etapaDe(c.etapa).corto, new Date(c.created_at).toLocaleDateString("es-DO"), c.nota ?? "", c.mensaje ?? ""]),
    ]);
  };

  if (!candidatos.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <p className="text-lg font-bold">Aquí te llegan las personas que aplican</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Cuando alguien aplique a una de tus vacantes, lo verás en esta pestaña con su contacto y su CV. Puedes escribirle por WhatsApp con un toque.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:flex">
        <select value={vacanteSel} onChange={(e) => onFiltro(e.target.value, etapaSel)} aria-label="Vacante" className="h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm font-semibold sm:max-w-xs">
          <option value="">Todas mis vacantes ({candidatos.length})</option>
          {vacantes.filter((v) => candidatos.some((c) => c.vacante_id === v.id)).map((v) => (
            <option key={v.id} value={v.id}>{v.titulo} ({candidatos.filter((c) => c.vacante_id === v.id).length})</option>
          ))}
        </select>
        <label className="relative min-w-0 sm:flex-1">
          <span className="sr-only">Buscar candidato</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, contacto o palabra del CV" className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm" />
        </label>
        <button type="button" onClick={exportar} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold hover:border-primary hover:text-primary"><Download className="size-4" /> Descargar Excel</button>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Etapas">
        <Chip activo={!etapaSel} onClick={() => onFiltro(vacanteSel, "")} texto="Todos" n={deVacante.length} />
        {ETAPAS.map((e) => <Chip key={e.id} activo={etapaSel === e.id} onClick={() => onFiltro(vacanteSel, e.id)} texto={e.label} n={deVacante.filter((c) => c.etapa === e.id).length} />)}
      </div>

      {lista.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No hay candidatos en esta etapa.</p>}
      <ul className="space-y-3">
        {lista.map((c) => (
          <Tarjeta key={c.id} c={c} puesto={titulo.get(c.vacante_id) ?? "la vacante"} empresa={empresa} nuevo={new Date(c.created_at).getTime() > vistoAntes}
            otras={[...(otras.get(claveContacto(c.contacto)) ?? [])].filter((id) => id !== c.vacante_id).map((id) => titulo.get(id) ?? "").filter(Boolean)}
            onCambio={onCambio} />
        ))}
      </ul>
    </div>
  );
}

function Chip({ activo, onClick, texto, n }: { activo: boolean; onClick: () => void; texto: string; n: number }) {
  return (
    <button type="button" role="tab" aria-selected={activo} onClick={onClick} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${activo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary"}`}>
      {texto} <span className={`rounded-full px-1.5 text-xs tabular-nums ${activo ? "bg-white/20" : "bg-muted"}`}>{n}</span>
    </button>
  );
}

function Tarjeta({ c, puesto, empresa, nuevo, otras, onCambio }: { c: Candidato; puesto: string; empresa: string; nuevo: boolean; otras: string[]; onCambio: (id: string, cambios: Partial<Candidato>) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [nota, setNota] = useState(c.nota ?? "");
  const etapa = etapaDe(c.etapa);
  const tel = telefono(c.contacto);

  const guardar = async (cambios: Partial<Candidato>) => {
    onCambio(c.id, cambios);
    const { error } = await supabase.from("aplicaciones").update(cambios).eq("id", c.id);
    if (error) { toast.error("No se pudo guardar. Intenta otra vez."); onCambio(c.id, { etapa: c.etapa, nota: c.nota, etapa_at: c.etapa_at }); return false; }
    return true;
  };

  const abrir = (href: string) => window.open(href, "_blank", "noopener");

  /** Mueve a la etapa y ofrece avisarle a la persona con el mensaje listo. */
  const mover = async (nueva: Etapa) => {
    if (nueva === c.etapa) return;
    if (!(await guardar({ etapa: nueva, etapa_at: new Date().toISOString() }))) return;
    const link = enlaceContacto(c, plantilla(nueva, c, puesto, empresa), puesto);
    toast.success(`${c.nombre.split(" ")[0]}: ${etapaDe(nueva).corto}`, link && nueva !== "revision" && nueva !== "nuevo" ? { action: { label: link.tipo === "whatsapp" ? "Avisarle por WhatsApp" : "Avisarle por correo", onClick: () => abrir(link.href) } } : undefined);
  };

  /** Escribirle cuenta como revisarlo: sale de "Nuevos" solo. */
  const contactar = (href: string) => {
    abrir(href);
    if (c.etapa === "nuevo") void guardar({ etapa: "revision", etapa_at: new Date().toISOString() });
  };

  const link = enlaceContacto(c, plantilla(c.etapa, c, puesto, empresa), puesto);
  const msg = c.mensaje?.trim() ?? "";

  return (
    <li className={`rounded-2xl border bg-surface p-4 sm:p-5 ${nuevo && c.etapa === "nuevo" ? "border-cta" : "border-border"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-lg font-extrabold leading-tight">
            {c.nombre}
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${etapa.tono}`}>{etapa.corto}</span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{puesto} · aplicó {hace(c.created_at)}</p>
          <p className="mt-1 break-all text-sm font-semibold">{c.contacto}</p>
          {otras.length > 0 && <p className="mt-1 text-xs font-semibold text-primary">También aplicó a: {otras.join(", ")}</p>}
        </div>
        <div className="flex gap-2">
          {link && (
            <button type="button" onClick={() => contactar(link.href)} className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white ${link.tipo === "whatsapp" ? "bg-[#1fa855] hover:bg-[#178c46]" : "bg-primary hover:opacity-90"}`}>
              {link.tipo === "whatsapp" ? <MessageCircle className="size-4" /> : <Mail className="size-4" />} {link.tipo === "whatsapp" ? "WhatsApp" : "Correo"}
            </button>
          )}
          {tel && <a href={`tel:+${tel}`} onClick={() => c.etapa === "nuevo" && void guardar({ etapa: "revision", etapa_at: new Date().toISOString() })} aria-label={`Llamar a ${c.nombre}`} className="inline-flex size-11 items-center justify-center rounded-xl border border-border hover:border-primary hover:text-primary"><Phone className="size-4" /></a>}
        </div>
      </div>

      {msg && (
        <div className="mt-3">
          <p className={`whitespace-pre-line text-sm text-muted-foreground ${abierto ? "" : "line-clamp-3"}`}>{msg}</p>
          {msg.length > 180 && <button type="button" onClick={() => setAbierto((x) => !x)} className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-primary">{abierto ? "Ver menos" : msg.includes("--- CV ---") ? "Ver CV completo" : "Ver todo"} <ChevronDown className={`size-4 transition-transform ${abierto ? "rotate-180" : ""}`} /></button>}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4" role="group" aria-label="Mover a etapa">
        {ETAPAS.filter((e) => e.id !== "nuevo").map((e) => (
          <button key={e.id} type="button" aria-pressed={c.etapa === e.id} onClick={() => void mover(e.id)} className={`h-9 rounded-lg border px-3 text-sm font-semibold ${c.etapa === e.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary"}`}>
            {e.id === "entrevista" ? "Invitar a entrevista" : e.id === "contratado" ? "Contratar" : e.id === "descartado" ? "Descartar" : "Revisando"}
          </button>
        ))}
      </div>
      <label className="mt-3 block">
        <span className="sr-only">Nota privada</span>
        <textarea value={nota} onChange={(e) => setNota(e.target.value)} onBlur={() => { if (nota !== (c.nota ?? "")) void guardar({ nota: nota.trim() || null }).then((ok) => ok && toast.success("Nota guardada")); }} rows={1} maxLength={2000} placeholder="Nota privada (solo la ves tú): ej. Disponible lunes, pide 30 mil" className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm" />
      </label>
    </li>
  );
}

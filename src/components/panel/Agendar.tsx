import { useState } from "react";
import { Building2, Phone, Video, X } from "lucide-react";

import { usePanel } from "@/components/panel/contexto";
import { campoPanel, Persona } from "@/components/panel/comun";
import type { Candidato } from "@/lib/panel";

const MODOS = [
  { id: "presencial", label: "En la empresa", Icono: Building2, ayuda: "Dirección" },
  { id: "llamada", label: "Llamada", Icono: Phone, ayuda: "" },
  { id: "video", label: "Videollamada", Icono: Video, ayuda: "Enlace de Meet, Zoom o WhatsApp" },
] as const;

const dosDigitos = (n: number) => String(n).padStart(2, "0");
const local = (d: Date) => `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;

export function Agendar({ c, onCerrar }: { c: Candidato; onCerrar: () => void }) {
  const p = usePanel();
  const inicial = c.entrevista_at ? new Date(c.entrevista_at) : (() => { const d = new Date(); d.setDate(d.getDate() + 1); if (d.getDay() === 0) d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return d; })();
  const [fecha, setFecha] = useState(local(inicial));
  const [hora, setHora] = useState(`${dosDigitos(inicial.getHours())}:${dosDigitos(inicial.getMinutes())}`);
  const [modo, setModo] = useState<(typeof MODOS)[number]["id"]>(() => (c.entrevista_lugar?.startsWith("Llamada") ? "llamada" : /https?:\/\//.test(c.entrevista_lugar ?? "") ? "video" : "presencial"));
  // Recuerda el último lugar usado para no escribir la dirección cada vez.
  const [lugar, setLugar] = useState(() => { const l = (c.entrevista_lugar ?? "").replace(/^Llamada telefónica$/, "").replace(/^Videollamada: /, ""); if (l) return l; try { return localStorage.getItem("panel-lugar") ?? ""; } catch { return ""; } });
  const [avisar, setAvisar] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Sugerencias rápidas: las próximas mañanas hábiles.
  const rapidas = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d; }).filter((d) => d.getDay() !== 0).slice(0, 4);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const cuando = new Date(`${fecha}T${hora}`);
    if (Number.isNaN(cuando.getTime())) return;
    const texto = modo === "llamada" ? "Llamada telefónica" : modo === "video" ? `Videollamada: ${lugar.trim()}` : lugar.trim();
    setGuardando(true);
    if (modo === "presencial" && lugar.trim()) { try { localStorage.setItem("panel-lugar", lugar.trim()); } catch { /* sin almacenamiento */ } }
    const cuandoTxt = cuando.toLocaleString("es-DO", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    const nuevo = { ...c, etapa: "entrevista" as const, entrevista_at: cuando.toISOString(), entrevista_lugar: texto || null };
    const ok = await p.actualizar(c, { etapa: "entrevista", etapa_at: c.etapa === "entrevista" ? c.etapa_at : new Date().toISOString(), entrevista_at: nuevo.entrevista_at, entrevista_lugar: nuevo.entrevista_lugar }, { tipo: "entrevista", texto: `Entrevista agendada: ${cuandoTxt}` });
    setGuardando(false);
    if (!ok) return;
    if (avisar) p.contactar(nuevo, "entrevista");
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center" role="dialog" aria-modal="true" aria-label="Agendar entrevista">
      <button type="button" aria-label="Cerrar" tabIndex={-1} onClick={onCerrar} className="absolute inset-0 bg-[#0a1a33]/50" />
      <form onSubmit={(e) => void guardar(e)} className="relative w-full max-w-md rounded-t-3xl bg-surface p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start gap-3">
          <Persona nombre={c.nombre} />
          <div className="min-w-0 flex-1"><h2 className="text-lg font-extrabold">Entrevista con {c.nombre.split(" ")[0]}</h2><p className="truncate text-sm text-muted-foreground">{p.puesto(c.vacante_id)}</p></div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid size-9 place-items-center rounded-lg hover:bg-muted"><X className="size-5" /></button>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {rapidas.map((d) => { const v = local(d); return <button key={v} type="button" onClick={() => setFecha(v)} className={`shrink-0 rounded-xl border px-3 py-2 text-center text-sm ${fecha === v ? "border-[#1d6ff2] bg-[#1d6ff2]/10 font-bold text-[#1557c4]" : "border-border"}`}><span className="block text-[11px] uppercase">{d.toLocaleDateString("es-DO", { weekday: "short" })}</span><span className="font-bold">{d.getDate()} {d.toLocaleDateString("es-DO", { month: "short" })}</span></button>; })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1 block text-sm font-bold">Fecha</span><input type="date" required value={fecha} min={local(new Date())} onChange={(e) => setFecha(e.target.value)} className={campoPanel} /></label>
          <label className="block"><span className="mb-1 block text-sm font-bold">Hora</span><input type="time" required value={hora} step={900} onChange={(e) => setHora(e.target.value)} className={campoPanel} /></label>
        </div>

        <fieldset className="mt-4">
          <legend className="mb-1.5 text-sm font-bold">Cómo será</legend>
          <div className="grid grid-cols-3 gap-2">
            {MODOS.map(({ id, label, Icono }) => <button key={id} type="button" aria-pressed={modo === id} onClick={() => setModo(id)} className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold ${modo === id ? "border-[#1d6ff2] bg-[#1d6ff2]/10 text-[#1557c4]" : "border-border"}`}><Icono className="size-4" />{label}</button>)}
          </div>
        </fieldset>
        {modo !== "llamada" && <input value={lugar} onChange={(e) => setLugar(e.target.value)} maxLength={260} placeholder={modo === "video" ? "Pega el enlace de la videollamada" : "Ej.: Av. 27 de Febrero #100, 2do piso. Preguntar por Ana."} aria-label={MODOS.find((m) => m.id === modo)!.ayuda} className={`${campoPanel} mt-3`} />}

        <label className="mt-4 flex items-center gap-2.5 text-sm"><input type="checkbox" checked={avisar} onChange={(e) => setAvisar(e.target.checked)} className="size-4" /> Enviarle la invitación con fecha y hora</label>
        <button type="submit" disabled={guardando} className="btn-aplicar mt-5 h-12 w-full rounded-xl text-base">{guardando ? "Guardando…" : c.entrevista_at ? "Guardar cambio" : "Agendar entrevista"}</button>
      </form>
    </div>
  );
}

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Compass, MapPin, Plus, Sparkles, X } from "lucide-react";

import { cvVacio, guardarCV, leerCV, type CV } from "@/lib/cv";
import { recomendar } from "@/lib/recomendar";
import { useVacantes } from "@/lib/vacantes";

/**
 * Brújula: 3 toques para que la persona reciba vacantes hechas para ella sin llenar un CV entero.
 * Psicología: pasos pequeños (compromiso progresivo), recompensa inmediata (el contador de
 * vacantes que coinciden sube mientras elige) y cierre con un logro visible.
 */

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Requisitos que no son habilidades (datos de contacto, edad, sexo, residencia…).
const NO_HABILIDAD = /enviar|\bcv\b|curr[ií]cul|correo|whatsapp|interesad|edad|años|@|\d|residir|vivir|sexo|masculino|femenino|llamar|contactar|requisito/i;
const HABILIDADES_BASE = ["Atención al cliente", "Ventas", "Excel", "Microsoft Office", "Manejo de caja", "Trabajo en equipo", "Inglés", "Licencia de conducir", "Servicio al cliente", "Redes sociales", "Contabilidad", "Almacén e inventario"];

/** Títulos cortos más frecuentes entre las vacantes publicadas (ej. «Representante de servicio»). */
function puestosFrecuentes(titulos: string[], max = 10): string[] {
  const cuenta = new Map<string, { t: string; n: number }>();
  for (const t of titulos) {
    const corto = t.replace(/\(.*?\)|[-–|/].*$/g, "").trim().split(/\s+/).slice(0, 3).join(" ");
    if (corto.length < 4) continue;
    const k = sinAcentos(corto);
    const x = cuenta.get(k);
    cuenta.set(k, { t: x?.t ?? corto.charAt(0).toUpperCase() + corto.slice(1), n: (x?.n ?? 0) + 1 });
  }
  return [...cuenta.values()].sort((a, b) => b.n - a.n).slice(0, max).map((x) => x.t);
}

export function Brujula({ onListo, className = "" }: { onListo: (cv: CV) => void; className?: string }) {
  const { jobs } = useVacantes();
  const previo = typeof window !== "undefined" ? leerCV() : null;
  const [paso, setPaso] = useState(0);
  const [puesto, setPuesto] = useState(previo?.puesto ?? "");
  const [lugar, setLugar] = useState(previo?.ciudad ?? "");
  const [habs, setHabs] = useState<string[]>(() => (previo?.habilidades ?? "").split(/,|\n/).map((h) => h.trim()).filter(Boolean));
  const [otra, setOtra] = useState("");

  const sugeridos = useMemo(() => puestosFrecuentes(jobs.map((j) => j.titulo)), [jobs]);
  const provincias = useMemo(() => {
    const c = new Map<string, number>();
    for (const j of jobs) if (j.provincia?.trim()) c.set(j.provincia.trim(), (c.get(j.provincia.trim()) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([p]) => p);
  }, [jobs]);
  // Habilidades que piden las vacantes parecidas al puesto elegido; si no hay, las comunes.
  const habSugeridas = useMemo(() => {
    const ws = sinAcentos(puesto).split(/\s+/).filter((w) => w.length > 3);
    const cuenta = new Map<string, number>();
    if (ws.length) for (const j of jobs) {
      if (!ws.some((w) => sinAcentos(j.titulo).includes(w))) continue;
      for (const r of j.requisitos) { const t = r.replace(/[.;:]$/, "").trim(); if (t.length >= 3 && t.split(/\s+/).length <= 4 && !NO_HABILIDAD.test(t)) cuenta.set(t, (cuenta.get(t) ?? 0) + 1); }
    }
    const propias = [...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 8);
    return [...new Set([...propias, ...HABILIDADES_BASE])].slice(0, 14);
  }, [jobs, puesto]);

  const armar = (): CV => ({ ...cvVacio, ...(previo ?? {}), puesto: puesto.trim(), ciudad: lugar === "Cualquier lugar" ? "" : lugar.trim(), habilidades: habs.join(", ") });
  const coinciden = useMemo(() => (puesto.trim() || habs.length ? recomendar(armar(), jobs, new Set(), 999).length : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [puesto, lugar, habs, jobs]);

  const alternar = (h: string) => setHabs((xs) => (xs.includes(h) ? xs.filter((x) => x !== h) : [...xs, h].slice(0, 15)));
  const agregarOtra = () => { const t = otra.trim(); if (t.length >= 2 && !habs.includes(t)) setHabs((xs) => [...xs, t]); setOtra(""); };
  const terminar = () => { const cv = armar(); guardarCV(cv); onListo(cv); };

  const chip = (activo: boolean) => `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all active:scale-95 ${activo ? "border-[#1d6ff2] bg-[#1d6ff2] text-white shadow-sm" : "border-border bg-surface hover:border-[#1d6ff2]/60"}`;
  const puede = paso === 0 ? puesto.trim().length >= 3 : paso === 1 ? !!lugar : habs.length > 0;

  return (
    <section aria-label="Vacantes para ti en 3 toques" className={`overflow-hidden rounded-3xl border border-border bg-surface ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a2f5c] px-5 py-4 text-white sm:px-7">
        <p className="flex items-center gap-2 font-extrabold"><Compass className="size-5 text-[#8fc0ff]" /> Vacantes para ti en 3 toques <span className="font-normal text-white/60">· 30 segundos</span></p>
        <p aria-live="polite" className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
          <Sparkles className="size-4 text-[#ffd84d]" />
          {coinciden > 0 ? <><b className="tabular-nums">{coinciden}</b> {coinciden === 1 ? "vacante coincide" : "vacantes coinciden"}</> : "Elige y verás cuántas te coinciden"}
        </p>
      </div>
      <div className="px-5 py-6 sm:px-7">
        <div className="mb-5 flex gap-1.5" aria-hidden="true">{[0, 1, 2].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= paso ? "bg-[#1d6ff2]" : "bg-border"}`} />)}</div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Paso {paso + 1} de 3</p>

        {paso === 0 && (
          <div>
            <h2 className="mt-1 font-display text-xl font-extrabold sm:text-2xl">¿Qué trabajo buscas?</h2>
            <input autoFocus value={puesto} onChange={(e) => setPuesto(e.target.value.slice(0, 80))} onKeyDown={(e) => { if (e.key === "Enter" && puede) setPaso(1); }} placeholder="Ej. Cajera, auxiliar contable, chofer…" aria-label="Puesto que buscas" className="mt-4 h-13 w-full rounded-2xl border border-border bg-background px-4 py-3 text-lg outline-none focus:border-[#1d6ff2]" />
            {sugeridos.length > 0 && <p className="mt-4 text-sm text-muted-foreground">Lo que más se está buscando ahora:</p>}
            <div className="mt-2 flex flex-wrap gap-2">{sugeridos.map((s) => <button key={s} type="button" onClick={() => setPuesto(s)} className={chip(sinAcentos(puesto) === sinAcentos(s))}>{s}</button>)}</div>
          </div>
        )}

        {paso === 1 && (
          <div>
            <h2 className="mt-1 font-display text-xl font-extrabold sm:text-2xl">¿Dónde te gustaría trabajar?</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {[...provincias, "Cualquier lugar"].map((p) => <button key={p} type="button" onClick={() => setLugar(p)} className={chip(lugar === p)}>{p !== "Cualquier lugar" && <MapPin className="size-3.5" />}{p}</button>)}
            </div>
            <input value={provincias.includes(lugar) || lugar === "Cualquier lugar" ? "" : lugar} onChange={(e) => setLugar(e.target.value.slice(0, 60))} placeholder="¿Otra provincia o ciudad? Escríbela" aria-label="Otra provincia o ciudad" className="mt-4 h-11 w-full max-w-sm rounded-xl border border-border bg-background px-3.5 outline-none focus:border-[#1d6ff2]" />
          </div>
        )}

        {paso === 2 && (
          <div>
            <h2 className="mt-1 font-display text-xl font-extrabold sm:text-2xl">¿Qué sabes hacer?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Toca todo lo que aplique. {puesto.trim() ? `Las primeras son las que más piden para «${puesto.trim()}».` : ""}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[...new Set([...habSugeridas, ...habs])].map((h) => <button key={h} type="button" onClick={() => alternar(h)} aria-pressed={habs.includes(h)} className={chip(habs.includes(h))}>{habs.includes(h) ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}{h}</button>)}
            </div>
            <div className="mt-4 flex max-w-sm gap-2">
              <input value={otra} onChange={(e) => setOtra(e.target.value.slice(0, 40))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarOtra(); } }} placeholder="Agregar otra habilidad" aria-label="Agregar otra habilidad" className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 outline-none focus:border-[#1d6ff2]" />
              <button type="button" onClick={agregarOtra} className="h-11 rounded-xl border border-border px-4 text-sm font-bold hover:bg-secondary">Agregar</button>
            </div>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between gap-3">
          {paso > 0 ? <button type="button" onClick={() => setPaso((p) => p - 1)} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Atrás</button> : <span />}
          {paso < 2
            ? <button type="button" disabled={!puede} onClick={() => setPaso((p) => p + 1)} className="btn-aplicar inline-flex h-12 items-center gap-2 rounded-xl px-6 disabled:opacity-50">Seguir{coinciden > 0 ? ` · ${coinciden} coinciden` : ""} <ArrowRight className="size-4" /></button>
            : <button type="button" disabled={!puede} onClick={terminar} className="btn-aplicar inline-flex h-12 items-center gap-2 rounded-xl px-6 disabled:opacity-50"><Sparkles className="size-4" /> {coinciden ? `Ver mis ${coinciden} vacantes` : "Guardar y ver vacantes"}</button>}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Se guarda en tu CV y puedes cambiarlo cuando quieras. Nadie lo ve hasta que tú apliques.</p>
      </div>
    </section>
  );
}

/** Mensaje de logro al terminar la brújula (se cierra solo al tocar). */
export function LogroBrujula({ n, onCerrar }: { n: number; onCerrar: () => void }) {
  return (
    <div role="status" className="mb-5 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/[0.07] p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success text-white"><Check className="size-5" /></span>
      <p className="min-w-0 flex-1 text-sm"><b>¡Listo! {n ? `Estas son tus ${n} vacantes más parecidas.` : "Guardamos tu búsqueda."}</b> <span className="text-muted-foreground">Cada vez que entres verás las nuevas aquí. Completa tu CV para aplicar en un toque.</span></p>
      <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><X className="size-4" /></button>
    </div>
  );
}

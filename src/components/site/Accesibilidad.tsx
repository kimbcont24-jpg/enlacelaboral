import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Accessibility, X } from "lucide-react";

type Ajustes = { letra: 0 | 1 | 2 | 3; contraste: boolean; enlaces: boolean; quieto: boolean; lectura: boolean };
const K = "enlace-accesibilidad";
const INICIAL: Ajustes = { letra: 0, contraste: false, enlaces: false, quieto: false, lectura: false };
const leer = (): Ajustes => { try { return { ...INICIAL, ...(JSON.parse(localStorage.getItem(K) ?? "{}") as Partial<Ajustes>) }; } catch { return INICIAL; } };

function aplicar(a: Ajustes) {
  const h = document.documentElement.classList;
  for (const n of [1, 2, 3]) h.toggle(`a11y-letra-${n}`, a.letra === n);
  h.toggle("a11y-contraste", a.contraste);
  h.toggle("a11y-enlaces", a.enlaces);
  h.toggle("a11y-quieto", a.quieto);
  h.toggle("a11y-lectura", a.lectura);
}

/** Botón fijo «Accesibilidad»: letra más grande, alto contraste, enlaces subrayados, sin movimiento y lectura más cómoda. */
export function Accesibilidad() {
  const [abierto, setAbierto] = useState(false);
  // En el panel de empresas (celular) hay barra abajo: el botón sube para no taparla.
  const enPanel = useRouterState({ select: (s) => /^\/(panel|admin)/.test(s.location.pathname) });
  // En la página de una vacante (celular) también hay una barra fija con "Aplicar".
  const enVacante = useRouterState({ select: (s) => /^\/vacantes\/[^/]+/.test(s.location.pathname) });
  const subir = enPanel || enVacante;
  const [a, setA] = useState<Ajustes>(INICIAL);
  useEffect(() => { const x = leer(); setA(x); aplicar(x); }, []);
  useEffect(() => { if (!abierto) return; const t = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); }; document.addEventListener("keydown", t); return () => document.removeEventListener("keydown", t); }, [abierto]);
  const cambiar = (c: Partial<Ajustes>) => { const n = { ...a, ...c }; setA(n); aplicar(n); try { localStorage.setItem(K, JSON.stringify(n)); } catch { /* sin almacenamiento */ } };
  const activos = a.letra + Number(a.contraste) + Number(a.enlaces) + Number(a.quieto) + Number(a.lectura);
  const Opcion = ({ k, t, d }: { k: "contraste" | "enlaces" | "quieto" | "lectura"; t: string; d: string }) => (
    <button type="button" role="switch" aria-checked={a[k]} onClick={() => cambiar({ [k]: !a[k] })} className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left ${a[k] ? "border-primary bg-primary/5" : "border-border"}`}>
      <span><span className="block text-sm font-bold">{t}</span><span className="text-xs text-muted-foreground">{d}</span></span>
      <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${a[k] ? "bg-primary" : "bg-muted-foreground/30"}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${a[k] ? "left-[1.375rem]" : "left-0.5"}`} /></span>
    </button>
  );
  return (
    <div className="no-print">
      <button type="button" onClick={() => setAbierto((x) => !x)} aria-expanded={abierto} aria-controls="panel-accesibilidad" aria-label="Accesibilidad: tamaño de letra y contraste" className={`fixed left-4 z-[60] grid size-12 place-items-center rounded-full bg-[#0a2f5c] text-white shadow-lg ring-2 ring-white hover:bg-[#123f78] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffbf00] ${subir ? `bottom-24 lg:bottom-4 ${enPanel ? "lg:left-[17rem]" : ""}` : "bottom-4"}`}>
        <Accessibility className="size-6" aria-hidden="true" />
        {activos > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#1d6ff2] text-[10px] font-bold">{activos}</span>}
      </button>
      {abierto && (
        <div id="panel-accesibilidad" role="dialog" aria-label="Accesibilidad" className={`fixed left-4 z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-4 shadow-2xl max-h-[calc(100dvh-7rem)] overflow-y-auto ${subir ? `bottom-40 lg:bottom-20 ${enPanel ? "lg:left-[17rem]" : ""}` : "bottom-20"}`}>
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-extrabold"><Accessibility className="size-5 text-primary" aria-hidden="true" /> Accesibilidad</p>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="grid size-8 place-items-center rounded-lg hover:bg-muted"><X className="size-4" /></button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Ajusta la página a como mejor la ves. Se queda guardado en este teléfono o computadora.</p>
          <div className="mt-3">
            <p className="text-sm font-bold">Tamaño de la letra</p>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Tamaño de la letra">
              {([0, 1, 2, 3] as const).map((n) => <button key={n} type="button" role="radio" aria-checked={a.letra === n} onClick={() => cambiar({ letra: n })} className={`h-11 rounded-xl border font-extrabold ${a.letra === n ? "border-primary bg-primary text-primary-foreground" : "border-border"}`} style={{ fontSize: `${14 + n * 3}px` }}>{n === 0 ? "A" : `A${"+".repeat(n)}`}</button>)}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <Opcion k="contraste" t="Alto contraste" d="Colores más fuertes para ver mejor." />
            <Opcion k="enlaces" t="Subrayar enlaces" d="Ves claro dónde se puede tocar." />
            <Opcion k="lectura" t="Lectura más cómoda" d="Más espacio entre letras y líneas." />
            <Opcion k="quieto" t="Sin movimiento" d="Quita animaciones y efectos." />
          </div>
          {activos > 0 && <button type="button" onClick={() => cambiar(INICIAL)} className="mt-3 text-sm font-semibold text-primary hover:underline">Volver a como estaba</button>}
        </div>
      )}
    </div>
  );
}

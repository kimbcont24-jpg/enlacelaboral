import { useEffect, useRef, useState } from "react";
import { RotateCcw, Save, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { campo, rotulo, Tarjeta } from "@/components/admin/comun";
import {
  aparienciaOriginal, aplicarApariencia, COLORES, esOriginal, FUENTES, guardarApariencia, leerApariencia, limpiarApariencia,
  type Apariencia as TipoApariencia, type ClaveColor,
} from "@/lib/apariencia";

const PESOS_TITULOS = [{ v: 0, t: "Original (800 · ExtraBold)" }, { v: 500, t: "500 · Medium" }, { v: 600, t: "600 · Semibold" }, { v: 700, t: "700 · Bold" }, { v: 800, t: "800 · ExtraBold" }, { v: 900, t: "900 · Black" }];
const PESOS_NEGRITAS = [{ v: 0, t: "Original (700 · Bold)" }, { v: 500, t: "500 · Medium" }, { v: 600, t: "600 · Semibold" }, { v: 700, t: "700 · Bold" }];
const TAMANOS = [{ v: 0, t: "Original (100 %)" }, { v: 90, t: "Más pequeño (90 %)" }, { v: 95, t: "Un poco más pequeño (95 %)" }, { v: 105, t: "Un poco más grande (105 %)" }, { v: 110, t: "Más grande (110 %)" }];
const ESPACIADOS = [{ v: 0, t: "Original" }, { v: -0.03, t: "Letras más juntas" }, { v: -0.01, t: "Un poco juntas" }, { v: 0.0001, t: "Normal" }, { v: 0.02, t: "Más separadas" }];

/** Admin → Sitio → Apariencia: tipografía y colores de todo el sitio, con vista previa en vivo. */
export function Apariencia() {
  const [guardada, setGuardada] = useState<TipoApariencia>(aparienciaOriginal);
  const [a, setA] = useState<TipoApariencia>(aparienciaOriginal);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const guardadaRef = useRef(guardada);
  guardadaRef.current = guardada;

  useEffect(() => {
    void leerApariencia().then((x) => { setGuardada(x); setA(x); setCargando(false); });
    // Al salir de esta pestaña sin guardar, vuelve a lo que está publicado.
    return () => aplicarApariencia(guardadaRef.current);
  }, []);

  // Vista previa en vivo: todo el panel se ve con lo que estás eligiendo.
  useEffect(() => { if (!cargando) aplicarApariencia(a); }, [a, cargando]);

  const cambios = JSON.stringify(limpiarApariencia(a)) !== JSON.stringify(limpiarApariencia(guardada));
  const set = <K extends keyof TipoApariencia>(k: K, v: TipoApariencia[K]) => setA((x) => ({ ...x, [k]: v }));
  const setColor = (k: ClaveColor, v: string | null) => setA((x) => {
    const colores = { ...x.colores };
    if (v) colores[k] = v; else delete colores[k];
    return { ...x, colores };
  });

  const guardar = async () => {
    setGuardando(true);
    const error = await guardarApariencia(a);
    setGuardando(false);
    if (error) { toast.error("No se pudo guardar la apariencia"); return; }
    setGuardada(limpiarApariencia(a));
    toast.success("Listo: el sitio ya se ve así para todos");
  };

  if (cargando) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-5">
      <Tarjeta titulo="Apariencia del sitio" ayuda="Cambia la tipografía y los colores de toda la página. Mientras eliges, el panel te muestra cómo se verá. Nada cambia para los visitantes hasta que tocas «Guardar y publicar». El logotipo no cambia.">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void guardar()} disabled={!cambios || guardando}><Save /> {guardando ? "Guardando…" : "Guardar y publicar"}</Button>
          <Button variant="outline" onClick={() => setA(guardada)} disabled={!cambios}><Undo2 /> Descartar cambios</Button>
          <Button variant="ghost" onClick={() => setA(aparienciaOriginal)} disabled={esOriginal(a)}><RotateCcw /> Volver al diseño original</Button>
          <span className="text-xs text-muted-foreground">{cambios ? "Tienes cambios sin publicar." : esOriginal(guardada) ? "Publicado: diseño original." : "Publicado: apariencia personalizada."}</span>
        </div>
      </Tarjeta>

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta titulo="Tipografía">
          <div className="grid gap-4">
            <label className="block">
              <span className={rotulo}>Fuente de los titulares</span>
              <select className={campo} value={a.fuenteTitulos} onChange={(e) => set("fuenteTitulos", e.target.value)}>
                <option value="">Original (como está ahora)</option>
                {FUENTES.map((f) => <option key={f.nombre} value={f.nombre}>{f.nombre} — {f.tipo}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={rotulo}>Fuente de los textos, menú y botones</span>
              <select className={campo} value={a.fuenteTexto} onChange={(e) => set("fuenteTexto", e.target.value)}>
                <option value="">Original (Figtree)</option>
                {FUENTES.filter((f) => !/solo titulares/.test(f.tipo)).map((f) => <option key={f.nombre} value={f.nombre}>{f.nombre} — {f.tipo}</option>)}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={rotulo}>Grosor de titulares</span>
                <select className={campo} value={a.pesoTitulos} onChange={(e) => set("pesoTitulos", Number(e.target.value))}>
                  {PESOS_TITULOS.map((p) => <option key={p.v} value={p.v}>{p.t}</option>)}
                </select>
              </label>
              <label className="block">
                <span className={rotulo}>Grosor de negritas y botones</span>
                <select className={campo} value={a.pesoNegritas} onChange={(e) => set("pesoNegritas", Number(e.target.value))}>
                  {PESOS_NEGRITAS.map((p) => <option key={p.v} value={p.v}>{p.t}</option>)}
                </select>
              </label>
              <label className="block">
                <span className={rotulo}>Tamaño general del texto</span>
                <select className={campo} value={a.tamano} onChange={(e) => set("tamano", Number(e.target.value))}>
                  {TAMANOS.map((p) => <option key={p.v} value={p.v}>{p.t}</option>)}
                </select>
              </label>
              <label className="block">
                <span className={rotulo}>Espacio entre letras (titulares)</span>
                <select className={campo} value={a.espaciadoTitulos} onChange={(e) => set("espaciadoTitulos", Number(e.target.value))}>
                  {ESPACIADOS.map((p) => <option key={p.v} value={p.v}>{p.t}</option>)}
                </select>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Consejo: para un look más liviano, usa titulares en 700 y negritas en 600.</p>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Así se ve">
          <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
            <div className="hero-dark rounded-xl p-4">
              <p className="text-xs font-semibold text-white/75">Portada</p>
              <h2 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight">Encuentra empleo en República Dominicana</h2>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-lg font-extrabold">Representante de Ventas</h3>
              <p className="text-sm text-muted-foreground">Lucho &amp; Compañía · Santo Domingo</p>
              <p className="mt-2 text-xl font-extrabold text-success">RD$35,000 <span className="text-sm font-semibold text-muted-foreground">al mes</span></p>
              <p className="mt-2 text-sm">Buscamos una persona proactiva, con <span className="font-bold">experiencia en ventas</span> y buena actitud de servicio.</p>
              <button type="button" className="btn-aplicar mt-3 h-11 w-full rounded-xl text-base">Aplicar</button>
              <p className="mt-2 text-center text-sm font-semibold text-primary">Ver más vacantes</p>
            </div>
          </div>
        </Tarjeta>
      </div>

      <Tarjeta titulo="Colores" ayuda="Toca el cuadro de color para elegir otro. «Original» devuelve el color de siempre.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLORES.map((c) => {
            const valor = a.colores[c.clave] ?? c.original;
            const cambiado = !!a.colores[c.clave];
            return (
              <div key={c.clave} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <input type="color" value={valor} onChange={(e) => setColor(c.clave, e.target.value.toLowerCase() === c.original ? null : e.target.value)} aria-label={c.etiqueta} className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{c.etiqueta}</p>
                  <p className="text-xs text-muted-foreground">{c.ayuda}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs">
                    <span className="font-mono uppercase">{valor}</span>
                    {cambiado && <button type="button" onClick={() => setColor(c.clave, null)} className="font-semibold text-primary hover:underline">Original</button>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Tarjeta>
    </div>
  );
}

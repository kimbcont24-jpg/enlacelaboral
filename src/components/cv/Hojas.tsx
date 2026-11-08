import type { CSSProperties, ReactNode } from "react";

import { lineasLogros, type CV } from "@/lib/cv";

export const PLANTILLAS = [
  { id: "clasico", t: "Clásico" },
  { id: "moderno", t: "Moderno" },
  { id: "ejecutivo", t: "Ejecutivo" },
  { id: "elegante", t: "Elegante" },
  { id: "minimal", t: "Minimal" },
  { id: "compacto", t: "Compacto" },
] as const;
export type Plantilla = (typeof PLANTILLAS)[number]["id"];

export const COLORES = [
  { id: "marino", t: "Azul marino", c: "#0a2f5c", suave: "#e8eef6" },
  { id: "azul", t: "Azul", c: "#1d5fd6", suave: "#e6efff" },
  { id: "verde", t: "Verde", c: "#0f6e45", suave: "#e5f3ec" },
  { id: "vino", t: "Vino", c: "#8a1c3c", suave: "#f6e7ec" },
  { id: "turquesa", t: "Turquesa", c: "#0b6e7a", suave: "#e2f2f3" },
  { id: "grafito", t: "Grafito", c: "#2b2f36", suave: "#eceef1" },
] as const;
export type Color = (typeof COLORES)[number]["id"];

export const FUENTES = [
  { id: "s", t: "Moderna", css: "Figtree, system-ui, sans-serif" },
  { id: "a", t: "Clásica", css: "Arial, Helvetica, sans-serif" },
  { id: "e", t: "Con serifa", css: "Georgia, 'Times New Roman', serif" },
] as const;
export type Fuente = (typeof FUENTES)[number]["id"];

type Datos = ReturnType<typeof preparar>;
function preparar(cv: CV) {
  return {
    nombre: cv.nombre.trim() || "Tu nombre",
    contacto: [cv.telefono, cv.correo, cv.ciudad, cv.linkedin].map((x) => x.trim()).filter(Boolean),
    habilidades: cv.habilidades.split(",").map((h) => h.trim()).filter(Boolean),
    idiomas: cv.idiomas.split(",").map((h) => h.trim()).filter(Boolean),
    exp: cv.experiencia.filter((e) => e.puesto.trim() || e.empresa.trim()),
    edu: cv.educacion.filter((e) => e.titulo.trim()),
    cursos: (cv.cursos ?? []).filter((c) => c.nombre.trim()),
    extras: [cv.licencia.trim() && `Licencia de conducir: ${cv.licencia.trim()}`, cv.disponibilidad.trim() && `Disponibilidad: ${cv.disponibilidad.trim()}`].filter(Boolean) as string[],
    vacio: !cv.nombre && !cv.resumen && !cv.experiencia.some((e) => e.puesto.trim()),
  };
}
const fechas = (d: string, h: string) => [d, h || (d ? "actualidad" : "")].filter(Boolean).join(" – ");
const baseComun: CSSProperties = { printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" };

function Logros({ texto, className = "" }: { texto: string; className?: string }) {
  const l = lineasLogros(texto);
  if (!l.length) return null;
  if (l.length === 1) return <p className={`mt-1 leading-relaxed ${className}`}>{l[0]}</p>;
  return <ul className={`mt-1 space-y-0.5 leading-relaxed ${className}`}>{l.map((x, i) => <li key={i} className="flex gap-2"><span aria-hidden="true" className="mt-[0.6em] size-1 shrink-0 rounded-full bg-current opacity-60" />{x}</li>)}</ul>;
}

function Seccion({ titulo, color, children, estilo = "linea" }: { titulo: string; color: string; children: ReactNode; estilo?: "linea" | "simple" | "serif" }) {
  return (
    <section className="mt-6 break-inside-avoid-page">
      <h3 className={estilo === "serif" ? "border-b pb-1 text-[15px] font-semibold tracking-wide" : "flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.18em]"} style={{ color, borderColor: estilo === "serif" ? color : undefined, fontFamily: estilo === "serif" ? "Georgia, 'Times New Roman', serif" : undefined }}>
        {titulo}{estilo === "linea" && <span className="h-px flex-1" style={{ backgroundColor: color, opacity: 0.25 }} />}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Cuerpo({ d, cv, color, estilo, compacto = false }: { d: Datos; cv: CV; color: string; estilo?: "linea" | "simple" | "serif"; compacto?: boolean }) {
  const txt = compacto ? "text-[13px]" : "text-[14.5px]";
  return (
    <>
      {cv.resumen && <p className={`mt-5 leading-relaxed ${txt}`}>{cv.resumen}</p>}
      {d.vacio && <p className="mt-6 text-sm text-[#5b6678]">Llena el formulario y tu CV aparece aquí al instante.</p>}
      {d.exp.length > 0 && (
        <Seccion titulo="Experiencia" color={color} estilo={estilo}>
          <div className={compacto ? "space-y-3" : "space-y-4"}>
            {d.exp.map((e, i) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="font-bold">{e.puesto}{e.empresa && <span className="font-semibold text-[#5b6678]"> · {e.empresa}</span>}</p>
                  {(e.desde || e.hasta) && <p className="text-[12.5px] text-[#5b6678]">{fechas(e.desde, e.hasta)}</p>}
                </div>
                <Logros texto={e.logros} className={txt} />
              </div>
            ))}
          </div>
        </Seccion>
      )}
      {d.edu.length > 0 && (
        <Seccion titulo="Formación" color={color} estilo={estilo}>
          <ul className={`space-y-1.5 ${txt}`}>{d.edu.map((e, i) => <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4"><span><span className="font-bold">{e.titulo}</span>{e.centro && <span className="text-[#5b6678]"> · {e.centro}</span>}</span>{e.anio && <span className="text-[12.5px] text-[#5b6678]">{e.anio}</span>}</li>)}</ul>
        </Seccion>
      )}
      {d.cursos.length > 0 && (
        <Seccion titulo="Cursos y certificaciones" color={color} estilo={estilo}>
          <ul className={`space-y-1 ${txt}`}>{d.cursos.map((c, i) => <li key={i}><span className="font-semibold">{c.nombre}</span>{c.centro && <span className="text-[#5b6678]"> · {c.centro}</span>}{c.anio && <span className="text-[#5b6678]"> · {c.anio}</span>}</li>)}</ul>
        </Seccion>
      )}
    </>
  );
}

function Extras({ d, cv, color, estilo, chips = true, suave }: { d: Datos; cv: CV; color: string; estilo?: "linea" | "simple" | "serif"; chips?: boolean; suave: string }) {
  if (!d.habilidades.length && !d.idiomas.length && !d.extras.length && !cv.referencias) return null;
  return (
    <div className="grid gap-x-8 sm:grid-cols-2 print:grid-cols-2">
      {d.habilidades.length > 0 && (
        <Seccion titulo="Habilidades" color={color} estilo={estilo}>
          {chips ? <ul className="flex flex-wrap gap-1.5">{d.habilidades.map((h) => <li key={h} className="rounded-md px-2.5 py-1 text-[13px] font-semibold" style={{ backgroundColor: suave, color }}>{h}</li>)}</ul>
            : <p className="text-[14px] leading-relaxed">{d.habilidades.join(" · ")}</p>}
        </Seccion>
      )}
      {(d.idiomas.length > 0 || d.extras.length > 0 || cv.referencias) && (
        <Seccion titulo="Otros datos" color={color} estilo={estilo}>
          <ul className="space-y-1 text-[14px]">
            {d.idiomas.length > 0 && <li><span className="font-semibold">Idiomas:</span> {d.idiomas.join(", ")}</li>}
            {d.extras.map((x) => <li key={x}>{x}</li>)}
            {cv.referencias && <li className="text-[#5b6678]">Referencias disponibles a solicitud.</li>}
          </ul>
        </Seccion>
      )}
    </div>
  );
}

const hoja = "cv-hoja mx-auto w-full max-w-[210mm] overflow-hidden rounded-xl border border-border bg-white text-[#14213a] shadow-[var(--shadow-lift)]";

export function HojaCV({ cv, plantilla, color: colorId, fuente = "s" }: { cv: CV; plantilla: Plantilla; color: Color; fuente?: Fuente }) {
  const d = preparar(cv);
  const base: CSSProperties = { ...baseComun, fontFamily: FUENTES.find((f) => f.id === fuente)?.css ?? FUENTES[0].css };
  const { c: color, suave } = COLORES.find((x) => x.id === colorId) ?? COLORES[0];

  if (plantilla === "moderno") {
    return (
      <article id="cv-hoja" className={`${hoja} grid grid-cols-[34%_1fr]`} style={base}>
        <aside className="space-y-6 p-6 text-white sm:p-7" style={{ backgroundColor: color }}>
          <div className="grid size-16 place-items-center rounded-full bg-white/15 text-2xl font-extrabold">{d.nombre.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase()}</div>
          {d.contacto.length > 0 && <div><h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70">Contacto</h3><ul className="mt-2 space-y-1.5 text-[13px] [overflow-wrap:anywhere]">{d.contacto.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {d.habilidades.length > 0 && <div><h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70">Habilidades</h3><ul className="mt-2 space-y-1.5 text-[13px]">{d.habilidades.map((h) => <li key={h} className="flex gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-white/60" />{h}</li>)}</ul></div>}
          {d.idiomas.length > 0 && <div><h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70">Idiomas</h3><ul className="mt-2 space-y-1 text-[13px]">{d.idiomas.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {d.extras.length > 0 && <ul className="space-y-1 text-[12.5px] text-white/85">{d.extras.map((x) => <li key={x}>{x}</li>)}</ul>}
        </aside>
        <div className="p-6 sm:p-8">
          <h2 className="text-[1.75rem] font-extrabold leading-tight tracking-tight" style={{ color }}>{d.nombre}</h2>
          {cv.puesto && <p className="mt-1 text-base font-semibold opacity-80" style={{ color }}>{cv.puesto}</p>}
          <Cuerpo d={d} cv={cv} color={color} compacto />
          {cv.referencias && <p className="mt-6 text-[13px] text-[#5b6678]">Referencias disponibles a solicitud.</p>}
        </div>
      </article>
    );
  }

  if (plantilla === "ejecutivo") {
    return (
      <article id="cv-hoja" className={hoja} style={base}>
        <header className="px-8 pb-6 pt-8 text-white sm:px-10" style={{ backgroundColor: color }}>
          <h2 className="text-[2rem] font-extrabold leading-tight tracking-tight">{d.nombre}</h2>
          {cv.puesto && <p className="mt-1 text-lg font-semibold text-white/85">{cv.puesto}</p>}
          {d.contacto.length > 0 && <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-white/85">{d.contacto.map((x) => <span key={x}>{x}</span>)}</p>}
        </header>
        <div className="px-8 pb-9 sm:px-10"><Cuerpo d={d} cv={cv} color={color} /><Extras d={d} cv={cv} color={color} suave={suave} /></div>
      </article>
    );
  }

  if (plantilla === "elegante") {
    return (
      <article id="cv-hoja" className={`${hoja} p-9 sm:p-11`} style={base}>
        <header className="border-b pb-5 text-center" style={{ borderColor: color }}>
          <h2 className="text-[2.1rem] leading-tight" style={{ color, fontFamily: "Georgia, 'Times New Roman', serif" }}>{d.nombre}</h2>
          {cv.puesto && <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.25em] text-[#5b6678]">{cv.puesto}</p>}
          {d.contacto.length > 0 && <p className="mt-3 text-[13px] text-[#5b6678]">{d.contacto.join("  ·  ")}</p>}
        </header>
        <Cuerpo d={d} cv={cv} color={color} estilo="serif" />
        <Extras d={d} cv={cv} color={color} estilo="serif" chips={false} suave={suave} />
      </article>
    );
  }

  if (plantilla === "minimal") {
    const Fila = ({ t, children }: { t: string; children: ReactNode }) => (
      <section className="mt-6 grid grid-cols-[8.5rem_1fr] gap-6 break-inside-avoid-page"><h3 className="pt-0.5 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color }}>{t}</h3><div className="text-[14px]">{children}</div></section>
    );
    return (
      <article id="cv-hoja" className={`${hoja} p-9 sm:p-11`} style={base}>
        <h2 className="text-[2.2rem] font-light leading-none tracking-tight">{d.nombre.split(" ")[0]} <span className="font-extrabold" style={{ color }}>{d.nombre.split(" ").slice(1).join(" ")}</span></h2>
        {cv.puesto && <p className="mt-2 text-[15px] text-[#5b6678]">{cv.puesto}</p>}
        {d.contacto.length > 0 && <p className="mt-3 flex flex-wrap gap-x-4 text-[13px] text-[#5b6678]">{d.contacto.map((x) => <span key={x}>{x}</span>)}</p>}
        {cv.resumen && <Fila t="Perfil"><p className="leading-relaxed">{cv.resumen}</p></Fila>}
        {d.exp.length > 0 && <Fila t="Experiencia"><div className="space-y-4">{d.exp.map((e, i) => <div key={i} className="break-inside-avoid"><p className="font-bold">{e.puesto}{e.empresa && <span className="font-normal text-[#5b6678]">, {e.empresa}</span>}</p>{(e.desde || e.hasta) && <p className="text-[12.5px] text-[#5b6678]">{fechas(e.desde, e.hasta)}</p>}<Logros texto={e.logros} /></div>)}</div></Fila>}
        {d.edu.length > 0 && <Fila t="Formación"><ul className="space-y-1">{d.edu.map((e, i) => <li key={i}><span className="font-semibold">{e.titulo}</span>{e.centro && `, ${e.centro}`}{e.anio && <span className="text-[#5b6678]"> · {e.anio}</span>}</li>)}</ul></Fila>}
        {d.cursos.length > 0 && <Fila t="Cursos"><ul className="space-y-1">{d.cursos.map((c, i) => <li key={i}>{c.nombre}{c.centro && `, ${c.centro}`}{c.anio && <span className="text-[#5b6678]"> · {c.anio}</span>}</li>)}</ul></Fila>}
        {d.habilidades.length > 0 && <Fila t="Habilidades"><p>{d.habilidades.join(" · ")}</p></Fila>}
        {(d.idiomas.length > 0 || d.extras.length > 0) && <Fila t="Otros"><ul className="space-y-1">{d.idiomas.length > 0 && <li>Idiomas: {d.idiomas.join(", ")}</li>}{d.extras.map((x) => <li key={x}>{x}</li>)}</ul></Fila>}
        {cv.referencias && <p className="mt-6 text-[13px] text-[#5b6678]">Referencias disponibles a solicitud.</p>}
      </article>
    );
  }

  const compacto = plantilla === "compacto";
  return (
    <article id="cv-hoja" className={`${hoja} ${compacto ? "p-7 sm:p-8" : "p-8 sm:p-10"}`} style={base}>
      <header className={compacto ? "flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b-2 pb-3" : "border-b-4 pb-4"} style={{ borderColor: color }}>
        <div>
          <h2 className={`${compacto ? "text-2xl" : "text-3xl"} font-extrabold leading-tight tracking-tight`} style={{ color }}>{d.nombre}</h2>
          {cv.puesto && <p className="mt-1 text-lg font-semibold opacity-80" style={{ color }}>{cv.puesto}</p>}
        </div>
        {d.contacto.length > 0 && <p className={`text-[13px] text-[#5b6678] ${compacto ? "text-right" : "mt-2"}`}>{d.contacto.join("  ·  ")}</p>}
      </header>
      <Cuerpo d={d} cv={cv} color={color} compacto={compacto} />
      <Extras d={d} cv={cv} color={color} suave={suave} />
    </article>
  );
}

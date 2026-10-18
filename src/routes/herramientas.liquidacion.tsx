import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { CalculadoraPagina, CompartirResultado, PieCalculadora, campoCalc, rotuloCalc } from "@/components/site/CalculadoraBase";
import { MOTIVOS, liquidar, pesos, type Motivo } from "@/lib/calculos";

type Search = { s?: number; i?: string; f?: string; m?: Motivo };
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export const Route = createFileRoute("/herramientas/liquidacion")({
  validateSearch: (x: Record<string, unknown>): Search => {
    const s = Number(x["s"]);
    const m = MOTIVOS.find((o) => o.id === x["m"])?.id;
    return {
      s: Number.isFinite(s) && s > 0 && s < 100_000_000 ? Math.round(s) : undefined,
      i: typeof x["i"] === "string" && FECHA.test(x["i"]) ? x["i"] : undefined,
      f: typeof x["f"] === "string" && FECHA.test(x["f"]) ? x["f"] : undefined,
      m,
    };
  },
  head: () => ({
    meta: [
      { title: "Calculadora de liquidación y prestaciones laborales RD 2026 | Enlace Laboral" },
      { name: "description", content: "Calcula tu preaviso, cesantía, vacaciones y regalía pascual según el Código de Trabajo de República Dominicana. Gratis, sin registro." },
      { property: "og:title", content: "¿Cuánto te deben de liquidación? Calculadora RD" },
      { property: "og:description", content: "Preaviso, cesantía, vacaciones y regalía según el Código de Trabajo. Gratis." },
    ],
    links: [{ rel: "canonical", href: "https://enlace-rd.vercel.app/herramientas/liquidacion" }],
  }),
  component: Liquidacion,
});

const num = (t: string) => Number(t.replace(/[^\d.]/g, "")) || 0;
const miles = (t: string) => { const n = num(t); return n ? n.toLocaleString("es-DO") : ""; };
const hoyRD = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Santo_Domingo" });

function Liquidacion() {
  const q = Route.useSearch();
  const [motivo, setMotivo] = useState<Motivo>(q.m ?? "desahucio");
  const [salario, setSalario] = useState(q.s ? q.s.toLocaleString("es-DO") : "");
  const [ingreso, setIngreso] = useState(q.i ?? "");
  const [salida, setSalida] = useState(q.f ?? hoyRD());
  const [vacAnt, setVacAnt] = useState(false);

  const r = useMemo(() => liquidar({ salarioMensual: num(salario), ingreso, salida, motivo, vacacionesAnterior: vacAnt }), [salario, ingreso, salida, motivo, vacAnt]);
  const m = MOTIVOS.find((x) => x.id === motivo)!;
  const fechasMal = !!ingreso && !!salida && !r && num(salario) > 0;
  const query = `?s=${num(salario)}&i=${ingreso}&f=${salida}&m=${motivo}`;
  const resumen = r ? `Según el Código de Trabajo, mi liquidación estimada es de ${pesos(r.total)} (${r.a.anios} año${r.a.anios === 1 ? "" : "s"} y ${r.a.meses} mes${r.a.meses === 1 ? "" : "es"} de trabajo).` : "";

  return (
    <CalculadoraPagina titulo="Terminó tu trabajo. ¿Cuánto te" resaltado="deben pagar?" intro="Calcula preaviso, cesantía, vacaciones y regalía pascual con el Código de Trabajo de República Dominicana. Te toma un minuto.">
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-3xl border border-border bg-surface p-6 lg:col-span-2" aria-label="Tus datos">
          <fieldset>
            <legend className={rotuloCalc}>¿Cómo terminó tu trabajo?</legend>
            <div className="mt-2 space-y-2">
              {MOTIVOS.map((o) => (
                <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${motivo === o.id ? "border-primary bg-primary/5" : "border-border"}`}>
                  <input type="radio" name="motivo" className="mt-1 size-4" checked={motivo === o.id} onChange={() => setMotivo(o.id)} />
                  <span><strong className="block">{o.nombre}</strong><span className="text-muted-foreground">{o.ayuda}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="mt-5 block"><span className={rotuloCalc}>Salario mensual (RD$)</span>
            <input className={campoCalc} inputMode="numeric" autoComplete="off" value={salario} onChange={(e) => setSalario(miles(e.target.value))} placeholder="Ej. 45,000" />
            <span className="mt-1 block text-xs text-muted-foreground">Usa el promedio de lo que ganaste en los últimos 12 meses, con comisiones incluidas.</span>
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block"><span className={rotuloCalc}>Fecha en que empezaste</span><input type="date" className={campoCalc} value={ingreso} max={salida || undefined} onChange={(e) => setIngreso(e.target.value)} /></label>
            <label className="block"><span className={rotuloCalc}>Último día de trabajo</span><input type="date" className={campoCalc} value={salida} min={ingreso || undefined} onChange={(e) => setSalida(e.target.value)} /></label>
          </div>
          {r && r.a.anios >= 1 && (
            <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 size-4" checked={vacAnt} onChange={(e) => setVacAnt(e.target.checked)} /><span>No he tomado las vacaciones de mi último año cumplido</span></label>
          )}
        </section>

        <section className="lg:col-span-3" aria-live="polite" aria-label="Resultado">
          {!r ? (
            <div className="grid h-full place-items-center rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">{fechasMal ? "Revisa las fechas: el último día debe ser igual o posterior al día en que empezaste." : "Completa el salario y las fechas para ver el resultado."}</div>
          ) : (
            <div className="rounded-3xl border border-border bg-surface p-6">
              <p className="text-sm font-semibold text-muted-foreground">Liquidación estimada</p>
              <p className="mt-1 text-5xl font-extrabold tabular-nums text-success">{pesos(r.total)}</p>
              <p className="mt-1 text-sm text-muted-foreground">Trabajaste {r.a.anios} año{r.a.anios === 1 ? "" : "s"}, {r.a.meses} mes{r.a.meses === 1 ? "" : "es"} y {r.a.dias} día{r.a.dias === 1 ? "" : "s"}. Tu día de salario vale {pesos(r.salarioDiario)} (salario ÷ 23,83).</p>
              {!r.prestaciones && <p className="mt-3 rounded-xl bg-[#fff8dc] p-3 text-sm font-semibold text-[#6b4a00]">Con este motivo ({m.nombre.toLowerCase()}) no corresponden preaviso ni cesantía. Cobras lo que ya ganaste.</p>}
              <ul className="mt-5 divide-y divide-border">
                {r.lineas.map((l) => (
                  <li key={l.clave} className="flex items-start justify-between gap-4 py-3">
                    <span className="min-w-0"><strong className="block text-sm">{l.nombre}</strong><span className="text-xs text-muted-foreground">{l.detalle}</span></span>
                    <span className={`shrink-0 font-bold tabular-nums ${l.monto > 0 ? "" : "text-muted-foreground"}`}>{pesos(l.monto)}</span>
                  </li>
                ))}
                <li className="flex items-center justify-between py-3 text-lg font-extrabold"><span>Total</span><span className="tabular-nums">{pesos(r.total)}</span></li>
              </ul>
              <ul className="mt-2 space-y-1.5 rounded-2xl bg-muted p-4 text-sm">
                {r.avisos.map((a) => (<li key={a}>• {a}</li>))}
              </ul>
              <div className="mt-5"><CompartirResultado texto={resumen} ruta="/herramientas/liquidacion" query={query} /></div>
            </div>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5 text-sm" aria-labelledby="reglas-liq">
        <h2 id="reglas-liq" className="text-base font-extrabold">Las reglas, en simple</h2>
        <ul className="mt-2 space-y-2 text-muted-foreground">
          <li><strong className="text-foreground">Preaviso (art. 76):</strong> 7 días si tienes de 3 a 6 meses; 14 días de 6 a 12 meses; 28 días con más de 1 año.</li>
          <li><strong className="text-foreground">Cesantía (art. 80):</strong> 6 días de 3 a 6 meses; 13 días de 6 a 12 meses; 21 días por cada año entre 1 y 5 años; 23 días por cada año si pasas de 5. Una fracción de año mayor de 3 meses se paga con las dos primeras reglas.</li>
          <li><strong className="text-foreground">Vacaciones (arts. 177 y 180):</strong> 14 días laborables por año (18 después de 5 años). Si no completas el año, hay una escala: desde 5 meses son 6 días, y sube hasta 12 días a los 11 meses.</li>
          <li><strong className="text-foreground">Regalía pascual:</strong> 1/12 del salario ganado en el año. Se paga aunque renuncies.</li>
          <li><strong className="text-foreground">Día de salario:</strong> se divide el salario mensual entre 23,83, no entre 30.</li>
        </ul>
      </section>
      <PieCalculadora nota="El preaviso y la cesantía no pagan ISR ni cotizan a la TSS." />
    </CalculadoraPagina>
  );
}

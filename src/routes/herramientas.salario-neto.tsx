import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { CalculadoraPagina, CompartirResultado, PieCalculadora, campoCalc, rotuloCalc } from "@/components/site/CalculadoraBase";
import { TSS, ISR_TRAMOS, brutoParaNeto, pesos, salarioNeto } from "@/lib/calculos";

type Search = { bruto?: number; modo?: "bruto" | "neto" };

export const Route = createFileRoute("/herramientas/salario-neto")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const n = Number(s["bruto"]);
    return { bruto: Number.isFinite(n) && n > 0 && n < 100_000_000 ? Math.round(n) : undefined, modo: s["modo"] === "neto" ? "neto" : undefined };
  },
  head: () => ({
    meta: [
      { title: "Calculadora de salario neto en RD 2026 (AFP, SFS e ISR) | Enlace Laboral" },
      { name: "description", content: "Calcula cuánto te llega de tu salario bruto en República Dominicana: descuentos de AFP, SFS e ISR con las cifras de 2026. Gratis y sin registro." },
      { property: "og:title", content: "¿Cuánto te llega de tu salario? Calculadora RD 2026" },
      { property: "og:description", content: "AFP, SFS e ISR al detalle. Gratis, sin registro." },
    ],
    links: [{ rel: "canonical", href: "https://enlace-rd.vercel.app/herramientas/salario-neto" }],
  }),
  component: SalarioNeto,
});

const num = (t: string) => Number(t.replace(/[^\d.]/g, "")) || 0;
const miles = (t: string) => { const n = num(t); return n ? n.toLocaleString("es-DO") : ""; };

function SalarioNeto() {
  const s = Route.useSearch();
  const [modo, setModo] = useState<"bruto" | "neto">(s.modo ?? "bruto");
  const [texto, setTexto] = useState(s.bruto ? s.bruto.toLocaleString("es-DO") : "");
  const [otrosTxt, setOtrosTxt] = useState("");
  const valor = num(texto);
  const otros = num(otrosTxt);
  const bruto = modo === "bruto" ? valor : brutoParaNeto(valor, otros);
  const r = useMemo(() => salarioNeto(bruto, otros), [bruto, otros]);
  const hay = valor > 0;
  const tramoTxt = ["Exento de ISR", "Tramo del 15%", "Tramo del 20%", "Tramo del 25%"][r.tramo];

  const resumen = hay ? `Con un salario bruto de ${pesos(r.bruto)}, me llegan ${pesos(r.neto)} al mes (AFP ${pesos(r.afp)}, SFS ${pesos(r.sfs)}, ISR ${pesos(r.isr)}).` : "";

  return (
    <CalculadoraPagina titulo="¿Cuánto te llega de tu" resaltado="salario?" intro="Pon tu salario bruto y mira, peso por peso, lo que descuentan AFP, SFS e ISR. También puedes saber qué bruto necesitas para ganar el neto que quieres.">
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-3xl border border-border bg-surface p-6 lg:col-span-2" aria-label="Tus datos">
          <div role="group" aria-label="Qué quieres calcular" className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1 text-sm font-bold">
            {([["bruto", "Tengo el bruto"], ["neto", "Quiero un neto"]] as const).map(([id, n]) => (
              <button key={id} type="button" aria-pressed={modo === id} onClick={() => setModo(id)} className={`rounded-lg px-3 py-2 ${modo === id ? "bg-background shadow-sm" : "text-muted-foreground"}`}>{n}</button>
            ))}
          </div>
          <label className="mt-5 block"><span className={rotuloCalc}>{modo === "bruto" ? "Salario bruto mensual (RD$)" : "Neto que quieres recibir al mes (RD$)"}</span>
            <input className={campoCalc} inputMode="numeric" autoComplete="off" value={texto} onChange={(e) => setTexto(miles(e.target.value))} placeholder="Ej. 50,000" />
          </label>
          <label className="mt-4 block"><span className={rotuloCalc}>Otros descuentos al mes (opcional)</span>
            <input className={campoCalc} inputMode="numeric" autoComplete="off" value={otrosTxt} onChange={(e) => setOtrosTxt(miles(e.target.value))} placeholder="Préstamo, cooperativa, seguro…" />
          </label>
          <p className="mt-4 text-sm text-muted-foreground">El bruto es lo que dice tu contrato o la vacante, antes de descuentos.</p>
        </section>

        <section className="lg:col-span-3" aria-live="polite" aria-label="Resultado">
          {!hay ? (
            <div className="grid h-full place-items-center rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Escribe un salario para ver el resultado.</div>
          ) : (
            <div className="rounded-3xl border border-border bg-surface p-6">
              <p className="text-sm font-semibold text-muted-foreground">{modo === "neto" ? `Para recibir ${pesos(valor)} necesitas un bruto de` : "Te llegan al mes"}</p>
              <p className="mt-1 text-5xl font-extrabold tabular-nums text-success">{modo === "neto" ? pesos(r.bruto) : pesos(r.neto)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{modo === "neto" ? `Con ese bruto, descuentos de ${pesos(r.afp + r.sfs + r.isr)} y te quedan ${pesos(r.neto)}.` : `Te quedas con el ${(r.porcentaje * 100).toFixed(1).replace(".", ",")}% de tu bruto.`}</p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label="Reparto del salario bruto">
                <div className="flex h-full">
                  <div className="bg-success" style={{ width: `${Math.max(0, r.porcentaje * 100)}%` }} />
                  <div className="bg-primary" style={{ width: `${((r.afp + r.sfs) / r.bruto) * 100}%` }} />
                  <div className="bg-[#e0a800]" style={{ width: `${(r.isr / r.bruto) * 100}%` }} />
                </div>
              </div>
              <table className="mt-5 w-full text-sm">
                <tbody className="divide-y divide-border">
                  <Fila n="Salario bruto" v={pesos(r.bruto)} fuerte />
                  <Fila n={`AFP (pensión) ${(TSS.afp * 100).toFixed(2).replace(".", ",")}%`} v={`− ${pesos(r.afp)}`} />
                  <Fila n={`SFS (salud) ${(TSS.sfs * 100).toFixed(2).replace(".", ",")}%`} v={`− ${pesos(r.sfs)}`} />
                  <Fila n={`ISR (retención) · ${tramoTxt}`} v={`− ${pesos(r.isr)}`} />
                  {r.otros > 0 && <Fila n="Otros descuentos" v={`− ${pesos(r.otros)}`} />}
                  <Fila n="Salario neto mensual" v={pesos(r.neto)} fuerte />
                </tbody>
              </table>
              <div className="mt-5 rounded-2xl bg-muted p-4 text-sm">
                <p><strong>Al año:</strong> {pesos(r.neto * 12)} en 12 pagos + {pesos(r.regalia)} de regalía pascual (el «doble sueldo» de diciembre, sin ISR ni descuentos de TSS si trabajaste todo el año) = <strong>{pesos(r.netoAnual)}</strong>.</p>
              </div>
              <div className="mt-5"><CompartirResultado texto={resumen} ruta="/herramientas/salario-neto" query={`?bruto=${Math.round(r.bruto)}`} /></div>
            </div>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5 text-sm" aria-labelledby="como-neto">
        <h2 id="como-neto" className="text-base font-extrabold">Cómo se calcula</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>AFP {(TSS.afp * 100).toFixed(2).replace(".", ",")}% y SFS {(TSS.sfs * 100).toFixed(2).replace(".", ",")}% sobre tu salario, hasta los topes de la TSS ({pesos(TSS.topeAfp)} para pensión y {pesos(TSS.topeSfs)} para salud).</li>
          <li>La base del ISR es tu bruto menos AFP y SFS. Se multiplica por 12 y se aplica la escala anual de la DGII: exento hasta {pesos(ISR_TRAMOS[0].hasta)}, 15% hasta {pesos(ISR_TRAMOS[1].hasta)}, 20% hasta {pesos(ISR_TRAMOS[2].hasta)} y 25% después.</li>
          <li>El resultado anual se divide entre 12 para la retención mensual.</li>
        </ol>
      </section>
      <PieCalculadora nota="La escala del ISR cambia desde el 1 de enero de 2027 (Ley 30-26); esta calculadora usa la de 2026." />
    </CalculadoraPagina>
  );
}

function Fila({ n, v, fuerte }: { n: string; v: string; fuerte?: boolean }) {
  return (
    <tr className={fuerte ? "font-extrabold" : ""}>
      <td className="py-2.5 pr-3">{n}</td>
      <td className="py-2.5 text-right tabular-nums">{v}</td>
    </tr>
  );
}

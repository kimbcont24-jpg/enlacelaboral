import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarClock, ChevronDown, Gift, ShieldCheck } from "lucide-react";

import { CalculadoraPagina, CompartirResultado, PieCalculadora, campoCalc, rotuloCalc } from "@/components/site/CalculadoraBase";
import { pesos } from "@/lib/calculos";

const ANIO = 2026;
const LIMITE = new Date(ANIO, 11, 20); // 20 de diciembre
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const PREGUNTAS: [string, string][] = [
  ["¿Cuándo se paga la regalía pascual?", `A más tardar el 20 de diciembre de ${ANIO}. La empresa puede pagarla antes, nunca después.`],
  ["¿Me pueden descontar AFP, SFS o ISR de la regalía?", "No. La regalía que manda la ley no paga ISR ni descuentos de AFP o SFS, y no se puede embargar ni ceder. Si tu empresa te da más de lo que manda la ley, lo que pase de ahí puede pagar ISR."],
  ["¿Qué entra en el cálculo?", "Tu salario ordinario de todo el año, dividido entre 12. No entran las horas extra ni la bonificación (la participación en los beneficios de la empresa)."],
  ["Renuncié o me despidieron. ¿Me toca?", "Sí. Te toca la parte proporcional al tiempo que trabajaste en el año, sin importar cómo terminó el contrato."],
  ["¿Tiene un tope?", "Sí. La ley la limita a cinco salarios mínimos. La empresa puede pagar más si quiere."],
  ["¿Qué hago si no me la pagan?", "Habla primero con Recursos Humanos. Si no se resuelve, puedes acudir al Ministerio de Trabajo, que también tiene una calculadora oficial para comparar."],
];

type Search = { salario?: number };

export const Route = createFileRoute("/herramientas/regalia-pascual")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const n = Number(s["salario"]);
    return { salario: Number.isFinite(n) && n > 0 && n < 100_000_000 ? Math.round(n) : undefined };
  },
  head: () => ({
    meta: [
      { title: `Calculadora de regalía pascual ${ANIO} (doble sueldo) RD | Enlace Laboral` },
      { name: "description", content: `Calcula cuánto te toca de regalía pascual o doble sueldo ${ANIO} en República Dominicana. Si empezaste este año, renunciaste o tu salario cambió. Gratis y sin registro.` },
      { property: "og:title", content: `¿Cuánto te toca de regalía pascual ${ANIO}?` },
      { property: "og:description", content: "Calcula tu doble sueldo en segundos. Se paga a más tardar el 20 de diciembre." },
    ],
    links: [{ rel: "canonical", href: "https://enlacelaboralrd.com/herramientas/regalia-pascual" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: PREGUNTAS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }) }],
  }),
  component: Regalia,
});

const num = (t: string) => Number(t.replace(/[^\d.]/g, "")) || 0;
const miles = (t: string) => { const n = num(t); return n ? n.toLocaleString("es-DO") : ""; };
const fecha = (t: string) => { const d = t ? new Date(`${t}T00:00:00`) : null; return d && !Number.isNaN(d.getTime()) ? d : null; };

/** Meses trabajados en el año (con fracción por días) entre dos fechas. */
function mesesTrabajados(inicio: Date | null, fin: Date | null): number {
  const desde = inicio && inicio.getFullYear() === ANIO ? inicio : new Date(ANIO, 0, 1);
  const hasta = fin && fin.getFullYear() === ANIO ? fin : new Date(ANIO, 11, 31);
  if ((inicio && inicio.getFullYear() > ANIO) || (fin && fin.getFullYear() < ANIO) || hasta < desde) return 0;
  let total = 0;
  for (let m = 0; m < 12; m++) {
    const ini = new Date(ANIO, m, 1);
    const ult = new Date(ANIO, m + 1, 0);
    const a = desde > ini ? desde : ini;
    const b = hasta < ult ? hasta : ult;
    if (b >= a) total += (Math.round((b.getTime() - a.getTime()) / 864e5) + 1) / ult.getDate();
  }
  return Math.min(12, total);
}

function Regalia() {
  const s = Route.useSearch();
  const [modo, setModo] = useState<"igual" | "cambio">("igual");
  const [salTxt, setSalTxt] = useState(s.salario ? s.salario.toLocaleString("es-DO") : "");
  const [empece, setEmpece] = useState(false);
  const [inicio, setInicio] = useState("");
  const [sali, setSali] = useState(false);
  const [salida, setSalida] = useState("");
  const [porMes, setPorMes] = useState<string[]>(Array(12).fill(""));

  const hoy = new Date();
  const faltan = Math.ceil((LIMITE.getTime() - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) / 864e5);

  const r = useMemo(() => {
    if (modo === "igual") {
      const salario = num(salTxt);
      const meses = mesesTrabajados(empece ? fecha(inicio) : null, sali ? fecha(salida) : null);
      return { total: salario * meses, meses, regalia: (salario * meses) / 12, hay: salario > 0 && meses > 0 };
    }
    const valores = porMes.map(num);
    const total = valores.reduce((a, b) => a + b, 0);
    return { total, meses: valores.filter((v) => v > 0).length, regalia: total / 12, hay: total > 0 };
  }, [modo, salTxt, empece, inicio, sali, salida, porMes]);

  const mesesTxt = (Math.round(r.meses * 10) / 10).toLocaleString("es-DO");
  const resumen = r.hay ? `Según la calculadora de Enlace Laboral, me tocan ${pesos(r.regalia)} de regalía pascual ${ANIO}. Se paga a más tardar el 20 de diciembre, sin descuentos.` : "";
  const llenarTodos = () => { const v = porMes.find((x) => num(x) > 0) ?? salTxt; if (num(v)) setPorMes(Array(12).fill(miles(v))); };

  return (
    <CalculadoraPagina titulo="¿Cuánto te toca de" resaltado={`regalía pascual ${ANIO}?`} intro="Calcula tu doble sueldo en segundos: si trabajaste todo el año, si empezaste este año, si ya no trabajas ahí o si tu salario cambió.">
      <div className={`mb-6 flex flex-wrap items-center gap-3 rounded-2xl p-4 text-sm ${faltan >= 0 ? "bg-[#ffd84d]/25 text-[#5a3b00]" : "bg-muted text-foreground"}`}>
        <CalendarClock className="size-5 shrink-0" aria-hidden="true" />
        {faltan > 0 ? <p><strong className="text-base">Faltan {faltan} {faltan === 1 ? "día" : "días"}</strong> para el 20 de diciembre, la fecha límite para que te paguen la regalía.</p>
          : faltan === 0 ? <p><strong className="text-base">Hoy, 20 de diciembre,</strong> es el último día para que te paguen la regalía.</p>
          : <p>La regalía de {ANIO} debió pagarse a más tardar el 20 de diciembre. Si no te la pagaron, mira abajo qué hacer.</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-3xl border border-border bg-surface p-6 lg:col-span-2" aria-label="Tus datos">
          <div role="group" aria-label="Tu salario este año" className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1 text-sm font-bold">
            {([["igual", "Mismo salario"], ["cambio", "Mi salario cambió"]] as const).map(([id, n]) => (
              <button key={id} type="button" aria-pressed={modo === id} onClick={() => setModo(id)} className={`rounded-lg px-3 py-2 ${modo === id ? "bg-background shadow-sm" : "text-muted-foreground"}`}>{n}</button>
            ))}
          </div>

          {modo === "igual" ? (
            <>
              <label className="mt-5 block"><span className={rotuloCalc}>Salario mensual (RD$)</span>
                <input className={campoCalc} inputMode="numeric" autoComplete="off" value={salTxt} onChange={(e) => setSalTxt(miles(e.target.value))} placeholder="Ej. 30,000" />
              </label>
              <p className="mt-1.5 text-xs text-muted-foreground">El salario fijo de tu contrato, sin horas extra.</p>
              <label className="mt-5 flex items-start gap-2.5 text-sm"><input type="checkbox" checked={empece} onChange={(e) => setEmpece(e.target.checked)} className="mt-0.5 size-4" /> Empecé a trabajar ahí en {ANIO}</label>
              {empece && <label className="mt-2 block"><span className={rotuloCalc}>¿Qué día empezaste?</span><input type="date" min={`${ANIO}-01-01`} max={`${ANIO}-12-31`} className={campoCalc} value={inicio} onChange={(e) => setInicio(e.target.value)} /></label>}
              <label className="mt-4 flex items-start gap-2.5 text-sm"><input type="checkbox" checked={sali} onChange={(e) => setSali(e.target.checked)} className="mt-0.5 size-4" /> Ya no trabajo ahí (renuncié o me despidieron)</label>
              {sali && <label className="mt-2 block"><span className={rotuloCalc}>¿Cuál fue tu último día?</span><input type="date" min={`${ANIO}-01-01`} max={`${ANIO}-12-31`} className={campoCalc} value={salida} onChange={(e) => setSalida(e.target.value)} /></label>}
            </>
          ) : (
            <>
              <p className="mt-5 text-sm text-muted-foreground">Escribe lo que ganaste de salario ordinario cada mes. Deja en blanco los meses que no trabajaste.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {MESES.map((m, i) => (
                  <label key={m} className="block"><span className="text-xs font-semibold text-muted-foreground">{m}</span>
                    <input className="mt-0.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm tabular-nums outline-none focus:border-primary" inputMode="numeric" autoComplete="off" value={porMes[i]} onChange={(e) => setPorMes((p) => p.map((x, j) => (j === i ? miles(e.target.value) : x)))} placeholder="0" aria-label={`Salario de ${m}`} />
                  </label>
                ))}
              </div>
              <button type="button" onClick={llenarTodos} className="mt-3 text-sm font-semibold text-primary hover:underline">Copiar el primer monto en todos los meses</button>
            </>
          )}
        </section>

        <section className="lg:col-span-3" aria-live="polite" aria-label="Resultado">
          {!r.hay ? (
            <div className="grid h-full min-h-56 place-items-center rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
              <div><Gift className="mx-auto size-8 text-[#c27803]" aria-hidden="true" /><p className="mt-3">Escribe tu salario para ver cuánto te toca.</p></div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-surface p-6">
              <p className="text-sm font-semibold text-muted-foreground">Te tocan de regalía pascual</p>
              <p className="mt-1 text-5xl font-extrabold tabular-nums text-success">{pesos(r.regalia)}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success"><ShieldCheck className="size-4" aria-hidden="true" /> Completo: sin AFP, SFS ni ISR</p>
              <table className="mt-5 w-full text-sm">
                <tbody className="divide-y divide-border">
                  <tr><td className="py-2.5 pr-3">{modo === "igual" ? `Salario ordinario de ${mesesTxt} ${r.meses === 1 ? "mes" : "meses"} trabajados en ${ANIO}` : `Suma de tus salarios de ${ANIO} (${r.meses} ${r.meses === 1 ? "mes" : "meses"})`}</td><td className="py-2.5 text-right tabular-nums">{pesos(r.total)}</td></tr>
                  <tr><td className="py-2.5 pr-3">Dividido entre 12</td><td className="py-2.5 text-right tabular-nums">÷ 12</td></tr>
                  <tr className="font-extrabold"><td className="py-2.5 pr-3">Tu regalía pascual</td><td className="py-2.5 text-right tabular-nums">{pesos(r.regalia)}</td></tr>
                </tbody>
              </table>
              {modo === "igual" && r.meses < 12 && <p className="mt-3 rounded-xl bg-muted p-3 text-sm">Como no trabajaste todo el año, te toca la parte proporcional. {sali ? "Aunque ya no trabajes ahí, te la deben pagar." : ""}</p>}
              <div className="mt-5"><CompartirResultado texto={resumen} ruta="/herramientas/regalia-pascual" query={modo === "igual" && num(salTxt) ? `?salario=${Math.round(num(salTxt))}` : ""} /></div>
            </div>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5" aria-labelledby="preguntas-regalia">
        <h2 id="preguntas-regalia" className="text-base font-extrabold">Lo que dice la ley</h2>
        <div className="mt-2 divide-y divide-border">
          {PREGUNTAS.map(([q, a]) => (
            <details key={q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">{q}<ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-3 text-sm">¿Quieres saber cuánto te llega cada mes? Usa la <Link to="/herramientas/salario-neto" className="font-semibold text-primary underline">calculadora de salario neto</Link>. ¿Te fuiste del trabajo? Calcula tu <Link to="/herramientas/liquidacion" className="font-semibold text-primary underline">liquidación</Link>.</p>
      </section>
      <PieCalculadora nota="Cálculo según los artículos 219 a 222 del Código de Trabajo: salario ordinario del año ÷ 12, con tope de cinco salarios mínimos. Comisiones e ingresos variables pueden contar o no según cómo los pague tu empresa." />
    </CalculadoraPagina>
  );
}

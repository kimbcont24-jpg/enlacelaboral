import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bus, Clock, HeartHandshake, Scale, Trophy, Wallet } from "lucide-react";

import { CalculadoraPagina, CompartirResultado, PieCalculadora, campoCalc, rotuloCalc } from "@/components/site/CalculadoraBase";
import { pesos, salarioNeto } from "@/lib/calculos";

export const Route = createFileRoute("/herramientas/comparar-ofertas")({
  head: () => ({
    meta: [
      { title: "Comparador de ofertas de trabajo RD 2026: ¿cuál te conviene? | Enlace Laboral" },
      { name: "description", content: "Compara dos ofertas de empleo (o tu trabajo actual contra una nueva): salario neto con AFP, SFS e ISR, pasaje, tiempo de traslado, beneficios y bienestar. Gratis y sin registro." },
      { property: "og:title", content: "¿Qué oferta de trabajo te conviene más? Compáralas en 1 minuto" },
      { property: "og:description", content: "Salario neto, pasaje, tiempo en el tapón, beneficios y bienestar, lado a lado." },
    ],
    links: [{ rel: "canonical", href: "https://enlacelaboralrd.com/herramientas/comparar-ofertas" }],
  }),
  component: CompararOfertas,
});

const SEMANAS_MES = 4.33;
const SEGURO_ESTIMADO = 1500;

const num = (t: string) => Number(t.replace(/[^\d.]/g, "")) || 0;
const miles = (t: string) => { const n = num(t); return n ? n.toLocaleString("es-DO") : ""; };

type Oferta = {
  nombre: string; bruto: string; dias: number; horas: string; pasaje: string; minutos: string;
  almuerzo: boolean; seguro: boolean; bono: string; otros: string; bienestar: number[];
};

const FACTORES = [
  { id: "crecimiento", nombre: "Crecimiento", ayuda: "Puedes aprender y subir de puesto" },
  { id: "estabilidad", nombre: "Estabilidad", ayuda: "Contrato fijo, empresa sólida" },
  { id: "horario", nombre: "Horario y vida personal", ayuda: "Te deja tiempo para tu familia y para ti" },
  { id: "ambiente", nombre: "Ambiente y liderazgo", ayuda: "Buen trato, jefatura que apoya" },
  { id: "sentido", nombre: "Te gusta lo que harás", ayuda: "Encaja con lo que quieres para ti" },
] as const;

const nueva = (nombre: string): Oferta => ({ nombre, bruto: "", dias: 5, horas: "44", pasaje: "", minutos: "", almuerzo: false, seguro: false, bono: "", otros: "", bienestar: FACTORES.map(() => 3) });

function calcular(o: Oferta, costoAlmuerzo: number) {
  const bruto = num(o.bruto);
  const n = salarioNeto(bruto);
  const diasMes = o.dias * SEMANAS_MES;
  const transporte = num(o.pasaje) * diasMes;
  const almuerzo = o.almuerzo ? costoAlmuerzo * diasMes : 0;
  const seguro = o.seguro ? SEGURO_ESTIMADO : 0;
  const bono = num(o.bono) / 12;
  const otros = num(o.otros);
  const regalia = bruto / 12;
  const valor = n.neto + regalia + bono + otros + almuerzo + seguro - transporte;
  const horasTrabajo = (num(o.horas) || 44) * SEMANAS_MES;
  const horasTraslado = (num(o.minutos) * diasMes) / 60;
  const horas = horasTrabajo + horasTraslado;
  const porHora = horas ? valor / horas : 0;
  const bienestar = o.bienestar.reduce((s, v) => s + v, 0);
  return { bruto, neto: n.neto, regalia, bono, otros, almuerzo, seguro, transporte, valor, horasTraslado, horas, porHora, bienestar, hay: bruto > 0 };
}

function CompararOfertas() {
  const [ofertas, setOfertas] = useState<[Oferta, Oferta]>([nueva("Mi trabajo actual"), nueva("La oferta nueva")]);
  const [almuerzoTxt, setAlmuerzoTxt] = useState("250");
  const costoAlmuerzo = num(almuerzoTxt);
  const [a, b] = useMemo(() => ofertas.map((o) => calcular(o, costoAlmuerzo)), [ofertas, costoAlmuerzo]);
  const listo = a.hay && b.hay;

  const cambiar = (i: 0 | 1, p: Partial<Oferta>) => setOfertas((prev) => {
    const copia = [...prev] as [Oferta, Oferta];
    copia[i] = { ...copia[i], ...p };
    return copia;
  });

  const nA = ofertas[0].nombre || "Opción A";
  const nB = ofertas[1].nombre || "Opción B";
  const difMes = a.valor - b.valor;
  const ganaDinero = Math.abs(difMes) < 500 ? null : difMes > 0 ? 0 : 1;
  const ganaHora = Math.abs(a.porHora - b.porHora) < 5 ? null : a.porHora > b.porHora ? 0 : 1;
  const ganaBienestar = a.bienestar === b.bienestar ? null : a.bienestar > b.bienestar ? 0 : 1;
  const nombre = (i: 0 | 1 | null) => (i === 0 ? nA : i === 1 ? nB : "");

  let veredicto = "";
  if (listo) {
    if (ganaDinero === null) veredicto = `En dinero real quedan casi iguales. Decide por el bienestar${ganaBienestar !== null ? `: ahí gana «${nombre(ganaBienestar)}»` : " y por lo que quieres para tu futuro"}.`;
    else if (ganaBienestar === null || ganaBienestar === ganaDinero) veredicto = `«${nombre(ganaDinero)}» te deja ${pesos(Math.abs(difMes))} más al mes${ganaBienestar === ganaDinero ? " y además la valoras mejor en bienestar" : ""}. Es la opción más fuerte.`;
    else veredicto = `«${nombre(ganaDinero)}» te deja ${pesos(Math.abs(difMes))} más al mes (${pesos(Math.abs(difMes) * 12)} al año), pero valoras mejor el bienestar de «${nombre(ganaBienestar)}». Pregúntate: ¿esa diferencia de dinero compensa lo que pierdes en calidad de vida?`;
  }

  const resumen = listo ? `Comparé dos ofertas: «${nA}» me deja ${pesos(a.valor)} reales al mes y «${nB}» ${pesos(b.valor)}, contando descuentos, pasaje y beneficios.` : "";

  return (
    <CalculadoraPagina titulo="¿Qué oferta de trabajo" resaltado="te conviene más?" intro="El salario no lo es todo: el pasaje, las horas en el tapón, el almuerzo, el seguro y cómo te vas a sentir también cuentan. Compara dos opciones lado a lado y decide con datos.">
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-muted p-4 text-sm">
        <Scale className="size-5 text-primary" aria-hidden="true" />
        <span>Puedes comparar tu <strong>trabajo actual</strong> contra una <strong>oferta nueva</strong>, o dos ofertas entre sí. Cambia los nombres a tu gusto.</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {([0, 1] as const).map((i) => <Formulario key={i} i={i} o={ofertas[i]} cambiar={cambiar} />)}
      </div>

      <label className="mt-4 flex max-w-md flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">Lo que te cuesta un almuerzo fuera (RD$):</span>
        <input className="w-28 rounded-lg border border-input bg-background px-3 py-1.5" inputMode="numeric" value={almuerzoTxt} onChange={(e) => setAlmuerzoTxt(miles(e.target.value))} />
      </label>

      <section aria-live="polite" aria-label="Resultado" className="mt-8">
        {!listo ? (
          <div className="grid place-items-center rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Escribe el salario bruto de las dos opciones para ver la comparación.</div>
        ) : (
          <div className="rounded-3xl border border-border bg-surface p-6 md:p-8">
            <div className="flex items-start gap-3 rounded-2xl bg-[linear-gradient(135deg,#0a2f5c,#1d6ff2)] p-5 text-white">
              <Trophy className="mt-0.5 size-6 shrink-0 text-[#ffd84d]" aria-hidden="true" />
              <p className="text-lg font-bold leading-snug">{veredicto}</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Marcador icono={Wallet} titulo="Dinero real al mes" a={pesos(a.valor)} b={pesos(b.valor)} gana={ganaDinero} nA={nA} nB={nB} />
              <Marcador icono={Clock} titulo="Lo que vale tu hora real" a={pesos(a.porHora)} b={pesos(b.porHora)} gana={ganaHora} nA={nA} nB={nB} />
              <Marcador icono={HeartHandshake} titulo="Bienestar (de 25)" a={String(a.bienestar)} b={String(b.bienestar)} gana={ganaBienestar} nA={nA} nB={nB} />
            </div>

            <div className="mt-6">
              <table className="w-full text-[13px] sm:text-sm">
                <thead><tr className="text-left text-muted-foreground"><th className="py-2 pr-3 font-semibold">Al mes</th><th className="py-2 text-right font-semibold">{nA}</th><th className="py-2 text-right font-semibold">{nB}</th></tr></thead>
                <tbody className="divide-y divide-border">
                  <Fila n="Salario bruto" a={a.bruto} b={b.bruto} />
                  <Fila n="Salario neto (sin AFP, SFS e ISR)" a={a.neto} b={b.neto} />
                  <Fila n="Regalía pascual (repartida en 12)" a={a.regalia} b={b.regalia} />
                  <Fila n="Bono o incentivo (repartido en 12)" a={a.bono} b={b.bono} />
                  <Fila n="Otros pagos fijos (combustible, dieta…)" a={a.otros} b={b.otros} />
                  <Fila n="Almuerzo que te ahorras" a={a.almuerzo} b={b.almuerzo} />
                  <Fila n={`Seguro complementario (valor estimado ${pesos(SEGURO_ESTIMADO)})`} a={a.seguro} b={b.seguro} />
                  <Fila n="Pasaje o gasolina" a={-a.transporte} b={-b.transporte} />
                  <Fila n="Dinero real al mes" a={a.valor} b={b.valor} fuerte />
                  <tr><td className="py-2.5 pr-3">Horas en traslado al mes</td><td className="py-2.5 text-right tabular-nums">{Math.round(a.horasTraslado)} h</td><td className="py-2.5 text-right tabular-nums">{Math.round(b.horasTraslado)} h</td></tr>
                </tbody>
              </table>
            </div>

            {Math.abs(a.horasTraslado - b.horasTraslado) >= 8 && (
              <p className="mt-4 flex gap-2 rounded-2xl bg-muted p-4 text-sm"><Bus className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>«{a.horasTraslado > b.horasTraslado ? nA : nB}» te pide {Math.round(Math.abs(a.horasTraslado - b.horasTraslado))} horas más al mes en el camino. Son unos {Math.round(Math.abs(a.horasTraslado - b.horasTraslado) / 8)} días de trabajo que no te pagan, y ese cansancio también pesa.</span>
              </p>
            )}

            <div className="mt-6"><CompartirResultado texto={resumen} ruta="/herramientas/comparar-ofertas" query="" /></div>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5 text-sm" aria-labelledby="como-ofertas">
        <h2 id="como-ofertas" className="text-base font-extrabold">Cómo se calcula</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>El neto descuenta AFP, SFS e ISR con las cifras de 2026, igual que nuestra <Link to="/herramientas/salario-neto" className="font-semibold text-primary underline">calculadora de salario neto</Link>.</li>
          <li>La regalía pascual (un salario al año) y el bono anual se reparten entre 12 para compararlos mes a mes.</li>
          <li>Pasaje y almuerzo se cuentan por día presencial ({SEMANAS_MES} semanas al mes). Los días remotos no gastan pasaje.</li>
          <li>«Tu hora real» divide el dinero real del mes entre las horas de trabajo más las horas de traslado: así se ve cuánto vale de verdad tu tiempo.</li>
          <li>El bienestar es tu propia valoración, de 1 a 5, en cinco aspectos. Nadie conoce mejor que tú lo que necesitas.</li>
        </ol>
      </section>
      <PieCalculadora nota="El valor del seguro complementario es un estimado; si sabes cuánto vale el tuyo, súmalo en «Otros pagos fijos» y deja la casilla sin marcar." />
    </CalculadoraPagina>
  );
}

function Formulario({ i, o, cambiar }: { i: 0 | 1; o: Oferta; cambiar: (i: 0 | 1, p: Partial<Oferta>) => void }) {
  const color = i === 0 ? "border-t-[#1d6ff2]" : "border-t-[#0f7a43]";
  return (
    <section aria-label={o.nombre || `Opción ${i + 1}`} className={`rounded-3xl border border-t-4 border-border bg-surface p-6 ${color}`}>
      <label className="block"><span className={rotuloCalc}>Nombre</span>
        <input className={`${campoCalc} font-bold`} value={o.nombre} onChange={(e) => cambiar(i, { nombre: e.target.value.slice(0, 40) })} />
      </label>
      <label className="mt-4 block"><span className={rotuloCalc}>Salario bruto mensual (RD$)</span>
        <input className={campoCalc} inputMode="numeric" autoComplete="off" value={o.bruto} onChange={(e) => cambiar(i, { bruto: miles(e.target.value) })} placeholder="Ej. 45,000" />
      </label>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block"><span className={rotuloCalc}>Días que vas a la oficina por semana</span>
          <select className={campoCalc} value={o.dias} onChange={(e) => cambiar(i, { dias: Number(e.target.value) })}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{d === 0 ? "0 (remoto)" : d}</option>)}
          </select>
        </label>
        <label className="block"><span className={rotuloCalc}>Horas de trabajo por semana</span>
          <input className={campoCalc} inputMode="numeric" value={o.horas} onChange={(e) => cambiar(i, { horas: e.target.value.replace(/\D/g, "").slice(0, 2) })} />
        </label>
        <label className="block"><span className={rotuloCalc}>Pasaje o gasolina por día, ida y vuelta (RD$)</span>
          <input className={campoCalc} inputMode="numeric" value={o.pasaje} onChange={(e) => cambiar(i, { pasaje: miles(e.target.value) })} placeholder="Ej. 200" />
        </label>
        <label className="block"><span className={rotuloCalc}>Minutos de camino por día, ida y vuelta</span>
          <input className={campoCalc} inputMode="numeric" value={o.minutos} onChange={(e) => cambiar(i, { minutos: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="Ej. 90" />
        </label>
        <label className="block"><span className={rotuloCalc}>Bono o incentivo al año (RD$)</span>
          <input className={campoCalc} inputMode="numeric" value={o.bono} onChange={(e) => cambiar(i, { bono: miles(e.target.value) })} placeholder="Opcional" />
        </label>
        <label className="block"><span className={rotuloCalc}>Otros pagos fijos al mes (RD$)</span>
          <input className={campoCalc} inputMode="numeric" value={o.otros} onChange={(e) => cambiar(i, { otros: miles(e.target.value) })} placeholder="Combustible, dieta…" />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <label className="inline-flex items-center gap-2"><input type="checkbox" className="size-4 accent-[#1d6ff2]" checked={o.almuerzo} onChange={(e) => cambiar(i, { almuerzo: e.target.checked })} /> Te dan almuerzo</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" className="size-4 accent-[#1d6ff2]" checked={o.seguro} onChange={(e) => cambiar(i, { seguro: e.target.checked })} /> Seguro complementario pagado</label>
      </div>

      <fieldset className="mt-5 border-t border-border pt-4">
        <legend className="pt-3 text-sm font-extrabold">¿Cómo te sentirías ahí? <span className="font-normal text-muted-foreground">(1 = mal, 5 = excelente)</span></legend>
        <div className="mt-2 space-y-2.5">
          {FACTORES.map((f, k) => (
            <div key={f.id} className="flex items-center justify-between gap-3">
              <span className="text-sm"><span className="font-semibold">{f.nombre}</span><span className="block text-xs text-muted-foreground">{f.ayuda}</span></span>
              <div role="radiogroup" aria-label={f.nombre} className="flex shrink-0 gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} type="button" role="radio" aria-checked={o.bienestar[k] === v} aria-label={`${v} de 5`}
                    onClick={() => cambiar(i, { bienestar: o.bienestar.map((x, j) => (j === k ? v : x)) })}
                    className={`size-7 rounded-full text-xs font-bold transition ${o.bienestar[k] >= v ? (i === 0 ? "bg-[#1d6ff2] text-white" : "bg-[#0f7a43] text-white") : "bg-muted text-muted-foreground"}`}>{v}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

function Marcador({ icono: Icono, titulo, a, b, gana, nA, nB }: { icono: typeof Wallet; titulo: string; a: string; b: string; gana: 0 | 1 | null; nA: string; nB: string }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Icono className="size-4 text-primary" aria-hidden="true" /> {titulo}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[[nA, a, 0], [nB, b, 1]].map(([n, v, k]) => (
          <div key={String(k)} className={`rounded-xl p-2.5 ${gana === k ? (k === 0 ? "bg-[#1d6ff2]/10 ring-2 ring-[#1d6ff2]" : "bg-[#0f7a43]/10 ring-2 ring-[#0f7a43]") : "bg-muted"}`}>
            <p className="truncate text-[11px] font-semibold text-muted-foreground">{n}</p>
            <p className="text-lg font-extrabold tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold">{gana === null ? "Empate" : `Gana: ${gana === 0 ? nA : nB}`}</p>
    </div>
  );
}

function Fila({ n, a, b, fuerte }: { n: string; a: number; b: number; fuerte?: boolean }) {
  if (!fuerte && !a && !b) return null;
  const f = (v: number) => (v < 0 ? `− ${pesos(-v)}` : pesos(v));
  return (
    <tr className={fuerte ? "font-extrabold" : ""}>
      <td className="py-2.5 pr-3">{n}</td>
      <td className="py-2.5 pl-2 text-right tabular-nums">{f(a)}</td>
      <td className="py-2.5 pl-2 text-right tabular-nums">{f(b)}</td>
    </tr>
  );
}

/**
 * Calculadoras laborales de República Dominicana.
 * Cifras vigentes en 2026. Si cambian las leyes, se actualizan SOLO las constantes de este archivo.
 * Fuentes: Código de Trabajo (Ley 16-92, arts. 76, 80, 86, 177, 180, 219), Reglamento 258-93 (divisor 23.83),
 * TSS (topes vigentes desde el 1 de febrero de 2026), DGII (escala del ISR de personas físicas).
 */
export const VIGENCIA = "2026";

export const DIVISOR_DIA = 23.83;

export const TSS = {
  afp: 0.0287,
  sfs: 0.0304,
  topeAfp: 464_460,
  topeSfs: 232_230,
};

/** Escala anual del ISR 2026 (la reforma Ley 30-26 cambia la escala desde el 1 de enero de 2027). */
export const ISR_TRAMOS = [
  { hasta: 416_220, tasa: 0, fijo: 0, desde: 0 },
  { hasta: 624_329, tasa: 0.15, fijo: 0, desde: 416_220 },
  { hasta: 867_123, tasa: 0.2, fijo: 31_216, desde: 624_329 },
  { hasta: Infinity, tasa: 0.25, fijo: 79_776, desde: 867_123 },
] as const;

export const FUENTES = [
  { nombre: "Código de Trabajo (Ley 16-92) — Ministerio de Trabajo", url: "https://mt.gob.do/wp-content/uploads/2024/07/codigo_de_trabajo.pdf" },
  { nombre: "Calculadora oficial de prestaciones — Ministerio de Trabajo", url: "https://calculo.mt.gob.do/" },
  { nombre: "Topes de cotización 2026 — Tesorería de la Seguridad Social", url: "https://tss.gob.do/tss-informa-nuevos-topes-de-cotizacion-del-regimen-contributivo-del-sdss/" },
  { nombre: "Impuesto sobre la Renta — DGII", url: "https://dgii.gov.do/" },
];

export const redondear = (n: number) => Math.round(n * 100) / 100;
export const pesos = (n: number) => `RD$${Math.round(n).toLocaleString("es-DO")}`;

/* ---------------- Salario neto ---------------- */
export type Neto = { bruto: number; afp: number; sfs: number; baseIsr: number; isrAnual: number; isr: number; otros: number; neto: number; porcentaje: number; regalia: number; netoAnual: number; tramo: number };

export function isrAnual(base: number): { isr: number; tramo: number } {
  if (base <= 0) return { isr: 0, tramo: 0 };
  const i = ISR_TRAMOS.findIndex((t) => base <= t.hasta);
  const t = ISR_TRAMOS[i]!;
  return { isr: t.fijo + (base - t.desde) * t.tasa, tramo: i };
}

export function salarioNeto(bruto: number, otros = 0): Neto {
  const b = Math.max(0, bruto);
  const afp = Math.min(b, TSS.topeAfp) * TSS.afp;
  const sfs = Math.min(b, TSS.topeSfs) * TSS.sfs;
  const baseIsr = Math.max(0, b - afp - sfs);
  const { isr: anual, tramo } = isrAnual(baseIsr * 12);
  const isr = anual / 12;
  const o = Math.max(0, otros);
  const neto = b - afp - sfs - isr - o;
  const regalia = b; // 1/12 de 12 meses de salario ordinario; sin ISR ni TSS
  return { bruto: b, afp, sfs, baseIsr, isrAnual: anual, isr, otros: o, neto, porcentaje: b > 0 ? neto / b : 0, regalia, netoAnual: neto * 12 + regalia, tramo };
}

/** ¿Qué bruto necesito para que me lleguen X netos? (búsqueda por bisección) */
export function brutoParaNeto(netoDeseado: number, otros = 0): number {
  if (netoDeseado <= 0) return 0;
  let lo = netoDeseado, hi = netoDeseado * 2 + 1000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (salarioNeto(mid, otros).neto < netoDeseado) lo = mid; else hi = mid;
  }
  return Math.ceil(hi);
}

/* ---------------- Liquidación ---------------- */
export type Motivo = "desahucio" | "despido" | "dimision" | "renuncia" | "despido_justificado";
export const MOTIVOS: { id: Motivo; nombre: string; ayuda: string; prestaciones: boolean }[] = [
  { id: "desahucio", nombre: "Me despidieron sin darme una causa (desahucio)", ayuda: "La empresa termina el contrato sin explicar la causa.", prestaciones: true },
  { id: "despido", nombre: "Me despidieron y no lo pudieron probar (despido injustificado)", ayuda: "La empresa invoca una causa pero no la prueba ante el tribunal.", prestaciones: true },
  { id: "dimision", nombre: "Renuncié por culpa de la empresa (dimisión justificada)", ayuda: "Por faltas graves de la empresa, que hay que probar.", prestaciones: true },
  { id: "renuncia", nombre: "Renuncié sin causa", ayuda: "Te retiras por decisión propia. No hay cesantía ni preaviso a tu favor.", prestaciones: false },
  { id: "despido_justificado", nombre: "Me despidieron con causa justificada", ayuda: "Solo cobras lo ya ganado: vacaciones, regalía y salarios.", prestaciones: false },
];

export type Antiguedad = { anios: number; meses: number; dias: number; totalMeses: number };

const aISO = (s: string) => { const [y, m, d] = s.split("-").map(Number); return { y: y!, m: m!, d: d! }; };

/** Años, meses y días completos entre dos fechas (formato AAAA-MM-DD). La salida cuenta como día trabajado. */
export function antiguedad(ingreso: string, salida: string): Antiguedad | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ingreso) || !/^\d{4}-\d{2}-\d{2}$/.test(salida)) return null;
  const a = aISO(ingreso), b = aISO(salida);
  const ia = new Date(Date.UTC(a.y, a.m - 1, a.d)), fb = new Date(Date.UTC(b.y, b.m - 1, b.d));
  if (isNaN(+ia) || isNaN(+fb) || fb < ia) return null;
  let meses = (b.y - a.y) * 12 + (b.m - a.m);
  let dias = b.d - a.d + 1;
  if (dias < 0) { meses -= 1; dias += new Date(Date.UTC(b.y, b.m - 1, 0)).getUTCDate(); }
  return { anios: Math.floor(meses / 12), meses: meses % 12, dias: Math.max(0, dias), totalMeses: meses };
}

export function diasPreaviso(totalMeses: number): number {
  if (totalMeses < 3) return 0;
  if (totalMeses < 6) return 7;
  if (totalMeses < 12) return 14;
  return 28;
}

/** Días de cesantía (art. 80). Las fracciones de año superiores a 3 meses se pagan con las dos primeras reglas. */
export function diasCesantia(a: Antiguedad): { total: number; porAnios: number; porFraccion: number; tasa: number } {
  const tasa = a.anios >= 5 ? 23 : 21;
  if (a.anios === 0) {
    const d = a.totalMeses < 3 ? 0 : a.totalMeses < 6 ? 6 : 13;
    return { total: d, porAnios: 0, porFraccion: d, tasa: 0 };
  }
  const porAnios = a.anios * tasa;
  const porFraccion = a.meses < 3 ? 0 : a.meses < 6 ? 6 : 13;
  return { total: porAnios + porFraccion, porAnios, porFraccion, tasa };
}

/** Vacaciones proporcionales del período en curso (art. 180) — meses completos desde el último aniversario. */
export function diasVacacionesProporcionales(meses: number): number {
  if (meses < 5) return 0;
  return Math.min(12, meses + 1);
}

export type Entrada = { salarioMensual: number; ingreso: string; salida: string; motivo: Motivo; vacacionesAnterior: boolean };

export type Linea = { clave: string; nombre: string; detalle: string; monto: number };
export type Liquidacion = { a: Antiguedad; salarioDiario: number; lineas: Linea[]; total: number; prestaciones: boolean; avisos: string[] };

export function liquidar(e: Entrada): Liquidacion | null {
  const a = antiguedad(e.ingreso, e.salida);
  if (!a || !(e.salarioMensual > 0)) return null;
  const dia = e.salarioMensual / DIVISOR_DIA;
  const motivo = MOTIVOS.find((m) => m.id === e.motivo)!;
  const lineas: Linea[] = [];
  const avisos: string[] = [];

  if (motivo.prestaciones) {
    const dp = diasPreaviso(a.totalMeses);
    lineas.push({ clave: "preaviso", nombre: "Preaviso (art. 76)", detalle: dp ? `${dp} días de salario` : "No aplica: menos de 3 meses", monto: dp * dia });
    const c = diasCesantia(a);
    const partes = a.anios > 0 ? `${a.anios} año${a.anios > 1 ? "s" : ""} × ${c.tasa} días${c.porFraccion ? ` + ${c.porFraccion} días por los ${a.meses} meses extra` : ""}` : `${c.total} días por ${a.totalMeses} meses`;
    lineas.push({ clave: "cesantia", nombre: "Cesantía (art. 80)", detalle: c.total ? `${c.total} días de salario (${partes})` : "No aplica: menos de 3 meses", monto: c.total * dia });
  }

  // vacaciones
  let diasVac = 0;
  const partesVac: string[] = [];
  if (a.anios >= 1 && e.vacacionesAnterior) { const d = a.anios >= 5 ? 18 : 14; diasVac += d; partesVac.push(`${d} días del último año cumplido`); }
  const dp = diasVacacionesProporcionales(a.anios === 0 ? a.totalMeses : a.meses);
  if (dp) { diasVac += dp; partesVac.push(`${dp} días proporcionales (art. 180)`); }
  lineas.push({ clave: "vacaciones", nombre: "Vacaciones no disfrutadas", detalle: diasVac ? `${diasVac} días laborables: ${partesVac.join(" + ")}` : "Sin días pendientes con lo indicado", monto: diasVac * dia });

  // regalía pascual proporcional del año de salida
  const s = aISO(e.salida), i = aISO(e.ingreso);
  const inicioAnio = i.y === s.y ? new Date(Date.UTC(i.y, i.m - 1, i.d)) : new Date(Date.UTC(s.y, 0, 1));
  const fin = new Date(Date.UTC(s.y, s.m - 1, s.d));
  const diasAnio = Math.round((+fin - +inicioAnio) / 864e5) + 1;
  const mesesAnio = Math.min(12, diasAnio / 30.4375);
  lineas.push({ clave: "regalia", nombre: "Regalía pascual proporcional", detalle: `${(Math.round(mesesAnio * 10) / 10).toLocaleString("es-DO")} meses de ${s.y} ÷ 12 del salario`, monto: (e.salarioMensual * mesesAnio) / 12 });

  const total = lineas.reduce((t, l) => t + l.monto, 0);
  if (motivo.prestaciones) avisos.push("La empresa tiene 10 días para pagarte. Después, debe sumar un día de salario por cada día de retraso (art. 86).");
  if (e.motivo === "despido" || e.motivo === "dimision") avisos.push("Si un tribunal declara el despido o la dimisión como justificado o injustificado, pueden sumarse otros valores (art. 95). Aquí no se calculan.");
  if (e.motivo === "dimision") avisos.push("Para la dimisión debes comunicarla al Ministerio de Trabajo y a la empresa dentro de 48 horas.");
  if (e.motivo === "despido" || e.motivo === "desahucio") avisos.push("Las acciones por despido prescriben a los 2 meses. No esperes para reclamar.");
  avisos.push("Los salarios pendientes y comisiones no están incluidos. Súmalos aparte.");
  return { a, salarioDiario: dia, lineas, total, prestaciones: motivo.prestaciones, avisos };
}

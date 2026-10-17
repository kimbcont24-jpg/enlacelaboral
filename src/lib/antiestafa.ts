/** Señales de posible estafa o vacante dudosa. Son avisos para que lo revises tú; nada se descarta solo. */
const SENALES: [RegExp, string][] = [
  [/(pag(a|ar|o|ue)|deposit(a|ar|o|e)|invers|cuota|cobr(o|amos))[^.\n]{0,50}(inscrip|registro|material|uniforme|kit|capacitaci|curso|entrevista|tr[aá]mite|plataforma|afiliaci)/i, "Pide pagar para entrar o para capacitarse"],
  [/ingresos? ilimitados|hazte rico|libertad financiera|gana(r|s)? (hasta )?(rd\$|us\$|\$)?\s*\d{2,3}[.,]?\d{3}\s*(semanal|diario|al d[ií]a|por semana)/i, "Promete ganancias exageradas"],
  [/multinivel|network marketing|pir[aá]mide|negocio propio con inversi/i, "Parece multinivel o pirámide"],
  [/western union|moneygram|criptomoneda|bitcoin|usdt|giftcard|tarjetas? de regalo/i, "Habla de enviar dinero, cripto o tarjetas de regalo"],
  [/(env[ií]a|manda|facilita|proporciona)[^.\n]{0,30}(c[eé]dula|pasaporte|n[uú]mero de cuenta|tarjeta de cr[eé]dito|clave)/i, "Pide datos sensibles desde el primer contacto"],
];

export function senalesRiesgo(texto: string, tieneContacto: boolean): string[] {
  const out = SENALES.filter(([re]) => re.test(texto)).map(([, m]) => m);
  if (!tieneContacto) out.push("No trae forma de contacto ni de aplicar");
  return out;
}

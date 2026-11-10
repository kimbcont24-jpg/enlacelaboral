import { revisarDiscriminacion, type Hallazgo } from "@/lib/inclusion";

/**
 * Verificador de ofertas de empleo: busca señales típicas de estafa en el texto
 * de una vacante que alguien recibió. Todo corre en el navegador; no se guarda nada.
 */
export type Nivel = "alto" | "medio" | "bajo";
export type Senal = { id: string; nivel: Nivel; titulo: string; explica: string; frase: string };
export type Positiva = { id: string; titulo: string };
export type Analisis = { senales: Senal[]; positivas: Positiva[]; discrimina: Hallazgo[]; veredicto: "riesgo" | "cuidado" | "normal"; puntos: number };

type Regla = { id: string; nivel: Nivel; titulo: string; explica: string; re: RegExp };

const REGLAS: Regla[] = [
  { id: "pago", nivel: "alto", titulo: "Te pide pagar para entrar",
    explica: "Ninguna empresa seria cobra por la entrevista, el uniforme, el curso, el carnet ni la «inscripción». Es la señal número uno de estafa.",
    re: /(pag(a|ar|o|ue|as)|deposit(a|ar|o|e)|invers(i[oó]n|ión)|cuota|cobr(o|amos|a)|costo de|aporte de)[^.\n]{0,60}(inscrip|registro|material|uniforme|kit|capacitaci|curso|entrevista|tr[aá]mite|plataforma|afiliaci|carnet|seguro|activaci|reserva)/i },
  { id: "dinero", nivel: "alto", titulo: "Habla de enviar dinero, cripto o tarjetas de regalo",
    explica: "Pedir remesas, criptomonedas o tarjetas de regalo es una forma de cobrar sin dejar rastro.",
    re: /western union|moneygram|remesa|criptomoneda|bitcoin|\busdt\b|binance|gift ?card|tarjetas? de regalo|recarga de saldo/i },
  { id: "datos", nivel: "alto", titulo: "Pide datos sensibles antes de conocerte",
    explica: "Tu cédula, pasaporte, cuenta bancaria o claves solo se entregan cuando ya firmaste contrato, en persona, en la empresa.",
    re: /(env[ií]a(r|nos|me)?|manda(r|nos|me)?|facilita|proporciona|necesitamos|comparte)[^.\n]{0,40}(c[eé]dula|pasaporte|n[uú]mero de cuenta|cuenta bancaria|tarjeta de cr[eé]dito|tarjeta de d[eé]bito|clave|contrase[ñn]a|pin\b)/i },
  { id: "codigo", nivel: "alto", titulo: "Te pide un código que te llegó por mensaje",
    explica: "Si te piden el código de 6 dígitos que te llega por SMS o WhatsApp, quieren robarte la cuenta. Nunca lo compartas con nadie.",
    re: /(c[oó]digo|codigo)[^.\n]{0,40}(verificaci|whatsapp|sms|te lleg|que recibas|de 6|seis d[ií]gitos)/i },
  { id: "tareas", nivel: "alto", titulo: "Pago por dar «likes», reseñas o «tareas» en línea",
    explica: "Es una estafa muy común: al principio te pagan poquito y luego te piden «invertir» para seguir ganando. Pierdes el dinero.",
    re: /(dar|darle|dando|poner|poniendo)\s+(likes?|me gusta)|calific(ar|ando) (productos|hoteles|videos|apps)|reseñas pagadas|tareas (diarias|sencillas|en l[ií]nea|online)[^.\n]{0,40}(pag|gana|comisi)|ver videos (y|para) ganar/i },
  { id: "ganancias", nivel: "alto", titulo: "Promete ganancias exageradas o fáciles",
    explica: "«Gana RD$5,000 al día desde tu casa sin experiencia» no existe. Si suena demasiado bueno, desconfía.",
    re: /ingresos? ilimitados|hazte rico|libertad financiera|dinero f[aá]cil|sin esfuerzo|gana(r|s)? (hasta )?(rd\$|us\$|\$|usd)?\s*\d{1,3}([.,]\d{3})+\s*(semanal(es)?|diarios?|al d[ií]a|por d[ií]a|por semana|a la semana)|gana(r|s)? (hasta )?(rd\$|us\$|\$|usd)?\s*\d{3,}\s*(diarios?|al d[ií]a|por d[ií]a)/i },
  { id: "multinivel", nivel: "alto", titulo: "Parece multinivel o pirámide",
    explica: "Si para ganar tienes que comprar un kit o meter a otras personas, no es un empleo: es un negocio de riesgo.",
    re: /multinivel|network marketing|pir[aá]mide|negocio propio con inversi|recluta(r)? (a )?(otras )?personas para ganar|compra tu kit/i },
  { id: "extranjero", nivel: "alto", titulo: "Trabajo en el extranjero con visa «garantizada»",
    explica: "Las ofertas de empleo fuera del país que cobran por visa, pasaje o trámites son un fraude frecuente y pueden ser trata de personas. Confirma con el Ministerio de Trabajo o la embajada.",
    re: /(visa|pasaje|boleto|permiso de trabajo)[^.\n]{0,50}(garantizad|incluid|segur|aprobad|tramitamos)|(trabajo|empleo|trabajar) en (canad[aá]|espa[ñn]a|estados unidos|ee\.? ?uu|usa|europa|italia|alemania|chile|panam[aá])[^.\n]{0,60}(sin experiencia|garantiz|r[aá]pido|inmediato|pago de tr[aá]mite)/i },
  { id: "telegram", nivel: "medio", titulo: "Solo te contactan por Telegram o WhatsApp",
    explica: "Muchas estafas evitan dar correo, dirección o teléfono fijo de la empresa. Pide siempre el nombre de la empresa y búscala.",
    re: /telegram|t\.me\/|solo (por|v[ií]a) whatsapp|escr[ií]beme al (privado|dm|inbox)|m[aá]ndame un (dm|mensaje privado)/i },
  { id: "urgencia", nivel: "medio", titulo: "Te mete prisa",
    explica: "«Solo hoy», «últimos cupos», «responde ya»: la prisa es para que no averigües. Una empresa real te da tiempo.",
    re: /solo (por )?hoy|[uú]ltimos? cupos|cupos limitados|plazas limitadas|responde (ya|r[aá]pido|de inmediato)|no pierdas esta oportunidad|qu[eé]date con tu cupo|antes de que se llene/i },
  { id: "anonima", nivel: "medio", titulo: "No dice qué empresa es",
    explica: "«Importante empresa» o «empresa confidencial» puede ser normal en agencias, pero confirma el nombre antes de dar tus datos o ir a una entrevista.",
    re: /importante empresa|reconocida empresa|empresa (l[ií]der|confidencial|internacional) (busca|solicita|requiere)|empresa del sector/i },
  { id: "acortado", nivel: "medio", titulo: "Trae enlaces acortados o raros",
    explica: "Los enlaces tipo bit.ly esconden a dónde te llevan. Pueden ser páginas falsas que roban tus datos.",
    re: /bit\.ly|tinyurl|cutt\.ly|shorturl|is\.gd|rb\.gy|t\.co\/|linktr\.ee/i },
  { id: "entrevistaRara", nivel: "medio", titulo: "La «entrevista» es por chat o en un lugar extraño",
    explica: "Las entrevistas reales son en la empresa, por videollamada o por teléfono con alguien que se identifica. Nunca vayas sola/o a una casa o a un lugar apartado.",
    re: /entrevista (por|v[ií]a) (chat|telegram|whatsapp|mensajes?)|entrevista en (mi casa|una casa|un apartamento|el parque|una plaza)|te (busco|recojo) (para|y te llevo)/i },
  { id: "sinRequisitos", nivel: "bajo", titulo: "No pide nada y ofrece mucho",
    explica: "«No necesitas experiencia ni estudios» con un sueldo muy alto es raro. Pregunta exactamente qué harás y cómo te pagan.",
    re: /(sin|no (se )?(necesitas|requiere|requieres|piden)) (experiencia|estudios)[^.\n]{0,40}(ni|y sin) (estudios|experiencia)|solo necesitas (un celular|tu celular|internet|ganas)/i },
];

const CORREO_GRATIS = /[\w.+-]+@(gmail|hotmail|outlook|yahoo|live|icloud|aol|protonmail)\.[a-z.]+/i;
const CORREO = /[\w.+-]+@[\w-]+\.[\w.-]+/i;

function trozo(texto: string, re: RegExp): string {
  const m = texto.match(re);
  if (!m || m.index === undefined) return "";
  const ini = Math.max(0, m.index - 20);
  const fin = Math.min(texto.length, m.index + m[0].length + 20);
  return `${ini > 0 ? "…" : ""}${texto.slice(ini, fin).replace(/\s+/g, " ").trim()}${fin < texto.length ? "…" : ""}`;
}

/** Montos en pesos que aparecen en el texto (para detectar sueldos fuera de lo normal). */
function montos(texto: string): number[] {
  const out: number[] = [];
  for (const m of texto.matchAll(/(?:rd\$|\$|rd)\s?(\d{1,3}(?:[.,]\d{3})+|\d{4,7})/gi)) {
    const n = Number(m[1].replace(/[.,]/g, ""));
    if (n >= 1000) out.push(n);
  }
  return out;
}

export function analizarOferta(texto: string): Analisis {
  const t = texto.normalize("NFC");
  const senales: Senal[] = [];
  for (const r of REGLAS) if (r.re.test(t)) senales.push({ id: r.id, nivel: r.nivel, titulo: r.titulo, explica: r.explica, frase: trozo(t, r.re) });

  const correoGratis = t.match(CORREO_GRATIS);
  if (correoGratis) senales.push({ id: "correo", nivel: "bajo", titulo: "El correo para aplicar es personal (Gmail, Hotmail…)",
    explica: "Es común en negocios pequeños de RD y no es estafa por sí solo. Pero si dice ser una empresa grande, confirma en su página oficial.", frase: correoGratis[0] });

  const sueldos = montos(t);
  const sinExp = /sin experiencia|no (se )?requiere experiencia|no necesitas experiencia/i.test(t);
  if (sinExp && sueldos.some((n) => n >= 80000 && n < 5_000_000)) senales.push({ id: "sueldoAlto", nivel: "medio", titulo: "Sueldo muy alto para un puesto sin experiencia",
    explica: "Un puesto de entrada suele pagar cerca del salario mínimo de su sector. Un sueldo muy por encima, sin pedir nada, es sospechoso.", frase: `RD$${Math.max(...sueldos).toLocaleString("es-DO")}` });

  const positivas: Positiva[] = [];
  const correo = t.match(CORREO);
  if (correo && !correoGratis) positivas.push({ id: "correoEmpresa", titulo: `Trae un correo de empresa (${correo[0].split("@")[1]})` });
  if (sueldos.length || /salario|sueldo|pago mensual/i.test(t)) positivas.push({ id: "salario", titulo: "Dice el salario o habla de él" });
  if (/requisitos|requerimos|perfil|funciones|responsabilidades/i.test(t)) positivas.push({ id: "requisitos", titulo: "Explica requisitos o funciones" });
  if (/horario|lunes a (viernes|s[aá]bado)|turno/i.test(t)) positivas.push({ id: "horario", titulo: "Indica el horario" });
  if (/(av\.|avenida|calle|plaza|edificio|km\s?\d|zona franca|sector)\s/i.test(t)) positivas.push({ id: "direccion", titulo: "Menciona una dirección o lugar de trabajo" });

  const discrimina = revisarDiscriminacion(t);
  const peso = { alto: 3, medio: 2, bajo: 1 } as const;
  const puntos = senales.reduce((s, x) => s + peso[x.nivel], 0);
  const altos = senales.filter((s) => s.nivel === "alto").length;
  const veredicto = altos > 0 || puntos >= 5 ? "riesgo" : puntos >= 2 ? "cuidado" : "normal";
  senales.sort((a, b) => peso[b.nivel] - peso[a.nivel]);
  return { senales, positivas, discrimina, veredicto, puntos };
}

export const EJEMPLOS = {
  estafa: "🔥URGENTE🔥 Importante empresa busca personal para trabajar desde casa. Gana RD$3,500 diarios solo dando likes a videos y calificando productos. No necesitas experiencia ni estudios, solo tu celular. Cupos limitados, responde ya! Para reservar tu cupo debes pagar RD$1,500 de inscripción. Escríbeme por Telegram: t.me/empleosrd_ya",
  normal: "Distribuidora del Caribe, SRL busca Auxiliar de Almacén para su sede en la Av. Charles de Gaulle, Santo Domingo Este. Requisitos: bachiller, manejo básico de inventario. Horario: lunes a viernes de 8:00 a. m. a 5:00 p. m. y sábados medio día. Salario: RD$24,000 más beneficios de ley. Enviar CV a reclutamiento@distcaribe.com.do",
} as const;

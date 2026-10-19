export type Borrador = {
  redes?: boolean;
  imagen?: string;
  titulo: string;
  empresa: string;
  provincia: string;
  modalidad: string;
  tipo: string;
  experiencia: string;
  area: string;
  salarioMin: string;
  salarioMax: string;
  descripcion: string;
  requisitos: string;
  aplicar: string;
  fuente: string;
  fuenteUrl: string;
};

export const borradorVacio: Borrador = {
  titulo: "",
  empresa: "",
  provincia: "Distrito Nacional",
  modalidad: "Presencial",
  tipo: "Tiempo completo",
  experiencia: "Sin experiencia",
  area: "Administración",
  salarioMin: "",
  salarioMax: "",
  descripcion: "",
  requisitos: "",
  aplicar: "",
  fuente: "",
  fuenteUrl: "",
};

/** Lo que el lector entiende de un anuncio, con aviso de qué tan seguro está de cada dato. */
export type Lectura = {
  b: Borrador;
  /** Campos que el lector adivinó o dejó por defecto: conviene mirarlos en la imagen. */
  dudas: (keyof Borrador)[];
  /** Mensajes para quien revisa. */
  avisos: string[];
  /** Si el anuncio trae varios puestos, un borrador por cada uno. */
  varias: Borrador[];
};

const EMOJI = /[\p{Extended_Pictographic}️‍⃣]/gu;
const VINETA = /^([-•*✓✔▪●◦➢→>»►★☆]|\d+[.)-])\s*/;
const RUIDO = /s[ií]gue(nos)?\b|comp[aá]rte(lo)?\b|comparte con|dale (like|me gusta)|link en (la )?bio|etiqueta a|menciona a|m[aá]s vacantes en|visita nuestr|dale follow|activa las notificaciones|^@\w+$|^(asunto|subject|de|from|para|to|fecha|date|cc|enviado|sent|reenviado)\s*:|mensaje reenviado|forwarded message|^(reenviado|forwarded)\b|^\W*(ver m[aá]s|leer m[aá]s|see more)\W*$|^\d+\s*(me gusta|likes?|comentarios?)\b/i;

/** Frases de portada que no son el puesto. */
const PORTADA = /^(?:(?:nueva[s]?|importante|urgente|atenci[oó]n|aviso|oportunidad(?:es)?(?: laboral(?:es)?| de empleo)?|oferta(?:s)? (?:de empleo|laboral(?:es)?)|vacante(?:s)?(?: disponible(?:s)?| abiertas?)?|empleo(?:s)?(?: disponible(?:s)?)?|estamos (?:contratando|reclutando)|contratando|reclutando|se (?:busca|solicita|necesita|requiere)(?: personal)?|buscamos(?: personal)?|necesitamos(?: personal)?|solicitamos(?: personal)?|[uú]nete(?: a nuestro equipo)?|[uú]nete|forma parte de nuestro equipo|hiring|we are hiring|job opening|trabaja con nosotros|[¡!]+|y|de|en|la|el|nuestro|equipo|ya|hoy|abierta|abiertas|disponible|disponibles|laboral|laborales|personal|nueva|para)[\s!¡:.,\-–—|]*)+$/i;

const MINUS = new Set(["de", "del", "la", "las", "el", "los", "en", "y", "e", "o", "u", "a", "con", "para", "por", "al", "un", "una", "sin", "su"]);
const SIGLAS = new Set(["rrhh", "it", "ti", "srl", "sa", "ceo", "cfo", "hr", "ux", "ui", "qa", "erp", "crm", "sap", "pos", "rd", "bpo", "tss", "cv", "usa", "eeuu", "ee.uu."]);

/** «CAJERO(A)» o «cajero» → «Cajero(a)». Si ya viene bien escrito, no lo toca. */
export function aTitulo(s: string): string {
  const t = s.trim();
  if (!t) return t;
  if (t !== t.toUpperCase() && t !== t.toLowerCase()) return t;
  let primero = true;
  return t
    .toLowerCase()
    .split(/(\s+|-|\/)/)
    .map((w) => {
      if (!w || /^(\s+|-|\/)$/.test(w)) return w;
      const limpia = w.replace(/[().,:]/g, "");
      if (SIGLAS.has(limpia)) { primero = false; return w.toUpperCase(); }
      if (!primero && MINUS.has(limpia)) return w;
      primero = false;
      return w.replace(/^([("]*)(\p{L})/u, (_m, a: string, l: string) => a + l.toUpperCase());
    })
    .join("");
}

type Sec = "req" | "fun" | "ben" | "hor" | "apl" | "otro";
const SECCIONES: [Sec, RegExp][] = [
  ["req", /^(requisitos|requerimientos|requisitos del puesto|perfil(?: del candidato)?|qu[eé] buscamos|necesitamos|debes (?:tener|cumplir)|indispensable|se requiere|competencias|condiciones)\b/i],
  ["fun", /^(funciones|responsabilidades|tareas|actividades|qu[eé] har[aá]s|descripci[oó]n del puesto|descripci[oó]n|sobre el puesto|principales funciones)\b/i],
  ["ben", /^(beneficios|ofrecemos|te ofrecemos|qu[eé] ofrecemos|ventajas|incluye|prestaciones|compensaci[oó]n)\b/i],
  ["hor", /^(horario|jornada|turno)\b/i],
  ["apl", /^(interesados|c[oó]mo aplicar|enviar|env[ií]a|aplica|aplicar|contacto|post[uú]late|postularse|m[aá]s informaci[oó]n|informaci[oó]n|presentarse|acudir|llamar|escribir|escr[ií]benos|cont[aá]ctanos)\b/i],
  ["otro", /^(salario|sueldo|remuneraci[oó]n|ubicaci[oó]n|lugar|zona|direcci[oó]n|empresa|compa[ñn][ií]a|puesto|cargo|vacante|posici[oó]n|plaza|modalidad|tipo de (?:contrato|empleo)|contrato|experiencia|nivel|fecha)\b/i],
];

const aNumero = (s: string) => {
  const limpio = s.trim().replace(/[.,]\d{1,2}$/, "").replace(/[^\d]/g, "");
  const n = Number(limpio);
  return Number.isFinite(n) && n > 0 ? String(n) : "";
};

/** Convierte «22,000», «22.000», «22 mil», «28K», «RD$ 22,000.00» en 22000. */
function valor(tok: string): number {
  const t = tok.trim().toLowerCase();
  const k = t.match(/^(\d{1,3}(?:[.,]\d)?)\s?(k|mil)$/);
  if (k) return Math.round(parseFloat((k[1] ?? "0").replace(",", ".")) * 1000);
  const n = Number(aNumero(t));
  return n;
}

const lugares: [RegExp, string][] = [
  [/punta cana|b[aá]varo|hig[uü]ey|la altagracia|cap cana|uvero alto|verón|veron/i, "La Altagracia (Punta Cana)"],
  [/distrito nacional|piantini|naco\b|gazcue|gasc[uú]e|bella vista|evaristo morales|serrall[eé]s|zona colonial|mirador (sur|norte)|los prados|ensanche (naco|ozama|quisqueya|la fe|julieta|paraiso|paraíso)|la esperilla|cristo rey|villa mella|\bD\.?N\.?\b/i, "Distrito Nacional"],
  [/santo domingo (este|norte|oeste)|\bSDE\b|\bSDN\b|\bSDO\b|boca chica|los alcarrizos|pedro brand|guerra\b|ciudad juan bosch|los mina|invivienda|autopista las am[eé]ricas|herrera|villa mella/i, "Santo Domingo"],
  [/santiago/i, "Santiago"],
  [/la romana/i, "La Romana"],
  [/puerto plata|sos[uú]a|cabarete|imbert|luper[oó]n/i, "Puerto Plata"],
  [/san crist[oó]bal|haina|nigua|bajos de haina|villa altagracia/i, "San Cristóbal"],
  [/san pedro de macor[ií]s|san pedro|juan dolio/i, "San Pedro de Macorís"],
  [/san francisco de macor|duarte|san francisco/i, "Duarte (San Francisco)"],
  [/santo domingo/i, "Santo Domingo"],
  [/remoto|teletrabajo|desde casa|home office|trabajo en casa/i, "Remoto desde RD"],
];

/** Lugares reales que el sitio todavía no tiene como provincia: se avisa para que elijan a mano. */
const OTROS_LUGARES = /\b(la vega|moca|bonao|monse[ñn]or nouel|ban[ií]|peravia|san juan|barahona|azua|monte ?cristi|saman[aá]|nagua|cot[uú]i|sanchez ram[ií]rez|monte plata|hato mayor|el seibo|dajab[oó]n|mao\b|valverde|jarabacoa|constanza|ocoa|pedernales|independencia|neiba|bahoruco|hermanas mirabal|salcedo|tenares|santiago rodr[ií]guez|puerto plata|higuey)\b/i;

const areasClave: [RegExp, string][] = [
  [/desarroll|programad|software|sistemas|\bredes\b|soporte t[eé]cnico|analista de datos|\bIT\b|inform[aá]tic|data ?lab|ux|ui\b|devops|ciberseg/i, "Tecnología"],
  [/contab|finanz|auditor|tesorer|cr[eé]dito|cobros|cobrador|facturaci[oó]n|banc[oa]|cajero de banco/i, "Contabilidad y Finanzas"],
  [/recursos humanos|\bRRHH\b|reclut|talento humano|n[oó]mina/i, "Recursos Humanos"],
  [/enfermer|m[eé]dic|farmac|odont|bioan[aá]lis|cl[ií]nica|hospital|paramedic|terapeut|laboratorista/i, "Salud"],
  [/hotel|resort|turis|camarer|bartender|barista|cocin|chef|mesero|mesera|restaurante|cafeter|panader|hostess|botones|ama de llaves/i, "Hotelería y Turismo"],
  [/servicio al cliente|call center|atenci[oó]n al cliente|cajer|telemercade|telemarketing|agente de (llamadas|ventas|servicio)/i, "Servicio al Cliente"],
  [/venta|vendedor|comercial|marketing|mercadeo|mercaderista|promotor|ejecutiv[oa] de cuentas|asesor comercial/i, "Ventas"],
  [/log[ií]stic|almac[eé]n|almacenista|chofer|conductor|despach|mensajer|inventario|repartidor|motoconcho|montacarg|transporte|distribuci/i, "Logística"],
  [/producci[oó]n|operari[oa]|manufactur|planta|ensambl|zona franca|costurer|empacador|empaque|maquinista/i, "Producción"],
  [/operacion|mantenimiento|t[eé]cnico|electricista|mec[aá]nic|plomero|alba[ñn]il|soldador|pintor|carpinter|seguridad|vigilante|guardi[aá]n|conserje|limpieza|jardiner|construcci/i, "Operaciones"],
  [/administrativ|secretari|recepcionista|archivista|digitador|oficina|asistente (de|del) (gerencia|direcci)|auxiliar de oficina/i, "Administración"],
];

const POSICION = /\b(cajer[oa]s?|vendedor(?:a|es|as)?|auxiliar(?:es)?|asistente(?:s)?|analista(?:s)?|gerente(?:s)?|supervisor(?:a|es|as)?|encargad[oa]s?|coordinador(?:a|es|as)?|operari[oa]s?|t[eé]cnic[oa]s?|mec[aá]nic[oa]s?|electricista(?:s)?|chofer(?:es)?|conductor(?:a|es|as)?|mensajer[oa]s?|repartidor(?:a|es|as)?|recepcionista(?:s)?|secretari[oa]s?|contador(?:a|es|as)?|enfermer[oa]s?|m[eé]dic[oa]s?|doctor(?:a|es|as)?|odont[oó]log[oa]s?|cociner[oa]s?|chef|mesero(?:a|s|as)?|camarer[oa]s?|bartender(?:s)?|barista(?:s)?|guardi[aá]n(?:es)?|vigilante(?:s)?|almacenista(?:s)?|despachador(?:a|es|as)?|promotor(?:a|es|as)?|agente(?:s)?|ejecutiv[oa]s?|representante(?:s)?|desarrollador(?:a|es|as)?|programador(?:a|es|as)?|dise[ñn]ador(?:a|es|as)?|abogad[oa]s?|ingenier[oa]s?|arquitect[oa]s?|maestr[oa]s?|profesor(?:a|es|as)?|docente(?:s)?|conserje(?:s)?|ayudante(?:s)?|obrer[oa]s?|alba[ñn]il(?:es)?|plomer[oa]s?|pintor(?:a|es|as)?|soldador(?:a|es)?|carpintero(?:s)?|costurer[oa]s?|panader[oa]s?|barber[oa]s?|estilista(?:s)?|manicurista(?:s)?|cobrador(?:a|es|as)?|digitador(?:a|es|as)?|archivista(?:s)?|mercaderista(?:s)?|director(?:a|es|as)?|jef[ea]s?|pasante(?:s)?|practicante(?:s)?|instructor(?:a|es|as)?|entrenador(?:a|es|as)?|cuidador(?:a|es|as)?|ni[ñn]era(?:s)?|jardiner[oa]s?|lavador(?:a|es|as)?|montacarguista(?:s)?|inspector(?:a|es|as)?|facilitador(?:a|es|as)?|gestor(?:a|es|as)?|consultor(?:a|es|as)?|redactor(?:a|es|as)?|editor(?:a|es|as)?|fot[oó]graf[oa]s?|community manager|telemercader(?:s)?|empacador(?:a|es|as)?|personal de [a-záéíóúñ]+|dependiente(?:s)?|anfitri[oó]n|anfitriona|hostess|farmac[eé]utic[oa]s?|bioanalista(?:s)?|nutricionista(?:s)?|psic[oó]log[oa]s?|trabajador(?:a|es|as)? social|motorista(?:s)?|motoconchista(?:s)?|ayudante|oficial|tesorer[oa]s?|auditor(?:a|es|as)?|reclutador(?:a|es|as)?|especialista(?:s)?|l[ií]der|soporte|devops|full ?stack|front ?end|back ?end|junior|senior|operador(?:a|es|as)?|oficinista(?:s)?|tapicer[oa]s?|ebanista(?:s)?|herrer[oa]s?|cerrajer[oa]s?|lavaplatos|fregador(?:a|es)?|peluquer[oa]s?|instalador(?:a|es|as)?|reparador(?:a|es|as)?|fumigador(?:a|es|as)?|piloto(?:s)?|cuadrilla|customer (?:service|support)|representative|agent|assistant|manager|specialist|engineer|developer|accountant|sales|bartender|waiter|driver)\b/i;

const CONTACTO = /[\w.+-]+@[\w-]+\.[\w.]+|https?:\/\/\S+|www\.\S+|(?:\+?1[\s-]?)?\(?8[024]9\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const TELEFONO = /(?:\+?1[\s-]?)?\(?8[024]9\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const DINERO = /RD\s?\$|DOP|\$\s?\d|\d\s?(?:mil|k)\b.*(?:pesos|mensual)|pesos/i;
const HORARIO = /lunes a (viernes|s[aá]bado|domingo)|\d{1,2}(:\d{2})?\s*(am|pm|a\.\s?m\.|p\.\s?m\.)|turnos? rotativ|fines de semana|\b12x36\b|martes a domingo/i;
const ORG = /\b(supermercado[s]?|hotel(?:es)?|resort|cl[ií]nica|ferreter[ií]a|restaurante|distribuidora|importadora|inversiones|agencia|grupo|centro|colegio|universidad|banco|cooperativa|zona franca|laboratorio[s]?|farmacia|plaza|tienda[s]?|corporaci[oó]n|corp\b|s\.?\s?r\.?\s?l\.?|s\.?\s?a\.?\s?s?\b|comercial|constructora|consorcio|holding|fundaci[oó]n|asociaci[oó]n|instituto|hospital|cafeter[ií]a|caf[eé]\b|panader[ií]a|servicios|soluciones|tecnolog[ií]as?|express|industrias|textil|transporte[s]?|bpo|ministerio|ayuntamiento|alcald[ií]a|empresas?|dominicana|compa[ñn][ií]a|seguridad|multiservicios|auto|motors?|salon|sal[oó]n|spa\b|gimnasio|gym|librer[ií]a|boutique|joyer[ií]a|optica|[oó]ptica|call center|contact center)\b/i;

function encabezado(l: string): { k: Sec; resto: string } | null {
  for (const [k, re] of SECCIONES) {
    const m = l.match(re);
    if (!m) continue;
    const i = l.indexOf(":");
    const resto = l.slice(m[0].length).trim();
    const soloTitulo = resto === "" || /^(del puesto|de la vacante|del cargo|requeridos?|solicitados?|principales|generales|adicionales|laborales|del candidato|para aplicar|importantes?|especiales?|del perfil|de trabajo)$/i.test(resto);
    if ((i >= 0 && i <= 45) || soloTitulo) return { k, resto: i >= 0 ? l.slice(i + 1).trim() : "" };
  }
  return null;
}

const limpiar = (l: string) =>
  l
    .replace(EMOJI, "")
    .replace(/#[\p{L}\p{N}_]+/gu, "")
    .replace(/\*+/g, "")
    .replace(/_{2,}/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

const quitaVineta = (l: string) => l.replace(VINETA, "").trim();

function palabras(s: string) {
  return s.split(/\s+/).filter(Boolean).length;
}

/** Sueldo: «RD$22,000», «30 a 35 mil», «28K», «de 30,000 a 35,000 pesos». No toma teléfonos ni años. */
function leerSalario(t: string): { min: string; max: string; aviso: string } {
  const sinTel = t.replace(new RegExp(TELEFONO.source, "g"), " ");
  if (/\b(a convenir|a negociar|seg[uú]n experiencia|por definir|a tratar)\b/i.test(sinTel) && !/(?:RD\s?\$|DOP|\$)\s*\d/i.test(sinTel)) return { min: "", max: "", aviso: "" };
  const NUM = String.raw`(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{4,7}(?:[.,]\d{2})?|\d{1,3}(?:[.,]\d)?\s?(?:k|mil)\b)`;
  const SEP = String.raw`\s*(?:-|–|—|a|al|hasta|y)\s*`;
  const MONEDA = String.raw`(?:RD\s?\$|R\s?D\s?\$|DOP|\$)`;
  const dolares = /US\s?\$|USD|d[oó]lares|dollars/i.test(sinTel);
  const candidatos: RegExp[] = [
    new RegExp(`${MONEDA}\\s*${NUM}(?:${SEP}(?:${MONEDA})?\\s*${NUM})?`, "i"),
    new RegExp(`(?:salario|sueldo|remuneraci[oó]n|pago|paga|ganar[aá]s?|ofrecemos|compensaci[oó]n)[^\\n\\d]{0,40}(?:de\\s+)?${NUM}(?:${SEP}${NUM})?`, "i"),
    new RegExp(`${NUM}(?:${SEP}${NUM})?\\s*(?:pesos|mensuales?|al mes)`, "i"),
  ];
  for (const re of candidatos) {
    const m = sinTel.match(re);
    if (!m) continue;
    let a = valor(m[1] ?? "");
    let b = m[2] ? valor(m[2]) : 0;
    if (b && a && a < 1000 && /(?:k|mil)$/i.test(m[2] ?? "")) a *= 1000;
    if (a && a < 50) continue;
    if (a > b && b) [a, b] = [b, a];
    const cerca = sinTel.slice(Math.max(0, (m.index ?? 0) - 25), (m.index ?? 0) + m[0].length + 30);
    const periodo = cerca.match(/quincen|semanal|por semana|por hora|a la hora|diari[oa]s?|por d[ií]a|al d[ií]a/i);
    if (!dolares && !periodo && (a < 3000 || a > 1_500_000)) continue;
    if (b && (b < 3000 || b > 1_500_000) && !periodo) b = 0;
    if (dolares) return { min: "", max: "", aviso: `El sueldo parece estar en dólares (${m[0].trim()}). El sitio muestra pesos: escríbelo tú si corresponde.` };
    if (periodo) return { min: "", max: "", aviso: `El pago parece ser ${/quincen/i.test(periodo[0]) ? "quincenal" : /hora/i.test(periodo[0]) ? "por hora" : /semana/i.test(periodo[0]) ? "semanal" : "diario"} (${m[0].trim()}). El sitio muestra sueldo mensual: escríbelo tú si lo sabes.` };
    return { min: String(a), max: b ? String(b) : "", aviso: "" };
  }
  return { min: "", max: "", aviso: "" };
}

function leerExperiencia(t: string): { v: string; seguro: boolean } {
  if (/sin experiencia|no (?:se )?(?:requiere|necesita|exige|es necesaria|es indispensable)[^.\n]{0,25}experiencia|experiencia no (?:es )?(?:necesaria|requerida|indispensable)|primer empleo|no necesitas experiencia|nunca has trabajado/i.test(t)) return { v: "Sin experiencia", seguro: true };
  const anios = [
    t.match(/experiencia[^.\n]{0,40}?(\d{1,2})\s*(?:\+\s*)?(?:a|á)[ñn]os?/i),
    t.match(/(\d{1,2})\s*(?:\+\s*)?(?:a|á)[ñn]os?\s+(?:de|en|como)\s+(?:experiencia|el puesto|puestos? similares?)/i),
    t.match(/(?:m[ií]nimo|al menos|m[ií]nima)\s+(?:de\s+)?(\d{1,2})\s*(?:a|á)[ñn]os?/i),
    t.match(/(\d{1,2})\s*(?:a|á)[ñn]os?\s*(?:o m[aá]s\s*)?(?:de\s+)?experiencia/i),
  ].find((m) => m && m[1]);
  if (anios && anios[1]) return { v: Number(anios[1]) >= 3 ? "3+ años" : "1-3 años", seguro: true };
  if (/(\d{1,2})\s*meses?\s+de\s+experiencia/i.test(t)) return { v: "1-3 años", seguro: true };
  for (const m of t.matchAll(/(\d{1,2})\s*\+?\s*(?:a|á)[ñn]os?\b/gi)) {
    const antes = t.slice(Math.max(0, (m.index ?? 0) - 18), m.index ?? 0);
    const despues = t.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 14);
    if (/mayor|menor|edad|entre|de \d+ a|hasta|desde|cumplir|empresa|fundad|mercado/i.test(antes) || /de edad|cumplidos|en el mercado|de trayectoria/i.test(despues)) continue;
    const n = Number(m[1]);
    if (n >= 1 && n <= 20) return { v: n >= 3 ? "3+ años" : "1-3 años", seguro: true };
  }
  if (/experiencia (?:previa|comprobada|m[ií]nima|en|demostrable|laboral)|con experiencia|experiencia (?:en|como)/i.test(t)) return { v: "1-3 años", seguro: false };
  return { v: "Sin experiencia", seguro: false };
}

type Capturas = { t: string; lineas: string[] };

function buscarEmpresa(c: Capturas, titulo: string): { v: string; seguro: boolean } {
  const { lineas } = c;
  const campo = lineas.map((l) => l.match(/^(?:empresa|compa[ñn][ií]a|instituci[oó]n|organizaci[oó]n|cliente|anunciante)\s*[:\-–]\s*(.{2,90})$/i)?.[1]).find(Boolean);
  if (campo) return { v: aTitulo(campo.trim()), seguro: true };

  const NO_EMPRESA = /^(?:se|estamos|buscamos|solicitamos|necesitamos|requerimos|importante|reconocida?|prestigios[oa]|empresa (?:del|de la|l[ií]der|dominicana)|nuestr[oa]|la empresa|una empresa|el cliente|interesad|favor|todos|quien|usted|tu |t[uú] )/i;
  for (const l of lineas.slice(0, 14)) {
    const m = l.match(/^(.{3,70}?)\s+(?:solicita(?:n)?|busca(?:n)?|requiere(?:n)?|necesita(?:n)?|contrata(?:n)?|ofrece(?:n)?|abre(?:n)?|convoca(?:n)?|precisa(?:n)?|est[aá]\s+(?:buscando|contratando|reclutando)|estan\s+(?:buscando|contratando)|anuncia)\b/i);
    if (m && m[1] && !NO_EMPRESA.test(m[1]) && !CONTACTO.test(m[1]) && palabras(m[1]) <= 8) return { v: aTitulo(m[1].replace(/[:\-–,]+$/, "").trim()), seguro: true };
    const e = l.match(/^en\s+(.{3,60}?),?\s+(?:estamos|buscamos|necesitamos|solicitamos|requerimos|queremos|contratamos)/i);
    if (e && e[1] && !CONTACTO.test(e[1])) return { v: aTitulo(e[1].trim()), seguro: true };
    const u = l.match(/^[uú]nete a\s+(.{3,60}?)[!.:]?$/i);
    if (u && u[1] && !/nuestro|equipo|la familia/i.test(u[1])) return { v: aTitulo(u[1].trim()), seguro: false };
    const de = l.match(/^(?:empresa|compa[ñn][ií]a)\s+([A-ZÁÉÍÓÚÑ][^\n,.]{2,50})$/);
    if (de && de[1]) return { v: aTitulo(de[1].trim()), seguro: false };
  }

  const antes = lineas.findIndex((l) => aTitulo(l) === titulo || l.toLowerCase() === titulo.toLowerCase());
  const sospechosa = (l: string) =>
    l.length >= 3 && l.length <= 60 && palabras(l) <= 7 && !CONTACTO.test(l) && !DINERO.test(l) && !HORARIO.test(l) && !encabezado(l) && !PORTADA.test(l) && !VINETA.test(l) && l !== titulo && !POSICION.test(l) && !/\d{3,}/.test(l) && !/[:?]/.test(l) && !lugares.some(([re]) => re.test(l)) && !/^(requisitos|funciones|beneficios|ofrecemos|interesados|enviar|horario|salario|sueldo)/i.test(l);
  // Línea con nombre de negocio (Hotel…, Clínica…, Supermercados…) en el encabezado del anuncio.
  for (const l of lineas.slice(0, 10)) {
    for (const seg of l.split(/\s+[-–—|•·]\s+/)) {
      if (sospechosa(seg.trim()) && ORG.test(seg)) return { v: aTitulo(seg.trim()), seguro: false };
    }
  }
  // En anuncios con «Puesto:» la primera línea suele ser la empresa.
  if (lineas.some((l) => /^(puesto|cargo|vacante)\s*:/i.test(l)) && lineas[0] && sospechosa(lineas[0])) return { v: aTitulo(lineas[0]), seguro: false };
  // En flyers: la línea pegada al puesto (antes o después) si parece un nombre.
  const NO_NOMBRE = /^(?:con|sin|para|de|del|en|y|a|por|m[aá]s|mas|se|si|tu|su)\b|\b(?:experiencia|requisit|disponibilidad|bachiller|licencia|manejo|conocimiento|sueldo|salario|horario|zona|ubicaci|presentarse|interesad|enviar|llamar|propinas|comisi|beneficios|seguro|tiempo completo|medio tiempo|buena presencia|presencia)\b/i;
  for (const i of [antes + 1, antes - 1]) {
    const l = lineas[i];
    if (antes < 0 || !l || NO_NOMBRE.test(l) || !/^[\p{Lu}]/u.test(l)) continue;
    const base = l.length >= 3 && l.length <= 60 && palabras(l) <= 7 && !CONTACTO.test(l) && !DINERO.test(l) && !HORARIO.test(l) && !encabezado(l) && !PORTADA.test(l) && !VINETA.test(l) && l !== titulo && !/\d{3,}/.test(l) && !/[:?]/.test(l) && !lugares.some(([re]) => re.test(l));
    if (base && (!POSICION.test(l) || palabras(l) >= 3)) return { v: aTitulo(l), seguro: false };
  }
  return { v: "", seguro: false };
}

/** De «SECRETARIA con experiencia para empresa en Los Mina. Sueldo…» deja «SECRETARIA»; si hay dos puestos («mesero y cocinero») también los lista. */
function cortarPuesto(x: string): { puesto: string; lista: string[] } {
  let r = x.replace(/^(?:a\s+)?(?:un[ao]?s?\s+)?(?:nuev[oa]s?\s+)?/i, "").trim();
  if (/^(?:personal|gente|personas)\b(?!\s+de\s)/i.test(r)) return { puesto: "", lista: [] };
  r = (r.split(/[.;!|]|,\s|\s[—–]\s|\s+(?:para|que|quien(?:es)?|dispuest[oa]s?|responsable|interesad[oa]s?)\s+/i)[0] ?? "").trim();
  if (r !== r.toUpperCase()) r = r.replace(/\s+en\s+(?=[A-ZÁÉÍÓÚÑ]).*$/, "");
  r = r.replace(/\s+con\s+(?:experiencia|licencia|moto|motor|carro|veh[ií]culo|disponibilidad|conocimientos?|buena|excelente|t[ií]tulo)\b.*$/i, "").trim();
  const partes = r.split(/\s+(?:y|e)\s+|,\s*/i).map((p) => p.trim()).filter(Boolean);
  const lista = partes.length >= 2 && partes.every((p) => POSICION.test(p) && palabras(p) <= 4) ? partes.map(aTitulo) : [];
  return { puesto: lista.length ? lista[0]! : r, lista };
}

function buscarTitulo(c: Capturas): { v: string; seguro: boolean; lista: string[] } {
  const { lineas } = c;
  const cabecera = (() => {
    const i = lineas.findIndex((l) => {
      const h = encabezado(l);
      return !!h && h.k !== "otro";
    });
    return i < 0 ? lineas.slice(0, 14) : lineas.slice(0, Math.min(i, 14));
  })();

  const limpio = (s: string) =>
    quitaVineta(s)
      .replace(/^(?:puesto|cargo|vacante|posici[oó]n|plaza)\s*[:\-–]\s*/i, "")
      .replace(/^(?:trabajo|empleo|vacante|oferta)(?:\s+(?:remot[oa]|presencial|h[ií]brid[oa]|disponible|laboral|urgente))?\s*[:\-–|]\s*/i, "")
      .replace(/^(?:un[ao]?s?\s+)/i, "")
      .replace(/\s*[-–|]\s*(?:vacante|oferta|empleo).*$/i, "")
      .replace(/^["'“«]|["'”»:.,;!¡]+$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

  const campo = lineas.map((l) => l.match(/^(?:puesto|cargo|vacante|posici[oó]n|plaza)\s*[:\-–]\s*(.{3,100})$/i)?.[1]).find((x) => x && !PORTADA.test(x));
  if (campo) return { v: aTitulo(limpio(campo)).slice(0, 120), seguro: true, lista: [] };

  // «Empresa solicita:» y el puesto en la línea siguiente, o «Se solicita cajero».
  for (let i = 0; i < lineas.length && i < 16; i++) {
    const l = lineas[i]!;
    const m = l.match(/\b(?:solicita(?:n|mos)?|busco|busca(?:n|mos)?|necesita(?:n|mos)?|requiere(?:n|mos)?|requerimos|precisa(?:n)?|contrata(?:n|mos)?|(?:est[aá]n?|estamos|estoy)\s+(?:buscando|contratando|reclutando))\s*:?\s*(.*)$/i);
    if (!m) continue;
    const { puesto, lista } = cortarPuesto(m[1] ?? "");
    if (puesto && POSICION.test(puesto) && !CONTACTO.test(puesto) && puesto.length <= 80) {
      return { v: aTitulo(limpio(puesto)).slice(0, 120), seguro: true, lista };
    }
    if (!puesto) {
      const sig = lineas[i + 1];
      if (sig && !CONTACTO.test(sig) && !DINERO.test(sig) && !encabezado(sig) && sig.length <= 80) return { v: aTitulo(limpio(sig)).slice(0, 120), seguro: true, lista: [] };
    }
  }

  const candidata = cabecera.find((l) => {
    const x = limpio(l).split(/\s+[—–]\s+(?=[A-ZÁÉÍÓÚÑ])/)[0] ?? "";
    return x.length >= 4 && x.length <= 70 && palabras(x) <= 9 && POSICION.test(x) && !PORTADA.test(x) && !CONTACTO.test(x) && !DINERO.test(x) && !/^(?:requisitos|funciones|interesados|enviar)/i.test(x) && !VINETA.test(l) && !ORG.test(x.replace(POSICION, "")) ;
  });
  if (candidata) return { v: aTitulo((limpio(candidata).split(/\s+[—–]\s+(?=[A-ZÁÉÍÓÚÑ])/)[0] ?? "")).slice(0, 120), seguro: true, lista: [] };

  const cualquiera = lineas.find((l) => {
    const x = limpio(l);
    return x.length > 3 && x.length < 80 && !PORTADA.test(x) && !encabezado(x) && !CONTACTO.test(x) && !DINERO.test(x) && !HORARIO.test(x) && !VINETA.test(l) && !lugares.some(([re]) => re.test(x));
  });
  return { v: cualquiera ? aTitulo(limpio(cualquiera)).slice(0, 120) : "", seguro: false, lista: [] };
}

/** Anuncios que listan varios puestos: «Vacantes: • Cajero • Almacenista …». */
export function puestosEnLista(lineas: string[]): string[] {
  const out: string[] = [];
  let corrida: string[] = [];
  const cierra = () => { if (corrida.length >= 2) out.push(...corrida); corrida = []; };
  for (const l of lineas.slice(0, 40)) {
    const sin = quitaVineta(l).replace(/\s*\(\s*(?:RD\s?\$|DOP|\$)?\s*[\d.,]+[^)]*\)/gi, "").replace(/\s*[-–:]\s*(?:RD\s?\$|DOP|\$)?\s*[\d.,]+.*$/i, "").trim();
    const esPuesto = sin.length >= 4 && sin.length <= 55 && palabras(sin) <= 6 && POSICION.test(sin) && !CONTACTO.test(sin) && !PORTADA.test(sin) && !encabezado(sin) && !/^(?:experiencia|requisitos|funciones|conocimiento|manejo|buena|buen|excelente|disponibilidad|bachiller|licencia|mayor|menor|edad|titulo|título|estudiante|egresad)/i.test(sin);
    if (esPuesto && (VINETA.test(l) || /^[\p{Lu}\s()/.,&-]+$/u.test(sin) || corrida.length > 0)) corrida.push(aTitulo(sin));
    else cierra();
  }
  cierra();
  return Array.from(new Set(out)).slice(0, 12);
}

export function leer(texto: string): Lectura {
  const lineas = texto
    .replace(/\r/g, "")
    .split("\n")
    .flatMap((l) => (l.split(/\s+\|\s+/).length >= 3 ? l.split(/\s+\|\s+/) : [l]))
    .map(limpiar)
    .filter((l) => l.length > 1 && !RUIDO.test(l) && /[\p{L}\p{N}]/u.test(l));
  const t = lineas.join("\n");
  const c: Capturas = { t, lineas };
  const b: Borrador = { ...borradorVacio };
  const dudas: (keyof Borrador)[] = [];
  const avisos: string[] = [];

  const ti = buscarTitulo(c);
  b.titulo = ti.v;
  if (!ti.seguro) dudas.push("titulo");

  const em = buscarEmpresa(c, b.titulo);
  b.empresa = em.v.replace(/[.:]+$/, "").slice(0, 100);
  if (b.empresa && !em.seguro) dudas.push("empresa");

  const sal = leerSalario(t);
  b.salarioMin = sal.min;
  b.salarioMax = sal.max;
  if (sal.aviso) avisos.push(sal.aviso);

  // Lugar: primero la línea que dice «Ubicación/Zona/Lugar», si no, todo el texto.
  const lineaLugar = lineas.find((l) => /^(ubicaci[oó]n|lugar|zona|direcci[oó]n|sucursal|localidad)\s*[:\-–]/i.test(l)) ?? "";
  let provincia = "";
  for (const fuente of [lineaLugar, t]) {
    if (!fuente) continue;
    for (const [re, prov] of lugares) if (!provincia && re.test(fuente)) provincia = prov;
    if (provincia) break;
  }
  if (provincia) b.provincia = provincia;
  else {
    dudas.push("provincia");
    const otro = t.match(OTROS_LUGARES);
    avisos.push(otro ? `Dice «${otro[0]}», que todavía no está en la lista de provincias del sitio: elige la más cercana o «Toda República Dominicana».` : "No encontré la ubicación: elige la provincia.");
  }

  if (/h[ií]brid/i.test(t)) b.modalidad = "Híbrido";
  else if (/remot|teletrabajo|desde casa|home office|trabajo en casa/i.test(t)) b.modalidad = "Remoto";
  else if (/trabajo de campo|\bcampo\b|\bruta\b|repartidor|mensajero|motoconcho|visitas? a clientes|visita de clientes|a domicilio|chofer|conductor|vendedor de ruta/i.test(`${b.titulo}\n${t}`)) b.modalidad = "Campo";

  if (/pasant|practicante/i.test(`${b.titulo}\n${t}`)) b.tipo = "Pasantía";
  else if (/medio tiempo|part.?time|tiempo parcial|medio d[ií]a/i.test(t)) b.tipo = "Medio tiempo";
  else if (/por proyecto|freelance|contrato temporal|temporal\b/i.test(t)) b.tipo = "Por proyecto";

  const ex = leerExperiencia(t);
  b.experiencia = ex.v;
  if (!ex.seguro) dudas.push("experiencia");

  let area = "";
  for (const [re, a] of areasClave) if (!area && re.test(b.titulo)) area = a;
  if (area === "Administración" && /hotel|resort|turismo/i.test(t)) area = "Hotelería y Turismo";
  for (const [re, a] of areasClave) if (!area && re.test(t)) area = a;
  if (area) b.area = area;
  else dudas.push("area");

  const sec: Record<Sec, string[]> = { req: [], fun: [], ben: [], hor: [], apl: [], otro: [] };
  const suelto: string[] = [];
  let actual: Sec | null = null;
  for (const l of lineas) {
    const h = encabezado(l);
    if (h) {
      actual = h.k;
      if (h.resto) sec[h.k].push(quitaVineta(h.resto));
      continue;
    }
    const limpioL = quitaVineta(l);
    if (!limpioL) continue;
    if (actual) sec[actual].push(limpioL);
    else suelto.push(l);
  }

  const esDato = (l: string) => l === b.titulo || PORTADA.test(l) || CONTACTO.test(l) || DINERO.test(l) || (b.empresa !== "" && l.toLowerCase().includes(b.empresa.toLowerCase()));
  const esRuido = (l: string) => /^(?:comparte|gracias|saludos|dios|bendiciones)/i.test(l) || (CONTACTO.test(l) && l.length < 70);

  let reqs = sec.req.filter((r) => !CONTACTO.test(r));
  if (!reqs.length) reqs = suelto.filter((l) => VINETA.test(l) && !esDato(quitaVineta(l)) && !esRuido(l)).map(quitaVineta);
  b.requisitos = reqs.filter((r) => r.length > 1).slice(0, 15).join("\n");

  let horario = sec.hor.filter((h) => !CONTACTO.test(h));
  if (!horario.length) horario = lineas.filter((l) => HORARIO.test(l) && !CONTACTO.test(l) && l.length < 90).slice(0, 2);

  const partes: string[] = [];
  const fun = sec.fun.filter((f) => !CONTACTO.test(f));
  const ben = sec.ben.filter((f) => !CONTACTO.test(f));
  if (fun.length) partes.push(`Funciones:\n${fun.map((x) => `• ${x}`).join("\n")}`);
  if (ben.length) partes.push(`Beneficios:\n${ben.map((x) => `• ${x}`).join("\n")}`);
  if (horario.length) partes.push(`Horario: ${horario.join(" · ")}`);
  if (!fun.length && !ben.length) {
    const usados = new Set([...reqs, ...horario]);
    const extra = suelto.filter((l) => !VINETA.test(l) && !usados.has(l) && !esDato(l) && !esRuido(l) && !HORARIO.test(l) && l.length > 20 && !encabezado(l)).slice(0, 5);
    if (extra.length) partes.unshift(extra.join("\n"));
  }
  b.descripcion = partes.join("\n\n");

  const correos = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? [];
  const url = t.match(/https?:\/\/\S+|www\.\S+/);
  const tel = t.match(TELEFONO);
  b.aplicar = (correos[0] ?? "") || (url && url[0].replace(/[.,;)]+$/, "")) || (tel && tel[0]) || "";
  if (!b.aplicar) {
    const lineaApl = lineas.find((l) => /(?:presentarse|acudir|llevar (?:su|tu) (?:cv|curr[ií]culo|hoja de vida)|entregar (?:su|tu) (?:cv|curr[ií]culo)|dejar (?:su|tu) (?:cv|curr[ií]culo))/i.test(l));
    if (lineaApl) b.aplicar = lineaApl.slice(0, 200);
    else if (sec.apl.length) b.aplicar = sec.apl.join(" ").slice(0, 200);
  }
  if (url && url[0]) b.fuenteUrl = url[0].replace(/[.,;)]+$/, "");

  const varias = ti.lista.length >= 2 ? ti.lista : puestosEnLista(lineas);
  const salida: Borrador[] =
    varias.length >= 2
      ? varias.map((titulo) => {
          const lineaPuesto = lineas.find((l) => quitaVineta(l).toLowerCase().startsWith(titulo.toLowerCase().slice(0, 12)));
          const s = lineaPuesto ? leerSalario(lineaPuesto) : { min: "", max: "", aviso: "" };
          let areaP = "";
          for (const [re, a] of areasClave) if (!areaP && re.test(titulo)) areaP = a;
          return { ...b, titulo, requisitos: "", descripcion: b.descripcion && !/^Funciones:|^Beneficios:/.test(b.descripcion) ? "" : b.descripcion, salarioMin: s.min || (varias.length === 1 ? b.salarioMin : ""), salarioMax: s.max, area: areaP || b.area };
        })
      : [];
  if (salida.length) {
    avisos.push(`Este anuncio trae ${salida.length} puestos. Puedes separarlos en ${salida.length} vacantes.`);
  }

  return { b, dudas, avisos, varias: salida };
}

export function extraer(texto: string): Borrador {
  return leer(texto).b;
}

export type Borrador = {
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

const EMOJI = /[\p{Extended_Pictographic}️‍⃣]/gu;
const VINETA = /^([-•*✓✔▪●◦➢→>»►★☆]|\d+[.)-])\s*/;
const RUIDO = /s[ií]gue(nos)?\b|comp[aá]rte(lo)?\b|dale (like|me gusta)|link en (la )?bio|etiqueta a|menciona a|m[aá]s vacantes en|visita nuestr|dale follow|activa las notificaciones|^@\w+$/i;
const SOLO_TITULAR = /^(vacante(s)?( disponible(s)?)?|empleo|oportunidad( laboral| de empleo)?|estamos contratando|[uú]nete( a nuestro equipo)?|atenci[oó]n|importante|aviso|se busca|se solicita|buscamos|oferta de empleo|we are hiring|hiring)[!:.\s]*$/i;

type Sec = "req" | "fun" | "ben" | "hor" | "apl" | "otro";
const SECCIONES: [Sec, RegExp][] = [
  ["req", /^(requisitos|requerimientos|perfil|qu[eé] buscamos|necesitamos|debes (tener|cumplir)|indispensable|se requiere|competencias)/i],
  ["fun", /^(funciones|responsabilidades|tareas|actividades|qu[eé] har[aá]s|descripci[oó]n del puesto|sobre el puesto)/i],
  ["ben", /^(beneficios|ofrecemos|te ofrecemos|qu[eé] ofrecemos|ventajas)/i],
  ["hor", /^(horario|jornada|turno)/i],
  ["apl", /^(interesados|c[oó]mo aplicar|enviar|env[ií]a|aplica|contacto|post[uú]late|postularse|m[aá]s informaci[oó]n)/i],
  ["otro", /^(salario|sueldo|remuneraci[oó]n|ubicaci[oó]n|lugar|zona|empresa|puesto|cargo|vacante|posici[oó]n|plaza|modalidad)/i],
];

const aNumero = (s: string) => {
  const limpio = s.trim().replace(/[.,]\d{2}$/, "").replace(/[^\d]/g, "");
  const n = Number(limpio);
  return Number.isFinite(n) && n > 0 ? String(n) : "";
};

const lugares: [RegExp, string][] = [
  [/punta cana|b[aá]varo|hig[uü]ey|la altagracia|cap cana/i, "La Altagracia (Punta Cana)"],
  [/distrito nacional|piantini|naco|gazcue|bella vista|evaristo morales|serrall[eé]s|\bD\.?N\.?\b/i, "Distrito Nacional"],
  [/santo domingo (este|norte|oeste)|\bSDE\b|\bSDN\b|\bSDO\b|boca chica|los alcarrizos/i, "Santo Domingo"],
  [/santiago/i, "Santiago"],
  [/la romana/i, "La Romana"],
  [/puerto plata|sos[uú]a|cabarete/i, "Puerto Plata"],
  [/san crist[oó]bal|haina/i, "San Cristóbal"],
  [/san pedro/i, "San Pedro de Macorís"],
  [/san francisco de macor|duarte/i, "Duarte (San Francisco)"],
  [/santo domingo/i, "Santo Domingo"],
  [/remoto|teletrabajo|desde casa|home office/i, "Remoto desde RD"],
];

const areasClave: [RegExp, string][] = [
  [/desarroll|programad|software|sistemas|\bredes\b|soporte t[eé]cnico|analista de datos|\bIT\b|inform[aá]tic/i, "Tecnología"],
  [/contab|finanz|auditor|tesorer|cr[eé]dito|cobros/i, "Contabilidad y Finanzas"],
  [/recursos humanos|\bRRHH\b|reclut|talento humano|n[oó]mina/i, "Recursos Humanos"],
  [/enfermer|m[eé]dic|farmac|odont|bioan[aá]lis|cl[ií]nica/i, "Salud"],
  [/hotel|turis|recepcionista|camarer|bartender|cocin|chef|mesero/i, "Hotelería y Turismo"],
  [/servicio al cliente|call center|atenci[oó]n al cliente|cajer/i, "Servicio al Cliente"],
  [/venta|vendedor|comercial|marketing|mercadeo|promotor/i, "Ventas"],
  [/log[ií]stic|almac[eé]n|chofer|conductor|despach|mensajer|inventario/i, "Logística"],
  [/producci[oó]n|operari|manufactur|planta|ensambl/i, "Producción"],
  [/operacion|mantenimiento|t[eé]cnico|electricista|mec[aá]nic/i, "Operaciones"],
];

const CONTACTO = /[\w.+-]+@[\w-]+\.[\w.]+|https?:\/\/\S+|(?:\+?1[\s-]?)?\(?8[024]9\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const DINERO = /RD\s?\$|DOP|\$\s?\d/i;
const HORARIO = /lunes a (viernes|s[aá]bado|domingo)|\d{1,2}(:\d{2})?\s*(am|pm|a\.\s?m\.|p\.\s?m\.)|turnos? rotativ/i;

function encabezado(l: string): { k: Sec; resto: string } | null {
  for (const [k, re] of SECCIONES) {
    if (re.test(l) && (l.length < 45 || l.includes(":"))) {
      const i = l.indexOf(":");
      return { k, resto: i >= 0 ? l.slice(i + 1).trim() : "" };
    }
  }
  return null;
}

const limpiar = (l: string) => l.replace(EMOJI, "").replace(/#[\p{L}\p{N}_]+/gu, "").replace(/\*+/g, "").replace(/\s{2,}/g, " ").trim();

export function extraer(texto: string): Borrador {
  const lineas = texto
    .replace(/\r/g, "")
    .split("\n")
    .map(limpiar)
    .filter((l) => l.length > 1 && !RUIDO.test(l) && /[\p{L}\p{N}]/u.test(l));
  const t = lineas.join("\n");
  const b: Borrador = { ...borradorVacio };

  const campo = (...claves: string[]) => {
    for (const l of lineas) {
      for (const c of claves) {
        const m = l.match(new RegExp(`^(?:${c})\\s*[:\\-–]\\s*(.+)$`, "i"));
        if (m && m[1]) return m[1].trim();
      }
    }
    return "";
  };

  const busca = t.match(/(?:se busca|se solicita|solicitamos|estamos buscando|buscamos|estamos contratando|necesitamos)\s*:?\s*(?:un[ao]?\s+|a\s+)?([^\n.,!]{3,70})/i);
  b.titulo =
    campo("puesto", "vacante", "cargo", "posici[oó]n", "plaza") ||
    (busca && busca[1] ? busca[1].trim() : "") ||
    (lineas.find((l) => l.length > 3 && l.length < 80 && !SOLO_TITULAR.test(l) && !encabezado(l) && !CONTACTO.test(l) && !DINERO.test(l)) ?? "");
  b.titulo = b.titulo.replace(VINETA, "").replace(/^["'“«]|["'”»:]$/g, "").trim().slice(0, 120);

  b.empresa = campo("empresa", "compa[ñn][ií]a", "instituci[oó]n", "organizaci[oó]n").slice(0, 100);

  const sal = t.match(/(?:RD\s?\$|DOP|\$)\s*([\d][\d.,]{2,})(?:\s*(?:-|–|a|hasta|y)\s*(?:RD\s?\$|DOP|\$)?\s*([\d][\d.,]{2,}))?/i);
  if (sal) {
    b.salarioMin = aNumero(sal[1] ?? "");
    b.salarioMax = sal[2] ? aNumero(sal[2]) : "";
  } else {
    const s = campo("salario", "sueldo", "remuneraci[oó]n");
    const nums = s.match(/[\d][\d.,]{3,}/g);
    if (nums && nums[0]) {
      b.salarioMin = aNumero(nums[0]);
      if (nums[1]) b.salarioMax = aNumero(nums[1]);
    }
  }

  for (const [re, prov] of lugares) {
    if (re.test(t)) {
      b.provincia = prov;
      break;
    }
  }

  if (/h[ií]brid/i.test(t)) b.modalidad = "Híbrido";
  else if (/remot|teletrabajo|desde casa|home office/i.test(t)) b.modalidad = "Remoto";

  if (/pasant/i.test(t)) b.tipo = "Pasantía";
  else if (/medio tiempo|part.?time|tiempo parcial/i.test(t)) b.tipo = "Medio tiempo";
  else if (/por proyecto|freelance|temporal/i.test(t)) b.tipo = "Por proyecto";

  const exp = t.match(/(\d+)\s*\+?\s*a[ñn]os?/i);
  if (exp && exp[1]) b.experiencia = Number(exp[1]) >= 3 ? "3+ años" : "1-3 años";
  else if (/sin experiencia|no se requiere experiencia/i.test(t)) b.experiencia = "Sin experiencia";

  let area = "";
  for (const [re, a] of areasClave) if (!area && re.test(b.titulo)) area = a;
  for (const [re, a] of areasClave) if (!area && re.test(t)) area = a;
  if (area) b.area = area;

  const sec: Record<Sec, string[]> = { req: [], fun: [], ben: [], hor: [], apl: [], otro: [] };
  const suelto: string[] = [];
  let actual: Sec | null = null;
  for (const l of lineas) {
    const h = encabezado(l);
    if (h) {
      actual = h.k;
      if (h.resto) sec[h.k].push(h.resto.replace(VINETA, ""));
      continue;
    }
    const limpio = l.replace(VINETA, "").trim();
    if (!limpio) continue;
    if (actual) sec[actual].push(limpio);
    else suelto.push(l);
  }

  const esDato = (l: string) => l === b.titulo || SOLO_TITULAR.test(l) || CONTACTO.test(l) || DINERO.test(l) || (b.empresa !== "" && l.toLowerCase().includes(b.empresa.toLowerCase()));

  let reqs = sec.req.filter((r) => !CONTACTO.test(r));
  if (!reqs.length) reqs = suelto.filter((l) => VINETA.test(l)).map((l) => l.replace(VINETA, "").trim());
  b.requisitos = reqs.filter((r) => r.length > 1).slice(0, 15).join("\n");

  let horario = sec.hor.filter((h) => !CONTACTO.test(h));
  if (!horario.length) horario = lineas.filter((l) => HORARIO.test(l) && !CONTACTO.test(l)).slice(0, 2);

  const partes: string[] = [];
  const fun = sec.fun.filter((f) => !CONTACTO.test(f));
  const ben = sec.ben.filter((f) => !CONTACTO.test(f));
  if (fun.length) partes.push(`Funciones:\n${fun.map((x) => `• ${x}`).join("\n")}`);
  if (ben.length) partes.push(`Beneficios:\n${ben.map((x) => `• ${x}`).join("\n")}`);
  if (horario.length) partes.push(`Horario: ${horario.join(" · ")}`);
  if (!fun.length && !ben.length) {
    const usados = new Set([...reqs, ...horario]);
    const extra = suelto.filter((l) => !VINETA.test(l) && !usados.has(l) && !esDato(l) && !HORARIO.test(l) && l.length > 20).slice(0, 5);
    if (extra.length) partes.unshift(extra.join("\n"));
  }
  b.descripcion = partes.join("\n\n");

  const mail = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const url = t.match(/https?:\/\/\S+/);
  const tel = t.match(/(?:\+?1[\s-]?)?\(?8[024]9\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  b.aplicar = (mail && mail[0]) || (url && url[0]) || (tel && tel[0]) || "";
  if (!b.aplicar && sec.apl.length) b.aplicar = sec.apl.join(" ").slice(0, 200);
  if (url && url[0]) b.fuenteUrl = url[0];

  return b;
}

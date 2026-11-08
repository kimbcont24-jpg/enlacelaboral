/** Preguntas de entrevista frecuentes en RD, con qué buscan y cómo responder. Sin inventar datos de la persona. */
export type Pregunta = { id: string; p: string; buscan: string; como: string; tipo?: "salario" | "historia" | "normal"; rol?: string };

export const GENERALES: Pregunta[] = [
  { id: "g1", p: "Háblame de ti.", buscan: "Que te presentes en un minuto, con lo que tiene que ver con el puesto.", como: "Di quién eres en una frase, tu experiencia más relevante (con un logro) y por qué te interesa este puesto. No cuentes tu vida personal." },
  { id: "g2", p: "¿Por qué quieres trabajar aquí?", buscan: "Que sepas algo de la empresa y no apliques por aplicar.", como: "Menciona algo concreto de la empresa (qué hacen, su reputación, crecimiento) y cómo encaja con lo que sabes hacer y lo que buscas." },
  { id: "g3", p: "¿Por qué estás buscando empleo? (o ¿por qué dejaste tu último trabajo?)", buscan: "Que no hables mal de nadie y que tu motivo sea razonable.", como: "Habla en positivo: buscas crecer, más estabilidad, un horario que te permita estudiar, terminar un contrato. Nunca critiques a tu jefe anterior." },
  { id: "g4", p: "¿Cuáles son tus fortalezas?", buscan: "Dos o tres cualidades útiles para el puesto, con prueba.", como: "Elige 2 fortalezas que pidan en la vacante y da un ejemplo real de cada una (qué hiciste y qué lograste)." },
  { id: "g5", p: "¿Cuál es tu mayor debilidad?", buscan: "Honestidad y que estés trabajando en mejorar.", como: "Di algo real pero que no sea clave para el puesto, y explica qué haces para mejorarlo (un curso, una técnica). Evita «soy muy perfeccionista»." },
  { id: "g6", p: "Cuéntame de una vez que resolviste un problema difícil (con un cliente, un compañero o en el trabajo).", buscan: "Cómo actúas bajo presión. Quieren una historia concreta.", como: "Usa el orden: situación (qué pasó), lo que te tocaba, lo que hiciste tú y el resultado. Si puedes, con un número.", tipo: "historia" },
  { id: "g7", p: "¿Cuánto aspiras a ganar?", buscan: "Que conozcas el mercado y que tu aspiración quepa en su presupuesto.", como: "Da un rango realista en pesos según el puesto y tu experiencia (mira el salario de vacantes parecidas). Puedes decir que es negociable según los beneficios.", tipo: "salario" },
  { id: "g8", p: "¿Tienes disponibilidad para horarios rotativos o fines de semana?", buscan: "Que seas claro con tu disponibilidad desde el principio.", como: "Responde con honestidad qué horarios puedes cumplir. Si tienes estudios u otro compromiso, dilo y propone una solución." },
  { id: "g9", p: "¿Dónde te ves en 2 o 3 años?", buscan: "Que quieras quedarte y crecer, no irte en tres meses.", como: "Habla de crecer dentro del área: aprender más, asumir más responsabilidades, quizás un puesto de supervisión." },
  { id: "g10", p: "¿Tienes alguna pregunta para nosotros?", buscan: "Interés real en el puesto.", como: "Siempre ten 1 o 2 preguntas: ¿cómo es un día normal en este puesto? ¿cómo miden el buen desempeño? ¿cuáles son los próximos pasos del proceso?" },
];

const R = (rol: string, l: [string, string, string][]): Pregunta[] => l.map(([p, buscan, como], i) => ({ id: `${rol}${i}`, p, buscan, como, rol }));

export const POR_ROL: Record<string, Pregunta[]> = {
  cliente: R("cliente", [
    ["¿Qué harías con un cliente muy molesto que te grita por teléfono?", "Calma, empatía y que sepas seguir un proceso.", "Explica que escuchas sin interrumpir, reconoces su molestia, buscas la solución dentro de lo que puedes ofrecer y das seguimiento. Si tienes un ejemplo real, cuéntalo."],
    ["¿Cómo te va con las metas de llamadas y de calidad?", "Que entiendas que en call center se mide todo.", "Cuenta cómo cumpliste metas antes (con números si los tienes) y cómo te organizas para no bajar la calidad."],
  ]),
  caja: R("caja", [
    ["¿Qué haces si al final del turno te falta dinero en la caja?", "Honestidad y que conozcas el procedimiento.", "Di que reportas de inmediato al supervisor, revisas transacciones y comprobantes, y explica cómo evitas errores (contar al recibir, verificar billetes)."],
    ["¿Cómo atiendes una fila larga sin que los clientes se molesten?", "Rapidez sin perder amabilidad.", "Habla de saludar a todos, trabajar con orden, pedir apoyo para abrir otra caja si hace falta y mantener la calma."],
  ]),
  ventas: R("ventas", [
    ["Véndeme este bolígrafo (o cualquier producto).", "Que preguntes antes de ofrecer.", "Primero pregunta qué necesita la persona, luego conecta el producto con esa necesidad y cierra con una propuesta clara."],
    ["¿Cómo manejas un «no» del cliente?", "Perseverancia sin presionar de más.", "Explica que preguntas el motivo, respondes la objeción, y si sigue en no, dejas buena impresión y das seguimiento después."],
  ]),
  almacen: R("almacen", [
    ["¿Cómo te aseguras de que un pedido salga completo y correcto?", "Orden y cuidado con los detalles.", "Habla de verificar contra la orden, revisar cantidades y estado, y marcar o escanear cada producto."],
    ["¿Tienes experiencia con inventarios o montacargas?", "Qué sabes hacer realmente y si tienes certificación.", "Di con claridad qué has hecho y por cuánto tiempo. Si no lo has hecho, muestra disposición a aprender y menciona algo parecido que sí hiciste."],
  ]),
  admin: R("admin", [
    ["¿Cómo organizas tu día cuando tienes muchas tareas a la vez?", "Organización y prioridades.", "Explica tu método: lista de pendientes, lo urgente primero, agenda, y avisar a tiempo si algo se atrasa."],
    ["¿Qué tan bien manejas Excel y Office?", "Nivel real, sin exagerar.", "Da ejemplos de lo que haces: tablas, fórmulas, reportes, correspondencia. Si estás aprendiendo algo, dilo."],
  ]),
  contabilidad: R("contabilidad", [
    ["¿Qué haces si una conciliación bancaria no cuadra?", "Método y paciencia para encontrar la diferencia.", "Revisa partidas en tránsito, cheques no cobrados, cargos bancarios y errores de registro, paso a paso. Cuenta un caso real si lo tienes."],
    ["¿Qué declaraciones de la DGII has preparado?", "Experiencia concreta.", "Menciona las que has hecho (ITBIS, IR-17, 606, 607…) y con qué sistema. Si no las has hecho, di qué parte conoces."],
  ]),
  chofer: R("chofer", [
    ["¿Qué haces si te retrasa un tapón y no llegas a tiempo a una entrega?", "Responsabilidad y comunicación.", "Avisas de inmediato al supervisor o al cliente, das un tiempo estimado real y buscas la mejor ruta."],
    ["¿Cómo cuidas el vehículo?", "Que lo trates como tuyo.", "Habla de revisar aceite, gomas y luces, reportar averías a tiempo y manejar a la defensiva."],
  ]),
  turismo: R("turismo", [
    ["¿Cómo atenderías a un huésped que se queja de su habitación?", "Servicio y solución rápida.", "Escuchas, te disculpas en nombre del hotel, das una solución o escalas al supervisor, y das seguimiento."],
    ["¿Qué idiomas hablas y en qué nivel?", "Nivel real para atender huéspedes.", "Di tu nivel con honestidad y da un ejemplo de cómo lo has usado. Puede que te hagan una pregunta en inglés: prepárate."],
  ]),
  tecnologia: R("tecnologia", [
    ["Cuéntame de un problema técnico difícil que resolviste.", "Cómo piensas y diagnosticas.", "Describe el problema, cómo encontraste la causa, qué hiciste y el resultado. Explícalo simple."],
    ["¿Cómo te mantienes al día con la tecnología?", "Ganas de aprender.", "Menciona cursos, certificaciones, comunidades o proyectos personales."],
  ]),
  produccion: R("produccion", [
    ["¿Cómo cumples la meta de producción sin bajar la calidad?", "Ritmo constante y atención.", "Habla de seguir el método, revisar tu trabajo y avisar si una máquina o material falla."],
    ["¿Tienes disponibilidad para turnos rotativos?", "Claridad con tu horario.", "Responde con honestidad y menciona si tienes transporte para llegar en cada turno."],
  ]),
  primer: R("primer", [
    ["No tienes experiencia. ¿Por qué deberíamos contratarte?", "Actitud, ganas de aprender y algo que lo demuestre.", "Habla de lo que sí tienes: estudios, cursos, pasantía, voluntariado, responsabilidades en casa o en la iglesia. Muestra que aprendes rápido con un ejemplo."],
    ["¿Qué sabes de este puesto?", "Que investigaste.", "Explica con tus palabras qué crees que hace la persona en ese puesto y por qué te gusta."],
  ]),
};

export const CONSEJOS_DIA = [
  "Lleva tu cédula y 2 copias de tu CV impresas.",
  "Llega 15 minutos antes. Busca la dirección y el transporte un día antes.",
  "Vístete un poco más formal de lo que se viste la gente de esa empresa.",
  "Busca en internet qué hace la empresa para poder mencionarlo.",
  "Apaga o silencia el celular. Mira a los ojos y saluda con firmeza.",
  "Al final, pregunta cuáles son los próximos pasos y agradece por el tiempo.",
  "Ninguna empresa seria te cobra por entrevistarte o contratarte.",
];

export type Revision = { ok: boolean; texto: string }[];
/** Revisa la respuesta escrita: largo, ejemplo, número, cosas a evitar. */
export function revisarRespuesta(q: Pregunta, r: string): Revision {
  const t = r.trim();
  const palabras = t ? t.split(/\s+/).length : 0;
  const out: Revision = [];
  out.push({ ok: palabras >= 25 && palabras <= 170, texto: palabras < 25 ? "Muy corta: desarrolla un poco más (unas 3 o 4 frases)." : palabras > 170 ? "Muy larga: resume. En voz alta debe durar menos de 2 minutos." : "Buen largo para responder en voz alta." });
  if (q.tipo === "salario") out.push({ ok: /rd\$|\$|pesos|\d{2}[\s,.]?\d{3}|mil/i.test(t), texto: /rd\$|\$|pesos|\d{2}[\s,.]?\d{3}|mil/i.test(t) ? "Diste una cifra o un rango." : "Di un rango en pesos (ej.: entre RD$25,000 y RD$30,000)." });
  else {
    const ej = /por ejemplo|una vez|cuando|en mi (último|anterior)|logré|logre|me tocó|en [A-ZÁÉÍÓÚ]\w+/i.test(t);
    out.push({ ok: ej, texto: ej ? "Incluiste un ejemplo concreto." : "Agrega un ejemplo real: «Por ejemplo, en mi trabajo anterior…»." });
    if (q.tipo === "historia" || q.id === "g4" || q.id === "g1") out.push({ ok: /\d/.test(t), texto: /\d/.test(t) ? "Tiene un número que lo hace creíble." : "Si puedes, pon un número (clientes, meses, %, metas)." });
  }
  const malo = /(mi jefe era|odio|no s[eé] nada|por (el|la) (dinero|cuarto|paga)|me botaron|chisme|pelea)/i.test(t);
  if (malo) out.push({ ok: false, texto: "Evita hablar mal de otros o decir que solo es por dinero." });
  return out;
}

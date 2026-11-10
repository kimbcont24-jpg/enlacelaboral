/**
 * Guías cortas para candidatos (página /recursos).
 * Tono: directo, dominicano profesional, sin relleno. Cada guía se lee en 1 a 3 minutos.
 */
export type Etapa = "cv" | "aplicar" | "entrevista" | "oferta" | "primer" | "salida";

export const ETAPAS: { id: Etapa; t: string; d: string }[] = [
  { id: "cv", t: "Armando mi CV", d: "Que lo lean y te llamen" },
  { id: "aplicar", t: "Aplicando", d: "Enviar bien y dar seguimiento" },
  { id: "entrevista", t: "Tengo entrevista", d: "Qué decir y qué preguntar" },
  { id: "oferta", t: "Me hicieron una oferta", d: "Revisa antes de firmar" },
  { id: "primer", t: "Primer empleo", d: "Sin experiencia también se puede" },
  { id: "salida", t: "Salí de mi trabajo", d: "Lo que te toca y cómo seguir" },
];

export type Guia = {
  id: string;
  etapa: Etapa;
  titulo: string;
  resumen: string;
  minutos: number;
  pasos: string[];
  ejemplo?: { titulo: string; texto: string };
  error: string;
  accion?: { t: string; to: string; hash?: string; search?: Record<string, string> };
};

export const GUIAS: Guia[] = [
  {
    id: "cv-una-pagina", etapa: "cv", minutos: 3,
    titulo: "Tu CV en una página",
    resumen: "Lo que un reclutador mira en los primeros 10 segundos.",
    pasos: [
      "Arriba: nombre, teléfono, correo y provincia. Nada más.",
      "Un perfil de 2 o 3 líneas: qué sabes hacer y qué puesto buscas.",
      "Experiencia de la más reciente a la más vieja. Por cada puesto, 2 o 3 logros, no la lista de tareas.",
      "Estudios y cursos (INFOTEP, diplomados, cursos en línea también cuentan).",
      "Guárdalo en PDF. El Word se desordena en otros equipos.",
    ],
    ejemplo: { titulo: "Tarea vs. logro", texto: "En vez de: «Encargada de caja».\nMejor: «Cuadré caja sin faltantes durante 14 meses y entrené a 3 cajeras nuevas»." },
    error: "Poner foto, edad, estado civil o cédula. No hacen falta para aplicar y en Enlace no se piden.",
    accion: { t: "Hacer mi CV gratis", to: "/cv" },
  },
  {
    id: "cv-por-correo", etapa: "cv", minutos: 2,
    titulo: "Cómo enviar tu CV por correo",
    resumen: "Un correo vacío con un adjunto casi nunca se abre.",
    pasos: [
      "Asunto: el puesto y tu nombre. Así lo encuentran entre cientos.",
      "Cuerpo de 3 o 4 líneas: a qué aplicas, por qué encajas y tu disponibilidad.",
      "Nombra el archivo «CV-Nombre-Apellido.pdf», nunca «CV final final.pdf».",
      "Usa un correo serio: nombre.apellido@…",
    ],
    ejemplo: { titulo: "Correo listo para copiar", texto: "Asunto: Auxiliar de Almacén – María Pérez\n\nBuenos días:\n\nLe escribo para aplicar a la vacante de Auxiliar de Almacén. Tengo 2 años manejando inventario y despacho en una distribuidora, y disponibilidad inmediata en Santo Domingo Este.\n\nAdjunto mi CV. Quedo atenta a su respuesta.\n\nMaría Pérez · 809-000-0000" },
    error: "Mandar el mismo correo genérico a todas las empresas sin cambiar el nombre del puesto.",
    accion: { t: "Ver vacantes", to: "/vacantes" },
  },
  {
    id: "aplicar-con-metodo", etapa: "aplicar", minutos: 2,
    titulo: "Aplica con método, no al azar",
    resumen: "Cinco aplicaciones bien hechas valen más que cincuenta a ciegas.",
    pasos: [
      "Ponte una meta: 5 aplicaciones por semana a puestos donde cumples al menos el 70 % de los requisitos.",
      "Anota cada una: empresa, puesto, fecha y por dónde aplicaste.",
      "A los 7 días hábiles sin respuesta, escribe una sola vez para dar seguimiento.",
      "Activa una alerta para enterarte primero: las vacantes nuevas reciben más atención los primeros días.",
    ],
    ejemplo: { titulo: "Mensaje de seguimiento", texto: "Buenas tardes. El día 3 apliqué a la vacante de Recepcionista y quería saber si el proceso sigue abierto. Sigo muy interesada. Gracias por su tiempo." },
    error: "Escribir todos los días para preguntar. Una vez es interés; más de dos es presión.",
    accion: { t: "Crear una alerta de empleo", to: "/recursos", hash: "alerta" },
  },
  {
    id: "oferta-falsa", etapa: "aplicar", minutos: 2,
    titulo: "Cómo saber si una oferta es falsa",
    resumen: "Si te piden dinero, no es un empleo.",
    pasos: [
      "Ninguna empresa seria cobra por la entrevista, el uniforme, el curso ni la «inscripción».",
      "Nunca compartas el código que te llega por SMS o WhatsApp.",
      "Busca la empresa en internet y llama a su número oficial, no al que te escribió.",
      "Desconfía de sueldos muy altos sin experiencia y de la prisa («solo hoy», «últimos cupos»).",
    ],
    error: "Ir sola o solo a una «entrevista» en una casa o lugar apartado. Avisa siempre a alguien.",
    accion: { t: "Verificar una oferta", to: "/herramientas/verificar-oferta" },
  },
  {
    id: "hablame-de-ti", etapa: "entrevista", minutos: 2,
    titulo: "«Háblame de ti» en un minuto",
    resumen: "La primera pregunta casi siempre es esta. Llévala preparada.",
    pasos: [
      "Presente: qué haces hoy o qué estudiaste.",
      "Pasado: una experiencia o logro que tenga que ver con el puesto.",
      "Futuro: por qué te interesa esta empresa y este puesto.",
      "Practícala en voz alta hasta que dure menos de un minuto.",
    ],
    ejemplo: { titulo: "Respuesta modelo", texto: "Soy técnica en contabilidad y llevo dos años como auxiliar en una ferretería, donde me encargo de la facturación y del cuadre diario. Allí bajé los errores de facturación con un control en Excel. Me interesa este puesto porque quiero crecer en el área contable de una empresa más grande." },
    error: "Contar tu vida desde la escuela o hablar de temas personales y familiares.",
    accion: { t: "Practicar la entrevista", to: "/cv", search: { h: "entrevista" } },
  },
  {
    id: "responder-con-ejemplos", etapa: "entrevista", minutos: 2,
    titulo: "Responde con ejemplos, no con adjetivos",
    resumen: "«Soy responsable» lo dice todo el mundo. Demuéstralo.",
    pasos: [
      "Situación: dónde estabas y qué pasaba.",
      "Acción: qué hiciste tú, en primera persona.",
      "Resultado: cómo terminó, con un número si lo tienes.",
      "Prepara 3 ejemplos: un problema que resolviste, un trabajo en equipo y una vez que te equivocaste y lo corregiste.",
    ],
    ejemplo: { titulo: "Ejemplo corto", texto: "Un cliente llegó molesto porque su pedido salió incompleto (situación). Revisé la factura, le completé el pedido ese mismo día y le avisé al almacén para que no se repitiera (acción). El cliente siguió comprando y ese mes no hubo otra queja igual (resultado)." },
    error: "Hablar mal de tu jefe o empresa anterior. Aunque tengas razón, resta.",
  },
  {
    id: "cuanto-quieres-ganar", etapa: "entrevista", minutos: 2,
    titulo: "«¿Cuánto quieres ganar?»",
    resumen: "Llega con un rango pensado, no con una cifra improvisada.",
    pasos: [
      "Mira cuánto pagan vacantes parecidas en Enlace (el salario está a la vista).",
      "Calcula tu neto: AFP, SFS e ISR se descuentan del bruto.",
      "Da un rango corto y realista, por ejemplo de RD$30,000 a RD$35,000, y di que está abierto según los beneficios.",
      "Si ya trabajas, piensa en lo mínimo que aceptarías antes de la entrevista.",
    ],
    ejemplo: { titulo: "Cómo decirlo", texto: "Según lo que he visto para este puesto, estoy en un rango de RD$30,000 a RD$35,000 brutos. Estoy abierta a conversarlo según los beneficios." },
    error: "Decir «lo que ustedes me quieran pagar». Te deja sin margen.",
    accion: { t: "Calcular mi salario neto", to: "/herramientas/salario-neto" },
  },
  {
    id: "preguntas-al-final", etapa: "entrevista", minutos: 1,
    titulo: "Lo que tú debes preguntar al final",
    resumen: "Preguntar muestra interés. Quedarse callado no.",
    pasos: [
      "¿Cómo es un día normal en este puesto?",
      "¿Qué esperan que logre en los primeros tres meses?",
      "¿Cuáles son los próximos pasos del proceso y cuándo podría saber de ustedes?",
    ],
    error: "Preguntar primero por vacaciones y permisos. Déjalo para cuando haya oferta.",
  },
  {
    id: "entrevista-virtual", etapa: "entrevista", minutos: 1,
    titulo: "Entrevista por videollamada",
    resumen: "Lo técnico también cuenta.",
    pasos: [
      "Prueba el enlace, la cámara y el micrófono el día antes.",
      "Luz de frente (una ventana delante de ti, no detrás) y un fondo sencillo.",
      "Celular acostado y apoyado, a la altura de los ojos.",
      "Conéctate 5 minutos antes, con el CV abierto y algo para anotar.",
    ],
    error: "Hacerla en la calle, en el transporte o con ruido de fondo.",
  },
  {
    id: "antes-de-firmar", etapa: "oferta", minutos: 3,
    titulo: "Antes de aceptar una oferta",
    resumen: "Confirma por escrito lo que te prometieron de palabra.",
    pasos: [
      "Pide la oferta o el contrato por escrito: puesto, salario bruto, horario y lugar de trabajo.",
      "Pregunta si el salario es bruto o neto y calcula cuánto te llega de verdad.",
      "Confirma que te inscriben en la TSS (salud y pensión) desde el primer día.",
      "Pregunta cómo funciona el período de prueba y los beneficios (seguro complementario, bonos, transporte, almuerzo).",
      "Si tienes dos opciones, compáralas con calma, no solo por el sueldo.",
    ],
    error: "Renunciar a tu trabajo actual antes de tener la oferta firmada.",
    accion: { t: "Comparar dos ofertas", to: "/herramientas/comparar-ofertas" },
  },
  {
    id: "sin-experiencia", etapa: "primer", minutos: 2,
    titulo: "Sin experiencia: qué poner en tu CV",
    resumen: "Lo que hiciste fuera de un trabajo también es experiencia.",
    pasos: [
      "Proyectos de la escuela o la universidad, con lo que lograste.",
      "Voluntariado, iglesia, deporte, ferias o el negocio de la familia.",
      "Cursos cortos: INFOTEP, Excel, servicio al cliente, idiomas.",
      "Un perfil que diga qué te gusta hacer y qué puesto buscas.",
    ],
    ejemplo: { titulo: "Perfil para primer empleo", texto: "Bachiller con curso de servicio al cliente en INFOTEP. Ayudé durante dos años en el colmado de mi familia atendiendo clientes y manejando caja. Busco mi primer empleo como cajera o vendedora." },
    error: "Dejar el CV casi vacío o decir «no tengo experiencia» en la primera línea.",
    accion: { t: "Hacer la Brújula del primer empleo", to: "/herramientas/brujula" },
  },
  {
    id: "ajustes-razonables", etapa: "primer", minutos: 2,
    titulo: "Pedir ajustes para tu entrevista",
    resumen: "Si tienes una discapacidad, pedir lo que necesitas es tu derecho.",
    pasos: [
      "Pídelo con tiempo, por escrito, cuando te confirmen la entrevista.",
      "Di lo que necesitas, no tu diagnóstico: acceso, intérprete, más tiempo, formato digital.",
      "Si la empresa no responde o se niega, busca orientación en CONADIS.",
    ],
    ejemplo: { titulo: "Mensaje para el reclutador", texto: "Gracias por invitarme a la entrevista del jueves. Para participar en igualdad de condiciones necesito que el lugar tenga acceso para silla de ruedas. ¿Me pueden confirmar? Si no es posible, puedo hacerla por videollamada." },
    error: "No decir nada y llegar a un lugar donde no puedes entrar o participar bien.",
    accion: { t: "Ver Empleo para todos", to: "/empleo-para-todos" },
  },
  {
    id: "que-me-toca", etapa: "salida", minutos: 2,
    titulo: "Terminó tu trabajo: lo que te toca",
    resumen: "Según cómo terminó, te pueden corresponder prestaciones.",
    pasos: [
      "Si te despidieron sin causa (desahucio), te corresponden preaviso y cesantía, además de vacaciones y regalía proporcionales.",
      "Si renunciaste, igual te toca la regalía proporcional y las vacaciones pendientes.",
      "Pide por escrito la carta de terminación y tu liquidación detallada.",
      "Si no te pagan o no estás de acuerdo, el Ministerio de Trabajo orienta gratis.",
    ],
    error: "Firmar un recibo de «descargo» sin revisar los montos.",
    accion: { t: "Calcular mi liquidación", to: "/herramientas/liquidacion" },
  },
  {
    id: "volver-a-empezar", etapa: "salida", minutos: 1,
    titulo: "Cómo hablar de tu salida en una entrevista",
    resumen: "Corto, honesto y mirando hacia adelante.",
    pasos: [
      "Una o dos frases sobre por qué saliste, sin culpar a nadie.",
      "Lo que aprendiste allí.",
      "Por qué este nuevo puesto te interesa.",
    ],
    ejemplo: { titulo: "Respuesta modelo", texto: "La empresa redujo personal en mi área y mi puesto se eliminó. Allí aprendí a manejar inventario y a coordinar despachos, y eso es justo lo que quiero seguir haciendo en una empresa como esta." },
    error: "Dar detalles de conflictos o hablar mal de la empresa anterior.",
  },
];

/** Formato que usa la portada (tarjetas de «Consejos para tu búsqueda»). */
const NOMBRE_ETAPA: Record<Etapa, string> = { cv: "CV", aplicar: "Aplicar", entrevista: "Entrevista", oferta: "Oferta", primer: "Primer empleo", salida: "Salida" };
export const consejosPortada = ["cv-una-pagina", "hablame-de-ti", "cuanto-quieres-ganar", "sin-experiencia"]
  .map((id) => GUIAS.find((g) => g.id === id)!)
  .map((g) => ({ id: g.id, titulo: g.titulo, resumen: g.resumen, minutos: g.minutos, categoria: NOMBRE_ETAPA[g.etapa] }));

import { lineasLogros, type CV } from "@/lib/cv";

/**
 * Ayudas para escribir el CV: ejemplos por tipo de puesto, verbos de acción y un revisor.
 * Los ejemplos llevan [corchetes] donde la persona debe poner SU dato real: nunca se inventa nada por ella.
 */
export type Rol = { id: string; nombre: string; claves: string[]; resumenes: string[]; logros: string[]; habilidades: string[] };

export const ROLES: Rol[] = [
  {
    id: "cliente", nombre: "Servicio al cliente / Call center", claves: ["servicio", "cliente", "call", "center", "agente", "atencion", "soporte", "bilingue"],
    resumenes: [
      "Agente de servicio al cliente con [X] años atendiendo llamadas, chat y correo. Resuelvo quejas con calma y busco que el cliente quede satisfecho en el primer contacto. Inglés [nivel].",
      "Me gusta ayudar a la gente y explicar las cosas claro. Tengo experiencia en [call center / tienda] y manejo sistemas de tickets y CRM. Busco crecer en servicio al cliente.",
    ],
    logros: [
      "Atendía un promedio de [número] llamadas por turno, cumpliendo la meta de calidad.",
      "Mantuve una satisfacción de clientes de [porcentaje] en las encuestas del mes.",
      "Resolví quejas en la primera llamada en [porcentaje] de los casos.",
      "Entrené a [número] compañeros nuevos en el sistema y los procesos.",
      "Recibí reconocimiento como agente del mes en [mes/año].",
    ],
    habilidades: ["Atención al cliente", "Manejo de quejas", "Inglés conversacional", "CRM", "Zendesk", "Comunicación", "Trabajo bajo presión", "Mecanografía rápida", "Ventas por teléfono", "Empatía"],
  },
  {
    id: "caja", nombre: "Cajero/a / Tienda / Supermercado", claves: ["cajer", "caja", "tienda", "supermercado", "dependiente", "vendedor de piso", "gondolero", "colmado"],
    resumenes: [
      "Cajera con [X] años en supermercado. Manejo efectivo, tarjetas y cierres de caja sin diferencias. Rápida, ordenada y amable con los clientes.",
      "Tengo experiencia en caja y atención en tienda. Cuido el dinero, el orden de los productos y el trato con el cliente. Disponible para turnos rotativos.",
    ],
    logros: [
      "Cuadré la caja sin diferencias durante [número] meses seguidos.",
      "Atendía hasta [número] clientes por turno en horas pico.",
      "Ayudé a reducir las filas organizando la apertura de una segunda caja en horas pico.",
      "Mantuve el área de exhibición ordenada y con precios al día.",
    ],
    habilidades: ["Manejo de caja", "Cuadre de caja", "Punto de venta (POS)", "Atención al cliente", "Inventario", "Reposición de productos", "Manejo de efectivo", "Orden y limpieza", "Trabajo en equipo"],
  },
  {
    id: "ventas", nombre: "Ventas", claves: ["venta", "vendedor", "ejecutivo de ventas", "comercial", "promotor", "asesor"],
    resumenes: [
      "Vendedor con [X] años cumpliendo metas en [sector]. Busco clientes nuevos, doy seguimiento y cierro ventas. Me muevo bien en la calle y por teléfono.",
      "Asesora comercial orientada a resultados. Conozco [productos] y sé escuchar al cliente para ofrecerle lo que necesita.",
    ],
    logros: [
      "Cumplí o superé la meta mensual de ventas [número] de [número] meses.",
      "Abrí [número] clientes nuevos en mi zona en [tiempo].",
      "Aumenté las ventas de mi ruta en [porcentaje] en [tiempo].",
      "Recuperé [número] clientes inactivos con visitas y llamadas de seguimiento.",
    ],
    habilidades: ["Prospección", "Cierre de ventas", "Negociación", "Seguimiento de clientes", "Manejo de objeciones", "Licencia de conducir", "Excel", "Ventas por WhatsApp", "Metas comerciales"],
  },
  {
    id: "almacen", nombre: "Almacén / Logística", claves: ["almacen", "logistica", "despacho", "bodega", "inventario", "montacarg", "recepcion de mercancia", "operario"],
    resumenes: [
      "Auxiliar de almacén con [X] años en recepción, despacho e inventario. Ordenado, puntual y cuidadoso con la mercancía. Manejo montacargas [con certificado].",
      "Tengo experiencia en logística y control de inventario. Me aseguro de que cada pedido salga completo y a tiempo.",
    ],
    logros: [
      "Llevé el inventario semanal de [número] productos sin diferencias.",
      "Despachaba un promedio de [número] pedidos por día sin errores.",
      "Reorganicé el almacén y redujimos el tiempo de búsqueda de productos.",
      "Cero accidentes operando montacargas durante [tiempo].",
    ],
    habilidades: ["Inventario", "Recepción de mercancía", "Despacho", "Montacargas", "Excel básico", "Control de calidad", "Orden y limpieza", "Seguridad industrial", "Trabajo físico"],
  },
  {
    id: "admin", nombre: "Administración / Asistente", claves: ["asistente", "administrativ", "secretari", "recepcionista", "oficina", "auxiliar administrativo"],
    resumenes: [
      "Asistente administrativa con [X] años apoyando gerencias. Manejo agenda, archivo, correspondencia y Excel. Organizada y discreta con la información.",
      "Recepcionista con buena presencia telefónica y trato amable. Organizo citas, recibo visitas y mantengo todo en orden.",
    ],
    logros: [
      "Organicé el archivo físico y digital de [número] expedientes.",
      "Coordiné la agenda de [número] gerentes sin choques de citas.",
      "Preparé reportes semanales en Excel para la gerencia.",
      "Reduje el tiempo de respuesta a correos y llamadas de clientes.",
    ],
    habilidades: ["Microsoft Office", "Excel", "Redacción", "Manejo de agenda", "Archivo", "Atención telefónica", "Facturación", "Organización", "Confidencialidad"],
  },
  {
    id: "contabilidad", nombre: "Contabilidad / Finanzas", claves: ["contab", "contador", "finanz", "auxiliar contable", "cuentas por", "facturacion", "credito", "cobros"],
    resumenes: [
      "Contadora con [X] años en cuentas por pagar y por cobrar, conciliaciones bancarias y declaraciones DGII. Manejo [sistema contable] y Excel avanzado.",
      "Auxiliar contable detallista. Registro, concilio y preparo reportes a tiempo para el cierre de mes.",
    ],
    logros: [
      "Concilié [número] cuentas bancarias mensuales sin diferencias.",
      "Preparé las declaraciones de ITBIS e IR-17 a tiempo durante [tiempo].",
      "Reduje la cartera vencida en [porcentaje] con un plan de cobros.",
      "Acorté el cierre contable de [número] a [número] días.",
    ],
    habilidades: ["Contabilidad general", "Conciliaciones bancarias", "DGII", "Cuentas por pagar", "Cuentas por cobrar", "Excel avanzado", "Nómina", "TSS", "Facturación electrónica"],
  },
  {
    id: "chofer", nombre: "Chofer / Mensajero", claves: ["chofer", "conductor", "mensajer", "repartidor", "delivery", "motorizado"],
    resumenes: [
      "Chofer con licencia categoría [número] y [X] años de experiencia sin accidentes. Conozco bien [ciudad/zona] y cuido el vehículo y la carga.",
      "Mensajero responsable con motor propio. Entrego a tiempo y mantengo comunicación con el cliente.",
    ],
    logros: [
      "Realizaba [número] entregas diarias a tiempo.",
      "Cero accidentes ni multas en [tiempo] de trabajo.",
      "Cuidé el mantenimiento del vehículo y reporté averías a tiempo.",
    ],
    habilidades: ["Licencia de conducir", "Conocimiento de rutas", "Manejo defensivo", "Carga y descarga", "Cobros contra entrega", "Puntualidad", "Uso de GPS"],
  },
  {
    id: "turismo", nombre: "Hotelería / Turismo / Restaurante", claves: ["hotel", "turismo", "camarer", "mesero", "bartender", "cocin", "recepcion de hotel", "housekeeping", "ama de llaves", "animador", "chef"],
    resumenes: [
      "Mesero con [X] años en hoteles todo incluido. Atiendo con buena actitud a huéspedes de distintos países. Inglés [nivel].",
      "Trabajo en hotelería con experiencia en [área]. Me gusta que el huésped viva una buena experiencia.",
    ],
    logros: [
      "Atendía hasta [número] mesas por turno en temporada alta.",
      "Recibí comentarios positivos de huéspedes en [plataforma/encuestas].",
      "Mantuve los estándares de limpieza en [número] habitaciones diarias.",
    ],
    habilidades: ["Servicio al huésped", "Inglés", "Bar y coctelería", "Manipulación de alimentos", "Trabajo en equipo", "Turnos rotativos", "Housekeeping", "Protocolo de mesa"],
  },
  {
    id: "tecnologia", nombre: "Tecnología / Sistemas", claves: ["sistemas", "tecnolog", "programad", "desarrollador", "soporte tecnico", "informatica", "redes", "analista de datos"],
    resumenes: [
      "Técnico en soporte con [X] años resolviendo problemas de computadoras, redes e impresoras. Paciente para explicar a los usuarios.",
      "Desarrollador [área] con experiencia en [lenguajes]. Me gusta construir cosas que funcionen y sean fáciles de usar.",
    ],
    logros: [
      "Resolví un promedio de [número] tickets de soporte por semana.",
      "Implementé [sistema/herramienta] para [número] usuarios.",
      "Automaticé [proceso] y ahorramos [horas] por semana.",
    ],
    habilidades: ["Soporte técnico", "Redes", "Windows", "Office 365", "Excel", "SQL", "JavaScript", "Python", "Reparación de equipos", "Atención a usuarios"],
  },
  {
    id: "produccion", nombre: "Producción / Zona franca", claves: ["produccion", "operari", "zona franca", "ensambl", "manufactur", "calidad", "costur"],
    resumenes: [
      "Operaria de producción con [X] años en zona franca. Cumplo metas de producción con calidad y sigo las normas de seguridad.",
      "Tengo experiencia en líneas de ensamblaje y control de calidad. Aprendo rápido nuevos procesos.",
    ],
    logros: [
      "Cumplí la meta de producción diaria [porcentaje] del tiempo.",
      "Mantuve un nivel de defectos por debajo de [porcentaje].",
      "Aprendí a operar [número] máquinas distintas de la línea.",
    ],
    habilidades: ["Ensamblaje", "Control de calidad", "Normas de seguridad", "Buenas prácticas de manufactura", "Trabajo por metas", "Turnos rotativos", "Manejo de máquinas"],
  },
  {
    id: "primer", nombre: "Primer empleo / Estudiante", claves: ["estudiante", "primer empleo", "pasante", "pasantia", "bachiller", "sin experiencia"],
    resumenes: [
      "Bachiller con muchas ganas de aprender y empezar mi vida laboral. Soy puntual, me llevo bien con la gente y aprendo rápido. Disponible [horario].",
      "Estudiante de [carrera] en [universidad]. Busco mi primera oportunidad en [área] para aplicar lo que estoy aprendiendo.",
    ],
    logros: [
      "Hice mi pasantía en [empresa], donde apoyé en [tareas].",
      "Participé como voluntario en [actividad] durante [tiempo].",
      "Organicé [actividad] en mi liceo/universidad con [número] participantes.",
      "Terminé el curso de [curso] en INFOTEP.",
    ],
    habilidades: ["Aprendizaje rápido", "Puntualidad", "Trabajo en equipo", "Microsoft Office", "Redes sociales", "Comunicación", "Responsabilidad", "Inglés básico"],
  },
];

export const VERBOS = ["Atendí", "Logré", "Aumenté", "Reduje", "Organicé", "Coordiné", "Vendí", "Resolví", "Entrené", "Implementé", "Mejoré", "Lideré", "Preparé", "Manejé", "Supervisé", "Cumplí"];

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Adivina el tipo de puesto por lo que escribió en «Puesto que buscas» o en su experiencia. */
export function rolDe(cv: Pick<CV, "puesto" | "experiencia">): Rol | null {
  const t = sinAcentos([cv.puesto, ...cv.experiencia.map((e) => e.puesto)].join(" "));
  if (!t.trim()) return null;
  let mejor: Rol | null = null, max = 0;
  for (const r of ROLES) {
    const n = r.claves.filter((k) => t.includes(sinAcentos(k))).length;
    if (n > max) { max = n; mejor = r; }
  }
  return mejor;
}

export const IDIOMAS = ["Español", "Inglés", "Francés", "Portugués", "Italiano", "Alemán", "Creole"];
export const NIVELES = ["Nativo", "Avanzado", "Intermedio", "Básico"];

/* ───────── Revisor ───────── */

export type Aviso = { tipo: "error" | "mejora" | "bien"; texto: string; seccion: string };
const DEBILES = ["responsable", "proactiv", "trabajo bajo presion", "dinamic", "honest", "puntual", "persona seria", "buena presencia", "multitask", "excelentes relaciones"];

export function revisar(cv: CV): { puntos: number; avisos: Aviso[] } {
  const avisos: Aviso[] = [];
  const exp = cv.experiencia.filter((e) => e.puesto.trim());
  const logros = exp.flatMap((e) => lineasLogros(e.logros));
  const correo = cv.correo.trim().toLowerCase();

  if (!cv.nombre.trim()) avisos.push({ tipo: "error", seccion: "datos", texto: "Falta tu nombre." });
  if (!cv.telefono.trim() && !correo) avisos.push({ tipo: "error", seccion: "datos", texto: "Pon un teléfono o un correo: sin eso no te pueden llamar." });
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) avisos.push({ tipo: "error", seccion: "datos", texto: "Tu correo parece mal escrito." });
  if (correo && /(sexy|bebe|beb[eé]|lind|princes|papi|mami|loc[oa]|chul|bell[oa]|amor|hot|69|420)/.test(correo)) avisos.push({ tipo: "mejora", seccion: "datos", texto: "Usa un correo serio, con tu nombre (ej.: maria.perez@gmail.com)." });
  if (cv.nombre && cv.nombre === cv.nombre.toUpperCase() && cv.nombre.length > 4) avisos.push({ tipo: "mejora", seccion: "datos", texto: "Escribe tu nombre en minúsculas con la primera letra en mayúscula." });
  if (!cv.puesto.trim()) avisos.push({ tipo: "mejora", seccion: "datos", texto: "Di qué puesto buscas: el reclutador entiende en un segundo para qué eres." });

  const r = cv.resumen.trim();
  if (!r) avisos.push({ tipo: "mejora", seccion: "perfil", texto: "Escribe 2 o 3 líneas sobre ti: es lo primero que leen." });
  else {
    if (r.length > 450) avisos.push({ tipo: "mejora", seccion: "perfil", texto: "Tu perfil es largo. Déjalo en 2 o 3 líneas." });
    const d = DEBILES.filter((w) => sinAcentos(r).includes(w));
    if (d.length >= 2) avisos.push({ tipo: "mejora", seccion: "perfil", texto: "Cambia palabras que todos usan (responsable, proactivo…) por algo concreto que sepas hacer." });
    if (/\[[^\]]+\]/.test(r)) avisos.push({ tipo: "error", seccion: "perfil", texto: "Tu perfil todavía tiene [corchetes]: cámbialos por tus datos reales." });
  }

  if (!exp.length) avisos.push({ tipo: "mejora", seccion: "experiencia", texto: "Agrega experiencia. Si es tu primer empleo, pon pasantías, voluntariado o trabajos informales." });
  else {
    if (!logros.length) avisos.push({ tipo: "mejora", seccion: "experiencia", texto: "Cuenta qué lograste en cada trabajo, una idea por línea." });
    else if (!logros.some((l) => /\d/.test(l))) avisos.push({ tipo: "mejora", seccion: "experiencia", texto: "Pon números en tus logros (clientes por día, metas, %). Llaman mucho la atención." });
    if (logros.some((l) => /\[[^\]]+\]/.test(l))) avisos.push({ tipo: "error", seccion: "experiencia", texto: "Algunos logros tienen [corchetes]: cámbialos por tus números reales o bórralos." });
    if (exp.some((e) => !e.desde.trim())) avisos.push({ tipo: "mejora", seccion: "experiencia", texto: "Pon desde cuándo estuviste en cada trabajo." });
    if (logros.some((l) => /^(encargad|responsable|me encargaba|ayudaba|mis funciones|funciones|tareas)/i.test(sinAcentos(l)))) avisos.push({ tipo: "mejora", seccion: "experiencia", texto: "Algunos logros empiezan con «encargado de…». Toca «Mejorar redacción» para empezar con un verbo de acción." });
    else if (logros.some((l) => /^[a-záéíóúñ]/.test(l))) avisos.push({ tipo: "mejora", seccion: "experiencia", texto: "Empieza cada logro con mayúscula." });
  }
  if (!cv.educacion.some((e) => e.titulo.trim())) avisos.push({ tipo: "mejora", seccion: "formacion", texto: "Agrega tu formación (bachiller, técnico o carrera)." });
  const hab = cv.habilidades.split(",").map((h) => h.trim()).filter(Boolean);
  if (hab.length < 4) avisos.push({ tipo: "mejora", seccion: "habilidades", texto: "Agrega al menos 4 habilidades que tengan que ver con el puesto." });
  if (hab.length > 14) avisos.push({ tipo: "mejora", seccion: "habilidades", texto: "Tienes muchas habilidades. Deja las 8 a 12 más importantes." });
  if (!cv.idiomas.trim()) avisos.push({ tipo: "mejora", seccion: "habilidades", texto: "Pon tus idiomas, aunque sea solo español." });

  // Lo que está bien también se dice.
  if (logros.some((l) => /\d/.test(l))) avisos.push({ tipo: "bien", seccion: "experiencia", texto: "Tus logros tienen números. Muy bien." });
  if (r && r.length <= 450 && r.length > 60) avisos.push({ tipo: "bien", seccion: "perfil", texto: "Tu perfil tiene buen largo." });
  if (hab.length >= 4 && hab.length <= 14) avisos.push({ tipo: "bien", seccion: "habilidades", texto: "Buena cantidad de habilidades." });

  const errores = avisos.filter((a) => a.tipo === "error").length, mejoras = avisos.filter((a) => a.tipo === "mejora").length;
  return { puntos: Math.max(0, Math.min(100, 100 - errores * 15 - mejoras * 7)), avisos };
}

/* ───────── Carta de presentación ───────── */

export function carta(cv: CV, puesto: string, empresa: string): string {
  const exp = cv.experiencia.find((e) => e.puesto.trim());
  const logro = exp ? lineasLogros(exp.logros).find((l) => !/\[/.test(l)) : undefined;
  const hab = cv.habilidades.split(",").map((h) => h.trim()).filter(Boolean).slice(0, 3);
  const nombre = cv.nombre.trim() || "[Tu nombre]";
  const destino = empresa.trim() ? `del equipo de ${empresa.trim()}` : "de su equipo";
  const p = [
    `${cv.ciudad.trim() || "Santo Domingo"}, ${new Date().toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}`,
    "",
    `Señores de ${empresa.trim() || "[nombre de la empresa]"}:`,
    "",
    `Les escribo para presentar mi interés en la vacante de ${puesto.trim() || cv.puesto.trim() || "[puesto]"}. Me gustaría formar parte ${destino}.`,
    "",
    exp ? `${exp.hasta.trim() ? "Trabajé" : "Actualmente trabajo"} como ${exp.puesto.trim()}${exp.empresa.trim() ? ` en ${exp.empresa.trim()}` : ""}${logro ? `, donde ${logro.charAt(0).toLowerCase()}${logro.slice(1).replace(/\.$/, "")}` : ""}.` : "Aunque estoy empezando mi vida laboral, tengo muchas ganas de aprender y aportar desde el primer día.",
    "",
    hab.length ? `Entre mis fortalezas están: ${hab.map((h) => (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(h) ? h.charAt(0).toLowerCase() + h.slice(1) : h)).join(", ")}.` : "",
    "",
    "Adjunto mi currículum. Quedo disponible para una entrevista en el horario que les convenga.",
    "",
    "Atentamente,",
    "",
    nombre,
    [cv.telefono.trim(), cv.correo.trim()].filter(Boolean).join(" · "),
  ];
  return p.filter((x, i, a) => !(x === "" && a[i - 1] === "")).join("\n");
}

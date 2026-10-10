export const provincias = [
  "Toda República Dominicana",
  "Distrito Nacional",
  "Santo Domingo",
  "Santiago",
  "La Altagracia (Punta Cana)",
  "La Romana",
  "Puerto Plata",
  "San Cristóbal",
  "San Pedro de Macorís",
  "Duarte (San Francisco)",
  "Remoto desde RD",
];

export const areas = ["Administración", "Recursos Humanos", "Ventas", "Tecnología", "Operaciones", "Contabilidad y Finanzas", "Producción", "Logística", "Servicio al Cliente", "Salud", "Hotelería y Turismo"] as const;

export const modalidades = ["Presencial", "Híbrido", "Remoto", "Campo"] as const;

export const tiposEmpleo = ["Tiempo completo", "Medio tiempo", "Pasantía", "Por proyecto"] as const;

export const nivelesExperiencia = ["Sin experiencia", "1-3 años", "3+ años"] as const;

export const rangosSalario = [
  { label: "Desde RD$20,000", min: 20000 },
  { label: "Desde RD$30,000", min: 30000 },
  { label: "Desde RD$50,000", min: 50000 },
  { label: "Desde RD$80,000", min: 80000 },
] as const;

export const planes = [
  { nombre: "Publicación Gratis", precio: "RD$0", unidad: "sin límite", resumen: "Envíanos tu vacante. La revisamos y la publicamos sin costo.", beneficios: ["Revisamos tu vacante antes de publicarla", "Visible en Enlace RD por 30 días", "Los candidatos te contactan por el medio que indiques", "Empresa y fuente visibles para generar confianza"], cta: "Publicar gratis" },
  { nombre: "Vacante Destacada 7 días", precio: "RD$500", unidad: "por vacante", resumen: "Tu vacante sale arriba del listado, marcada como Destacada, y la compartimos en nuestros canales.", beneficios: ["Primera posición del listado por 7 días", "Etiqueta “Destacada” en la vacante", "La compartimos en nuestros canales de WhatsApp y redes"], cta: "Destacar por RD$500", popular: true },
  { nombre: "Plan Empresa", precio: "RD$1,900", unidad: "por mes", resumen: "Para quien contrata seguido.", beneficios: ["4 vacantes destacadas al mes", "Publicación prioritaria de tus vacantes", "Atención directa por WhatsApp"], cta: "Quiero este plan" },
  { nombre: "Reclutamiento Asistido", precio: "RD$5,900", unidad: "por posición cubierta", resumen: "Hacemos el proceso por ti: filtramos, entrevistamos y te enviamos los mejores perfiles.", impulso: "Pagas solo si contratas", beneficios: ["Filtro de candidatos por una reclutadora", "Entrevistas por competencias", "Terna final para tu decisión"], cta: "Solicitar propuesta" },
];

export const comparativa = [
  { fila: "Publicación sin costo", gratis: true, destacada: true },
  { fila: "Revisión antes de publicar", gratis: true, destacada: true },
  { fila: "Visible 30 días", gratis: true, destacada: true },
  { fila: "Primera posición del listado (7 días)", gratis: false, destacada: true },
  { fila: "Etiqueta “Destacada”", gratis: false, destacada: true },
  { fila: "Compartida en nuestros canales", gratis: false, destacada: true },
];

export const serviciosCandidato = [
  { nombre: "Perfil Gratis", precio: "RD$0", beneficios: ["Aplica a todas las vacantes", "Consejos y guías de empleo"] },
  { nombre: "CV Revisado por una Reclutadora", precio: "RD$500", beneficios: ["Revisión línea por línea", "Sugerencias para pasar filtros automáticos (ATS)", "Carta de presentación modelo"] },
];

export const consejos = [
  { titulo: "Tu CV en una página: lo que sí revisa un reclutador dominicano", resumen: "Coloca tu experiencia más reciente arriba, con logros medibles y no solo tareas.", minutos: 4, categoria: "CV" },
  { titulo: "Cómo responder «¿cuánto quieres ganar?» en RD", resumen: "Investiga el rango del mercado, da un rango con base y evita cerrar la conversación con una cifra única.", minutos: 5, categoria: "Entrevista" },
  { titulo: "Primer empleo sin experiencia: 5 formas de demostrar valor", resumen: "Voluntariados, proyectos de clase y cursos cortos cuentan. Aprende a presentarlos como experiencia real.", minutos: 6, categoria: "Primer empleo" },
  { titulo: "Derechos básicos: contrato, TSS y período de prueba", resumen: "Antes de firmar, verifica tipo de contrato, inscripción en la TSS y las condiciones del período de prueba.", minutos: 7, categoria: "Derechos laborales" },
  { titulo: "Entrevista accesible: qué puedes pedir y cómo pedirlo", resumen: "Solicitar ajustes razonables es tu derecho. Te damos el texto exacto para escribirle al reclutador.", minutos: 5, categoria: "Inclusión" },
  { titulo: "Señales de una oferta de empleo falsa", resumen: "Nunca pagues por ser contratado. Revisa dominio del correo, dirección física y proceso de entrevista.", minutos: 3, categoria: "Seguridad" },
];

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
  { nombre: "Publicación Gratis", precio: "RD$0", unidad: "vacantes ilimitadas", resumen: "Publicar en Enlace Laboral es gratis siempre. Solo necesitas crear tu cuenta de reclutador.", beneficios: ["Vacantes ilimitadas activas 30 días", "Recepción de aplicaciones en tu panel y correo", "Filtro básico por provincia y área", "Registro verificado de empresa (sin costo)"], cta: "Crear cuenta y publicar gratis" },
  { nombre: "Vacante Destacada 7 días", precio: "RD$500", unidad: "por vacante", resumen: "El impulso que llena la plaza rápido: tu vacante arriba, con sello dorado y difusión activa.", impulso: "Hasta 8x más candidatos que una vacante gratis", beneficios: ["Posición fija arriba del listado + sello dorado", "Difusión en alertas por WhatsApp, correo y redes", "Enlace Match prioritario: te empuja los mejores perfiles", "Enlace Smart Screen: preguntas filtro automáticas", "Panel con vistas, aplicaciones y ranking IA en vivo", "Si no recibes 10 aplicaciones, repetimos el impulso gratis"], cta: "Destacar por RD$500", popular: true },
  { nombre: "Plan Empresa Gold", precio: "RD$1,900", unidad: "por mes", resumen: "Para quien contrata seguido: destacadas incluidas y búsqueda directa en la base de talento.", impulso: "4 destacadas incluidas (valor RD$2,000)", beneficios: ["4 vacantes destacadas al mes incluidas", "Enlace Talent Radar: busca y contacta CVs directo", "Página de empresa con sello Enlace Trust", "Logo de la empresa en resultados de búsqueda", "Reportes mensuales de mercado y salarios (Salary IQ)", "Soporte por WhatsApp con especialista"], cta: "Activar Gold por RD$1,900" },
  { nombre: "Reclutamiento Asistido", precio: "RD$5,900", unidad: "por posición cubierta", resumen: "Nosotros hacemos el proceso: filtramos, entrevistamos y te enviamos la terna.", impulso: "Pagas solo cuando contratas", beneficios: ["Terna final de 3 candidatos evaluados", "Entrevistas por competencias con especialista", "Verificación de referencias y antecedentes", "Garantía de reemplazo 30 días"], cta: "Solicitar propuesta" },
];

export const comparativa = [
  { fila: "Vacantes ilimitadas", gratis: true, destacada: true },
  { fila: "Aplicaciones en tu panel", gratis: true, destacada: true },
  { fila: "Posición arriba del listado", gratis: false, destacada: true },
  { fila: "Sello dorado y logo visible", gratis: false, destacada: true },
  { fila: "Alertas WhatsApp + correo a candidatos", gratis: false, destacada: true },
  { fila: "Ranking IA de aplicantes (Smart Screen)", gratis: false, destacada: true },
  { fila: "Métricas en vivo de la vacante", gratis: false, destacada: true },
  { fila: "Garantía: 10 aplicaciones o repetimos", gratis: false, destacada: true },
];

export const serviciosCandidato = [
  { nombre: "Perfil Gratis", precio: "RD$0", beneficios: ["Aplica a todas las vacantes", "Alertas por correo", "Consejos y guías de empleo"] },
  { nombre: "CV Revisado por Especialista", precio: "RD$500", beneficios: ["Revisión línea por línea", "Versión optimizada para filtros ATS", "Carta de presentación modelo"] },
  { nombre: "Perfil Destacado (30 días)", precio: "RD$300", beneficios: ["Apareces primero ante reclutadores", "Simulación de entrevista con IA", "Alertas prioritarias por WhatsApp"] },
];

export const consejos = [
  { titulo: "Tu CV en una página: lo que sí revisa un reclutador dominicano", resumen: "Coloca tu experiencia más reciente arriba, con logros medibles y no solo tareas.", minutos: 4, categoria: "CV" },
  { titulo: "Cómo responder «¿cuánto quieres ganar?» en RD", resumen: "Investiga el rango del mercado, da un rango con base y evita cerrar la conversación con una cifra única.", minutos: 5, categoria: "Entrevista" },
  { titulo: "Primer empleo sin experiencia: 5 formas de demostrar valor", resumen: "Voluntariados, proyectos de clase y cursos cortos cuentan. Aprende a presentarlos como experiencia real.", minutos: 6, categoria: "Primer empleo" },
  { titulo: "Derechos básicos: contrato, TSS y período de prueba", resumen: "Antes de firmar, verifica tipo de contrato, inscripción en la TSS y las condiciones del período de prueba.", minutos: 7, categoria: "Derechos laborales" },
  { titulo: "Entrevista accesible: qué puedes pedir y cómo pedirlo", resumen: "Solicitar ajustes razonables es tu derecho. Te damos el texto exacto para escribirle al reclutador.", minutos: 5, categoria: "Inclusión" },
  { titulo: "Señales de una oferta de empleo falsa", resumen: "Nunca pagues por ser contratado. Revisa dominio del correo, dirección física y proceso de entrevista.", minutos: 3, categoria: "Seguridad" },
];

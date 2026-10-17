/** Servicios pagados de Enlace Laboral para candidatos. Los precios se validan también en la base de datos (función crear_pedido). */
export type Paquete = {
  id: "cv" | "impulso" | "entrevista" | "despegue";
  nombre: string;
  precio: number;
  etiqueta?: string;
  resumen: string;
  incluye: string[];
  entrega: string;
};

export const PAQUETES: Paquete[] = [
  {
    id: "cv",
    nombre: "CV Profesional",
    precio: 500,
    resumen: "Tu CV redactado y diseñado para que pase los filtros y llame la atención.",
    incluye: ["Tu CV reescrito con logros y palabras clave del puesto", "Formato limpio, compatible con los sistemas que leen CVs", "Entrega en PDF y Word para que lo edites", "1 ronda de ajustes sin costo"],
    entrega: "Listo en menos de 24 horas",
  },
  {
    id: "impulso",
    nombre: "Pack Impulso",
    precio: 999,
    etiqueta: "Más elegido",
    resumen: "Todo lo que necesitas para aplicar con ventaja, en un solo pedido.",
    incluye: ["Todo lo del CV Profesional", "Carta de presentación lista para enviar", "Perfil de LinkedIn escrito: titular, resumen y experiencia", "Texto de perfil listo para pegar en Computrabajo y otros portales, con guía paso a paso", "Revisión de tu CV frente a una vacante real que tú elijas", "2 rondas de ajustes"],
    entrega: "Listo en menos de 24 horas",
  },
  {
    id: "entrevista",
    nombre: "Orientación en vivo",
    precio: 2000,
    resumen: "Una sesión por videollamada con una persona con experiencia en reclutamiento y empleabilidad.",
    incluye: ["Sesión individual de 45 a 60 minutos", "Revisión de tu CV y de tu perfil en vivo", "Simulacro de entrevista con retroalimentación", "Estrategia de búsqueda y negociación salarial", "Resumen escrito con tus próximos pasos"],
    entrega: "Te escribimos en menos de 24 horas para agendar",
  },
  {
    id: "despegue",
    nombre: "Combo Despegue",
    precio: 2499,
    etiqueta: "Ahorras RD$500",
    resumen: "El Pack Impulso más la Orientación en vivo, para salir con documentos listos y con práctica real.",
    incluye: ["Todo el Pack Impulso", "Toda la Orientación en vivo", "Tu CV mejorado después de la sesión, con lo que hablaron", "Prioridad en la cola de entrega"],
    entrega: "Documentos en menos de 24 horas; sesión agendada contigo",
  },
];

export const pesosRD = (n: number) => `RD$${n.toLocaleString("es-DO")}`;
export const buscarPaquete = (id: string) => PAQUETES.find((p) => p.id === id);

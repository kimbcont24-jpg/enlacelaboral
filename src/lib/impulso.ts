import { useEffect, useState } from "react";

/**
 * Servicios pagados de Enlace Laboral para candidatos.
 * Oferta de lanzamiento con fecha real: hasta ese momento rige `lanzamiento`; después rige `normal`.
 * La base de datos (función crear_pedido) aplica los mismos precios y la misma fecha. Si cambias uno, cambia el otro.
 */
export const OFERTA_HASTA = new Date("2026-12-01T03:59:59Z"); // 30 de noviembre de 2026, 11:59 p. m. en República Dominicana
export const OFERTA_TEXTO = "30 de noviembre";

export type Paquete = {
  id: "cv" | "impulso" | "entrevista" | "despegue";
  nombre: string;
  lanzamiento: number;
  normal: number;
  etiqueta?: string;
  resumen: string;
  paraQuien: string;
  incluye: string[];
  entrega: string;
};

export const PAQUETES: Paquete[] = [
  {
    id: "cv",
    nombre: "CV Profesional",
    lanzamiento: 500,
    normal: 800,
    resumen: "Tu CV redactado y diseñado para que pase los filtros y llame la atención.",
    paraQuien: "Para quien ya sabe qué puesto busca y solo necesita un buen CV.",
    incluye: ["Tu CV reescrito con logros y palabras clave del puesto", "Formato limpio, compatible con los sistemas que leen CVs", "Entrega en PDF y Word para que lo edites", "1 ronda de ajustes sin costo"],
    entrega: "Listo en menos de 24 horas",
  },
  {
    id: "impulso",
    nombre: "Pack Impulso",
    lanzamiento: 999,
    normal: 1499,
    etiqueta: "Más elegido",
    resumen: "Todo lo que necesitas para aplicar con ventaja, en un solo pedido.",
    paraQuien: "Para quien aplica a varias vacantes y quiere verse profesional en todos lados.",
    incluye: ["Todo lo del CV Profesional", "Carta de presentación lista para enviar", "Perfil de LinkedIn escrito: titular, resumen y experiencia", "Texto de perfil listo para pegar en portales de empleo, con guía paso a paso", "Revisión de tu CV frente a una vacante real que tú elijas", "2 rondas de ajustes"],
    entrega: "Listo en menos de 24 horas",
  },
  {
    id: "entrevista",
    nombre: "Orientación en vivo",
    lanzamiento: 2000,
    normal: 2800,
    resumen: "Una sesión por videollamada con una persona con experiencia en reclutamiento y empleabilidad.",
    paraQuien: "Para quien tiene entrevistas, quiere cambiar de carrera o no sabe por dónde empezar.",
    incluye: ["Sesión individual de 45 a 60 minutos", "Revisión de tu CV y de tu perfil en vivo", "Simulacro de entrevista con retroalimentación", "Estrategia de búsqueda y negociación salarial", "Resumen escrito con tus próximos pasos"],
    entrega: "Te escribimos en menos de 24 horas para agendar",
  },
  {
    id: "despegue",
    nombre: "Combo Despegue",
    lanzamiento: 2499,
    normal: 3799,
    etiqueta: "El mejor valor",
    resumen: "El Pack Impulso más la Orientación en vivo: documentos listos y práctica real.",
    paraQuien: "Para quien quiere hacerlo bien de una vez y salir a buscar con todo listo.",
    incluye: ["Todo el Pack Impulso", "Toda la Orientación en vivo", "Tu CV mejorado después de la sesión, con lo que hablaron", "Prioridad en la cola de entrega"],
    entrega: "Documentos en menos de 24 horas; sesión agendada contigo",
  },
];

export const pesosRD = (n: number) => `RD$${n.toLocaleString("es-DO")}`;
export const ofertaVigente = (ahora = Date.now()) => ahora < OFERTA_HASTA.getTime();
export const precioActual = (p: Paquete, ahora = Date.now()) => (ofertaVigente(ahora) ? p.lanzamiento : p.normal);

/** Cuenta regresiva real hasta el cierre de la oferta. Empieza en null para no desajustar el HTML del servidor. */
export function useCuentaRegresiva() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const t = () => setMs(Math.max(0, OFERTA_HASTA.getTime() - Date.now()));
    t();
    const id = setInterval(t, 1000);
    return () => clearInterval(id);
  }, []);
  if (ms === null) return null;
  const s = Math.floor(ms / 1000);
  return { vigente: ms > 0, dias: Math.floor(s / 86400), horas: Math.floor((s % 86400) / 3600), min: Math.floor((s % 3600) / 60), seg: s % 60 };
}

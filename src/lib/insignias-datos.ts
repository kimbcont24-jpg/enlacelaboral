/** Datos de las insignias de Perfila (sin dependencias, para el CV y el servidor). */
export const PERFILA = {
  azul: "#06004b",
  violeta: "#5B39F9",
  amarillo: "#f9c400",
  url: "https://talent-do-ai.lovable.app",
} as const;

export type PruebaInsignia = "servicio_cliente" | "excel_word" | "ortografia_redaccion" | "calculo_caja";
export type Nivel = "destacado" | "solido";

export type InfoPrueba = {
  id: PruebaInsignia;
  nombre: string;
  corto: string;
  minutos: number;
  queMide: string;
  paraQuien: string;
  /** Palabras del puesto o del área para recomendarla. */
  claves: string[];
  color: string;
};

export const PRUEBAS: InfoPrueba[] = [
  {
    id: "servicio_cliente", nombre: "Servicio al cliente", corto: "Servicio", minutos: 12,
    queMide: "Cómo escuchas, resuelves y das seguimiento; cómo manejas a un cliente molesto y cómo te comunicas por teléfono, WhatsApp y en persona.",
    paraQuien: "Call center, tiendas, banca, salud, hoteles y recepción.",
    claves: ["servicio", "cliente", "call center", "recepcion", "cajer", "ventas", "hotel", "atencion", "agente"], color: "#5B39F9",
  },
  {
    id: "excel_word", nombre: "Excel y Word en la oficina", corto: "Excel y Word", minutos: 15,
    queMide: "Fórmulas, tablas, filtros y formato en Excel; documentos, estilos y correspondencia en Word.",
    paraQuien: "Asistentes, auxiliares, contabilidad, recursos humanos y cualquier puesto de oficina.",
    claves: ["asistente", "auxiliar", "administrativ", "contab", "oficina", "excel", "secretari", "analista", "recursos humanos"], color: "#12a5a0",
  },
  {
    id: "ortografia_redaccion", nombre: "Ortografía y redacción", corto: "Redacción", minutos: 12,
    queMide: "Acentos, puntuación, uso correcto de las palabras y cómo escribes un correo o un aviso claro.",
    paraQuien: "Recepción, secretariado, servicio al cliente por escrito, mercadeo y oficina.",
    claves: ["recepcion", "secretari", "redact", "mercadeo", "comunicacion", "asistente", "correo", "contenido"], color: "#f2557a",
  },
  {
    id: "calculo_caja", nombre: "Cálculo para caja y ventas", corto: "Caja", minutos: 10,
    queMide: "Cambio, descuentos, ITBIS, porcentajes y cuadre de caja, rápido y sin errores.",
    paraQuien: "Cajeros, vendedores, despacho, farmacia, supermercados y tiendas.",
    claves: ["caja", "cajer", "venta", "vendedor", "despach", "farmacia", "supermercado", "tienda", "almacen", "mercaderista"], color: "#d99a00",
  },
];

export const infoPrueba = (id: string) => PRUEBAS.find((p) => p.id === id) ?? null;
export const NIVEL_TXT: Record<Nivel, string> = { destacado: "Destacado", solido: "Sólido" };

/** Insignia ganada: va dentro del CV. */
export type Insignia = { ref: string; prueba: PruebaInsignia; nivel: Nivel; fecha: string };

export const verificarUrl = (ref: string) => `https://enlacelaboralrd.com/insignias/${ref}`;

export function esInsignia(i: unknown): i is Insignia {
  const x = i as Insignia | null;
  return !!x && typeof x.ref === "string" && !!infoPrueba(x.prueba) && (x.nivel === "destacado" || x.nivel === "solido");
}

/** Bloque para el CV en texto (aplicar, WhatsApp). */
export function textoInsignias(l: Insignia[]): string {
  if (!l.length) return "";
  return `\nHabilidades verificadas por Perfila\n${l.map((i) => `• ${infoPrueba(i.prueba)?.nombre ?? i.prueba}: nivel ${NIVEL_TXT[i.nivel]} (verifícala en ${verificarUrl(i.ref)})`).join("\n")}`;
}

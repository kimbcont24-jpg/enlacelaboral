import { Cookie, HeartHandshake, LifeBuoy, ReceiptText, ScrollText, ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";

export type RutaLegal = "/terminos" | "/privacidad" | "/cookies" | "/reembolsos" | "/seguridad" | "/nosotros" | "/contacto";

/** Todas las páginas de confianza. Se usan en el centro legal, al final de cada página y en el pie. */
export const PAGINAS_LEGALES: { to: RutaLegal; t: string; d: string; I: LucideIcon }[] = [
  { to: "/seguridad", t: "Empleo seguro", d: "Cómo reconocer una estafa y qué hacer si te pasa.", I: ShieldAlert },
  { to: "/terminos", t: "Términos y condiciones", d: "Las reglas para candidatos y empresas.", I: ScrollText },
  { to: "/privacidad", t: "Privacidad", d: "Qué datos guardamos, quién los ve y tus derechos.", I: ShieldCheck },
  { to: "/cookies", t: "Cookies", d: "Sin publicidad ni rastreo. Qué guarda tu navegador.", I: Cookie },
  { to: "/reembolsos", t: "Pagos y reembolsos", d: "Cuándo pagas y cuándo te devolvemos tu dinero.", I: ReceiptText },
  { to: "/nosotros", t: "Quiénes somos", d: "Qué es Enlace Laboral y en qué creemos.", I: HeartHandshake },
  { to: "/contacto", t: "Contacto y ayuda", d: "Preguntas frecuentes, mensajes y reportes.", I: LifeBuoy },
];


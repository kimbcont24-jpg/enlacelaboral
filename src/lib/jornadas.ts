import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/** Feria o jornada de empleo. Las de empresas registradas traen empresa; las que carga Enlace traen organizador y fuente. */
export type Jornada = {
  id: string; titulo: string; descripcion: string | null; fecha: string; hasta: string | null; lugar: string; provincia: string;
  puestos: string[]; llevar: string | null; cupo: number | null; inscritos: number; empresa_id: string | null; empresa: string; verificada: boolean;
  organizador?: string | null; fuente?: string | null; fuente_url?: string | null; imagen?: string | null; contacto?: string | null;
  lat?: number | null; lng?: number | null; vacantes?: number | null; pasada?: boolean;
};

/** Quién la organiza, para mostrar. */
export const organizadorDe = (j: Pick<Jornada, "organizador" | "empresa">) => (j.organizador?.trim() || j.empresa || "Empresa");

/**
 * Ferias próximas (y, con `pasadas`, las de los últimos 60 días).
 * Usa ferias_publicas; si todavía no existe, cae a jornadas_publicas.
 */
export function useJornadas(id?: string, pasadas = false) {
  return useQuery({
    queryKey: ["ferias", id ?? null, pasadas],
    staleTime: 60_000,
    queryFn: async (): Promise<Jornada[]> => {
      const r = await supabase.rpc("ferias_publicas" as never, { p_id: id ?? null, p_pasadas: pasadas } as never);
      if (!r.error) return ((r.data ?? []) as unknown as Jornada[]);
      const { data, error } = await supabase.rpc("jornadas_publicas", { p_id: id ?? null });
      if (error) return [];
      return (data ?? []) as Jornada[];
    },
  });
}

/** Centro aproximado de cada provincia (para ubicar en el mapa si la feria no trae coordenadas). */
export const CENTRO_PROVINCIA: Record<string, [number, number]> = {
  "Distrito Nacional": [18.4861, -69.9312], "Santo Domingo": [18.5, -69.86], "Santiago": [19.4517, -70.697],
  "La Altagracia (Punta Cana)": [18.62, -68.55], "La Romana": [18.4273, -68.9728], "Puerto Plata": [19.7934, -70.6884],
  "San Cristóbal": [18.4167, -70.1], "San Pedro de Macorís": [18.4539, -69.3086], "Duarte (San Francisco)": [19.3009, -70.2526],
  "La Vega": [19.2221, -70.5296], "Espaillat (Moca)": [19.3943, -70.5232], "Monseñor Nouel (Bonao)": [18.9367, -70.4092],
  "Peravia (Baní)": [18.2796, -70.3313], "Sánchez Ramírez (Cotuí)": [19.0527, -70.1492], "Samaná": [19.2058, -69.3369],
  "María Trinidad Sánchez (Nagua)": [19.3832, -69.8474], "Hermanas Mirabal (Salcedo)": [19.3776, -70.4167], "Valverde (Mao)": [19.5517, -71.0781],
  "Monte Cristi": [19.8473, -71.6458], "Dajabón": [19.5487, -71.7083], "Santiago Rodríguez": [19.4717, -71.3395], "Azua": [18.4532, -70.7349],
  "San Juan": [18.8059, -71.2296], "Barahona": [18.2085, -71.1008], "Baoruco (Neiba)": [18.4815, -71.4199], "Independencia (Jimaní)": [18.4929, -71.851],
  "Pedernales": [18.0384, -71.744], "Elías Piña": [18.8766, -71.705], "San José de Ocoa": [18.5465, -70.5062], "Monte Plata": [18.807, -69.7845],
  "Hato Mayor": [18.7629, -69.2563], "El Seibo": [18.765, -69.0389],
};

/** Dónde poner la feria en el mapa: sus coordenadas o el centro de su provincia (con un pequeño desvío para que no se encimen). */
export function ubicacion(j: Pick<Jornada, "id" | "lat" | "lng" | "provincia">): [number, number] | null {
  if (typeof j.lat === "number" && typeof j.lng === "number") return [j.lat, j.lng];
  const c = CENTRO_PROVINCIA[j.provincia];
  if (!c) return null;
  let h = 0; for (const ch of j.id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return [c[0] + ((h % 9) - 4) * 0.006, c[1] + ((Math.floor(h / 9) % 9) - 4) * 0.006];
}

/** Oficinas Territoriales de Empleo del Ministerio de Trabajo: reciben CV y orientan todo el año, gratis. */
export const OFICINAS_EMPLEO: { nombre: string; direccion: string; provincia: string; pos: [number, number] }[] = [
  { nombre: "Oficina de Empleo · Distrito Nacional", direccion: "Ministerio de Trabajo, Av. Enrique Jiménez Moya #5, Centro de los Héroes", provincia: "Distrito Nacional", pos: [18.4469, -69.9387] },
  { nombre: "Oficina de Empleo · Santo Domingo Este", direccion: "Av. San Vicente de Paúl, Edificio Vásquez, 3er nivel", provincia: "Santo Domingo", pos: [18.4972, -69.8519] },
  { nombre: "Oficina de Empleo · Santiago", direccion: "Edificio Presidente Antonio Guzmán (Huacalito), Av. 27 de Febrero esq. Estrella Sadhalá", provincia: "Santiago", pos: [19.4496, -70.6853] },
  { nombre: "Oficina de Empleo · Bávaro", direccion: "Av. España, carretera Friusa, Plaza El Tronco, 1er nivel", provincia: "La Altagracia (Punta Cana)", pos: [18.6845, -68.4531] },
];

/** Días, horas y minutos que faltan (para la cuenta regresiva). */
export function cuentaRegresiva(iso: string, ahora = Date.now()) {
  const ms = Math.max(0, new Date(iso).getTime() - ahora);
  return { dias: Math.floor(ms / 864e5), horas: Math.floor((ms % 864e5) / 36e5), minutos: Math.floor((ms % 36e5) / 6e4), listo: ms === 0 };
}

export const mesCorto = (iso: string) => new Date(iso).toLocaleDateString("es-DO", { month: "short" }).replace(".", "");
export const diaNum = (iso: string) => new Date(iso).getDate();

export const diaJornada = (iso: string) => new Date(iso).toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" });
export const horaJornada = (iso: string) => new Date(iso).toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" });
export const cuandoJornada = (j: Pick<Jornada, "fecha" | "hasta">) => `${diaJornada(j.fecha)}, ${horaJornada(j.fecha)}${j.hasta ? ` a ${horaJornada(j.hasta)}` : ""}`;

/** "Hoy", "Mañana", "En 5 días". */
export function faltan(iso: string): string {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(iso); b.setHours(0, 0, 0, 0);
  const d = Math.round((b.getTime() - a.getTime()) / 864e5);
  return d <= 0 ? "Hoy" : d === 1 ? "Mañana" : `En ${d} días`;
}

export function enlaceMapa(lugar: string, provincia: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lugar}, ${provincia}, República Dominicana`)}`;
}

export function icsJornada(j: Pick<Jornada, "id" | "titulo" | "fecha" | "hasta" | "lugar" | "provincia" | "empresa">) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ini = new Date(j.fecha), fin = j.hasta ? new Date(j.hasta) : new Date(ini.getTime() + 3 * 3600e3);
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Enlace Laboral//ES", "BEGIN:VEVENT", `UID:feria-${j.id}@enlacelaboral`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(ini)}`, `DTEND:${f(fin)}`, `SUMMARY:${j.titulo}`.replace(/[,;]/g, " "), `LOCATION:${j.lugar}, ${j.provincia}`.replace(/[,;]/g, " "), "BEGIN:VALARM", "TRIGGER:-PT12H", "ACTION:DISPLAY", "DESCRIPTION:Feria de empleo mañana: lleva tu CV impreso", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a"); a.href = url; a.download = "feria-de-empleo.ics"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

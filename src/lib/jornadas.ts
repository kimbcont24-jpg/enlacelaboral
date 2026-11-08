import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Jornada = { id: string; titulo: string; descripcion: string | null; fecha: string; hasta: string | null; lugar: string; provincia: string; puestos: string[]; llevar: string | null; cupo: number | null; inscritos: number; empresa_id: string; empresa: string; verificada: boolean };

export function useJornadas(id?: string) {
  return useQuery({
    queryKey: ["jornadas", id ?? null],
    staleTime: 60_000,
    queryFn: async (): Promise<Jornada[]> => {
      const { data, error } = await supabase.rpc("jornadas_publicas", { p_id: id ?? null });
      if (error) return [];
      return (data ?? []) as Jornada[];
    },
  });
}

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
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Enlace Laboral//ES", "BEGIN:VEVENT", `UID:jornada-${j.id}@enlacelaboral`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(ini)}`, `DTEND:${f(fin)}`, `SUMMARY:${j.titulo} (${j.empresa})`.replace(/[,;]/g, " "), `LOCATION:${j.lugar}, ${j.provincia}`.replace(/[,;]/g, " "), "BEGIN:VALARM", "TRIGGER:-PT12H", "ACTION:DISPLAY", "DESCRIPTION:Jornada de empleo mañana", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a"); a.href = url; a.download = "jornada.ics"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

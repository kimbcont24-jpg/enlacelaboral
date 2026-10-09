import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const textosEditables = {
  hero_badge: { etiqueta: "Portada · etiqueta superior", valor: "Tu próximo paso comienza aquí" },
  hero_titulo: { etiqueta: "Portada · título", valor: "Encuentra tu próximo empleo en República Dominicana" },
  hero_subtitulo: { etiqueta: "Portada · subtítulo", valor: "Conectamos talento con oportunidades reales. Vacantes de todo el país en un solo lugar, siempre con la fuente original visible." },
  especialista_cita: { etiqueta: "Consejo del especialista · cita", valor: "Lee bien los requisitos indispensables y aplica si cumples la mayoría. Muchas empresas valoran la actitud y las ganas de aprender." },
  especialista_firma: { etiqueta: "Consejo del especialista · firma", valor: "Equipo Enlace RD" },
  reclutadores_titulo: { etiqueta: "Bloque reclutadores · título", valor: "¿Buscas talento?" },
  reclutadores_texto: { etiqueta: "Bloque reclutadores · texto", valor: "Publicar vacantes es gratis. Escríbenos y publicamos tu vacante para que llegue a más personas." },
} as const;

export type ClaveTexto = keyof typeof textosEditables;
type Mapa = Record<ClaveTexto, string>;

const base = Object.fromEntries(Object.entries(textosEditables).map(([k, v]) => [k, v.valor])) as Mapa;

export function useContenido(): Mapa {
  const [textos, setTextos] = useState<Mapa>(base);
  useEffect(() => {
    void supabase
      .from("contenido_sitio")
      .select("clave,valor")
      .then(({ data }) => {
        if (!data) return;
        const nuevo = { ...base };
        for (const r of data) if (r.clave in nuevo && r.valor.trim()) nuevo[r.clave as ClaveTexto] = r.valor;
        setTextos(nuevo);
      });
  }, []);
  return textos;
}

export const textosPorDefecto = base;

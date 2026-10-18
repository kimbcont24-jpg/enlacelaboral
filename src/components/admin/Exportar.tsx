import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tarjeta } from "@/components/admin/comun";
import { supabase } from "@/integrations/supabase/client";
import { aCsv, bajarCsv } from "@/lib/exportar";
import { SELECT, rowToVacante, type VacanteRow } from "@/lib/vacantes";

type Col = { clave: string; titulo: string }[];
type Origen = { id: string; titulo: string; ayuda: string; cols: Col; leer: () => Promise<Record<string, unknown>[]> };

const dt = (s: unknown) => (typeof s === "string" && s ? new Date(s).toLocaleString("es-DO", { timeZone: "America/Santo_Domingo" }) : "");

const ORIGENES: Origen[] = [
  {
    id: "vacantes", titulo: "Vacantes", ayuda: "Todas, con salario, fuente y estado.",
    cols: [{ clave: "titulo", titulo: "Puesto" }, { clave: "empresa", titulo: "Empresa" }, { clave: "provincia", titulo: "Provincia" }, { clave: "area", titulo: "Área" }, { clave: "modalidad", titulo: "Modalidad" }, { clave: "tipo", titulo: "Tipo" }, { clave: "salarioMin", titulo: "Salario desde" }, { clave: "salarioMax", titulo: "Salario hasta" }, { clave: "estado", titulo: "Estado" }, { clave: "fuente", titulo: "Fuente" }, { clave: "redes", titulo: "Autoriza redes" }, { clave: "creado", titulo: "Publicada" }, { clave: "enlace", titulo: "Enlace" }],
    leer: async () => {
      const { data, error } = await supabase.from("vacantes").select(SELECT).order("created_at", { ascending: false }).limit(5000);
      if (error) throw error;
      return ((data ?? []) as unknown as VacanteRow[]).map(rowToVacante).map((v) => ({ ...v, redes: v.redes ? "sí" : "no", creado: dt(v.creado), enlace: `${window.location.origin}/vacantes/${v.id}` }));
    },
  },
  {
    id: "aplicaciones", titulo: "Aplicaciones", ayuda: "Quién aplicó y a qué vacante.",
    cols: [{ clave: "fecha", titulo: "Fecha" }, { clave: "nombre", titulo: "Nombre" }, { clave: "contacto", titulo: "Contacto" }, { clave: "vacante", titulo: "Vacante" }, { clave: "mensaje", titulo: "Mensaje" }],
    leer: async () => {
      const { data, error } = await supabase.from("aplicaciones").select("nombre,contacto,mensaje,created_at,vacantes(titulo)").order("created_at", { ascending: false }).limit(5000);
      if (error) throw error;
      return ((data ?? []) as unknown as { nombre: string; contacto: string; mensaje: string | null; created_at: string; vacantes: { titulo: string } | null }[]).map((a) => ({ fecha: dt(a.created_at), nombre: a.nombre, contacto: a.contacto, vacante: a.vacantes?.titulo ?? "", mensaje: a.mensaje }));
    },
  },
  {
    id: "alertas", titulo: "Alertas de empleo", ayuda: "Personas suscritas a alertas por correo (tu lista para avisarles).",
    cols: [{ clave: "email", titulo: "Correo" }, { clave: "area", titulo: "Área" }, { clave: "provincia", titulo: "Provincia" }, { clave: "activa", titulo: "Activa" }, { clave: "creada", titulo: "Se suscribió" }],
    leer: async () => {
      const { data, error } = await supabase.rpc("alertas_admin");
      if (error) throw error;
      return (data ?? []).map((a) => ({ email: a.email, area: a.area, provincia: a.provincia, activa: a.activa ? "sí" : "no", creada: dt(a.created_at) }));
    },
  },
  {
    id: "pedidos", titulo: "Pedidos de CV", ayuda: "Pedidos de Impulso Laboral con su estado.",
    cols: [{ clave: "fecha", titulo: "Fecha" }, { clave: "codigo", titulo: "Código" }, { clave: "paquete", titulo: "Paquete" }, { clave: "precio", titulo: "Precio" }, { clave: "nombre", titulo: "Nombre" }, { clave: "contacto", titulo: "Contacto" }, { clave: "correo", titulo: "Correo" }, { clave: "puesto", titulo: "Puesto buscado" }, { clave: "estado", titulo: "Estado" }],
    leer: async () => {
      const { data, error } = await supabase.from("pedidos_servicios").select("*").order("created_at", { ascending: false }).limit(5000);
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, fecha: dt(p.created_at) }));
    },
  },
  {
    id: "empresas", titulo: "Empresas", ayuda: "Empresas registradas y si están verificadas.",
    cols: [{ clave: "nombre", titulo: "Empresa" }, { clave: "rnc", titulo: "RNC" }, { clave: "sector", titulo: "Sector" }, { clave: "provincia", titulo: "Provincia" }, { clave: "contacto_nombre", titulo: "Contacto" }, { clave: "contacto_email", titulo: "Correo" }, { clave: "contacto_telefono", titulo: "Teléfono" }, { clave: "verificada", titulo: "Verificada" }, { clave: "fecha", titulo: "Registro" }],
    leer: async () => {
      const { data, error } = await supabase.from("empresas").select("*").order("created_at", { ascending: false }).limit(5000);
      if (error) throw error;
      return (data ?? []).map((e) => ({ ...e, verificada: e.verificada ? "sí" : "no", fecha: dt(e.created_at) }));
    },
  },
];

export function Exportar() {
  const [bajando, setBajando] = useState<string | null>(null);
  const bajar = async (o: Origen) => {
    setBajando(o.id);
    try {
      const filas = await o.leer();
      if (!filas.length) { toast.message("No hay datos para descargar todavía."); return; }
      bajarCsv(`enlace-laboral-${o.id}`, aCsv(o.cols, filas));
      toast.success(`${filas.length} filas descargadas. Ábrelo con Excel o Google Sheets.`);
    } catch {
      toast.error("No pude descargar. Intenta otra vez.");
    } finally {
      setBajando(null);
    }
  };
  return (
    <Tarjeta titulo="Descargar datos" ayuda="Archivos CSV que abres con Excel o Google Sheets. Contienen datos personales: guárdalos con cuidado y no los compartas.">
      <ul className="divide-y divide-border">
        {ORIGENES.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span><strong className="block">{o.titulo}</strong><span className="text-sm text-muted-foreground">{o.ayuda}</span></span>
            <Button variant="outline" disabled={bajando !== null} onClick={() => void bajar(o)}>{bajando === o.id ? <Loader2 className="animate-spin" /> : <Download />} Descargar</Button>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

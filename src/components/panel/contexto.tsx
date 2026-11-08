import { createContext, useContext } from "react";

import type { Candidato, EmpresaPerfil, Etapa, Evento } from "@/lib/panel";
import type { Vacante } from "@/lib/vacantes";
import type { Vistas } from "@/lib/vistas";

export type Seccion = "inicio" | "candidatos" | "agenda" | "vacantes" | "publicar" | "mensajes" | "empresa" | "planes" | "informe" | "talento" | "jornadas" | "equipo" | "mas";
export type TipoPedido = "plan_empresa" | "destacar" | "prueba" | "asistido";
export type AccionVacante = "renovar" | "pausar" | "reactivar" | "cerrar";

export type PanelApi = {
  /** Id del dueño de la empresa: con él se buscan y guardan los datos (el equipo trabaja sobre lo mismo). */
  uid: string;
  /** Quién está conectado ahora mismo. */
  yo: { id: string; correo: string; dueno: boolean };
  empresa: EmpresaPerfil;
  vacantes: Vacante[];
  candidatos: Candidato[];
  solicitudes: { tipo: string; vacante_id: string | null; estado: string }[];
  vistas: Record<string, Vistas>;
  puesto: (vacanteId: string) => string;
  vacante: (vacanteId: string) => Vacante | undefined;
  ir: (s: Seccion, filtro?: { vacante?: string; etapa?: Etapa | "" }) => void;
  filtro: { vacante: string; etapa: Etapa | "" };
  abrir: (candidatoId: string) => void;
  actualizar: (c: Candidato, cambios: Partial<Candidato>, evento?: Omit<Evento, "t">) => Promise<boolean>;
  mover: (c: Candidato, etapa: Etapa, opciones?: { silencioso?: boolean }) => Promise<void>;
  contactar: (c: Candidato, etapa?: Etapa) => void;
  agendar: (c: Candidato) => void;
  accionVacante: (v: Vacante, a: AccionVacante) => Promise<void>;
  editarVacante: (v: Vacante, duplicar?: boolean) => void;
  pedir: (tipo: TipoPedido, vacanteId?: string, detalle?: string) => Promise<boolean>;
  recargar: () => Promise<void>;
  setEmpresa: (e: EmpresaPerfil) => void;
};

export const PanelCtx = createContext<PanelApi | null>(null);
export function usePanel(): PanelApi {
  const v = useContext(PanelCtx);
  if (!v) throw new Error("usePanel fuera del panel");
  return v;
}

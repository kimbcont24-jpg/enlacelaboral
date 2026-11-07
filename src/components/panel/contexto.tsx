import { createContext, useContext } from "react";

import type { Candidato, EmpresaPerfil, Etapa, Evento } from "@/lib/panel";
import type { Vacante } from "@/lib/vacantes";

export type Seccion = "inicio" | "candidatos" | "agenda" | "vacantes" | "publicar" | "mensajes" | "empresa" | "mas";
export type AccionVacante = "renovar" | "pausar" | "reactivar" | "cerrar";

export type PanelApi = {
  uid: string;
  empresa: EmpresaPerfil;
  vacantes: Vacante[];
  candidatos: Candidato[];
  solicitudes: { tipo: string; vacante_id: string | null; estado: string }[];
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
  pedir: (tipo: "plan_empresa" | "destacar", vacanteId?: string) => Promise<void>;
  recargar: () => Promise<void>;
  setEmpresa: (e: EmpresaPerfil) => void;
};

export const PanelCtx = createContext<PanelApi | null>(null);
export function usePanel(): PanelApi {
  const v = useContext(PanelCtx);
  if (!v) throw new Error("usePanel fuera del panel");
  return v;
}

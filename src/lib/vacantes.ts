import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Vacante = {
  id: string;
  titulo: string;
  empresa: string;
  provincia: string;
  modalidad: string;
  tipo: string;
  experiencia: string;
  area: string;
  salarioMin: number;
  salarioMax: number | null;
  salario: string;
  descripcion: string;
  requisitos: string[];
  fuente: string;
  fuenteUrl: string;
  aplicar: string;
  publicado: string;
  creado: string;
  estado: string;
  categorias: string[];
};

export type VacanteRow = {
  id: string;
  titulo: string;
  area: string;
  provincia: string;
  modalidad: string;
  tipo: string;
  experiencia: string;
  salario_min: number;
  salario_max: number | null;
  descripcion: string;
  requisitos: string[] | null;
  etiquetas: string[] | null;
  estado: string;
  created_at: string;
};

export const SELECT = "id,titulo,area,provincia,modalidad,tipo,experiencia,salario_min,salario_max,descripcion,requisitos,etiquetas,estado,created_at";

const pesos = (n: number) => `RD$${n.toLocaleString("es-DO")}`;

export function leerMeta(etiquetas: string[] | null) {
  const meta: Record<string, string> = {};
  const tags: string[] = [];
  for (const e of etiquetas ?? []) {
    if (e.startsWith("m:")) {
      const resto = e.slice(2);
      const i = resto.indexOf(":");
      if (i > 0) meta[resto.slice(0, i)] = resto.slice(i + 1);
    } else {
      tags.push(e);
    }
  }
  return { meta, tags };
}

export function hace(fecha: string) {
  const min = Math.max(1, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
  if (min < 60) return `hace ${min} min`;
  if (min < 1440) return `hace ${Math.round(min / 60)} h`;
  const d = Math.round(min / 1440);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

export function rowToVacante(r: VacanteRow): Vacante {
  const { meta, tags } = leerMeta(r.etiquetas);
  const max = r.salario_max && r.salario_max > r.salario_min ? r.salario_max : null;
  const salario = r.salario_min > 0 ? (max ? `${pesos(r.salario_min)} - ${pesos(max)}` : pesos(r.salario_min)) : "Salario no publicado";
  return {
    id: r.id,
    titulo: r.titulo,
    empresa: meta["empresa"] || "Empresa no indicada",
    provincia: r.provincia,
    modalidad: r.modalidad,
    tipo: r.tipo,
    experiencia: r.experiencia,
    area: r.area,
    salarioMin: r.salario_min,
    salarioMax: max,
    salario,
    descripcion: r.descripcion,
    requisitos: r.requisitos ?? [],
    fuente: meta["fuente"] || "Enlace RD",
    fuenteUrl: meta["fuente_url"] || "",
    aplicar: meta["aplicar"] || "",
    publicado: hace(r.created_at),
    creado: r.created_at,
    estado: r.estado,
    categorias: tags,
  };
}

export async function fetchPublicadas(): Promise<Vacante[]> {
  const { data, error } = await supabase.from("vacantes").select(SELECT).eq("estado", "publicada").order("created_at", { ascending: false }).limit(300);
  if (error) throw error;
  return ((data ?? []) as unknown as VacanteRow[]).map(rowToVacante);
}

export async function fetchVacante(id: string): Promise<Vacante | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await supabase.from("vacantes").select(SELECT).eq("id", id).maybeSingle();
  return data ? rowToVacante(data as unknown as VacanteRow) : null;
}

export function useVacantes() {
  const q = useQuery({ queryKey: ["vacantes"], queryFn: fetchPublicadas, staleTime: 30_000 });
  return { jobs: q.data ?? [], cargando: q.isLoading, error: q.isError };
}

export function enlaceAplicar(a: string): { href: string; label: string } | null {
  const t = a.trim();
  if (!t) return null;
  const url = t.match(/https?:\/\/\S+/);
  if (url) return { href: url[0], label: "Aplicar en el sitio original" };
  const mail = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (mail) return { href: `mailto:${mail[0]}`, label: `Enviar CV a ${mail[0]}` };
  const digitos = t.replace(/\D/g, "");
  if (digitos.length >= 10) {
    const n = digitos.length === 10 ? `1${digitos}` : digitos;
    return { href: `https://wa.me/${n}`, label: "Escribir por WhatsApp" };
  }
  return null;
}

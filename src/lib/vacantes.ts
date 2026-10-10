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
  destacada: boolean;
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
  destacada?: boolean | null;
};

export const SELECT = "id,titulo,area,provincia,modalidad,tipo,experiencia,salario_min,salario_max,descripcion,requisitos,etiquetas,estado,created_at,destacada";

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
    destacada: !!r.destacada,
  };
}

export async function fetchPublicadas(): Promise<Vacante[]> {
  const { data, error } = await supabase.from("vacantes").select(SELECT).eq("estado", "publicada").gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()).order("destacada", { ascending: false }).order("created_at", { ascending: false }).limit(300);
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

export const SITIO = "https://enlace-rd.vercel.app";

export function textoWhatsApp(job: Vacante, origen = SITIO): string {
  const lineas = [
    `*${job.titulo}*`,
    job.empresa !== "Empresa no indicada" ? `🏢 ${job.empresa}` : null,
    `📍 ${job.provincia} · ${job.modalidad}`,
    job.salarioMin > 0 ? `💰 ${job.salario}` : null,
    "",
    "Mira los requisitos y cómo aplicar (gratis):",
    `${origen}/vacantes/${job.id}`,
  ];
  return lineas.filter((l) => l !== null).join("\n");
}

export const enlaceWhatsApp = (job: Vacante, origen?: string) => `https://wa.me/?text=${encodeURIComponent(textoWhatsApp(job, origen))}`;

const TIPO_GOOGLE: Record<string, string> = { "Tiempo completo": "FULL_TIME", "Medio tiempo": "PART_TIME", "Pasantía": "INTERN", "Por proyecto": "CONTRACTOR" };

/** Datos para Google Empleos. Solo para vacantes publicadas directamente por la empresa. */
export function jobPostingLd(job: Vacante): string | null {
  if (job.fuente !== "Publicada por la empresa" || job.empresa === "Empresa no indicada") return null;
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const partes = [
    job.descripcion ? `<p>${esc(job.descripcion).replace(/\n/g, "<br>")}</p>` : "",
    job.requisitos.length ? `<p>Requisitos:</p><ul>${job.requisitos.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : "",
  ].filter(Boolean);
  const vence = new Date(new Date(job.creado).getTime() + 30 * 864e5).toISOString();
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.titulo,
    description: partes.join("") || `<p>${esc(job.titulo)}</p>`,
    datePosted: job.creado,
    validThrough: vence,
    employmentType: TIPO_GOOGLE[job.tipo] ?? "OTHER",
    hiringOrganization: { "@type": "Organization", name: job.empresa },
    directApply: false,
  };
  if (job.modalidad === "Remoto" || job.provincia === "Remoto desde RD") {
    ld["jobLocationType"] = "TELECOMMUTE";
    ld["applicantLocationRequirements"] = { "@type": "Country", name: "DO" };
  } else {
    ld["jobLocation"] = { "@type": "Place", address: { "@type": "PostalAddress", addressRegion: job.provincia, addressCountry: "DO" } };
  }
  if (job.salarioMin > 0) {
    const valor = job.salarioMax ? { minValue: job.salarioMin, maxValue: job.salarioMax } : { value: job.salarioMin };
    ld["baseSalary"] = { "@type": "MonetaryAmount", currency: "DOP", value: { "@type": "QuantitativeValue", ...valor, unitText: "MONTH" } };
  }
  return JSON.stringify(ld).replace(/</g, "\\u003c");
}

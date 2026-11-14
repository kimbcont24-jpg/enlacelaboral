import type { Vacante } from "@/lib/vacantes";

/**
 * Colecciones: formas de clasificar las vacantes que cruzan las áreas.
 * Responden a lo que la gente busca de verdad («quiero trabajar en el Estado», «desde casa», «sin experiencia»),
 * no solo al departamento del puesto. Cada una tiene su página en /empleos/<slug>.
 *
 * Se detectan solas con el texto de la vacante. También se pueden marcar a mano con la etiqueta
 * `sector:publico` o `sector:zona-franca` (por ejemplo desde Admin o al importar).
 */
export type ColeccionId = "sector-publico" | "zonas-francas" | "remoto" | "sin-experiencia" | "con-salario" | "bilingues";

export type Coleccion = {
  id: ColeccionId;
  /** Slug de su página en /empleos/<slug>. «remoto» reutiliza la página que ya existía. */
  slug: string;
  nombre: string;
  corto: string;
  frase: string;
  color: string;
  /** Solo las que no tienen ya una página propia se registran como landing nueva. */
  landingNueva: boolean;
  enColeccion: (j: Vacante) => boolean;
};

const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const texto = (j: Vacante) => sinAcentos(`${j.titulo} ${j.empresa} ${j.descripcion} ${(j.requisitos ?? []).join(" ")} ${j.aplicar} ${j.fuenteUrl}`);

/**
 * Instituciones del Estado dominicano: ministerios, ayuntamientos, direcciones generales, empresas públicas,
 * poderes del Estado y órganos autónomos. Se busca en el nombre de la empresa (sin acentos).
 */
const ESTADO_EMPRESA = new RegExp(
  [
    "^ministerio", "^viceministerio", "^ayuntamiento", "^alcaldia", "^junta (de )?distrito", "^gobernacion",
    "^direccion general", "^direccion nacional", "^instituto nacional", "^instituto dominicano", "^consejo nacional",
    "^oficina nacional", "^oficina presidencial", "^servicio nacional", "^superintendencia", "^tesoreria",
    "^procuraduria", "^contraloria", "^camara de cuentas", "^camara de diputados", "^senado de la republica",
    "^poder judicial", "^tribunal (constitucional|superior)", "^suprema corte", "^junta central electoral",
    "^defensor del pueblo", "^policia nacional", "^ejercito", "^armada de republica", "^fuerza aerea",
    "\\bgob(ierno)?\\.do\\b", "\\bgobierno (de|dominicano)\\b", "presidencia de la republica",
    // Siglas de instituciones y empresas públicas muy conocidas.
    "\\b(map|mescyt|minerd|minpre|mopc|mivhed|mitur|miderec|mepyd|mimarena|indotel|infotep|inapa|caasd|coraasan|coraavega|edesur|edenorte|edeeste|etedel?|egehid|cdeee|dgii|dga|dgcp|digecog|tss|sisalril|senasa|sns|idoppril|conadis|conani|inabie|inespre|inabima|inaipi|isfodosu|uasd|itla|optic|ogtic|propeep|adess|onapi|onamet|oms[ae]|opret|intrant|digesett|indrhi|iad|bagricola|proindustria|banreservas|banco central)\\b",
    "instituto superior de formacion docente salome urena",
  ].join("|"),
);
const ESTADO_TEXTO = /\b(concurso (publico|externo|interno)|portal concursa|map\.gob\.do\/concursa|ley 41-08|funcion publica|servidor(a)? publico)\b|@[\w.-]+\.gob\.do\b|\bgob\.do\//;

export function esSectorPublico(j: Vacante): boolean {
  if (j.categorias.includes("sector:publico")) return true;
  if (j.categorias.includes("sector:privado")) return false;
  return ESTADO_EMPRESA.test(sinAcentos(j.empresa)) || ESTADO_TEXTO.test(texto(j));
}

/** Manufactura de zona franca: dispositivos médicos, eléctricos y textiles que dominan los parques industriales. */
const ZONA_FRANCA_EMPRESA = /\b(eaton|baxter|medtronic|fenwal|fresenius|becton|cardinal health|edwards lifesciences|jabil|hanesbrands|b\. braun|abbott|smurfit|schad|production automation|zona franca)\b/;
export function esZonaFranca(j: Vacante): boolean {
  if (j.categorias.includes("sector:zona-franca")) return true;
  return ZONA_FRANCA_EMPRESA.test(sinAcentos(j.empresa)) || /\bzona franca\b|\bparque industrial\b/.test(texto(j));
}

const BILINGUE = /\b(bilingue|ingles (avanzado|intermedio|fluido|conversacional|b2|c1)|dominio del ingles|nivel de ingles|english|bilingual)\b/;

export const colecciones: Coleccion[] = [
  {
    id: "sector-publico", slug: "sector-publico", nombre: "Sector público", corto: "Estado",
    frase: "Ministerios, ayuntamientos, hospitales y empresas del Estado.",
    color: "#c8102e", landingNueva: true, enColeccion: esSectorPublico,
  },
  {
    id: "zonas-francas", slug: "zonas-francas", nombre: "Zonas francas", corto: "Zona franca",
    frase: "Manufactura y dispositivos médicos en los parques industriales.",
    color: "#0e7490", landingNueva: true, enColeccion: esZonaFranca,
  },
  {
    id: "remoto", slug: "remoto", nombre: "Desde casa", corto: "Remoto",
    frase: "Trabaja remoto desde cualquier provincia.",
    color: "#7c3aed", landingNueva: false, enColeccion: (j) => j.modalidad === "Remoto" || j.provincia === "Remoto desde RD",
  },
  {
    id: "sin-experiencia", slug: "sin-experiencia", nombre: "Sin experiencia", corto: "Primer empleo",
    frase: "Para empezar: no piden años de experiencia.",
    color: "#0f7a43", landingNueva: true, enColeccion: (j) => j.experiencia === "Sin experiencia" || j.categorias.includes("incl:primer-empleo"),
  },
  {
    id: "con-salario", slug: "con-salario-visible", nombre: "Con salario visible", corto: "Con salario",
    frase: "Sabes cuánto pagan antes de aplicar.",
    color: "#b45309", landingNueva: true, enColeccion: (j) => j.salarioMin > 0,
  },
  {
    id: "bilingues", slug: "empleos-bilingues", nombre: "Bilingües", corto: "Inglés",
    frase: "Puestos donde el inglés te abre la puerta.",
    color: "#1d4ed8", landingNueva: true, enColeccion: (j) => BILINGUE.test(texto(j)),
  },
];

export const coleccionPorSlug = (s: string) => colecciones.find((c) => c.slug === s) ?? null;

/** Cuántas vacantes hay en cada colección y cuántas salieron en los últimos 7 días. */
export function contarColecciones(jobs: Vacante[]) {
  const semana = Date.now() - 7 * 864e5;
  return colecciones.map((c) => {
    const lista = jobs.filter(c.enColeccion);
    return { ...c, total: lista.length, nuevas: lista.filter((j) => new Date(j.creado).getTime() >= semana).length };
  });
}

/** Cómo se entra a trabajar en el Estado (verificado el 14 nov 2026 en presidencia.gob.do y avisos de concurso del MAP). */
export const CONCURSA_URL = "https://map.gob.do/Concursa/";
export const CONCURSA_GUIA = "https://map.gob.do/Concursa/Manual/Guia_Usuario_Ciudadano_Concursa_II.pdf";

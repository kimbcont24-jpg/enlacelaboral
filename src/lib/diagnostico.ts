import type { CV } from "@/lib/cv";

export type Punto = { ok: boolean; texto: string; consejo: string };

/** Revisión por reglas simples sobre lo que el CV realmente contiene. No usa IA ni inventa nada. */
export function diagnosticarCV(cv: CV): { puntos: Punto[]; nota: number; total: number } {
  const exp = cv.experiencia.filter((e) => e.puesto.trim());
  const logros = exp.map((e) => e.logros.trim()).filter(Boolean);
  const conNumeros = logros.filter((l) => /\d/.test(l)).length;
  const habilidades = cv.habilidades.split(/[,\n;]/).map((h) => h.trim()).filter(Boolean);
  const puntos: Punto[] = [
    { ok: cv.nombre.trim().length > 3 && (cv.telefono.trim().length > 6 || cv.correo.includes("@")), texto: "Datos de contacto completos", consejo: "Agrega un teléfono y un correo profesional. Sin eso, nadie te puede llamar." },
    { ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cv.correo.trim()) && !/\d{4,}|[_.]{2}/.test(cv.correo.split("@")[0] ?? ""), texto: "Correo profesional y sencillo", consejo: "Usa un correo con tu nombre, sin apodos ni muchos números." },
    { ok: cv.puesto.trim().length > 3, texto: "Dice qué puesto buscas", consejo: "Pon debajo de tu nombre el puesto al que aplicas. Así el reclutador te ubica en segundos." },
    { ok: cv.resumen.trim().length >= 80, texto: "Resumen profesional con contenido", consejo: "Escribe 3 o 4 líneas: quién eres, qué sabes hacer y qué buscas." },
    { ok: exp.length >= 1, texto: "Experiencia o proyectos listados", consejo: "Si no tienes empleos formales, agrega prácticas, voluntariados o trabajos por cuenta propia." },
    { ok: logros.length >= Math.max(1, exp.length) && logros.every((l) => l.length >= 40), texto: "Describes lo que lograste, no solo el cargo", consejo: "En cada puesto cuenta qué resultados lograste, no solo qué hacías." },
    { ok: logros.length > 0 && conNumeros >= 1, texto: "Tus logros incluyen números", consejo: "Agrega cifras: «atendí 40 clientes al día», «subí las ventas 15 %». Los números convencen." },
    { ok: cv.educacion.some((e) => e.titulo.trim()), texto: "Formación académica", consejo: "Incluye tu último estudio, aunque esté en curso." },
    { ok: habilidades.length >= 4, texto: "Al menos 4 habilidades claras", consejo: "Lista habilidades concretas que pide el puesto (programas, idiomas, herramientas)." },
    { ok: cv.idiomas.trim().length > 2, texto: "Idiomas indicados", consejo: "Si hablas inglés u otro idioma, indica tu nivel. Es de lo que más se busca en RD." },
  ];
  const nota = puntos.filter((p) => p.ok).length;
  return { puntos, nota, total: puntos.length };
}

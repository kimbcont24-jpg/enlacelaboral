// Correo «Su vacante ya está publicada» · versión 3 (17 nov 2026): impactante pero sobria — azul noche, blanco y un solo acento celeste, sin emojis.
// Se envía desde info@enlacelaboralrd.com (Zoho, vía la tarea programada) a la empresa que publicó.
// Tablas + estilos en línea: Gmail, Outlook y celular. El GIF animado (public/email/publicada.gif)
// empieza con el cuadro final, así Outlook de escritorio (que no anima) muestra el check completo.
//
// Psicología aplicada:
//  · Cierre de ciclo y recompensa inmediata: animación del check + «¡PUBLICADA!» (efecto Zeigarnik resuelto).
//  · Progreso visible: rastreador Recibida → Revisada → Publicada → Recibiendo candidatos (sensación de avance).
//  · Prueba tangible: «Así la ven los candidatos» con la imagen real de su vacante y un comprobante con número.
//  · Refuerzo positivo: si publicó salario, se le reconoce; si no, recomendación de reclutamiento (sin cifras inventadas).
//  · Autonomía y efecto multiplicador: compartirla en un toque. Redes oficiales para seguirnos.
//  · Reciprocidad: «la próxima, gratis» y respuesta directa a este correo.

export type VacanteGracias = {
  id: string;
  titulo: string;
  empresa: string;
  provincia: string | null;
  modalidad: string | null;
  tipo: string | null;
  salario_min: number | null;
  salario_max: number | null;
  aplicar: string | null;
  redes: boolean;
  publicada?: string | null;
};

export type DatosGracias = { contacto: string | null; empresa: string; vacantes: VacanteGracias[] };

const SITIO = "https://enlacelaboralrd.com";
const NOCHE = "#061a35";
const AZUL = "#0a2f5c";
const AZUL2 = "#1d6ff2";
const CELESTE = "#8EC1FF";
const TINTA = "#0f172a";
const F = "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const utm = (u: string, c: string) => `${u}${u.includes("?") ? "&" : "?"}utm_source=correo&utm_medium=email&utm_campaign=gracias_publicada&utm_content=${c}`;
const rd = (n: number) => "RD$" + n.toLocaleString("es-DO");
const numero = (id: string) => "EL-" + id.replace(/-/g, "").slice(0, 6).toUpperCase();

export function primerNombre(contacto: string | null, empresa = ""): string | null {
  const c = (contacto ?? "").trim();
  if (/\b(s\.?r\.?l|s\.?a\.?s?|srl|eirl|inc|corp|group|grupo|service|services|provide|center|centro|consultor\w*|empresa|rrhh|recursos|gesti[oó]n|talento|reclutamiento|equipo|depto|departamento)\b/i.test(c)) return null;
  const n = c.split(/\s+/)[0] ?? "";
  if (!n || n.length < 2 || /@|\d/.test(n)) return null;
  if (empresa && empresa.toLowerCase().includes(n.toLowerCase())) return null;
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

export function asuntoGracias(d: DatosGracias): string {
  const v = d.vacantes;
  if (v.length === 1) return `Su vacante de ${v[0]!.titulo} ya está publicada en Enlace Laboral`;
  return `Sus ${v.length} vacantes ya están publicadas en Enlace Laboral`;
}

function salario(v: VacanteGracias): string | null {
  if (v.salario_min && v.salario_max && v.salario_max > v.salario_min) return `${rd(v.salario_min)} – ${rd(v.salario_max)}`;
  if (v.salario_min) return rd(v.salario_min);
  return null;
}

function contactoAplicar(a: string | null): string | null {
  const t = (a ?? "").trim();
  if (!t || (/^https?:\/\//i.test(t) && /enlacelaboral|enlace-rd/i.test(t))) return null;
  return t.length > 80 ? t.slice(0, 77) + "…" : t;
}

function fechaRD(iso: string | null | undefined): string {
  const f = iso ? new Date(iso) : new Date();
  if (Number.isNaN(f.getTime())) return "";
  return new Intl.DateTimeFormat("es-DO", { timeZone: "America/Santo_Domingo", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" }).format(f);
}

/** Botón sólido (principal) o de contorno (secundario). Solo azul, blanco y celeste. */
function boton(href: string, texto: string, tipo: "claro" | "oscuro" | "contorno"): string {
  const est = tipo === "claro" ? `background:#ffffff;border:1px solid #ffffff;` : tipo === "oscuro" ? `background:${AZUL};border:1px solid ${AZUL};` : `background:transparent;border:1px solid rgba(142,193,255,.55);`;
  const color = tipo === "claro" ? NOCHE : "#ffffff";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 8px 10px 0;"><tr><td style="border-radius:10px;${est}"><a href="${href}" style="display:inline-block;padding:12px 20px;${F}font-size:14px;font-weight:600;letter-spacing:.2px;color:${color};text-decoration:none;">${texto}</a></td></tr></table>`;
}

const etiqueta = (t: string, color = CELESTE) => `<p style="margin:0 0 10px 0;${F}font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${color};">${t}</p>`;

/** Progreso: Recibida → Revisada → Publicada → En línea. Monocromo. */
function progreso(): string {
  const paso = (n: string, titulo: string, activo: boolean) => `
      <td width="25%" valign="top" align="center" style="padding:0 2px;${F}">
        <div style="width:28px;height:28px;line-height:28px;margin:0 auto;border-radius:999px;${activo ? `background:${CELESTE};color:${NOCHE};` : `background:${NOCHE};color:${CELESTE};border:1px solid ${CELESTE};line-height:26px;width:26px;height:26px;`}font-size:12px;font-weight:700;text-align:center;">${n}</div>
        <p style="margin:8px 0 0 0;font-size:12px;font-weight:600;color:${activo ? "#ffffff" : CELESTE};">${titulo}</p>
      </td>`;
  return `
<tr><td style="padding:4px 34px 34px 34px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>${paso("✓", "Recibida", true)}${paso("✓", "Revisada", true)}${paso("✓", "Publicada", true)}${paso("4", "Recibiendo candidatos", false)}</tr>
  </table>
</td></tr>`;
}

/** Ficha: imagen real de la vacante + comprobante. */
function ficha(v: VacanteGracias, i: number): string {
  const url = utm(`${SITIO}/vacantes/${v.id}`, `ver_${i + 1}`);
  const s = salario(v);
  const ap = contactoAplicar(v.aplicar);
  const fila = (k: string, val: string) => `<tr><td style="padding:9px 0;border-top:1px solid #e6ecf4;${F}font-size:13px;color:#64748b;" width="36%">${k}</td><td style="padding:9px 0;border-top:1px solid #e6ecf4;${F}font-size:14px;font-weight:600;color:${TINTA};" align="right">${val}</td></tr>`;
  return `
<tr><td style="padding:0 0 20px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
    <tr><td style="padding:12px 12px 0 12px;">
      <a href="${url}" style="text-decoration:none;"><img src="${SITIO}/og/vacantes/${v.id}.png" width="552" alt="${esc(v.titulo)} · ${esc(v.empresa)}" style="display:block;width:100%;max-width:552px;height:auto;border:0;border-radius:10px;background:${AZUL};"></a>
    </td></tr>
    <tr><td style="padding:20px 24px 6px 24px;${F}">
      <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b;">Comprobante · ${numero(v.id)}</p>
      <p style="margin:0;font-size:21px;line-height:28px;font-weight:700;color:${TINTA};">${esc(v.titulo)}</p>
      <p style="margin:2px 0 14px 0;font-size:14px;color:#64748b;">${esc(v.empresa)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${fila("Publicada", esc(fechaRD(v.publicada)))}
        ${fila("Ubicación", esc([v.provincia, v.modalidad].filter(Boolean).join(" · ") || "República Dominicana"))}
        ${v.tipo ? fila("Jornada", esc(v.tipo)) : ""}
        ${fila("Salario", s ? esc(s) : "No publicado")}
        ${ap ? fila("Aplicaciones a", esc(ap)) : ""}
        ${fila("Costo de publicación", "Gratis")}
      </table>
    </td></tr>
    <tr><td style="padding:16px 24px 22px 24px;">${boton(url, "Ver la vacante publicada", "oscuro")}</td></tr>
  </table>
</td></tr>`;
}

/** Redes oficiales de Enlace Laboral RD (verificadas el 17 nov 2026). */
export const REDES = [
  { red: "Instagram", url: "https://www.instagram.com/enlacelaboralrd" },
  { red: "WhatsApp", url: "https://whatsapp.com/channel/0029Vb7GW0UKLaHf3idEm62D" },
  { red: "Telegram", url: "https://t.me/enlacelaboral" },
  { red: "LinkedIn", url: "https://www.linkedin.com/company/enlacelaboralrd" },
  { red: "Facebook", url: "https://www.facebook.com/109048674048597" },
] as const;

function siganos(): string {
  const enlace = (r: (typeof REDES)[number]) => `<td style="padding:4px;"><a href="${r.url}" style="display:block;padding:11px 6px;border:1px solid #2a4a75;border-radius:10px;${F}font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;text-align:center;">${r.red}</a></td>`;
  return `
<tr><td style="padding:30px 30px 10px 30px;${F}" align="center">
  ${etiqueta("Síganos")}
  <p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#b8c7dd;">Compartimos a diario vacantes como la suya en Instagram, en nuestros canales de WhatsApp y Telegram, en LinkedIn y en Facebook.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>${enlace(REDES[0])}${enlace(REDES[1])}${enlace(REDES[2])}</tr>
  </table>
  <table role="presentation" width="67%" cellpadding="0" cellspacing="0" align="center">
    <tr>${enlace(REDES[3])}${enlace(REDES[4])}</tr>
  </table>
</td></tr>`;
}

export function correoGracias(d: DatosGracias): string {
  const v = d.vacantes;
  const una = v.length === 1;
  const nombre = primerNombre(d.contacto, d.empresa);
  const p = v[0]!;
  const enlace = `${SITIO}/vacantes/${p.id}`;
  const textoWa = una ? `Estamos contratando: ${p.titulo} en ${p.empresa}. Aplica gratis aquí: ${enlace}` : `${p.empresa} está contratando. Mira nuestras vacantes y aplica gratis: ${enlace}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(textoWa)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(enlace)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(enlace)}`;
  const conSalario = v.every((x) => x.salario_min);
  const preheader = una ? `${p.titulo} ya está en línea y recibiendo candidatos. Aquí tiene su comprobante.` : `Sus ${v.length} vacantes ya están en línea. Aquí tiene sus comprobantes.`;
  const titular = `${nombre ? `${esc(nombre)}, su` : "Su"} ${una ? "vacante ya está" : "vacantes ya están"}<br>trabajando para usted.`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>${esc(asuntoGracias(d))}</title></head>
<body style="margin:0;padding:0;background:#eef2f7;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;"><tr><td align="center" style="padding:24px 10px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${NOCHE};border-radius:20px;overflow:hidden;">

<!-- Cabecera -->
<tr><td style="padding:26px 30px 4px 30px;">
  <img src="${SITIO}/email/logo-blanco-440.png" width="150" alt="Enlace Laboral RD" style="display:block;border:0;width:150px;height:auto;">
</td></tr>

<!-- Animación -->
<tr><td align="center"><a href="${utm(enlace, "animacion")}" style="text-decoration:none;"><img src="${SITIO}/email/publicada.gif?v=3" width="600" alt="¡Publicada! Su vacante ya está en línea en Enlace Laboral RD" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></a></td></tr>

<!-- Titular -->
<tr><td style="padding:6px 40px 30px 40px;${F}" align="center">
  <h1 style="margin:0 0 14px 0;font-size:27px;line-height:35px;font-weight:700;letter-spacing:-.3px;color:#ffffff;">${titular}</h1>
  <p style="margin:0 auto;max-width:460px;font-size:16px;line-height:26px;color:#b8c7dd;">Gracias por confiar en Enlace Laboral RD. Desde este momento, ${una ? "su oferta está" : "sus ofertas están"} frente a personas de todo el país que buscan una oportunidad como la suya.</p>
</td></tr>

${progreso()}

<!-- Ficha -->
<tr><td style="background:#f6f8fb;padding:34px 24px 14px 24px;${F}">
  ${etiqueta("Así la ven los candidatos", AZUL2)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${v.map(ficha).join("")}
  </table>
</td></tr>

<!-- Consejo / reconocimiento -->
<tr><td style="background:#f6f8fb;padding:0 24px 30px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid ${AZUL2};"><tr><td style="padding:4px 0 4px 18px;${F}">
    ${conSalario
      ? `<p style="margin:0 0 4px 0;font-size:15px;font-weight:700;color:${TINTA};">Publicó el salario. Eso marca la diferencia.</p><p style="margin:0;font-size:14px;line-height:22px;color:#475569;">Quien aplica ya sabe que la oferta le conviene, así que recibirá candidatos más alineados y entrevistas más productivas.</p>`
      : `<p style="margin:0 0 4px 0;font-size:15px;font-weight:700;color:${TINTA};">Recomendación de reclutamiento</p><p style="margin:0;font-size:14px;line-height:22px;color:#475569;">Cuando la oferta muestra el rango salarial, las personas deciden antes de aplicar si les conviene: menos aplicaciones que no encajan y más de quienes sí. Si desea agregarlo, responda este correo con el rango y lo actualizamos.</p>`}
  </td></tr></table>
</td></tr>

<!-- Difusión -->
<tr><td style="padding:34px 30px 18px 30px;${F}" align="center">
  ${etiqueta("Multiplique su alcance")}
  <p style="margin:0 0 6px 0;font-size:20px;line-height:28px;font-weight:700;color:#ffffff;">Compártala con su red</p>
  <p style="margin:0 auto 18px auto;max-width:440px;font-size:14px;line-height:22px;color:#b8c7dd;">Una oferta que llega a través de alguien conocido genera más confianza.</p>
  ${boton(wa, "WhatsApp", "contorno")}${boton(li, "LinkedIn", "contorno")}${boton(fb, "Facebook", "contorno")}
</td></tr>

<!-- Próxima vacante -->
<tr><td style="padding:10px 30px 14px 30px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${AZUL};background-image:linear-gradient(135deg,${AZUL} 0%,#0f3f86 100%);border-radius:16px;"><tr><td style="padding:28px 26px;${F}" align="center">
    <p style="margin:0 0 6px 0;font-size:19px;line-height:27px;font-weight:700;color:#ffffff;">¿Tiene otra posición abierta?</p>
    <p style="margin:0 auto 18px auto;max-width:420px;font-size:14px;line-height:22px;color:#c9d8ee;">Publíquela gratis en dos minutos, o responda este correo con los detalles y nos encargamos.</p>
    ${boton(utm(`${SITIO}/empresas`, "otra_vacante"), "Publicar otra vacante", "claro")}
  </td></tr></table>
</td></tr>

${siganos()}

<!-- Firma -->
<tr><td style="padding:22px 30px 30px 30px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1f3a60;"><tr>
    <td width="56" valign="top" style="padding-top:22px;"><img src="${SITIO}/icon-192.png" width="42" height="42" alt="" style="display:block;border:0;border-radius:10px;"></td>
    <td valign="top" style="padding-top:22px;${F}">
      <p style="margin:0;font-size:14px;color:#b8c7dd;">Con gratitud,</p>
      <p style="margin:2px 0 0 0;font-size:15px;font-weight:700;color:#ffffff;">Equipo de Empleo · Enlace Laboral RD</p>
      <p style="margin:2px 0 8px 0;font-size:13px;color:${CELESTE};">Conectamos talento con oportunidades reales</p>
      <p style="margin:0;font-size:13px;color:#8fa3bf;"><a href="${utm(SITIO, "firma")}" style="color:#ffffff;text-decoration:none;">enlacelaboralrd.com</a> &nbsp;·&nbsp; <a href="mailto:info@enlacelaboralrd.com" style="color:#8fa3bf;text-decoration:none;">info@enlacelaboralrd.com</a></p>
    </td>
  </tr></table>
</td></tr>

</table>
<p style="margin:18px auto 0 auto;max-width:520px;${F}font-size:11px;line-height:17px;color:#8494ad;text-align:center;">Recibe este correo porque su empresa publicó una vacante en Enlace Laboral RD. Es un aviso único por cada publicación. Si no desea estos avisos, responda con la palabra BAJA.<br>Enlace Laboral RD · Santo Domingo, República Dominicana</p>
</td></tr></table>
</body></html>`;
}

/** Datos de ejemplo para la vista previa (/api/gracias-empresas/ejemplo). */
export const EJEMPLO_GRACIAS: DatosGracias = {
  contacto: "María Rodríguez",
  empresa: "Rojo Gas",
  vacantes: [
    { id: "9a10cee5-b176-4736-9122-7fc1b7135627", titulo: "Coordinador(a) de Ventas y Promociones", empresa: "Rojo Gas", provincia: "Distrito Nacional", modalidad: "Presencial", tipo: "Tiempo completo", salario_min: null, salario_max: null, aplicar: "reclutamiento@rojogas.com", redes: true, publicada: "2026-11-17T14:49:42Z" },
  ],
};

// Correo «Su vacante ya está publicada» (17 nov 2026).
// Se envía desde info@enlacelaboralrd.com (Zoho, vía la tarea programada) a la empresa que publicó.
// Diseño en tablas y estilos en línea: se ve bien en Gmail, Outlook y el celular.
// Psicología aplicada: reconocimiento (gracias + su nombre), cierre de ciclo (✓ ya está en línea),
// expectativa clara (qué pasa ahora), autonomía (compartirla ella misma) y reciprocidad (próxima vacante gratis).

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
};

export type DatosGracias = { contacto: string | null; empresa: string; vacantes: VacanteGracias[] };

const SITIO = "https://enlacelaboralrd.com";
const AZUL = "#0a2f5c";
const AZUL2 = "#0f4aa8";
const CELESTE = "#8EC1FF";
const VERDE = "#0f7a43";
const TINTA = "#0f172a";
const GRIS = "#475569";
const FUENTE = "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const utm = (u: string, c: string) => `${u}${u.includes("?") ? "&" : "?"}utm_source=correo&utm_medium=email&utm_campaign=gracias_publicada&utm_content=${c}`;
const rd = (n: number) => "RD$" + n.toLocaleString("es-DO");

export function primerNombre(contacto: string | null): string | null {
  const n = (contacto ?? "").trim().split(/\s+/)[0] ?? "";
  if (!n || n.length < 2 || /@|\d|rrhh|recursos|gesti[oó]n|talento|empresa|reclutamiento/i.test(n)) return null;
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

export function asuntoGracias(d: DatosGracias): string {
  const v = d.vacantes;
  if (v.length === 1) return `✓ Su vacante de ${v[0]!.titulo} ya está publicada en Enlace Laboral`;
  return `✓ Sus ${v.length} vacantes ya están publicadas en Enlace Laboral`;
}

function salario(v: VacanteGracias): string | null {
  if (v.salario_min && v.salario_max && v.salario_max > v.salario_min) return `${rd(v.salario_min)} – ${rd(v.salario_max)}`;
  if (v.salario_min) return rd(v.salario_min);
  return null;
}

function contactoAplicar(a: string | null): string | null {
  const t = (a ?? "").trim();
  if (!t || /^https?:\/\//i.test(t) && /enlacelaboral|enlace-rd/i.test(t)) return null;
  return t.length > 90 ? t.slice(0, 87) + "…" : t;
}

function ficha(v: VacanteGracias, i: number): string {
  const url = utm(`${SITIO}/vacantes/${v.id}`, `ver_${i + 1}`);
  const chips = [v.provincia, v.modalidad, v.tipo].filter(Boolean).map((c) => `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 10px;border-radius:999px;background:#eef4ff;color:${AZUL};font-size:12px;font-weight:600;">${esc(c!)}</span>`).join("");
  const s = salario(v);
  const ap = contactoAplicar(v.aplicar);
  return `
<tr><td style="padding:0 0 14px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dbe5f3;border-radius:16px;background:#ffffff;">
    <tr><td style="padding:18px 20px 6px 20px;${FUENTE}">
      <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${VERDE};font-weight:700;">● En línea ahora</p>
      <p style="margin:0;font-size:20px;line-height:26px;font-weight:800;color:${TINTA};">${esc(v.titulo)}</p>
      <p style="margin:4px 0 10px 0;font-size:14px;color:${GRIS};">${esc(v.empresa)}</p>
      ${chips}
      ${s ? `<p style="margin:6px 0 0 0;font-size:15px;font-weight:700;color:${VERDE};">💰 ${esc(s)}</p>` : ""}
      ${ap ? `<p style="margin:8px 0 0 0;font-size:13px;color:${GRIS};">Las personas aplican a: <strong style="color:${TINTA};">${esc(ap)}</strong></p>` : ""}
    </td></tr>
    <tr><td style="padding:12px 20px 18px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="border-radius:10px;background:${AZUL};"><a href="${url}" style="display:inline-block;padding:11px 18px;${FUENTE}font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Ver mi vacante publicada →</a></td>
      </tr></table>
    </td></tr>
  </table>
</td></tr>`;
}

function paso(n: string, titulo: string, texto: string): string {
  return `
<tr><td style="padding:0 0 14px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="44" valign="top"><div style="width:34px;height:34px;line-height:34px;border-radius:999px;background:${AZUL};color:#ffffff;text-align:center;${FUENTE}font-size:15px;font-weight:800;">${n}</div></td>
    <td valign="top" style="${FUENTE}">
      <p style="margin:2px 0 2px 0;font-size:15px;font-weight:700;color:${TINTA};">${titulo}</p>
      <p style="margin:0;font-size:14px;line-height:21px;color:${GRIS};">${texto}</p>
    </td>
  </tr></table>
</td></tr>`;
}

export function correoGracias(d: DatosGracias): string {
  const v = d.vacantes;
  const una = v.length === 1;
  const nombre = primerNombre(d.contacto);
  const saludo = nombre ? `${esc(nombre)}, gracias` : "Gracias";
  const principal = v[0]!;
  const enlacePrincipal = `${SITIO}/vacantes/${principal.id}`;
  const textoWa = una ? `Estamos contratando: ${principal.titulo} en ${principal.empresa}. Aplica gratis aquí: ${enlacePrincipal}` : `${principal.empresa} está contratando. Mira nuestras vacantes y aplica gratis: ${enlacePrincipal}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(textoWa)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(enlacePrincipal)}`;
  const redes = v.some((x) => x.redes);
  const sinSalario = v.some((x) => !x.salario_min);
  const preheader = una ? `${principal.titulo} ya está en línea y lista para recibir candidatos. Gracias por confiar en Enlace Laboral.` : `Sus ${v.length} vacantes ya están en línea y listas para recibir candidatos.`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(asuntoGracias(d))}</title></head>
<body style="margin:0;padding:0;background:#f1f5fb;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5fb;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 6px 24px rgba(10,47,92,.08);">

<!-- Portada -->
<tr><td style="background:${AZUL};background-image:linear-gradient(135deg,${AZUL} 0%,#0c3a74 55%,${AZUL2} 100%);padding:30px 28px 34px 28px;${FUENTE}">
  <img src="${SITIO}/email/logo-blanco-440.png" width="190" alt="Enlace Laboral RD" style="display:block;border:0;width:190px;height:auto;margin:0 0 26px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(142,193,255,.55);padding:6px 14px;${FUENTE}font-size:12px;font-weight:800;letter-spacing:1.5px;color:${CELESTE};">✓ ${una ? "VACANTE PUBLICADA" : `${v.length} VACANTES PUBLICADAS`}</td></tr></table>
  <h1 style="margin:16px 0 10px 0;font-size:30px;line-height:36px;font-weight:800;color:#ffffff;">${una ? "Su vacante ya está en el aire." : "Sus vacantes ya están en el aire."}</h1>
  <p style="margin:0;font-size:16px;line-height:24px;color:#dbe8ff;">${saludo} por confiar en Enlace Laboral para encontrar ${una ? "a la persona que su equipo necesita" : "a las personas que su equipo necesita"}. Desde este momento, ${una ? "su oferta está" : "sus ofertas están"} a la vista de quienes buscan empleo en República Dominicana.</p>
</td></tr>

<!-- Ficha(s) -->
<tr><td style="padding:26px 24px 8px 24px;background:#f7faff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${v.map(ficha).join("")}
  </table>
</td></tr>

<!-- Qué pasa ahora -->
<tr><td style="padding:24px 28px 6px 28px;${FUENTE}">
  <p style="margin:0 0 16px 0;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${AZUL2};font-weight:800;">Lo que pasa a partir de ahora</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${paso("1", "Ya se puede encontrar", `Aparece en enlacelaboralrd.com, en los filtros por provincia y área, y la preparamos para que Google la muestre en búsquedas de empleo.`)}
    ${redes ? paso("2", "La llevamos a donde está la gente", `La compartimos en nuestros canales de Telegram, WhatsApp e Instagram para que llegue a más personas.`) : paso("2", "Presentada con claridad", `La ordenamos en secciones (funciones, requisitos y lo que ofrecen) para que cada persona sepa en segundos si encaja.`)}
    ${paso("3", "Los candidatos le llegan directo", `Cada persona aplica por la vía que usted indicó. Enlace Laboral nunca les cobra por aplicar, así que solo llegan personas con interés real.`)}
  </table>
</td></tr>

<!-- Compartir -->
<tr><td style="padding:10px 24px 6px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef6f1;border-radius:16px;"><tr><td style="padding:20px;${FUENTE}">
    <p style="margin:0 0 4px 0;font-size:16px;font-weight:800;color:${TINTA};">Multiplique su alcance en 10 segundos</p>
    <p style="margin:0 0 14px 0;font-size:14px;line-height:21px;color:${GRIS};">Las personas confían más en una oferta que les llega de alguien que conocen. Compártala con su equipo y su red:</p>
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="border-radius:10px;background:#1f9d55;"><a href="${wa}" style="display:inline-block;padding:10px 16px;${FUENTE}font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Compartir por WhatsApp</a></td>
      <td width="10"></td>
      <td style="border-radius:10px;background:#0a66c2;"><a href="${li}" style="display:inline-block;padding:10px 16px;${FUENTE}font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Compartir en LinkedIn</a></td>
    </tr></table>
  </td></tr></table>
</td></tr>

${sinSalario ? `<!-- Consejo -->
<tr><td style="padding:12px 24px 6px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid ${CELESTE};background:#f7faff;border-radius:0 12px 12px 0;"><tr><td style="padding:16px 18px;${FUENTE}">
    <p style="margin:0 0 4px 0;font-size:14px;font-weight:800;color:${AZUL};">💡 Un consejo de reclutadora</p>
    <p style="margin:0;font-size:14px;line-height:21px;color:${GRIS};">Cuando la oferta muestra el rango salarial, las personas deciden antes de aplicar si les conviene: usted recibe menos aplicaciones que no encajan y más de quienes sí. Si quiere agregarlo, responda este correo con el rango y lo actualizamos.</p>
  </td></tr></table>
</td></tr>` : ""}

<!-- Próxima vacante -->
<tr><td style="padding:22px 28px 8px 28px;${FUENTE}" align="center">
  <p style="margin:0 0 6px 0;font-size:18px;font-weight:800;color:${TINTA};">¿Tiene otra posición abierta?</p>
  <p style="margin:0 0 16px 0;font-size:14px;line-height:21px;color:${GRIS};">Publíquela gratis en dos minutos, o simplemente responda este correo con el flyer o los detalles y nosotros nos encargamos.</p>
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:12px;background:${AZUL2};"><a href="${utm(`${SITIO}/empresas`, "otra_vacante")}" style="display:inline-block;padding:13px 22px;${FUENTE}font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;">Publicar otra vacante gratis →</a></td></tr></table>
</td></tr>

<!-- Firma -->
<tr><td style="padding:26px 28px 24px 28px;${FUENTE}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;"><tr>
    <td width="58" valign="top" style="padding-top:18px;"><img src="${SITIO}/icon-192.png" width="46" height="46" alt="" style="display:block;border:0;border-radius:12px;"></td>
    <td valign="top" style="padding-top:18px;${FUENTE}">
      <p style="margin:0;font-size:14px;color:${TINTA};">Con gratitud,</p>
      <p style="margin:2px 0 0 0;font-size:15px;font-weight:800;color:${AZUL};">Equipo de Empleo · Enlace Laboral RD</p>
      <p style="margin:2px 0 0 0;font-size:13px;color:${GRIS};font-style:italic;">Conectamos talento con oportunidades reales</p>
      <p style="margin:8px 0 0 0;font-size:13px;color:${GRIS};"><a href="${utm(SITIO, "firma")}" style="color:${AZUL2};text-decoration:none;font-weight:600;">enlacelaboralrd.com</a> · <a href="mailto:info@enlacelaboralrd.com" style="color:${AZUL2};text-decoration:none;">info@enlacelaboralrd.com</a> · <a href="https://www.instagram.com/enlacelaboralrd" style="color:${AZUL2};text-decoration:none;">@enlacelaboralrd</a></p>
    </td>
  </tr></table>
</td></tr>

</table>
<p style="margin:16px 0 0 0;max-width:560px;${FUENTE}font-size:11px;line-height:17px;color:#94a3b8;text-align:center;">Recibe este correo porque su empresa publicó una vacante en Enlace Laboral RD. Es un aviso único por cada publicación; no le enviaremos publicidad. Si no desea estos avisos, responda con la palabra BAJA.<br>Enlace Laboral RD · Santo Domingo, República Dominicana</p>
</td></tr></table>
</body></html>`;
}

/** Datos de ejemplo para la vista previa (/api/gracias-empresas/ejemplo). */
export const EJEMPLO_GRACIAS: DatosGracias = {
  contacto: "María Rodríguez",
  empresa: "Ferretería Ejemplo",
  vacantes: [
    { id: "00000000-0000-0000-0000-000000000000", titulo: "Coordinador(a) de Ventas", empresa: "Ferretería Ejemplo", provincia: "Santo Domingo", modalidad: "Presencial", tipo: "Tiempo completo", salario_min: null, salario_max: null, aplicar: "rrhh@ejemplo.do", redes: true },
  ],
};

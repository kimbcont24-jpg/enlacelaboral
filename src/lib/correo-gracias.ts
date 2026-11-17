// Correo «Su vacante ya está publicada» · versión 2 (17 nov 2026, «más espectacular»).
// Se envía desde info@enlacelaboralrd.com (Zoho, vía la tarea programada) a la empresa que publicó.
// Tablas + estilos en línea: Gmail, Outlook y celular. El GIF animado (public/email/publicada.gif)
// empieza con el cuadro final, así Outlook de escritorio (que no anima) muestra el check completo.
//
// Psicología aplicada:
//  · Cierre de ciclo y recompensa inmediata: animación del check + «¡PUBLICADA!» (efecto Zeigarnik resuelto).
//  · Progreso visible: rastreador Recibida → Revisada → Publicada → Recibiendo candidatos (sensación de avance).
//  · Prueba tangible: «Así la ven los candidatos» con la imagen real de su vacante y un comprobante con número.
//  · Refuerzo positivo: si publicó salario, se le felicita; si no, consejo de reclutadora (sin cifras inventadas).
//  · Autonomía y efecto multiplicador: kit para difundirla en un toque.
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
const ORO = "#F5B83D";
const VERDE = "#2BD47D";
const TINTA = "#0f172a";
const GRIS = "#475569";
const F = "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
const FT = "font-family:'Unbounded','Segoe UI',Roboto,Helvetica,Arial,sans-serif;";

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const utm = (u: string, c: string) => `${u}${u.includes("?") ? "&" : "?"}utm_source=correo&utm_medium=email&utm_campaign=gracias_publicada&utm_content=${c}`;
const rd = (n: number) => "RD$" + n.toLocaleString("es-DO");
const numero = (id: string) => "EL-" + id.replace(/-/g, "").slice(0, 6).toUpperCase();

export function primerNombre(contacto: string | null): string | null {
  const n = (contacto ?? "").trim().split(/\s+/)[0] ?? "";
  if (!n || n.length < 2 || /@|\d|rrhh|recursos|gesti[oó]n|talento|empresa|reclutamiento|equipo|depto|departamento/i.test(n)) return null;
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

export function asuntoGracias(d: DatosGracias): string {
  const v = d.vacantes;
  if (v.length === 1) return `✅ ¡Publicada! Su vacante de ${v[0]!.titulo} ya está en línea`;
  return `✅ ¡Publicadas! Sus ${v.length} vacantes ya están en línea`;
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

function boton(href: string, texto: string, fondo: string, color = "#ffffff", borde = fondo): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 6px 8px 0;"><tr><td style="border-radius:12px;background:${fondo};border:1px solid ${borde};"><a href="${href}" style="display:inline-block;padding:12px 18px;${F}font-size:14px;font-weight:700;color:${color};text-decoration:none;">${texto}</a></td></tr></table>`;
}

/** Rastreador de estado: los 3 primeros completos y el 4.º «en vivo». */
function rastreador(): string {
  const paso = (titulo: string, sub: string, hecho: boolean, ultimo = false) => `
    <td width="25%" valign="top" align="center" style="padding:0 4px;${F}">
      <div style="width:34px;height:34px;line-height:34px;margin:0 auto;border-radius:999px;${hecho ? `background:${VERDE};color:${NOCHE};` : `background:${NOCHE};color:${ORO};border:2px solid ${ORO};line-height:30px;width:30px;height:30px;`}font-size:16px;font-weight:900;text-align:center;">${hecho ? "✓" : "●"}</div>
      <p style="margin:8px 0 2px 0;font-size:13px;font-weight:800;color:${ultimo ? ORO : "#ffffff"};">${titulo}</p>
      <p style="margin:0;font-size:11px;line-height:15px;color:#9fb6d9;">${sub}</p>
    </td>`;
  return `
<tr><td style="background:${NOCHE};padding:6px 18px 30px 18px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td colspan="4" style="padding:0 30px 14px 30px;"><div style="height:4px;border-radius:4px;background:${VERDE};background-image:linear-gradient(90deg,${VERDE} 0%,${VERDE} 72%,${ORO} 100%);font-size:0;line-height:0;">&nbsp;</div></td></tr>
    <tr>
      ${paso("Recibida", "Llegó a nuestro equipo", true)}
      ${paso("Revisada", "Clara, sin discriminación", true)}
      ${paso("Publicada", "Visible para todo el país", true)}
      ${paso("En vivo", "Recibiendo candidatos", false, true)}
    </tr>
  </table>
</td></tr>`;
}

/** «Así la ven los candidatos»: imagen real de la vacante + comprobante. */
function vitrina(v: VacanteGracias, i: number): string {
  const url = utm(`${SITIO}/vacantes/${v.id}`, `ver_${i + 1}`);
  const img = `${SITIO}/og/vacantes/${v.id}.png`;
  const s = salario(v);
  const ap = contactoAplicar(v.aplicar);
  const fila = (k: string, val: string) => `<tr><td style="padding:7px 0;border-bottom:1px dashed #d6e1f0;${F}font-size:12px;letter-spacing:.6px;text-transform:uppercase;color:#7b8ca6;" width="38%">${k}</td><td style="padding:7px 0;border-bottom:1px dashed #d6e1f0;${F}font-size:14px;font-weight:700;color:${TINTA};" align="right">${val}</td></tr>`;
  return `
<tr><td style="padding:0 0 22px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;border:1px solid #dbe5f3;box-shadow:0 10px 30px rgba(6,26,53,.10);">
    <tr><td style="padding:14px 14px 0 14px;">
      <a href="${url}" style="text-decoration:none;"><img src="${img}" width="544" alt="${esc(v.titulo)} · ${esc(v.empresa)}" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:14px;background:${AZUL};"></a>
    </td></tr>
    <tr><td style="padding:16px 22px 4px 22px;${F}">
      <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:${AZUL2};">Comprobante de publicación · ${numero(v.id)}</p>
      <p style="margin:6px 0 2px 0;${FT}font-size:21px;line-height:27px;font-weight:800;color:${TINTA};">${esc(v.titulo)}</p>
      <p style="margin:0 0 10px 0;font-size:14px;color:${GRIS};">${esc(v.empresa)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${fila("Publicada", esc(fechaRD(v.publicada)))}
        ${fila("Ubicación", esc([v.provincia, v.modalidad].filter(Boolean).join(" · ") || "República Dominicana"))}
        ${v.tipo ? fila("Jornada", esc(v.tipo)) : ""}
        ${fila("Salario", s ? `<span style="color:#0f7a43;">${esc(s)}</span>` : `<span style="color:#9a6b00;">No publicado</span>`)}
        ${ap ? fila("Aplican a", esc(ap)) : ""}
        ${fila("Costo", `<span style="color:#0f7a43;">Gratis ✓</span>`)}
      </table>
    </td></tr>
    <tr><td style="padding:14px 22px 22px 22px;">
      ${boton(url, "Ver mi vacante en vivo →", AZUL)}
    </td></tr>
  </table>
</td></tr>`;
}


/** Redes oficiales de Enlace Laboral RD (verificadas en el sitio y en el proyecto, 17 nov 2026). */
export const REDES = [
  { red: "Instagram", detalle: "@enlacelaboralrd", url: "https://www.instagram.com/enlacelaboralrd", color: "#E1306C", accion: "Seguir" },
  { red: "Canal de WhatsApp", detalle: "Vacantes al momento", url: "https://whatsapp.com/channel/0029Vb7GW0UKLaHf3idEm62D", color: "#25D366", accion: "Unirme" },
  { red: "Canal de Telegram", detalle: "t.me/enlacelaboral", url: "https://t.me/enlacelaboral", color: "#229ED9", accion: "Unirme" },
  { red: "LinkedIn", detalle: "Enlace Laboral RD", url: "https://www.linkedin.com/company/enlacelaboralrd", color: "#0A66C2", accion: "Seguir" },
  { red: "Facebook", detalle: "Enlace Laboral RD", url: "https://www.facebook.com/109048674048597", color: "#1877F2", accion: "Seguir" },
] as const;

function siganos(): string {
  const tarjeta = (r: (typeof REDES)[number]) => `
      <td width="50%" valign="top" style="padding:5px;">
        <a href="${r.url}" style="display:block;text-decoration:none;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c2a52;border:1px solid #1d3a63;border-left:5px solid ${r.color};border-radius:14px;"><tr>
          <td style="padding:12px;${F}">
            <p style="margin:0;font-size:14px;line-height:18px;font-weight:800;color:#ffffff;">${r.red}</p>
            <p style="margin:2px 0 8px 0;font-size:12px;line-height:16px;color:#9fb6d9;word-break:break-word;">${r.detalle}</p>
            <span style="display:inline-block;padding:5px 11px;border-radius:999px;background:${r.color};font-size:12px;font-weight:800;color:#ffffff;">${r.accion} →</span>
          </td>
        </tr></table>
        </a>
      </td>`;
  const filas: string[] = [];
  for (let i = 0; i < REDES.length; i += 2) {
    const a = REDES[i]!, b = REDES[i + 1];
    filas.push(`<tr>${tarjeta(a)}${b ? tarjeta(b) : `<td width="50%" valign="top" style="padding:5px;">
        <a href="${utm(SITIO, "siganos")}" style="display:block;text-decoration:none;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ORO};border-radius:14px;"><tr><td style="padding:12px;${F}">
          <p style="margin:0;font-size:14px;line-height:18px;font-weight:800;color:${NOCHE};word-break:break-word;">Nuestra web</p>
          <p style="margin:2px 0 8px 0;font-size:12px;line-height:16px;color:${NOCHE};">enlacelaboralrd.com</p>
          <span style="display:inline-block;padding:5px 11px;border-radius:999px;background:${NOCHE};font-size:12px;font-weight:800;color:#ffffff;">Ver vacantes →</span>
        </td></tr></table></a>
      </td>`}</tr>`);
  }
  return `
<!-- Síganos -->
<tr><td style="background:${NOCHE};padding:6px 25px 26px 25px;${F}">
  <p style="margin:0 0 4px 0;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:${VERDE};" align="center">Síganos y no se pierda nada</p>
  <p style="margin:0 0 14px 0;font-size:14px;line-height:21px;color:#c9d8ee;" align="center">Allí compartimos las vacantes de empresas como la suya y consejos para contratar mejor.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${filas.join("\n    ")}
  </table>
</td></tr>
`;
}

export function correoGracias(d: DatosGracias): string {
  const v = d.vacantes;
  const una = v.length === 1;
  const nombre = primerNombre(d.contacto);
  const p = v[0]!;
  const enlace = `${SITIO}/vacantes/${p.id}`;
  const textoWa = una ? `🚀 Estamos contratando: ${p.titulo} en ${p.empresa}. Aplica gratis aquí 👉 ${enlace}` : `🚀 ${p.empresa} está contratando. Mira nuestras vacantes y aplica gratis 👉 ${enlace}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(textoWa)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(enlace)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(enlace)}`;
  const conSalario = v.every((x) => x.salario_min);
  const preheader = una ? `${p.titulo} ya está en línea y recibiendo candidatos. Aquí está su comprobante y cómo multiplicar su alcance.` : `Sus ${v.length} vacantes ya están en línea. Aquí están sus comprobantes.`;
  const titular = nombre ? `${esc(nombre)}, su vacante ya está<br>trabajando para usted.` : `Su vacante ya está<br>trabajando para usted.`;
  const titularVarias = nombre ? `${esc(nombre)}, sus vacantes ya están<br>trabajando para usted.` : `Sus vacantes ya están<br>trabajando para usted.`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>${esc(asuntoGracias(d))}</title></head>
<body style="margin:0;padding:0;background:#e9eef6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9eef6;"><tr><td align="center" style="padding:22px 10px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${NOCHE};border-radius:26px;overflow:hidden;">

<!-- Barra superior -->
<tr><td style="padding:22px 26px 6px 26px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td valign="middle"><img src="${SITIO}/email/logo-blanco-440.png" width="150" alt="Enlace Laboral RD" style="display:block;border:0;width:150px;height:auto;"></td>
    <td valign="middle" align="right" style="${F}font-size:11px;font-weight:800;letter-spacing:1.4px;color:${VERDE};">● EN VIVO</td>
  </tr></table>
</td></tr>

<!-- Animación -->
<tr><td style="padding:6px 0 0 0;" align="center">
  <a href="${utm(enlace, "animacion")}" style="text-decoration:none;"><img src="${SITIO}/email/publicada.gif" width="600" alt="✓ ¡PUBLICADA! Su vacante ya está en línea en Enlace Laboral RD" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></a>
</td></tr>

<!-- Titular -->
<tr><td style="padding:8px 30px 26px 30px;${F}" align="center">
  <h1 style="margin:0 0 12px 0;${FT}font-size:26px;line-height:34px;font-weight:800;color:#ffffff;">${una ? titular : titularVarias}</h1>
  <p style="margin:0 auto;max-width:470px;font-size:16px;line-height:25px;color:#c9d8ee;">Gracias por confiar en <strong style="color:#ffffff;">Enlace Laboral RD</strong>. Desde este momento, ${una ? "su oferta está" : "sus ofertas están"} frente a personas de todo el país que buscan exactamente una oportunidad como la suya.</p>
</td></tr>

${rastreador()}

<!-- Vitrina -->
<tr><td style="background:#f2f6fc;padding:30px 24px 8px 24px;${F}">
  <p style="margin:0 0 4px 0;font-size:12px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:${AZUL2};" align="center">Así la están viendo los candidatos</p>
  <p style="margin:0 0 20px 0;font-size:14px;color:${GRIS};" align="center">${una ? "Esta es la imagen que aparece cuando alguien comparte su vacante." : "Estas son las imágenes que aparecen cuando alguien comparte sus vacantes."}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${v.map(vitrina).join("")}
  </table>
</td></tr>

<!-- Kit de difusión -->
<tr><td style="background:#f2f6fc;padding:4px 24px 26px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${AZUL};background-image:linear-gradient(135deg,${AZUL} 0%,#0f4aa8 100%);border-radius:20px;"><tr><td style="padding:24px 22px 18px 22px;${F}">
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:${ORO};">Kit de difusión · 10 segundos</p>
    <p style="margin:0 0 8px 0;${FT}font-size:19px;line-height:26px;font-weight:800;color:#ffffff;">Multiplique su alcance con un toque</p>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:21px;color:#c9d8ee;">Una oferta que llega por alguien conocido se percibe más confiable. Compártala en su red y en los grupos de su equipo:</p>
    ${boton(wa, "WhatsApp", "#25D366", NOCHE)}${boton(li, "LinkedIn", "#0a66c2")}${boton(fb, "Facebook", "#1877f2")}
    <p style="margin:8px 0 0 0;font-size:12px;color:#9fb6d9;">Enlace directo: <a href="${enlace}" style="color:${CELESTE};text-decoration:underline;">${enlace.replace("https://", "")}</a></p>
  </td></tr></table>
</td></tr>

<!-- Refuerzo / consejo -->
<tr><td style="background:#f2f6fc;padding:0 24px 28px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;border:1px solid #dbe5f3;"><tr>
    <td width="64" valign="top" style="padding:20px 0 20px 20px;"><div style="width:44px;height:44px;line-height:44px;border-radius:14px;background:${conSalario ? "#e3f8ec" : "#fff4dc"};text-align:center;font-size:22px;">${conSalario ? "🏆" : "💡"}</div></td>
    <td valign="top" style="padding:20px 20px 20px 12px;${F}">
      ${conSalario
        ? `<p style="margin:0 0 4px 0;font-size:15px;font-weight:800;color:${TINTA};">Bien hecho: publicó el salario</p><p style="margin:0;font-size:14px;line-height:21px;color:${GRIS};">Eso es transparencia, y se nota. Quien aplica ya sabe que la oferta le sirve, así que usted recibe candidatos más alineados y entrevistas más productivas.</p>`
        : `<p style="margin:0 0 4px 0;font-size:15px;font-weight:800;color:${TINTA};">Consejo de reclutadora</p><p style="margin:0;font-size:14px;line-height:21px;color:${GRIS};">Cuando la oferta muestra el rango salarial, las personas deciden antes de aplicar si les conviene: menos aplicaciones que no encajan y más de quienes sí. ¿Quiere agregarlo? Responda este correo con el rango y lo actualizamos.</p>`}
    </td>
  </tr></table>
</td></tr>

<!-- Próxima vacante -->
<tr><td style="background:${NOCHE};background-image:radial-gradient(circle at 50% 0%,#123e7a 0%,${NOCHE} 70%);padding:34px 30px 30px 30px;${F}" align="center">
  <p style="margin:0 0 6px 0;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:${CELESTE};">La próxima también va por nosotros</p>
  <p style="margin:0 0 10px 0;${FT}font-size:22px;line-height:30px;font-weight:800;color:#ffffff;">¿Tiene otra posición abierta?</p>
  <p style="margin:0 auto 20px auto;max-width:440px;font-size:15px;line-height:23px;color:#c9d8ee;">Publíquela gratis en dos minutos, o responda este correo con el flyer o los detalles y nos encargamos de todo.</p>
  ${boton(utm(`${SITIO}/empresas`, "otra_vacante"), "Publicar otra vacante gratis →", ORO, NOCHE)}
</td></tr>

${siganos()}
<!-- Firma -->
<tr><td style="background:${NOCHE};padding:0 30px 28px 30px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1d3a63;"><tr>
    <td width="58" valign="top" style="padding-top:20px;"><img src="${SITIO}/icon-192.png" width="44" height="44" alt="" style="display:block;border:0;border-radius:12px;"></td>
    <td valign="top" style="padding-top:20px;${F}">
      <p style="margin:0;font-size:14px;color:#c9d8ee;">Con gratitud,</p>
      <p style="margin:2px 0 0 0;font-size:15px;font-weight:800;color:#ffffff;">Equipo de Empleo · Enlace Laboral RD</p>
      <p style="margin:2px 0 0 0;font-size:13px;color:${CELESTE};font-style:italic;">Conectamos talento con oportunidades reales</p>
      <p style="margin:8px 0 0 0;font-size:13px;color:#9fb6d9;"><a href="${utm(SITIO, "firma")}" style="color:#ffffff;text-decoration:none;font-weight:700;">enlacelaboralrd.com</a> · <a href="mailto:info@enlacelaboralrd.com" style="color:#9fb6d9;text-decoration:none;">info@enlacelaboralrd.com</a> · <a href="https://www.instagram.com/enlacelaboralrd" style="color:#9fb6d9;text-decoration:none;">Instagram</a> · <a href="https://whatsapp.com/channel/0029Vb7GW0UKLaHf3idEm62D" style="color:#9fb6d9;text-decoration:none;">WhatsApp</a> · <a href="https://t.me/enlacelaboral" style="color:#9fb6d9;text-decoration:none;">Telegram</a> · <a href="https://www.linkedin.com/company/enlacelaboralrd" style="color:#9fb6d9;text-decoration:none;">LinkedIn</a></p>
    </td>
  </tr></table>
</td></tr>

</table>
<p style="margin:16px auto 0 auto;max-width:540px;${F}font-size:11px;line-height:17px;color:#8494ad;text-align:center;">Recibe este correo porque su empresa publicó una vacante en Enlace Laboral RD. Es un aviso único por cada publicación; no le enviaremos publicidad. Si no desea estos avisos, responda con la palabra BAJA.<br>Enlace Laboral RD · Santo Domingo, República Dominicana</p>
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

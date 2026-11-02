// Recolector diario de vacantes reales de República Dominicana.
// Corre en GitHub Actions (gratis), guarda carga/auto-latest.json y la base lo importa sola (pg_cron + pg_net).
// Fuentes: Aldaba (solo ofertas con empresa visible, fuente visible), Eaton, Medtronic, Baxter.
import { writeFileSync, mkdirSync } from "node:fs";

const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "accept-language": "es-DO,es;q=0.9" };
const DIAS = Number(process.env.DIAS ?? 3);
const hoy = new Date();
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const limpiar = (s) => (s ?? "").replace(/<br\s*\/?>|<\/(?:td|tr|div|p|li|h\d|table|section|ul)>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
const uno = (s) => s.replace(/\s+/g, " ").trim();
const tituloBonito = (t) => { t = t.trim().replace(/^[¡!]+|[¡!]+$/g, ""); if (t === t.toUpperCase()) t = t.toLowerCase().replace(/(^|\s|\()(\p{L})/gu, (m, a, b) => a + b.toUpperCase()); return t.slice(0, 120); };
const malo = /\bedad\b|años de edad|\bsexo\b|femenin|masculin|\bhombre|\bmujer|buena presencia|foto actual/i;
const nivel = (e) => (/3\+|más de 3|3 a |4 |5 /.test(e) ? "3+ años" : /1-3|1 a 3|2 a /.test(e) ? "1-3 años" : "Sin experiencia");

function experienciaDe(texto) {
  const s = texto.toLowerCase();
  const m = s.match(/(\d+)\s*(?:ó|o)?\s*(?:más\s+)?(?:a\s*\d+\s*)?años?\s+de\s+experiencia/) || s.match(/experiencia\s+(?:mínima\s+)?(?:de\s+)?(\d+)\s*(?:a\s*\d+\s*)?años?/) || s.match(/(\d+)\s*ó\s*más\s*años/) || s.match(/(\d+)\+?\s*years/);
  if (m) { const n = Number(m[1]); return n >= 3 ? "3+ años" : "1-3 años"; }
  if (/sin experiencia|no requiere experiencia|no experience/.test(s)) return "Sin experiencia";
  if (/experiencia|experience/.test(s)) return "1-3 años";
  return "Sin experiencia";
}

const PROV = [["distrito nacional", "Distrito Nacional"], ["santo domingo", "Santo Domingo"], ["boca chica", "Santo Domingo"], ["san isidro", "Santo Domingo"], ["punta cana", "La Altagracia (Punta Cana)"], ["bávaro", "La Altagracia (Punta Cana)"], ["bavaro", "La Altagracia (Punta Cana)"], ["higüey", "La Altagracia (Punta Cana)"], ["la altagracia", "La Altagracia (Punta Cana)"], ["azua", "Azua"], ["san pedro", "San Pedro de Macorís"], ["bonao", "Monseñor Nouel (Bonao)"], ["monseñor nouel", "Monseñor Nouel (Bonao)"], ["la romana", "La Romana"], ["puerto plata", "Puerto Plata"], ["haina", "San Cristóbal"], ["san cristóbal", "San Cristóbal"], ["san cristobal", "San Cristóbal"], ["santiago", "Santiago"], ["la vega", "La Vega"], ["moca", "Espaillat (Moca)"], ["baní", "Peravia (Baní)"], ["bani", "Peravia (Baní)"], ["cotuí", "Sánchez Ramírez (Cotuí)"], ["samaná", "Samaná"], ["nagua", "María Trinidad Sánchez (Nagua)"], ["salcedo", "Hermanas Mirabal (Salcedo)"], ["mao", "Valverde (Mao)"], ["monte cristi", "Monte Cristi"], ["montecristi", "Monte Cristi"], ["dajabón", "Dajabón"], ["barahona", "Barahona"], ["san juan", "San Juan"], ["neiba", "Baoruco (Neiba)"], ["jimaní", "Independencia (Jimaní)"], ["pedernales", "Pedernales"], ["ocoa", "San José de Ocoa"], ["monte plata", "Monte Plata"], ["hato mayor", "Hato Mayor"], ["el seibo", "El Seibo"], ["san francisco", "Duarte (San Francisco)"], ["remoto", "Remoto desde RD"]];
const provinciaDe = (c, def = "Distrito Nacional") => { const s = (c ?? "").toLowerCase(); for (const [k, v] of PROV) if (s.includes(k)) return v; return def; };

const AREAS = [["recursos humanos", "Recursos Humanos"], ["gestión humana", "Recursos Humanos"], ["talent", "Recursos Humanos"], ["turismo", "Hotelería y Turismo"], ["hostel", "Hotelería y Turismo"], ["hotel", "Hotelería y Turismo"], ["cocin", "Hotelería y Turismo"], ["contab", "Contabilidad y Finanzas"], ["finanz", "Contabilidad y Finanzas"], ["financ", "Contabilidad y Finanzas"], ["auditor", "Contabilidad y Finanzas"], ["impuesto", "Contabilidad y Finanzas"], ["tax", "Contabilidad y Finanzas"], ["ventas", "Ventas"], ["comercial", "Ventas"], ["promotor", "Ventas"], ["marketing", "Ventas"], ["mercadeo", "Ventas"], ["sales", "Ventas"], ["logíst", "Logística"], ["logist", "Logística"], ["transporte", "Logística"], ["almac", "Logística"], ["chofer", "Logística"], ["mensajero", "Logística"], ["compras", "Logística"], ["buyer", "Logística"], ["sourcing", "Logística"], ["supply", "Logística"], ["material", "Logística"], ["planner", "Logística"], ["planificaci", "Logística"], ["inform", "Tecnología"], ["sistemas", "Tecnología"], ["sap", "Tecnología"], ["soporte", "Tecnología"], ["software", "Tecnología"], ["data", "Tecnología"], ["atención al cliente", "Servicio al Cliente"], ["servicio al cliente", "Servicio al Cliente"], ["recepcion", "Servicio al Cliente"], ["cajer", "Servicio al Cliente"], ["sanidad", "Salud"], ["salud", "Salud"], ["farmacia", "Salud"], ["enfermer", "Salud"], ["médic", "Salud"], ["ingenier", "Producción"], ["engineer", "Producción"], ["mantenimiento", "Producción"], ["maintenance", "Producción"], ["mecánico", "Producción"], ["técnico", "Producción"], ["technician", "Producción"], ["producción", "Producción"], ["production", "Producción"], ["manufactur", "Producción"], ["ensambl", "Producción"], ["assembl", "Producción"], ["operador", "Producción"], ["operator", "Producción"], ["calidad", "Producción"], ["quality", "Producción"], ["planta", "Producción"], ["construcc", "Producción"], ["educación", "Administración"], ["docen", "Administración"], ["teacher", "Administración"], ["administra", "Administración"], ["asistente", "Administración"], ["assistant", "Administración"]];
const areaDe = (...t) => { const s = t.join(" ").toLowerCase(); for (const [k, v] of AREAS) if (s.includes(k)) return v; return "Operaciones"; };

function requisitosDe(texto) {
  const items = [];
  for (const parte of texto.split(/\n|•|▪|(?<=[a-záéíóú)])\.\s+(?=[A-ZÁÉÍÓÚ])/)) {
    const p = parte.replace(/^[\s.\-·*–]+|[\s.]+$/g, "");
    if (p.length > 8 && p.length < 220 && !malo.test(p) && !/^(requisitos|funciones|qualifications|requirements)/i.test(p) && !items.includes(p)) items.push(p);
    if (items.length >= 7) break;
  }
  return items;
}

async function getText(url, init = {}, latin1 = false) {
  const r = await fetch(url, { ...init, headers: { ...UA, ...(init.headers ?? {}) } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const buf = await r.arrayBuffer();
  return new TextDecoder(latin1 ? "windows-1252" : "utf-8").decode(buf);
}
const fecha = (iso) => new Date(iso);
const reciente = (d) => d && (hoy - d) / 864e5 <= DIAS;

/* ---------------- Aldaba (solo ofertas con empresa visible) ---------------- */
async function aldaba() {
  const filas = [];
  const base = "https://www.aldaba.com/";
  const sec = (t, a, b) => { const i = t.search(new RegExp("\\n\\s*" + a + "\\s*\\n")); if (i < 0) return ""; const rest = t.slice(i + a.length + 2); const j = b ? rest.search(new RegExp("\\n\\s*(" + b + ")\\s*\\n")) : -1; return (j > 0 ? rest.slice(0, j) : rest).trim(); };
  let viejas = 0;
  const maxOff = Math.min(1400, 70 * DIAS);
  for (let off = 0; off < maxOff && viejas < 8; off += 7) {
    const html = await getText(`${base}ver_ofertas.php?offset=${off}&pais=Rep%FAblica+Dominicana&ln=4605&oby=dt&sel_ciudad=a%3A0%3A%7B%7D`, {}, true);
    const ids = [...new Set([...html.matchAll(/detalle_of\.php\?oferta=(\d+)/g)].map((m) => m[1]))];
    if (ids.length === 0) { log("aldaba sin ids en offset", off, "html", html.length, JSON.stringify(limpiar(html).slice(0, 400))); break; }
    for (const id of ids) {
      try {
        const t = limpiar(await getText(`${base}detalle_of.php?oferta=${id}`, {}, true).then((h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "")));
        const empresa = sec(t, "Empresa", "Actividad");
        const f = sec(t, "Fecha", "Empresa");
        const [dd, mm, yy] = f.split("-").map(Number);
        const d = yy ? new Date(yy, mm - 1, dd) : null;
        if (!reciente(d)) { viejas++; if (viejas >= 8) break; continue; }
        viejas = 0;
        if (!empresa || /confidencial/i.test(empresa)) continue;
        const puesto = sec(t, "Puesto", "Código").replace(/\|.*$/, "").trim();
        const ciudad = sec(t, "Ciudad", "País");
        const desc = sec(t, "Descripción", "Requisitos");
        const req = sec(t, "Requisitos", "Indispensable|Habilidades sugeridas|Salario|Compartir");
        const ind = sec(t, "Indispensable", "Habilidades sugeridas|Salario|Compartir");
        const area = sec(t, "Area principal", "ISCO");
        if (!puesto || !desc) continue;
        let descripcion = uno(desc).slice(0, 900);
        if (malo.test(descripcion)) descripcion = descripcion.replace(/[^.]*(edad|sexo|femenin|masculin)[^.]*\.?/gi, "").trim();
        const sal = (desc + " " + req).match(/RD\$\s?([\d,.]{5,9})/);
        const fila = { titulo: tituloBonito(puesto), empresa: empresa.slice(0, 100), provincia: provinciaDe(ciudad.split("\n")[0]), area: areaDe(area, puesto), modalidad: /remoto|teletrabajo/i.test(desc) ? "Remoto" : "Presencial", tipo: /parcial/i.test(sec(t, "Jornada", "")) ? "Medio tiempo" : "Tiempo completo", experiencia: experienciaDe(ind + " " + req + " " + desc), descripcion: `${descripcion} Publicada por la empresa en el portal Aldaba el ${f}; se aplica en la oferta original.`, requisitos: [...requisitosDe(req), ...requisitosDe(ind.replace(/•/g, "\n")).filter((x) => !/^(solo candidatos|palabra|residente)/i.test(x) && x.length < 120)].slice(0, 7).join(" | ") || "Ver requisitos en la oferta original", fuente: "Aldaba", fuente_url: `${base}detalle_of.php?oferta=${id}`, aplicar: `${base}detalle_of.php?oferta=${id}`, redes: "si" };
        if (sal) fila.salario_min = sal[1].replace(/[,.]/g, "");
        filas.push(fila);
      } catch (e) { log("aldaba detalle", id, String(e).slice(0, 80)); }
    }
  }
  return filas;
}

/* ---------------- Eaton (eightfold) ---------------- */
async function eaton() {
  const filas = [];
  const base = "https://eaton.eightfold.ai";
  let start = 0, total = 1;
  const ids = [];
  while (start < total && start < 150) {
    const j = JSON.parse(await getText(`${base}/api/pcsx/search?domain=eaton.com&query=&location=Dominican%20Republic&start=${start}&sort_by=relevance&`, { headers: { accept: "application/json" } }));
    total = j.count ?? j.data?.count ?? 0; const pos = j.positions ?? j.data?.positions ?? [];
    if (!pos.length) break; ids.push(...pos.map((p) => p.id)); start += pos.length;
  }
  for (const id of ids) {
    try {
      const j = JSON.parse(await getText(`${base}/api/pcsx/position_details?position_id=${id}&domain=eaton.com&hl=es`, { headers: { accept: "application/json" } }));
      const p = j.data ?? {};
      if (!/DOM|Dominican/i.test(p.location ?? "")) continue;
      let d = limpiar(p.jobDescription ?? "");
      const bp = d.search(/Eaton es una empresa|Eaton is an intelligent|We are committed to ensuring|Estamos comprometidos|#LI-|All positions may require/); if (bp > 0) d = d.slice(0, bp);
      const qi = d.search(/Qualifications:|Calificaciones:|Requisitos:|CONOCIMIENTO ESPECIALIZADO|Requerimientos:|Educación:|Education:/i);
      const q = qi > 0 ? d.slice(qi) : "";
      const loc = (p.location ?? "").toLowerCase();
      const prov = loc.includes("haina") ? "San Cristóbal" : loc.includes("santiago") ? "Santiago" : /10601/.test(loc) ? "Santo Domingo" : "Distrito Nacional";
      filas.push({ titulo: tituloBonito(p.name ?? ""), empresa: "Eaton", provincia: prov, area: areaDe(p.name ?? ""), modalidad: /hybrid|híbrid/i.test(d) ? "Híbrido" : "Presencial", tipo: /co-op|intern|pasant/i.test(p.name ?? "") ? "Pasantía" : "Tiempo completo", experiencia: experienciaDe(q || d), descripcion: `${uno(d).slice(0, 900)} Vacante publicada en el portal oficial de empleos de Eaton (planta de ${p.location}); se aplica en línea.`, requisitos: requisitosDe(q).join(" | ") || "Ver requisitos en el sitio de Eaton", fuente: "Sitio de la empresa", fuente_url: `${base}/careers?pid=${id}&domain=eaton.com`, aplicar: `${base}/careers?pid=${id}&domain=eaton.com`, redes: "si" });
    } catch (e) { log("eaton", id, String(e).slice(0, 80)); }
  }
  return filas;
}

/* ---------------- Medtronic (Workday) ---------------- */
async function medtronic() {
  const filas = [];
  const base = "https://medtronic.wd1.myworkdayjobs.com";
  const j = JSON.parse(await getText(`${base}/wday/cxs/medtronic/MedtronicCareers/jobs`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: "Dominican Republic" }) }));
  for (const p of j.jobPostings ?? []) {
    if (!/Dominican/i.test(p.locationsText ?? "")) continue;
    try {
      const i = JSON.parse(await getText(`${base}/wday/cxs/medtronic/MedtronicCareers${p.externalPath}`, { headers: { accept: "application/json" } })).jobPostingInfo ?? {};
      const d = limpiar(i.jobDescription ?? "");
      const titulo = tituloBonito((p.externalPath.split("/").pop() ?? i.title).replace(/_R\d+-?\d*$/, "").replace(/-/g, " "));
      const qi = d.search(/Required Knowledge and Experience|Conocimiento y experiencia requeridos|Requisitos/i);
      filas.push({ titulo, empresa: "Medtronic", provincia: provinciaDe(p.locationsText, "Santo Domingo"), area: areaDe(titulo), modalidad: "Presencial", tipo: /pasante|intern/i.test(titulo) ? "Pasantía" : "Tiempo completo", experiencia: experienciaDe(qi > 0 ? d.slice(qi, qi + 500) : d), descripcion: `${uno(d).slice(0, 900)} Publicada el ${i.startDate ?? ""} en el portal de empleos de Medtronic; se aplica en línea.`, requisitos: requisitosDe(qi > 0 ? d.slice(qi, qi + 700) : "").join(" | ") || "Ver requisitos en el sitio de Medtronic", fuente: "Sitio de la empresa", fuente_url: i.externalUrl ?? `${base}/MedtronicCareers${p.externalPath}`, aplicar: i.externalUrl ?? `${base}/MedtronicCareers${p.externalPath}`, redes: "si" });
    } catch (e) { log("medtronic", p.externalPath, String(e).slice(0, 80)); }
  }
  return filas;
}

/* ---------------- Baxter (Haina) ---------------- */
async function baxter() {
  const filas = [];
  const base = "https://jobs.baxter.com";
  const html = await getText(`${base}/en/location/provincia-de-san-cristobal-dominican-republic-jobs/152-33592/3508796-3493186/3`);
  const paths = [...new Set([...html.matchAll(/href="(\/en\/job\/bajos-de-haina\/[^"]+)"/g)].map((m) => m[1]))];
  for (const p of paths) {
    try {
      const h = await getText(base + p);
      const t = limpiar(h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ""));
      const titulo = tituloBonito(limpiar((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) ?? [])[1] ?? ""));
      const i = t.search(/Your Role at Baxter|Tu rol en Baxter|What you'll be doing|Lo que harás/i);
      const q = t.search(/What you'll bring|Lo que aportarás|Qualifications|Requisitos/i);
      const desc = i > 0 ? t.slice(i, i + 900) : t.slice(0, 900);
      const req = q > 0 ? t.slice(q, q + 700).replace(/Equal Employment[\s\S]*$/, "") : "";
      if (!titulo) continue;
      filas.push({ titulo, empresa: "Baxter", provincia: "San Cristóbal", area: areaDe(titulo), modalidad: "Presencial", tipo: "Tiempo completo", experiencia: experienciaDe(req || desc), descripcion: `${uno(desc)} Vacante de la planta de Baxter en Bajos de Haina, publicada en su portal oficial; se aplica en línea.`, requisitos: requisitosDe(req).join(" | ") || "Ver requisitos en el sitio de Baxter", fuente: "Sitio de la empresa", fuente_url: base + p, aplicar: base + p, redes: "si" });
    } catch (e) { log("baxter", p, String(e).slice(0, 80)); }
  }
  return filas;
}

/* ---------------- Genérico: páginas con JSON-LD JobPosting ---------------- */
function jsonLd(html) {
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      let j = JSON.parse(m[1].trim());
      const lista = Array.isArray(j) ? j : j["@graph"] ?? [j];
      const jp = lista.find((x) => x && /JobPosting/i.test(x["@type"] ?? ""));
      if (jp) return jp;
    } catch { /* siguiente */ }
  }
  return null;
}
function filaDesdeJobPosting(jp, { empresa, url, fuenteTexto, provDef = "Santo Domingo" }) {
  const d = limpiar(jp.description ?? "");
  const loc = jp.jobLocation ? [].concat(jp.jobLocation).map((l) => `${l.address?.addressLocality ?? ""} ${l.address?.addressRegion ?? ""}`).join(" ") : "";
  const qi = d.search(/Qualifications|Requirements|Requisitos|What you'll bring|Lo que aportarás|Education|Experience|Skills|Preferred/i);
  const q = qi > 0 ? d.slice(qi, qi + 900) : "";
  const titulo = tituloBonito(limpiar(jp.title ?? ""));
  if (!titulo || !d) return null;
  const f = jp.datePosted ? ` Publicada el ${String(jp.datePosted).slice(0, 10)}` : "";
  return { titulo, empresa, provincia: provinciaDe(loc, provDef), area: areaDe(titulo), modalidad: /remote|remoto/i.test(jp.jobLocationType ?? "") ? "Remoto" : /hybrid|híbrid/i.test(d) ? "Híbrido" : "Presencial", tipo: /part[- ]time|medio tiempo/i.test(jp.employmentType ?? "") ? "Medio tiempo" : /intern|pasant/i.test(titulo) ? "Pasantía" : "Tiempo completo", experiencia: experienciaDe(q || d), descripcion: `${uno(d).slice(0, 900)}${f} ${fuenteTexto}`, requisitos: requisitosDe(q).join(" | ") || `Ver requisitos en el sitio de ${empresa}`, fuente: "Sitio de la empresa", fuente_url: url, aplicar: url, redes: "si" };
}

/* ---------------- Alorica (SmartRecruiters, API pública) ---------------- */
async function alorica() {
  const filas = [];
  const j = JSON.parse(await getText("https://api.smartrecruiters.com/v1/companies/Alorica/postings?country=do&limit=100", { headers: { accept: "application/json" } }));
  for (const p of j.content ?? []) {
    try {
      const d = JSON.parse(await getText(`https://api.smartrecruiters.com/v1/companies/Alorica/postings/${p.id}`, { headers: { accept: "application/json" } }));
      const s = d.jobAd?.sections ?? {};
      const desc = limpiar(s.jobDescription?.text ?? "");
      const req = limpiar(s.qualifications?.text ?? "");
      const url = d.applyUrl ?? `https://jobs.smartrecruiters.com/Alorica/${p.id}`;
      const titulo = tituloBonito(p.name ?? "");
      if (!titulo || !desc) continue;
      filas.push({ titulo, empresa: "Alorica", provincia: provinciaDe(p.location?.city, "Santo Domingo"), area: /agent|customer|servicio|representante/i.test(titulo) ? "Servicio al Cliente" : areaDe(titulo), modalidad: p.location?.remote ? "Remoto" : "Presencial", tipo: /part/i.test(p.typeOfEmployment?.label ?? "") ? "Medio tiempo" : "Tiempo completo", experiencia: experienciaDe(req || desc), descripcion: `${uno(desc).slice(0, 900)} Publicada el ${String(p.releasedDate ?? "").slice(0, 10)} en el portal oficial de empleos de Alorica; se aplica en línea.`, requisitos: requisitosDe(req).join(" | ") || "Ver requisitos en el sitio de Alorica", fuente: "Sitio de la empresa", fuente_url: url, aplicar: url, redes: "si" });
    } catch (e) { log("alorica", p.id, String(e).slice(0, 80)); }
  }
  return filas;
}

/* ---------------- Marriott (hoteles en RD, por marca) ---------------- */
async function marriott() {
  const filas = [];
  const base = "https://careers.marriott.com";
  const marcas = ["w-hotels", "jw-marriott", "renaissance-hotels", "ac-hotels", "courtyard", "westin", "sheraton", "marriott-hotels", "autograph-collection", "aloft", "the-ritz-carlton", "st-regis", "tribute-portfolio", "luxury-collection", "moxy"];
  const urls = new Set();
  for (const m of marcas) {
    try {
      const h = await getText(`${base}/brands/${m}/jobs?location_name=Dominican+Republic&location_type=4`);
      for (const x of h.matchAll(/href="((?:https:\/\/careers\.marriott\.com)?\/x\/job\/[^"?#]+)/g)) urls.add(x[1].startsWith("http") ? x[1] : base + x[1]);
    } catch (e) { log("marriott marca", m, String(e).slice(0, 60)); }
  }
  for (const u of [...urls].slice(0, 60)) {
    try {
      const h = await getText(u);
      const jp = jsonLd(h);
      if (!jp) continue;
      const loc = JSON.stringify(jp.jobLocation ?? "");
      if (!/Dominican|Santo Domingo|Punta Cana|Cap Cana|Dominicana/i.test(loc + " " + (jp.title ?? ""))) continue;
      const hotel = limpiar(jp.hiringOrganization?.name ?? "Marriott International");
      const fila = filaDesdeJobPosting(jp, { empresa: hotel.slice(0, 100), url: u, fuenteTexto: "Vacante del hotel publicada en el portal oficial de empleos de Marriott International; se aplica en línea.", provDef: /punta cana|cap cana|bávaro|bavaro/i.test(loc) ? "La Altagracia (Punta Cana)" : "Santo Domingo" });
      if (fila) { fila.area = "Hotelería y Turismo"; filas.push(fila); }
    } catch (e) { log("marriott", u, String(e).slice(0, 60)); }
  }
  return filas;
}

/* ---------------- Citi (República Dominicana) ---------------- */
async function citi() {
  const filas = [];
  const base = "https://jobs.citi.com";
  const urls = new Set();
  for (let p = 1; p <= 4; p++) {
    try {
      const h = await getText(`${base}/search-jobs/Dominican%20Republic?p=${p}`);
      for (const x of h.matchAll(/href="(\/job\/[^"?#]+)"/g)) urls.add(base + x[1]);
      if (!/\/job\//.test(h)) break;
    } catch (e) { log("citi lista", p, String(e).slice(0, 60)); break; }
  }
  for (const u of [...urls].slice(0, 60)) {
    try {
      const jp = jsonLd(await getText(u));
      if (!jp) continue;
      const fila = filaDesdeJobPosting(jp, { empresa: "Citi", url: u, fuenteTexto: "Publicada en el portal oficial de empleos de Citi; se aplica en línea.", provDef: "Distrito Nacional" });
      if (fila) { if (/bank|banc|financ|análisis|analyst|credit|treasury|risk/i.test(fila.titulo)) fila.area = "Contabilidad y Finanzas"; filas.push(fila); }
    } catch (e) { log("citi", u, String(e).slice(0, 60)); }
  }
  return filas;
}

const fuentes = { aldaba, alorica, marriott, citi, medtronic, baxter, eaton };
const resultado = [];
const resumen = {};
for (const [nombre, fn] of Object.entries(fuentes)) {
  try { const f = await fn(); resumen[nombre] = f.length; resultado.push(...f); log(nombre, f.length); }
  catch (e) { resumen[nombre] = `error: ${String(e).slice(0, 120)}`; log(nombre, "ERROR", String(e).slice(0, 200)); }
}
mkdirSync("carga", { recursive: true });
writeFileSync("carga/auto-latest.json", JSON.stringify(resultado.slice(0, 300)));
writeFileSync("carga/auto-resumen.json", JSON.stringify({ fecha: hoy.toISOString(), total: resultado.length, resumen }, null, 2));
log("TOTAL", resultado.length, JSON.stringify(resumen));

// Recolector diario de vacantes reales de República Dominicana.
// Corre en GitHub Actions (gratis), guarda carga/auto-latest.json y la base lo importa sola (pg_cron + pg_net).
// Fuentes: Aldaba (solo ofertas con empresa visible, fuente visible), Eaton, Medtronic, Baxter.
import { writeFileSync, mkdirSync, readdirSync, readFileSync } from "node:fs";

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
  const maxOff = Math.min(560, 70 * DIAS); const topeViejas = DIAS > 7 ? 40 : 8;
  for (let off = 0; off < maxOff && viejas < topeViejas; off += 7) {
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
        if (!reciente(d)) { viejas++; if (viejas >= topeViejas) break; continue; }
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
        const fila = { titulo: tituloBonito(puesto), empresa: empresa.slice(0, 100), provincia: provinciaDe(ciudad.split("\n")[0]), area: areaDe(area, puesto), modalidad: /remoto|teletrabajo/i.test(desc) ? "Remoto" : "Presencial", tipo: /parcial/i.test(sec(t, "Jornada", "")) ? "Medio tiempo" : "Tiempo completo", experiencia: experienciaDe(ind + " " + req + " " + desc), descripcion: `${descripcion} Publicada por la empresa en el portal Aldaba el ${f}; se aplica en la oferta original.`, requisitos: [...requisitosDe(req), ...requisitosDe(ind.replace(/•/g, "\n")).filter((x) => !/^(solo candidatos|palabra|residente)/i.test(x) && x.length < 120)].slice(0, 7).join(" | ") || "Ver requisitos en la oferta original", fuente: "Aldaba", fuente_url: `${base}detalle_of.php?oferta=${id}`, aplicar: `${base}detalle_of.php?oferta=${id}`, redes: "si", _texto: t };
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
  return { titulo, empresa, provincia: provinciaDe(loc, provDef), area: areaDe(titulo), modalidad: /remote|remoto/i.test(jp.jobLocationType ?? "") ? "Remoto" : /hybrid|híbrid/i.test(d) ? "Híbrido" : "Presencial", tipo: /part[- ]time|medio tiempo/i.test(jp.employmentType ?? "") ? "Medio tiempo" : /intern|pasant/i.test(titulo) ? "Pasantía" : "Tiempo completo", experiencia: experienciaDe(q || d), descripcion: `${uno(d).slice(0, 900)}${f} ${fuenteTexto}`, requisitos: requisitosDe(q).join(" | ") || `Ver requisitos en el sitio de ${empresa}`, fuente: "Sitio de la empresa", fuente_url: url, aplicar: url, redes: "si", _texto: d };
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
function estadoPrecargado(html) {
  const i = html.indexOf("window.__PRELOAD_STATE__");
  if (i < 0) return null;
  const ini = html.indexOf("{", i);
  let prof = 0, enTexto = false, esc = false;
  for (let k = ini; k < html.length; k++) {
    const c = html[k];
    if (enTexto) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') enTexto = false; continue; }
    if (c === '"') enTexto = true; else if (c === "{") prof++; else if (c === "}" && --prof === 0) { try { return JSON.parse(html.slice(ini, k + 1)); } catch { return null; } }
  }
  return null;
}
async function marriott() {
  const filas = [];
  const base = "https://careers.marriott.com";
  const marcas = ["w-hotels", "jw-marriott", "renaissance-hotels", "ac-hotels", "courtyard", "westin", "sheraton", "marriott-hotels", "autograph-collection", "aloft", "the-ritz-carlton", "st-regis", "tribute-portfolio", "luxury-collection", "moxy", "four-points", "element", "residence-inn", "fairfield"];
  const vistos = new Set();
  for (const m of marcas) {
    let jobs = [];
    try {
      const h = await getText(`${base}/brands/${m}/jobs?location_name=Dominican+Republic&location_type=4`);
      jobs = estadoPrecargado(h)?.jobSearch?.jobs ?? [];
    } catch (e) { log("marriott marca", m, String(e).slice(0, 50)); continue; }
    for (const j of jobs) {
      const ref = j.reference ?? j.requisitionID;
      if (!ref || vistos.has(ref)) continue;
      const loc = (j.locations ?? [])[0] ?? {};
      if (!/Dominican|^DO$/i.test(`${loc.country ?? ""} ${loc.countryAbbr ?? ""}`)) continue;
      vistos.add(ref);
      const url = `${base}/x/job/${ref}`;
      let desc = "", req = "";
      try {
        const jp = jsonLd(await getText(url));
        if (jp) { desc = limpiar(jp.description ?? ""); const q = desc.search(/Qualifications|Requirements|Requisitos|Candidate Profile/i); if (q > 0) { req = desc.slice(q, q + 800); } }
      } catch { /* sin detalle: se usa lo básico */ }
      const hotel = (loc.locationName ?? j.brandName ?? "Marriott International").slice(0, 100);
      const titulo = tituloBonito(j.title ?? "");
      if (!titulo) continue;
      const ciudad = `${loc.city ?? ""} ${loc.locationText ?? ""}`;
      filas.push({ titulo, empresa: hotel, provincia: /punta cana|cap cana|bávaro|bavaro|uvero|higüey/i.test(ciudad) ? "La Altagracia (Punta Cana)" : provinciaDe(ciudad, "Santo Domingo"), area: "Hotelería y Turismo", modalidad: "Presencial", tipo: /part/i.test((j.employmentType ?? []).join(" ")) ? "Medio tiempo" : "Tiempo completo", experiencia: experienciaDe(req || desc), descripcion: `${desc ? uno(desc).slice(0, 900) + " " : ""}Vacante de ${hotel}, publicada en el portal oficial de empleos de Marriott International; se aplica en línea.`, requisitos: requisitosDe(req).join(" | ") || "Ver requisitos en el sitio de Marriott", fuente: "Sitio de la empresa", fuente_url: url, aplicar: url, redes: "si" });
    }
  }
  log("marriott únicas", vistos.size);
  return filas;
}

/* ---------------- Citi (República Dominicana) ---------------- */
async function citi() {
  const filas = [];
  const base = "https://jobs.citi.com";
  const urls = new Set();
  for (let p = 1; p <= 4; p++) {
    try {
      const h = await getText(`${base}/search-jobs/Dominican%20Republic/287/2/3508796/18x7357/-70x16265/50/${p}`);
      for (const x of h.matchAll(/href="(\/job\/[^"?#]+)"/g)) urls.add(base + x[1]);
      if (!/\/job\//.test(h)) break;
    } catch (e) { log("citi lista", p, String(e).slice(0, 60)); break; }
  }
  for (const u of [...urls].slice(0, 60)) {
    try {
      const jp = jsonLd(await getText(u));
      if (!jp) continue;
      if (!/Dominican|Santo Domingo|Dominicana/i.test(JSON.stringify(jp.jobLocation ?? "") + " " + (jp.title ?? ""))) continue;
      const fila = filaDesdeJobPosting(jp, { empresa: "Citi", url: u, fuenteTexto: "Publicada en el portal oficial de empleos de Citi; se aplica en línea.", provDef: "Distrito Nacional" });
      if (fila) { if (/bank|banc|financ|análisis|analyst|credit|treasury|risk/i.test(fila.titulo)) fila.area = "Contabilidad y Finanzas"; filas.push(fila); }
    } catch (e) { log("citi", u, String(e).slice(0, 60)); }
  }
  return filas;
}


/* ---------------- Computrabajo (solo ofertas con empresa visible, fuente visible) ---------------- */
async function computrabajo() {
  const filas = [];
  const base = "https://do.computrabajo.com";
  const urls = new Set();
  const paginas = Math.min(12, 2 * DIAS);
  for (let p = 1; p <= paginas; p++) {
    try {
      const h = await getText(`${base}/ofertas-de-trabajo/?p=${p}`);
      for (const x of h.matchAll(/href="(\/ofertas-de-trabajo\/oferta-de-trabajo-de-[^"?#]+)(?:[?#][^"]*)?"/g)) urls.add(base + x[1]);
    } catch (e) { log("computrabajo lista", p, String(e).slice(0, 60)); break; }
  }
  log("computrabajo enlaces", urls.size);
  for (const u of [...urls].slice(0, 140)) {
    try {
      const h = await getText(u);
      const jp = jsonLd(h);
      if (!jp) continue;
      const empresa = limpiar(jp.hiringOrganization?.name ?? "");
      if (!empresa || /confidencial|importante empresa|empresa l[ií]der|reclutador/i.test(empresa)) continue;
      const d = jp.datePosted ? new Date(jp.datePosted) : null;
      if (!reciente(d)) continue;
      const f = filaDesdeJobPosting(jp, { empresa: empresa.slice(0, 100), url: u, fuenteTexto: `Publicada por la empresa en el portal Computrabajo${jp.datePosted ? " el " + String(jp.datePosted).slice(0, 10) : ""}; se aplica en la oferta original.`, provDef: "Santo Domingo" });
      if (!f) continue;
      f.fuente = "Computrabajo";
      if (malo.test(f.descripcion)) f.descripcion = f.descripcion.replace(/[^.]*(edad|sexo|femenin|masculin|\bhombre|\bmujer)[^.]*\.?/gi, "").trim();
      const sal = (jp.baseSalary?.value?.minValue ?? jp.baseSalary?.value?.value);
      if (sal && Number(sal) >= 10000) f.salario_min = String(Math.round(Number(sal)));
      if (jp.baseSalary?.value?.maxValue && Number(jp.baseSalary.value.maxValue) > Number(sal ?? 0)) f.salario_max = String(Math.round(Number(jp.baseSalary.value.maxValue)));
      filas.push(f);
    } catch (e) { log("computrabajo", u.slice(-40), String(e).slice(0, 60)); }
  }
  return filas;
}


/* ---------------- Neuro STEM Talent (regla de Kim, 11 nov 2026: sus vacantes SIEMPRE van en Enlace) ---------------- */
// El listado de neurostemtalent.com/vacantes se dibuja con JavaScript, pero el sitemap trae cada vacante
// y cada página de vacante tiene su JobPosting (JSON-LD). No se filtra por fecha: si está abierta en NST, va.
async function nst() {
  const filas = [];
  const base = "https://www.neurostemtalent.com";
  // Desde GitHub, Cloudflare del sitio de NST responde 403 (protección anti-robots). Si pasa, no es error:
  // la tarea diaria «Vacantes diarias (supervisor)» las trae con WebFetch.
  let sm = "";
  try { sm = await getText(`${base}/sitemap.xml`); } catch (e) { log("nst bloqueado por Cloudflare desde GitHub; las trae la tarea diaria", String(e).slice(0, 40)); return filas; }
  const urls = [...new Set([...sm.matchAll(/https?:\/\/(?:www\.)?neurostemtalent\.com\/vacantes\/[0-9a-f-]{36}/g)].map((m) => m[0].replace("://neurostemtalent", "://www.neurostemtalent")))];
  log("nst enlaces", urls.length);
  for (const u of urls) {
    try {
      const h = await getText(u);
      const jp = jsonLd(h);
      if (!jp) continue;
      if (jp.datePosted && (hoy - new Date(jp.datePosted)) / 864e5 > 180) continue;
      const cliente = limpiar(jp.hiringOrganization?.name ?? "");
      const f = filaDesdeJobPosting(jp, { empresa: "Neuro STEM Talent", url: u, fuenteTexto: `Vacante gestionada por Neuro STEM Talent${cliente && !/neuro\s*stem/i.test(cliente) ? " para " + cliente : ""}. Postular no tiene costo.`, provDef: "Distrito Nacional" });
      if (!f) continue;
      if (/haina/i.test(JSON.stringify(jp.jobLocation ?? ""))) f.provincia = "San Cristóbal";
      f.fuente = "Neuro STEM Talent";
      filas.push(f);
    } catch (e) { log("nst", u.slice(-12), String(e).slice(0, 60)); }
  }
  return filas;
}

/* ---------------- MAP · Concursa (concursos públicos del Estado dominicano) ---------------- */
// Pedido de Kim (13 nov 2026): fuente fija del radar. Solo concursos «abierto» y con fecha límite vigente. Trae salario real.
const entidades = (t) => t.replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)));
async function map() {
  const base = "https://map.gob.do";
  const filas = [];
  const vistos = new Set();
  const paginas = [...Array(6).keys()].map((n) => `${base}/Concursa?discapacidad=False&pagina=${n}`).concat([`${base}/Concursa?discapacidad=true`]);
  for (const u of paginas) {
    let html;
    try { html = await getText(u); } catch (e) { log("map", u, String(e).slice(0, 80)); continue; }
    const arts = html.match(/<article class="concurso[\s\S]*?<\/article>/g) ?? [];
    let abiertos = 0;
    for (const a of arts) {
      if (!/class="concurso row abierto"/.test(a)) continue;
      abiertos++;
      const id = (a.match(/AplicarVacante\?cargo=(\d+)/) ?? [])[1];
      if (!id || vistos.has(id)) continue;
      vistos.add(id);
      const titulo = tituloBonito(limpiar(entidades((a.match(/<h3[^>]*>([\s\S]*?)<\/h3>/) ?? [])[1] ?? "")));
      const inst = limpiar(entidades((a.match(/<\/h3>\s*<\/div>\s*<div class="col-sm-12">\s*([\s\S]*?)\s*<\/div>/) ?? [])[1] ?? "")).trim();
      const muni = limpiar(entidades((a.match(/Municipio:<\/b>\s*([^<]*)/) ?? [])[1] ?? "")).trim();
      const plazas = (a.match(/Plazas:<\/b>\s*(\d+)/) ?? [])[1] ?? "1";
      const tipoC = (a.match(/Tipo:<\/b>\s*([A-Za-zÁ-ú]+)/) ?? [])[1] ?? "";
      const lim = a.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      const carrera = limpiar(entidades((a.match(/Tipo de carrera:<\/b>\s*([^<]*)/) ?? [])[1] ?? "")).trim();
      const sal = (a.match(/RD\$\s*([\d,\.]+)/) ?? [])[1];
      const aviso = (a.match(/href="(\/Concursa\/Concurso\/ObtenerArchivoDePublicacion[^"]+)"/) ?? [])[1]?.replace(/&amp;/g, "&");
      if (!titulo || !inst) continue;
      if (lim && new Date(`${lim[3]}-${lim[2]}-${lim[1]}T23:59:59-04:00`) < hoy) continue;
      const url = `${base}/Concursa/Portal/AplicarVacante?cargo=${id}`;
      const interno = /interno/i.test(tipoC);
      const prov = provinciaDe(`${muni} ${inst}`, "Santo Domingo");
      filas.push({
        titulo, empresa: inst.slice(0, 100), provincia: prov, area: areaDe(titulo, inst), modalidad: "Presencial", tipo: "Tiempo completo", experiencia: "1-3 años",
        descripcion: `Concurso público de ${inst} para el puesto de ${titulo}${carrera ? ` (carrera ${carrera.toLowerCase()})` : ""}, ${plazas} plaza${plazas === "1" ? "" : "s"}${muni ? ` en ${muni.toLowerCase().replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase())}` : ""}.${sal ? ` Salario publicado en el concurso: RD$${sal} mensual.` : ""}${lim ? ` Fecha límite para aplicar: ${lim[1]}/${lim[2]}/${lim[3]}.` : ""}${interno ? " Convocatoria interna: dirigida a servidores públicos de la institución." : " Convocatoria externa: abierta al público."} Se aplica en el portal oficial Concursa del Ministerio de Administración Pública (MAP).`,
        requisitos: [interno ? "Convocatoria interna (servidores públicos de la institución)" : "Convocatoria externa abierta al público", "Registrarse y aplicar en el portal Concursa del MAP", aviso ? `Requisitos completos en el aviso oficial: ${base}${aviso}` : "Requisitos completos en el aviso oficial del concurso"].join(" | "),
        fuente: "MAP Concursa (concurso público)", fuente_url: url, aplicar: url, redes: "si",
      });
    }
    if (!abiertos && !/discapacidad=true/.test(u)) break;
  }
  return filas;
}

// 10 nov 2026 (Kim): ya NO se cargan Aldaba ni Computrabajo; el foco son los flyers que Kim sube desde el celular.
// Para reactivarlos: poner la variable CON_PORTALES=1 en el workflow.
const fuentes = process.env.CON_PORTALES === "1"
  ? { nst, aldaba, computrabajo, map, alorica, marriott, citi, medtronic, baxter, eaton }
  : { nst, map, alorica, marriott, citi, medtronic, baxter, eaton };
const resultado = [];
const resumen = {};
for (const [nombre, fn] of Object.entries(fuentes)) {
  try { const f = await fn(); resumen[nombre] = f.length; resultado.push(...f); log(nombre, f.length); }
  catch (e) { resumen[nombre] = `error: ${String(e).slice(0, 120)}`; log(nombre, "ERROR", String(e).slice(0, 200)); }
}
// Regla de Kim (8 nov 2026): mientras no haya dominio se siguen cargando las de otros portales.
// Cuando compre el dominio (correos con Resend), poner SOLO_CONTACTO = true: entonces solo pasan las que traen
// correo o WhatsApp de la empresa, para que la gente aplique DESDE Enlace Laboral.
const SOLO_CONTACTO = process.env.SOLO_CONTACTO === "1" || false;
const PORTALES = /@(aldaba|computrabajo|marriott|citi|eaton|medtronic|baxter|alorica|smartrecruiters|myworkdayjobs|workday)\./i;
const correoDe = (t) => (String(t ?? "").match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []).find((c) => !PORTALES.test(c) && !/\.(png|jpe?g|gif|webp)$/i.test(c));
const whatsappDe = (t) => { const m = String(t ?? "").match(/(?:whats?app|wa\.me\/|escr[ií]benos al|env[ií]a(?:r)? (?:tu|el) cv al)\D{0,15}(\+?1?[\s-]?\(?8[024]9\)?[\s.-]?\d{3}[\s.-]?\d{4})/i); return m ? m[1].replace(/\D/g, "").replace(/^(8[024]9)/, "1$1") : null; };
// Cero discriminación: fuera pedidos de sexo, edad, foto, estado civil o apariencia (Código de Trabajo, Principio VII).
const EXCLUYE = /(\bedad\b.*\d{2}|\b\d{2}\s*(a|y|-|–)\s*\d{2}\s*años(?!\s*de\s*experiencia)|\bsexo\b|preferiblemente\s+(hombre|mujer|masculino|femenin)|\b(solo|sólo)\s+(hombres|mujeres|damas|caballeros)\b|buena presencia|\bfotos?\b|\bfotograf[íi]a\s+(reciente|actual|tipo)|curr[íi]cul\w*\s+(con|y)\s+foto|cv\s+(con|y)\s+foto|edad\s+(m[áa]xima|m[íi]nima|l[íi]mite|requerida)|estado civil|\bsolter[oa]|\bcasad[oa]\b|estatura|\bpeso\b|menor(es)? de \d{2} años)/i;
for (const f of resultado) {
  f.titulo = String(f.titulo).replace(/\s*[(\-–]?\s*(masculino|femenina|femenino)\s*\)?\s*$/i, "").trim();
  f.requisitos = String(f.requisitos ?? "").split(" | ").filter((x) => x && !EXCLUYE.test(x)).join(" | ") || "Ver requisitos en la oferta original";
  // También en la descripción: se quitan las frases o viñetas que piden edad, sexo, foto, estado civil o apariencia.
  f.descripcion = String(f.descripcion ?? "").split(/(?<=\.)\s+|(?=•)/).filter((x) => !EXCLUYE.test(x)).join(" ").replace(/\s{2,}/g, " ").trim();
}
const conContacto = [];
let sinContacto = 0;
for (const f of resultado) {
  const texto = `${f.descripcion} ${f.requisitos} ${f._texto ?? ""}`;
  const correo = correoDe(texto), wa = correo ? null : whatsappDe(texto);
  delete f._texto;
  if (!correo && !wa) { sinContacto++; if (!SOLO_CONTACTO) conContacto.push(f); continue; }
  // Si la oferta trae correo o WhatsApp de la empresa, se aplica aquí mismo aunque venga de un portal.
  f.aplicar = correo ?? `https://wa.me/${wa}`;
  f.descripcion = f.descripcion.replace(/;? ?se aplica (?:en línea|en la oferta original)\.?/i, ". Aplica desde Enlace Laboral.");
  conContacto.push(f);
}
// Flyers de Kim: la tarea horaria deja filas ya revisadas en carga/flyers/AAAA-MM-DD-*.json (últimos 10 días).
// Se meten al principio del archivo para que la base las importe sola (pg_cron), sin usar acciones de Lovable.
const flyers = [];
try {
  const lim = Date.now() - 10 * 864e5;
  for (const n of readdirSync("carga/flyers").filter((x) => /^\d{4}-\d{2}-\d{2}.*\.json$/.test(x)).sort()) {
    if (new Date(n.slice(0, 10)).getTime() < lim) continue;
    try { const a = JSON.parse(readFileSync(`carga/flyers/${n}`, "utf8")); if (Array.isArray(a)) flyers.push(...a); } catch (e) { log("flyers", n, String(e).slice(0, 60)); }
  }
} catch {}
conContacto.unshift(...flyers);
log("flyers de Kim", flyers.length);
// 11 nov 2026 (Kim): NINGUNA consultora ni empresa de gestión humana / reclutamiento (People Group, Manpower, Verox,
// RD Gestión Talento, etc.). La única excepción es Neuro STEM Talent: sus vacantes SIEMPRE se publican.
// La base tiene la misma regla (privado.es_consultora + trigger tr_zz_bloquear_consultoras), esto es la primera barrera.
const ES_NST = /neuro\s*stem|neurostemtalent/i;
const CONSULTORA = /(people\s*group|manpower|\bverox|adecco|randstad|kelly\s+services|michael\s+page|intra\s*rh|ditalent|hava\s+gesti|target\s+talent|talento\s+firme|capital\s+humano|cenerh|ceerh|acerh|rh\s*solution|search\s*latam|talents\.ghs|talentos\s+srl|talentoshospitality|all\s+people\s+international|mabel\s*rosado|gen-?t\s+aliada|kriterion|vip\s+personnel|v[uü]o\s+partners|rd\s*gesti[oó]n\s*(de(l)?\s+)?talento|consultor\w*\s+(de\s+|y\s+asesor\w*\s+)?(de\s+)?(gesti[oó]n|talento|recursos\s+humanos|rrhh|personal|selecci)|gesti[oó]n\s+(de(l)?\s+)?talento|headhunt|head\s*hunter|staffing|reclutadora|agencia\s+de\s+(empleo|reclutamiento|colocaci)|selecci[oó]n\s+de\s+personal|outsourcing\s+de\s+personal|suministro\s+de\s+personal|empresa\s+cliente|consulting|consultor[ií]a\s+rd)/i;
const CLIENTE = /(empresa\s+cliente|(para|de)\s+(nuestr[oa]s?|importante|reconocid[oa])\s+(empresa\s+)?cliente\b|en\s+representaci[oó]n\s+de\s+(nuestro|un|una)\s+cliente)/i;
const esConsultora = (f) => {
  const id = `${f.empresa ?? ""} ${f.aplicar ?? ""} ${f.fuente_url ?? ""} ${f.fuente ?? ""}`;
  if (ES_NST.test(`${id} ${f.descripcion ?? ""}`)) return false;
  return CONSULTORA.test(id) || CLIENTE.test(String(f.descripcion ?? ""));
};
const antes = conContacto.length;
for (let i = conContacto.length - 1; i >= 0; i--) if (esConsultora(conContacto[i])) conContacto.splice(i, 1);
log("descartadas por ser consultora / gestión humana", antes - conContacto.length);
log("cargadas", conContacto.length, "sin correo ni WhatsApp", sinContacto, SOLO_CONTACTO ? "(no se cargan)" : "(se cargan con enlace al portal)");
mkdirSync("carga", { recursive: true });
writeFileSync("carga/auto-latest.json", JSON.stringify(conContacto.slice(0, 700)));
writeFileSync("carga/auto-resumen.json", JSON.stringify({ fecha: hoy.toISOString(), total: conContacto.length, revisadas: resultado.length, sin_contacto: sinContacto, regla: SOLO_CONTACTO ? "solo vacantes con correo o WhatsApp de la empresa" : "todas; las que traen correo o WhatsApp se aplican desde Enlace Laboral", resumen }, null, 2));
log("TOTAL", resultado.length, JSON.stringify(resumen));

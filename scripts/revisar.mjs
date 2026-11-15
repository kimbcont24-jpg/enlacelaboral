// Revisión diaria de Enlace Laboral (15 nov 2026, pedido de Kim: que muy pocas cosas dependan de ella).
// Corre en GitHub Actions (workflow revisar.yml). Hace dos cosas:
//  1) CIERRE DE VACANTES MUERTAS: revisa cada vacante publicada que vino de una fuente externa (m:fuente_url) y
//     propone cerrarla si el enlace de origen ya no existe (404/410 o la API del portal dice que no está) o si la
//     fecha límite que dice su descripción ya pasó. Deja carga/cerrar.json; la base lo aplica sola cada 2 horas
//     (privado.cerrar_auto_cargar, máx. 150 por archivo, nunca toca vacantes publicadas por una empresa en su panel).
//  2) SALUD: revisa que el sitio, el robot y la base respondan y deja carga/salud.json. La tarea «Vigilancia
//     Enlace Laboral» lo lee cada mañana y le escribe a Kim SOLO si algo falla.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const env = Object.fromEntries(readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const SB = env.SUPABASE_URL, KEY = env.SUPABASE_PUBLISHABLE_KEY;
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "accept-language": "es-DO,es;q=0.9" };
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const hoyRD = new Date(Date.now() - 4 * 3600e3); hoyRD.setUTCHours(0, 0, 0, 0); // medianoche de hoy en RD (UTC-4)
const MAX_CIERRES = 150;

async function pedir(url, init = {}) {
  return fetch(url, { redirect: "follow", ...init, headers: { ...UA, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(25000) });
}

/* ---------- 1. Vacantes publicadas ---------- */
async function publicadas() {
  const filas = [];
  for (let off = 0; off < 10000; off += 1000) {
    const r = await fetch(`${SB}/rest/v1/vacantes?select=id,titulo,descripcion,etiquetas,created_at&estado=eq.publicada&order=created_at.asc&limit=1000&offset=${off}`, { headers: { apikey: KEY, authorization: `Bearer ${KEY}` } });
    if (!r.ok) throw new Error(`base ${r.status}`);
    const j = await r.json(); filas.push(...j); if (j.length < 1000) break;
  }
  return filas;
}
const meta = (v, k) => (v.etiquetas ?? []).find((e) => e.startsWith(`m:${k}:`))?.slice(k.length + 3) ?? "";

/* ---------- Fecha límite escrita en la descripción ---------- */
const MESES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
function fechaLimite(texto) {
  const s = String(texto ?? "").toLowerCase();
  const i = s.search(/fecha l[ií]mite|plazo (?:para aplicar|de aplicaci[oó]n|de recepci[oó]n)|hasta el d[ií]a|recibir[aá]n? (?:cv|curr[ií]culum|expedientes) hasta/);
  if (i < 0) return null;
  const t = s.slice(i, i + 90);
  let m = t.match(/(\d{1,2})\/(\d{1,2})\/(20\d{2})/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  m = t.match(/(\d{1,2})\s+de\s+([a-záéíóú]+)(?:\s+(?:de|del)\s+(20\d{2}))?/);
  if (m && MESES[m[2]]) {
    const anio = m[3] ? +m[3] : new Date().getUTCFullYear();
    return new Date(Date.UTC(anio, MESES[m[2]] - 1, +m[1]));
  }
  return null;
}

/* ---------- ¿El enlace de origen sigue vivo? ---------- */
// Devuelve "muerta", "viva" o "no_se" (ante cualquier duda: no se cierra).
const NO_REVISAR = /(^|\.)(linkedin\.com|lnkd\.in|instagram\.com|facebook\.com|fb\.com|wa\.me|whatsapp\.com|t\.me|enlace-rd\.vercel\.app|enlacelaboralrd\.com|neurostemtalent\.com|drive\.google\.com|docs\.google\.com|forms\.gle)$/i;
async function estadoEnlace(u) {
  let url; try { url = new URL(u.replace(/#.*$/, "")); } catch { return "no_se"; }
  if (NO_REVISAR.test(url.hostname)) return "no_se";
  if (url.pathname === "/" || url.pathname === "") return "no_se"; // página de inicio: no dice nada de una vacante en particular
  try {
    // Portales con API: se pregunta por la vacante exacta.
    if (/myworkdayjobs\.com$/.test(url.hostname)) {
      const [, sitio, ...resto] = url.pathname.split("/"); const tenant = url.hostname.split(".")[0];
      const r = await pedir(`${url.origin}/wday/cxs/${tenant}/${sitio}/${resto.join("/")}`, { headers: { accept: "application/json" } });
      return r.status === 404 || r.status === 410 ? "muerta" : r.ok ? "viva" : "no_se";
    }
    if (/eightfold\.ai$/.test(url.hostname) && url.searchParams.get("pid")) {
      const r = await pedir(`${url.origin}/api/pcsx/position_details?position_id=${url.searchParams.get("pid")}&domain=${url.searchParams.get("domain") ?? ""}`, { headers: { accept: "application/json" } });
      if (r.status === 404) return "muerta";
      if (!r.ok) return "no_se";
      const j = await r.json().catch(() => null);
      return j && (j.data?.name || j.data?.id) ? "viva" : j && j.status === 404 ? "muerta" : "no_se";
    }
    if (/smartrecruiters\.com$/.test(url.hostname)) {
      const [, empresa, slug] = url.pathname.split("/"); const id = (slug ?? "").split("-")[0];
      if (!empresa || !/^\d+$/.test(id)) return "no_se";
      const r = await pedir(`https://api.smartrecruiters.com/v1/companies/${empresa}/postings/${id}`, { headers: { accept: "application/json" } });
      return r.status === 404 ? "muerta" : r.ok ? "viva" : "no_se";
    }
    // Resto: la página misma.
    const r = await pedir(url.href);
    if (r.status === 404 || r.status === 410) return "muerta";
    if (!r.ok) return "no_se";
    const fin = new URL(r.url);
    // Si la vacante redirige a la portada o a un buscador del mismo sitio, ya no existe.
    if (fin.hostname === url.hostname && url.pathname.length > 12 && (fin.pathname === "/" || /^\/(en|es|es-do|es_do)\/?$/i.test(fin.pathname) || /\/(search|buscar|search-jobs|jobs)\/?$/i.test(fin.pathname))) return "muerta";
    const t = (await r.text()).slice(0, 300000);
    if (/careers\.marriott\.com$/.test(url.hostname)) return /"@type"\s*:\s*"JobPosting"/.test(t) ? "viva" : "muerta";
    if (/(esta|la) (vacante|oferta|posici[oó]n) ya no (est[aá] disponible|existe)|this (job|position|posting) (is )?no longer (available|exists)|job (has been|is) (closed|filled|expired)|oferta (cerrada|expirada|finalizada)|vacante (cerrada|expirada)/i.test(t)) return "muerta";
    return "viva";
  } catch { return "no_se"; }
}

/* ---------- 2. Salud ---------- */
async function salud(nPublicadas, nuevas24, nuevas72) {
  const problemas = [], ok = [];
  for (const p of ["https://enlacelaboralrd.com/", "https://enlacelaboralrd.com/vacantes", "https://enlacelaboralrd.com/sitemap.xml", "https://enlacelaboralrd.com/empleos/sector-publico"]) {
    try { const r = await pedir(p); (r.ok ? ok : problemas).push(`${p} → ${r.status}`); }
    catch (e) { problemas.push(`${p} → no responde (${String(e).slice(0, 60)})`); }
  }
  if (nPublicadas < 100) problemas.push(`Solo hay ${nPublicadas} vacantes publicadas (normalmente son más de 1,000)`); else ok.push(`${nPublicadas} vacantes publicadas`);
  if (nuevas72 === 0) problemas.push("No entró ninguna vacante nueva en 72 horas: revisar el robot y la importación");
  else if (nuevas24 === 0) ok.push(`0 nuevas en 24 h (${nuevas72} en 72 h): vigilar`);
  else ok.push(`${nuevas24} vacantes nuevas en 24 h`);
  if (existsSync("carga/auto-resumen.json")) {
    try {
      const a = JSON.parse(readFileSync("carga/auto-resumen.json", "utf8"));
      const horas = (Date.now() - new Date(a.fecha).getTime()) / 3600e3;
      if (horas > 30) problemas.push(`El robot de vacantes no corre desde hace ${Math.round(horas)} horas`); else ok.push(`Robot corrió hace ${Math.round(horas)} h`);
      for (const [f, v] of Object.entries(a.resumen ?? {})) if (String(v).startsWith("error")) problemas.push(`Fuente «${f}» del robot falló: ${String(v).slice(0, 120)}`);
    } catch { problemas.push("No se pudo leer carga/auto-resumen.json"); }
  }
  return { problemas, ok };
}

/* ---------- Principal ---------- */
const lista = await publicadas();
log("publicadas", lista.length);
const ahora = Date.now();
const nuevas24 = lista.filter((v) => ahora - new Date(v.created_at).getTime() < 24 * 3600e3).length;
const nuevas72 = lista.filter((v) => ahora - new Date(v.created_at).getTime() < 72 * 3600e3).length;

const cierres = [];
const conteo = { revisadas: 0, por_fecha: 0, enlace_muerto: 0, vivas: 0, sin_revisar: 0 };
const porUrl = new Map(); // varias vacantes pueden compartir el mismo enlace (un flyer con varios puestos)
for (const v of lista) {
  const u = meta(v, "fuente_url");
  if (!u) continue; // las publicadas por empresas en su panel no tienen fuente externa: no se tocan
  conteo.revisadas++;
  const lim = fechaLimite(v.descripcion);
  if (lim && lim < hoyRD) { cierres.push({ id: v.id, motivo: "fecha_limite", titulo: v.titulo, url: u }); conteo.por_fecha++; continue; }
  const base = u.replace(/#.*$/, "");
  if (!porUrl.has(base)) porUrl.set(base, []);
  porUrl.get(base).push(v);
}
log("enlaces distintos a revisar", porUrl.size);
let i = 0;
for (const [u, vs] of porUrl) {
  i++;
  let e = await estadoEnlace(u);
  if (e === "muerta") { await esperar(1500); e = await estadoEnlace(u); } // segunda confirmación antes de cerrar
  if (e === "muerta") { for (const v of vs) cierres.push({ id: v.id, motivo: "enlace_no_existe", titulo: v.titulo, url: u }); conteo.enlace_muerto += vs.length; }
  else if (e === "viva") conteo.vivas += vs.length; else conteo.sin_revisar += vs.length;
  if (i % 50 === 0) log("revisados", i, "/", porUrl.size, "cierres", cierres.length);
  await esperar(250);
}
// Primero las de fecha límite (seguras), luego las de enlace; tope de seguridad.
const lote = cierres.slice(0, MAX_CIERRES);
const SECO = process.env.SECO === "1"; // prueba: no se escribe el archivo que la base aplica
if (!SECO) writeFileSync("carga/cerrar.json", JSON.stringify(lote.map(({ id, motivo }) => ({ id, motivo }))));
const s = await salud(lista.length, nuevas24, nuevas72);
if (cierres.length > MAX_CIERRES) s.ok.push(`${cierres.length} vacantes para cerrar; hoy se cierran ${MAX_CIERRES} y el resto mañana`);
writeFileSync("carga/salud.json", JSON.stringify({ fecha: new Date().toISOString(), publicadas: lista.length, nuevas_24h: nuevas24, nuevas_72h: nuevas72, cierre: { ...conteo, propuestas: cierres.length, en_este_lote: lote.length, ejemplos: lote.slice(0, 15).map((c) => `${c.motivo}: ${c.titulo} · ${c.url}`) }, problemas: s.problemas, ok: s.ok }, null, 2));
log("CIERRE", JSON.stringify(conteo), "propuestas", cierres.length);
log("PROBLEMAS", JSON.stringify(s.problemas));
log("OK", JSON.stringify(s.ok));

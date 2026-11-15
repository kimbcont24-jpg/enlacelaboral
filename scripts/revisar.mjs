// Salud diaria de Enlace Laboral (15 nov 2026, pedido de Kim: que muy pocas cosas dependan de ella).
// Corre en GitHub Actions (workflow revisar.yml, gratis). Revisa que el sitio, el robot y la base respondan y deja
// carga/salud.json. También deja carga/redes.json (vacantes para Facebook/Instagram). La tarea «Vigilancia Enlace Laboral» lo lee cada mañana y le escribe a Kim SOLO si algo falla.
// (Kim descartó el cierre automático de vacantes muertas el 15 nov: no se revisan los enlaces de origen.)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const SB = env.SUPABASE_URL, KEY = env.SUPABASE_PUBLISHABLE_KEY;
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "accept-language": "es-DO,es;q=0.9" };
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function pedir(url, init = {}) {
  return fetch(url, { redirect: "follow", ...init, headers: { ...UA, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(25000) });
}

/* ---------- 1. Vacantes publicadas ---------- */
async function publicadas() {
  const filas = [];
  for (let off = 0; off < 10000; off += 1000) {
    const r = await fetch(`${SB}/rest/v1/vacantes?select=id,created_at&estado=eq.publicada&order=created_at.asc&limit=1000&offset=${off}`, { headers: { apikey: KEY, authorization: `Bearer ${KEY}` } });
    if (!r.ok) throw new Error(`base ${r.status}`);
    const j = await r.json(); filas.push(...j); if (j.length < 1000) break;
  }
  return filas;
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


/* ---------- Vacantes para redes (Facebook/Instagram) ----------
 * Deja carga/redes.json con las vacantes de las últimas 72 h que se pueden compartir (m:redes:si), las de salario
 * publicado primero. La tarea «Redes Enlace Laboral» las publica y anota en carga/redes-publicadas.json. */
async function paraRedes() {
  const desde = new Date(Date.now() - 72 * 3600e3).toISOString();
  const r = await fetch(`${SB}/rest/v1/vacantes?select=id,titulo,provincia,modalidad,tipo,salario_min,salario_max,etiquetas,created_at&estado=eq.publicada&created_at=gte.${desde}&etiquetas=cs.%7Bm:redes:si%7D&order=created_at.desc&limit=300`, { headers: { apikey: KEY, authorization: `Bearer ${KEY}` } });
  if (!r.ok) return [];
  const m = (v, k) => (v.etiquetas ?? []).find((e) => e.startsWith(`m:${k}:`))?.slice(k.length + 3) ?? "";
  const lista = (await r.json()).map((v) => ({ id: v.id, titulo: v.titulo, empresa: m(v, "empresa"), provincia: v.provincia, modalidad: v.modalidad, tipo: v.tipo, salario_min: v.salario_min, salario_max: v.salario_max, creada: v.created_at, enlace: `https://enlacelaboralrd.com/vacantes/${v.id}`, imagen: `https://enlacelaboralrd.com/og/vacantes/${v.id}.png` }));
  return [...lista.filter((v) => v.salario_min > 0), ...lista.filter((v) => !(v.salario_min > 0))].slice(0, 120);
}

/* ---------- Principal ---------- */
const lista = await publicadas();
const ahora = Date.now();
const nuevas24 = lista.filter((v) => ahora - new Date(v.created_at).getTime() < 24 * 3600e3).length;
const nuevas72 = lista.filter((v) => ahora - new Date(v.created_at).getTime() < 72 * 3600e3).length;
const s = await salud(lista.length, nuevas24, nuevas72);
writeFileSync("carga/salud.json", JSON.stringify({ fecha: new Date().toISOString(), publicadas: lista.length, nuevas_24h: nuevas24, nuevas_72h: nuevas72, problemas: s.problemas, ok: s.ok }, null, 2));
try { const rd = await paraRedes(); writeFileSync("carga/redes.json", JSON.stringify({ fecha: new Date().toISOString(), vacantes: rd }, null, 1)); log("redes", rd.length); } catch (e) { log("redes ERROR", String(e).slice(0, 100)); }
log("PROBLEMAS", JSON.stringify(s.problemas));
log("OK", JSON.stringify(s.ok));

// Sondeo 15 nov 2026: vacantes publicadas por fuente y estado de sus enlaces de origen.
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]; }));
const URL_ = env.SUPABASE_URL, KEY = env.SUPABASE_PUBLISHABLE_KEY;
const filas = [];
for (let off = 0; off < 6000; off += 1000) {
  const r = await fetch(`${URL_}/rest/v1/vacantes?select=id,estado,created_at,etiquetas,titulo&estado=eq.publicada&order=created_at.desc&limit=1000&offset=${off}`, { headers: { apikey: KEY, authorization: `Bearer ${KEY}` } });
  const j = await r.json(); if (!Array.isArray(j)) { console.log("ERR", r.status, JSON.stringify(j).slice(0, 300)); break; }
  filas.push(...j); if (j.length < 1000) break;
}
console.log("PUBLICADAS", filas.length);
const meta = (v, k) => (v.etiquetas ?? []).find((e) => e.startsWith(`m:${k}:`))?.slice(k.length + 3) ?? "";
const porFuente = {}, porDominio = {};
for (const v of filas) {
  const f = meta(v, "fuente") || "(sin fuente)"; porFuente[f] = (porFuente[f] ?? 0) + 1;
  const u = meta(v, "fuente_url"); let d = "(sin url)"; try { d = new URL(u).hostname; } catch {}
  (porDominio[d] ??= []).push(u);
}
console.log("FUENTES", JSON.stringify(Object.entries(porFuente).sort((a, b) => b[1] - a[1]).slice(0, 40)));
console.log("DOMINIOS", JSON.stringify(Object.entries(porDominio).map(([d, l]) => [d, l.length]).sort((a, b) => b[1] - a[1]).slice(0, 40)));
console.log("ETIQ_EJEMPLO", JSON.stringify(filas[0]?.etiquetas));
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36" };
for (const [d, l] of Object.entries(porDominio)) {
  if (d.startsWith("(")) continue;
  for (const u of l.slice(0, 4)) {
    try { const r = await fetch(u.replace(/#.*$/, ""), { headers: UA, redirect: "follow", signal: AbortSignal.timeout(20000) }); const t = await r.text(); console.log("URL", d, r.status, r.url === u.replace(/#.*$/, "") ? "=" : "->" + r.url.slice(0, 90), t.length, /no longer|ya no est|expired|not found|no disponible|closed|no existe|has been filled/i.test(t.slice(0, 200000)) ? "TEXTO_CERRADA" : "", u.slice(0, 100)); }
    catch (e) { console.log("URL", d, "ERR", String(e).slice(0, 60), u.slice(0, 100)); }
  }
}

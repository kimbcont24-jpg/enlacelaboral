// Sondeo MAP Concursa: estructura de las tarjetas (14 nov 2026)
const H = { "user-agent": "Mozilla/5.0" };
const r = await fetch("https://map.gob.do/Concursa/", { headers: H, signal: AbortSignal.timeout(25000) });
const t = await r.text();
const i = t.indexOf("Concursos disponibles");
const k = t.indexOf("AplicarVacante");
console.log("MAPHTML1", JSON.stringify(t.slice(k - 3500, k + 600)));
const k2 = t.indexOf("ObtenerArchivoDePublicacion", k + 700);
console.log("MAPHTML2", JSON.stringify(t.slice(k2 - 2500, k2 + 400)));
const p = await fetch("https://map.gob.do/Concursa?discapacidad=False&pagina=1", { headers: H, signal: AbortSignal.timeout(25000) });
const pt = await p.text();
console.log("MAPP1", p.status, pt.length, (pt.match(/AplicarVacante/g) ?? []).length, (pt.match(/ObtenerArchivoDePublicacion/g) ?? []).length);
const v = await fetch("https://map.gob.do/Concursa/Portal/AplicarVacante?cargo=1020", { headers: H, signal: AbortSignal.timeout(25000) });
const vt = await v.text();
console.log("MAPV", v.status, v.url, vt.length, JSON.stringify(vt.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 3000)));

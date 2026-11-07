// Sondeo: estructura real de Marriott y Computrabajo.
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "accept-language": "es-DO,es;q=0.9" };
const get = async (u) => { const r = await fetch(u, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(25000) }); return { s: r.status, u: r.url, t: await r.text() }; };
const ld = (h) => [...h.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1].trim().slice(0, 700));

// ---- Marriott
try {
  const m = await get("https://careers.marriott.com/brands/jw-marriott/jobs?location_name=Dominican+Republic&location_type=4");
  console.log("### M status", m.s, m.t.length);
  const i = m.t.indexOf("window.__PRELOAD_STATE__");
  console.log("### M preload idx", i, JSON.stringify(m.t.slice(i, i + 200)));
  const j = m.t.indexOf('"jobs":[');
  console.log("### M jobs idx", j, JSON.stringify(m.t.slice(j, j + 1500)));
} catch (e) { console.log("### M ERR", String(e)); }

// ---- Computrabajo
try {
  const l = await get("https://do.computrabajo.com/ofertas-de-trabajo/?p=1");
  console.log("### C list", l.s, l.u, l.t.length);
  const hrefs = [...new Set([...l.t.matchAll(/href="([^"]*oferta-de-trabajo[^"]*)"/g)].map((x) => x[1]))];
  console.log("### C hrefs", hrefs.length, JSON.stringify(hrefs.slice(0, 5)));
  const art = [...l.t.matchAll(/<article[^>]*>/g)].length;
  console.log("### C article tags", art, JSON.stringify(l.t.match(/<article[\s\S]{0,600}/)?.[0] ?? ""));
  const un = hrefs.find((h) => /-en-/.test(h)) ?? hrefs[0];
  if (un) {
    const u = un.startsWith("http") ? un : "https://do.computrabajo.com" + un.split("#")[0];
    const d = await get(u);
    console.log("### C detail", d.s, d.u, d.t.length);
    console.log("### C ld", JSON.stringify(ld(d.t)));
    const t = d.t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    console.log("### C text", JSON.stringify(t.slice(0, 1800)));
    console.log("### C h1/h2", JSON.stringify([...d.t.matchAll(/<(h1|h2|p)[^>]*class="[^"]*(?:fs16|fc_base|title|company|mt5)[^"]*"[^>]*>([\s\S]*?)<\/\1>/g)].slice(0, 8).map((x) => x[2].replace(/<[^>]+>/g, "").trim().slice(0, 100))));
  }
} catch (e) { console.log("### C ERR", String(e)); }

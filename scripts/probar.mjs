// Sondeo rápido de fuentes: imprime estado, tamaño y un vistazo de cada URL.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const wd = (t, site, host = "wd1") => ({ n: `workday ${t}`, u: `https://${t}.${host}.myworkdayjobs.com/wday/cxs/${t}/${site}/jobs`, init: { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: "Dominican Republic" }) }, pick: (j) => `${j.total} :: ${(j.jobPostings ?? []).slice(0, 5).map((p) => p.title + " @ " + p.locationsText).join(" ; ")}` });
const sr = (c) => ({ n: `smartrecruiters ${c}`, u: `https://api.smartrecruiters.com/v1/companies/${c}/postings?country=do&limit=100`, pick: (j) => `${j.totalFound} :: ${(j.content ?? []).slice(0, 5).map((p) => p.name + " @ " + p.location?.city).join(" ; ")}` });
const gh = (c) => ({ n: `greenhouse ${c}`, u: `https://boards-api.greenhouse.io/v1/boards/${c}/jobs`, pick: (j) => { const d = (j.jobs ?? []).filter((x) => /dominican|santo domingo/i.test(x.location?.name ?? "")); return `${d.length} :: ${d.slice(0, 5).map((p) => p.title + " @ " + p.location?.name).join(" ; ")}`; } });
const html = (n, u) => ({ n, u, pick: (t) => `${t.length} chars :: ${t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 300)}` });

const fuentes = [
  wd("scotiabank", "careers", "wd3"), wd("cardinalhealth", "EXTERNAL", "wd1"), wd("convatec", "External", "wd3"), wd("foundever", "External", "wd3"),
  wd("pmi", "PMI_Careers", "wd3"), wd("bbraun", "External", "wd3"), wd("fresenius", "External", "wd3"), wd("integer", "Careers", "wd1"), wd("hanes", "External", "wd1"),
  wd("concentrix", "External", "wd1"), wd("ttec", "ttec", "wd1"), wd("aes", "AES_Careers", "wd1"), wd("nestle", "NestleCareers", "wd3"), wd("pepsico", "PepsiCoCareers", "wd1"),
  wd("hilton", "Hilton", "wd5"), wd("hyatt", "Careers", "wd5"), wd("ihg", "IHG", "wd3"), wd("accor", "Accor", "wd3"), wd("mondelez", "External", "wd3"),
  wd("ab-inbev", "ABInBev", "wd1"), wd("colgate", "External", "wd1"), wd("kimberly-clark", "External", "wd1"), wd("coca-cola", "External", "wd1"), wd("ingram", "Careers", "wd1"),
  sr("Bosch"), sr("Visa"), sr("Sagicor"), sr("Teleperformance"), sr("Alorica"), sr("Ubiquity"),
  gh("concentrix"), gh("remitly"), gh("nearsol"),
  html("teleperformance", "https://jobs.teleperformance.com/en-US/search?location=Dominican%20Republic"),
  html("alorica", "https://jobs.alorica.com/search/?q=&locationsearch=Dominican+Republic"),
  html("marriott w", "https://careers.marriott.com/brands/w-hotels/jobs?location_name=Dominican+Republic&location_type=4"),
  html("hilton", "https://jobs.hilton.com/us/en/search-results?keywords=&location=Dominican%20Republic"),
  html("hyatt", "https://careers.hyatt.com/en-US/careers/SearchJobs/?3_118_3=5557"),
  html("empleateya", "https://empleateya.mt.gob.do/"),
  html("claro", "https://www.claro.com.do/personas/empleos/"),
  html("altice", "https://www.altice.com.do/trabaja-con-nosotros"),
  html("grupo ramos", "https://www.gruporamos.com/trabaja-con-nosotros"),
  html("banreservas", "https://www.banreservas.com/trabaja-con-nosotros"),
  html("computrabajo", "https://do.computrabajo.com/empleos-publicados-hoy"),
  html("empleos.net", "https://www.empleos.net/empleos-en-republica-dominicana"),
  html("buscojobs", "https://www.buscojobs.com.do/"),
  html("jooble", "https://do.jooble.org/"),
  html("iCIMS Qualfon", "https://careers-qualfon.icims.com/jobs/search?ss=1&searchLocation=&searchRelation=keyword_all"),
  html("conduent", "https://jobs.conduent.com/search/?q=&locationsearch=Dominican+Republic"),
  html("concentrix", "https://jobs.concentrix.com/search/?createNewAlert=false&q=&locationsearch=Dominican+Republic"),
  html("citi", "https://jobs.citi.com/search-jobs/Dominican%20Republic"),
  html("jabil", "https://jobs.jabil.com/search/?q=&locationsearch=Dominican+Republic"),
  html("edwards", "https://www.edwards.com/careers/search?location=Dominican%20Republic"),
  html("pricesmart", "https://careers.pricesmart.com/"),
  html("popular", "https://www.popularenlinea.com/personas/Paginas/trabaja-con-nosotros.aspx"),
];
for (const f of fuentes) {
  try {
    const r = await fetch(f.u, { ...(f.init ?? {}), headers: { "user-agent": UA, "accept-language": "es-DO,es;q=0.9,en;q=0.8", ...(f.init?.headers ?? {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const t = await r.text();
    let out = "";
    try { out = f.pick(f.init || /json/.test(r.headers.get("content-type") ?? "") ? JSON.parse(t) : t); } catch { out = `(no json) ${t.replace(/\s+/g, " ").slice(0, 160)}`; }
    console.log(`### ${f.n} | ${r.status} | ${r.url} | ${out}`);
  } catch (e) { console.log(`### ${f.n} | ERR ${String(e).slice(0, 100)}`); }
}

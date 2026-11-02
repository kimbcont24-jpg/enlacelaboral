// Sondeo rápido de fuentes.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
async function get(u, init = {}) { const r = await fetch(u, { ...init, headers: { "user-agent": UA, "accept-language": "es-DO,es;q=0.9,en;q=0.8", ...(init.headers ?? {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) }); return { s: r.status, u: r.url, t: await r.text() }; }
const uniq = (a) => [...new Set(a)];
try {
  const m = await get("https://careers.marriott.com/brands/jw-marriott/jobs?location_name=Dominican+Republic&location_type=4");
  console.log("### marriott", m.s, m.t.length);
  console.log("### marriott x/job", uniq([...m.t.matchAll(/\/x\/job\/[^"'<> \\]+/g)].map((x) => x[0])).slice(0, 10));
  console.log("### marriott P1", uniq([...m.t.matchAll(/P1-\d{5,}-\d/g)].map((x) => x[0])).slice(0, 10));
  console.log("### marriott hrefs job", uniq([...m.t.matchAll(/href="([^"]*job[^"]*)"/gi)].map((x) => x[1])).slice(0, 15));
  console.log("### marriott api", uniq([...m.t.matchAll(/https?:\/\/[^"' ]*(?:api|search|widget)[^"' ]*/gi)].map((x) => x[0])).slice(0, 15));
  const i = m.t.search(/Dominican/i); console.log("### marriott ctx", m.t.slice(Math.max(0, i - 600), i + 400).replace(/\s+/g, " "));
} catch (e) { console.log("### marriott ERR", String(e)); }
for (const u of [
  "https://jobs.citi.com/search-jobs/Dominican%20Republic/287/2/3508796/18x7357/-70x16265/50/2",
  "https://jobs.citi.com/search-jobs/results?ActiveFacetID=3508796&CurrentPage=1&RecordsPerPage=50&Distance=50&RadiusUnitType=0&Keywords=&Location=Dominican+Republic&ShowRadius=False&IsPagination=False&CustomFacetName=&FacetTerm=&FacetType=0&FacetFilters%5B0%5D.ID=3508796&FacetFilters%5B0%5D.FacetType=2&FacetFilters%5B0%5D.Count=1&FacetFilters%5B0%5D.Display=Dominican+Republic&FacetFilters%5B0%5D.IsApplied=true&FacetFilters%5B0%5D.FieldName=&SearchResultsModuleName=Search+Results&SearchFiltersModuleName=Search+Filters&SortCriteria=0&SortDirection=0&SearchType=5&PostalCode=&ResultsType=0&fc=&fl=&fcf=&afc=&afl=&afcf=",
  "https://jobs.baxter.com/en/search-jobs/Dominican%20Republic/152/2/3508796/18x7357/-70x16265/50/2",
  "https://careers.cardinalhealth.com/us/en/search-results?keywords=&location=Dominican%20Republic",
  "https://jobs.jnj.com/en/jobs/?search=&country=Dominican+Republic",
  "https://www.hanes.com/careers", "https://careers.aesdominicana.com/", "https://api.smartrecruiters.com/v1/companies/Alorica/postings?country=do&limit=1",
  "https://api.smartrecruiters.com/v1/companies/Startek/postings?country=do", "https://api.smartrecruiters.com/v1/companies/Sutherland/postings?country=do", "https://api.smartrecruiters.com/v1/companies/Conduent/postings?country=do", "https://api.smartrecruiters.com/v1/companies/Nestle/postings?country=do", "https://api.smartrecruiters.com/v1/companies/PhilipMorrisInternational/postings?country=do", "https://api.smartrecruiters.com/v1/companies/Ikea/postings?country=do", "https://api.smartrecruiters.com/v1/companies/Boschgroup/postings?country=do",
  "https://www.empleateya.mt.gob.do/api/ofertas", "https://empleateya.mt.gob.do/api/v1/vacantes", "https://rdtrabaja.mt.gob.do/",
  "https://www.linkedin.com/jobs/search?location=Dominican%20Republic&f_C=&f_TPR=r86400",
  "https://do.computrabajo.com/trabajo-de-administracion", "https://do.computrabajo.com/ofertas-de-trabajo/?p=1",
  "https://www.konzerta.com/", "https://www.bumeran.com.do/", "https://www.tecoloco.com.do/", "https://www.opcionempleo.com.do/", "https://do.indeed.com/jobs?q=&l=Santo+Domingo",
  "https://teleperformance.wd3.myworkdayjobs.com/wday/cxs/teleperformance/TPHIRING/jobs",
  "https://scotiabank.wd3.myworkdayjobs.com/wday/cxs/scotiabank/scotiabank_careers/jobs",
  "https://convatec.wd3.myworkdayjobs.com/wday/cxs/convatec/Convatec_Careers/jobs",
  "https://pmi.wd3.myworkdayjobs.com/wday/cxs/pmi/PMI/jobs",
  "https://nestle.wd3.myworkdayjobs.com/wday/cxs/nestle/nestlecareers/jobs",
  "https://hilton.wd5.myworkdayjobs.com/wday/cxs/hilton/HiltonCareers/jobs",
  "https://hyatt.wd5.myworkdayjobs.com/wday/cxs/hyatt/HyattCareers/jobs",
]) {
  try {
    const isWd = /wday\/cxs/.test(u);
    const r = await get(u, isWd ? { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: "Dominican Republic" }) } : {});
    let out = r.t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 260);
    try { const j = JSON.parse(r.t); out = JSON.stringify(j).slice(0, 400); } catch { /* html */ }
    const jobs = uniq([...r.t.matchAll(/href="([^"]*\/(?:job|jobs|empleo|oferta|vacante)[^"]*)"/gi)].map((x) => x[1])).slice(0, 6);
    console.log(`### ${u.slice(0, 80)} | ${r.s} | ${r.t.length} | ${out} | links: ${JSON.stringify(jobs)}`);
  } catch (e) { console.log(`### ${u.slice(0, 80)} | ERR ${String(e).slice(0, 80)}`); }
}

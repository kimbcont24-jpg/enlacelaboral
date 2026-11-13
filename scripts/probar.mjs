// Sondeo de nuevas fuentes autónomas (13 nov 2026): SmartRecruiters por empresa con vacantes en RD.
const H = { accept: "application/json", "user-agent": "Mozilla/5.0" };
const empresas = "Concentrix Teleperformance Conduent TELUS Sitel Transcom Hanesbrands CardinalHealth Sutherland Hilton Hyatt IHG Accor Cargill TeleTech Visa Cognizant Genpact Wipro Randstad Nearsol AbbVie Amgen Stryker Hologic BoschGroup Siemens Pfizer Abbott Medtronic BDBecton Kimberly-Clark Nestle Unilever Coca-Cola PepsiCo Mondelez Colgate Philips GE Honeywell Schneider-Electric Johnson&Johnson Baxter Fresenius Covidien Boston-Scientific ZimmerBiomet Edwards Terumo Teleperformance-DO ADP Scotiabank Citi JPMorgan Mastercard Accenture IBM Oracle SAP Deloitte KPMG PwC EY Uber Amazon Microsoft Cemex Holcim Cargill Bunge Sodexo Aramark Compass-Group Securitas Allied-Universal Brinks DHL FedEx UPS Maersk MSC Kuehne-Nagel Sykes StarTek Foundever Telus-International Majorel Atento Alorica Alsea Domino McDonalds Burger-King Subway KFC Pizza-Hut".split(/\s+/);
for (const c of [...new Set(empresas)]) {
  try {
    const r = await fetch(`https://api.smartrecruiters.com/v1/companies/${c}/postings?country=do&limit=100`, { headers: H, signal: AbortSignal.timeout(15000) });
    const j = await r.json();
    if (j.totalFound > 0) console.log("SR", c, j.totalFound, (j.content ?? []).slice(0, 3).map((p) => p.name + " @" + p.location?.city).join(" ; "));
  } catch (e) { /* nada */ }
}
// Workday / otros candidatos conocidos
const wd = [["claro", "https://claro.wd3.myworkdayjobs.com"], ["hanes", "https://hanes.wd1.myworkdayjobs.com"], ["hologic", "https://hologic.wd1.myworkdayjobs.com"]];
for (const [n, b] of wd) { try { const r = await fetch(b, { signal: AbortSignal.timeout(10000) }); console.log("WD", n, r.status); } catch { console.log("WD", n, "x"); } }
// Portales de hoteles: ¿hay JSON-LD de JobPosting en RD?
for (const u of ["https://jobs.hilton.com/us/en/search-results?keywords=Dominican", "https://careers.hyatt.com/", "https://careers.ihg.com/", "https://careers.accor.com/", "https://www.rtjobs.com/", "https://careers.melia.com/", "https://www.iberostar.com/es/trabaja-con-nosotros/", "https://www.barcelo.com/es-es/trabaja-con-nosotros/", "https://jobs.lever.co/", "https://careers.cardinalhealth.com/", "https://careers.teleperformance.com/en/jobs?country=Dominican+Republic"]) {
  try { const r = await fetch(u, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(12000) }); const t = await r.text(); console.log("URL", r.status, u, t.length, /JobPosting/.test(t) ? "JSONLD" : ""); } catch { console.log("URL x", u); }
}

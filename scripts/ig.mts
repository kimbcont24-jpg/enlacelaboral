// Imágenes de Instagram (1080×1350) generadas en GitHub Actions, sin depender de Vercel (15 nov 2026).
// Uso: IDS="id1,id2,..." npx tsx scripts/ig.mts  → carga/ig/<id>.png por vacante + carga/ig/portada-<primer id>.png
// Se sirven por raw.githubusercontent.com. Se borran las de más de 3 días para no llenar el repo.
import { readFileSync, writeFileSync, readdirSync, statSync, unlinkSync, mkdirSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const SB = env.SUPABASE_URL, KEY = env.SUPABASE_PUBLISHABLE_KEY;
const real = globalThis.fetch;
globalThis.fetch = (async (u: string, init?: RequestInit) => {
  const s = String(u);
  if (s.startsWith("http://local/")) return new Response(readFileSync("public" + s.slice(12)));
  return real(u as never, init);
}) as typeof fetch;
const { imagenVacanteIG, imagenPortadaIG } = await import("../src/lib/og.ts");
const ids = String(process.env.IDS ?? "").split(",").map((x) => x.trim()).filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 9);
if (!ids.length) { console.log("sin ids"); process.exit(0); }
const r = await real(`${SB}/rest/v1/vacantes?select=id,titulo,provincia,modalidad,tipo,salario_min,salario_max,etiquetas&id=in.(${ids.join(",")})`, { headers: { apikey: KEY, authorization: `Bearer ${KEY}` } });
const filas = (await r.json()) as { id: string; titulo: string; provincia: string; modalidad: string; tipo: string; salario_min: number | null; salario_max: number | null; etiquetas: string[] | null }[];
const pesos = (n: number) => "RD$" + Math.round(n).toLocaleString("en-US");
const meta = (f: { etiquetas: string[] | null }, k: string) => (f.etiquetas ?? []).find((e) => e.startsWith(`m:${k}:`))?.slice(k.length + 3) ?? "";
const empresa = (f: { etiquetas: string[] | null }) => { const e = meta(f, "empresa").trim(); return !e || /confidencial/i.test(e) ? "Empresa no indicada" : e; };
mkdirSync("carga/ig", { recursive: true });
const orden = ids.map((id) => filas.find((f) => f.id === id)).filter(Boolean) as typeof filas;
for (const f of orden) {
  const min = f.salario_min ?? 0, max = f.salario_max ?? 0;
  const png = await imagenVacanteIG({ titulo: f.titulo, empresa: empresa(f), provincia: f.provincia, modalidad: f.modalidad, tipo: f.tipo, conSalario: min > 0, salario: max > min ? `${pesos(min)} – ${pesos(max)}` : min > 0 ? pesos(min) : "" }, "http://local");
  writeFileSync(`carga/ig/${f.id}.png`, png);
  console.log("ok", f.id, f.titulo);
}
const fecha = new Date(Date.now() - 4 * 3600e3).toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const portada = await imagenPortadaIG(orden.slice(0, 5).map((f) => ({ titulo: f.titulo, empresa: empresa(f), provincia: f.provincia.replace(/^La Altagracia \((.+)\)$/, "$1"), salario: (f.salario_min ?? 0) > 0 ? pesos(f.salario_min!) : "" })), fecha.charAt(0).toUpperCase() + fecha.slice(1), "http://local");
writeFileSync(`carga/ig/portada-${orden[0]!.id}.png`, portada);
console.log("portada", `carga/ig/portada-${orden[0]!.id}.png`);
for (const n of readdirSync("carga/ig")) { const p = `carga/ig/${n}`; if (Date.now() - statSync(p).mtimeMs > 3 * 864e5) unlinkSync(p); }

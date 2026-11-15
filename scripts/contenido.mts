// Feed editorial (no vacantes): genera las láminas de una semana en JPG (15 nov 2026).
// Uso: SEMANA=2026-11-16 npx tsx scripts/contenido.mts → carga/contenido/img/<semana>/<slug>-<n>.png (el workflow las pasa a JPG)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const real = globalThis.fetch;
globalThis.fetch = (async (u: string, init?: RequestInit) => { const s = String(u); return s.startsWith("http://local/") ? new Response(readFileSync("public" + s.slice(12))) : real(u as never, init); }) as typeof fetch;
const { imagenLamina } = await import("../src/lib/feed.ts");
const semana = String(process.env.SEMANA ?? "");
const plan = JSON.parse(readFileSync(`carga/contenido/${semana}.json`, "utf8"));
const dir = `carga/contenido/img/${semana}`;
mkdirSync(dir, { recursive: true });
for (const post of plan.posts) {
  const n = post.laminas.length;
  for (let i = 0; i < n; i++) {
    const png = await imagenLamina(post.laminas[i], post.paleta, n > 1 ? `${i + 1}/${n}` : null, "http://local");
    writeFileSync(`${dir}/${post.slug}-${i + 1}.png`, png);
  }
  console.log("ok", post.dia, post.slug, n);
}

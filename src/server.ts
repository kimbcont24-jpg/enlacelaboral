import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { landingsArea, landingsProvincia, slug } from "./lib/empleos";
import { imagenVacante } from "./lib/og";
import { leerMeta, type VacanteRow } from "./lib/vacantes";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function sitemap(origen: string): Promise<Response> {
  const desde = new Date(Date.now() - 30 * 864e5).toISOString();
  let filas: { id: string; created_at: string; etiquetas: string[] | null }[] = [];
  try {
    const r = await fetch(`${SB_URL}/rest/v1/vacantes?select=id,created_at,etiquetas&estado=eq.publicada&created_at=gte.${encodeURIComponent(desde)}&order=created_at.desc&limit=1000`, { headers: { apikey: SB_KEY } });
    if (r.ok) filas = (await r.json()) as typeof filas;
  } catch {
    filas = [];
  }
  const fijas = ["/", "/vacantes", "/empresas", "/recursos"].map((p) => `<url><loc>${origen}${p}</loc><changefreq>daily</changefreq></url>`);
  const vacantes = filas.map((f) => `<url><loc>${origen}/vacantes/${f.id}</loc><lastmod>${f.created_at.slice(0, 10)}</lastmod></url>`);
  const empresas = new Set<string>();
  for (const f of filas) for (const t of f.etiquetas ?? []) if (t.startsWith("m:empresa:") && t.length > 10) empresas.add(slug(t.slice(10)));
  const landings = [...landingsProvincia, ...landingsArea].map((l) => l.slug).concat([...empresas]).filter(Boolean).map((s) => `<url><loc>${origen}/empleos/${s}</loc><changefreq>daily</changefreq></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...fijas, ...landings, ...vacantes].join("")}</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}

const pesos = (n: number) => `RD$${n.toLocaleString("es-DO")}`;

/** /og/vacantes/<id>.png → imagen de vista previa para redes y WhatsApp. */
async function ogVacante(id: string, origen: string): Promise<Response> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("No encontrada", { status: 404 });
  let fila: VacanteRow | null = null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/vacantes?select=id,titulo,provincia,modalidad,tipo,salario_min,salario_max,requisitos,etiquetas,estado&id=eq.${id}&limit=1`, { headers: { apikey: SB_KEY } });
    if (r.ok) fila = ((await r.json()) as VacanteRow[])[0] ?? null;
  } catch {
    fila = null;
  }
  if (!fila) return new Response("No encontrada", { status: 404 });
  const { meta } = leerMeta(fila.etiquetas);
  const min = fila.salario_min ?? 0, max = fila.salario_max ?? 0;
  try {
    const png = await imagenVacante({
      titulo: fila.titulo, empresa: meta["empresa"] || "Empresa no indicada", provincia: fila.provincia, modalidad: fila.modalidad, tipo: fila.tipo,
      conSalario: min > 0, salario: max > min ? `${pesos(min)} – ${pesos(max)}` : min > 0 ? pesos(min) : "",
    }, origen);
    return new Response(png as BodyInit, { headers: { "content-type": "image/png", "cache-control": "public, max-age=3600, s-maxage=86400" } });
  } catch (e) {
    console.error(e);
    return new Response("Error", { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    if (url.pathname === "/sitemap.xml") return sitemap(url.origin);
    const og = url.pathname.match(/^\/og\/vacantes\/([0-9a-f-]{36})\.png$/i);
    if (og) return ogVacante(og[1]!, url.origin);
    if (url.pathname === "/robots.txt") {
      return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /panel\nDisallow: /auth\n\nSitemap: ${url.origin}/sitemap.xml\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

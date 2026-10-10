import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

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
  let filas: { id: string; created_at: string }[] = [];
  try {
    const r = await fetch(`${SB_URL}/rest/v1/vacantes?select=id,created_at&estado=eq.publicada&created_at=gte.${encodeURIComponent(desde)}&order=created_at.desc&limit=1000`, { headers: { apikey: SB_KEY } });
    if (r.ok) filas = (await r.json()) as typeof filas;
  } catch {
    filas = [];
  }
  const fijas = ["/", "/vacantes", "/empresas", "/recursos"].map((p) => `<url><loc>${origen}${p}</loc><changefreq>daily</changefreq></url>`);
  const vacantes = filas.map((f) => `<url><loc>${origen}/vacantes/${f.id}</loc><lastmod>${f.created_at.slice(0, 10)}</lastmod></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...fijas, ...vacantes].join("")}</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    if (url.pathname === "/sitemap.xml") return sitemap(url.origin);
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

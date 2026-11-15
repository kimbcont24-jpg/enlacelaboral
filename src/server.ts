import "./lib/error-capture";
import { PAGOS_ACTIVOS } from "@/lib/pagos";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { landingsArea, landingsColeccion, landingsProvincia, slug } from "./lib/empleos";
import { imagenArticulo, imagenPortadaIG, imagenVacante, imagenVacanteIG } from "./lib/og";
import { categoria, minutosLectura } from "./lib/blog";
import { empresaDe, leerMeta, SITIO, type VacanteRow } from "./lib/vacantes";

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

/** Direcciones viejas o alternas que deben llevar (301) al dominio oficial, para que Google indexe una sola versión. */
const HOSTS_VIEJOS = new Set(["enlace-rd.vercel.app", "www.enlacelaboralrd.com"]);

async function sitemap(): Promise<Response> {
  const origen = SITIO;
  const hoy = new Date().toISOString().slice(0, 10);
  const desde = new Date(Date.now() - 30 * 864e5).toISOString();
  let filas: { id: string; created_at: string; etiquetas: string[] | null }[] = [];
  try {
    const r = await fetch(`${SB_URL}/rest/v1/vacantes?select=id,created_at,etiquetas&estado=eq.publicada&created_at=gte.${encodeURIComponent(desde)}&order=created_at.desc&limit=1000`, { headers: { apikey: SB_KEY } });
    if (r.ok) filas = (await r.json()) as typeof filas;
  } catch {
    filas = [];
  }
  const fijas = ["/", "/vacantes", "/empresas", "/recursos", "/cv", ...(PAGOS_ACTIVOS ? ["/impulso"] : []), "/herramientas", "/salarios", "/herramientas/salario-neto", "/herramientas/liquidacion", "/herramientas/regalia-pascual", "/herramientas/comparar-ofertas", "/herramientas/brujula", "/herramientas/verificar-oferta", "/insignias", "/empresas-claras", "/jornadas", "/alianzas", "/empleo-para-todos", "/legal", "/seguridad", "/terminos", "/privacidad", "/cookies", ...(PAGOS_ACTIVOS ? ["/reembolsos"] : []), "/nosotros", "/contacto", "/descubrir", "/explorar"].map((p) => `<url><loc>${origen}${p === "/" ? "/" : p}</loc><lastmod>${hoy}</lastmod><changefreq>${p === "/" || p === "/vacantes" ? "hourly" : "weekly"}</changefreq></url>`);
  const vacantes = filas.map((f) => `<url><loc>${origen}/vacantes/${f.id}</loc><lastmod>${f.created_at.slice(0, 10)}</lastmod></url>`);
  let notas: { slug: string; updated_at: string }[] = [];
  try {
    const r = await fetch(`${SB_URL}/rest/v1/blog_articulos?select=slug,updated_at&estado=eq.publicado&order=publicado_at.desc&limit=500`, { headers: { apikey: SB_KEY } });
    if (r.ok) notas = (await r.json()) as typeof notas;
  } catch {
    notas = [];
  }
  const blog = [`<url><loc>${origen}/blog</loc><lastmod>${hoy}</lastmod><changefreq>daily</changefreq></url>`, ...notas.map((n) => `<url><loc>${origen}/blog/${n.slug}</loc><lastmod>${n.updated_at.slice(0, 10)}</lastmod></url>`)];
  const empresas = new Set<string>();
  for (const f of filas) for (const t of f.etiquetas ?? []) if (t.startsWith("m:empresa:") && t.length > 10) empresas.add(slug(t.slice(10)));
  const landings = [...landingsColeccion, ...landingsProvincia, ...landingsArea].map((l) => l.slug).concat([...empresas]).filter(Boolean).map((s) => `<url><loc>${origen}/empleos/${s}</loc><lastmod>${hoy}</lastmod><changefreq>daily</changefreq></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...fijas, ...blog, ...landings, ...vacantes].join("")}</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}

const pesos = (n: number) => `RD$${n.toLocaleString("es-DO")}`;

/** /og/blog/<slug>.png → imagen de vista previa de un artículo del blog. */
async function ogArticulo(slugArt: string, origen: string): Promise<Response> {
  type Nota = { titulo: string; categoria: string; autor: string; contenido: string };
  let fila: Nota | null = null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/blog_articulos?select=titulo,categoria,autor,contenido&slug=eq.${encodeURIComponent(slugArt)}&estado=eq.publicado&limit=1`, { headers: { apikey: SB_KEY } });
    if (r.ok) fila = ((await r.json()) as Nota[])[0] ?? null;
  } catch {
    fila = null;
  }
  if (!fila) return new Response("No encontrado", { status: 404 });
  const c = categoria(fila.categoria);
  try {
    const png = await imagenArticulo({ titulo: fila.titulo, tema: c.t, color: c.color, autor: fila.autor, minutos: minutosLectura(fila.contenido) }, origen);
    return new Response(png as BodyInit, { headers: { "content-type": "image/png", "cache-control": "public, max-age=3600, s-maxage=86400" } });
  } catch (e) {
    console.error(e);
    return new Response("Error", { status: 500 });
  }
}

/** /og/ig/portada.png?ids=a,b,c → primera lámina del carrusel de Instagram con la lista de vacantes del día (máx. 5). */
async function ogPortadaIG(ids: string, origen: string): Promise<Response> {
  const lista = ids.split(",").filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 5);
  if (!lista.length) return new Response("Faltan ids", { status: 400 });
  let filas: VacanteRow[] = [];
  try {
    const r = await fetch(`${SB_URL}/rest/v1/vacantes?select=id,titulo,provincia,modalidad,tipo,salario_min,salario_max,requisitos,etiquetas,estado&id=in.(${lista.join(",")})`, { headers: { apikey: SB_KEY } });
    if (r.ok) filas = (await r.json()) as VacanteRow[];
  } catch { filas = []; }
  const orden = lista.map((id) => filas.find((f) => f.id === id)).filter(Boolean) as VacanteRow[];
  if (!orden.length) return new Response("No encontradas", { status: 404 });
  const fecha = new Date(Date.now() - 4 * 3600e3).toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  try {
    const png = await imagenPortadaIG(orden.map((f) => {
      const { meta } = leerMeta(f.etiquetas); const min = f.salario_min ?? 0;
      return { titulo: f.titulo, empresa: empresaDe(meta["empresa"]), provincia: f.provincia, salario: min > 0 ? pesos(min) : "" };
    }), fecha.charAt(0).toUpperCase() + fecha.slice(1), origen);
    return new Response(png as BodyInit, { headers: { "content-type": "image/png", "cache-control": "public, max-age=3600, s-maxage=86400" } });
  } catch (e) {
    console.error(e);
    return new Response("Error", { status: 500 });
  }
}

/** /og/vacantes/<id>.png → imagen de vista previa para redes y WhatsApp. /og/ig/<id>.png → versión vertical 1080×1350 para Instagram. */
async function ogVacante(id: string, origen: string, ig = false): Promise<Response> {
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
    const png = await (ig ? imagenVacanteIG : imagenVacante)({
      titulo: fila.titulo, empresa: empresaDe(meta["empresa"]), provincia: fila.provincia, modalidad: fila.modalidad, tipo: fila.tipo,
      conSalario: min > 0, salario: max > min ? `${pesos(min)} – ${pesos(max)}` : min > 0 ? pesos(min) : "",
    }, origen);
    return new Response(png as BodyInit, { headers: { "content-type": "image/png", "cache-control": "public, max-age=3600, s-maxage=86400" } });
  } catch (e) {
    console.error(e);
    return new Response("Error", { status: 500 });
  }
}


type PorCompartir = { id: string; titulo: string; empresa: string; provincia: string; modalidad: string; tipo: string; salario_min: number | null; salario_max: number | null; enlace: string };

/** /api/telegram → publica en @enlacelaboral las vacantes pendientes (máx. 5 por vuelta). */
async function telegram(): Promise<Response> {
  const bot = process.env["TELEGRAM_BOT_TOKEN"];
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  if (!bot) return json({ ok: false, error: "falta TELEGRAM_BOT_TOKEN" }, 500);
  const h = { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}`, "content-type": "application/json" };
  const r = await fetch(`${SB_URL}/rest/v1/rpc/redes_pendientes`, { method: "POST", headers: h, body: "{}" });
  if (!r.ok) return json({ ok: false, error: "no se pudo leer vacantes" }, 502);
  const filas = (await r.json()) as PorCompartir[];
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let enviadas = 0;
  const errores: string[] = [];
  for (const v of filas) {
    const sal = v.salario_min ? `RD$${v.salario_min.toLocaleString("es-DO")}${v.salario_max ? " – RD$" + v.salario_max.toLocaleString("es-DO") : ""}` : "";
    const texto = [`<b>${esc(v.titulo)}</b>`, v.empresa ? esc(v.empresa) : "", `📍 ${esc(v.provincia)} · ${esc(v.modalidad)} · ${esc(v.tipo)}`, sal ? `💰 ${sal}` : "", "", `Ver y aplicar: ${v.enlace}`].filter((x, i) => x || i === 4).join("\n");
    const t = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: "@enlacelaboral", text: texto, parse_mode: "HTML" }) });
    if (t.ok) {
      await fetch(`${SB_URL}/rest/v1/rpc/redes_marcar`, { method: "POST", headers: h, body: JSON.stringify({ p_id: v.id }) });
      enviadas++;
    } else {
      errores.push(`${t.status}: ${((await t.json().catch(() => ({}))) as { description?: string }).description ?? ""}`);
      break;
    }
  }
  return json({ ok: errores.length === 0, pendientes: filas.length, enviadas, errores });
}

const limites = new Map<string, number[]>();
const pasaLimite = (clave: string, max: number, ventanaMs: number) => {
  const ahora = Date.now();
  const lista = (limites.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (lista.length >= max) { limites.set(clave, lista); return false; }
  lista.push(ahora); limites.set(clave, lista);
  if (limites.size > 5000) limites.clear();
  return true;
};

/** POST /api/aplicar → manda la aplicación al correo que la empresa puso en su vacante. Solo a ese correo. */
async function aplicar(request: Request): Promise<Response> {
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  let b: { vacante_id?: string; nombre?: string; contacto?: string; mensaje?: string };
  try { b = (await request.json()) as typeof b; } catch { return json({ enviado: false, error: "datos" }, 400); }
  const id = String(b.vacante_id ?? ""), nombre = String(b.nombre ?? "").trim().slice(0, 100), contacto = String(b.contacto ?? "").trim().slice(0, 150), mensaje = String(b.mensaje ?? "").trim().slice(0, 8000);
  if (!/^[0-9a-f-]{36}$/i.test(id) || nombre.length < 2 || contacto.length < 5) return json({ enviado: false, error: "datos" }, 400);
  const ip = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0]!.trim();
  if (!pasaLimite(`ip:${ip}`, 10, 3600e3) || !pasaLimite(`v:${id}:${contacto.toLowerCase()}`, 1, 24 * 3600e3)) return json({ enviado: false, error: "limite" }, 429);

  const clave = process.env["RESEND_API_KEY"], desde = process.env["RESEND_FROM"];
  if (!clave || !desde) return json({ enviado: false, motivo: "sin_proveedor" });

  let fila: VacanteRow | null = null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/vacantes?select=id,titulo,etiquetas,estado&id=eq.${id}&limit=1`, { headers: { apikey: SB_KEY } });
    if (r.ok) fila = ((await r.json()) as VacanteRow[])[0] ?? null;
  } catch { fila = null; }
  if (!fila || fila.estado !== "publicada") return json({ enviado: false, error: "vacante" }, 404);
  const { meta } = leerMeta(fila.etiquetas);
  const correo = (meta["aplicar"] ?? "").match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  if (!correo) return json({ enviado: false, motivo: "sin_correo" });

  const esCorreo = /^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(contacto);
  const cuerpo = [
    `Hola, ${nombre} aplicó a tu vacante «${fila.titulo}» desde Enlace Laboral.`,
    "",
    `Nombre: ${nombre}`,
    `Contacto: ${contacto}`,
    "",
    mensaje || "(Sin mensaje adicional)",
    "",
    "—",
    esCorreo ? "Puedes responder directamente a este correo para contactar al candidato." : "Contacta al candidato con los datos de arriba.",
    `Vacante: ${new URL(request.url).origin}/vacantes/${id}`,
    "Enlace Laboral solo reenvía los datos que la persona escribió.",
  ].join("\n");
  try {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${clave}`, "content-type": "application/json" }, body: JSON.stringify({ from: desde, to: [correo], subject: `Nueva aplicación: ${fila.titulo} — ${nombre}`, text: cuerpo, ...(esCorreo ? { reply_to: contacto } : {}) }) });
    if (!r.ok) { console.error("resend", r.status, await r.text().catch(() => "")); return json({ enviado: false, motivo: "fallo_envio" }); }
  } catch (e) { console.error(e); return json({ enviado: false, motivo: "fallo_envio" }); }
  return json({ enviado: true });
}

const ACCIONES_CRM = new Set(["listar", "motor", "cuenta", "priorizar", "excluir_cuenta", "recalcular", "detalle", "actualizar", "estado", "agregar", "verificar_mx", "config", "plantillas", "guardar_plantilla", "vista_previa", "aliados_listar", "aliado_estado", "aliado_guardar", "aliado_previa", "aliados_config"]);

/** POST /api/crm-empresas → CRM de prospección de empresas. Solo administradoras de Enlace (se verifica la sesión y el rol). */
async function crmEmpresas(request: Request): Promise<Response> {
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  const url = process.env["CRM_EMPRESAS_URL"], key = process.env["CRM_EMPRESAS_KEY"], token = process.env["CRM_EMPRESAS_TOKEN"];
  if (!url || !key || !token) return json({ error: "El CRM no está configurado en el servidor." }, 500);
  const jwt = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Inicia sesión." }, 401);
  const u = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_KEY, authorization: `Bearer ${jwt}` } });
  if (!u.ok) return json({ error: "Sesión vencida. Vuelve a entrar." }, 401);
  const user = (await u.json()) as { id?: string; email?: string };
  if (!user.id) return json({ error: "Sesión no válida." }, 401);
  const roles = await fetch(`${SB_URL}/rest/v1/user_roles?select=role&user_id=eq.${user.id}&role=eq.admin`, { headers: { apikey: SB_KEY, authorization: `Bearer ${jwt}` } });
  const lista = roles.ok ? ((await roles.json()) as unknown[]) : [];
  if (!lista.length) return json({ error: "Solo para administradoras." }, 403);
  let b: { accion?: string; args?: unknown };
  try { b = (await request.json()) as typeof b; } catch { return json({ error: "datos" }, 400); }
  const accion = String(b.accion ?? "");
  if (!ACCIONES_CRM.has(accion)) return json({ error: "acción no permitida" }, 400);
  const r = await fetch(`${url}/rest/v1/rpc/crm_enlace`, {
    method: "POST",
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ p_token: token, p_accion: accion, p_args: b.args ?? {}, p_autor: user.email ?? user.id }),
  });
  const cuerpo = await r.text();
  if (!r.ok) {
    let msg = "No se pudo completar.";
    try { msg = ((JSON.parse(cuerpo) as { message?: string }).message ?? msg); } catch { /* sin detalle */ }
    return json({ error: msg }, r.status === 401 || r.status === 403 ? 502 : 400);
  }
  return new Response(cuerpo, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    if (HOSTS_VIEJOS.has(url.hostname) && !url.pathname.startsWith("/api/") && (request.method === "GET" || request.method === "HEAD")) {
      return new Response(null, { status: 301, headers: { location: `${SITIO}${url.pathname}${url.search}`, "cache-control": "public, max-age=86400" } });
    }
    if (url.pathname === "/api/telegram") return telegram();
    if (url.pathname === "/api/aplicar" && request.method === "POST") return aplicar(request);
    if (url.pathname === "/api/crm-empresas" && request.method === "POST") return crmEmpresas(request);
    if (url.pathname === "/sitemap.xml") return sitemap();
    const og = url.pathname.match(/^\/og\/vacantes\/([0-9a-f-]{36})\.png$/i);
    if (og) return ogVacante(og[1]!, url.origin);
    const ogIG = url.pathname.match(/^\/og\/ig\/([0-9a-f-]{36})\.png$/i);
    if (ogIG) return ogVacante(ogIG[1]!, url.origin, true);
    if (url.pathname === "/og/ig/portada.png") return ogPortadaIG(url.searchParams.get("ids") ?? "", url.origin);
    const ogBlog = url.pathname.match(/^\/og\/blog\/([a-z0-9-]{1,90})\.png$/);
    if (ogBlog) return ogArticulo(ogBlog[1]!, url.origin);
    if (url.pathname === "/robots.txt") {
      return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /panel\nDisallow: /auth\nDisallow: /api/\n\nSitemap: ${SITIO}/sitemap.xml\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
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

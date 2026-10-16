import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";

/**
 * Imagen de vista previa (1200×630) de una vacante, para WhatsApp, Facebook, Instagram y Google.
 * Se genera en el servidor con satori (HTML → SVG) y resvg (SVG → PNG). Las fuentes y el wasm
 * viven en /public/og y se cargan una sola vez por instancia.
 */
type Datos = { titulo: string; empresa: string; provincia: string; modalidad: string; tipo: string; salario: string; conSalario: boolean; requisito?: string };

const NAVY = "#0a2f5c", ROJO = "#1d6ff2", VERDE = "#0f7a43", GRIS = "#5b6678", TINTA = "#14213a";

let fuentes: { name: string; data: ArrayBuffer; weight: 600 | 800; style: "normal" }[] | null = null;
let wasmListo: Promise<void> | null = null;

async function preparar(origen: string) {
  if (!fuentes) {
    const [f600, f800] = await Promise.all([fetch(`${origen}/og/figtree-600.woff`), fetch(`${origen}/og/figtree-800.woff`)]);
    if (!f600.ok || !f800.ok) throw new Error("No se pudieron cargar las fuentes");
    fuentes = [
      { name: "Figtree", data: await f600.arrayBuffer(), weight: 600, style: "normal" },
      { name: "Figtree", data: await f800.arrayBuffer(), weight: 800, style: "normal" },
    ];
  }
  if (!wasmListo) {
    wasmListo = fetch(`${origen}/og/resvg.wasm`).then((r) => { if (!r.ok) throw new Error("No se pudo cargar resvg"); return r.arrayBuffer(); }).then((b) => initWasm(b)).catch((e) => { wasmListo = null; throw e; });
  }
  await wasmListo;
}

const h = (type: string, props: Record<string, unknown>, ...children: unknown[]) => {
  const style = type === "div" && children.length > 0 ? { display: "flex", ...((props["style"] as Record<string, unknown> | undefined) ?? {}) } : props["style"];
  return { type, props: { ...props, style, children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children } };
};

function marca(tam: number) {
  // Dos eslabones; la versión simple (sin trenzado) basta a este tamaño.
  return h("svg", { width: tam, height: tam, viewBox: "0 0 64 64" },
    h("g", { transform: "rotate(-35 32 32)" },
      h("ellipse", { cx: 26, cy: 32, rx: 13, ry: 8, fill: "none", stroke: NAVY, strokeWidth: 5.6 }),
      h("ellipse", { cx: 38, cy: 32, rx: 13, ry: 8, fill: "none", stroke: ROJO, strokeWidth: 5.6 }),
    ),
  );
}

function pill(texto: string) {
  return h("div", { style: { display: "flex", padding: "10px 20px", borderRadius: 999, background: "#e8eef6", color: NAVY, fontSize: 24, fontWeight: 600 } }, texto);
}

function plantilla(d: Datos) {
  const tituloTam = d.titulo.length > 60 ? 48 : d.titulo.length > 40 ? 56 : 66;
  return h("div", { style: { width: 1200, height: 630, display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #ffffff 0%, #eef2f8 100%)", fontFamily: "Figtree", color: TINTA, position: "relative" } },
    h("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "40px 64px 0" } },
      marca(56),
      h("div", { style: { display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: -1 } }, h("span", { style: { color: NAVY } }, "Enlace"), h("span", { style: { color: ROJO, marginLeft: 9 } }, "Laboral")),
    ),
    h("div", { style: { display: "flex", flexDirection: "column", flex: 1, padding: "26px 64px 0" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
        h("div", { style: { width: 8, height: 30, background: ROJO, borderRadius: 4 } }),
        h("div", { style: { fontSize: 20, fontWeight: 800, color: ROJO, letterSpacing: 4 } }, "VACANTE"),
        h("div", { style: { fontSize: 24, fontWeight: 600, color: GRIS, marginLeft: 8 } }, d.empresa),
      ),
      h("div", { style: { display: "flex", marginTop: 18, fontSize: tituloTam, fontWeight: 800, color: NAVY, lineHeight: 1.08, letterSpacing: -1, maxHeight: tituloTam * 2.3, overflow: "hidden" } }, d.titulo),
      h("div", { style: { display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" } }, pill(d.provincia), pill(d.modalidad), pill(d.tipo)),
      h("div", { style: { display: "flex", flexDirection: "column", marginTop: "auto", marginBottom: 24 } },
        h("div", { style: { fontSize: 20, fontWeight: 600, color: GRIS, letterSpacing: 2 } }, d.conSalario ? "SALARIO" : "SALARIO NO PUBLICADO"),
        h("div", { style: { fontSize: d.conSalario ? 44 : 26, fontWeight: d.conSalario ? 800 : 600, color: d.conSalario ? VERDE : GRIS, marginTop: 4 } }, d.conSalario ? d.salario : "Pregunta en la entrevista. Nunca pagues por aplicar."),
      ),
    ),
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 64px", height: 70, background: NAVY, color: "#fff", fontSize: 24, fontWeight: 700 } },
      h("span", {}, "Aplica gratis en enlace-rd.vercel.app"),
      h("span", { style: { color: "#8ec1ff" } }, "Toca para ver la vacante »"),
    ),
  );
}

export async function imagenVacante(d: Datos, origen: string): Promise<Uint8Array> {
  await preparar(origen);
  const svg = await satori(plantilla(d) as never, { width: 1200, height: 630, fonts: fuentes! });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  return png;
}

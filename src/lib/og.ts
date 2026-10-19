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
  // Símbolo persona + maletín (opción 08D); el ancho sale de la proporción 684:538 del dibujo.
  return h("svg", { width: Math.round(tam * 684 / 538), height: tam, viewBox: "170 243 684 538" },
    h("path", { d: "M256.5 400.6C231.5 395.8 210.1 375.8 203.4 351.0C201.1 342.4 201.1 326.6 203.3 318.0C212.9 281.2 249.6 259.6 286.4 269.0C315.7 276.5 336.3 303.3 336.3 334.0C336.3 376.2 297.6 408.5 256.5 400.6Z", fill: NAVY }),
    h("path", { d: "M278.2 664.9C215.1 656.7 169.6 600.7 175.1 537.8C179.2 490.1 211.1 449.9 256.7 435.1C274.0 429.5 273.4 429.5 364.0 429.5C454.4 429.5 453.8 429.5 471.1 435.1C537.6 456.7 570.9 530.5 543.2 594.8C527.9 630.3 492.4 658.2 455.5 663.8C440.1 666.2 440.2 666.2 438.0 664.0C436.1 662.1 436.0 660.7 436.0 630.2C436.0 593.8 435.4 596.2 445.2 594.1C463.8 590.1 478.8 574.2 482.0 554.9C486.1 530.4 469.4 506.5 444.1 500.7C440.6 499.9 437.4 498.6 436.9 497.9C436.4 497.1 436.0 493.1 436.0 489.0C435.9 477.5 431.7 470.3 422.8 466.6C416.7 464.0 341.1 464.3 335.4 466.9C327.1 470.7 323.0 478.3 323.0 490.1C323.0 499.9 323.3 499.7 300.5 500.2C283.7 500.6 280.8 500.9 275.8 502.9C243.6 515.6 234.7 556.8 259.0 581.1C269.9 592.1 278.9 595.0 302.0 595.0C315.4 595.0 319.0 595.3 320.8 596.6C323.0 598.1 323.0 598.2 323.0 630.4C323.0 660.4 322.9 662.8 321.2 664.3C319.6 665.8 316.8 666.0 301.9 665.9C292.3 665.8 281.7 665.4 278.2 664.9Z", fill: NAVY }),
    h("path", { d: "M422.2 775.9C382.5 772.0 350.6 740.9 345.1 700.7C344.5 696.4 344.0 679.6 344.0 663.4C344.0 635.3 344.1 633.9 346.0 632.0C347.9 630.1 349.3 630.0 379.8 630.0C409.1 630.0 411.8 630.1 413.3 631.8C414.7 633.3 415.0 637.7 415.2 664.7C415.5 699.1 415.4 698.2 422.4 703.4C425.1 705.5 425.2 705.5 595.7 705.8C785.7 706.0 770.1 706.6 775.8 699.2L778.5 695.7L778.5 547.6L778.5 399.5L776.1 396.1C774.8 394.3 771.9 391.9 769.6 390.9C765.7 389.1 759.2 389.0 597.0 389.0C434.8 389.0 428.3 389.1 424.4 390.9C419.6 393.1 416.7 396.8 415.1 402.7C414.5 404.9 413.3 407.1 412.4 407.4C411.5 407.7 396.5 408.0 378.9 408.0L347.0 408.0L345.5 405.6C344.1 403.5 344.0 402.0 345.0 395.1C349.2 364.5 367.0 339.7 394.0 327.1C410.3 319.5 409.0 319.7 462.1 319.3L509.8 318.9L510.2 302.2C510.6 288.5 511.1 284.4 512.9 279.6C518.3 264.5 529.4 253.9 544.5 249.3C553.6 246.5 640.4 246.5 649.5 249.3C664.7 253.9 675.7 264.5 681.1 279.6C682.8 284.4 683.3 288.6 683.7 302.2L684.3 318.9L731.9 319.2C778.4 319.6 779.7 319.7 787.0 321.9C817.0 331.2 839.3 354.5 847.3 385.0L849.5 393.5L849.5 547.5C849.5 691.3 849.4 702.0 847.7 708.4C838.9 742.7 815.1 766.5 781.2 774.8C775.1 776.2 757.8 776.4 602.5 776.6C507.9 776.7 426.8 776.4 422.2 775.9ZM625.0 312.5L625.0 306.0L597.0 306.0L569.0 306.0L569.0 312.5L569.0 319.0L597.0 319.0L625.0 319.0L625.0 312.5Z", fill: ROJO }),
    h("path", { d: "M345.6 571.8C344.3 569.9 344.0 565.8 344.0 547.5C344.0 529.2 344.3 525.1 345.6 523.2C347.1 521.0 347.2 521.0 379.4 521.0C409.4 521.0 411.8 521.1 413.3 522.8C416.0 525.7 415.8 569.9 413.2 572.3C411.5 573.8 407.7 574.0 379.2 574.0C347.2 574.0 347.1 574.0 345.6 571.8Z", fill: ROJO }),
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
